#!/usr/bin/env python3
"""Opt-in stdio compatibility for clients rejecting boolean JSON Schemas.

Only outputSchema in tools/list responses changes. Schema true becomes {};
false, defaults, examples, tool inputs/results and all other messages stay intact.
The host and upstream server still negotiate their own protocol revision.
Usage: python3 mcp_schema_bridge.py -- SERVER [ARG ...]
"""
import json
import os
import signal
import subprocess
import sys
import threading

MAPS = ('properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas')
SINGLES = ('items', 'contains', 'additionalProperties', 'unevaluatedProperties',
           'additionalItems', 'unevaluatedItems', 'propertyNames', 'not', 'if', 'then', 'else')
ARRAYS = ('allOf', 'anyOf', 'oneOf', 'prefixItems')
LIMIT = 16 * 1024 * 1024


def normalize(schema):
    if schema is True:
        return {}
    if not isinstance(schema, dict):
        return schema
    out = dict(schema)
    for key in MAPS:
        if isinstance(out.get(key), dict):
            out[key] = {name: normalize(value) for name, value in out[key].items()}
    for key in SINGLES:
        if key in out:
            value = out[key]
            out[key] = [normalize(x) for x in value] if key == 'items' and isinstance(value, list) else normalize(value)
    for key in ARRAYS:
        if isinstance(out.get(key), list):
            out[key] = [normalize(x) for x in out[key]]
    return out


class Bridge:
    def __init__(self):
        self.pending = set()
        self.lock = threading.Lock()

    def request(self, line):
        try:
            data = json.loads(line)
            if isinstance(data, dict) and data.get('method') == 'tools/list' and 'id' in data:
                with self.lock:
                    self.pending.add(json.dumps(data['id']))
        except (ValueError, TypeError):
            pass
        return line

    def response(self, line):
        try:
            data = json.loads(line)
            if not isinstance(data, dict) or 'id' not in data or ('result' not in data and 'error' not in data):
                return line
            key = json.dumps(data['id'])
            with self.lock:
                if key not in self.pending:
                    return line
                self.pending.remove(key)
            result = data.get('result')
            if isinstance(result, dict) and isinstance(result.get('tools'), list):
                changed = False
                for tool in result['tools']:
                    if isinstance(tool, dict) and 'outputSchema' in tool:
                        before = tool['outputSchema']
                        after = normalize(before)
                        if before != after:
                            tool['outputSchema'] = after
                            changed = True
                if changed:
                    return (json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
        except (ValueError, TypeError):
            pass
        return line


def main(argv):
    if not argv or argv[0] != '--' or len(argv) < 2:
        print('usage: mcp_schema_bridge.py -- SERVER [ARG ...]', file=sys.stderr)
        return 2
    child = subprocess.Popen(argv[1:], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             start_new_session=True)
    bridge = Bridge()
    failed = threading.Event()

    def stop():
        if child.poll() is not None:
            return
        try:
            os.killpg(child.pid, signal.SIGTERM)
        except ProcessLookupError:
            return
        try:
            child.wait(timeout=2)
        except subprocess.TimeoutExpired:
            os.killpg(child.pid, signal.SIGKILL)
            child.wait()

    def on_signal(signum, frame):
        stop()
        raise SystemExit(128 + signum)

    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, on_signal)

    def forward_input():
        try:
            while True:
                line = sys.stdin.buffer.readline(LIMIT + 1)
                if not line:
                    break
                if len(line) > LIMIT:
                    failed.set()
                    break
                child.stdin.write(bridge.request(line))
                child.stdin.flush()
        except (BrokenPipeError, OSError):
            pass
        finally:
            child.stdin.close()
            try:
                child.wait(timeout=2)
            except subprocess.TimeoutExpired:
                stop()

    threading.Thread(target=forward_input, daemon=True).start()
    try:
        while True:
            line = child.stdout.readline(LIMIT + 1)
            if not line:
                break
            if len(line) > LIMIT:
                failed.set()
                break
            sys.stdout.buffer.write(bridge.response(line))
            sys.stdout.buffer.flush()
    finally:
        try:
            child.wait(timeout=2)
        except subprocess.TimeoutExpired:
            stop()
    return 1 if failed.is_set() else (128 - child.returncode if child.returncode < 0 else child.returncode)


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))

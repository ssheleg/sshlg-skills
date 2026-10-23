"""Native stdio bridge regression tests; no external service or credential."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/host-compat/mcp_schema_bridge.py'
spec = importlib.util.spec_from_file_location('bridge', SCRIPT)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class SchemaBridgeTests(unittest.TestCase):
    def test_schema_positions_only(self):
        before = {'properties': {'result': True, 'blocked': False}, '$defs': {'x': {'items': True}},
                  'default': True, 'const': True, 'examples': [True], 'enum': [True, False]}
        after = m.normalize(before)
        self.assertEqual(after['properties'], {'result': {}, 'blocked': False})
        self.assertEqual(after['$defs']['x']['items'], {})
        for key in ['default', 'const', 'examples', 'enum']:
            self.assertEqual(before[key], after[key])
        self.assertIs(before['properties']['result'], True)
        self.assertEqual(m.normalize(after), after)

    def test_only_correlated_tools_list(self):
        b = m.Bridge()
        message = {'jsonrpc': '2.0', 'id': 'list', 'result': {'tools': [
            {'name': 'a', 'inputSchema': {'default': True}, 'outputSchema': {'properties': {'result': True}}}],
            'nextCursor': 'page2'}}
        line = (json.dumps(message) + '\n').encode()
        self.assertEqual(b.response(line), line)
        b.request(b'{"jsonrpc":"2.0","id":"list","method":"tools/list"}\n')
        after = json.loads(b.response(line))
        self.assertEqual(after['result']['tools'][0]['outputSchema']['properties']['result'], {})
        self.assertEqual(after['result']['tools'][0]['inputSchema'], {'default': True})
        self.assertEqual(after['result']['nextCursor'], 'page2')
        self.assertEqual(b.response(line), line)

    def test_errors_notifications_and_numeric_ids(self):
        b = m.Bridge()
        b.request(b'{"id":1,"method":"tools/list"}\n')
        notice = b'{"method":"notifications/tools/list_changed"}\n'
        error = b'{"id":1,"error":{"code":-1,"message":"failed"}}\n'
        self.assertEqual(b.response(notice), notice)
        self.assertEqual(b.response(error), error)
        self.assertFalse(b.pending)
        self.assertEqual(b.response(b'not-json\n'), b'not-json\n')

    def test_stdio_native_process(self):
        server = ('import sys,json\nfor line in sys.stdin:\n'
                  ' d=json.loads(line); print(json.dumps({"id":d["id"],"result":{"tools":'
                  '[{"name":"example","outputSchema":{"properties":{"result":True}},'
                  '"inputSchema":{"type":"object"}}]}}),flush=True)\n')
        p = subprocess.Popen([sys.executable, str(SCRIPT), '--', sys.executable, '-u', '-c', server],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = p.communicate(b'{"id":1,"method":"tools/list"}\n', timeout=5)
        self.assertEqual(p.returncode, 0, stderr)
        d = json.loads(stdout)
        self.assertEqual(d['result']['tools'][0]['outputSchema']['properties']['result'], {})

    def test_upstream_failure_preserved(self):
        r = subprocess.run([sys.executable, str(SCRIPT), '--', sys.executable, '-c', 'raise SystemExit(7)'], input=b'', capture_output=True, timeout=5)
        self.assertEqual(r.returncode, 7)
        self.assertEqual(r.stdout, b'')


if __name__ == '__main__':
    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(SchemaBridgeTests))
    if result.wasSuccessful():
        print(f'OK ({result.testsRun} checks)')
    raise SystemExit(0 if result.wasSuccessful() else 1)

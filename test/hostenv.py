"""B-350: the Python side of test/tmproot.js isolate().

Every Python suite `npm test` runs removes the host variables from its own process at
load, so a suite run directly (`python3 test/<suite>.py`) cannot reach an operator's
instruction file through an inherited CLAUDE_CONFIG_DIR or its siblings. The list is read
from test/tmproot.js, its one home, never copied here.
"""
import os
import re

_TMPROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tmproot.js")


def host_env():
    """The HOST_ENV names, parsed from test/tmproot.js."""
    with open(_TMPROOT, encoding="utf-8") as fh:
        src = fh.read()
    m = re.search(r"const HOST_ENV = \[([^\]]*)\]", src)
    if not m:
        raise RuntimeError("test/tmproot.js carries no HOST_ENV list")
    names = re.findall(r"'([A-Z][A-Z0-9_]*)'", m.group(1))
    if not names:
        raise RuntimeError("test/tmproot.js HOST_ENV is empty")
    return names


def isolate():
    """Remove every HOST_ENV variable from os.environ; returns the names removed."""
    removed = [k for k in host_env() if k in os.environ]
    for k in removed:
        del os.environ[k]
    return removed

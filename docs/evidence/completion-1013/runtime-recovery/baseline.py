#!/usr/bin/env python3
"""Replay real dead-writer identity on the old and current source, owned temps only."""
import json
import pathlib
import shutil
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[4]
OLD = "56ca9ea41e40efa0b2b6240411711c480f091e8e"
results = {}
with tempfile.TemporaryDirectory(prefix="b190-baseline-") as tmp:
    base = pathlib.Path(tmp).resolve()
    old = base / "old-runtime.js"
    old.write_bytes(subprocess.check_output(["git", "show", OLD + ":lib/runtime.js"], cwd=ROOT))
    for name, module in [("accepted_before", old), ("candidate", ROOT / "lib/runtime.js")]:
        root, pkg = base / name, base / (name + "-pkg")
        for rel in ["hooks/a.js", "lib/b.js", "skills.json", "package.json"]:
            for parent, value in [(root, "old"), (pkg, "new")]:
                file = parent / rel
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(value)
        js = "const fs=require('fs'),rename=fs.renameSync;fs.renameSync=function(a,b){const r=rename.apply(this,arguments);if(a.includes('.staging-'))process.kill(process.pid,'SIGKILL');return r};require(%s).sync(%s,%s)" % tuple(map(json.dumps, [str(module), str(pkg), str(root)]))
        child = subprocess.run(["node", "-e", js], capture_output=True, timeout=10)
        view = subprocess.run(["node", "-e", "console.log(JSON.stringify(require(%s).inspect(%s)))" % tuple(map(json.dumps, [str(ROOT / "lib/runtime-recovery.js"), str(root)]))], capture_output=True, timeout=10, text=True)
        assert child.returncode == -9, child
        assert view.returncode == 0, view.stderr
        results[name] = {"writer_exit": child.returncode, "state": json.loads(view.stdout)["state"]}
    assert results["accepted_before"]["state"] == "UNKNOWN"
    assert results["candidate"]["state"] == "DEAD"
assert not base.exists()
print(json.dumps({"old_source": OLD, "observations": results, "owned_temporary_removed": True}, indent=2))

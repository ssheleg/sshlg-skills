"""Read installed runtime bytes against the exact released Git source."""
import hashlib
import json
import subprocess
from pathlib import Path

repo = Path(__file__).resolve().parents[3]
source = "d8fae7c45f1f18d7cec511231ad2688f840872e7"
runtime = Path.home() / ".sshlg-skills/runtime"
def git(*args):
    return subprocess.check_output(["git", "-C", str(repo), *args])
paths = git("ls-tree", "-r", "--name-only", source, "hooks", "lib").decode().splitlines()
paths = sorted(p for p in paths if p.endswith(".js")) + ["skills.json", "package.json"]
rows = []
for rel in paths:
    expected = git("show", source + ":" + rel)
    installed = (runtime / rel).read_bytes()
    rows.append({"file": rel, "sha256": hashlib.sha256(installed).hexdigest(), "matches": installed == expected})
result = {"as_of": "2026-10-09", "version": "1.54.5", "source_commit": source, "files": len(rows), "checks": rows}
Path(__file__).with_name("runtime-readback.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps({"files": len(rows), "mismatches": sum(not row["matches"] for row in rows)}))
assert all(row["matches"] for row in rows)

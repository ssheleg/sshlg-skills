#!/usr/bin/env python3
"""Structural validator for the sshlg-skills umbrella repo. Exit 0 = pass."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []


def fail(m):
    errors.append(m)


def load_json(rel):
    p = os.path.join(ROOT, rel)
    if not os.path.isfile(p):
        fail(f"missing file: {rel}")
        return None
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        fail(f"invalid JSON in {rel}: {e}")
        return None



def check_changelog_headings():
    """A version documented twice truncates the release notes.

    The release workflow extracts the FIRST matching section and stops. Two
    entries under one version means the second release ships the first one's
    notes -- which just happened here when two sessions both wrote v0.21.2.
    super-ux has carried this check since its own duplicate; this repo had
    not, and the gap is what let the collision through silently.
    """
    path = os.path.join(ROOT, "CHANGELOG.md")
    if not os.path.isfile(path):
        fail("missing file: CHANGELOG.md")
        return
    with open(path, encoding="utf-8") as f:
        headings = re.findall(r"^## \[?v?(\d+\.\d+\.\d+)\]?", f.read(), re.M)
    if not headings:
        fail("CHANGELOG.md: no release heading")
    for version in sorted({v for v in headings if headings.count(v) > 1}):
        fail(f"CHANGELOG.md: v{version} is documented twice -- the release "
             f"workflow reads the first section and would ship the wrong notes")


check_changelog_headings()

def check_npm_payload():
    """Every path bin/ requires must be inside the published tarball.

    `npm publish` ships only package.json files[]. A directory the CLI reads
    that is not listed exists in the repo, passes every local test, and then
    dies with MODULE_NOT_FOUND for every npx user -- which is exactly how
    v0.22.0 shipped a `routers` command that could not load its own library.

    Derived from the source rather than a hand-kept list, because a hand-kept
    list is the thing that was already wrong.
    """
    bin_path = os.path.join(ROOT, "bin", "sshlg-skills.js")
    if not os.path.isfile(bin_path):
        return
    with open(bin_path, encoding="utf-8") as f:
        src = f.read()
    pkg_local = None
    try:
        with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as f:
            pkg_local = json.load(f)
    except Exception:
        return
    shipped = [p.strip("/") for p in (pkg_local.get("files") or [])]
    for rel in sorted(set(re.findall(r"require\('\.\./([\w./-]+)'\)", src))):
        top = rel.split("/")[0]
        if top not in shipped:
            fail(f"bin/ requires '../{rel}' but package.json files[] does not "
                 f"ship '{top}/' -- npx users get MODULE_NOT_FOUND")


check_npm_payload()

pkg = load_json("package.json")
manifest = load_json("skills.json")

# package.json: version, bin resolves, files whitelist ships bin + skills.json
pkg_ver = None
if pkg:
    pkg_ver = pkg.get("version")
    if not pkg_ver:
        fail("package.json: missing version")
    bin_map = pkg.get("bin") or {}
    if not bin_map:
        fail("package.json: missing bin entry")
    for bin_name, bin_rel in bin_map.items():
        if not os.path.isfile(os.path.join(ROOT, bin_rel)):
            fail(f"package.json bin {bin_name!r} -> missing file {bin_rel!r}")
    for req in ("bin", "skills.json"):
        if req not in (pkg.get("files") or []):
            fail(f"package.json: files[] must whitelist {req!r}")

# CHANGELOG top entry version must match package.json
chg = os.path.join(ROOT, "CHANGELOG.md")
if not os.path.isfile(chg):
    fail("missing root file: CHANGELOG.md")
else:
    txt = open(chg, encoding="utf-8").read()
    vm = re.search(r"^##\s*v(\d+\.\d+\.\d+)", txt, re.M)
    if not vm:
        fail("CHANGELOG.md: no '## vX.Y.Z' entry")
    elif pkg_ver and vm.group(1) != pkg_ver:
        fail(f"version mismatch: CHANGELOG=v{vm.group(1)} package.json={pkg_ver!r}")

# .gitmodules <-> skills.json <-> on-disk dirs must agree
gm_paths = set()
gm = os.path.join(ROOT, ".gitmodules")
if not os.path.isfile(gm):
    fail("missing .gitmodules (submodules)")
else:
    gm_paths = set(re.findall(r"^\s*path\s*=\s*(.+)$", open(gm, encoding="utf-8").read(), re.M))
    if not gm_paths:
        fail(".gitmodules: no submodule paths")

    # Every submodule url must be HTTPS. An SSH url (git@github.com:...) works
    # forever on the machine that added it and fails with exit 128 everywhere
    # else -- CI, a fresh clone, and `npx github:<repo>`, which is exactly what
    # the release smoke test runs. `gh repo create --source .` sets an SSH
    # remote and `git submodule add` inherits it, so this is the DEFAULT
    # mistake, not an exotic one. It shipped once, in v0.27.0.
    for _ln, _line in enumerate(open(gm, encoding="utf-8").read().splitlines(), 1):
        _m = re.match(r"\s*url\s*=\s*(\S+)", _line)
        if _m and not _m.group(1).startswith("https://"):
            fail(f".gitmodules:{_ln}: submodule url {_m.group(1)!r} is not HTTPS -- "
                 "it fails for every clone without an SSH key, CI included")

skills = (manifest or {}).get("skills") or []
if not skills:
    fail("skills.json: skills[] empty")
seen = set()
for s in skills:
    for key in ("name", "repo", "dir", "pluginMarketplace", "pluginInstall", "desc"):
        if not s.get(key):
            fail(f"skills.json: entry {s.get('name', '?')!r} missing {key}")
    name = s.get("name")
    if name in seen:
        fail(f"skills.json: duplicate skill {name!r}")
    seen.add(name)
    d = s.get("dir", "")
    if d and d not in gm_paths:
        fail(f"skills.json: {name!r} dir {d!r} is not a submodule in .gitmodules")
    if d and not os.path.isdir(os.path.join(ROOT, d)):
        fail(f"skills.json: {name!r} submodule dir {d!r} missing on disk")
    pin = s.get("pluginInstall", "")
    if pin and "@" not in pin:
        fail(f"skills.json: {name!r} pluginInstall {pin!r} must be '<plugin>@<marketplace>'")
    # skillNames = the ids the skills CLI actually installs (a repo may ship several
    # under different names, e.g. super-ux -> ux-foundation/ux-flows/...). `skills
    # update` matches these, NOT the repo name — missing/empty means broken updates.
    sn = s.get("skillNames")
    if not (isinstance(sn, list) and sn and all(isinstance(x, str) and x.strip() for x in sn)):
        fail(f"skills.json: {name!r} skillNames must be a non-empty list of installed skill ids")
    else:
        skdir = os.path.join(ROOT, s.get("dir", ""), "plugins", name, "skills")
        if not os.path.isdir(skdir):
            # Without a materialized submodule the cross-check is toothless — say so
            # loudly instead of silently passing (CI must check out submodules).
            fail(f"skills.json: {name!r} submodule not materialized at {s.get('dir')!r} — "
                 f"cannot verify skillNames (clone with --recursive / CI submodules: recursive)")
        else:
            shipped = {d for d in os.listdir(skdir) if os.path.isdir(os.path.join(skdir, d)) and d != "references"}
            missing = [x for x in sn if x not in shipped]
            if missing:
                fail(f"skills.json: {name!r} skillNames {missing} not shipped by the repo (has: {sorted(shipped)})")

    # The pin IS the promise: a checkout of this hub commit must install exactly
    # the version skills.json advertises. Comparing only against .gitmodules is
    # toothless -- the gitlink can point at any commit of the right repo, so read
    # the version out of the submodule itself.
    declared = s.get("version")
    sub_pkg = os.path.join(ROOT, s.get("dir", ""), "package.json")
    if not declared:
        fail(f"skills.json: {name!r} has no pinned version")
    elif not os.path.isfile(sub_pkg):
        fail(f"skills.json: {name!r} submodule not materialized — cannot verify the {declared} pin")
    else:
        with open(sub_pkg, encoding="utf-8") as fh:
            actual = json.load(fh).get("version")
        if actual != declared:
            fail(f"skills.json: {name!r} pinned at {declared} but the submodule contains {actual} "
                 f"(checkout the right tag in {s.get('dir')!r})")

# every submodule path in .gitmodules should be described in skills.json
described = {s.get("dir") for s in skills}
for p in gm_paths:
    if p not in described:
        fail(f".gitmodules path {p!r} has no skills.json entry")

if not manifest or not (manifest.get("defaultAgents") or []):
    fail("skills.json: defaultAgents[] empty")

for r in ("README.md", "LICENSE"):
    if not os.path.isfile(os.path.join(ROOT, r)):
        fail(f"missing root file: {r}")

# The README family table is the hub's shop window and nothing was checking it,
# so it drifted twice: every row carried a version the manifest had moved past
# (up to a minor behind), and agent-sync's link still pointed at the repo's
# previous owner weeks after the move. Both are invisible to the submodules'
# own validators -- this table lives only here. Each skill's row must carry the
# repo URL and the version skills.json declares.
readme_file = os.path.join(ROOT, "README.md")
if os.path.isfile(readme_file):
    with open(readme_file, encoding="utf-8") as fh:
        readme_rows = [ln for ln in fh.read().split("\n") if ln.startswith("| **[")]
    for s in skills:
        name, repo, declared = s.get("name"), s.get("repo"), s.get("version")
        if not (name and repo and declared):
            continue  # already reported above
        row = next((ln for ln in readme_rows if ln.startswith(f"| **[{name}]")), None)
        if row is None:
            fail(f"README.md: no family-table row for {name!r}")
            continue
        if f"https://github.com/{repo}" not in row:
            fail(f"README.md: {name!r} row does not link to https://github.com/{repo} "
                 f"(stale after a repository move?)")
        if f"| {declared} |" not in row:
            fail(f"README.md: {name!r} row does not carry the pinned version {declared} "
                 f"(skills.json and the table disagree)")

# --- one entry point for the tests, and CI must use it ---------------------
#
# The suites are discovered by test/run.js, so nothing lists them. What still
# needs guarding is the entry point itself: a `npm test` that does not exist
# means the local command and the CI command are different commands, and a
# suite green in one can be absent from the other. That drift is exactly what
# this repository has already been bitten by twice, in the pins and the README.
pkg = load_json("package.json")
if not (pkg.get("scripts") or {}).get("test"):
    fail('package.json: no "scripts.test" — `npm test` is the entry point CI is '
         "required to use, and without it there is nothing to require")

workflow = os.path.join(ROOT, ".github", "workflows", "validate.yml")
if os.path.isfile(workflow):
    with open(workflow, encoding="utf-8") as fh:
        wf_lines = fh.read().split("\n")
    # A STEP that runs it, not the substring anywhere in the file. The
    # negative self-tests below also mention `npm test`, so a substring search
    # stays satisfied after the real step is deleted — proven by planting
    # exactly that and watching this check pass.
    if not any(ln.strip() == "run: npm test" for ln in wf_lines):
        fail(".github/workflows/validate.yml: no step whose command is `npm test` — CI "
             "and the local entry point would drift, and a new suite would be green in "
             "one place and unrun in the other")

if errors:
    print("FAIL: sshlg-skills structure invalid")
    for e in errors:
        print(" - " + e)
    sys.exit(1)
print(f"PASS: sshlg-skills structure valid ({len(skills)} skills, {len(gm_paths)} submodules)")

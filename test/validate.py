#!/usr/bin/env python3
"""Structural validator for the sshlg-skills umbrella repo. Exit 0 = pass."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []
_skips = []


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


def check_update_refreshes_runtime():
    """`update` must refresh the wired runtime, and only a check can hold that.

    `test/runtime_test.js` proves `lib/runtime.js` copies the right files. It cannot
    prove anybody CALLS it: delete the call from `cmdUpdate` and every fixture stays
    green while the defect returns whole. That is precisely how B-22 survived five
    releases — the copy lived in a closure inside `cmdHooks`, `update` never reached it,
    and a machine that only ran `update` executed hook code from whichever release last
    ran `hooks install`. Found at stage 8 of the 2026-08-13 run by listing a directory,
    not by any gate.

    Scoped to the body of `cmdUpdate` on purpose: a repo-wide grep would be satisfied
    by the `cmdHooks` call that was always there.
    """
    bin_path = os.path.join(ROOT, "bin", "sshlg-skills.js")
    if not os.path.isfile(bin_path):
        return
    with open(bin_path, encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"\nfunction cmdUpdate\(.*?\n\}\n", src, re.S)
    if not m:
        fail("bin/sshlg-skills.js: cmdUpdate() not found — this guard cannot find its "
             "subject, and a guard with no subject passes everything")
        return
    body = m.group(0)
    if "runtime.js" not in body:
        fail("bin/sshlg-skills.js: cmdUpdate() does not refresh the wired hook runtime "
             "(no reference to lib/runtime.js in its body). The settings point at "
             "~/.sshlg-skills/runtime, so a release whose hooks changed reaches nobody "
             "who only runs `update` — B-22, which took five releases and a stage-8 "
             "directory listing to notice")
    elif "create: false" not in body and "create:false" not in body:
        fail("bin/sshlg-skills.js: cmdUpdate() refreshes the runtime without "
             "`create: false` — an update that CREATES a runtime installs hooks on a "
             "machine that never consented to them, which is the opposite failure")


check_update_refreshes_runtime()


def check_workflows_parse():
    """Every workflow file must be readable by the thing that runs it.

    `npm test` was green on a `validate.yml` GitHub could not parse: an inserted line
    carried one space of indentation instead of twelve, the run died with *this run
    likely failed because of a workflow file issue*, and the local suite had no opinion.
    Twice in one session a mechanical edit produced YAML only the remote could reject.

    A hand-rolled indentation check was tried first and **passed the planted defect** —
    it only examined the first line of each block scalar, and the damage was mid-block.
    Re-implementing YAML to avoid a dependency is how that becomes a third bug, so this
    uses a real parser and SAYS SO WHEN IT CANNOT: a check that goes quiet on missing
    input is the shape this repository refuses (standing instruction #1).
    """
    import glob
    try:
        import yaml
    except ImportError:
        _skips.append("workflow YAML parse — pyyaml not installed here; CI installs it")
        return
    for wf in sorted(glob.glob(os.path.join(ROOT, ".github/workflows/*.yml"))):
        rel = os.path.relpath(wf, ROOT)
        try:
            doc = yaml.safe_load(open(wf, encoding="utf-8"))
        except yaml.YAMLError as exc:
            where = getattr(exc, "problem_mark", None)
            at = f":{where.line + 1}" if where else ""
            fail(f"{rel}{at}: does not parse as YAML — GitHub reports this as 'this run "
                 f"likely failed because of a workflow file issue' and runs nothing "
                 f"({getattr(exc, 'problem', exc)})")
            continue
        if not isinstance(doc, dict) or not doc.get("jobs"):
            fail(f"{rel}: parses but declares no jobs — a workflow that runs nothing is "
                 f"indistinguishable from a passing one")


check_workflows_parse()


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
            # And the other direction, which used to be silent. `install` and
            # `update` both resolve what to fetch from skillNames, so a skill a
            # member ships without declaring reaches no channel and no agent,
            # indefinitely -- while every gate stays green because nothing was
            # missing, only unclaimed. agent-stack shipped `agent-evals` in
            # v0.6.0 and an audit found it, not this check.
            undeclared = sorted(x for x in shipped if x not in sn)
            if undeclared:
                fail(f"skills.json: {name!r} ships {undeclared} but does not declare them — "
                     f"install and update resolve from skillNames, so they reach nothing")

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

    # The npm name is DECLARED, never derived, and must match what the member
    # actually publishes as.
    #
    # `check_pins.py` tries this field, then the member name, then the repo
    # basename -- and a name that resolves but is not ours is rejected on its
    # `repository` field. With the field unset, that guessing found only two of
    # eight members: six publish as `@ssheleg/<name>` and `task-pipeline`
    # publishes as `task-pipeline-skill`, while the bare `task-pipeline` on npm
    # belongs to someone else entirely. So the npm half of the pin check -- the
    # half that exists to notice a catalogue lagging what was published -- was
    # inert for six members and reported them as "not on npm". Git tags happened
    # to agree, so nothing ever went red.
    #
    # Deriving `@ssheleg/<name>` instead would pass today and break on the two
    # members that already publish under a third shape. Declared and cross-checked
    # is the only version of this that cannot rot.
    npm_declared = s.get("npm")
    if os.path.isfile(sub_pkg):
        with open(sub_pkg, encoding="utf-8") as fh:
            npm_actual = json.load(fh).get("name")
        if npm_actual and not npm_declared:
            fail(f"skills.json: {name!r} has no 'npm' but the submodule publishes as "
                 f"{npm_actual!r} -- check_pins would guess, miss, and report it unpublished")
        elif npm_declared and npm_declared != npm_actual:
            fail(f"skills.json: {name!r} declares npm {npm_declared!r} but the submodule's "
                 f"package.json says {npm_actual!r} -- the pin check would query the wrong package")

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


def check_release_gates_on_validate():
    """A release must not publish over a red `validate`.

    On 2026-08-12 `sheleg-dev` tagged v0.4.1 while its own `validate` run for that exact
    tag FAILED, and npm served 0.4.1 four minutes later. The two are separate workflows,
    so nothing connected them: the release ran the structural validator and never the
    negative self-tests, which are steps in `validate.yml`. Six of the family's nine
    repositories were in that state.

    The fix is a `workflow_call` — the release calls the real suite rather than a copy of
    it — and this guard keeps the call there. A dependency nobody checks is a dependency
    somebody removes.
    """
    _wf = os.path.join(ROOT, ".github/workflows")
    _rel, _val = os.path.join(_wf, "release.yml"), os.path.join(_wf, "validate.yml")
    if not (os.path.isfile(_rel) and os.path.isfile(_val)):
        return
    _v = open(_val, encoding="utf-8").read()
    _r = open(_rel, encoding="utf-8").read()
    if not re.search(r"^\s*workflow_call:\s*$", _v, re.M):
        fail(".github/workflows/validate.yml: no `workflow_call:` trigger — the release "
               "workflow cannot run this suite, so a publish goes out over whatever subset "
               "it runs itself")
    if not re.search(r"^\s*uses:\s*\./\.github/workflows/validate\.yml\s*$", _r, re.M):
        fail(".github/workflows/release.yml: does not call ./.github/workflows/validate.yml "
               "— a red validate would not stop a publish, which is how v0.4.1 of a sibling "
               "reached npm with its own suite failing")
    if not re.search(r"^\s*needs:\s*(?:\[[^\]]*\bvalidate\b[^\]]*\]|validate)\s*$", _r, re.M):
        fail(".github/workflows/release.yml: no job declares `needs: validate` — calling "
               "the suite without depending on it lets the release run beside it rather than "
               "after it, which looks gated and is not")


check_release_gates_on_validate()

if errors:
    print("FAIL: sshlg-skills structure invalid")
    for e in errors:
        print(" - " + e)
    sys.exit(1)
print(f"PASS: sshlg-skills structure valid ({len(skills)} skills, {len(gm_paths)} submodules)")
# A check that could not run is not a check that passed. Printed after the verdict so it
# reads as a disclosure rather than a failure, and never as a target.
for _s in _skips:
    print(f"  unlooked: {_s}")

#!/usr/bin/env python3
"""Structural validator for the sshlg-skills umbrella repo. Exit 0 = pass."""
import glob, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pin_source

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


def check_pipeline_matches_its_schema():
    """This repository's own flow must satisfy the contract its own family ships.

    Measured 2026-08-13 while arming a loop over it: `pipeline.json` here was a skeleton —
    every one of its eleven stages was `{id, state, name, gate:{type}}` with **no
    `gate.check` at all**, `run.loop` carried no `mode`, and `version` held the
    task-pipeline RELEASE (`"1.50.0"`) where the schema wants the config-format version.
    Twenty-four violations, and nothing checked. The consequence, stated plainly: the
    2026-08-13 artifact-root run passed eleven gates whose criteria did not exist in the
    config — the agent supplied them from doctrine, which is better than nothing and is
    not what the config is for.

    `jsonschema` is not a dependency of this suite, so its absence is DISCLOSED rather
    than passed over: a check that goes quiet on missing input is the shape this
    repository refuses (standing instruction #1).
    """
    cfg_p = os.path.join(ROOT, "pipeline.json")
    schema_p = os.path.join(
        ROOT, "skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/pipeline.schema.json")
    if not os.path.isfile(cfg_p):
        fail("pipeline.json: absent — this repository runs its own pipeline and the flow "
             "it declares is where its gate criteria live")
        return
    if not os.path.isfile(schema_p):
        _skips.append("pipeline.json vs schema — the task-pipeline submodule is not checked out")
        return
    try:
        import jsonschema
    except ImportError:
        _skips.append("pipeline.json vs schema — jsonschema not installed here; CI installs it")
        return
    cfg = json.load(open(cfg_p, encoding="utf-8"))
    schema = json.load(open(schema_p, encoding="utf-8"))
    errs = sorted(jsonschema.Draft7Validator(schema).iter_errors(cfg),
                  key=lambda e: list(e.path))
    for e in errs[:8]:
        where = "/".join(str(x) for x in e.path) or "(root)"
        fail(f"pipeline.json:{where}: {e.message[:160]} — the flow this repository runs "
             f"does not satisfy the schema its own family ships")
    if len(errs) > 8:
        fail(f"pipeline.json: {len(errs) - 8} further schema violation(s) not listed")
    # A stage may satisfy the schema and still carry an empty promise.
    for st in cfg.get("stages", []):
        chk = (st.get("gate") or {}).get("check") or ""
        if len(chk.strip()) < 40:
            fail(f"pipeline.json: stage {st.get('id')} ({st.get('name')}) has a gate with no "
                 f"real criterion — a gate whose check is blank or a placeholder passes by "
                 f"being unreadable, which is how eleven of them went unnoticed")


check_pipeline_matches_its_schema()


def check_stage_coverage_is_wired():
    """Stage 10 must be able to refuse a run that skipped a stage it declared.

    On 2026-08-13 a run closed at acceptance with `0,1,2,5,6,7,8,9,10` recorded and 3
    (spec) and 4 (plan) never stamped. Detection already existed — the status line
    printed `3· 4·` and 73%, correctly — and nothing refused on it, which is the whole
    distance between a display and a gate. Stage 7's release gate could not have caught
    it: it fires before 8, 9 and 10 exist and asks only about the tests stage.

    So two things must both be true, and neither implies the other: the script is here,
    and stage 10 names it. A gate whose criterion cites a script nobody seeded is prose;
    a script nobody's criterion runs is a file.
    """
    script = os.path.join(ROOT, "scripts", "stage-coverage.sh")
    if not os.path.isfile(script):
        fail("scripts/stage-coverage.sh is missing — stage 10's criterion names a check "
             "this repository cannot run, which is how a run closes with a stage it "
             "never stamped (B-31)")
        return
    cfg = os.path.join(ROOT, "pipeline.json")
    if not os.path.isfile(cfg):
        return
    with open(cfg, encoding="utf-8") as fh:
        stages = json.load(fh).get("stages", [])
    last = max((s for s in stages if "id" in s), key=lambda s: s["id"], default=None)
    if last is None:
        return
    if "stage-coverage.sh" not in (last.get("gate", {}).get("check") or ""):
        fail(f"pipeline.json stage[{last['id']}]: the final gate does not name "
             "scripts/stage-coverage.sh — a coverage check nothing runs cannot refuse "
             "the run that skips a declared stage")


check_stage_coverage_is_wired()


RELEASE_SURFACES = ("CHANGELOG.md", "package.json", ".github/workflows/*.yml")


def check_members_guard_their_release_surfaces():
    """Every member coordinates, and coordinates the files a release actually touches.

    B-44 was filed on the wrong premise — that `task-pipeline` had no
    `.claude/agent-sync.json`. It had one, committed in v1.53.0. What it did not have was
    `CHANGELOG.md` or `package.json` in `guardedFiles`: it guarded the doc registers, and
    two sessions then wrote both release files in that tree at once, each under its own
    `v1.55.0` heading. The guard was silent because neither file was in the list, and
    `npm test` was green on the mixture, which is why nothing noticed.

    So the check is not "is there a config" — that question was already answered yes
    while the collision happened. It is "does the config name the files two releases
    collide on".
    """
    skdir = os.path.join(ROOT, "skills")
    if not os.path.isdir(skdir):
        return
    for name in sorted(os.listdir(skdir)):
        sub = os.path.join(skdir, name)
        if not os.path.isdir(sub):
            continue
        cfg = os.path.join(sub, ".claude", "agent-sync.json")
        if not os.path.isfile(cfg):
            # A submodule that is not checked out cannot be judged, and saying so beats
            # both a false pass and a failure the operator cannot act on.
            if not os.path.isfile(os.path.join(sub, "package.json")):
                _skips.append(f"{name}: submodule not materialized — coordination unchecked")
            else:
                fail(f"skills/{name}: no .claude/agent-sync.json — an unclaimed edit to a "
                     f"shared file is how two sessions overwrite each other, and this "
                     f"family runs more than one")
            continue
        try:
            with open(cfg, encoding="utf-8") as fh:
                guarded = set(json.load(fh).get("guardedFiles") or [])
        except (OSError, ValueError) as exc:
            fail(f"skills/{name}/.claude/agent-sync.json is unreadable ({exc}) — a config "
                 f"that cannot be parsed guards nothing, silently")
            continue
        missing = [s for s in RELEASE_SURFACES if s not in guarded]
        if missing:
            fail(f"skills/{name}/.claude/agent-sync.json: guardedFiles omits {missing} — "
                 f"these are the files two concurrent releases write at once; guarding the "
                 f"doc registers and not these is the exact gap that let one through")


check_members_guard_their_release_surfaces()


def check_standing_instruction_ids_are_stable():
    """An id, once used, is never reused — because published documents cite these numbers.

    B-23: two CHANGELOGs and a merged PR body cite standing instructions BY NUMBER while
    the file renumbers on every retirement. v0.46.0 left slot 3 vacant rather than
    renumbering, which keeps existing citations true and makes the list non-contiguous —
    the right instinct, unenforced. And it had already failed once: `#1` was retired on
    2026-08-13 and the slot refilled the same day, so a citation of `#1` means two
    different rules depending on its date.

    That collision is recorded in the file rather than rewritten, because renumbering
    either side would make a shipped sentence point at a rule it never meant. What this
    refuses is the NEXT one.
    """
    retro = os.path.join(ROOT, "docs", "evidence", "retro.md")
    if not os.path.isfile(retro):
        _skips.append("standing-instruction ids — no docs/evidence/retro.md here")
        return
    with open(retro, encoding="utf-8") as fh:
        text = fh.read()
    m = re.search(r"^## Standing instructions$(.*?)^## Retired$(.*?)^## ", text,
                  re.M | re.S)
    if not m:
        _skips.append("standing-instruction ids — could not find both sections to compare")
        return
    live = [int(x) for x in re.findall(r"^(\d+)\. \*\*", m.group(1), re.M)]
    retired = [int(x) for x in re.findall(r"^- \*\*#(\d+) ", m.group(2), re.M)]
    if not live:
        fail("docs/evidence/retro.md: no standing instructions parsed — the list shape "
             "changed and this guard now reads nothing, which would pass forever")
        return
    if live != sorted(live):
        fail(f"docs/evidence/retro.md: standing instruction ids {live} are not ascending "
             f"— an id was reordered, and citations name the number, not the position")
    if len(set(live)) != len(live):
        fail(f"docs/evidence/retro.md: duplicate standing instruction id in {live}")
    # The one grandfathered collision must stay NAMED. Any other overlap is new.
    overlap = sorted(set(live) & set(retired))
    if overlap != [1]:
        fail(f"docs/evidence/retro.md: id(s) {overlap} appear both live and retired. An id "
             f"is allocated once and never reused — a retirement leaves its slot vacant, "
             f"because shipped CHANGELOGs cite these numbers. (#1 is the one recorded "
             f"collision from 2026-08-13 and is expected here; anything else is new.)")
    if "never reused" not in text:
        fail("docs/evidence/retro.md: the id-allocation rule is gone from the file it "
             "governs — the next agent to prune will renumber, which is what B-23 filed")


check_standing_instruction_ids_are_stable()


def check_hook_channels_do_not_mix():
    """A member that ships a plugin manifest must not also wire itself into settings.json.

    B-19 asked for one deliberate answer instead of each member deciding separately. The
    answer is that the channel follows the SHAPE: a plugin has a manifest and needs no
    write to the operator's file; a launcher has no manifest and no alternative. What is
    forbidden is one mechanism with two homes — uninstalling the plugin would leave the
    settings entry behind, still firing, owned by nobody. Recorded in docs/DOCMAP.md.
    """
    skdir = os.path.join(ROOT, "skills")
    if not os.path.isdir(skdir):
        return
    for name in sorted(os.listdir(skdir)):
        sub = os.path.join(skdir, name)
        manifests = glob.glob(os.path.join(sub, "plugins", "*", "hooks", "hooks.json"))
        if not manifests:
            continue
        # It ships plugin hooks. Nothing in it may also write hooks into settings.json.
        for root_dir, dirs, files in os.walk(os.path.join(sub, "lib")):
            for f in files:
                if not f.endswith(".js"):
                    continue
                fp = os.path.join(root_dir, f)
                with open(fp, encoding="utf-8", errors="ignore") as fh:
                    body = fh.read()
                if "settings.json" in body and re.search(r"hooks\s*[\[\.]", body):
                    rel = os.path.relpath(fp, ROOT)
                    fail(f"{rel}: {name} ships plugin hooks AND appears to wire hooks into "
                         f"settings.json — one mechanism with two homes and two lifetimes; "
                         f"uninstalling the plugin would leave the settings entry firing "
                         f"(docs/DOCMAP.md, B-19)")
    doc = os.path.join(ROOT, "docs", "DOCMAP.md")
    if os.path.isfile(doc):
        with open(doc, encoding="utf-8") as fh:
            if "the channel follows the shape" not in fh.read():
                fail("docs/DOCMAP.md: the hook-channel decision is gone — B-19 exists "
                     "because each member was answering it separately")


check_hook_channels_do_not_mix()


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
        # Read the COMMITTED version, not the working tree's. The promise is about a
        # checkout: a clone of this hub commit gets the submodule at its gitlink, and
        # whatever a local tree has uncommitted is not part of that. Reading the file on
        # disk made this gate red on 2026-08-14 for version 1.55.0 of `task-pipeline` —
        # a number that existed only as an uncommitted bump in a concurrent session's
        # working tree, and which no clone could have installed.
        #
        # The dirty state is still DISCLOSED rather than swallowed: a check that quietly
        # ignores an edit is how the edit ships. It just is not a pin failure, because
        # the pin is not what it disagrees with.
        subdir = os.path.join(ROOT, s.get("dir", ""))
        with open(sub_pkg, encoding="utf-8") as fh:
            on_disk = json.load(fh).get("version")
        verdict, actual, note = pin_source.resolve(
            declared, pin_source.read_committed(subdir), on_disk)
        if verdict == "mismatch":
            fail(f"skills.json: {name!r} pinned at {declared} but {note} says {actual} "
                 f"(checkout the right tag in {s.get('dir')!r})")
        elif verdict == "dirty":
            _skips.append(f"{name}: pin {declared} matches the committed submodule, but its "
                          f"{note}")
        elif verdict == "blind":
            _skips.append(f"{name}: the {declared} pin was {note}")

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


def check_board_is_parseable():
    """The board is a register that is cited by id, and nothing was reading it.

    Found 2026-08-14 by parsing it for the first time: **four ids appeared twice** —
    B-22, B-23, B-34 and B-35 — each pair meaning two unrelated things, and each already
    cited somewhere that reads them by number. B-34 was cited in this repository's
    published CHANGELOG as one row and in its retro as the other. A register whose ids
    are ambiguous cannot be cited, and citing it by id is its entire purpose.

    One row was also structurally broken, and its subject makes the point: B-33 is about
    `sed` failing on a pattern full of pipes, and a bare `|` inside its own text added a
    ninth cell and shifted every field after it. Its Status column read `1.0`.

    Two mechanical rules, both cheap:
      * every `| B-nn |` row has the same cell count as the header
      * no id appears twice

    Pipes are counted UNESCAPED — `\\|` is a literal in a cell, not a delimiter, which is
    exactly the distinction the broken row got wrong.
    """
    path = os.path.join(ROOT, "docs/evidence/backlog.md")
    if not os.path.isfile(path):
        _skips.append("docs/evidence/backlog.md absent — board integrity unchecked")
        return
    rows = [l for l in open(path, encoding="utf-8").read().splitlines()
            if re.match(r"^\|\s*B-\d+\s*\|", l)]
    if not rows:
        fail("docs/evidence/backlog.md: no `| B-nn |` rows — the board stopped being a table")
        return
    split = lambda l: re.split(r"(?<!\\)\|", l)
    widths = {len(split(l)) for l in rows}
    if len(widths) > 1:
        common = max(widths, key=lambda w: sum(1 for l in rows if len(split(l)) == w))
        for l in rows:
            if len(split(l)) != common:
                fail(f"docs/evidence/backlog.md: row {split(l)[1].strip()} has "
                     f"{len(split(l)) - 2} cells against the table's {common - 2} — an "
                     "unescaped `|` inside a cell shifts every column after it, and the "
                     "Status field then reads as whatever landed in its place")
    seen = {}
    for l in rows:
        bid = split(l)[1].strip()
        if bid in seen:
            fail(f"docs/evidence/backlog.md: id {bid} is used twice — rows are cited by "
                 "number in CHANGELOGs, commit messages and pipeline.json, so a duplicate "
                 "makes every one of those citations ambiguous")
        seen[bid] = True


check_board_is_parseable()

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

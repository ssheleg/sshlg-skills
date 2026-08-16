#!/usr/bin/env python3
"""Structural validator for the sshlg-skills umbrella repo. Exit 0 = pass."""
import glob, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pin_source
import board_age
import graph_staleness
import release_lag

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
    # A DUPLICATE KEY is valid YAML and silently keeps the last value, so `safe_load`
    # says "ok" over a step whose earlier setting was discarded. That is not theoretical:
    # on 2026-08-16 an inserted `with: fetch-depth: 0` landed above the step's existing
    # `with: submodules: recursive`, the parser accepted it, and the setting simply did
    # not exist. GitHub does the same thing, so nothing downstream complains either.
    class _NoDupes(yaml.SafeLoader):
        pass

    def _refuse_duplicates(loader, node, deep=False):
        seen = set()
        for key_node, _ in node.value:
            key = loader.construct_object(key_node, deep=deep)
            if key in seen:
                raise yaml.YAMLError(
                    f"duplicate key {key!r} at line {key_node.start_mark.line + 1} — "
                    f"YAML keeps the last one and drops the first silently")
            seen.add(key)
        return yaml.SafeLoader.construct_mapping(loader, node, deep)

    _NoDupes.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _refuse_duplicates)

    for wf in sorted(glob.glob(os.path.join(ROOT, ".github/workflows/*.yml"))):
        rel = os.path.relpath(wf, ROOT)
        try:
            doc = yaml.load(open(wf, encoding="utf-8"), _NoDupes)
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
        # COMMITTED, not on disk. Seeding these configs locally made this guard green on
        # 2026-08-14 while CI — which checks out the pinned commits — failed on two members
        # whose file had never been committed. Same class as the pin guard one section up:
        # a check that reads a working tree reports a state no clone can reproduce.
        tracked = True
        try:
            out = subprocess.run(["git", "-C", sub, "ls-files", "--error-unmatch",
                                  ".claude/agent-sync.json"],
                                 capture_output=True, text=True, timeout=15)
            tracked = out.returncode == 0
        except (OSError, subprocess.SubprocessError):
            tracked = os.path.isfile(cfg)   # cannot ask git; fall back and say so below
            _skips.append(f"{name}: could not ask git whether its agent-sync config is "
                          f"committed — checked the working tree instead")
        if not (tracked and os.path.isfile(cfg)):
            # A submodule that is not checked out cannot be judged, and saying so beats
            # both a false pass and a failure the operator cannot act on.
            if not os.path.isfile(os.path.join(sub, "package.json")):
                _skips.append(f"{name}: submodule not materialized — coordination unchecked")
            else:
                fail(f"skills/{name}: .claude/agent-sync.json is not committed — an "
                     f"unclaimed edit to a shared file is how two sessions overwrite each "
                     f"other, and a config that exists only on this machine protects "
                     f"nobody who clones")
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
    # `shape` and `shapeWhy`: every member says whether its run is static or dynamic and
    # why, because a graph that decides its own next node cannot be audited afterwards —
    # the shape that ran is not the shape anyone drew. The doctrine is one home away, in
    # agent-stack's graph-engineering reference; this is the per-member declaration, and
    # it is required so that a new member cannot join without answering the question.
    for key in ("name", "repo", "dir", "pluginMarketplace", "pluginInstall", "desc",
                "shape", "shapeWhy"):
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

# And the same requirement for every member, because "the gate is `npm test`" is
# stated family-wide in docs/DOCMAP.md and hooks/repo-gate.js denies a commit whose
# `npm test` is red — while three of nine members had no `scripts` block at all
# (B-65, measured 2026-08-16). An agent told the gate is `npm test` got exit 1 there
# and could not tell a missing script from a failing suite; a change committed
# inside such a submodule was gated by nothing.
#
# Disclosed rather than failed when the submodule is not checked out: a shallow or
# partial clone is an ordinary state, and a check that cannot look must never read
# as one that looked.
for _m in manifest.get("skills", []):
    _mp = os.path.join(ROOT, _m["dir"], "package.json")
    if not os.path.isfile(_mp):
        _skips.append(f"{_m['name']}: not checked out, so its gate entry point was not read")
        continue
    try:
        with open(_mp, encoding="utf-8") as fh:
            _mpkg = json.load(fh)
    except (ValueError, OSError) as exc:
        fail(f"{_m['dir']}/package.json: unreadable ({exc})")
        continue
    if not (_mpkg.get("scripts") or {}).get("test"):
        fail(f'{_m["dir"]}/package.json: no "scripts.test" — the family states `npm test` '
             "as the gate and hooks/repo-gate.js denies a commit whose `npm test` is red, "
             "so a member without one is gated by nothing and reports a missing script "
             "identically to a failing suite")

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


def check_prune_reads_the_installed_set():
    """The shadow prune must be fed installed plugins, never the marketplace listing.

    `claude plugin marketplace add` and `claude plugin install` are separate operations,
    so a marketplace outlives its plugin — a failed install, an uninstall. Fed the
    marketplace list, `shadowsToPrune` deleted the plain copy of a member whose plugin was
    gone: the only copy, and the skill with it. Measured 2026-08-15 against the pure
    function, which cannot tell the two apart and is not supposed to.

    The pure contract has a fixture. What no fixture reaches is the CALLER's choice of
    argument, because it reads `$HOME`. This is that check, at the only level available:
    the call must not be handed a directory listing of `plugins/marketplaces`.
    """
    src = os.path.join(ROOT, "bin", "sshlg-skills.js")
    if not os.path.isfile(src):
        _skips.append("bin/sshlg-skills.js absent — prune-input check not run")
        return
    text = open(src, encoding="utf-8").read()
    m = re.search(r"plan\.shadowsToPrune\(([^)]*)\)", text)
    if not m:
        fail("bin/sshlg-skills.js: no call to shadowsToPrune — the prune is the one thing "
             "that enforces one channel per agent, and it is gone")
        return
    args = m.group(1)
    if "marketDir" in args or "marketplaces" in args:
        fail("bin/sshlg-skills.js: shadowsToPrune is being handed the MARKETPLACE listing. "
             "A marketplace outlives its plugin, so this prunes the plain copy of a member "
             "whose plugin is not installed — the only copy. Pass the installed set, read "
             "from installed_plugins.json, and pass nothing when it cannot be read")
    if "installed" not in args.lower():
        fail("bin/sshlg-skills.js: shadowsToPrune's second argument does not name the "
             "installed set. It must be obvious at the call site which of the two sets "
             "this is, because the wrong one deletes work and both are one word")


check_prune_reads_the_installed_set()


def check_shape_is_a_real_answer():
    """A shape that says nothing is worse than no field: it reads as answered.

    `static` and `dynamic` are the two answers; anything else must at least contain one of
    them, so `static, with a bounded discovery` passes and `it depends` does not. And the
    reason has to be a reason — a field that everyone fills with the same word is a field
    nobody read.
    """
    for s in skills:
        sh = (s.get("shape") or "").lower()
        why = (s.get("shapeWhy") or "").strip()
        if "static" not in sh and "dynamic" not in sh:
            fail(f"skills.json: {s.get('name')!r} shape {s.get('shape')!r} answers neither "
                 "static nor dynamic — the question is which shape a run has, and 'it "
                 "depends' is the answer that stops anyone asking again")
        if len(why) < 60:
            fail(f"skills.json: {s.get('name')!r} shapeWhy is {len(why)} chars — too short "
                 "to be a reason. The field exists because an unstated design choice is "
                 "indistinguishable from an oversight")


check_shape_is_a_real_answer()


def check_desc_moves_with_skills():
    """A member that gains or loses a skill must reword its `desc` in the same change.

    B-48: `skillNames` is compared against the submodule in both directions and `desc` is
    compared against nothing, because *what a description says* is prose. Token-matching it
    was tried on 2026-08-16 and produced four false failures out of eight members — the
    concept was in every description and the word was not (`ad-tracking` as "GA4/Ads/Meta",
    `ux-foundation` as "personas and jobs"). A check that fails on four correct members is
    discarded whole, so it is not that check.

    What is mechanical is the *co-edit*: `agent-stack` shipped `agent-evals` while the
    registry advertised orchestrators only, and `list` hid a whole capability. If the skill
    set moved and the sentence describing it did not, that is the same defect arriving
    again, and it needs no opinion about prose to detect.

    Reads the PREVIOUS COMMIT, not the working tree, and discloses instead of failing where
    it cannot look — a shallow clone has no parent to compare against.
    """
    r = subprocess.run(["git", "show", "HEAD~1:skills.json"],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        _skips.append("no parent commit reachable — desc/skillNames co-edit not checked")
        return
    try:
        before = {s["name"]: s for s in json.loads(r.stdout).get("skills", [])}
    except Exception:
        _skips.append("HEAD~1:skills.json unparseable — desc/skillNames co-edit not checked")
        return
    for s in skills:
        old = before.get(s.get("name"))
        if not old:
            continue
        if set(old.get("skillNames") or []) != set(s.get("skillNames") or []) \
           and (old.get("desc") or "") == (s.get("desc") or ""):
            fail(f"skills.json: {s['name']!r} changed the skills it ships and left its "
                 "`desc` untouched. The registry is what `list` and the family table read, "
                 "so the new skill exists and is advertised nowhere — which is how "
                 "`agent-evals` shipped into a description that named orchestrators only")


check_desc_moves_with_skills()


def check_no_member_is_released_behind_its_branch():
    """Say when a member's `main` has moved past the commit this hub pins.

    B-56's real half. The pin is a **tag**; the skills-CLI channels install from the
    **branch**. Nothing compared them until `seo-aeo-audit` sat for six hours with a
    crash fix committed to `main` and untagged: `skills.json` advertised 0.20.0, the
    version that dies with `KeyError: 'low'` on most pages, while the hub copy every
    non-Claude-Code agent reads already had the repair. `check_pins.py` was green — the
    pin did match the latest release, and the latest release was the problem.

    **Reads only local refs and never fetches**, because `npm test` must work offline
    and because the network belongs to `check_pins.py`. A stale `origin/main` therefore
    under-reports, which is the safe direction: it can miss a lag, it cannot invent one.

    **Discloses, never fails.** Between a member's tag and the umbrella's re-pin the
    branch is ahead by design, every single release — a gate that reddens there is the
    racy-gate class this repository already named. The seo fix did not need the build
    stopped; it needed one line saying it was waiting.
    """
    for s in skills:
        name = s.get("name")
        subdir = os.path.join(ROOT, s.get("dir", ""))
        if not os.path.isdir(os.path.join(subdir, ".git")) and \
           not os.path.isfile(os.path.join(subdir, ".git")):
            _skips.append(f"{name}: submodule not materialized — release lag unchecked")
            continue

        def git(*a):
            try:
                r = subprocess.run(["git", "-C", subdir, *a],
                                   capture_output=True, text=True, timeout=15)
            except (OSError, subprocess.SubprocessError):
                return None
            return r.stdout.strip() if r.returncode == 0 else None

        has_ref = git("rev-parse", "--verify", "-q", "refs/remotes/origin/main") is not None
        ahead = git("rev-list", "--count", "HEAD..refs/remotes/origin/main") if has_ref else None
        tip = git("log", "-1", "--format=%s", "refs/remotes/origin/main") if has_ref else ""
        state, message = release_lag.resolve(has_ref, ahead, tip)
        if state != "current":
            _skips.append(f"{name}: {message}")


check_no_member_is_released_behind_its_branch()


def check_the_plant_sweep_is_still_called():
    """`test/advertised_plants.py` is not discovered, so only a check holds that it runs.

    It sits outside the `*_test.py` glob on purpose — it costs ~21 s and `npm test` is this
    repository's per-commit gate, whose honesty argument is that it costs three. The price
    of that decision is that nothing discovers it, and a suite nothing calls is the exact
    shape this file already guards elsewhere: `check_update_refreshes_runtime` exists
    because a function with passing fixtures sat under a command that never called it.

    So both ends are asserted: the entry point in `package.json` and the CI step that
    invokes it. Delete either and this goes red in the same run.
    """
    script = os.path.join(ROOT, "test", "advertised_plants.py")
    if not os.path.isfile(script):
        fail("test/advertised_plants.py is gone — the only proof that each member's own "
             "gate refuses a dropped trigger went with it (B-54)")
        return
    pkg = os.path.join(ROOT, "package.json")
    with open(pkg, encoding="utf-8") as fh:
        scripts = json.load(fh).get("scripts", {})
    if "advertised_plants.py" not in " ".join(scripts.values()):
        fail("package.json: no script runs test/advertised_plants.py — it is not "
             "discovered by the runner, so an entry point is the only way it executes")
    wf = os.path.join(ROOT, ".github", "workflows", "validate.yml")
    if not os.path.isfile(wf):
        _skips.append("plant-sweep CI wiring — no validate.yml here")
        return
    with open(wf, encoding="utf-8") as fh:
        text = fh.read()
    if "test:plants" not in text and "advertised_plants.py" not in text:
        fail(".github/workflows/validate.yml: nothing runs the advertised-plant sweep. "
             "It is excluded from `npm test` by design, so CI is where it has to be named")


check_the_plant_sweep_is_still_called()


def check_every_stamped_commit_resolves():
    """A run stamp names a commit, and a commit typed from memory names nothing.

    Twice on 2026-08-16 a stamp in `docs/evidence/retro.md` was written with a SHA that
    had never existed — `dd0b1a2`, then `f9c3a4e` — both caught by hand, minutes apart,
    by the author who wrote them. That is not an attention problem: the SHA is not
    knowable until the commit is made, so it gets typed, and typing it is guessing.

    `task-pipeline` shipped this rule for its own docs in v1.60.0 and the umbrella never
    grew the check. It asserts two things, because resolution alone is not enough:
    the object exists, **and** it is reachable from `HEAD`. A stamp naming a commit an
    amend replaced resolves on the machine that wrote it and in no clone — standing
    instruction #10, which is the incident this file's own history records twice.

    Outside a checkout, or with no stamps found, it discloses rather than going quiet: a
    guard whose corpus is empty passes everything.
    """
    retro = os.path.join(ROOT, "docs", "evidence", "retro.md")
    if not os.path.isfile(retro):
        _skips.append("run-stamp SHAs — no docs/evidence/retro.md here")
        return
    with open(retro, encoding="utf-8") as fh:
        text = fh.read()
    # Only the stamp table's own column, not every backtick in the file: prose cites
    # commits from other repositories, and a gate that reddens on those is a gate that
    # gets switched off.
    shas = re.findall(r"^\|[^|]*\|[^|]*\|\s*`([0-9a-f]{7,40})`\s*\|", text, re.M)
    if not shas:
        _skips.append("run-stamp SHAs — no stamp rows matched the table shape")
        return
    # A shallow clone has no history to resolve against, and every old stamp "fails"
    # there for a reason that is not a defect: CI reported 20 fabricated SHAs on its
    # first run, all of them real commits from earlier this month. Disclose, do not
    # fail — and the workflow now checks out full history so CI can actually look.
    shallow = subprocess.run(["git", "rev-parse", "--is-shallow-repository"],
                             cwd=ROOT, capture_output=True, text=True)
    if shallow.stdout.strip() == "true":
        _skips.append(f"run-stamp SHAs — shallow checkout, {len(set(shas))} stamp(s) unverifiable")
        return
    checked, bad = 0, []
    for sha in dict.fromkeys(shas):
        r = subprocess.run(["git", "rev-parse", "-q", "--verify", f"{sha}^{{commit}}"],
                           cwd=ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            bad.append(f"{sha} does not resolve")
            continue
        a = subprocess.run(["git", "merge-base", "--is-ancestor", f"{sha}^{{commit}}", "HEAD"],
                           cwd=ROOT, capture_output=True, text=True)
        if a.returncode != 0:
            bad.append(f"{sha} resolves but is not reachable from HEAD")
        checked += 1
    if not checked and not bad:
        _skips.append("run-stamp SHAs — git could not verify any of them")
        return
    for b in bad:
        fail(f"docs/evidence/retro.md: run stamp {b} — a stamp is only useful in a clone, "
             "and a SHA typed before the commit exists is a guess")


check_every_stamped_commit_resolves()


def check_shipped_front_matter_is_real_yaml():
    """Every shipped `SKILL.md` must survive a strict YAML reader, not only our regexes.

    B-56's root cause, found on 2026-08-16 after two cycles of blaming the launcher: a
    `description` gained `style packs: dashboards`, a colon-space inside an unquoted
    scalar, which YAML reads as a nested mapping. **Every check this family owns reads
    that field with a regex** — the member validator, `claude plugin validate`, this
    repository's trigger fixture — so all of them stayed green. The skills CLI, which
    uses a real parser, reported *No valid skills found*, the launcher exited 1 on that
    member for hours, and twelve non-Claude-Code channels sat on the previous version.

    `test/advertised_check.js` carries the narrow form of this rule so a member catches it
    before releasing. This is the strict form, run where the parser exists, over every
    shipped skill of every submodule.
    """
    try:
        import yaml
    except ImportError:
        _skips.append("shipped front matter vs a real YAML parser — pyyaml not installed "
                      "here; CI installs it")
        return
    files = sorted(glob.glob(os.path.join(ROOT, "skills/*/plugins/*/skills/*/SKILL.md"))
                   + glob.glob(os.path.join(ROOT, "skills/*/.cursor/skills/*/SKILL.md")))
    if not files:
        _skips.append("shipped front matter — no submodule materialized, nothing parsed")
        return
    for f in files:
        rel = os.path.relpath(f, ROOT)
        text = open(f, encoding="utf-8").read()
        m = re.match(r"^---\n(.*?)\n---", text, re.S)
        if not m:
            fail(f"{rel}: no front matter — a skill needs `name` and `description`")
            continue
        try:
            doc = yaml.safe_load(m.group(1))
        except yaml.YAMLError as exc:
            problem = getattr(exc, "problem", str(exc))
            fail(f"{rel}: front matter is not valid YAML ({problem}). Our own tools read it "
                 f"with a regex and stay green; the installer refuses the file outright")
            continue
        if not isinstance(doc, dict):
            fail(f"{rel}: front matter parses to {type(doc).__name__}, not a mapping")
            continue
        for key in ("name", "description"):
            if not doc.get(key):
                fail(f"{rel}: front matter has no `{key}`")


check_shipped_front_matter_is_real_yaml()


def check_how_far_behind_each_knowledge_graph_is():
    """Say how far each graph has drifted from the code it describes.

    `references/knowledge-graph.md` has named `built_at_commit` and the exact commands
    since it was written; nothing ran them, so the number existed only when somebody
    thought to ask. On 2026-08-16 the answer was 31 commits for this repository, 33 for
    `super-ux`, 19 for `seo-aeo-audit` — and the doctrine's own warning is that *a wrong
    doc gets argued with, a wrong graph gets believed*.

    **A disclosure, never a gate.** A graph is behind the moment the next commit lands, so
    a threshold would redden every repository every day and be switched off in a week. And
    the refresh cannot run on this machine at all (B-51), which is a decision an operator
    owes rather than a build failure — this makes the cost of waiting visible instead of
    silent.

    Reads only local state and never invokes graphify.
    """
    # Can the refresh even run? Answered once, from the environment, rather than assumed:
    # B-51 is about a missing key, and a key appearing should change this line by itself.
    keys = ("GEMINI_API_KEY", "GOOGLE_API_KEY", "MOONSHOT_API_KEY", "ANTHROPIC_API_KEY",
            "OPENAI_API_KEY", "DEEPSEEK_API_KEY")
    refreshable = any(os.environ.get(k) for k in keys)

    targets = [(".", "sshlg-skills")] + [(s.get("dir", ""), s.get("name", "")) for s in skills]
    looked = 0
    for rel, name in targets:
        repo = os.path.join(ROOT, rel) if rel != "." else ROOT
        gpath = os.path.join(repo, "graphify-out", "graph.json")
        if not os.path.isfile(gpath):
            continue
        looked += 1
        try:
            with open(gpath, encoding="utf-8") as fh:
                built = json.load(fh).get("built_at_commit", "")
        except (OSError, ValueError):
            _skips.append(f"{name}: graphify-out/graph.json is unreadable — staleness unknown")
            continue

        def git(*a):
            try:
                r = subprocess.run(["git", "-C", repo, *a], capture_output=True,
                                   text=True, timeout=15)
            except (OSError, subprocess.SubprocessError):
                return None
            return r.stdout.strip() if r.returncode == 0 else None

        resolves = bool(built) and git("rev-parse", "-q", "--verify", f"{built}^{{commit}}") is not None
        behind = git("rev-list", "--count", f"{built}..HEAD") if resolves else None
        state, message = graph_staleness.resolve(built, resolves, behind, refreshable)
        if state != "current" or not refreshable:
            _skips.append(f"{name}: {message}")

        # And the half a person actually opens. Written by a different command from
        # the graph, so a rebuild that touches only graph.json leaves it describing
        # another build — nine of nine disagreed on 2026-08-16 (B-67).
        rpath = os.path.join(repo, "graphify-out", "GRAPH_REPORT.md")
        rcommit = None
        if os.path.isfile(rpath):
            with open(rpath, encoding="utf-8") as fh:
                m = re.search(r"Built from commit: `([0-9a-f]+)`", fh.read())
            rcommit = m.group(1) if m else None
            ok, why = graph_staleness.report_agrees(built, rcommit)
            if not ok:
                _skips.append(f"{name}: {why}")
    if not looked:
        _skips.append("knowledge graphs — none found in this checkout")


check_how_far_behind_each_knowledge_graph_is()


def check_each_member_ledger_reaches_its_shipped_version():
    """A verification ledger describing an artifact nobody ships reads green for a
    version that no longer exists.

    Each member's `docs/evidence/verification.md` records what was confirmed against
    the **shipped** artifact. Measured 2026-08-17: **seven of eight** recorded a
    version older than the one in their own `package.json` — `seo-aeo-audit` by
    eight releases, `sheleg-design` by eight, `agent-sync` by five — and
    `task-pipeline`'s recorded no version at all. The file's own rule everywhere is
    that a row sits at `never` until somebody watched its check pass on what
    shipped; a ledger that stops at v0.14.1 while npm serves 0.22.0 is answering
    about a tree no consumer has.

    A **disclosure, not a gate**. The remedy is a person re-measuring rows, which no
    threshold here can produce, and a red build would be switched off long before
    anyone did the work. What this can do is stop the gap being invisible — which is
    exactly the argument `docs/evidence/verification.md` makes about itself.

    The ledgers do not share a shape (B-62), so this reads the newest semver in any
    heading rather than a fixed field, and says so when it finds none.
    """
    for m in manifest.get("skills", []):
        led = os.path.join(ROOT, m["dir"], "docs", "evidence", "verification.md")
        pkg = os.path.join(ROOT, m["dir"], "package.json")
        if not os.path.isfile(pkg):
            continue
        if not os.path.isfile(led):
            _skips.append(f"{m['name']}: no verification ledger")
            continue
        try:
            with open(pkg, encoding="utf-8") as fh:
                shipped = json.load(fh).get("version", "")
        except (OSError, ValueError):
            continue
        heads = [l for l in open(led, encoding="utf-8") if l.startswith("#")]
        vs = {mm.group(1) for l in heads for mm in re.finditer(r"v?(\d+\.\d+\.\d+)", l)}
        if not vs:
            _skips.append(f"{m['name']}: the verification ledger records no version at all, "
                         "so nothing says which artifact its rows were confirmed against")
            continue
        newest = max(vs, key=lambda v: tuple(int(x) for x in v.split(".")))
        if newest != shipped:
            _skips.append(f"{m['name']}: the verification ledger's newest record is "
                         f"{newest} and package.json ships {shipped} — its rows describe "
                         "an artifact that is no longer the shipped one")


check_each_member_ledger_reaches_its_shipped_version()


def check_release_tags_are_annotated():
    """A lightweight tag makes `git submodule status` report a stale version.

    `git describe` without `--tags` sees **annotated tags only**, and that is what
    `git submodule status` prints — the one line a maintainer glances at to decide
    whether a member is current. Measured 2026-08-16: `task-pipeline`'s last seven
    releases were lightweight and the umbrella reported it as **v1.60.0**, seven
    releases stale; `sheleg-design` as v1.36.1 and `agent-sync` as v1.11.0. A
    lightweight tag also carries no tagger, date or message, so a release has no
    signed-off record.

    Six of eight were re-cut annotated as they were released on 2026-08-16/17. The
    two that were not — `agent-stack` v0.11.1 and `super-ux` v0.41.5 — are
    **deliberately left**: both versions are published, and force-moving a tag
    re-triggers the release workflow into an `npm publish` npm must reject, which
    would paint a red run over a release that succeeded. They correct themselves at
    the next release, and until then this says so rather than letting the stale
    readout pass unexplained.

    A disclosure: a shallow clone has no tags at all, and a member between releases
    legitimately has none newer than its last.
    """
    for m in manifest.get("skills", []):
        d = os.path.join(ROOT, m["dir"])
        if not os.path.isdir(os.path.join(d, ".git")) and not os.path.isfile(os.path.join(d, ".git")):
            continue

        def g(*a):
            try:
                r = subprocess.run(["git", "-C", d, *a], capture_output=True, text=True, timeout=15)
            except (OSError, subprocess.SubprocessError):
                return None
            return r.stdout.strip() if r.returncode == 0 else None

        newest = (g("tag", "--sort=-v:refname") or "").split("\n")[0]
        if not newest:
            continue
        if g("cat-file", "-t", newest) != "tag":
            described = g("describe") or "nothing"
            _skips.append(f"{m['name']}: newest tag {newest} is lightweight, so "
                          f"`git submodule status` reports this member as {described} — "
                          "cut release tags with `git tag -a`")


check_release_tags_are_annotated()


def check_no_member_holds_a_commit_the_remote_does_not():
    """A pin is only a promise if the commit it names can be fetched.

    `git submodule status` prints no `+` when the pointer matches the submodule's
    **local** HEAD, so a commit that was made and never pushed looks identical to
    one that shipped. It is not: `actions/checkout` fails the clone with
    *upload-pack: not our ref*, and every consumer of that hub commit fails with it.

    That is not hypothetical. v0.80.0 was tagged with `skills/agent-stack` pinned at
    a `scripts.test` chore commit that existed only on this machine; the umbrella's
    own `npm test` was green, `git submodule status | grep -c '^+'` returned 0, and
    CI failed at checkout — **after the tag was public**. `task-pipeline`'s stage 10
    states the order this exists to enforce: *push the submodule, **then** commit the
    pointer*, and the second half is the one that gets forgotten.

    A failure rather than a disclosure: a pinned commit nobody can fetch breaks every
    clone, which is the one thing the pin invariant promises will not happen. Where
    the upstream ref cannot be resolved — a detached CI checkout, a fresh clone with
    no remote-tracking branch — it discloses instead, because a check that cannot look
    must never read as one that looked.
    """
    for m in manifest.get("skills", []):
        d = os.path.join(ROOT, m["dir"])
        if not os.path.exists(os.path.join(d, ".git")):
            continue

        def g(*a):
            try:
                r = subprocess.run(["git", "-C", d, *a], capture_output=True, text=True, timeout=15)
            except (OSError, subprocess.SubprocessError):
                return None
            return r.stdout.strip() if r.returncode == 0 else None

        if g("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}") is None:
            _skips.append(f"{m['name']}: no upstream ref here, so whether its commits are "
                          "pushed could not be read")
            continue
        ahead = g("log", "@{u}..HEAD", "--oneline")
        if ahead:
            n = len(ahead.split("\n"))
            fail(f"{m['dir']}: {n} commit(s) exist only locally — a pin naming one of them "
                 f"fails every clone with `upload-pack: not our ref`, while `git submodule "
                 f"status` shows no `+` because the pointer matches the LOCAL head. Push the "
                 f"submodule first, then commit the pointer:\n      {ahead.splitlines()[0]}")


check_no_member_holds_a_commit_the_remote_does_not()


def check_every_changelog_release_has_a_tag_or_says_it_is_not_one():
    """A version heading nobody can check out makes the register uncheckable there.

    A CHANGELOG is a decision register: *"shipped in v1.28.0"* has to resolve to
    something. Measured 2026-08-17 across the family: **17 sections above their own
    repository's first tag** described a release that was never tagged — ten in
    `sheleg-design`, three in `super-ux`, two in `agent-sync`, one each in
    `task-pipeline` and `seo-aeo-audit`. Four of `sheleg-design`'s are on npm with
    no tag, which is the worse half: the artifact is real, so a bug report against
    it has no source tree to read.

    **Only above the first tag.** Below it the project had not adopted tagging, and
    flagging that is noise about history rather than a defect — `super-ux` alone
    would report twenty-two.

    The remedy a section can carry instead of a tag is an explicit note saying it
    was not a release; `seo-aeo-audit` wrote one for v0.18.0 before this check
    existed, and its wording is the shape the others now use. A disclosure, because
    the fix is a sentence a person writes and a red gate would be routed around.
    """
    for m in manifest.get("skills", []):
        d = os.path.join(ROOT, m["dir"])
        cl = os.path.join(d, "CHANGELOG.md")
        if not os.path.isfile(cl) or not os.path.exists(os.path.join(d, ".git")):
            continue
        try:
            r = subprocess.run(["git", "-C", d, "tag"], capture_output=True, text=True, timeout=15)
        except (OSError, subprocess.SubprocessError):
            continue
        if r.returncode != 0:
            continue
        key = lambda v: tuple(int(x) for x in v.split("."))
        tags = {t.lstrip("v") for t in r.stdout.split() if re.fullmatch(r"v?\d+\.\d+\.\d+", t)}
        if not tags:
            _skips.append(f"{m['name']}: no version tags here, so CHANGELOG headings "
                          "could not be reconciled against any")
            continue
        first = min(tags, key=key)
        text = open(cl, encoding="utf-8").read()
        gaps = []
        for mm in re.finditer(r"^##+ \[?v?(\d+\.\d+\.\d+)\]?[^\n]*\n", text, re.M):
            v = mm.group(1)
            if v in tags or key(v) <= key(first):
                continue
            after = text[mm.end():mm.end() + 400]
            if "Never released on its own" in after or "Published, never tagged" in after:
                continue          # the section says so itself, which is the remedy
            gaps.append(v)
        if gaps:
            _skips.append(f"{m['name']}: CHANGELOG documents {len(gaps)} version(s) with no "
                          f"tag and no note saying they were not releases — {', '.join(gaps[:4])}"
                          + (" …" if len(gaps) > 4 else ""))


check_every_changelog_release_has_a_tag_or_says_it_is_not_one()


def check_the_board_rank_follows_from_its_own_inputs():
    """`Age` and `P` are computed columns, so compute them.

    The board's header states `P = blast × (1 + age_runs) / effort` and promises the rank
    is *"recomputed at stage 10 rather than inherited, so a row cannot keep a rank it
    earned when it was new."* Nothing recomputed it. Measured 2026-08-16: `B-07` and
    `B-08` said age 2 against **7** stamp-days, `B-29` said 0 against 3, `B-51` said 0
    against 1 — so the age term, the whole reason the formula has one, was a constant, and
    the board ranked newest-first while its header claimed the opposite. A loop worked
    those four rows last all day.

    **A gate, not a disclosure**, and the distinction is the same one `graph_staleness`
    lands on the other side of: a stale graph drifts on its own with every commit, while a
    wrong rank is a stated number disagreeing with its own stated inputs. `task-pipeline`'s
    validator has failed on exactly that in the seeded template since v1.14.0; this
    repository's board carried its own formula and no check at all.

    Closed rows are left alone. Their rank stopped mattering when they closed, and
    recomputing history would rewrite what a run actually ranked by.
    """
    board = os.path.join(ROOT, "docs", "evidence", "backlog.md")
    retro = os.path.join(ROOT, "docs", "evidence", "retro.md")
    if not os.path.isfile(board):
        _skips.append("board rank — no docs/evidence/backlog.md here")
        return
    if not os.path.isfile(retro):
        _skips.append("board rank — no docs/evidence/retro.md, so age has nothing to count")
        return
    with open(retro, encoding="utf-8") as fh:
        days = board_age.stamp_days(fh.read())
    if not days:
        _skips.append("board rank — the stamp table matched no dates; age unverifiable")
        return
    with open(board, encoding="utf-8") as fh:
        lines = fh.read().splitlines()
    looked = 0
    for line in lines:
        if not re.match(r"^\|\s*B-\d+\s*\|", line):
            continue
        cells = [c.strip() for c in line.split("|")]
        if len(cells) < 9 or not cells[8].startswith(("open", "**open", "**part")):
            continue
        rid = cells[1]
        age = board_age.age_days(cells[3], days)
        if age is None:
            _skips.append(f"board rank — row {rid}'s Source names no date, so its age is unknown")
            continue
        try:
            blast, effort, stated_age = int(cells[4]), int(cells[6]), int(cells[5])
        except ValueError:
            fail(f"docs/evidence/backlog.md: row {rid} has non-numeric blast/age/effort — "
                 "the three are what make the rank checkable, and prose in any of them "
                 "makes it an opinion again")
            continue
        looked += 1
        if stated_age != age:
            fail(f"docs/evidence/backlog.md: row {rid} states age {stated_age} but has "
                 f"survived {age} stamp-day(s) since {cells[3]!r} — the age term is the "
                 "reason this formula has one, and a constant there ranks newest-first")
            continue
        want = board_age.fmt(board_age.priority(blast, age, effort))
        if cells[7].strip("*") != want:
            fail(f"docs/evidence/backlog.md: row {rid} states P {cells[7].strip('*')} but "
                 f"blast {blast} × (1 + {age}) / effort {effort} computes to {want}")
    if not looked:
        _skips.append("board rank — no open row carried a checkable age")


check_the_board_rank_follows_from_its_own_inputs()


def check_a_waiver_names_what_would_bring_it_back():
    """`waived` is a decision. A decision with no trigger is a row nobody reconsiders.

    B-07 and B-08 recorded deliberate *no*s in 2026-08-06 and sat `open` for seven
    stamp-days. Once the age term started working they reached the **top** of this board
    at 2.67 each, and the cycle that picked them up spent itself re-deriving two decisions
    that were correct when made and are still correct. Fixing the age term is what exposed
    it: the constant had been hiding the fact that a decision ages like debt.

    So a waived row is not open, carries no priority, and must say what would bring it
    back. The `revisit:` clause is a written convention rather than prose the guard has to
    interpret — a check that tried to recognise *a condition* in free text could not tell
    one from a sentence about one, which is the boundary this repository keeps crossing.

    Waived rows are also DISCLOSED on every run. A waiver that becomes invisible is how a
    decision outlives the reason for it.
    """
    board = os.path.join(ROOT, "docs", "evidence", "backlog.md")
    if not os.path.isfile(board):
        _skips.append("waivers — no docs/evidence/backlog.md here")
        return
    with open(board, encoding="utf-8") as fh:
        lines = fh.read().splitlines()
    waived = []
    for line in lines:
        # `B-\d+` only: the doctrine's fenced example carries a placeholder id, and a
        # guard that reads it reports on a row that does not exist.
        if not re.match(r"^\|\s*B-\d+\s*\|", line):
            continue
        cells = [c.strip() for c in line.split("|")]
        if len(cells) < 9:
            continue
        rid, prio, status = cells[1], cells[7], cells[8]
        if not re.match(r"^\**waived\b", status, re.I):
            continue
        waived.append(rid)
        if "revisit:" not in status.lower():
            fail(f"docs/evidence/backlog.md: row {rid} is waived and names no `revisit:` "
                 "condition — a decision with no trigger is a row nobody will reconsider, "
                 "and the trigger has to be something a later run can measure")
        if prio.strip("*") not in ("—", "-", ""):
            fail(f"docs/evidence/backlog.md: row {rid} is waived but still carries priority "
                 f"{prio!r} — a decision is not debt, and ranking it puts it above real work")
    for rid in waived:
        _skips.append(f"board — {rid} is waived, not done; its revisit condition is in the row")


check_a_waiver_names_what_would_bring_it_back()

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

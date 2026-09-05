#!/usr/bin/env python3
"""Structural validator for the sshlg-skills umbrella repo. Exit 0 = pass."""
import glob, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pin_source
import board_age
import graph_staleness
import release_lag
import doc_refs

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


def check_members_refuse_an_unreachable_tag():
    """A tag pushed without its branch is a release no clone can reach.

    The release workflow fires on the TAG, so nothing fails loudly: the GitHub
    release is created, npm publishes, and `origin/main` still reads the previous
    era. `sheleg-design` hit it twice — the `v1.4.0` ghost on 2026-08-04 and
    `v1.18.0` on 2026-08-12, where `main` sat two commits ahead of `origin/main`
    while the tag was public and served by npm. The fix is two commands and the
    second is the one that gets forgotten, which is what makes it a guard rather
    than a habit.

    Every member's release job now refuses a tag whose commit is not an ancestor
    of the repository's ACTUAL default branch — read from the API, not hardcoded
    to `main`, so a fork that renamed it is not told its correct tag is
    unreachable. Ancestry needs history, so the tag checkout carries
    `fetch-depth: 0`; without it `merge-base` answers on a shallow clone and the
    guard is a coin toss.

    This asks for both halves, because either alone is a guard that cannot work.
    """
    skdir = os.path.join(ROOT, "skills")
    if not os.path.isdir(skdir):
        return
    looked = 0
    for name in sorted(os.listdir(skdir)):
        wf = os.path.join(skdir, name, ".github/workflows/release.yml")
        if not os.path.isfile(wf):
            if os.path.isdir(os.path.join(skdir, name)):
                _skips.append(f"{name}: no release.yml — tag reachability unchecked")
            continue
        looked += 1
        text = open(wf, encoding="utf-8").read()
        if "merge-base --is-ancestor" not in text:
            fail(f"skills/{name}/.github/workflows/release.yml: the release job does not "
                 f"refuse a tag whose commit is unreachable from the default branch. A tag "
                 f"pushed without its branch publishes a release no clone can reach, and "
                 f"this workflow fires on the tag so nothing fails loudly")
        elif "fetch-depth: 0" not in text:
            fail(f"skills/{name}/.github/workflows/release.yml: it asks `merge-base "
                 f"--is-ancestor` on a checkout with no `fetch-depth: 0`. Ancestry on a "
                 f"shallow clone is not an answer, and a guard that cannot see the history "
                 f"reports whatever the depth happened to give it")
    if looked < 2:
        fail("tag-reachability read fewer than two members' workflows — the submodules "
             "were not checked out, and a check that could not look must not read as one "
             "that looked")


check_members_refuse_an_unreachable_tag()


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

# The README's ROUTER table drifted for three days and two routers, which is the
# same failure one paragraph up and nobody had generalised it. `sheleg-dev` became
# the ninth router on 2026-08-14 and `agent-stack` the tenth on 2026-08-17; the
# table said "Eight routers" and listed eight through both. The registry is the
# single home -- `lib/routers-registry.js` says so in its own header -- so the
# table is checked against it rather than counted by hand. Only membership and the
# count sentence are asserted: the README's wording of a cell is allowed to differ
# from the block's, and forcing them identical would make this a second copy of
# the registry instead of a check on one.
if os.path.isfile(readme_file):
    reg = os.path.join(ROOT, "lib", "routers-registry.js")
    with open(reg, encoding="utf-8") as fh:
        registry_names = re.findall(r"^  '?([a-z-]+)'?: \{$", fh.read(), re.M)
    with open(readme_file, encoding="utf-8") as fh:
        readme_text = fh.read()
    WORDS = {8: "Eight", 9: "Nine", 10: "Ten", 11: "Eleven", 12: "Twelve"}
    if not registry_names:
        fail("test/validate.py: could not read any router name out of "
             "lib/routers-registry.js -- the guard below would pass vacuously")
    else:
        for name in registry_names:
            if f"| `{name}` |" not in readme_text:
                fail(f"README.md: the routers table has no row for {name!r}, which "
                     f"lib/routers-registry.js declares -- the table is written by "
                     f"hand and the registry is its single home")
        want = WORDS.get(len(registry_names))
        if want and f"{want} routers" not in readme_text:
            fail(f"README.md: the routers table is introduced with a count that is not "
                 f"{want!r}, while lib/routers-registry.js declares "
                 f"{len(registry_names)} routers")

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
    # EVERY board, not this one. The rule below was written on 2026-08-14, is
    # correct, and read a single file for six days -- so it stayed green while
    # FIVE members' boards carried the exact defect it exists for. Measured
    # 2026-08-20: 13 rows across `agent-stack`, `seo-aeo-audit`, `sheleg-design`,
    # `super-ux` and `task-pipeline` did not match their own header, and in
    # `sheleg-design` that hid both of the file's `high` rows from the queue that
    # orders the family's work. A check that looks at one of nine is a check
    # nobody can read as covering nine.
    # Every register cited by id, not only the ones called `backlog.md`. The
    # conformance register was outside this corpus for six days while carrying the
    # exact defect: three unescaped pipes inside `grep -cE 'rmtree|...'` split one
    # row into eight cells, and its `state` read `residue'` -- so a row nobody could
    # parse was also a row nobody could see was unparseable.
    boards = [("docs/evidence/backlog.md", os.path.join(ROOT, "docs/evidence/backlog.md")),
              ("docs/evidence/manifesto-conformance.md",
               os.path.join(ROOT, "docs/evidence/manifesto-conformance.md"))]
    for entry in manifest.get("skills", []):
        rel = os.path.join("skills", entry.get("name", ""), "docs/evidence/backlog.md")
        boards.append((rel, os.path.join(ROOT, rel)))

    looked = 0
    for rel, path in boards:
        if not os.path.isfile(path):
            _skips.append(f"{rel} absent — board integrity unchecked there")
            continue
        looked += 1
        _one_board(rel, path)
    if looked < 2:
        fail("board integrity read only this repository's own board — the members' "
             "boards were not checked out, and a check that could not look must not "
             "read as one that looked")


def _one_board(rel, path):
    """One board file: every row matches its own table's header, ids are unique.

    The header is the authority, not the majority. The first version took the
    most common width as the truth, which is right when one row is broken and
    silently wrong when a whole table is.
    """
    # `{1,4}`, and the fourth letter is not hypothetical: `ALL-49` and `ALL-44` are
    # program ids in the conformance register, and at `{1,3}` this guard did not see
    # them at all -- so the one row in the family that carried THREE unescaped pipes
    # inside a backticked regex was invisible to the check written for that defect.
    ID = re.compile(r"^\|\s*\**([A-Z]{1,4}-\d+[a-z]?)\s*\**\s*\|")
    split = lambda l: re.split(r"(?<!\\)\|", l)
    width = None
    declares = False
    rows = seen = 0
    ids = {}
    for lineno, l in enumerate(open(path, encoding="utf-8").read().splitlines(), 1):
        if l.startswith("#"):
            width = None            # a heading ends the previous table
            continue
        if not l.startswith("|"):
            continue
        cells = [c.strip() for c in split(l)]
        if len(cells) > 2 and cells[1].lower().strip("* ") in ("id", "row"):
            width = len(cells)
            # `id` DECLARES a row; `row` REFERENCES one. The distinction is the
            # header's own and the uniqueness rule has to read it: a closes ledger
            # keyed `row` cites ids the wave tables defined, so `AS-01` appearing in
            # both is a cross-reference, not a duplicate. Reading them as one is how
            # the widened guard's first run reported a legitimate ledger as broken.
            declares = cells[1].lower().strip("* ") == "id"
            continue
        m = ID.match(l)
        if not m or width is None:
            continue
        rows += 1
        if len(cells) != width:
            seen += 1
            fail(f"{rel}:{lineno}: row {m.group(1)} has {len(cells) - 2} cells against "
                 f"the {width - 2} its own header declares — an unescaped `|` inside a "
                 f"cell shifts every column after it, and Status then reads as whatever "
                 f"landed in its place")
        bid = m.group(1)
        if declares and bid in ids:
            fail(f"{rel}:{lineno}: id {bid} is used twice (first at line {ids[bid]}) — "
                 f"rows are cited by number in CHANGELOGs, commit messages and "
                 f"pipeline.json, so a duplicate makes every citation ambiguous")
        if declares:
            ids[bid] = lineno
    if not rows:
        fail(f"{rel}: no id rows under any header — the board stopped being a table")



def check_no_id_carries_two_verdicts():
    """A row cannot be `open` in the table that declares it and closed in a ledger.

    Found 2026-08-24 by widening `_one_board` to see four-letter ids: `AS-01` reads
    `open` in wave 4 and appears in the closes ledger landed at two commits. Board row
    B-99 names this id specifically, and nothing computed it -- the two statements sit
    forty lines apart in one file, each internally consistent, which is the shape a
    reader does not catch and a comparison does.

    `id` declares, `row` references (see `_one_board`). So the rule is one line: an id
    the ledger says closed must not read `open` where it was declared.
    """
    path = os.path.join(ROOT, "docs/evidence/manifesto-conformance.md")
    if not os.path.isfile(path):
        _skips.append("conformance register absent -- verdict agreement unchecked")
        return
    split = lambda l: re.split(r"(?<!\\)\|", l)
    ID = re.compile(r"^\|\s*\**([A-Z]{1,4}-\d+[a-z]?)\s*\**\s*\|")
    declared, referenced = {}, {}
    keycol = None
    state_at = None
    for lineno, l in enumerate(open(path, encoding="utf-8").read().splitlines(), 1):
        if l.startswith("#"):
            keycol = state_at = None
            continue
        if not l.startswith("|"):
            continue
        cells = [c.strip() for c in split(l)]
        low = [c.lower().strip("* ") for c in cells]
        if len(cells) > 2 and low[1] in ("id", "row"):
            keycol = low[1]
            state_at = low.index("state") if "state" in low else None
            continue
        m = ID.match(l)
        if not m or keycol is None:
            continue
        rid = m.group(1)
        if keycol == "id" and state_at is not None and state_at < len(cells):
            declared[rid] = (lineno, cells[state_at].lower().strip("* "))
        elif keycol == "row":
            referenced.setdefault(rid, lineno)

    both = 0
    for rid, ledger_line in sorted(referenced.items()):
        if rid not in declared:
            continue
        both += 1
        decl_line, state = declared[rid]
        if state == "open":
            fail(f"docs/evidence/manifesto-conformance.md:{decl_line}: {rid} reads "
                 f"`open` where it is declared, and line {ledger_line} lists it in the "
                 f"closes ledger -- one id, two verdicts, one file (B-99). Close the row "
                 f"with the ledger's evidence, or take it out of the ledger")
    if not both:
        _skips.append("no id appears in both a declaring table and the closes ledger -- "
                      "verdict agreement had nothing to compare")



def check_manifesto_citations_resolve():
    """A citation into the manifesto is a phrase, not a line number.

    Measured 2026-08-24: **all fourteen** references into the manifesto had rotted.
    The document grew, every address shifted -- eight by twenty lines, one by fifty --
    and one (`manifesto:186`) had pointed at a closing code fence since the day it was
    written. The rules were all intact; only the addresses were gone, which is the
    worst shape a citation can take: it still looks like a receipt.

    So the register cites a distinctive phrase and this resolves it. The phrase must
    appear **exactly once**, because a citation that matches twice names neither.

    The subject's path is read from the register's own header rather than hardcoded
    here -- the file that makes the claim is the file that says what it is about.
    Absent (CI, a fresh clone), this discloses and does not fail: a gate that reads a
    repository you do not control is racy, and the remedy for that class in this
    family has always been to say something rather than to stop the build.
    """
    def _slurp(path):
        try:
            with open(path, encoding="utf-8") as fh:
                return fh.read()
        except OSError:
            return None

    rel = "docs/evidence/manifesto-conformance.md"
    reg = _slurp(os.path.join(ROOT, rel))
    if reg is None:
        _skips.append(f"{rel} absent -- manifesto citations unchecked")
        return

    stale = re.findall(r"manifesto(?:\.md)?:\d+", reg)
    if stale:
        fail(f"{rel}: {len(stale)} citation(s) still address the manifesto by LINE "
             f"NUMBER ({', '.join(sorted(set(stale))[:4])}) -- every one of these rotted "
             f"once already when the document grew. Cite a distinctive phrase: "
             f'`manifesto` -> *\"...\"*')

    m = re.search(r"\(`([^`]*manifesto\.md)`\)", reg)
    if not m:
        fail(f"{rel}: the header no longer names the manifesto it is about, so nothing "
             f"can resolve its citations -- the subject is the one thing this file "
             f"cannot leave implicit")
        return
    subject = os.path.expanduser(m.group(1))
    if not os.path.isfile(subject):
        _skips.append(f"manifesto citations -- {m.group(1)} is not on this machine, so "
                      f"{len(re.findall(chr(96) + 'manifesto' + chr(96) + ' . ', reg))} "
                      f"citation(s) could not be resolved")
        return
    man = _slurp(subject)
    if man is None:
        _skips.append(f"manifesto citations -- {m.group(1)} unreadable")
        return

    cites = re.findall(r"`manifesto` \u2192 \*\"([^\"]+)\"\*", reg)
    if not cites:
        _skips.append(f"{rel}: no phrase citations found -- the resolver had nothing "
                      f"to look up, which is not the same as everything resolving")
        return
    for phrase in sorted(set(cites)):
        n = man.count(phrase)
        if n == 0:
            fail(f"{rel}: cites *\"{phrase[:60]}\"* and the manifesto does not contain "
                 f"it -- the rule moved, was reworded, or was removed, and the row "
                 f"resting on it is now unanchored")
        elif n > 1:
            fail(f"{rel}: cites *\"{phrase[:60]}\"* which appears {n} times in the "
                 f"manifesto -- a citation matching more than once names neither")


check_manifesto_citations_resolve()


# ── the first cross-repository doctrine check ────────────────────────────────
# ALL-44 for three years was a sentence: nine repositories carry overlapping
# doctrine, and every one is kept aligned by an agent reading the other repo at the
# moment it happens to look. On 2026-08-24 it stopped being a sentence. One runner
# was copied into two members in one evening -- the right instinct, since two
# implementations of one idea is the defect this family keeps finding -- and each
# copy met a repository that says "this plant behaved" in different words:
#
#     task-pipeline   OK:
#     seo-aeo-audit   ok:                                 2 steps misread
#     sheleg-dev      OK: and "rejected, as it must be"   20 steps misread
#
# Twenty healthy guards reported as guards that do not fire, and nothing anywhere
# could see it, because the assumption was never written down.
#
# So this does NOT compare texts. Two copies of a mechanism are allowed to differ --
# a prefix, a floor, a vocabulary -- and demanding they be identical would either
# freeze the family or be ignored. What it refuses is an UNDECLARED difference: each
# copy names the module-level constants that diverge, the gate computes the real set,
# and a difference the declaration does not name fails the commit.
#
# Scope, stated because a check claiming more than it does is the defect above:
# module-level constants only. Divergent PROSE is not policed, and `validate.py`
# is not in the corpus at all -- nine files share that name and score 0.385-0.943
# against each other, which is nine different programmes, not nine copies.
SHARED_SIMILARITY = 0.90     # below this, a shared name is a coincidence
SHARED_MIN_COPIES = 2
_SHARED_DECL = re.compile(r"(?m)^#\s*shared-mechanism:\s*(\S+)")
_SHARED_DIVERGES = re.compile(r"(?m)^#\s*diverges:\s*(.+?)\s*$")
_MODULE_CONST = re.compile(r"(?m)^([A-Z_][A-Z0-9_]*)\s*=")



def check_a_shipped_readme_does_not_claim_a_command_the_package_cannot_run():
    """A fenced command block in a README is a claim; a path named in prose is not.

    Measured 2026-08-25 against the published tarballs: `task-pipeline-skill@1.76.1` and
    `@ssheleg/agent-sync@1.16.0` both told a reader to run `npm test`, and neither ships a
    `test/` directory -- `npm pack` listed 96 and 32 files with nothing under `test/`. So the
    command resolves in a clone and nowhere else, which is this family's own dead-address
    class landing inside its own distribution.

    Shipping `test/` does not fix it: the suites read `.github/workflows/validate.yml` for
    their plants, and no packaging that npm can express puts a workflow in a tarball. So the
    document names where the command runs instead of claiming it, and that statement carries a
    marker, because a rule anchored on a sentence stops holding the day somebody rewords it.

    Scoped to blocks, deliberately. Requiring the marker wherever a README merely *mentions*
    `test/validate.py` would have hit `make-skill` and `super-ux`, which describe the file and
    ask nobody to run it -- and a guard that fires on correct documents is how a team learns to
    add the marker everywhere without reading why.
    """
    mark = "<!-- commands-run-in: a clone -->"
    runnable = re.compile(r'^(npm (run )?test|python3 test/|node test/|bash test/|\./test/)')
    looked = 0
    for m in manifest.get("skills", []):
        rd = os.path.join(ROOT, m["dir"], "README.md")
        pkg = os.path.join(ROOT, m["dir"], "package.json")
        if not (os.path.isfile(rd) and os.path.isfile(pkg)):
            _skips.append(f"{m['name']}: no README or package.json to compare")
            continue
        try:
            files = json.load(open(pkg, encoding="utf-8")).get("files", [])
        except (ValueError, OSError):
            _skips.append(f"{m['name']}: package.json is unreadable, so what it ships is unknown")
            continue
        if any(str(x).rstrip("/") == "test" for x in files):
            continue                      # it ships the suite; the command is true anywhere
        text = open(rd, encoding="utf-8").read()
        claims = []
        for blk in re.finditer(r"```[a-z]*\n(.*?)```", text, re.S):
            for line in blk.group(1).splitlines():
                if runnable.match(line.strip()):
                    claims.append(line.strip())
        looked += 1
        if claims and mark not in text:
            fail(f"{m['dir']}/README.md: presents {len(claims)} command(s) to run that the "
                 f"published package cannot run -- it ships no `test/` -- and carries no "
                 f"`{mark}` beside them. First: {claims[0][:60]!r}. Name where the command "
                 f"runs, or ship the suite")
    if not looked:
        fail("no member was compared: every one either ships `test/` or has no README, so "
             "this check passed by looking at nothing")

def check_a_copied_mechanism_declares_its_divergence():
    import difflib

    roots = [("sshlg-skills", ROOT)]
    for entry in manifest.get("skills", []):
        nm = entry.get("name", "")
        roots.append((nm, os.path.join(ROOT, "skills", nm)))

    by_name = {}
    for repo, root in roots:
        tdir = os.path.join(root, "test")
        if not os.path.isdir(tdir):
            continue
        for f in sorted(os.listdir(tdir)):
            if not f.endswith(".py"):
                continue
            by_name.setdefault(f, []).append((repo, os.path.join(tdir, f)))

    looked = 0
    for fname, entries in sorted(by_name.items()):
        if len(entries) < SHARED_MIN_COPIES:
            continue
        texts = {}
        for repo, path in entries:
            try:
                with open(path, encoding="utf-8") as fh:
                    texts[repo] = fh.read()
            except OSError:
                continue
        if len(texts) < SHARED_MIN_COPIES:
            continue
        # `quick_ratio()` is an UPPER BOUND — it compares character multisets and
        # ignores order — so it is the cheap prefilter difflib intends it to be, never
        # the verdict. Deciding on it gated five of this guard's six subjects above a
        # floor they do not meet: `residue.py` was held at 0.943 with a true similarity
        # of **0.665**, so four copies were being told to declare a seam the guard's own
        # 0.90 threshold does not claim they share.
        #
        # It also nearly cost a much larger mistake. `B-138` proposed extending this
        # guard to `.js` and `.yml` on quick_ratio figures of 0.918–0.977 for
        # `installer_test.js`; measured exactly, **not one of its 21 pairs reaches
        # 0.90** — the true range is 0.182–0.815. That extension would have demanded
        # seam declarations for files sharing eighteen percent of their text.
        #
        # Cheap first, exact second, which is what the pair is for: the bound can only
        # over-estimate, so a candidate it rejects needs no second look.
        # ALL PAIRS, not base-against-the-rest. The base was `sorted(texts)[0]` — the
        # alphabetically first REPOSITORY — so the verdict moved with an accident of
        # naming: `social_preview.py` measures 0.913 against one base and 0.828 against
        # another, which is gated or reported depending on which member happens to sort
        # first. `#92`'s rule, from the other side: compare the copies to each other.
        names = sorted(texts)
        combos = [(a, b) for i, a in enumerate(names) for b in names[i + 1:]]
        if not combos:
            continue
        if min(difflib.SequenceMatcher(None, texts[a], texts[b]).quick_ratio()
               for a, b in combos) < SHARED_SIMILARITY:
            continue                      # a shared name, not a shared mechanism
        sims = [difflib.SequenceMatcher(None, texts[a], texts[b]).ratio()
                for a, b in combos]
        if min(sims) < SHARED_SIMILARITY:
            _skips.append(
                f"shared mechanism — {fname} has {len(texts)} copies that share a name "
                f"and {min(sims):.3f} of their text, under the {SHARED_SIMILARITY} "
                "floor. Reported rather than gated: a seam declaration for files this "
                "different would be a sentence nobody could write truthfully")
            continue
        looked += 1

        # what actually differs: a module-level constant whose assignment line is
        # not the same string in every copy
        per_repo = {}
        for repo, text in texts.items():
            found = {}
            for m in _MODULE_CONST.finditer(text):
                eol = text.find("\n", m.start())
                found[m.group(1)] = text[m.start(): eol if eol > 0 else len(text)]
            per_repo[repo] = found
        names = set().union(*[set(v) for v in per_repo.values()])
        computed = sorted(n for n in names
                          if len({per_repo[r].get(n) for r in per_repo}) > 1)

        for repo, text in sorted(texts.items()):
            decl = _SHARED_DECL.search(text)
            div = _SHARED_DIVERGES.search(text)
            rel = os.path.relpath(dict(entries)[repo], ROOT)
            if not decl or not div:
                fail(f"{rel}: {fname} exists in {len(texts)} repositories at "
                     f">={SHARED_SIMILARITY} similarity and this copy declares no "
                     f"`# shared-mechanism:` / `# diverges:` header. A shared "
                     f"mechanism whose seam is unwritten is aligned by whoever "
                     f"happens to look, which is exactly how twenty healthy guards "
                     f"were reported broken on 2026-08-24")
                continue
            stated = [] if div.group(1).strip().lower() == "none" else [
                x.strip() for x in div.group(1).split(",") if x.strip()]
            if sorted(stated) != computed:
                fail(f"{rel}: {fname} declares `diverges: "
                     f"{div.group(1).strip()}` and the copies actually differ on "
                     f"{computed or ['nothing']}. An undeclared divergence is the "
                     f"ALL-44 defect; a declared one that is not real is a reader "
                     f"looking for a seam that moved")

    # `#91` applied to this guard, on the run that shipped `#91`: **assert the
    # capability, not the count.** Deciding on the exact ratio instead of the upper
    # bound dropped its subjects from six to one, and a guard down to one subject is
    # one edit from gating nothing while still printing green. So it must be able to
    # name at least one file it actually holds — and when it cannot, that is a
    # measurement about the guard rather than a verdict about the tree.
    if looked == 0:
        fail("copied mechanisms — this guard held NOTHING. Either no file name appears "
             "in two repositories above the "
             f"{SHARED_SIMILARITY} floor, or the similarity measure changed under it. "
             "It passed by looking at nothing, which is the state it exists to make "
             "impossible elsewhere")
    else:
        _skips.append(f"copied mechanisms — {looked} file name(s) held above the "
                      f"{SHARED_SIMILARITY} floor by exact similarity; the bound is a "
                      "prefilter only, and everything it over-estimated is reported "
                      "above rather than gated")


check_a_copied_mechanism_declares_its_divergence()




check_a_shipped_readme_does_not_claim_a_command_the_package_cannot_run()
check_no_id_carries_two_verdicts()

def check_ledger_ids_are_unique_within_their_section():
    """A citation of the form `R-01` must resolve to ONE row.

    B-103. The board has a duplicate-id guard and the verification ledger does not,
    although the ledger is the file cited BY id from member repositories: 583 rows
    carrying 498 distinct ids, with 21 ids deliberately reused across sections and
    `R-01` naming eleven different requirements. The convention that makes that
    legible is section-scoping -- an id belongs to the dated section it was written
    in -- and it was neither declared nor checked, so nothing distinguished the
    convention from an accident.

    Measured when this was written: three genuine collisions inside one section,
    `PP-2`, `PP-3` and `PP-4`, where two pin passes appended under the same dated
    heading. Each of those citations resolved to two rows with different evidence.
    Disambiguated with the trailing-letter form the id grammar already allows,
    rather than by renumbering history -- and that rename immediately caught a second
    defect, a row counter whose id grammar was narrower than the file's own.

    Scoped rather than global on purpose: making 498 ids globally unique would
    renumber rows that member repositories already cite, trading a resolvable
    ambiguity for an unresolvable dead reference.
    """
    rel = "docs/evidence/verification.md"
    path = os.path.join(ROOT, rel)
    if not os.path.isfile(path):
        _skips.append(f"{rel} absent -- ledger id uniqueness unchecked")
        return
    ID = re.compile(r"^\|\s*\**([A-Za-z][A-Za-z0-9]{0,4}-[0-9]+[a-z]?)\**\s*\|")
    seen, section, rows = {}, None, 0
    for lineno, l in enumerate(open(path, encoding="utf-8").read().splitlines(), 1):
        if l.startswith("#"):
            section = l.strip()
            continue
        m = ID.match(l)
        if not m:
            continue
        rows += 1
        key = (section, m.group(1))
        if key in seen:
            fail(f"{rel}:{lineno}: `{m.group(1)}` is already used at line {seen[key]} in "
                 f"the same section -- a citation of that id resolves to two rows with "
                 f"different evidence. Ids are scoped to their section here, so reuse "
                 f"ACROSS sections is fine and reuse inside one is not: give this row the "
                 f"trailing-letter form (`{m.group(1)}a`), which the grammar already allows")
        else:
            seen[key] = lineno
    if rows < 50:
        _skips.append(f"{rel}: only {rows} id'd rows read -- too few to be the ledger, so "
                      "uniqueness was not asserted over it")


check_ledger_ids_are_unique_within_their_section()

def check_coordination_configs_are_healthy_here_too():
    """The coordination check ran in CI and nowhere else, and it caught this run.

    2026-09-03. Moving this repository's lease to `git` for B-75 dropped the `backend`
    key -- the RECORD plane, a different question from `leaseBackend` -- and left the
    generated snapshot describing a configuration that no longer existed. `npm test`
    was green through all of it. CI refused, one round trip later.

    That is the shape this family has paid for repeatedly and most expensively in
    `task-pipeline`, where four tags burned on it: a green local gate that does not
    cover what the release runs. So the same script CI calls is called here, from
    whichever copy this machine can resolve.

    It DISCLOSES rather than failing when no copy can be found, because agent-sync is
    a plugin rather than a dependency of this package and a fresh clone has no reason
    to carry it -- and a check that cannot look must not read as one that looked. CI
    installs the published package explicitly, so the strict reading still exists in
    the blocking path; this is the early one.
    """
    import glob as _glob
    cands = sorted(_glob.glob(os.path.expanduser(
        "~/.claude/plugins/cache/agent-sync/agent-sync/*/skills/agent-sync/scripts/"
        "agent_sync.py")))
    cands += [os.path.join(ROOT, "node_modules/@ssheleg/agent-sync/plugins/agent-sync/"
                                 "skills/agent-sync/scripts/agent_sync.py")]
    script = next((c for c in reversed(cands) if os.path.isfile(c)), None)
    if script is None:
        _skips.append("coordination: no agent_sync.py resolvable on this machine, so the "
                      "config health CI checks could not be read here")
        return
    dirs = [ROOT] + sorted(os.path.dirname(os.path.dirname(p2))
                           for p2 in _glob.glob(os.path.join(ROOT, "skills/*/.claude/"
                                                                   "agent-sync.json")))
    checked = 0
    for d in dirs:
        if not os.path.isfile(os.path.join(d, ".claude", "agent-sync.json")):
            continue
        checked += 1
        try:
            r = subprocess.run(["python3", script, "check"], cwd=d, capture_output=True,
                               text=True, timeout=90)
        except (OSError, subprocess.SubprocessError):
            _skips.append(f"coordination: `check` could not be run in {d}")
            continue
        if r.returncode != 0:
            bad = [l.strip() for l in (r.stdout + r.stderr).splitlines()
                   if l.strip().startswith(("x", "\u2717"))]
            fail(f"{os.path.relpath(d, ROOT) or '.'}: coordination config is not healthy — "
                 + ("; ".join(bad) if bad else "`agent_sync.py check` exited "
                                               f"{r.returncode}")
                 + ". CI runs this same script; it used to be the only thing that did")
    if checked < 2:
        _skips.append(f"coordination: only {checked} config(s) found here, so the health "
                      "check had almost nothing to read")


check_coordination_configs_are_healthy_here_too()


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
        added = set(s.get("skillNames") or []) - set(old.get("skillNames") or [])
        moved = set(old.get("skillNames") or []) != set(s.get("skillNames") or [])
        if not moved:
            continue
        # What this check actually wants is that the new skill is ADVERTISED, and
        # "desc changed in the same diff" was only a proxy for it. The proxy is wrong
        # in one real case, met on 2026-08-24: `sheleg-dev`'s desc gained "Sentry error
        # tracking" in one commit and its skillNames gained `error-tracking` in the
        # next, so against HEAD~1 the desc looks untouched while the set moved — and
        # the registry is correct. Assert the property instead: every newly added skill
        # is named somewhere in the description.
        desc = (s.get("desc") or "").lower()
        unadvertised = sorted(n for n in added
                              if n.lower() not in desc
                              and n.replace("-", " ").lower() not in desc)
        # No `desc unchanged` clause: the old check had one, and it let a desc that
        # moved WITHOUT naming the new skill through — the same defect wearing an edit.
        if unadvertised:
            fail(f"skills.json: {s['name']!r} changed the skills it ships and its `desc` "
                 f"advertises none of {unadvertised}. The registry is what `list` and the "
                 "family table read, so the new skill exists and is advertised nowhere — "
                 "which is how `agent-evals` shipped into a description that named "
                 "orchestrators only")


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
            _lagging.append(m["name"])
            _skips.append(f"{m['name']}: the verification ledger's newest record is "
                         f"{newest} and package.json ships {shipped} — its rows describe "
                         "an artifact that is no longer the shipped one")

    # B-98. This stood as a pure disclosure for four days across eight members, and a
    # disclosure that never changes anything is how a known-false state becomes furniture.
    # It is NOT escalated to a hard failure: each lagging ledger lives in a member
    # repository and only that member's own release can move it, so failing here would put
    # this guard between the family and its next release — which is the mistake B-92
    # records, from the other side.
    #
    # So it ratchets. The count may fall and may not rise: a member that has caught up
    # cannot silently fall back, and the figure below is lowered by whoever fixes one,
    # never raised to match reality. Measured 2026-09-03: three of nine; lowered to two
    # the same day when super-ux's release carried a ledger section for the version it
    # ships. The guard fired in BOTH directions on the run that wrote it — it refused the
    # tree until the smaller number was written down, which is the whole point of a
    # ratchet that also fails below its floor.
    _LAG_FLOOR = 2
    if len(_lagging) > _LAG_FLOOR:
        fail(f"{len(_lagging)} member ledger(s) describe a version older than they ship "
             f"({', '.join(sorted(_lagging))}) and the ratchet in test/validate.py stands "
             f"at {_LAG_FLOOR}. A member's ledger is fixed in that member's own release; "
             "this figure is lowered when one catches up and is never raised to match a "
             "regression")
    elif len(_lagging) < _LAG_FLOOR:
        fail(f"only {len(_lagging)} member ledger(s) lag where the ratchet stands at "
             f"{_LAG_FLOOR} — lower it to {len(_lagging)} in test/validate.py, in the same "
             "change that earned it, so the next reader inherits the smaller number")


_lagging = []
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

        # B-92. The hazard is a PIN naming a commit no clone can fetch. This guard asked
        # a different question — is the member's local HEAD ahead of its upstream — and the
        # two come apart exactly when the family is busy: on 2026-08-19 four members held
        # local commits at once while the umbrella's committed pointers named none of them,
        # and a commit that staged no pointer at all was denied. That is the fifth
        # appearance of *a count taken over the record rather than over the thing the
        # record is about*, and a guard standing between the family and its next release
        # teaches an operator to switch it off.
        #
        # Asked of the POINTER, and asked FIRST: the sha the umbrella would commit for this
        # member — the index entry, because that is what a tag would carry — must be
        # reachable from one of the member's remote refs. The ordering is load-bearing and
        # a plant found it: written after the upstream question, the whole check was
        # skipped for a member whose branch has no upstream, which is exactly the state the
        # plant creates and a release pass often has.
        pinned = None
        try:
            _r = subprocess.run(["git", "-C", ROOT, "ls-files", "-s", m["dir"]],
                                capture_output=True, text=True, timeout=15)
            if _r.returncode == 0 and _r.stdout.split():
                pinned = _r.stdout.split()[1]
        except (OSError, subprocess.SubprocessError):
            pinned = None
        if pinned is None:
            _skips.append(f"{m['name']}: no index entry for the submodule, so the commit "
                          "the pin names could not be read here")
        elif g("cat-file", "-e", pinned + "^{commit}") is None:
            fail(f"{m['dir']}: the pinned commit {pinned[:7]} is not in this checkout at "
                 "all, so nothing here can say whether a clone could fetch it — fetch the "
                 "submodule before trusting this pin")
        else:
            _holders = g("for-each-ref", "--contains", pinned, "--format=%(refname:short)",
                         "refs/remotes")
            if _holders is not None and _holders.strip() == "":
                if g("rev-parse", "--is-shallow-repository") == "true":
                    _skips.append(f"{m['name']}: shallow clone — no remote ref can be shown "
                                  f"to contain the pinned {pinned[:7]}, so this could not be "
                                  "read here")
                else:
                    fail(f"{m['dir']}: the PIN names {pinned[:7]} and no remote ref contains "
                         "it — every clone fails with `upload-pack: not our ref`, while "
                         "`git submodule status` shows no `+` because the pointer matches "
                         "the LOCAL head. Push the submodule first, then commit the pointer")

        if g("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}") is None:
            # UM-08. Two very different states arrive here and they were reading the same.
            # `sheleg-design` sat in DETACHED HEAD at a tag while a close's commit landed on
            # no branch: remote `main` was still behind it, and the commit was reachable only
            # through the reflog — unreferenced, and collectable. This guard behaved honestly
            # (it disclosed rather than passing) but a disclosure among many is a disclosure
            # nobody reads, and the work was nearly lost.
            #
            # So the two cases are separated. No upstream on a BRANCH is a fresh clone: still
            # a disclosure. No upstream, detached HEAD, and commits reachable from no branch
            # at all is a FAILURE — the work can be garbage-collected, which is worse than
            # unpushed.
            head = g("rev-parse", "--abbrev-ref", "HEAD")
            if head == "HEAD":
                # `git branch --contains HEAD` is the wrong instrument here: in a detached
                # checkout it prints `* (HEAD detached from …)`, which is not a branch and
                # is not empty — the first version of this guard read that as "a branch
                # holds it" and disclosed instead of failing, against its own plant.
                # `refs/tags` belongs in this list and was missing. A TAG is a permanent
                # ref: a commit it names cannot be collected, which is the whole hazard this
                # guard exists for. `telegram-dev` was pinned at its own v0.1.3 tag and the
                # release job failed here, correctly by the letter and wrongly by the reason.
                holders = g("for-each-ref", "--contains", "HEAD", "--format=%(refname:short)",
                            "refs/heads", "refs/remotes", "refs/tags")
                unreachable = holders is not None and holders.strip() == ""
                # And a SHALLOW clone cannot answer the question at all: the history that
                # would show a ref containing HEAD was never fetched, so every pin looks
                # unreachable. `release.yml` clones submodules at depth 1 while `validate.yml`
                # uses depth 0, which is why one job failed and the other passed on the same
                # tree. A check that cannot look must not read as one that looked.
                if unreachable and g("rev-parse", "--is-shallow-repository") == "true":
                    _skips.append(f"{m['name']}: detached in a SHALLOW clone — no ref can be "
                                  "shown to contain HEAD because the history was never "
                                  "fetched, so this could not be read here")
                    continue
                if unreachable:
                    sha = g("rev-parse", "--short", "HEAD") or "?"
                    fail(f"{m['dir']}: detached at {sha} and that commit is on no branch — it "
                         "is reachable only through the reflog and a `git gc` may collect it. "
                         "Put it on a branch before anything pins it: "
                         f"`git -C {m['dir']} switch -c recovered-{sha}` or "
                         f"`git -C {m['dir']} branch -f main {sha}`")
                    continue
                _skips.append(f"{m['name']}: detached at a commit that IS on a branch, so "
                              "whether it is pushed could not be read from here")
                continue
            _skips.append(f"{m['name']}: no upstream ref here, so whether its commits are "
                          "pushed could not be read")
            continue
        ahead = g("log", "@{u}..HEAD", "--oneline")
        if ahead:
            # Local work exists. Whether the PIN depends on it was answered above; this is
            # a member mid-run, which is not this guard's hazard — disclosed so the
            # information is not lost, never failed.
            _n = len(ahead.split("\n"))
            _skips.append(f"{m['name']}: {_n} commit(s) exist only locally and no pin of "
                          "this repository names them — in-flight work")


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
        cells = [c.strip() for c in re.split(r"(?<!\\)\|", line)]
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
        cells = [c.strip() for c in re.split(r"(?<!\\)\|", line)]
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


def check_a_status_cell_opens_with_its_verdict():
    """A row's state is the FIRST thing in its status cell, or the row has no state.

    Watched happening rather than imagined. On 2026-09-03 an annotation was prepended to
    `B-84`'s status — accurate, useful, and it pushed `open` behind 300 characters of
    prose. The open count silently fell from 9 to 8: every reader of this board anchors
    on the verdict, and a cell beginning with a date reads as a row nobody has ruled on.

    Nothing here caught it. `check_no_id_carries_two_verdicts` looks for a row claiming
    two states and this row now claimed none; the waiver check anchors `^waived` and
    simply did not match. **Both existing guards ask what the cell SAYS; neither asked
    where it says it**, which is the same gap `B-108` records about a board read one of
    nine.

    Deliberately a prefix rule and not a parser. The vocabulary is small and closed, and
    a check that tried to recognise *a verdict* anywhere in free text could not tell one
    from a sentence about one — the boundary this repository keeps crossing.
    """
    board = os.path.join(ROOT, "docs", "evidence", "backlog.md")
    if not os.path.isfile(board):
        _skips.append("board verdicts — no docs/evidence/backlog.md here")
        return
    with open(board, encoding="utf-8") as fh:
        lines = fh.read().splitlines()
    verdicts = ("open", "closed", "half closed", "waived", "superseded", "duplicate")
    looked = 0
    for line in lines:
        if not re.match(r"^\|\s*B-\d+\s*\|", line):
            continue
        cells = [c.strip() for c in re.split(r"(?<!\\)\|", line)]
        if len(cells) < 9:
            continue
        rid, status = cells[1], cells[8]
        head = status.lstrip("*").lower()
        looked += 1
        if not any(head.startswith(v) for v in verdicts):
            fail(f"docs/evidence/backlog.md: row {rid} opens its status with "
                 f"{status[:48]!r} — a status cell states its verdict FIRST or the row "
                 f"reads as having none. Put one of {'/'.join(verdicts)} at the front and "
                 "the annotation after it")
    if not looked:
        _skips.append("board verdicts — no row was readable")


check_a_status_cell_opens_with_its_verdict()


def check_no_member_can_publish_bytecode() -> None:
    """A member's PACKING CONFIG must be unable to include `__pycache__`, not merely
    happen not to today.

    Found by auditing the tarballs and getting it wrong first. `npm pack --dry-run` on
    this machine listed three `.pyc` files across two members and the audit reported them
    as shipping; the published tarballs carry **zero**, because `npm publish` runs from a
    fresh CI checkout where nothing has executed Python yet. That is standing instruction
    #10 — *a check that reads a working tree reports a state no clone can reproduce* —
    committed while auditing, which is the one place it costs most.

    So this reads the **configuration**, which every clone has, rather than the tree,
    which no two clones share. Three shapes are correct and all three exist in the family
    already, which is why the rule is a predicate rather than a required line:

    * no `files` key at all — npm falls back to `.gitignore`, where the exclusion works;
    * `files` naming individual `.py` paths (`super-ux`), so a sibling directory cannot
      ride along;
    * `files` naming a directory **plus a negation entry** (`agent-sync`,
      `seo-aeo-audit`) — `["plugins", "!plugins/**/__pycache__"]`.

    Verified against a positive control before this was written: with `files: ["plugins"]`
    a planted `.pyc` packs; with the negation entry it does not, and the `.py` still does.
    A root `.npmignore` and a root `.gitignore` were both measured NOT to subtract from
    `files`, which is why neither is accepted here as the mechanism.

    The subject list is derived, never typed: a member is in scope exactly when its packed
    tree contains Python. `sheleg-design` and `sheleg-dev` ship none and are silently out,
    which is the `#81` shape — a new Python-carrying member is covered by construction.
    """
    import fnmatch
    skdir = os.path.join(ROOT, "skills")
    offenders, examined = [], 0
    for s in skills:
        name = s.get("name")
        root = os.path.join(skdir, name)
        pkg_path = os.path.join(root, "package.json")
        if not os.path.isfile(pkg_path):
            continue
        try:
            with open(pkg_path, encoding="utf-8") as fh:
                files = (json.load(fh) or {}).get("files")
        except (OSError, ValueError):
            continue
        if not isinstance(files, list) or not files:
            continue                      # no allowlist -> .gitignore applies, and it works
        includes = [f for f in files if isinstance(f, str) and not f.startswith("!")]
        negations = [f[1:] for f in files if isinstance(f, str) and f.startswith("!")]
        risky = []
        for entry in includes:
            cand = os.path.join(root, entry.rstrip("/"))
            if not os.path.isdir(cand):
                continue                  # a named file cannot carry a sibling directory
            has_py = False
            for dirpath, dirnames, filenames in os.walk(cand):
                dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules")]
                if any(f.endswith(".py") for f in filenames):
                    has_py = True
                    break
            if has_py:
                risky.append(entry.rstrip("/"))
        if not risky:
            continue
        examined += 1
        # BOTH shapes, because a negation may exclude the DIRECTORY or the FILES and
        # either is sufficient — and `fnmatch` has no `**`, so a pattern ending in
        # `__pycache__` never matches a path ending in `x.pyc`. The first draft tested
        # only the file path and passed `agent-sync` by accident of its SECOND entry;
        # a downward plant on `make-skill` exposed it, which is the half a one-way
        # ratchet never has.
        cands = []
        for r in risky:
            for mid in ("", "scripts"):
                base = os.path.join(*(x for x in (r, mid, "__pycache__") if x))
                cands += [base, os.path.join(base, "x.pyc")]
        covered = any(fnmatch.fnmatch(c, neg) for c in cands for neg in negations)
        if not covered:
            offenders.append(name)

    if not examined:
        _skips.append("bytecode packing — no member names a directory carrying Python")
        return
    ratchet = 4
    if len(offenders) > ratchet:
        fail(f"{len(offenders)} member(s) can publish bytecode and the ratchet stands at "
             f"{ratchet}: {', '.join(sorted(offenders))}. Add "
             'the PAIR `"!plugins/**/__pycache__"` and `"!plugins/**/*.pyc"` to `files` '
             'in each — the two members that already carry it carry both, and it is '
             'measured against a positive control, where a root `.npmignore` and a '
             "root `.gitignore` do not subtract from `files` at all")
    elif len(offenders) < ratchet:
        fail(f"only {len(offenders)} member(s) can publish bytecode where the ratchet "
             f"stands at {ratchet} — lower it to {len(offenders)} in the same change, or "
             "the number stops meaning anything")
    for n in sorted(offenders):
        _skips.append(f"bytecode packing — {n}'s `files` could include `__pycache__`; "
                      "its published tarball is clean only because the release runs from "
                      "a fresh CI checkout")


check_no_member_can_publish_bytecode()


def check_the_description_reserve_is_not_spent() -> None:
    """The 970 limit is a RESERVE, and twelve of twenty-eight skills have spent it.

    `make-skill`'s house rule caps a description at 970 against the standard's 1024,
    and says what the 54 characters are for: *leave room for the "what this is NOT for"
    clause a near-miss neighbour will require*. It is enforced per skill, in each
    member's own CI, one skill at a time — so nothing has ever seen the shape of it
    across the family, and the shape is the finding.

    Measured 2026-09-05 with the auditor's own figures: **12 of 28** skills sit within
    60 characters of the limit and `agent-interop` sits at **exactly 970**, which passes
    and leaves nothing. A reserve everyone spends to the last byte is a reserve in name
    only.

    **What it costs is measured by `test/route_coverage.js`, and this guard no longer
    states it.** It used to, in a hand-typed sentence — *8 blocked, 10 not blocked* —
    and on 2026-09-05 the sentence was wrong in both halves and in two of its four
    figures. It gave `super-ux` **341** free characters; that route is fronted by
    `ux-flows`, which has **5**. It gave `sheleg-dev` 149; `stripe-billing` has **7**.
    Computed, the split is the near-inverse of what was claimed. A guard whose subject
    is *a reserve everyone spends* had spent this repository's own rule — that a number
    is computed and not restated — inside its own disclosure.

    The split is computed where the misses live and the route→skill map is one `require`
    away, and this guard discloses only what it measures: the tight count, and which
    skills have nothing left. `test/triggers_test.js` asserts the disclosure carries no
    hand-typed split, so the sentence cannot grow back.

    A ratchet and not a failure: the descriptions are each member's to trim, on each
    member's own release, and a check that turned twelve skills red here would be the
    umbrella failing for work it does not own.
    """
    import glob
    skdir = os.path.join(ROOT, "skills")
    tight, total = [], 0
    for s in skills:
        for f in glob.glob(os.path.join(skdir, s.get("name") or "",
                                        "plugins", "*", "skills", "*", "SKILL.md")):
            try:
                with open(f, encoding="utf-8") as fh:
                    body = fh.read()
            except OSError:
                continue
            fm = re.match(r"^---\n(.*?)\n---", body, re.S)
            if not fm:
                continue
            dm = re.search(r"^description:\s*(?:[>|]-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|\Z)",
                           fm.group(1), re.M)
            if not dm:
                continue
            n = len(re.sub(r"\s+", " ", dm.group(1)).strip())
            total += 1
            if 970 - n < 60:
                tight.append((os.path.basename(os.path.dirname(f)), 970 - n))
    if not total:
        _skips.append("description reserve — no member is materialised to measure")
        return
    ratchet = 12
    if len(tight) > ratchet:
        worst = ", ".join(f"{k} ({h})" for k, h in sorted(tight, key=lambda x: x[1])[:6])
        fail(f"{len(tight)} of {total} skills sit within 60 characters of the 970 "
             f"reserve and the ratchet stands at {ratchet}: {worst}. The 54 characters "
             "exist for the 'what this is NOT for' clause a near-miss neighbour will "
             "require, and a reserve spent to the last byte is a reserve in name only")
    elif len(tight) < ratchet:
        fail(f"only {len(tight)} of {total} skills are within 60 characters of the 970 "
             f"reserve where the ratchet stands at {ratchet} — lower it to {len(tight)} "
             "in the same change, or the number stops meaning anything")
    zero = [k for k, h in tight if h <= 0]
    if zero:
        _skips.append("description reserve — " + ", ".join(sorted(zero))
                      + " sit at or past 970 with nothing left; adding a routing trigger "
                        "there requires a trim first")
    _skips.append(f"description reserve — {len(tight)} of {total} skills within 60 "
                  "characters. What it costs routing is computed by "
                  "`node test/route_coverage.js`, which prints the blocked/free split "
                  "per miss; this guard states no split of its own")


check_the_description_reserve_is_not_spent()


# ---------------------------------------------------------------------------
# Every address these documents claim, resolved
# ---------------------------------------------------------------------------
# The extractor and the resolver are in `test/doc_refs.py`, fixtured without a tree by
# `test/doc_refs_test.py`. What lives here is the CORPUS and its boundary -- the only two
# decisions a reader of this file has to argue with.
#
# The corpus is SPLIT, and the split is the whole design. Two kinds of document live in
# this repository and only one of them makes a claim a reader can act on today.
#
#   LIVE_DOCS describe THIS repository and are read as instructions. An address here is a
#   promise: open this file, run this command. Enforced.
#
#   LEDGER_DOCS are the family board and its dated records. Their rows cite MEMBER
#   repositories -- `test/negatives.py` is task-pipeline's, `scripts/check-docs.sh` is
#   seo-aeo-audit's -- and states that were true at a commit, such as
#   `.agent-sync/leases/B-31.lock`, whose REMOVAL is the verified fact. Enforcing
#   resolution there would demand rewriting past-run records, which this repository has
#   already decided against in writing (`docs/DOCMAP.md`, propagation matrix: *"155
#   occurrences of the old name survive inside past-run records on purpose, because a brief
#   describes where things were when it was written"*). They are COUNTED and DISCLOSED, so
#   the boundary is visible on every run rather than remembered.
#
# `docs/evidence/manifesto-conformance.md` is a ledger for a second reason as well: the
# program it tracks gives it a single writer, and that writer is not this gate.
LIVE_DOCS = ("README.md", "CLAUDE.md", "docs/DOCMAP.md", "docs/AGENT_SYNC.md",
             "docs/evidence/convergence.md")
LEDGER_DOCS = ("docs/evidence/backlog.md", "docs/evidence/verification.md",
               "docs/evidence/retro.md", "docs/evidence/retro/2026-Q3.md",
               "docs/evidence/manifesto-conformance.md")

# Directory names that belong to a consuming project or to a member, not to an address
# here. Each carries its reason: an exception with no reason cannot be told from an
# oversight by whoever reads this next.
ELSEWHERE = {
    "docs/ux/": "the design chain `super-ux` creates in the product that installs it",
    "docs/brand/": "the brand pack `super-ux` creates in the product that installs it",
    "docs/superpowers/": "the artifact root a host project may still be on -- DOCMAP's "
                         "propagation matrix says such a project is never warned",
}


def _claimed(doc, prefixes):
    """Every address one document claims, de-duplicated, first line kept."""
    path = os.path.join(ROOT, doc)
    if not os.path.isfile(path):
        return None
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    seen, out = set(), []
    # The document's own directory, so a `../`-relative link is resolved the way a reader's
    # click resolves it. `docs/evidence/convergence.md` gained two such links in the same
    # change that added this guard, and without this they were skipped in silence.
    docdir = os.path.dirname(doc)
    for kind, lineno, tok in doc_refs.addresses(text, prefixes, ELSEWHERE, docdir):
        key = ("npm" if kind == "npm" else "path", tok)
        if key in seen:
            continue
        seen.add(key)
        out.append((kind, lineno, tok))
    return out


def check_every_address_these_documents_claim_resolves():
    """A repository about resolvable addresses shipped two that do not resolve.

    Measured 2026-08-19, UM-03, manifesto requirement M-07 -- *if the address does not
    resolve, the claim is not proven*. `README.md:66` told a reader that
    `npm run test:negatives` *"feeds every guard a planted defect and requires it to reject
    one"*; that script is `task-pipeline`'s and here it exits 1 with `Missing script`, so
    the one row of the manifesto table about watching a guard fail could not be run.
    `docs/evidence/convergence.md:10` named `scripts/check-convergence.sh` as the thing
    demanding a record, and `scripts/` has never held it.

    Neither was found by reading. Both were found by resolving every address in the same
    nine documents at once -- **83** in the enforced corpus, plus the records, whose own
    dead/total this run prints rather than restates -- and nothing else in the enforced corpus was dead. That is
    the argument for a check rather than a third careful proofread: a reference rots one at a
    time, and a document is read whole.

    Three claim classes, because each of the two defects belonged to a different one and
    closing either leaves the rest. Disclosure, never silence, where a submodule is absent:
    a check that cannot look must not read as one that looked.
    """
    prefixes = doc_refs.local_prefixes(ROOT)
    scripts = (load_json("package.json") or {}).get("scripts", {})
    absent, checked = [], 0
    for doc in LIVE_DOCS:
        claims = _claimed(doc, prefixes)
        if claims is None:
            _skips.append(f"claimed addresses -- no {doc} in this checkout")
            continue
        for kind, lineno, tok in claims:
            if kind == "npm":
                checked += 1
                if tok not in scripts:
                    fail(f"{doc}:{lineno}: `npm run {tok}` names no script in package.json "
                         f"(it has {sorted(scripts)}) -- a reader told to run it gets exit 1 "
                         f"and `Missing script`. Point the claim at what runs here, or add "
                         f"the script (M-07)")
                continue
            ok, detail = doc_refs.resolve(ROOT, tok)
            if ok is None:
                absent.append(f"{doc}:{lineno} {tok}")
                continue
            checked += 1
            if not ok:
                fail(f"{doc}:{lineno}: `{tok}` does not resolve -- {detail}. A document "
                     f"about resolvable addresses cannot ship one that is not: point it at "
                     f"what exists, or create what it names (M-07)")
    if not checked:
        fail("claimed addresses: the extractor matched nothing in any of "
             f"{len(LIVE_DOCS)} documents -- that is the extractor breaking, not five "
             "documents that stopped citing anything, and an empty corpus passes everything")
    if absent:
        _skips.append(f"claimed addresses -- {len(absent)} point into submodules that are "
                      f"not checked out: {', '.join(absent[:3])}")
    # The records, counted rather than gated. The number is how a later run learns that a
    # class this gate declines to enforce is growing, instead of inferring it from silence.
    tally = []
    for doc in LEDGER_DOCS:
        claims = _claimed(doc, prefixes)
        if claims is None:
            continue
        dead = 0
        for kind, _, tok in claims:
            if kind == "npm":
                dead += tok not in scripts
            elif doc_refs.resolve(ROOT, tok)[0] is False:
                dead += 1
        tally.append(f"{doc} {dead}/{len(claims)}")
    if tally:
        _skips.append("claimed addresses -- not gated in the dated records, whose rows cite "
                      "member repositories and past states on purpose (dead/total): "
                      + "; ".join(tally))


check_every_address_these_documents_claim_resolves()


def check_counted_claims_agree_with_the_tree():
    """Every number this repository states about itself, recomputed.

    Three of them were wrong on 2026-08-20, all three in documents whose subject is
    that numbers are computed rather than carried:

    * `README.md` said **20** negative self-tests against a workflow defining 21 — in
      the one row of the manifesto table about watching a guard fail.
    * `docs/evidence/verification.md` said **119** id'd rows / **113** verified. The
      pattern it quotes gives 129, and a pattern matching every id shape the file
      actually uses — `U3-01`, `B29-1`, `I4-3` are invisible to `[A-Z]+-[0-9]+` — gives
      **407 / 401**. The narrow count had been wrong by 10 and blind to 278.
    * `docs/evidence/manifesto-conformance.md`'s own Program state table said 32 active
      rows, all open, none verified, beside the awk recipe printing 41 and a file where
      19 rows read `verified`.

    A registry rather than three checks, because the class is the point: the fix for a
    restated number is a command, and the cost of citing your own tree is registering
    the citation. Same shape as `task-pipeline`'s claim registry and `pod-manifesto`'s
    CLAIMS — deliberately, so the family has one idea here and not three.

    Each entry is (label, pattern over a document, a callable returning the truth). The
    pattern must capture the number; a pattern that matches nothing is a FAILURE, not a
    pass, because that is how the claim registry in the member repo went dormant while
    the false number shipped.
    """
    wf = os.path.join(ROOT, ".github", "workflows", "validate.yml")
    ledger = os.path.join(ROOT, "docs", "evidence", "verification.md")
    conf = os.path.join(ROOT, "docs", "evidence", "manifesto-conformance.md")

    def read(path):
        if not os.path.isfile(path):
            return None
        with open(path, encoding="utf-8") as fh:
            return fh.read()

    def plants():
        text = read(wf)
        return None if text is None else len(re.findall(r"name: Negative self-test", text))

    def ledger_rows():
        text = read(ledger)
        if text is None:
            return None
        # The trailing-letter form (`PP-2a`) is an id this file uses and this counter
        # did not see, so disambiguating three collisions for B-103 made the counter
        # report three rows fewer than the file holds. The grammar is the one
        # `check_ledger_ids_are_unique_within_their_section` reads.
        return len(re.findall(r"(?m)^\|\s*[A-Za-z0-9]+-[0-9]+[a-z]?\s*\|", text))

    def ledger_verified():
        text = read(ledger)
        if text is None:
            return None
        rows = [l for l in text.splitlines()
                if re.match(r"^\|\s*[A-Za-z0-9]+-[0-9]+[a-z]?\s*\|", l)]
        return sum(1 for l in rows if "verified" in l)

    def conformance_state(which):
        text = read(conf)
        if text is None:
            return None
        n = 0
        for line in text.splitlines():
            if line.startswith("## Deferred"):
                break
            # `{1,4}`, swept from `_one_board` on the same day it was widened there
            # (R-003: run the fix against its siblings). At `{2}` this count
            # silently excluded `ALL-26`, `ALL-44` and `ALL-49` -- three rows
            # inside the register whose own stated totals then could not be
            # reconciled with the file by anyone reading it.
            if not re.match(r"^\| [A-Z]{1,4}-[0-9]", line):
                continue
            cells = [c.strip() for c in re.split(r"(?<!\\)\|", line)]
            state = re.sub(r"[*`]", "", cells[-2] if len(cells) > 2 else "").strip().lower()
            if state == which:
                n += 1
        return n

    def conformance_rows():
        text = read(conf)
        if text is None:
            return None
        rows = 0
        for line in text.splitlines():
            if line.startswith("## Deferred"):
                break
            if re.match(r"^\| [A-Z]{1,4}-[0-9]", line):
                rows += 1
        return rows

    def upstream_agents():
        """The count of agents the upstream CLI reaches.

        NOT computable here — it is a property of another project — so `skills.json`'s
        `agentsUpstream` is its single home, carrying the number, where it came from and
        the date it was read. This entry does not verify the number against the world;
        it holds every COPY of it to that one home. Before this, `scripts/site.js` typed
        `const agentCount = 70;` and rendered it on nine public surfaces including the OG
        card, while `README.md` carried `70+` twice — three homes, none of them checked,
        in the family that ships `evidence-docs`.
        """
        try:
            with open(os.path.join(ROOT, "skills.json"), encoding="utf-8") as fh:
                return int(json.load(fh)["agentsUpstream"]["count"])
        except Exception:
            return None

    registry = [
        ("upstream agent count", "README.md",
         r"(\d+)\+ agents the vercel", upstream_agents),
        ("negative self-tests", "README.md",
         r"\*\*(\d+)\*\* negative self-tests", plants),
        ("ledger rows", "docs/evidence/verification.md",
         r"Of the\s+\*\*(\d+)\*\* id'd requirement rows", ledger_rows),
        ("ledger rows verified", "docs/evidence/verification.md",
         r"id'd requirement rows below, \*\*(\d+)\*\* read", ledger_verified),
        ("conformance rows", "docs/evidence/manifesto-conformance.md",
         r"\*\*active total\*\* \| \*\*(\d+)\*\*", conformance_rows),
        ("conformance rows open", "docs/evidence/manifesto-conformance.md",
         r"By state, over those \d+ rows: \*\*(\d+) open", lambda: conformance_state("open")),
        ("conformance rows verified", "docs/evidence/manifesto-conformance.md",
         r"By state, over those \d+ rows: \*\*\d+ open · (\d+) verified",
         lambda: conformance_state("verified")),
    ]

    for label, doc, pattern, truth in registry:
        text = read(os.path.join(ROOT, doc))
        if text is None:
            _skips.append(f"counted claim `{label}` — {doc} absent")
            continue
        measured = truth()
        if measured is None:
            _skips.append(f"counted claim `{label}` — its source is absent, so the "
                          "stated figure could not be recomputed")
            continue
        found = re.search(pattern, text)
        if not found:
            fail(f"{doc}: the counted claim `{label}` matched nothing. A registered "
                 f"pattern that matches nothing is how a false number ships beside a "
                 f"green gate — the truth right now is {measured}")
            continue
        stated = int(found.group(1))
        if stated != measured:
            fail(f"{doc}: `{label}` states {stated}, the tree gives {measured} — "
                 f"recompute it rather than editing the guard")


check_counted_claims_agree_with_the_tree()


def check_a_new_conformance_row_cites_the_manifesto_line():
    """An `M-nn` with no line beside it points at nothing a reader can reach.

    The manifesto carries no requirement ids at all, and the extracted set the programme
    numbers against was never committed — so a row citing `M-40` and nothing else is
    citing a definition that exists in one session's scratchpad. Measured from the other
    side on 2026-08-20: `seo-aeo-audit`'s two closed rows rest on `M-40`, `M-32` and
    `M-08`, and `grep -rn` over the whole manifesto repository finds none of them.

    Grandfathering is enumerated in the file, never implied: the marker lists the rows
    that existed when this guard landed. Anything else must carry `manifesto.md:<line>`.
    An implicit cutoff (a date, a wave number) would be indistinguishable from a guard
    nobody wired, which is the failure this whole register is about.
    """
    path = os.path.join(ROOT, "docs", "evidence", "manifesto-conformance.md")
    if not os.path.isfile(path):
        _skips.append("manifesto-conformance.md absent — M-id citations unchecked")
        return
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    marker = re.search(r"<!--\s*m-cite-grandfathered:\s*([^>]*?)-->", text)
    if not marker:
        fail("docs/evidence/manifesto-conformance.md: no `m-cite-grandfathered` marker, "
             "so the M-id citation rule has no enumerated exemption and cannot be checked")
        return
    grandfathered = set(marker.group(1).split())
    # The anchor is a PHRASE, not a line. This guard's intent was always right and its
    # mechanism was on the wrong side of it: on 2026-08-24 all fourteen `manifesto.md:N`
    # references in the register had rotted -- eight off by twenty lines, one off by
    # fifty, and one pointing at a closing code fence since the day it was written --
    # while every rule they named was intact. A guard that MANDATED the rotting form is
    # worse than none, because the form still reads as a receipt.
    # `{1,4}`: at `{2}` this skipped every `ALL-` row, the same blind spot swept out of
    # `_one_board` and `conformance_state` in the commit before this one (R-003).
    for line in text.splitlines():
        if line.startswith("## Deferred"):
            break
        m = re.match(r"^\| ([A-Z]{1,4}-[0-9]+)", line)
        if not m:
            continue
        rid = m.group(1)
        if rid in grandfathered:
            continue
        if not re.search(r"M-[0-9]{2}", line):
            continue
        if "`manifesto` \u2192 *\"" not in line:
            fail(f"docs/evidence/manifesto-conformance.md: row {rid} cites an M-id with no "
                 "resolvable anchor beside it. The ids exist in no committed artifact "
                 "(UM-12), so the phrase is what a reader can reach: "
                 "`manifesto` \u2192 *\"a distinctive phrase from the rule\"*, which "
                 "`check_manifesto_citations_resolve` then looks up")


check_a_new_conformance_row_cites_the_manifesto_line()


def check_a_new_ledger_section_can_expire():
    r"""Proof expires, and this ledger had only one end of that.

    UM-05, manifesto requirement M-43 (`manifesto` → *"Evidence remains attached to the
    state it observed"* — the record states both what it
    applies to and what would invalidate it*). 407 rows here read `verified` and
    `grep -c 'Observed at\|invalidat'` returned **0**: nothing could ever un-read one.
    `task-pipeline` shipped the mechanism on 2026-08-17 and the umbrella did not adopt it
    for three days.

    Deliberately not retroactive. Back-filling an observation for a row nobody re-checked
    answers the question wrongly instead of not at all, which this file argues one screen
    above its own table. So the requirement starts at the section that introduced the
    columns: **a section dated 2026-08-20 or later must carry `Observed at` and
    `Invalidated by` in its table header.** The cutoff is a date in the file rather than a
    row list because sections are dated by their own heading, and that is the one fact a
    new section cannot forget to state.
    """
    path = os.path.join(ROOT, "docs", "evidence", "verification.md")
    if not os.path.isfile(path):
        _skips.append("verification.md absent — the expiry contract is unchecked")
        return
    with open(path, encoding="utf-8") as fh:
        lines = fh.read().splitlines()
    CUTOFF = "2026-08-20"
    section, header_seen = None, False
    for line in lines:
        m = re.match(r"^##\s+(\d{4}-\d{2}-\d{2})\s*—\s*(.*)$", line)
        if m:
            section = (m.group(1), m.group(2)) if m.group(1) >= CUTOFF else None
            header_seen = False
            continue
        if section and not header_seen and re.match(r"^\|\s*REQ\s*\|", line):
            header_seen = True
            missing = [c for c in ("Observed at", "Invalidated by") if c not in line]
            if missing:
                fail(f"docs/evidence/verification.md: the section dated {section[0]} carries "
                     f"no {' and no '.join(missing)} column — a row nothing can invalidate "
                     "is a row that reads as current forever (M-43)")


check_a_new_ledger_section_can_expire()

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

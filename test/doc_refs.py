#!/usr/bin/env python3
"""What address does a document claim, and does it resolve?

Manifesto requirement M-07: *every completion claim between an intended outcome and an
accepted result must point to its supporting record at an address another actor can
resolve; if the address does not resolve, the claim is not proven.* This module is the
half that can be fixtured — the extractor and the resolver, taking text and a tree and
returning answers, so the guard in `validate.py` only has to name a corpus.

Measured 2026-08-19 (UM-03): a repository whose README is about resolvable addresses was
shipping two that were not. `README.md:66` told a reader that `npm run test:negatives`
*"feeds every guard a planted defect"* — that script belongs to `task-pipeline`, and here
it exits 1 with `Missing script`. `docs/evidence/convergence.md:10` named
`scripts/check-convergence.sh`, and `scripts/` has never held a file by that name. A wide
sweep of the same nine documents found nothing else dead in the enforced corpus, which is
the point: references rot one at a time, and nothing was looking.

**Three claim classes, because a reference dies in three ways.** An `npm run <script>`
naming no script in `package.json`; a `scripts/*.sh` naming no file, backticked or in
prose; a path — with its `:line` when it carries one — naming nothing. Closing one leaves
the other two, and each of the two real defects belonged to a different class.

**What is deliberately NOT an address**, because a gate with false positives gets switched
off and this one has to survive being read by whoever it reddens:

- a **link label**. `README.md:69` labels a link `scripts/graph.py` and points it at the
  member file that exists; the reader lands on the right file. Read targets, not labels.
- a **placeholder** — `hooks/<name>.js`, `docs/evidence/briefs/…`, `skills/*/…`.
- a path with **no local prefix**. `references/acceptance.md` is another repository's
  doctrine cited bare, and demanding this tree create it would be the wrong repair. This
  repository has already been bitten here: `docs/evidence/retro.md` records a link regex in
  `validate.py` reporting that `agent-interop` links a `governance.md` it does not have,
  when the text was *prose about a sibling skill's file* — the regex could not tell a path
  being **used** from one being **discussed**, and it was caught by the build, on a file
  nobody had claimed.
- a `$HOME` path. `~/.claude/CLAUDE.md` is machine state, not a shipped address.
- an entry the caller passes in `elsewhere`, each carrying its own reason — an exception
  with no reason cannot be told from an oversight by the next reader.

`local_prefixes` is discovered from the tree rather than listed. Three hand-kept lists in
this family each missed a shipped surface, and none of the misses was found by the guard
holding the list.
"""
import os
import re

_LINK = re.compile(r"\[([^\]\n]*)\]\(([^)\s]+)\)")
_TICK = re.compile(r"`([^`\n]+)`")
_NPM = re.compile(r"npm run ([A-Za-z0-9:_.-]+)")
_SCRIPT = re.compile(r"(?<![\w/.:-])(scripts/[A-Za-z0-9._-]+\.(?:sh|py))")
# `…` is U+2026; `...` is caught by the dot-run below. Whitespace lands here too: a
# backticked phrase is prose, not a path.
_PLACEHOLDER = re.compile(r"[<>{}$*\s…]|\.\.\.")
_LINE = re.compile(r"^(.*?):(\d+)(?:-\d+)?$")

# Generated or untracked, so a reference into one is not a claim about the shipped tree.
_NOT_SHIPPED = ("node_modules", "graphify-out")


def local_prefixes(root):
    """What a repo-local address may start with, read from `root` itself.

    Directories come back with a trailing slash so `docs/` matches `docs/DOCMAP.md` and
    never a member's `docsomething`. Dotfiles are excluded apart from `.github`, which
    ships workflows that documents cite by path.
    """
    out = set()
    for name in sorted(os.listdir(root)):
        if name in _NOT_SHIPPED or (name.startswith(".") and name != ".github"):
            continue
        out.add(name + "/" if os.path.isdir(os.path.join(root, name)) else name)
    return out


def _local(tok, prefixes, elsewhere, docdir=""):
    """The token as a repo-local address, or None if it is not one.

    A `../`-relative target is normalised against `docdir` — the directory of the document
    that claimed it, which is what a reader's link actually resolves against.
    `docs/evidence/convergence.md` links a member file as `../../skills/…`; with no docdir
    there is nothing to resolve against, and measuring it from the wrong root would be worse
    than declining, so it is declined. A walk that escapes the repository is not an address
    in it.
    """
    tok = re.sub(r"^\./", "", tok.strip()).split("#")[0]
    if not tok or _PLACEHOLDER.search(tok) or tok.startswith(("~", "/", "http", "mailto:")):
        return None
    if tok.startswith("../"):
        if not docdir:
            return None
        tok = os.path.normpath(os.path.join(docdir, tok))
        if tok.startswith(".."):
            return None
    bare = re.sub(r":\d+(-\d+)?$", "", tok)
    if any(bare.startswith(e) for e in elsewhere):
        return None
    dirs = tuple(p for p in prefixes if p.endswith("/"))
    return tok if (bare in prefixes or (dirs and bare.startswith(dirs))) else None


def addresses(text, prefixes, elsewhere, docdir=""):
    """Yield `(kind, line number, token)` for every address `text` claims.

    Kinds: `npm` (the script name alone), `link` (a markdown target), `script` (a
    `scripts/*.sh|py` named in prose), `path` (a backticked path). `docdir` is the claiming
    document's own directory, so a `../`-relative link resolves the way a reader's click
    does. The caller decides what to do about duplicates — reporting a line number per
    occurrence is what lets it point at the row a reader would actually be standing on.
    """
    for lineno, raw in enumerate(text.splitlines(), 1):
        for _label, target in _LINK.findall(raw):
            tok = _local(target, prefixes, elsewhere, docdir)
            if tok:
                yield ("link", lineno, tok)
        # The label of a link is not an address; drop the whole span before reading ticks.
        line = _LINK.sub(" ", raw)
        for name in _NPM.findall(line):
            yield ("npm", lineno, name)
        ticked = set()
        for tok in _TICK.findall(line):
            local = _local(tok, prefixes, elsewhere, docdir)
            if local:
                ticked.add(local)
                yield ("path", lineno, local)
        for name in _SCRIPT.findall(_TICK.sub(" ", line)):
            tok = _local(name, prefixes, elsewhere, docdir)
            if tok and tok not in ticked:
                yield ("script", lineno, tok)


def resolve(root, rel):
    """`(ok, detail)` for one repo-local address.

    `ok` is `True`, `False`, or `None` for *unknown* — an address into a submodule that is
    not checked out. None must never collapse into False: a fresh clone or a CI job without
    `submodules: recursive` would otherwise turn every member citation red, and a gate that
    is red on arrival teaches its repository that the gate is noise.

    A `:line` past the end of the file is not resolved either. The file opens and the claim
    points at nothing, which `test -e` calls fine — and that is the shape of a citation
    that was true when it was written.
    """
    m = _LINE.match(rel)
    line = int(m.group(2)) if m else None
    path = m.group(1) if m else rel
    full = os.path.join(root, path)
    if not os.path.exists(full):
        parts = path.split("/")
        if parts[0] == "skills" and len(parts) > 2:
            sub = os.path.join(root, parts[0], parts[1])
            if not os.path.exists(os.path.join(sub, ".git")):
                return None, f"submodule {parts[1]} not checked out"
        return False, "no such path"
    if line is not None and os.path.isfile(full):
        with open(full, encoding="utf-8", errors="replace") as fh:
            n = sum(1 for _ in fh)
        if line > n:
            return False, f"cited line {line}, file has {n}"
    return True, ""

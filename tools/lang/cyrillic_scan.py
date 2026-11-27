#!/usr/bin/env python3
"""Measure Cyrillic (Russian) text in a repository's system documentation.

Stdlib only. Two commands:

  scan ROOT [ROOT ...] [--name NAME] [--allow GLOB] [--top N]
      Walk each root with os.walk, hidden folders included, and print one JSON
      document: per repository, files and lines that contain Cyrillic, by kind.
  check ROOT [--kinds doc,comment] [--paths P ...] [--allow GLOB]
      Exit 1 when a line of the given kinds carries Cyrillic outside the
      exceptions; print each offending file:line to stderr. Meant for CI and
      pre-commit hooks (pass the staged files with --paths).

Kinds of a Cyrillic line:
  doc       a line of a documentation file (.md, .mdx, .rst, .txt, .adoc)
  comment   a comment or docstring line in a code file
  string    any other Cyrillic line in a code file (UI text, prompts, logs)
  config    a line of a JSON, YAML, TOML, XML or similar file
  other     a line of any other text file
  locale    a line of a locale file (locales/ru, *.ru.json, ru.lproj, values-ru, ru.po);
            excepted: a localized UI keeps Russian in its locale files
  quote     a blockquote line (starts with ">") or a line whose Cyrillic sits only
            inside «» quotes: the owner's verbatim words, which stay as quoted
  excepted  a line of a file matched by an allow glob (--allow or the repository's
            .cyrillic-allow file): a specific user's own settings

"System docs" are doc + comment + config + other. Strings are reported apart: they
are usually UI text that moves to a locale file with an English source, which is
extraction work, not translation.

Read-only: the scanner never writes into the scanned tree. Its JSON names a
repository by --name (or the folder name), never by its absolute path.
"""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

SCANNER_ID = "cyrillic-scan/1"

CYRILLIC = re.compile("[Ѐ-ӿԀ-ԯ]")
GUILLEMETS = re.compile("«[^»]*»")

SKIP_DIRS = {
    ".git", "node_modules", ".venv", "venv", "env", "dist", "build", "vendor",
    "__pycache__", ".next", ".nuxt", "target", "coverage", ".mypy_cache",
    ".pytest_cache", ".ruff_cache", ".tox", "Pods", "DerivedData", ".build",
    ".gradle", ".turbo", ".cache", "site-packages", ".svelte-kit", ".expo",
    ".parcel-cache", "bower_components", "Carthage",
}
LOCKFILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "uv.lock",
    "Cargo.lock", "Gemfile.lock", "composer.lock", "Podfile.lock", "Package.resolved",
    "bun.lockb", "bun.lock", "go.sum", "npm-shrinkwrap.json", "Pipfile.lock",
    "flake.lock", "mix.lock", "pubspec.lock",
}
BINARY_EXT = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".icns", ".bmp", ".tiff",
    ".heic", ".pdf", ".zip", ".gz", ".tgz", ".bz2", ".xz", ".7z", ".rar", ".jar",
    ".mp3", ".mp4", ".m4a", ".mov", ".wav", ".ogg", ".webm", ".avi", ".mkv",
    ".woff", ".woff2", ".ttf", ".otf", ".eot", ".so", ".dylib", ".dll", ".exe",
    ".bin", ".o", ".a", ".class", ".pyc", ".db", ".sqlite", ".sqlite3", ".glb",
    ".gltf", ".fbx", ".usdz", ".psd", ".sketch", ".fig", ".key", ".numbers",
    ".pages", ".docx", ".xlsx", ".pptx", ".car", ".mobileprovision", ".p12",
    ".lottie", ".riv", ".parquet", ".npy", ".pt", ".onnx", ".safetensors",
}
DOC_EXT = {".md", ".mdx", ".markdown", ".rst", ".txt", ".adoc", ".org"}
CONFIG_EXT = {
    ".json", ".jsonc", ".json5", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
    ".plist", ".xml", ".properties", ".env", ".xcconfig", ".entitlements",
}
HASH_COMMENT_EXT = {
    ".py", ".rb", ".sh", ".bash", ".zsh", ".fish", ".pl", ".r", ".ps1", ".nix",
    ".tf", ".mk", ".cmake", ".dockerfile",
}
SLASH_COMMENT_EXT = {
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".mts", ".cts", ".swift", ".kt",
    ".kts", ".java", ".go", ".rs", ".c", ".h", ".cc", ".cpp", ".hpp", ".m", ".mm",
    ".cs", ".php", ".dart", ".scala", ".groovy", ".gradle", ".vue", ".svelte",
    ".css", ".scss", ".sass", ".less", ".proto", ".zig",
}
DASH_COMMENT_EXT = {".sql", ".lua", ".hs", ".elm"}
MARKUP_EXT = {".html", ".htm", ".svg", ".astro", ".hbs", ".njk", ".jinja", ".j2", ".liquid", ".ejs"}
CODE_EXT = HASH_COMMENT_EXT | SLASH_COMMENT_EXT | DASH_COMMENT_EXT | MARKUP_EXT
CODE_NAMES = {"Dockerfile", "Makefile", "Procfile", "Justfile", "Rakefile", "Gemfile", "Brewfile"}

RU_TAG = r"ru(?:[-_][A-Za-z]{2})?"
LOCALE_PATTERNS = [
    re.compile(r"(^|/)(locales?|i18n|l10n|lang|langs|translations?|messages)/" + RU_TAG + r"(/|\.[A-Za-z0-9]+$)"),
    re.compile(r"(^|/)(locales?|i18n|l10n|lang|langs|translations?|messages)/(.*/)?" + RU_TAG + r"\.[A-Za-z0-9]+$"),
    re.compile(r"(^|/)[^/]+\." + RU_TAG + r"\.(json|ya?ml|po|xliff|xlf|strings|arb|properties|ts|js|md|mdx|toml)$"),
    re.compile(r"(^|/)" + RU_TAG + r"\.(json|ya?ml|po|xliff|xlf|strings|arb|properties)$"),
    re.compile(r"(^|/)" + RU_TAG + r"\.lproj/"),
    re.compile(r"(^|/)values-" + r"ru(-r[A-Z]{2})?" + r"/"),
]

KINDS = ("doc", "comment", "string", "config", "other", "locale", "quote", "excepted")
SYSTEM_KINDS = ("doc", "comment", "config", "other")
DEFAULT_MAX_BYTES = 1_000_000


# ---------------------------------------------------------------- classification

def _ext(rel: str) -> str:
    base = os.path.basename(rel)
    if base == "Dockerfile" or base.startswith("Dockerfile."):
        return ".dockerfile"
    return os.path.splitext(base)[1].lower()


def classify_kind(rel: str) -> str:
    """File kind by its repository-relative path: doc, code, config, locale or other."""
    rel = rel.replace(os.sep, "/")
    for pat in LOCALE_PATTERNS:
        if pat.search(rel):
            return "locale"
    ext = _ext(rel)
    if ext in DOC_EXT:
        return "doc"
    if ext in CODE_EXT or os.path.basename(rel) in CODE_NAMES:
        return "code"
    if ext in CONFIG_EXT:
        return "config"
    return "other"


def is_quote_line(line: str) -> bool:
    """A blockquote line, or one whose Cyrillic sits only inside «» quotes."""
    stripped = line.lstrip()
    if stripped.startswith(">"):
        return True
    if "«" not in line:
        return False
    return CYRILLIC.search(GUILLEMETS.sub("", line)) is None


def strip_guillemets(line: str, in_quote: bool):
    """(text outside «», still inside a quote at the end of the line)."""
    out = []
    for ch in line:
        if in_quote:
            if ch == "»":
                in_quote = False
        elif ch == "«":
            in_quote = True
        else:
            out.append(ch)
    return "".join(out), in_quote


class CodeState:
    """Multi-line comment state of one code file."""

    def __init__(self) -> None:
        self.block = False      # inside /* ... */ or <!-- ... -->
        self.block_end = "*/"
        self.docstring = None   # the open triple quote of a Python docstring


def _first_unquoted(line: str, token: str) -> int:
    """Index of token outside '...', "..." and `...`; -1 when absent."""
    quote = None
    i = 0
    while i < len(line):
        ch = line[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in "'\"`":
            quote = ch
        elif line.startswith(token, i):
            return i
        i += 1
    return -1


def classify_code_line(line: str, ext: str, state: CodeState) -> str:
    """comment or string for a Cyrillic line of a code file; updates state."""
    stripped = line.strip()
    if state.docstring:
        if state.docstring in stripped:
            state.docstring = None
        return "comment"
    if state.block:
        if state.block_end in line:
            state.block = False
        return "comment"
    if ext == ".py":
        for tq in ('"""', "'''"):
            if stripped.startswith(tq) or re.match(r"^[rRbBuU]{0,2}" + tq, stripped):
                rest = stripped.split(tq, 1)[1]
                if tq not in rest:
                    state.docstring = tq
                return "comment"
    starts = {
        "slash": ("//", "/*", "*", "<!--", "{/*"),
        "hash": ("#",),
        "dash": ("--",),
        "markup": ("<!--", "{#", "{{!--", "//", "/*", "*"),
    }
    family = (
        "hash" if ext in HASH_COMMENT_EXT or ext == "" else
        "slash" if ext in SLASH_COMMENT_EXT else
        "dash" if ext in DASH_COMMENT_EXT else
        "markup"
    )
    for tok in starts[family]:
        if stripped.startswith(tok):
            if tok in ("/*", "{/*") and "*/" not in stripped[len(tok):]:
                state.block, state.block_end = True, "*/"
            if tok == "<!--" and "-->" not in stripped[4:]:
                state.block, state.block_end = True, "-->"
            return "comment"
    first_cyr = CYRILLIC.search(line).start()
    inline = {"slash": ("//", "/*"), "hash": ("#",), "dash": ("--",), "markup": ("<!--",)}[family]
    for tok in inline:
        pos = _first_unquoted(line, tok)
        if 0 <= pos < first_cyr:
            if tok == "/*" and "*/" not in line[pos + 2:]:
                state.block, state.block_end = True, "*/"
            if tok == "<!--" and "-->" not in line[pos + 4:]:
                state.block, state.block_end = True, "-->"
            return "comment"
    return "string"


def _advance_code_state(line: str, ext: str, state: CodeState) -> None:
    """Track multi-line comments on lines without Cyrillic."""
    stripped = line.strip()
    if state.docstring:
        if state.docstring in stripped:
            state.docstring = None
        return
    if state.block:
        if state.block_end in line:
            state.block = False
        return
    if ext == ".py":
        for tq in ('"""', "'''"):
            if stripped.startswith(tq):
                if stripped.count(tq) == 1:
                    state.docstring = tq
                return
    if ext in SLASH_COMMENT_EXT or ext in MARKUP_EXT:
        pos = _first_unquoted(line, "/*")
        if pos >= 0 and "*/" not in line[pos + 2:]:
            state.block, state.block_end = True, "*/"
        pos = line.find("<!--")
        if pos >= 0 and "-->" not in line[pos + 4:]:
            state.block, state.block_end = True, "-->"


# ---------------------------------------------------------------- walking

def load_allow(root: str, extra=None) -> list:
    globs = list(extra or [])
    path = os.path.join(root, ".cyrillic-allow")
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as fh:
            for raw in fh:
                raw = raw.strip()
                if raw and not raw.startswith("#"):
                    globs.append(raw)
    return globs


def is_allowed(rel: str, globs) -> bool:
    for g in globs:
        if fnmatch.fnmatchcase(rel, g):
            return True
        if g.endswith("/**") and (rel == g[:-3] or rel.startswith(g[:-2])):
            return True
    return False


def _read_text(path: str, max_bytes: int):
    """(text, reason): reason is None, 'binary' or 'large'."""
    try:
        size = os.path.getsize(path)
    except OSError:
        return None, "unreadable"
    if size > max_bytes:
        return None, "large"
    try:
        with open(path, "rb") as fh:
            data = fh.read()
    except OSError:
        return None, "unreadable"
    if b"\x00" in data[:8192]:
        return None, "binary"
    return data.decode("utf-8", errors="replace"), None


def iter_files(root: str):
    """Yield (relative path, skip reason or None), hidden folders included."""
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for name in sorted(filenames):
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            if os.path.islink(full):
                continue
            if name in LOCKFILES:
                yield rel, "lockfile"
            elif _ext(rel) in BINARY_EXT:
                yield rel, "binary"
            else:
                yield rel, None


def scan_file(root: str, rel: str, allow, max_bytes: int):
    """(counts by kind, offending line numbers by kind, skip reason)."""
    text, reason = _read_text(os.path.join(root, rel), max_bytes)
    if reason:
        return None, None, reason
    if not CYRILLIC.search(text):
        return {}, {}, None
    file_kind = classify_kind(rel)
    excepted = is_allowed(rel, allow)
    ext = _ext(rel)
    state = CodeState()
    counts, where = {}, {}
    in_quote = False  # a «» quote wrapped across lines (non-code files)
    for no, line in enumerate(text.splitlines(), 1):
        was_in_quote = in_quote
        if file_kind != "code":
            outside, in_quote = strip_guillemets(line, in_quote)
        if not CYRILLIC.search(line):
            if file_kind == "code":
                _advance_code_state(line, ext, state)
            continue
        if file_kind not in ("code", "locale") and not excepted and (was_in_quote or "«" in line):
            if not CYRILLIC.search(outside):
                counts["quote"] = counts.get("quote", 0) + 1
                where.setdefault("quote", []).append(no)
                continue
        if excepted:
            kind = "excepted"
        elif file_kind == "locale":
            kind = "locale"
        else:
            if file_kind == "code":
                kind = classify_code_line(line, ext, state)
            else:
                kind = file_kind
            if kind != "string" and is_quote_line(line):
                kind = "quote"
            elif kind == "string" and is_quote_line(line) and line.lstrip().startswith(">"):
                kind = "quote"
        counts[kind] = counts.get(kind, 0) + 1
        where.setdefault(kind, []).append(no)
    return counts, where, None


def git_info(root: str) -> dict:
    def run(*args):
        try:
            out = subprocess.run(
                ["git", "-C", root, *args], capture_output=True, text=True, timeout=30
            )
            return out.stdout.strip() if out.returncode == 0 else None
        except (OSError, subprocess.SubprocessError):
            return None

    remote = run("remote", "get-url", "origin")
    owner = None
    if remote:
        m = re.search(r"[:/]([^/:]+)/[^/]+?(?:\.git)?/?$", remote)
        owner = m.group(1) if m else None
    return {"head": run("rev-parse", "HEAD"), "remote_owner": owner}


def scan_repo(root: str, name=None, allow=None, top: int = 25, max_bytes: int = DEFAULT_MAX_BYTES,
              with_git: bool = False) -> dict:
    allow = load_allow(root, allow)
    kinds = {k: {"files": 0, "lines": 0} for k in KINDS}
    skipped = {"binary": 0, "lockfile": 0, "large": 0, "unreadable": 0}
    per_file = []
    scanned = 0
    for rel, reason in iter_files(root):
        if reason:
            skipped[reason] += 1
            continue
        counts, _, reason = scan_file(root, rel, allow, max_bytes)
        if reason:
            skipped[reason] += 1
            continue
        scanned += 1
        if not counts:
            continue
        for kind, n in counts.items():
            kinds[kind]["files"] += 1
            kinds[kind]["lines"] += n
        sys_lines = sum(counts.get(k, 0) for k in SYSTEM_KINDS)
        per_file.append({
            "path": rel,
            "lines": sum(counts.values()),
            "system_lines": sys_lines,
            "kinds": dict(sorted(counts.items())),
        })
    sys_files = sum(1 for f in per_file if f["system_lines"])
    sys_lines = sum(kinds[k]["lines"] for k in SYSTEM_KINDS)
    per_file.sort(key=lambda f: (-f["lines"], f["path"]))
    result = {
        "repo": name or os.path.basename(os.path.abspath(root)),
        "files_scanned": scanned,
        "files_with_cyrillic": len(per_file),
        "skipped": skipped,
        "kinds": kinds,
        "system_docs": {"files": sys_files, "lines": sys_lines},
        "top_files": per_file[:top] if top else [],
    }
    if with_git:
        result["git"] = git_info(root)
    return result


# ---------------------------------------------------------------- CLI

def _check(root: str, kinds, paths, allow, max_bytes: int) -> int:
    allow = load_allow(root, allow)
    if paths:
        targets = []
        for p in paths:
            rel = os.path.relpath(os.path.abspath(p), os.path.abspath(root)) if os.path.isabs(p) else p
            rel = rel.replace(os.sep, "/")
            parts = rel.split("/")
            if any(part in SKIP_DIRS for part in parts[:-1]) or parts[-1] in LOCKFILES:
                continue
            if _ext(rel) in BINARY_EXT or not os.path.isfile(os.path.join(root, rel)):
                continue
            targets.append(rel)
    else:
        targets = [rel for rel, reason in iter_files(root) if not reason]
    failures = 0
    for rel in targets:
        counts, where, reason = scan_file(root, rel, allow, max_bytes)
        if reason or not counts:
            continue
        for kind in kinds:
            for no in where.get(kind, []):
                print(f"{rel}:{no}: Cyrillic in {kind}", file=sys.stderr)
                failures += 1
    if failures:
        print(
            f"cyrillic-scan: {failures} line(s) of system text carry Cyrillic. Translate them to English, "
            "keep owner quotes inside «» or a > blockquote, move UI text to a locale file, or list a "
            "user's own settings in .cyrillic-allow.",
            file=sys.stderr,
        )
        return 1
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="cyrillic_scan", description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_scan = sub.add_parser("scan", help="measure one or more repositories, JSON on stdout")
    p_scan.add_argument("roots", nargs="+")
    p_scan.add_argument("--name", action="append", help="name for each root, in order")
    p_scan.add_argument("--allow", action="append", default=[], help="allow glob (repeatable)")
    p_scan.add_argument("--top", type=int, default=25)
    p_scan.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES)
    p_scan.add_argument("--git", action="store_true", help="add HEAD and remote owner")
    p_check = sub.add_parser("check", help="exit 1 on Cyrillic in system text")
    p_check.add_argument("root")
    p_check.add_argument("--kinds", default="doc,comment",
                         help="comma list of kinds that fail (default doc,comment)")
    p_check.add_argument("--paths", nargs="*", help="only these files (pre-commit)")
    p_check.add_argument("--allow", action="append", default=[])
    p_check.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES)
    args = parser.parse_args(argv)

    if args.cmd == "scan":
        names = args.name or []
        repos = []
        for i, root in enumerate(args.roots):
            if not os.path.isdir(root):
                print(f"cyrillic-scan: not a folder: {root}", file=sys.stderr)
                return 2
            repos.append(scan_repo(root, name=names[i] if i < len(names) else None,
                                   allow=args.allow, top=args.top, max_bytes=args.max_bytes,
                                   with_git=args.git))
        json.dump({
            "scanner": SCANNER_ID,
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "repos": repos,
        }, sys.stdout, ensure_ascii=False, indent=1)
        sys.stdout.write("\n")
        return 0

    kinds = [k.strip() for k in args.kinds.split(",") if k.strip()]
    bad = [k for k in kinds if k not in KINDS]
    if bad:
        print(f"cyrillic-scan: unknown kind(s): {', '.join(bad)}", file=sys.stderr)
        return 2
    if not os.path.isdir(args.root):
        print(f"cyrillic-scan: not a folder: {args.root}", file=sys.stderr)
        return 2
    return _check(args.root, kinds, args.paths, args.allow, args.max_bytes)


if __name__ == "__main__":
    sys.exit(main())

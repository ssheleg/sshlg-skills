#!/usr/bin/env python3
"""Offline integrity check for this research bundle; no service/API calls."""

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
REQUIRED = {
    "README.md", "BRIEF.md", "XR.md", "CREATIVE.md", "ARCHITECTURE.md",
    "PACKETS.md", "VERIFICATION.md", "HANDOFF.md", "mechanical-audit.json",
    "xr-inventory.json", "installed-creative-inventory.json",
    "upstream-snapshots.json", "source-evidence.json",
}


def headings(path):
    seen = {}
    result = set()
    for line in path.read_text().splitlines():
        match = re.match(r"^#{1,6}\s+(.+?)\s*#*\s*$", line)
        if not match:
            continue
        slug = re.sub(r"[^\w\- ]", "", match[1].lower()).replace(" ", "-")
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        result.add(slug + (f"-{count}" if count else ""))
    return result


def main():
    errors = []
    for name in sorted(REQUIRED):
        if not (ROOT / name).is_file():
            errors.append(f"Missing required file: {name}")
    json_files = list(ROOT.glob("*.json"))
    for path in json_files:
        try:
            json.loads(path.read_text())
        except (ValueError, OSError) as exc:
            errors.append(f"{path.name}: {exc}")
    local_links = 0
    external = set()
    for path in sorted(ROOT.glob("*.md")):
        content = path.read_text()
        for target in re.findall(r"\[[^\]\n]+\]\(([^)]+)\)", content):
            parsed = urlsplit(target)
            if parsed.scheme in ("http", "https"):
                external.add(target)
                continue
            if parsed.scheme:
                errors.append(f"{path.name}: unexpected link scheme: {target}")
                continue
            local_links += 1
            dest = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            if not dest.exists():
                errors.append(f"{path.name}: unresolved local link: {target}")
            elif parsed.fragment and dest.suffix == ".md":
                if unquote(parsed.fragment) not in headings(dest):
                    errors.append(f"{path.name}: unresolved heading: {target}")
    packets = (ROOT / "PACKETS.md").read_text()
    ids = re.findall(r"^## (P\d{2}) —", packets, re.M)
    if ids != [f"P{i:02d}" for i in range(1, 16)]:
        errors.append("Packet IDs must be P01–P15 once each, in order")
    brief = (ROOT / "BRIEF.md").read_text()
    for number in range(1, 9):
        if f"XR-{number:02d}" not in brief:
            errors.append(f"Missing requirement XR-{number:02d}")
    for path in [*ROOT.glob("*.md"), *json_files]:
        if re.search(r"/Users/|/private/tmp/|/tmp/xr-creative", path.read_text()):
            errors.append(f"{path.name}: machine-specific path in public report")
    result = {
        "status": "FAIL" if errors else "PASS", "required_files": len(REQUIRED),
        "json_files": len(json_files), "local_links_checked": local_links,
        "external_urls_catalogued_not_probed": len(external),
        "implementation_packets": len(ids), "errors": errors,
    }
    print(json.dumps(result, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

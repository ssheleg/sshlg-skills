#!/usr/bin/env python3
"""Render the recorded source ledgers; no network requests or freshness claims."""
import argparse
import datetime
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

PAIRS = (
    ("sources.json", "host-matrix.json"),
    ("additional-sources.json", "additional-hosts.json"),
    ("extra-sources.json", "extra-hosts.json"),
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def cell(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


def render(base):
    sources, hosts, urls, dates = {}, {}, set(), []
    for ledger_name, matrix_name in PAIRS:
        ledger = json.loads((base / ledger_name).read_text())
        matrix = json.loads((base / matrix_name).read_text())
        for data in (ledger, matrix):
            dates.append(datetime.date.fromisoformat(data["as_of"]))
        require(ledger["sources"] and matrix["hosts"], "Empty ledger or host matrix")
        for source in ledger["sources"]:
            sid, url = source["id"], source["url"]
            require(re.fullmatch(r"[a-z0-9-]+", sid), "Invalid source ID: " + sid)
            require(sid not in sources, "Duplicate source ID: " + sid)
            require(url not in urls, "Duplicate source URL: " + url)
            parsed = urlsplit(url)
            require(parsed.scheme == "https" and parsed.netloc and not parsed.username
                    and not parsed.password and not re.search(r"[\s<>]", url),
                    "Invalid public HTTPS URL: " + sid)
            datetime.date.fromisoformat(source["read_at"])
            require(source["status"] in ("read", "BODY_UNAVAILABLE"),
                    "Unrecognized source status: " + sid)
            require(source["kind"] and source["sections"], "Missing source context: " + sid)
            sources[sid] = source
            urls.add(url)
        for host in matrix["hosts"]:
            hid = host["id"]
            require(re.fullmatch(r"[a-z0-9-]+", hid), "Invalid host ID: " + hid)
            require(hid not in hosts, "Duplicate host family: " + hid)
            refs = host["sources"]
            require(refs and len(refs) == len(set(refs)), "Empty/duplicate source references: " + hid)
            hosts[hid] = (host, matrix_name)

    used = set()
    for hid, (host, _) in hosts.items():
        unknown = set(host["sources"]) - sources.keys()
        require(not unknown, "Unknown source references for " + hid + ": " + ", ".join(sorted(unknown)))
        used.update(host["sources"])
    require(used == sources.keys(), "Unmapped sources: " + ", ".join(sorted(sources.keys() - used)))

    out = [
        "# Host compatibility source links",
        "",
        f"{len(sources)} unique source URLs mapped to {len(hosts)} host families. "
        f"Recorded ledger dates: {min(dates)}–{max(dates)}.",
        "",
        "Generated from [sources.json](sources.json), "
        "[additional-sources.json](additional-sources.json) and [extra-sources.json](extra-sources.json). "
        "Contracts and limitations live in the machine-readable "
        "[host matrix](host-matrix.json), [additional host matrix](additional-hosts.json) "
        "and [final breadth matrix](extra-hosts.json).",
        "",
        "Dates and statuses below are the researchers' recorded observations; this generator "
        "does not revisit URLs. `read` means the body was consulted. `BODY_UNAVAILABLE` means "
        "the page resolved but its body was unavailable to the research tool; it is not proof "
        "of the host contract. Documentation and installer support do not establish native "
        "runtime acceptance. Host families may contain distinct IDE, CLI or regional surfaces.",
        "",
        "## Host-to-source mapping",
        "",
        "| Host family | Contract matrix | Source IDs |",
        "|---|---|---|",
    ]
    for hid, (host, matrix_name) in sorted(hosts.items()):
        refs = ", ".join(f"[{sid}](#source-{sid})" for sid in sorted(host["sources"]))
        out.append(f"| {hid} | [{matrix_name}]({matrix_name}) | {refs} |")
    out += ["", "## Recorded source links", "",
            "| Source ID and URL | Read / attempted date | Status | Kind | Sections inspected / limitation |",
            "|---|---|---|---|---|"]
    for sid, source in sorted(sources.items()):
        link = f'<a id="source-{sid}"></a>[{sid}]({source["url"]})'
        fields = [link, source["read_at"], source["status"], source["kind"], source["sections"]]
        out.append("| " + " | ".join(cell(field) for field in fields) + " |")
    out += ["", "## Regenerate or check", "", "From this directory:", "", "```sh",
            "python3 generate-source-index.py", "python3 generate-source-index.py --check", "```", "",
            "The check is read-only and fails for stale output, duplicate IDs/URLs, "
            "unmapped sources or invalid host references.", ""]
    return "\n".join(out)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate inputs and compare without writing")
    args = parser.parse_args()
    base = Path(__file__).resolve().parent
    try:
        text = render(base)
        target = base / "SOURCES.md"
        if args.check:
            require(target.is_file() and target.read_text() == text, "SOURCES.md is missing or stale; regenerate it")
        else:
            target.write_text(text)
    except (ValueError, KeyError, TypeError, OSError) as exc:
        parser.exit(1, f"FAIL: {exc}\n")
    print("PASS: source index " + ("matches validated ledgers" if args.check else "generated"))


if __name__ == "__main__":
    main()

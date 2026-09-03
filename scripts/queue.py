#!/usr/bin/env python3
"""The priority-ranked open queue across every board in the family — corrected.

The first version drove ten iterations of a loop and under-reported by more than
half. Two defects, both of the shape this family keeps finding: a rule that reads
the right thing in one corpus and something else in another.

  1. **A row was called closed because its BODY said "closed".** `B-047` is open
     and its text explains that *"the elevation half closed 2026-08-20"*, so the
     queue never showed it. Status is read from the status COLUMN, and where a
     table has no status column, from the section it sits in — never from prose.
  2. **`in_closed` latched until the next heading.** A `## Closed` heading turned
     off every row below it, including tables under later headings.

Nine boards, five column layouts. The header row names its own columns and this
reads them by name; a table with no `id` header is not a board table.

Usage:  python3 queue2.py [-n N] [--json] [--repo NAME] [--diff]
"""
import json, os, re, sys

BOARDS = {
    'sshlg-skills': 'docs/evidence/backlog.md',
    'agent-stack': 'skills/agent-stack/docs/evidence/backlog.md',
    'agent-sync': 'skills/agent-sync/docs/evidence/backlog.md',
    'make-skill': 'skills/make-skill/docs/evidence/backlog.md',
    'seo-aeo-audit': 'skills/seo-aeo-audit/docs/evidence/backlog.md',
    'sheleg-design': 'skills/sheleg-design/docs/evidence/backlog.md',
    'sheleg-dev': 'skills/sheleg-dev/docs/evidence/backlog.md',
    'super-ux': 'skills/super-ux/docs/evidence/backlog.md',
    'task-pipeline': 'skills/task-pipeline/docs/evidence/backlog.md',
}
# A STATUS CELL that says the row is finished. Deliberately anchored: a body
# mentioning "closed" is prose, and this never reads a body.
DONE_STATUS = re.compile(r'^\W*(?:closed|done|resolved|dropped|waived|superseded|shipped|green)\b', re.I)
STRUCK = re.compile(r'^\s*~~')
CLOSED_SECTION = re.compile(r'^#+\s*.*\bclosed\b', re.I)
VERBAL = ['can report something untrue', 'unverified', 'high', 'medium', 'low']


def cells(line):
    return [x.strip() for x in re.split(r'(?<!\\)\|', line.strip().strip('|'))]


def scan(repo, path):
    out = []
    if not os.path.exists(path):
        return out
    idx = None
    in_closed_section = False
    for n, l in enumerate(open(path, encoding='utf-8').read().split('\n'), 1):
        if l.startswith('#'):
            in_closed_section = bool(CLOSED_SECTION.match(l))
            idx = None          # a heading ends the previous table's schema
            continue
        if not l.startswith('|'):
            continue
        c = cells(l)
        low = [x.lower().strip('* ') for x in c]
        if low and low[0] == 'id':
            idx = {
                'state': next((k for k, x in enumerate(low) if x in ('state', 'status')), None),
                'what': next((k for k, x in enumerate(low) if x in ('what', 'item', 'title', 'row')), 1),
                'prio': next((k for k, x in enumerate(low) if x in ('p', 'prio', 'priority')), None),
            }
            continue
        if idx is None:
            continue            # a table that never named its columns is not a board
        if c and all(re.fullmatch(r':?-{2,}:?', x) or x == '' for x in c):
            continue
        if not re.match(r'^\**[A-Z]{1,3}-\d+', c[0]):
            continue
        what = c[idx['what']] if idx['what'] < len(c) else c[1]
        # STATUS, in this order: the column that says so, else the section.
        if idx['state'] is not None and idx['state'] < len(c):
            done = bool(DONE_STATUS.match(c[idx['state']]))
        else:
            done = in_closed_section or bool(STRUCK.match(what))
        if in_closed_section or done:
            continue
        raw = c[idx['prio']].replace('*', '').strip() if (idx['prio'] is not None and idx['prio'] < len(c)) else ''
        num = rank = None
        m = re.fullmatch(r'([0-9]+(?:\.[0-9]+)?)', raw)
        if m:
            num = float(m.group(1))
        else:
            for k, v in enumerate(VERBAL):
                if v in raw.lower():
                    rank = k
                    break
        out.append(dict(repo=repo, id=re.sub(r'[*\s]', '', c[0]), line=n,
                        prio_raw=raw or '—', num=num, rank=rank,
                        what=re.sub(r'\s+', ' ', what)[:220]))
    return out


# B-107. Everything below ORDERS the family's work and had no test of its own, so the
# two defects this scanner was written to fix could return unseen. Importable now: the
# run is under a main guard and `scan()` is the unit `test/queue_test.py` exercises,
# with the negative controls a tool that orders the work deserves as much as a gate.
def main():
    rows = []
    for repo, path in BOARDS.items():
        rows += scan(repo, path)
    rows.sort(key=lambda r: (0 if r['rank'] is not None else 1,
                             r['rank'] if r['rank'] is not None else 0,
                             -(r['num'] if r['num'] is not None else -1),
                             r['repo'], r['id']))
    if '--repo' in sys.argv:
        want = sys.argv[sys.argv.index('--repo') + 1]
        rows = [r for r in rows if r['repo'] == want]
    if '--json' in sys.argv:
        print(json.dumps(rows, indent=1, ensure_ascii=False))
    else:
        import collections
        per = collections.Counter(r['repo'] for r in rows)
        print(f"{len(rows)} open rows across {len(per)} boards")
        print("  " + "  ".join(f"{k}:{v}" for k, v in per.most_common()) + "\n")
        n = int(sys.argv[sys.argv.index('-n') + 1]) if '-n' in sys.argv else 20
        for r in rows[:n]:
            print(f"{r['prio_raw'][:22]:22} {r['repo']:14} {r['id']:8} {r['what'][:78]}")


if __name__ == '__main__':
    main()

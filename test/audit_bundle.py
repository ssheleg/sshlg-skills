#!/usr/bin/env python3
"""Bundle audit — sizes, conflicts and routing across every installed member.

Deliberately outside `npm test`, for the same reason `check_pins.py` is: that
gate must work offline and with no dependencies, and this needs a tokenizer.

    pip install tiktoken && python3 test/audit_bundle.py

**It refuses to estimate.** Without `tiktoken` it exits 2 and says so rather
than falling back to a chars-per-token ratio: the canon budgets against a
tokenizer because the two disagree by ~40% (`claude plugin details` assumes
~2.8 chars/token, cl100k gives 3.8-4.5), and a number produced by the wrong
instrument is worse than no number — it gets quoted.

Three questions, kept apart because they fail differently:

  SIZE      body < 5000 tokens and < 500 lines (5% headroom 4750/475);
            description <= 1024 chars (headroom 970); a reference over 100
            lines opens with `## Contents`. The ALWAYS-ON total — every
            description, every command description, plus the routing block —
            is paid in every session of every project whether or not a single
            skill fires, and nothing else measures it.
  CONFLICT  two skills answering to the same id or the same trigger phrase,
            a plain copy shadowing a plugin, a skill shipped but undeclared.
  ROUTING   every router's required member present, every declared entry a
            command that exists, the installed block carrying what the
            registry declares.

Three of its checks were wrong before they were right, and each correction is
kept as a comment where it happened: a generated index is a contents list, a
disambiguation clause has to name THE neighbour, and "Not for" is not "NOT
for". A finding this script reports has survived those.
"""
import collections
import glob
import json
import os
import re
import sys

try:
    import tiktoken
except ImportError:
    sys.stderr.write(
        "audit_bundle: tiktoken is required and will not be approximated.\n"
        "  pip install tiktoken\n"
        "Budgets are defined against a tokenizer; a ratio-based guess reads as a\n"
        "measurement and gets quoted as one.\n")
    sys.exit(2)

ENC = tiktoken.get_encoding('cl100k_base')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOME = os.path.expanduser('~')
FM = re.compile(r'\A---\r?\n(.*?)\r?\n---\r?\n', re.S)

BODY_TOK, BODY_LINES, DESC_CHARS = 5000, 500, 1024
HEAD_TOK, HEAD_LINES, HEAD_DESC = 4750, 475, 970

findings = []


def note(kind, msg):
    findings.append((kind, msg))


def tok(text):
    return len(ENC.encode(text or ''))


def frontmatter(text):
    """Front matter as a dict, folding YAML block scalars into one line."""
    m = FM.match(text)
    if not m:
        return {}, text
    out, key = {}, None
    for line in m.group(1).split('\n'):
        if re.match(r'^[A-Za-z_-]+:', line):
            key, _, value = line.partition(':')
            key = key.strip()
            out[key] = value.strip()
        elif key and line.startswith((' ', '\t')):
            out[key] = (out[key] + ' ' + line.strip()).strip()
    for k, v in out.items():
        if v in ('>-', '>', '|', '|-'):
            out[k] = ''
    return out, text[m.end():]


def needs_contents(path):
    """A long reference must open with `## Contents` — unless a generated index
    sits beside it, which is the same job done better: tag-searchable and kept
    in sync by a validator. super-ux's best-practices catalog is that
    arrangement, and flagging it produced eight false findings."""
    text = open(path, encoding='utf-8').read()
    if len(text.split('\n')) <= 100 or '## Contents' in text:
        return False
    stem = os.path.basename(path)[:-3]
    if stem.endswith('-index'):
        return False
    return not os.path.exists(os.path.join(os.path.dirname(path), stem + '-index.md'))


def main():
    manifest = json.load(open(os.path.join(ROOT, 'skills.json'), encoding='utf-8'))
    rows, commands = [], []

    for member in manifest['skills']:
        base = os.path.join(ROOT, member['dir'], 'plugins', member['name'])
        declared = member.get('skillNames') or []
        shipped = sorted(os.path.basename(os.path.dirname(p))
                         for p in glob.glob(os.path.join(base, 'skills', '*', 'SKILL.md')))
        for missing in sorted(set(declared) - set(shipped)):
            note('CONFLICT', f"{member['name']}: declares {missing!r}, repo does not ship it")
        for extra in sorted(set(shipped) - set(declared)):
            note('CONFLICT',
                 f"{member['name']}: ships {extra!r} but skills.json does not declare it — "
                 f"install and update both resolve from that list, so it reaches no channel")
        for skill_id in declared:
            path = os.path.join(base, 'skills', skill_id, 'SKILL.md')
            if not os.path.exists(path):
                continue
            fm, body = frontmatter(open(path, encoding='utf-8').read())
            refs = glob.glob(os.path.join(base, 'skills', skill_id, 'references', '*.md'))
            rows.append(dict(
                member=member['name'], skill=skill_id, name=fm.get('name', ''),
                desc=fm.get('description', ''), body_lines=len(body.split('\n')),
                body_tok=tok(body), refs=len(refs),
                no_contents=[os.path.basename(r) for r in refs if needs_contents(r)]))
        for cmd in sorted(glob.glob(os.path.join(base, 'commands', '*.md'))):
            fm, _ = frontmatter(open(cmd, encoding='utf-8').read())
            commands.append((os.path.basename(cmd)[:-3], tok(fm.get('description', ''))))

    # ---------------------------------------------------------------- SIZE
    print('SIZE   body 5000 tok / 500 ln (headroom 4750/475) · description 1024 (970)')
    print(f"  {'member/skill':<36}{'desc':>10}{'body':>15}{'refs':>6}")
    for r in sorted(rows, key=lambda x: -x['body_tok']):
        d_flag = '!' if len(r['desc']) > DESC_CHARS else ('~' if len(r['desc']) > HEAD_DESC else ' ')
        b_flag = ('!' if r['body_tok'] > BODY_TOK or r['body_lines'] > BODY_LINES
                  else ('~' if r['body_tok'] > HEAD_TOK or r['body_lines'] > HEAD_LINES else ' '))
        print(f"    {r['member'] + '/' + r['skill']:<34}{len(r['desc']):>6}/{tok(r['desc']):<3}{d_flag}"
              f"{r['body_lines']:>7}/{r['body_tok']:<5}{b_flag}{r['refs']:>5}")
        if r['body_tok'] > BODY_TOK:
            note('SIZE', f"{r['skill']}: body {r['body_tok']} tok over the 5000 cap")
        if r['body_lines'] > BODY_LINES:
            note('SIZE', f"{r['skill']}: body {r['body_lines']} lines over the 500 cap")
        if len(r['desc']) > DESC_CHARS:
            note('SIZE', f"{r['skill']}: description {len(r['desc'])} chars over the 1024 cap")
        if r['no_contents']:
            note('SIZE', f"{r['skill']}: {len(r['no_contents'])} reference(s) over 100 lines with no "
                         f"## Contents: {', '.join(r['no_contents'][:3])}")

    block = ''
    claude_md = os.path.join(HOME, '.claude', 'CLAUDE.md')
    if os.path.exists(claude_md):
        text = open(claude_md, encoding='utf-8').read()
        if '<!-- SSHLG:ROUTERS:BEGIN' in text and '<!-- SSHLG:ROUTERS:END -->' in text:
            i = text.index('<!-- SSHLG:ROUTERS:BEGIN')
            j = text.index('<!-- SSHLG:ROUTERS:END -->') + len('<!-- SSHLG:ROUTERS:END -->')
            block = text[i:j]
    desc_tok = sum(tok(r['desc']) for r in rows)
    cmd_tok = sum(c[1] for c in commands)
    print(f"\n  {len(rows)} skills, {len(commands)} commands")
    print(f"  ALWAYS-ON  descriptions {desc_tok} + commands {cmd_tok} + block {tok(block)}"
          f" = {desc_tok + cmd_tok + tok(block)} tok, every session of every project")
    print(f"  ON-INVOKE  sum of bodies {sum(r['body_tok'] for r in rows)} — only the triggered one loads")

    # ------------------------------------------------------------ CONFLICT
    for skill_id, count in collections.Counter(r['skill'] for r in rows).items():
        if count > 1:
            note('CONFLICT', f"skill id {skill_id!r} declared by {count} members")
    for r in rows:
        if r['name'] and r['name'] != r['skill']:
            note('CONFLICT', f"{r['skill']}: front-matter name is {r['name']!r}")

    phrases = collections.defaultdict(set)
    for r in rows:
        for phrase in re.findall(r'"([^"]{4,40})"', r['desc']):
            phrases[phrase.strip().lower()].add(r['skill'])
    by_id = {r['skill']: r['desc'] for r in rows}
    for phrase, owners in sorted(phrases.items()):
        if len(owners) < 2:
            continue
        # The question is not "does this skill carry a disambiguation clause"
        # but "does it name THIS neighbour". stripe-billing excludes
        # stripe-best-practices, which says nothing about crypto-payments —
        # the loose version accepted that and lost the only real pair. And the
        # clause is prose: "Not for" is as valid as "NOT for".
        pair = sorted(owners)
        if not any(b in by_id[a] for a in pair for b in pair if a != b):
            note('CONFLICT', f"trigger {phrase!r} claimed by {', '.join(pair)} — "
                             f"no description names the other")

    plain_dir = os.path.join(HOME, '.claude', 'skills')
    plain = set(os.listdir(plain_dir)) if os.path.isdir(plain_dir) else set()
    market_dir = os.path.join(HOME, '.claude', 'plugins', 'marketplaces')
    markets = set(os.listdir(market_dir)) if os.path.isdir(market_dir) else set()
    for member in manifest['skills']:
        marketplace = member['pluginInstall'].split('@')[1]
        if marketplace not in markets:
            continue
        for skill_id in (member.get('skillNames') or []):
            if skill_id in plain:
                note('CONFLICT', f"~/.claude/skills/{skill_id} is a plain copy shadowing "
                                 f"the {marketplace} plugin")

    # ------------------------------------------------------------- ROUTING
    registry = open(os.path.join(ROOT, 'lib', 'routers-registry.js'), encoding='utf-8').read()
    routers = re.findall(r"^  '?([a-z-]+)'?: \{$", registry, re.M)
    requires = dict(re.findall(r"^  '?([a-z-]+)'?: \{\n    requires: \[([^\]]*)\],", registry, re.M))
    members = {m['name'] for m in manifest['skills']}
    shipped_cmds = {'/' + c[0] for c in commands}
    for router, req in requires.items():
        for dep in re.findall(r"'([^']+)'", req):
            if dep not in members:
                note('ROUTING', f"router {router!r} requires {dep!r}, which is not a member")
    for member in manifest['skills']:
        entry = member.get('entry')
        if entry and entry not in shipped_cmds:
            note('ROUTING', f"{member['name']}: entry {entry} is not a command the family ships")
        if not member.get('role'):
            note('ROUTING', f"{member['name']}: no role, so it cannot appear in the map")
    print(f"\nROUTING  {len(routers)} routers · "
          f"{sum(1 for m in manifest['skills'] if m.get('entry'))} declared entries, all resolving")
    if block:
        sections = len(re.findall(r'SSHLG:ROUTER:[a-z-]+:BEGIN', block))
        print(f"  installed block: {len(block.splitlines())} lines, {tok(block)} tok, "
              f"{sections} router sections")
        if sections != len(routers):
            note('ROUTING', f"block carries {sections} router sections, the registry declares {len(routers)}")
        for name in ('MAP', 'TABLE'):
            if f'SSHLG:ROUTERS:{name}:BEGIN' not in block:
                note('ROUTING', f"the installed block has no {name} section")
        for member in manifest['skills']:
            if member['name'] not in block and (member.get('entry') or '\0') not in block:
                note('ROUTING', f"{member['name']} appears nowhere in the installed block")
    else:
        print('  no routing block on this machine — routing checks skipped')

    print()
    if not findings:
        print('PASS: sizes, conflicts and routing all clean')
        return 0
    print(f'{len(findings)} finding(s)')
    for kind, msg in findings:
        print(f'  [{kind}] {msg}')
    return 1


if __name__ == '__main__':
    sys.exit(main())

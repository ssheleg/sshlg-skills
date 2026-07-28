## What and why

<!-- What changes, and what problem it solves. Link the issue if there is one. -->

## Evidence

<!-- Paste what you ran and what it printed. Both are required for any code change. -->

```
python3 test/validate.py
```

```
node --check bin/sshlg-skills.js
```

## Checklist

- [ ] `python3 test/validate.py` passes
- [ ] `node --check bin/sshlg-skills.js` passes
- [ ] Behavior change is reflected in `README.md`
- [ ] `CHANGELOG.md` has an entry under the version being released (or this is a docs-only change)
- [ ] If versions moved: `skills.json`, `package.json` and the top `CHANGELOG.md` entry all agree
- [ ] Submodule pins were not moved unintentionally (`git diff --submodule`)

Contract: brand-contract v1

# The ssheleg skill family voice

This folder is the source of truth for public copy shared by the family:
repository descriptions, README introductions, release notes, the umbrella
site and social-preview cards. Individual repositories may add product facts,
but they do not invent a second voice.

| File | Holds |
|---|---|
| `voice.md` | the voice, its invariants and its failure mode |
| `terminology.md` | exact product names, preferred terms and banned filler |
| `facts.md` | public claims and the source that proves each one |
| `channels.md` | register and constraints for each public surface |
| `strings.md` | recurring family-level labels |
| `locales/en.md` | primary-locale decisions |

## Sources

```
Sources:
  readmes:    README.md, skills/*/README.md
  manifests:  skills.json, package.json
  site:       scripts/site.js, scripts/og-card.js
  releases:   CHANGELOG.md, skills/*/CHANGELOG.md
```

## Rule

A public claim resolves to `facts.md` or to a file and command named beside
the claim. Missing proof is reported as missing; it is never filled with a
plausible number.


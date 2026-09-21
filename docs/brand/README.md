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
  ui: scripts/site.js
  marketing: _site/**/*.html docs/harness/README.md
  locales: docs/brand/locales/*.md
```

The `ui` source is the actual site generator; recurring labels resolve there.
The `marketing` source is the generated HTML that ships, plus the architecture
Markdown. Build it before linting, so the glob scans real pages:

```sh
node scripts/site.js --out _site
python3 skills/super-ux/plugins/super-ux/scripts/brand_lint.py docs/brand
```

`_site/` is a disposable, ignored build artifact, never a second source of truth.
Developer README instructions, manifests and historical release logs are evidence
sources. The validator only accepts `ui`, `marketing`, `store`, `robots` and
`locales`; source patterns are whitespace-separated, without commas.

The current linter reads inline CSS and HTML attributes as marketing prose. Its
numeric-claim scan does not remove `<style>` blocks or extract visible text. Do
not register CSS values as public facts to silence it. Keep the full report,
review the rendered text against voice and facts, and use `test/site_test.js`
for generated counts, metadata, paths and labels. A zero exit is not claimed for
this raw-HTML scan; the limitation is in the parser, not hidden by an empty glob.

## Rule

A public claim resolves to `facts.md` or to a file and command named beside
the claim. Missing proof is reported as missing; it is never filled with a
plausible number.


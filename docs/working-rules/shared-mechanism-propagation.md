# A lesson fixed in one member and left in the other nine is not fixed

Ten repositories ship the same release machinery. When one of them learns
something, nothing carries it to the rest, and the family has now paid for that
twice in the same mechanism.

## What happened, with dates

**2026-08-25, `telegram-dev`.** Its first publish printed
`+ @ssheleg/telegram-dev@0.1.3` with signed provenance, and the registry replica
served nothing for over three minutes — so the release went red on a step ABOUT
the registry while the publish had succeeded. The fix landed there: the window
widened from three minutes to ten, and the two failure cases were told apart,
because *"the registry does not know this package"* and *"it does not serve this
version"* are different problems with different remedies.

**2026-09-10, `sshlg-skills`.** `sshlg-skills@1.48.1` hit the identical wall, in
a workflow that had never received that fix. `npm publish` printed
`+ sshlg-skills@1.48.1`; the check gave up after three minutes; the registry
served the version minutes later. Six weeks, nine repositories, one of them
immune.

The same investigation then found a defect `telegram-dev` had NOT hit: the poll
asked `npm view <name> version`, which answers *"what is the latest dist-tag"* —
a different question. The two answers differ while the tag lags, and they differ
permanently for a patch published behind a newer minor.

So each repository held half the knowledge, and neither half had reached the
other. Both halves are now in one step, identical in all ten.

**The first release through the fixed step measured the window.** `v1.48.2`, an
hour later: `OK: registry serves sshlg-skills@1.48.2 (after 330s)`. Five and a
half minutes — so the three-minute bound would have failed that release too, and
the case for ten minutes stops being an argument and becomes two dated
observations past the old bound.

## The rule

**A shared mechanism is fixed in every copy, in the same change, or it is not
fixed.** The fix that lives in one member is not a fix — it is a difference
nobody wrote down, and the next release in a different repository pays for it
again.

Before closing a finding about machinery that more than one repository runs:

1. **Count the copies.** `grep` the family for the step, the guard, the helper.
   The answer is a number, and the number is how many places the fix belongs.
2. **Ask which copy already knows better.** The member that hit it first may
   have solved it more thoroughly — `telegram-dev`'s two-case diagnosis was
   better than the replacement written for the others, and copying outward from
   the best version beats reinventing it.
3. **Align on ONE text**, comment included. Two copies that differ in wording
   diverge in behaviour next time somebody edits one.
4. **Say in the comment why the shape is what it is**, with the dates and the
   measurements. A future reader deleting a ten-minute window needs to know it
   replaced a three-minute one that failed twice.

## Counting the copies can answer ONE, and that is a result

This rule creates its own opposite failure: a fix pushed into nine repositories
that never had the mechanism, leaving nine files carrying a remedy for a bug they
cannot have. Step 1 is a measurement, not a formality, and `1` is a legitimate
answer to it.

**Measured 2026-09-10, the wired hook runtime.** `sshlg-skills@1.48.0` shipped a
module the runtime could not load — `require('../package.json')` resolves in the
package and resolved to nothing in `~/.sshlg-skills/runtime/`, the copy the hooks
actually execute. The obvious next move was to look for the same shape in the
other nine. The count came back **one**:

```
lib/runtime.js in each member ............ 0 of 9
member hooks, and where they run from .... ${CLAUDE_PLUGIN_ROOT}, the whole
                                           plugin directory — not a copied subset
```

Only the umbrella copies a SUBSET of its own tree to a second location, so only
the umbrella can have a module that exists in the package and not where it runs.
The members' hooks were still resolved rather than assumed — every command in
every `hooks.json`, and every `${CLAUDE_PLUGIN_ROOT}` reference inside those
scripts: `missing_hooks=none dangling_refs=none` across all nine.

**The rule this adds:** print the count and what it was over, even when it is one.
A propagation that did not happen and a propagation nobody looked for read the
same in a diff.

## The boundary

This is about mechanisms the family SHARES — release steps, hook runtimes,
guards that check the same invariant in ten trees. It is not about doctrine each
member owns: `sheleg-dev` should not carry `telegram-dev`'s rate-limit rules, and
a member's own SKILL text is its own.

**Refusal:** none. A shared mechanism has no per-member opinion to respect — if
one copy needs to differ, the difference is a decision to write down, not a
divergence to leave lying around.

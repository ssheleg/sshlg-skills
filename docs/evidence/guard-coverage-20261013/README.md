# C06: credential reader coverage, B-171 / B-172

Objective: prevent the known content-read shapes in the two board rows from
printing credentials while preserving ordinary code searches and metadata probes.
This packet belongs to the parent completion wave. It does not claim a complete
shell interpreter, sandbox, universal leak prevention, or a globally installed fix.

## Scope and decisions

- [Pure operand recognizer](../../../lib/secretreaders.js): recognizes quoted shell
  words and command separators; tracks bounded literal assignments, `cd`, copies
  and exact-path links within one command; separates grep/rg patterns and sed/awk/jq programs
  from file operands. Shell command substitutions are examined recursively.
- Content readers include the prior cat/head/tail family, grep/rg/sed/awk/jq,
  `dd if=`, bounded xargs/find reader forms, shell `-c` scripts (including positional
  paths), and Python `-c` literal `open`/`Path` read calls or `open(sys.argv[N])`.
  Literal Python `file=` arguments are included. Python comments and quoted examples are not treated as calls; literal
  write-only open modes remain allowed while modes permitting reads do not.
- Protected paths include the existing secret filenames/directories and the
  explicitly encoded Claude, Codex, Cursor, OpenCode and gateway configuration
  surfaces. The code is the exact list. Direct `claude mcp get` is refused because
  it can print configuration values; its help and `mcp list` remain allowed.
- [Secret decision module](../../../lib/secrets.js) keeps the existing literal,
  expansion, environment, curl and stdin-program rules. The former whole-command
  reader/path co-occurrence heuristic is replaced, including its false positive
  on an unrelated reader after a search for `/credentials`.
- [PreToolUse](../../../hooks/pre-tool-use.js) passes cwd/home into the pure
  recognizer. Read and content-mode Grep calls use the same protected-path rule;
  count and filename-mode Grep remain allowed. [Wiring](../../../lib/hooks.js)
  includes both tool names so the check actually receives their payloads.
- [MCP result registry](../../../lib/mcpsecrets.js) was inspected and remains
  unchanged. Its focused suite still passes; this patch does not infer new
  dangerous MCP tools from names.

Existence, mode, size, count and filename probes are counterexamples in the
[new suite](../../../test/secret_readers_test.js), not just suggested remedies.
No fixture opens a real credential or executes one of the dangerous commands.
Hook tests send synthetic path strings to real hook processes.

## Explicit bounds

This is a best-effort pre-execution guard, not shell or Python evaluation.
It does not resolve filesystem symlinks, externally defined variables/functions,
arbitrary scripts, encoded/computed paths, arbitrary language programs or every
option dialect. It recognizes only the structures exercised by its fixtures.
Recursive inspection stops after eight nested levels. General heredoc semantics,
conditional execution and every shell expansion are not modelled. Recursive
directory-copy descendants are not tracked; copy/link aliases match exact paths. Other
credential-returning tools still require their own known-shape contract.

Named credential/configuration paths are conservative classifications: content
may already be redacted, but the guard does not read it to decide. A refusal names
value-free probes rather than printing or re-reading the target. It cannot undo a
credential already emitted. The hook retains the repository's fail-silent behavior
on malformed/unfamiliar payloads, so this is not a security boundary.

## TDD and focused verification

[baseline.json](baseline.json) runs the final new corpus against the committed
baseline `f1901a3335ffd894957854eeaabb5c8222c97812`, materialized through `git show`
into an owned temporary directory and removed afterward. It records nonzero exit
and individual failures. [focused.json](focused.json) records the corresponding
current checks and exact output. Passing counts belong to those receipts, not a
claim that all shell inputs are covered.

The meaningful negative controls include search patterns containing credential
path text, including a trailing `head` and valued filter options; bare `cd` resets
the recognised cwd to HOME; grep/rg counts and filenames; xargs/find
count probes; unrelated readers beside `stat`/`wc`; Python metadata probes and
quoted/commented examples; harmless quoted shell examples; and Grep's filename
default. Positive cases also exercise the actual hook payload and matcher.

No full repository suite, hosted CI, release, merge, or global hook refresh is
performed by this packet. The parent coordinates the full gate because the shared
disk is constrained. Global/local machine configuration and unrelated work remain
local-only and are excluded from the commit.

## Handoff

Completed: bounded reader implementation, Read/Grep delivery, red/green regression
corpus, focused hook/runtime checks and these evidence files.

Prerequisites for rollout: independent review, parent wave convergence/full gate,
then the repository's normal release and consent-preserving runtime refresh.
The installer already copies all `lib/*.js`; the runtime focused test checks its
copy behavior, but no installed host is claimed updated here.

Exact next task: independently review this branch against the two board rows,
try additional reader/pattern counterexamples, and integrate the passing change
through the parent completion branch. The parent owns shared board/DOCMAP and
aggregate handoff updates; they are deliberately absent from this branch.

# task-pipeline 1.95.0 published and pinned

Owner receipts: [release-1950 packet](https://github.com/ssheleg/task-pipeline/blob/bc880b19655f3e442a8858edd912c13752a74661/docs/evidence/runs/2026-10-14-release-1950/README.md)
(TP PR #129). Summary:

- PR #127 squash-merged as 4fa7ec6 (tree equal to the tested head); 12/12 hosted jobs green.
- Exact-tag attempt1 disk-stopped (machine swap), attempt2 failed only `test:docs`
  (five squash-unreachable evidence SHAs; fixed by PR #128 as links), attempt3
  `CHECK_PASSED` on 5a787b4, 3054s. Earlier local annotations were never pushed.
- Helper `publish` refused (no bound run context); the tag object ada20cbb was pushed by
  hand with the helper's preconditions read first and `--no-follow-tags`.
- Release run [38499730163](https://github.com/ssheleg/task-pipeline/actions/runs/38499730163):
  `release` and `publish` success. npm 1.95.0 gitHead 5a787b4; 155 tarball files
  byte-equal to source.
- Hub pin a9b4ac9; hub gate [bd3af81](../hub-gate-bd3af81/README.md) passes every suite.

Installed acceptance belongs to the hub release's `update` readback.

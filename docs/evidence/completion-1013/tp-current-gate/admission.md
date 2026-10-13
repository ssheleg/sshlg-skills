# Exact-tree release admission after a resource stop

The second local `npm run test:all` attempt at accepted main78c42124 stopped
on its disk guard after5898.95 seconds, with exit-15 and minimum200646656 free
bytes. It did not create or push a tag. This is INCOMPLETE, not PASS.
[disk-stopped.json](disk-stopped.json) and compressed log preserve the attempt.

The documented pre-tag gate is `npm test` in task-pipeline CONTRIBUTING.md
section Releasing. Genuine frozen-PR run38373122458 passed all12 jobs at
2cadc3ee0ca079b8cc9a81e4a8b65b43838a02aa, including the complete npm-test
equation, retained audit regressions and eight negative-test shards.
[hosted-pr122.json](hosted-pr122.json) contains every job result. Both that
source and accepted78c42124db910c56e74c8fbd524bdc9a4f8fb6c9 resolve to tree
2e11c22ebcbb3bddb693d0e0b868142c2a666d2c, verified with git rev-parse.

The release workflow at that exact tree independently executes
`npm run test:all` on the checked-out tag before creating a release or publishing.
Therefore continue through the existing tag-triggered gate rather than rerun
the identical local negative suite under disk exhaustion. This changes no
required check, workflow, test threshold, approval or publication guard.
The full exact-tag result and registry readback remain pending; a tag alone
is not release acceptance. No workflow_dispatch or simulated status is used.

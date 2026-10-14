# First composed hub aggregate

Source `9e667eeaa93f54201c73aa78b542fc26ee297cc2`: actual `npm test` exited 1 after 258.579 seconds. The [receipt](receipt.json) binds source/tree, log hash and disk observations; [complete output](output.log.gz) preserves failures. This is a failed pre-final gate, not release acceptance.

132 suites ran. Three suites failed: `apply_test.js` had two stale own-state exemption expectations; `audit_regressions/ctx-04.06.py` had a stale current-pin staging receipt; `triggers_test.js` expected release-iteration aliases absent at the old task-pipeline pin. Runtime recovery tests passed within this run. Suite totals were not written because the aggregate failed.

Next: reconcile exact own-state namespaces without weakening protected-file detection; publish and pin the accepted task-pipeline member; regenerate the staging receipt; normalize existing suite summaries so the measured fixture count includes them. Then repeat the complete aggregate on frozen source.

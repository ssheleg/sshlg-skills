<sub>ssheleg skills — evidence-docs · task-pipeline</sub>

# B-162 native local-enable readback

Measured 2026-10-13 using actual Claude Code 2.1.296, on hub source `32e29af`.
This packet changes no runtime code. The [probe](probe.py) creates five separate
synthetic homes and fresh Git projects, installs one local synthetic plugin per
home, then calls `claude plugin enable probe@owned-local-probe --scope local`.
The [receipt](result.json) retains exact local settings bytes before/after,
exit codes, message classifications and the probe SHA256. No model/provider
calls, real profiles, credentials or foreign projects are involved. All owned
fixture trees were removed in `finally`; the probe process exited0.

| Global entry | Local entry before | Exit | Native message | Local entry after |
|---|---|---:|---|---|
| true | File absent | 1 | Already enabled at local scope | Absent |
| false | File absent | 0 | Successfully enabled | true |
| true | Foreign-only local file | 1 | Already enabled at local scope | Absent |
| false | Foreign-only local file | 0 | Successfully enabled | true |
| true | Explicit false | 0 | Successfully enabled | true |

The previously reported defect remains reproducible when global enablement is
true and the requested local override does not exist. Effective enablement and
an explicit local declaration are different contracts: an absent local entry
will not preserve enablement if global state later changes. The native error
incorrectly attributes inherited enablement to local scope. Global-false and
explicit-local-false controls demonstrate that local writes work in this fixture.
All five global settings files stayed byte-identical. Successful native local
writes reformatted the synthetic local file but retained its foreign value.

This does not certify other plugin scopes, versions, agent discovery or model
quality. Do not reinterpret exit1 as a persisted local override or toggle the
operator's global state to force a write. No production workaround is introduced.
The next task is to retain B-162 as an upstream native limitation, and require
local settings readback wherever a future operation needs a durable local grant.

Reproduce with an unused output path:

```sh
python3 -B docs/evidence/completion-1013/claude-local-enable/probe.py --output /tmp/claude-local-enable-new.json
```

The probe refuses to overwrite a prior receipt. It needs installed `claude` and
Git. It does not install either CLI or make a model request; the only plugin
installations are the five synthetic fixtures described above.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — source-bound native probe.
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded defect verification.

# A wait is not a stop

Finish a unit of work, then take the next authorized task from the project's board
or handoff in the same turn. During a dependency wait, work on an independent task;
when appropriate, stack dependent work on an isolated branch and integrate through
the repository's policy when its prerequisite lands.

Record each wait's condition, owner and source, exact authorized next action,
watcher identity and fallback handoff. Use an available background process or host
scheduler to observe the condition and continue that action when it clears. If no
watcher capability is available, record the pending wait honestly; never invent a
running job. Poll PRs, CI and peer replies every 1–2 minutes, releases every few
minutes, scheduled work once at its time, and nightly checks once after their run.

A session process does not survive session loss. A wait that must outlive the
session needs an existing durable trigger, or a new one installed within the
current authority. At compaction, persist the current unit, evidence, pending
waits and exact next task so another context can resume.

The rule grants no authority for an outward action. A watcher may merge, publish,
spend, send, change access, reset or force-push only under an act-specific grant
and the repository's applicable checks. Green CI, generic "continue", or enabling
this rule is not such a grant. Verify the expected source and current head before
an authorized write; changed or uncertain evidence requires a new assessment,
not blind retries. Cite the applicable spending record and limit.

Sign-ins, consents, operator payments or top-ups, and typed secrets remain human
gates. Record the precise human prerequisite and its continuation; continue other
independent authorized work. Instructions alone do not create watchers, scheduled
jobs, hooks or daemons, and installed text does not prove model behavior.

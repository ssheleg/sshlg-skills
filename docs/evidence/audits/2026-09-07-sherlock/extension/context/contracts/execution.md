# Контракт execution

Статус: целевая спецификация, не утверждение о существующем runtime.

Один ExecutionAuthority на run: Fabric durable service либо standalone coordinator. claim(run,node,revision,owner,idempotency_key) атомарно возвращает attempt_id, monotonic fencing token, lease expiry и expected source/context revision. renew/cancel/recover/complete проверяют текущий attempt. No lock → no external execution. ResultEnvelope привязан к packet_digest, source_base, candidate commit, test receipts и outputs. Duplicate completion идемпотентен; late/stale owner отвергается. Dependencies типизированы data/control/resource; обязательный parked producer не считается successful. Fan-in проверяет ВСЕ prerequisites. Resource конфликт сериализуется или изолируется с явной интеграцией. Reviewer не может принять proof от другого кода; mandatory certification проверяется самой completion boundary, не только UI. После merge/rebase проверяются затронутые claims заново.

Источники требований и доказательства: [brief](../../work-brief.md), [реестр замечаний](../../findings-final.json).

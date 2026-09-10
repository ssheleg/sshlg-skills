# Контракт evidence

Статус: целевая спецификация, не утверждение о существующем runtime.

EvidenceClaim: claim_id, statement, scope, source_locator, source_digest, observed_at, method, result, limitations, freshness. Разные состояния: observed / reproduced / inferred / unknown; статус implementation отдельно. PASS требует успешного процесса и проверки заявленного outcome. NOT_RUN и ENV_ERROR не PASS и не доказанный дефект продукта. Operator approval не превращает гипотезу в факт; ADR не оправдывает нарушение требований. Числовой рейтинг только при заданной шкале и provenance; контент источника не выполняется как инструкция.

Источники требований и доказательства: [brief](../../work-brief.md), [реестр замечаний](../../findings-final.json).

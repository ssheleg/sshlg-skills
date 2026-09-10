# Контракт context

Статус: целевая спецификация, не утверждение о существующем runtime.

ExecutionPacket/v1 (предлагаемый общий контракт): packet_id, schema_version, run_id, node_id, node_revision, source_base, source_digests, program_ref, module_refs, decision_refs, requirement_ids, inputs, implementation_steps, write_scope, acceptance, outputs, dependencies, context_budget, freshness_policy. Все refs разрешаются в bytes и digest. Самодостаточность означает замыкание ссылок, а не копию всего репозитория в prompt. Primary context загружается до работы; appendix индексируется и подтягивается по необходимости. Нельзя срезать acceptance, constraints и interface contracts ради лимита. Если materialised context не помещается — декомпозиция задачи или явный недостаток capability, без молчаливого усечения. Absolute paths этого аудита локальны; transport adapter должен перенести content-addressed bundle, переписать root и проверить digest. После завершения prerequisite packet revision пересобирается с digest полученного output. Текущие plan packets не выдают ещё не существующие upstream outputs за готовые.

Источники требований и доказательства: [brief](../../work-brief.md), [реестр замечаний](../../findings-final.json).

# Контракт integration

Статус: целевая спецификация, не утверждение о существующем runtime.

SideEffectReceipt: event/provider id, business operation key, lifecycle status, units/currency, attempt, remote outcome, reconciliation, compensation. received/claimed != applied/completed. Повтор, reorder, concurrent processing, crash до/после side effect и ambiguous timeout проверяются отдельно. Refund cumulative amount монотонен; изменение entitlement сериализуется с подтверждённым period. OAuth state/nonce привязаны к серверной сессии, client_secret/refresh token не выносятся в клиент; consent/provider policy/legal applicability не смешиваются. Протокольный пример требует pinned version и независимого test oracle.

Источники требований и доказательства: [brief](../../work-brief.md), [реестр замечаний](../../findings-final.json).

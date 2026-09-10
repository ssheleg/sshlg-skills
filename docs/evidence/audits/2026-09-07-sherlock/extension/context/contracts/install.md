# Контракт install

Статус: целевая спецификация, не утверждение о существующем runtime.

HostContext: host_id, version, config_root, discovery_roots, provider, scope, capabilities, precedence, session_reload. ReleaseSet: umbrella version + immutable per-member SHA/digest + pinned installer version + compatibility manifest. UpdatePlan read-only; apply использует staged payload → verify → scoped atomic switch → reload/observe active bytes → receipt; rollback возвращает предыдущий набор. --dry-run обязан иметь zero writes/deletes/child mutations; выбранный host ограничивает все adapters. Prune только после проверки реально доступной replacement copy и владения. Unsupported native lifecycle отражается как UNSUPPORTED, failure as ERROR/UNKNOWN, не successful/current. Host hooks необязательны для чтения skill, но обязательны для обещанного enforcement; capabilities не симулируются строкой в AGENTS.md.

Источники требований и доказательства: [brief](../../work-brief.md), [реестр замечаний](../../findings-final.json).

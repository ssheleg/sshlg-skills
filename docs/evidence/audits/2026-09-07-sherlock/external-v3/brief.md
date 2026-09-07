# Запрос и решения v3

Пользователь просит разобрать семь ссылок на шесть репозиториев, отобрать полезные методы UI/UX и authoring/testing, проверить зависимости до переноса, не добавлять ненужные packages/API keys, расширить семейные skills и полностью декомпозировать план для независимых исполнителей.

Результат этой итерации: pinned source audit + решения adopt/reference/optional/reject; локальные изменения doctrines; новая leaf queue с trace к прежним119parents и новым adoption parents. Полный runtime backlog, публикации и live installs в эту итерацию не исполняются. Исходный план сохраняется как provenance, v3 становится текущим планом разработки.

## Принятые технические решения

- Core dependency-free означает отсутствие НОВЫХ обязательных third-party packages, services, credentials и runtime downloads. Уже заявленные Python3/Node/host tools не маскируются как отсутствие вообще любого runtime. Foreign build dependencies не переносятся вместе с методами.
- Используем существующие owners: super-ux для сценариев/IA; sheleg-design для visual methods; make-skill для source intake/authoring; task-pipeline для decomposition/context; agent-evals/evidence-docs для outcome/evidence. Новый внешний orchestrator не добавляется.
- Приёмы переносим в локальные процедуры с собственными artifact contracts. Root LICENSE не автоматически распространяется на все subtrees. Неясное или ограниченное копирование → reference-only. Source attribution и excluded material сохраняются.
- Один leaf = один наблюдаемый outcome с локальным regression и docs. Небольшой исходный finding может остаться одним leaf: искусственное дробление не улучшает работу.
- Material decisions (interface, state ownership, auth, failure semantics, dependency policy) принимаются до implementation. Оставшаяся неизвестность оформляется bounded decision leaf, а не поручением исполнителю придумать систему заново.
- Primary context budget этого плана: 24KiB UTF-8. Это выбранный operational default для packets, не универсальный token limit модели. Optional o200k_base count в отчёте — named estimate для конкретной encoding, не знание runtime prompt. Большие документы — appendix; нужные source ranges materialized. Перед actual dispatch selected host меряет полный assembled prompt и добавляет upstream outputs.
- Визуальный метод не вводит запрет конкретного шрифта, палитры или стиля на все проекты; reviewer объясняет конкретную проблему на рендере. Clean/no-action допустим.
- Идентификаторы родительских119задач неизменны. Родители не dispatchable; их acceptance закрывается совокупностью leaf receipts + integration. Новые parents связываются с ними через related/dependency fields.
- Никаких новых API keys, MCP configs, npm installations, чужих binaries или внешних сервисов эта итерация не создаёт.

## Что нельзя обещать заранее

Полностью убрать необходимость инженерного суждения невозможно. План снимает повторное проектирование и явно перечисляет неизвестное. Future source drift, integration effects и результаты LLM требуют проверки по candidate code. Структурно полный packet не равен выданному execution grant или production-certified behavior.

# C29 — Cùng luyện API and plan persistence

Implements: `PRD-PLAN-001..005`, `PRD-ACC-005`, `PRD-BR-007`, `TA-ADR-001/006/014`.

Authorization: owner explicitly requested FE and BE implementation of the Cùng luyện plan on 2026-11-03. Dependencies: C26–C28, existing identity/family/entitlement/observation services.

Scope: Nest practice module, child-scoped catalog/plan/preparation endpoints, independent PracticePlan persistence, generated OpenAPI mobile client. Client composes explainable goal/lesson choices; server validates ownership, entitlement, curriculum/goal/lesson references and optimistic revisions. Deferral is persisted server state, not UI hiding. Do not overwrite LearningPlan.

Acceptance: all six practice routes enforce family ownership; plan writes/preparation require learning access, family plan/checkpoint reads remain available after expiry. Unknown/duplicate IDs, mismatched goals, deferred active selection and stale revisions fail safely. Local lesson metadata is available only under explicit APP_ENV=local; production/staging return unavailable content and cannot prepare fixtures.

Tests: service/security/schema unit tests, generated client against Nest/PostgreSQL integration, concurrent plan creation, expiry/cross-family/unknown lesson/independent learning-plan assertions. The API Jest command now pins the workspace Jest 30.5.2 and selects its own config explicitly, correcting a stale Jest 29 shim/version mismatch. Results are tracked in C32.

Migration: additive `20261103000000_guided_practice`; PracticePlan plus the checkpoint table used by C31. Applied only to local Docker PostgreSQL during verification. Existing account/child/learning plan/observation data remains unchanged. Deploy migration before application code in any other environment.

Rollback: hide new FE entry/disable practice endpoints while retaining tables and readers for family data. Do not drop populated tables or reset databases; a destructive schema rollback would require separately reviewed export/retention handling.

Out of scope: publishing clinical content, production encrypted pack/activation implementation, AI Custom Library, providers/services or numeric mastery decisions. This is not a claim that the entire feature plan is release-complete.

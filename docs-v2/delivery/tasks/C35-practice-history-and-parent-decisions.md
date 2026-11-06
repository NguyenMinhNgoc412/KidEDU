# C35 — Goal history and durable parent choices

Implements: `PRD-PROG-*`, `PRD-PLAN-001..005`, `PRD-ACC-005`. Dependencies: C29–C34 and existing observation pagination API.

Authorization: direct implementation request. Scope: paginated synchronized history, goal/context filters over loaded pages, retry/empty states, recent local observations and explainable recommendations. Parent goal/lesson selection and deferral persist through the versioned PracticePlan API; reload does not undo choices.

Acceptance: historical pages remain accessible after subscription expiry; superseded observations are excluded; event IDs prevent duplicate recommendation inputs; missing/conflicting evidence requests further observation, never numeric mastery. Filters explicitly apply to loaded pages; parents can load older observations. Shared observation store avoids a second progress authority.

Tests: recommendation scenarios, plan composer/deferral tests, real API CAS/ownership/expiry and browser goal/deferral reload plus history filter visibility. C32 owns execution evidence.

Migration/rollback: no new schema beyond C29 and C34. Reuse observation cursor contract and additive PracticePlan document. Hide history/decision controls without deleting synchronized observations or queued outbox. Recommendation thresholds remain `PRD-TBD-01`; production curriculum/release gates are outside this task.

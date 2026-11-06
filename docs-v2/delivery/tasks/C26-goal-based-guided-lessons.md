# C26 — Goal-based guided lesson catalog

Implements: `PRD-PLAN-004/005`, `PRD-ACT-008/009/010`, `PRD-CONT-002`, `TA-ADR-004/006`.

Authorization: owner directly requested implementation from product/08-classroom-curriculum-v2-adaptation.md on 2026-11-03. Dependency: C15 prepared runtime, C25 lesson selection, existing v1 content contracts.

Scope: extend the local synthetic catalog from three request lessons to seven lessons across request, real-object one/two-step commands, choice and refusal. Add goal labels/purposes and filtering in the existing Parent Zone picker. Show the selected goal in Today and overview. Retain existing water/ball/bear IDs, versions, generations and checkpoint semantics. No new taxonomy or backend schema.

Acceptance: each lesson validates against the existing published graph schema, has a primary goal, authored response/prompt/rubric/preparation and a transfer activity. Commands use distinct props and ordered actions; choice/refusal respect the child's preference. Production preparation continues to reject synthetic content.

Tests: catalog validation, distinct generations, original water compatibility, ordered command fixture, runtime/browser goal-selection scenarios and mobile checks. Actual results are recorded in C28 after verification.

Migration: none; additive catalog entries in the existing fixture database v2. Existing sessions retain their immutable snapshots. Rollback: remove new lesson selection entry points while retaining readers for saved lessons and observations; do not delete databases or outbox.

Out of scope: approved production corpus, recognition/naming/cloze media preparation, family-media target-role migration, signed activation/encrypted pack delivery, automatic prerequisite/mastery rules, sensor scoring, rewards and AI generation. Those require their own content/security tasks and cannot be represented as complete by these fixtures.

SOT impact: no SOT/architecture changes; detailed adaptation remains In review except for the directly authorized implementation scope here.

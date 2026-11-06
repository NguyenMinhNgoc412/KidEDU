# C27 — Authored guidance and observation semantics

Implements: `PRD-ACT-008/010`, `PRD-BR-006`, `PRD-PROG-*`, `PRD-SES-003/004`, `TA-ADR-006`.

Authorization: same direct owner request as C26. Dependencies: C15 session engine/repository and C26 guided content.

Scope: render the authored command instruction and natural consequence instead of request-only text. Show activity-specific observation rubrics and semantic prompt labels. Interpret assistance from prompt meaning rather than its array position. Store command observations as parent_guided; keep interaction-only request context and existing history unchanged. Add goal/activity labels to parent history.

Acceptance: model/visual prompts cannot produce independent observations; natural/independent cues do not become support solely because of index. Real-object commands never use screen taps as evidence of success. Repeat commands require parent-confirmed support. Parent handoff, readiness, wait, pause, deferred-not-observed, atomic observation/outbox and entitlement boundaries remain active.

Tests: semantic-prompt regression, command save/context and cold restore, existing engine/repository lifecycle checks, browser command → supported observation → transfer deferral → sync. Actual results are recorded in C28.

Migration: no schema or historical data rewrite. Existing session snapshots retain their content; new command events use their correct context. Rollback: revert guidance renderer changes if necessary, retain semantic assistance/context correctness and saved-event readers. No deleting history or converting legacy card statuses.

Out of scope: changes to authentication, authorization, premium security, sensor assessment, content contract or family-media persistence.

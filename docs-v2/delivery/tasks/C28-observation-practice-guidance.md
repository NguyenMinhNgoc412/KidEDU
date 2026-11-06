# C28 — Explainable practice guidance

Implements: `PRD-PLAN-003/004`, `PRD-BR-002/003/006`, `PRD-PROG-*`, `TA-ADR-006`.

Authorization: same direct owner request as C26. Dependencies: C26/C27 and account-specific runtime observation history.

Scope: deterministic next-practice suggestions in the parent lesson picker, scoped by child, goal and target. Ignore not_observed when a valid observation exists, preserve app/real-world differences and explain each recommendation. Parent explicitly selects a lesson; suggestions never change selection, unlock content or claim mastery. Parent may hide a suggestion for the current picker visit; this is transient UI deferral, not a persisted server-plan change.

Acceptance: all-skipped history requests another observation; supported suggests trying less help; not_yet suggests a simpler opportunity; independent suggests another context without mastery claims. If latest valid in-app observation is independent while the latest parent-guided one still needs support, suggest transfer. Read failure shows a safe message while manual selection remains available. No new network request in activity actions.

Tests: pure recommendation tests for skip handling, context differences, input ordering and child/goal/target isolation; existing SQLite atomicity/isolation tests; browser selection/filtering, command observation/context, no activity-loop requests and transient suggestion deferral; mobile checks.

Migration: none. Suggestions are derived from existing history (at most the latest 100 local records); they are not long-term mastery assessments or server learning plans. Rollback: remove suggestion UI/domain helper while preserving lesson selection and every observation/outbox record.

Out of scope: numeric thresholds (`PRD-TBD-01`), auto-advance, scheduled revision intervals, new API/database, production curriculum publication and native release certification. No new ADR or SOT changes.

Verification (2026-11-03): `pnpm check` passed bundled-media validation, TypeScript, ESLint and 58 Jest suites / 285 tests. `node scripts/learning-v2-web-smoke.cjs` passed Chromium at 320/390/768px with no page errors or horizontal overflow: goal filtering, command instructions, semantic prompt selection, parent-guided supported observation, transfer deferral, SQLite restore, stable retry, no activity-loop API requests and suggestion deferral preserving selection. The first browser run was interrupted by development hot reload during the final code edit; the complete rerun passed on stable code. Screenshots/results are in `artifacts/learning-v2/`; API responses were intercepted synthetic fixtures, so this is not backend/native evidence. Changed-file Prettier, task/adaptation relative links and whitespace checks passed. Native iOS/Android/device, signed production content and human content QA remain unverified. Temporary Metro was stopped after verification.

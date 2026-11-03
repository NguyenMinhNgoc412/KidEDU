# C25 — Parent lesson selection

Implements: `PRD-PLAN-005`, `PRD-SES-*`, `PRD-PROG-001/002`, `TA-ADR-005/006/010`.

Authorization: owner asked why parents cannot choose another lesson. Dependency: C15 local runtime, C23 illustrations, C24 integrated interface and Parent Gate.

Scope: a Parent Zone lesson picker for three synthetic requesting lessons (water, ball, teddy bear). Save selection by child in the account-specific runtime database. Today and prepared sessions use that selection; each lesson preserves its own paused checkpoint and original content generation. Keep production pack readiness and server learning plan unchanged. This is a local sample catalog, not an approved curriculum release.

Acceptance: parents can choose a different sample; Today shows and opens that lesson with matching illustration/instructions/response. Switching away and back resumes the original lesson without erasing observations/outbox. Choice is durable across reload, separated by child/account, and does not bypass Parent Gate or entitlement. Unknown selection fails preparation instead of silently opening another lesson. No network requests are added to activity actions.

Tests: prepared catalog validation, existing water generation compatibility, real-SQLite migration/selection/isolation/concurrent-session uniqueness, selected-generation hook preparation and invalid-ID rejection, full mobile checks; browser smoke at 320/390/768px including water → ball → water, SQLite restore and existing observation/sync/history assertions.

Migration: local fixture runtime schema v1 → v2 in the existing serialized transaction. Replace the one-open-session-per-child index with one-open-session-per-child-and-generation and add `lesson_selection`. Preserve session snapshots, observation rows and pending outbox. Existing water remains the default. No backend/API/content-contract migration; old runtime rejects schema v2 rather than trying an unsafe downgrade.

Rollback: remove picker/selection entry points and keep the v2 repository reader/migration so existing multiple paused lessons and pending observations remain accessible. Do not delete account databases or merge/drop checkpoints to recreate the old unique index. A full database downgrade requires a separate reviewed migration after all open sessions are resolved.

Out of scope: production library, server plan authoring/recommendation changes, new media production, subscription or authorization changes, native release certification.

SOT impact: no product/architecture invariant changes. README and changelog index this implementation.

Verification: `pnpm check` passed: bundled media validation, TypeScript, ESLint and 57 Jest suites / 278 tests. The migration repository suite was rerun after adding an explicit legacy-v1 migration assertion: all 8 tests passed. Chromium smoke passed at 320/390/768px with zero page errors/no horizontal overflow, water → ball → water selection, reload/SQLite resume at the original water activity, two preserved observations, no activity-loop API requests, stable duplicate retry and parent history. Screenshots/results are in `artifacts/learning-v2/`. Changed-file formatting and whitespace checks passed. Native iOS/Android checks have not been run. Temporary Metro is stopped after verification.

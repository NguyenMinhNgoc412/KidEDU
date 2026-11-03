# C15 — Prepared lesson / local observation / transfer slice

Implements: `PRD-PLAN-005`, `PRD-ACT-009/010/011`, `PRD-SES-*`, `PRD-PROG-001/002`, `PRD-SYNC-003`, `TA-ADR-003/005/006/010`.
Depends on: C14 Today, published graph contracts, local identity/API fixture, account-bound SQLite.
Status: Implemented for local development fixture; production runtime and eight media activity types remain open.

## Scope / acceptance

Today opens an explicitly labelled fixture through the integrated C24 interface. Preparation checks schema, versions, graph, required assets and renderer support, then freezes a PreparedLesson snapshot. The fixture contains functional communication and parent transfer; neither requires synthetic audio or pretend approved media. No production catalog/plan is altered. Production builds, public API origins and Supabase accounts cannot open or sync the fixture. C24 additionally permits private-LAN local Docker origins with explicit development opt-in.

Session engine implements overview, presentation, authored wait, bounded replay, prompt, observation, pause/resume, defer and finish. Wait gates prompt/observation; replay never creates progress. Every observation handoff requires a fresh parent hold, even if the general Parent Gate was already unlocked. Parent confirms the highest used prompt; independent cannot be selected after a model prompt. Defer records not_observed, never not_yet. No diagnostic or automatic pronunciation score.

SQLite atomically writes immutable observation, outbox and next checkpoint. Stable event IDs make retries safe; only accepted/duplicate acknowledgements remove outbox rows. Rejections stay stored, separate from pending. Parent dashboard displays local observation result/context/sync status separately from legacy progress and can retry sync without learning entitlement. Activity actions issue no API request; preparation checks child ownership once, sync happens outside the activity loop.

Background queues pause even if another checkpoint is in flight; foreground requires explicit resume. Connection reload validates checkpoint and resumes paused at the saved activity using its original snapshot/generation. Account close rejects old handles and preserves unsynced rows. Initialize runtime SQLite after legacy data initialization to avoid concurrent web SQLite startup/finalization failure found during browser testing.

## Files / tests

Route: `app/lesson-session.tsx`. Feature: `src/features/lessonRuntime/`. Entry/integration: TodayPlanCard, Parent dashboard, AppProviders and authenticated stack. `artifacts/lesson-runtime-web.cjs` validates 320/390/768px using real Expo web SQLite and intercepted synthetic API.

Tests include real Node SQLite rollback after injected outbox failure, connection close/reopen, stale/concurrent commits, account/child isolation, copied-DB rejection, lost acknowledgement/duplicate retry, immutable snapshots, wait/prompt/replay/defer rules, background during an in-flight write and unowned child rejection. This is not native process-kill, live backend, signed pack or store evidence. Final executed counts are recorded in the review.

Local SQL integration uses Node 22.22.0's built-in `node:sqlite`; CI already selects Node 22. README records this test-environment requirement. No SQLite test package is added to the mobile bundle.

## Migration / rollback

Additive, dedicated `lesson-runtime-<internal-account-id>.db`, runtime schema v1: runtime_meta/account, lesson_sessions, observations and outbox. No legacy global schema change, no conversion of familiar/view counts, no backend migration or dependency. Account binding is checked at initialization. The database contains only local-fixture records until a production security/data design is reviewed.

Rollback removes entry/provider/feature wiring while preserving the database and unsynced events; do not delete them automatically. Unsupported/corrupt checkpoints fail with recovery navigation, never reset user data. No SOT approval change; changelog records implementation evidence.

## Out of scope / remaining engineering

Production plan-to-pack preparation, signed grant/key delivery, all media-dependent renderers/player adapters, generation install, server contract expansion for full attempt/activity/lesson provenance, background sync orchestration and production export/delete remain separate tasks. The currently generated observation API carries its existing v1 subset; local session/snapshot retains detailed lesson/activity provenance. This slice does not certify full R01 or R02 completion.

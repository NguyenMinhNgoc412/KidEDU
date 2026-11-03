# C24 — Integrated guided learning interface

Implements: `PRD-PLAN-005`, `PRD-ACT-009/010/011`, `PRD-SES-*`, `PRD-PROG-001/002`, `TA-ADR-003/005/006/010/017`.

Authorization: owner requested a cohesive v2 feature instead of the rough prototype.
Dependencies: C15 account-bound prepared lesson/SQLite/outbox, C23 bundled illustrations, Gentle Growth design foundation.

Scope: one Today entry opens the persisted prepared-lesson flow. Replace the raw button stack with an illustrated overview/activity, authored waiting step, parent hold, explicit observation selection and save, transfer, pause/resume and completion. Remove duplicate prototype entry points; old prototype URL redirects to Today. Private-LAN fixture access requires explicit development opt-in and remains forbidden with Supabase identity or production builds. Production plan readiness is unchanged.

Acceptance: a clear primary action per step; existing wait/prompt/repeat constraints; fresh parent authorization per observation; no API in activity loop; preserved atomic progress/outbox writes and stable retry IDs. Reduced motion and background behavior use the existing illustration player. Illustrations pause during response waiting. Sample status is shown before entering the activity.

Tests: `pnpm check`; Chromium smoke at 320/390/768px using real Expo SQLite and intercepted synthetic API, including wait, parent hold, observation, restored session, transfer, failed acknowledgement/retry and parent history. Browser evidence does not establish native-device acceptance.

Migration: no database or API migration. `.env.example` documents `EXPO_PUBLIC_ENABLE_LOCAL_LESSON_FIXTURE`; local development `.env` opts in for the configured private LAN. Restart Metro to load environment changes.

Rollback: revert the C24 UI/entry/boundary changes and disable the fixture flag. Existing saved observations and family data remain intact.

Out of scope: production content readiness, pack publication, new curriculum, subscription/identity authority, schema changes or native release certification.

SOT impact: no product/architecture requirement change. README and changelog index this implementation.

Verification: `pnpm check` passed (default media validation, TypeScript, ESLint, 56 Jest suites / 274 tests). Chromium smoke passed at all three widths with zero page errors and no horizontal overflow: real SQLite restore, two observations, no activity-loop API calls, stable duplicate retry and parent history. Screenshots/results are in `artifacts/learning-v2/`. Native iOS/Android device verification has not been run. No schema migration or SOT change is required.

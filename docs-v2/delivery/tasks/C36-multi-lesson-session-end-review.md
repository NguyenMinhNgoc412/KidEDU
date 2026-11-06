# C36 — Multi-lesson session and end-of-session parent review

Implements: `PRD-ACT-*`, `PRD-SES-001..005`, `PRD-PROG-001/002`, `PRD-BR-006`, `TA-ADR-004/005/006`. Dependencies: C29–C35.

Authorization: owner corrected the feature flow explicitly: all lessons are learned within one session, then parents review every lesson at the end. Implementation continued on 2026-11-04. This supersedes the earlier one-lesson-per-session/interleaved-review interpretation.

## Behavior and acceptance

- Hub/preparation list all available sample lessons in one session. Goal/lesson preference prioritizes the first lesson; explicit plan deferrals exclude lessons from the next session.
- Prepare and authorize every lesson before starting. Snapshot lesson order, activities and scoped media; existing family role replacements are namespaced per lesson.
- Learning completion/skip advances immediately without Parent Gate, review form or observation event. Keep prompt/replay/skip evidence and occurrence time per lesson; taps and completion do not imply achievement.
- After the last learning lesson, show Parent Gate once and review lessons in original order. Each review uses that lesson's rubric and prompt evidence; skipped lessons require not_observed. No automatic transfer result is invented.
- Commit each review with checkpoint + observation + outbox in one SQLite transaction, with stable session/lesson event IDs. Resume interrupted learning/review paused at the correct cursor. Parents may finish already saved reviews after learning expiry.
- Cloud checkpoint validates immutable lesson order, append-only learning attempts and monotonic review cursor; retries are idempotent. No family URI/token/key/PII in cloud state.
- Browser media consumes play() promises during fast skip/unmount; native reuses the existing player. No API in activity/review loop; preparation/leave/explicit sync remain the network boundaries.

## Verification

Unit tests cover all-learning-before-review, skipped lesson semantics, original occurrence time, separate event IDs, safe paused restore, corrupt evidence rejection, access-expired local review, and real SQLite failure rollback/per-lesson records. API unit/PostgreSQL tests cover full-course preparation, invalid course membership, immutable evidence, review rewind and post-expiry checkpoint sync. `scripts/practice-course-web-smoke.cjs` exercises the complete 14-lesson course and 14 parent reviews against real local Nest/JWKS/PostgreSQL at phone/tablet widths; see `artifacts/practice-feature/course-results.json` after execution. Execution results must be reported from the final run, not inferred from earlier C32 evidence.

## Migration, rollback and limits

Final execution (2026-11-04): frontend `pnpm check` passed 62 suites / 300 tests plus media validation/typecheck/lint. Backend `pnpm check:api` passed 11 suites / 44 tests, typecheck/lint/build; real PostgreSQL `test:db` passed 4 suites / 6 tests including course prepare/review and expired sync. Chromium course scenario passed at 320/390/768 px: 14 learning items followed by 14 parent reviews, per-lesson results persisted through the real API, no API calls inside the learning/review loop and no browser runtime errors. Screenshots and `course-results.json` are under `artifacts/practice-feature/`. Native/device/store release evidence is not implied by these checks.

Additive optional course fields in existing JSON snapshots/checkpoint contract; no SQL migration or data reset. New sessions use `practice-course:` generations, preserving old Học and single-lesson practice checkpoints/history. Deploy updated backend validation before updated client. Rollback hides the new entry while retaining course parser/fields/readers and all observations/outbox; old binaries cannot safely resume new course snapshots.

PRD/activity/adaptation/IA/changelog were updated for the owner's flow correction; no provider/architecture change or ADR. Samples remain local-only; native device/content/store gates in C32 remain open.

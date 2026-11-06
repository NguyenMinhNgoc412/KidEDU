# C32 — Cùng luyện verification and remaining coverage

2026-11-04 update: [C36](./C36-multi-lesson-session-end-review.md) supersedes the earlier one-lesson/interleaved-review flow. New sessions learn the complete list before parent reviews. The evidence below records the preceding sample implementation; current multi-lesson execution evidence is tracked in C36 and `course-results.json`. `practice-feature-web-smoke.cjs` now delegates to the course scenario.

Implements: `PRD-NFR-*`, `PRD-ACT-*`, `PRD-MEDIA-*`, `PRD-SES-*`; depends on C29–C35 and the [feature plan](../10-guided-practice-feature-plan.md).

Authorization: direct owner FE/BE implementation request, followed by explicit instruction to use existing samples. Scope: implement and verify the sample-backed feature without treating fixture evidence as production release approval.

## Implemented

- Three-tab navigation, independent hub, parent goal/lesson selection, persistent deferral and preparation.
- Real Nest/PostgreSQL practice plan/checkpoint APIs, generated mobile client, ownership, entitlement, optimistic revisions and idempotency.
- Fourteen synthetic lessons covering all ten activity types with separate interactions, scoped local image/audio/video, expressive-first naming, authored cloze segments and parent observation/transfer.
- Local atomic checkpoint/observation/outbox, cloud state references, paused restore, retry and recent-history recommendations.
- Parent family-media stage/preview/confirm/fallback, child-target-activity-role binding, safe retention of assets referenced by saved sessions and expiry-accessible management.
- Paginated synchronized history with filters over loaded pages, local observations and durable parent plan decisions.

## Verification

`pnpm check:api`: generation, typecheck, lint, 11 suites / 42 tests and build passed. `pnpm --filter @kidedu/api test:db`: 4 suites / 6 tests passed against local PostgreSQL, including generated frontend-client calls, ownership, CAS, retry/expiry and separate LearningPlan preservation.

`pnpm check`: bundled media validation, typecheck, lint, 61 suites / 295 tests passed. Coverage includes all activity contracts/readiness, account/child/MIME rejection, naming/cloze prompt slots, seeded option ordering, observation semantics, cold restore and real SQLite migration/media isolation.

`scripts/practice-feature-web-smoke.cjs`: real local Nest/JWKS/PostgreSQL, no intercepted API responses; passed at 320/390/768 px. Covers new tab, Parent Gate, goals/selection, preparation, command, parent observation, transfer skip, sync, persisted deferral/reload and no API calls inside activity loop.

`scripts/practice-media-web-smoke.cjs`: passed seven media lessons at 390 px, naming before model, recognition selection without scoring, cloze, both preference answers, local preparation and no activity API calls; family image picker → preview → commit → file export → bundled fallback and history-filter visibility. Model/recognition/cloze also passed media-driven transition into waiting. Evidence and screenshots are in `artifacts/practice-feature/`.

Tests create/use only the synthetic seeded local account's Local Practice Test Child; its practice plan is test state. No production deploy, store purchase, public publication or external communication occurred. API Docker image and additive PostgreSQL migration are applied locally with the existing LAN bind preserved.

## Remaining Store Release gates

| Area  | Remaining evidence                                                                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P6–P9 | Native media/recording/permissions, accessibility, background/process kill, low storage, account switch, export/erasure and retained-session media lifecycle. Browser and SQLite evidence does not prove native behavior. |
| P10   | Reviewed full corpus, rights/provenance/modality QA, signed activation and encrypted production lesson packs through release workstreams R01/R02. Samples remain development-only.                                        |
| P11   | iOS/Android device evidence, sandbox expiry/refund and full security/content/store release review.                                                                                                                        |

Owner's sample choice removes the need to wait for a new corpus to run the sample feature. It does not invent professional approval, mastery thresholds or production publishing authority. Existing `PRD-TBD-01`, `PRD-TBD-02`/`CUR-TBD-01` and review/security gates remain at their owning specs.

Migration/rollback: C29 owns additive PostgreSQL tables; C34 owns additive SQLite v3. Hide feature/editor/sync entry points before disabling endpoints, keep readers/tables/assets and queued observations; never reset family data to roll back UI. No SOT stack/provider change or new ADR; IA/data/contract/README/changelog record the authorized feature changes.

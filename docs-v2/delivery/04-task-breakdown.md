# Implementation Work Breakdown

| Thuộc tính | Giá trị                        |
| ---------- | ------------------------------ |
| Trạng thái | `In review`                    |
| Owner      | Technical owner                |
| Depends on | Approved SOT/specs and Roadmap |
| Cập nhật   | 2026-09-08                     |

Đây là work breakdown theo dependency, không phải permission để implement requirement chưa approved. Mỗi task khi tạo phải có requirement IDs, acceptance, tests, migration/rollback và out-of-scope.

## Workstream A — Foundation

- A01 workspace/CI/contracts/tooling;
- A02 Docker NestJS/Fastify baseline/health/observability;
- A03 Supabase PostgreSQL/Supavisor/Prisma connection budget và migration pipeline;
- A04 Supabase Auth mobile/JWT-JWKS server adapter/internal account/custom SMTP gate;
- A05 mobile app bootstrap/API generated client/account namespace;
- A06 isolated staging Supabase/Cloud Run/R2/KMS/Secret Manager, daily logical backup/restore và Cloud Run revision rollback.

## Workstream B — Content platform

- B01 target/activity/lesson JSON schemas;
- B02 admin auth/catalog editor/review;
- B03 asset ingest/provenance/QA;
- B03a Veo/audio/image authoring profile, FFmpeg normalization, Reanimated/SVG/Lottie recipe registry và modality QA;
- B04 deterministic pack builder/sign/encrypt;
- B05 Drive ingest → encrypted R2 publish/manifest/release/retire;
- B06 mobile manifest/download/verify/atomic install/cache.

## Workstream C — Access/sync

- C01 Apple/Google store products, native IAP, server adapters, notification/RTDN và reconcile;
- C02 entitlement/activation grant/KMS key delivery;
- C03 mobile entitlement guards/account switch;
- C04 bootstrap/user delta/outbox/idempotency/conflict;
- C05 expiry/refund/resubscribe and tamper tests.
- C06 local reminder permission/schedule/privacy/account-switch tests; không backend push.

## Workstream D — Learning product

- D01 onboarding/goal discovery/plan domain;
- D02 Today/lesson overview/prepared lesson;
- D03 session state/checkpoint/lifecycle shell;
- D04 word/mouth, recognition, naming activities;
- D05 cloze, sentence, yes/no, Q&A activities;
- D06 command, functional and transfer activities;
- D07 controlled Auto Play;
- D08 observation/progress/recommendation.

## Workstream E — Parent/media/privacy

- E01 parent dashboard/plan controls/child switch;
- E02 family media local binding/encryption;
- E03 R2 presigned upload/quota/cloud status;
- E04 downloads/storage management;
- E05 privacy inventory/export/delete;
- E06 settings/accessibility/sensory controls.

## Workstream F — Release

- F01 content corpus production;
- F02 store subscriptions/paywall/disclosures;
- F03 security/privacy/accessibility audit;
- F04 performance/load/device/lifecycle QA;
- F05 Supabase logical backup/restore/pause/quota, Cloud Run revision và incident/cost runbooks;
- F06 beta, store assets/submission/staged rollout;
- F07 provider accounts/IAM/store credentials, EAS Free iOS build/submit, free-tier budget/quota dashboard và Pro/VPS trigger review.

## Post-release workstream — AI custom library

Không tạo task này trong v1 backlog. Sau SOT approval cho phase mới mới tách thành custom schema/prompt, generation job/dispatcher/provider, preview UX, credit ledger, private pack và privacy/cost/resilience work.

## Task template

```md
Goal:
Implements: PRD-..., TA-ADR-...
Depends on:
Scope / Out of scope:
Acceptance scenarios:
Data/API/schema changes:
Security/privacy/operations impact:
Tests:
Migration/rollback:
Docs/changelog:
```

Không giao một task đồng thời thay schema, toàn learning engine, nhiều screen và backend endpoint. Tách tại contract/vertical slice nhưng giữ E2E integration milestone.

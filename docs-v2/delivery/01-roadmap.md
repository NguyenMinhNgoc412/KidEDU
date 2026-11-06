# Store Release v1.0 Delivery Roadmap

| Thuộc tính   | Giá trị                                    |
| ------------ | ------------------------------------------ |
| Trạng thái   | `In review`                                |
| Owner        | Product/Technical owner                    |
| Derives from | Product Brief, PRD, Technical Architecture |
| Cập nhật     | 2026-11-05                                 |

Phase là delivery stage, không phải MVP. Public release chỉ xảy ra khi toàn bộ release gate đạt.

## Phase 0 — Decisions and proofs

- approve three root SOTs;
- close brand/trial/auth/retention/support matrix decisions needed now;
- POC Expo crypto/key lifecycle, direct StoreKit 2/Google Play Billing + server verification sandbox, Supabase Auth JWT/session, Cloud Run cold-start/revision deploy, Supavisor/Prisma connection budget, logical dump/restore và R2 presigned transfer;
- POC local notification lifecycle trên thiết bị thật;
- POC default media corpus: Veo mouth clip, human/TTS Vietnamese audio, FFmpeg profile, Reanimated/SVG/Lottie motion và device playback/listening QA;
- measure initial content/pack/media corpus;
- resolve design tokens and prototype critical flow;
- anonymize/remove research PII from repository scope.

**Exit:** proof reports, no architecture blocker, cost envelope và ADRs approved.

## Phase 1 — Platform foundation

- target monorepo/workspaces, CI, environment/secrets;
- Docker NestJS/Fastify skeleton, auth, account/family/child;
- PostgreSQL schema/migration and OpenAPI generated client;
- mobile bootstrap, namespace, migrations, API/auth adapters;
- observability, health, isolated Supabase/Cloud Run/R2 staging, daily backup và restore baseline.

**Exit:** login → child profile round-trip staging; deploy/rollback/restore rehearsal.

## Phase 2 — Content platform and secure delivery

- curriculum schema/admin/editorial workflow;
- Node pack builder, signing/encryption, R2 publish;
- manifest/bootstrap/delta, download/resume/verify/atomic install;
- activation grant/content key and cache management;
- content QA fixtures.
- deterministic media normalization/provenance pipeline cho video/audio/image/animation.

**Exit:** signed pack build → publish → mobile ready → expiry lock end-to-end.

## Phase 3 — Learning product

- onboarding/goal discovery/client plan rules;
- Today/lesson overview/session shell/checkpoint;
- all `PRD-ACT-001..010`, controlled Auto Play;
- observation/outbox/progress/recommendation;
- parent-guided transfer.

**Exit:** complete representative curriculum path end-to-end with lifecycle/accessibility tests.

## Phase 4 — Personalization and parent operations

- target search/family media binding;
- capture/import/preview/encryption/local resolver;
- cloud upload/quota/inventory/retention;
- plan controls, progress views, settings, downloads/storage;
- notification preferences, local schedule/resume prompt/deep link;
- privacy inventory/export/delete.

**Exit:** media/account switch/delete/low-storage/privacy scenarios pass.

## Phase 5 — Commercial and release hardening

- direct Apple/Google purchase/restore/server notification/RTDN/reconcile/paywall;
- trial/expiry/grace/refund/revoke;
- store disclosures, privacy/legal, support;
- performance/security/content/accessibility QA;
- staged beta, production runbook, cost/alert tuning;
- store submission and staged rollout.

**Exit:** PRD Release Acceptance và release checklist 100% blocking items pass.

## Dependency critical path

```text
SOT/POC
→ identity/data/API
→ content schema + pack/security
→ learning engine/activities
→ progress/media/subscription
→ hardening/store release
```

UI foundation, admin and content authoring có thể chạy song song sau khi schema/flow approved. Không author toàn bộ content trước khi activity fixtures/usability được xác nhận.

## C50 — Phạm vi bổ sung Store Release v1.0

C50 là task tổng v1 cho bốn tab/free/basic/daily games/rewards/manual và AI authoring. Thực thi theo P0–P10 với dependency/acceptance/rollback riêng; AI không còn phase sau. Các phase core trước đây vẫn bắt buộc. Xem [C50](./tasks/C50-four-tabs-daily-games-freemium-ai.md).

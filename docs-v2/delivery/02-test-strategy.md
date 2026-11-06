# Test Strategy

| Thuộc tính | Giá trị                                                 |
| ---------- | ------------------------------------------------------- |
| Trạng thái | `In review`                                             |
| Owner      | QA + Engineering                                        |
| Implements | `PRD-NFR-*`, PRD release acceptance, architecture gates |
| Cập nhật   | 2026-11-05                                              |

## 1. Principles

Risk-based pyramid, deterministic domain tests, real integration at persistence/crypto/billing boundaries, device tests for native behavior và production-like staging. Không dùng coverage % thay evidence cho critical flows.

## 2. Test layers

| Layer               | Tools                                 | Scope                                              |
| ------------------- | ------------------------------------- | -------------------------------------------------- |
| mobile/domain unit  | Jest                                  | plan/activity/readiness/state machines/resolver    |
| mobile component    | RNTL                                  | states, prompts, accessibility, lifecycle adapters |
| mobile integration  | Jest/native harness/device            | SQLite/files/outbox/migration/crypto/player        |
| backend unit        | Jest                                  | policies/use cases/entitlement/conflicts           |
| backend integration | Testcontainers/Supertest              | PostgreSQL, API, migration, idempotency            |
| contract            | OpenAPI/JSON Schema fixtures          | client-server/content compatibility                |
| E2E                 | Maestro + staging APIs                | critical parent/child flows                        |
| external sandbox    | Supabase/R2/Apple/Google Play/Pub/Sub | auth, DB pool, direct purchase, events, transfer   |
| non-functional      | load/security/device/manual           | performance, tamper, low storage, accessibility    |

## 3. Critical E2E suites

1. first launch/login/consent/profile/initial plan/first pack/lesson;
2. prepared session, all representative activities, observation and sync;
3. background/foreground/process kill/resume;
4. family media capture/import/cancel/save/fallback/upload/delete;
5. trial/purchase/restore/expire/refund/revoke/resubscribe;
6. account switch/no data leak;
7. corrupt pack/no space/failed delta keeps active generation;
8. export/delete account;
9. app/content/API version migration;
10. local reminder permission, schedule/cancel, deep link, privacy copy và account switch;
11. screen reader/large text/reduce motion.

## 4. Content QA

Schema validation không thay linguistic/editorial review. Mỗi default release sample/test toàn bộ classifier/câu/pause marker, expected response, balanced Có/Không, audio clarity, mouth video/lip-sync, illustration/motion fallback, provenance/license và activity readiness. Content release có automated fixture playback/screenshot/listening plus human sign-off.

## 5. Security/privacy

Authorization matrix theo role/family/child/object; ID enumeration/BOLA; token replay/revocation/JWKS rotation; presigned URL; webhook spoof/order; cache copy/clock rollback/grant tamper; log/media leakage; upload bomb; admin privilege; secret/container scan; deletion completeness.

## 6. Performance/resilience

Đo startup/warm resume/lesson start, Cloud Run cold start, DB migration, list/render, pack verify/install, player memory, API p95, Supavisor/Prisma pool, concurrent activation/sync, dependency pause/outage, network loss, low storage/battery và background constraints trên reference devices.

AI custom generation thuộc v1: quota/ledger idempotency, provider failure/privacy/cost cap, preview/approval và private pack E2E là gate C50 P8–P10. Daily-game gate gồm reset 00:00, cross-device, stale outbox/claim và disabled CTA; free/full access và migration phải test.

## 7. Test data

Synthetic/anonymized only. Không dùng DOCX/family media production. Fixtures có Vietnamese diacritics, long labels, duplicate/out-of-order events, large catalogs và corrupted bytes.

## 8. CI gates

PR: lint/type/unit/schema/OpenAPI diff/secret scan. Main: integration/container/content fixture. Release candidate: E2E/device/store sandbox/security/accessibility/migration/restore/performance. Flaky test phải quarantine có owner/deadline, không silently rerun vô hạn.

## 9. Defect severity

P0 data/privacy/security loss or widespread outage; P1 core learning/purchase/sync broken; P2 recoverable feature error; P3 cosmetic. P0/P1 blocking release; known P2 cần product/risk sign-off.

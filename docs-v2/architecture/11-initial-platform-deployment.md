# Initial Platform Deployment Specification

> C50 target update 2026-11-05 — TA-ADR-026: bổ sung AI worker/provider secret/quota/budget/IAM và dispatcher sau C50-D03/POC; không provision Cloud Tasks mặc định. Số liệu sizing/cost cũ chưa bao gồm free DAU và AI job mới; phải cập nhật trước release.

| Thuộc tính | Giá trị                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Trạng thái | `In review`                                                                                    |
| Owner      | Backend + Operations                                                                           |
| Implements | `TA-ADR-012`, `TA-ADR-016`, `TA-ADR-020`, `TA-ADR-022..024`                                    |
| Depends on | [Backend](./02-backend-architecture.md), [Operations](./07-operations-observability-backup.md) |
| Cập nhật   | 2026-11-05                                                                                     |

## 1. Baseline and non-goals

Baseline initial production:

- Cloud Run request-based tại `asia-southeast1` chạy OCI image NestJS/Fastify;
- Supabase Free project cho PostgreSQL + Auth;
- Cloudflare R2 Standard cho content, family media, export và encrypted database backup;
- Google Drive 5 TB cho source/master/archive;
- Secret Manager/KMS cho server secret và envelope-key operations;
- Firebase project chỉ cho mobile Crashlytics;
- Cloud Scheduler + Cloud Run Job cho backup/cleanup/reconcile nhỏ.

Không dùng Supabase Edge Functions, Data API, Realtime hoặc Storage trong baseline. Không chạy GCE/VPS, Caddy, self-hosted PostgreSQL, WAL-G, Kubernetes, Redis/Kafka hoặc remote push ở stage này.

## 2. Account/project inventory

Mỗi resource có owner, MFA, recovery, billing alert và staging/production separation:

| Provider          | Resource production                                                                                 | Purpose                             |
| ----------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| GCP               | project, Cloud Run service/jobs, Artifact Registry, Scheduler, Secret Manager/KMS, Logging, Pub/Sub | API/runtime/secret/Google Play RTDN |
| Supabase          | production project                                                                                  | PostgreSQL + parent Auth            |
| Cloudflare        | R2 buckets/access keys                                                                              | runtime objects + offsite DB backup |
| Firebase          | production mobile app project                                                                       | Crashlytics only                    |
| Apple/Google Play | app/store products/server credentials                                                               | subscription authority              |
| Expo              | EAS Free project                                                                                    | iOS build/submit only               |
| Domain/DNS        | official domain and `api` hostname                                                                  | website/store links/stable API      |
| Google Drive      | owner-controlled source folder                                                                      | content master/archive only         |

Không dùng cùng secret/access key giữa staging và production. Break-glass recovery record không nằm trong repository/chat/Drive content folder.

## 3. Provisioning order

1. Chốt provider owner, MFA/recovery và naming convention.
2. Tạo isolated staging resources trước; production chỉ tạo từ reviewed IaC/runbook.
3. Tạo Supabase project, database roles/policies và Auth providers; không expose application tables qua client workflow.
4. Tạo R2 buckets `content`, `family-media`, `exports`, `db-backup`; tạo least-privilege access keys riêng theo workload.
5. Tạo GCP runtime service account, Artifact Registry, Secret Manager/KMS, Cloud Run service/job và Scheduler.
6. Deploy migration job, API no-traffic revision và health checks.
7. Chọn/verify stable HTTPS ingress theo `TA-TBD-012`; cấu hình callback/redirect/store notification URLs.
8. Chạy auth, DB pool, R2 presign, backup/restore và store sandbox POC.
9. Chỉ nhân bản sang production sau staging rehearsal và security review.

## 4. Configuration contract

Tên config là contract triển khai tham khảo; giá trị thật nằm trong environment/secret provider:

```text
APP_ENV
PORT
PUBLIC_API_ORIGIN
SUPABASE_URL
SUPABASE_JWT_ISSUER
SUPABASE_JWT_AUDIENCE
SUPABASE_JWKS_URL
DATABASE_POOL_URL
DATABASE_MIGRATION_URL
R2_ACCOUNT_ID
R2_ENDPOINT
R2_CONTENT_BUCKET
R2_FAMILY_BUCKET
R2_EXPORT_BUCKET
R2_BACKUP_BUCKET
KMS_CONTENT_KEK_ID
KMS_SIGNING_KEY_ID
APPLE_*
GOOGLE_PLAY_*
OTEL_*
```

Database password, Supabase service-role key, R2 access secret, store key và signing/key material là secret. Log/startup error chỉ nêu tên config thiếu, không in giá trị.

## 5. Cloud Run service

- Billing: request-based; `min-instances=0` initial production.
- Region: `asia-southeast1` trừ khi latency/cost POC chọn khác bằng ADR.
- Image: immutable digest, non-root, read-only filesystem khi khả thi, graceful shutdown.
- Scale: max instances/concurrency/pool được tính cùng Supabase connection budget; không để default unbounded.
- Network: outbound chỉ tới Supabase/R2/KMS/store APIs/telemetry cần thiết; ingress HTTPS qua stable domain.
- Health: startup kiểm config; liveness chỉ process; readiness kiểm bounded critical dependency mà không gây thundering herd.
- Deployment: no-traffic revision → smoke → progressive traffic → rollback revision.
- Binary media không proxy qua API; API chỉ cấp presigned R2 operation sau authorization.

Cold start được tính vào SLO app-open. Mobile giữ local data/UI, hiển thị retry có kiểm soát và không xóa session/cache khi bootstrap nhận dependency error.

## 6. Supabase PostgreSQL connection policy

- Runtime Cloud Run dùng Supavisor transaction mode, phù hợp short-lived/serverless connection.
- Migration/backup dùng direct endpoint khi runner có IPv6; nếu không, dùng Supavisor session mode sau compatibility POC.
- Prisma transaction/prepared statement/migration behavior phải có integration test trên endpoint thật của staging.
- `max_instances × pool_per_instance + migration/backup/admin headroom` phải nhỏ hơn provider connection quota.
- Migration là SQL reviewable/forward-compatible; không dùng Supabase-only extension/API nếu chưa có fallback.
- Database đạt 70% của 500 MB hoặc egress đạt 70% của 5 GB/tháng thì alert và tạo upgrade/migration decision trước hard limit.

Mobile không chứa database URL/password/service-role key và không gọi Supabase Data API. RLS nếu bật là defense-in-depth, không thay app-server authorization.

## 7. Supabase Auth flow

1. Mobile dùng Supabase Auth client để login/refresh session và lưu refresh/access token trong platform secure storage.
2. Mobile gửi access token tới KidEDU API.
3. `SupabaseIdentityAdapter` verify issuer/audience/signature/expiry qua cached JWKS, áp dụng revoke/session policy.
4. Adapter map provider subject vào `auth_identities`; application chỉ dùng internal `accounts.id`.
5. Account switch/logout đóng learning session, purge/isolate account namespace, key và sensitive cache theo mobile spec.

Phone/SMS không thuộc v1. Default Supabase SMTP chỉ development; production email verification/reset bị block đến khi `TA-TBD-011` chốt custom SMTP/domain và SPF/DKIM/DMARC.

## 8. R2 object policy

- `default-content`: immutable encrypted pack/media; download presign chỉ sau entitlement/content authorization.
- `family-media`: private, family/account scoped, quota/consent/retention; không public link.
- `exports`: private, short TTL/lifecycle.
- `db-backup`: encrypted dump, credential/retention tách biệt; runtime API không có delete permission.
- Object identity là logical key + SHA-256 + size; presigned URL không persist làm identity.
- R2 credential chỉ ở server/CI/job secret; mobile nhận method/object/TTL-scoped presigned operation.
- Bucket CORS chỉ mở method/header/origin thực sự cần cho admin/web tooling; native mobile không phải lý do dùng wildcard public policy.

Drive source file phải qua ingest/validation/transcode/review/hash/encrypt trước khi publish R2. Drive ID/link không xuất hiện trong production manifest.

## 9. Backup and restore implementation

Daily Cloud Run Job:

1. acquire PostgreSQL advisory lock cho backup run;
2. execute pinned, provider-supported logical dump;
3. verify exit status/non-empty/schema manifest;
4. compress, encrypt và calculate checksum;
5. upload immutable object vào R2 backup bucket;
6. read-after-write verify size/checksum metadata;
7. persist backup result/metrics rồi release lock;
8. lifecycle cleanup chỉ sau retention check và không xóa last-known-good.

Restore drill dựng PostgreSQL isolated, restore roles/schema/data theo documented order, apply/verify migrations, kiểm row counts/constraints/identity mapping và chạy API smoke. Restore report phải nêu rõ phần Supabase-managed auth nào có hoặc không có trong dump; account-recovery/migration path phải test riêng.

## 10. Release readiness thresholds

- Cloud Run request/error/latency/cold-start dashboard hoạt động.
- Supabase DB/egress/MAU/connection dashboard và 70% alerts hoạt động.
- R2 storage/operation/inventory và backup-freshness alerts hoạt động.
- Daily backup có ít nhất một isolated restore pass.
- Supabase pause/outage, R2 outage và Cloud Run cold-start có device UX test.
- Apple/Google sandbox purchase/renew/cancel/refund/revoke và webhook replay/out-of-order pass.
- Stable API hostname, callback URLs, privacy/support website và credential rotation runbook được verify.
- Cost budget alert không auto-shutdown production.

## 11. Upgrade/migration triggers

Không đợi “nhiều user” mới nâng cấp. Trigger gồm paying-user incident, Supabase pause/no-SLA risk không còn chấp nhận, backup/RPO không đạt, quota đạt 70%, DB pool saturation, Cloud Run sustained cost gần VPS hoặc runtime cần always-on.

Thứ tự ưu tiên:

1. Supabase Free → Pro nếu chỉ cần no-pause/managed backup/quota/support tốt hơn.
2. Cloud Run → VPS/Compose nếu sustained compute/economics phù hợp; giữ Supabase/R2 trước để giảm blast radius.
3. Supabase → PostgreSQL managed/self-hosted riêng bằng verified dump/reconciliation.
4. R2 → S3/GCS/B2 bằng adapter + copy/checksum/dual-read window.

Mỗi migration đổi một stateful boundary tại một thời điểm, có rollback window và không yêu cầu mobile đổi API hostname/contract.

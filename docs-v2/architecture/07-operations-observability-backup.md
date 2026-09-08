# Operations, Observability, Backup & DR

| Thuộc tính | Giá trị                                      |
| ---------- | -------------------------------------------- |
| Trạng thái | `In review`                                  |
| Owner      | Technical owner                              |
| Implements | `TA-ADR-020`, `TA-SLO-*`, `PRD-NFR-006..008` |
| Cập nhật   | 2026-09-08                                   |

## 1. Operability objective

Một người có thể deploy, quan sát, rollback và khôi phục hệ thống bằng runbook/versioned automation, không chỉnh production thủ công thường xuyên. Baseline initial production gồm Cloud Run request-based tại `asia-southeast1`, Supabase Free PostgreSQL/Auth và Cloudflare R2 Standard private storage. Firebase chỉ dùng Crashlytics; Apple/Google store APIs, Pub/Sub cho Play RTDN, Secret Manager/KMS, Cloud Scheduler và Cloud Logging/Monitoring là các dịch vụ ngoài cần thiết.

Free tier chỉ là cost stage. Supabase Free không có uptime SLA/automatic backup và có thể pause sau inactivity; hệ thống không được tuyên bố HA. API image, PostgreSQL data và object inventory phải migrate được sang VPS/managed PostgreSQL/S3-compatible storage khi cost, quota, incident hoặc RPO/RTO yêu cầu.

## 2. Environment topology

| Env        | Data/credentials                                                               | Purpose                                     |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| local      | Testcontainers/local PostgreSQL; MinIO/R2 test; fake identity/billing          | development                                 |
| staging    | separate Supabase project, Cloud Run service/job, R2 bucket và store sandbox   | integration/store sandbox/release rehearsal |
| production | dedicated Supabase project, Cloud Run service/job, R2 buckets và store product | real users only                             |

Staging có thể scale-to-zero nhưng không dùng chung database, bucket hoặc credential với production. Không copy production child/family media xuống local/staging. Supabase Free chỉ cho hai active project trên account/organization limit hiện hành; provisioning phải kiểm quota trước và dùng separate ownership/IAM hợp lý.

## 3. Deployment

```text
merge/tag
→ lint/test/contract/migration check
→ Docker multi-stage build + SBOM/scan
→ push Artifact Registry by immutable digest
→ verify latest logical backup + successful restore-drill status
→ run expand-compatible migration as Cloud Run Job
→ deploy no-traffic Cloud Run revision
→ smoke revision URL/readiness and critical dependencies
→ shift traffic progressively to new revision
→ observe SLO; retain previous revision during rollback window
→ on failure shift traffic back; prefer forward-fix for migrated schema
```

Destructive/contracting migration chỉ chạy sau compatibility window và backup verification. Content release độc lập API deploy nhưng có manifest compatibility/kill switch. Stable `api.<domain>` không được hard-code Cloud Run service URL trong domain/mobile code.

## 4. Runtime configuration

- Cloud Run: request-based billing, `min-instances=0`; max instances, concurrency, CPU/RAM, timeout và request body limit phải explicit.
- Connection budget: `max_instances × Prisma_pool_per_instance + job/admin headroom < Supabase connection limit`. Runtime dùng Supavisor transaction mode; migration/backup dùng direct IPv6 hoặc session mode đã POC.
- Runtime service account chỉ đọc secret cần thiết và gọi đúng GCP APIs. Không có long-lived GCP JSON key hoặc `.env` trong image/repository.
- Supabase `service_role`, database URL, R2 access key, store credential và content signing/KMS references nằm trong Secret Manager; rotation procedure bắt buộc.
- R2 content, family, export và database-backup tách bucket/prefix, credential và retention. Mobile chỉ nhận presigned operation giới hạn object/method/TTL.
- Request retry có timeout/backoff/jitter; không retry mù non-idempotent command. Cold start/dependency failure trả safe error code để mobile giữ local data và retry.
- Stable API ingress được chọn tại `TA-TBD-012`; DNS TTL và cutover runbook phải cho phép chuyển Cloud Run sang VPS mà không phát hành mobile version mới.

## 5. Monitoring

- Cloud Run: request count, instance/cold-start, CPU, memory, concurrency, container start failure, p50/p95/p99 latency và error code.
- Supabase: database size, egress, connections/pool wait, locks, slow queries, auth MAU/error và project health/pause state.
- R2: stored bytes, Class A/B operations, presigned failure, inventory mismatch và backup retention.
- Domain: activation success, entitlement mismatch, sync lag/outbox, webhook lag, pack download/verify/install và upload/finalize.
- Mobile: crash-free session, app start, bootstrap retry, lesson ready/start và playback failure.
- Cost: Cloud Run, Artifact Registry, logging, Scheduler/Pub/Sub, Supabase plan/quota, R2 storage/operations và store commission.

Alert theo user impact với runbook link; không page vì warning không hành động được. Tối thiểu alert khi API dependency/down, database/egress đạt 70% free quota, DB connection exhaustion, không có successful daily backup, restore drill stale, billing webhook/reconcile lag, error/latency vượt SLO hoặc budget forecast vượt ngưỡng.

## 6. Logging/tracing

Pino structured logs + correlation/account pseudonymous ID; OpenTelemetry trace qua controller/service/external calls; Cloud Error Reporting cho backend và Firebase Crashlytics cho mobile. Cloud Run stdout/stderr đi vào Cloud Logging với retention/budget rõ. Redact Supabase token/service key, database URL, R2 credential/presigned URL, signed transaction/purchase token, content key, email, child name/note và media metadata nhạy cảm.

Free Supabase log retention không được xem là audit store. Security/billing/content-publish audit tối thiểu phải persist trong KidEDU schema với retention đã duyệt; không ghi secret/raw sensitive payload.

## 7. Backup/DR

- Supabase Free không có automatic backup/PITR. Cloud Scheduler kích Cloud Run Job hằng ngày chạy provider-supported logical dump từ cùng pinned tool version.
- Dump phải bao phủ KidEDU schema/data, migration state và phần identity mapping cần khôi phục; auth schema/role/extension nào provider không cho export phải được ghi rõ trong restore report và có migration procedure riêng. Không mặc định một lệnh dump đã chứa mọi thứ.
- Dump được checksum, mã hóa trước upload và lưu vào R2 backup bucket có credential/retention tách khỏi runtime content. Backup job chỉ có quyền read DB và create bounded backup object, không delete history.
- Retention numeric thuộc `TA-TBD-002`; lifecycle không xóa bản cuối cùng còn hợp lệ. Backup success chỉ được ghi sau upload, checksum và metadata verification.
- Mỗi quý restore vào PostgreSQL isolated mới, chạy migration/integrity checks, reconcile R2 inventory và smoke API. Không restore đè production trong drill.
- R2 object inventory/version/lifecycle theo data class; content/family object và database metadata phải đối soát được. Drive source/archive không thay runtime backup.
- Signing/KMS keys có rotation/disable recovery procedure. Key backup/recovery phải tách khỏi encrypted data; không export plaintext master key tùy tiện.
- Backup không thay privacy deletion; retention/deletion job phải bao phủ policy công bố và legal hold nếu có.

## 8. Runbooks bắt buộc

Cloud Run revision/start failure, cold-start/latency spike, stable-domain/TLS failure, Supabase paused/outage/quota/connection exhaustion/corruption, logical backup failed, restore failed, migration failed, Supabase Auth/JWKS/SMTP outage, Apple notification/Google RTDN reconcile lag, activation/key failure, R2 permission/operation spike, corrupt content release, leaked credential, account deletion stuck và mobile bad release.

## 9. Capacity, cost and migration triggers

- Supabase database hoặc egress đạt 70% Free quota: block uncontrolled growth, estimate 30-day trend và prepare Pro/migration before hard limit.
- Bất kỳ recurring pause/outage nào ảnh hưởng paying user, backup/RPO không đạt hoặc cần provider support: nâng Supabase Pro hay migrate ngay; không chờ user count lớn.
- Cloud Run monthly cost tiến gần always-on VPS tương đương, sustained load giảm lợi ích scale-to-zero hoặc cần long-running runtime: deploy cùng OCI image/Compose lên VPS và cut DNS.
- Database growth/availability vượt Supabase plan: ưu tiên Supabase Pro/managed PostgreSQL; chỉ self-host DB trên VPS khi owner chấp nhận patching, backup, replication và on-call risk.
- R2 quota/economics/policy không phù hợp: copy object song song sang S3/GCS/B2 adapter, checksum, switch provider class/config, giữ rollback window.
- Portability gate: OCI image, standard PostgreSQL dump, configurable backup destination, object/key/secret/identity/telemetry adapters và registry-neutral image reference không phụ thuộc provider hostname/credential hard-code.

## 10. Service review cadence

- mỗi release: migration/revision rollback/store sandbox/smoke;
- hằng ngày: backup success và billing notification/reconcile lag;
- hằng tuần: alerts, failed jobs, Supabase/R2 quota, connection/cold-start và cost anomalies;
- hằng tháng: dependencies/images/secrets/access/capacity/cost và restore sample verification;
- hằng quý: full isolated restore drill, incident/runbook và data-retention audit.

## 11. Launch gate

Không production nếu chưa có owner, isolated staging/prod, stable HTTPS API, bounded Cloud Run/DB connection config, dashboard/alerts, verified daily offsite logical backup + isolated restore rehearsal, Supabase pause/outage UX, API/content/mobile rollback, cost budget/forecast và incident contact. Free quota không được tính là control thay cho bất kỳ launch gate nào.

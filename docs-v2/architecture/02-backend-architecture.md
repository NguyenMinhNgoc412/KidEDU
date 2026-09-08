# Backend Architecture & Docker Deployment

| Thuộc tính | Giá trị                                           |
| ---------- | ------------------------------------------------- |
| Trạng thái | `In review`                                       |
| Owner      | Backend/Operations                                |
| Implements | `TA-ADR-001..005`, `TA-ADR-011..024`, `PRD-NFR-*` |
| Cập nhật   | 2026-09-08                                        |

## 1. Scope

Backend là thin app server. Nó không chạy lesson/progression nhưng là trust boundary duy nhất giữa client và database/storage/billing/key services.

## 2. Stack

Node.js LTS, TypeScript strict, NestJS + Fastify, Zod, Prisma/PostgreSQL, Supabase Auth JWT/JWKS adapter, Cloudflare R2 S3 adapter, Cloud KMS/Secret Manager, direct Apple/Google store server adapters, Pino/OpenTelemetry/Cloud Logging, Jest/Supertest/Testcontainers. Build thành OCI image và deploy Cloud Run request-based tại Singapore; image tương tự phải chạy được bằng Docker Compose trên VPS.

## 3. Module layout

```text
src/modules/
  auth/          # verify Supabase JWT/JWKS, internal account/device
  families/      # family membership/consent
  children/      # profile/settings
  curriculum/    # published catalog/manifest
  plans/         # persist/sync plan selected by client
  progress/      # idempotent observation ingest/delta
  content/       # pack authorization/releases
  media/         # signed upload/download/finalize/quota
  billing/       # Apple/Google notification, verification, reconcile
  entitlement/   # effective state/activation grant/key IDs
  privacy/       # inventory/export/delete/retention
  admin/         # content review/publish/audit
```

Module có controller/application service/repository/policy rõ. Không gọi Prisma trực tiếp từ controller hoặc import repository nội bộ của module khác.

## 4. Request pipeline

```text
stable KidEDU HTTPS ingress → Cloud Run
→ request/correlation ID
→ size/rate limit
→ Supabase JWT/JWKS verification
→ internal account/device context
→ authorization policy
→ Zod validation
→ use case transaction
→ response DTO/OpenAPI
→ structured audit/metrics
```

Health endpoints tách startup/readiness/liveness; health không lộ dependency secret hoặc PII.

## 5. API conventions

- Base `/v1`; JSON UTF-8; UTC timestamps; opaque IDs.
- OpenAPI là contract; generated mobile/admin client được pin version.
- Error envelope: `code`, safe `message`, `requestId`, optional field errors.
- Cursor opaque; không expose offset cho growing event feed.
- Mutation hỗ trợ `Idempotency-Key` khi retry có thể duplicate.
- Optimistic concurrency dùng `version`/ETag cho mutable resource.
- Không trả database row/Prisma model trực tiếp.

## 6. Authentication/authorization

Mobile nhận Supabase access token; `SupabaseIdentityAdapter` verify issuer/audience/signature/expiry bằng cached JWKS và áp dụng revoke/session policy, rồi map `(provider, subject)` trong `auth_identities` sang internal account ID. Authorization chỉ dùng internal context để kiểm family membership, child ownership, role, entitlement và object scope. Admin role không dựa claim do client gửi. Supabase service-role key không tồn tại trên mobile.

## 7. Database

Supabase Free cung cấp PostgreSQL managed nhưng không phải application boundary cho mobile. Cloud Run runtime dùng Supavisor transaction-mode endpoint; Prisma pool size và Cloud Run `max-instances` phải thỏa `max instances × pool per instance + jobs/admin headroom < provider connection limit`. Prepared-statement/transaction behavior phải được POC với Prisma trước schema implementation.

Migration và logical backup ưu tiên direct endpoint từ runner có IPv6; nếu runner chỉ có IPv4 thì dùng Supavisor session mode đã test. Prisma migration SQL được review; constraint/index/foreign key vẫn bắt buộc. Không dùng Supabase-specific database API/extension nếu chưa có ADR và migration fallback.

## 8. Billing/activation

Apple adapter verify signed transaction/App Store Server Notification V2 và reconcile App Store Server API. Google adapter xác thực RTDN/Pub/Sub, gọi Google Play Developer API bằng purchase token và xử lý acknowledgement khi contract yêu cầu. Cả hai persist normalized event ID idempotently; entitlement service tính effective state rồi activation service ký grant/cấp wrapped pack keys. Không tin client purchase callback.

## 9. Media/content

Application gọi `ObjectStorageGateway` để tạo transfer authorization/presigned upload/download URL sau authorization. R2 S3 adapter là baseline; client finalize upload với object ID/hash/size và server không tin metadata ban đầu. Default pack publish chỉ từ CI/admin privileged path. `KeyManagementGateway`/`SecretProvider` bọc KMS/Secret Manager cho signing/master keys. Google Drive không nằm trong runtime request path.

## 10. Docker image

Multi-stage build, lockfile frozen, non-root runtime, minimal base image được pin digest, production dependencies only, read-only filesystem khi khả thi, `/tmp` bounded, graceful shutdown và SBOM/vulnerability scan. Image không chứa `.env`, service-account JSON hoặc source media.

## 11. Initial production topology

```text
Internet HTTPS
  → stable api.<domain> ingress
      → Cloud Run revision (NestJS/Fastify, non-root, min=0)
          ├─ Supabase Auth JWKS/Admin adapter
          ├─ Supavisor transaction pooler → Supabase PostgreSQL
          ├─ R2 S3 API → private content/family/export buckets
          └─ KMS/Secret Manager + Apple/Google server APIs

Cloud Scheduler → Cloud Run Job → verified logical DB dump → private R2 backup bucket
Cloud Run stdout/metrics/traces → Cloud Logging/Monitoring
```

- API/admin/job images pin immutable digest; PostgreSQL major/extensions có allowlist và export test.
- Cloud Run `min-instances=0`; `max-instances`, concurrency, timeout, CPU/RAM và DB pool có explicit budget.
- Runtime service account least-privilege; secrets injected at deploy/runtime, không bake vào image.
- R2 content/family/export/backup tách bucket/prefix, credential và retention; production/staging tách account scope hoặc bucket.
- Migration chạy bằng one-shot job trước khi promote compatible revision; backup freshness là pre-deploy gate.
- Supabase Free database/egress đạt 70% quota phải alert; không auto-scale vượt kiểm soát.

## 12. Deployment and rollback

GitHub Actions builds/scans/pushes Artifact Registry. Deploy workflow verifies logical-backup freshness, runs expand-compatible migration job, deploys a no-traffic Cloud Run revision, smoke-tests revision URL, then shifts traffic. Rollback shifts traffic về previous revision; destructive schema rollback không được giả định.

Supabase Free không có uptime SLA/automatic backup và Cloud Run scale-to-zero có cold start. Maintenance/recovery expectation phải được công bố nội bộ; khi reliability/quota/revenue trigger đạt ngưỡng, nâng Supabase Pro hoặc restore sang managed/self-hosted PostgreSQL khác. Khi Cloud Run cost/runtime phù hợp với always-on hơn, cùng image chuyển sang VPS/Compose sau stable API hostname.

## 13. Test/security gates

Unit policy/use case; integration với PostgreSQL/R2-compatible test bucket; contract test OpenAPI; BOLA/role tests; webhook replay/out-of-order; load/cold-start test activation/sync; connection-pool exhaustion test; container scan; migration forward/backward compatibility; Cloud Run revision rollback và restore-from-R2 drill.

Provider adapter contract tests phải chạy cùng normalized fixture cho Supabase identity, Apple/Google billing, R2 object storage và KMS; domain/use case không import provider SDK.

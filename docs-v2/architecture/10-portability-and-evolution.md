# Provider Portability & Service Evolution

> C50 target update 2026-11-05 — TA-ADR-026: GenerationGateway/SpeechGenerationGateway và dispatcher port giữ provider DTO/operation ID ngoài mobile contract. PostgreSQL là job/ledger authority; candidate Cloud Tasks cần ADR riêng và có migration path, không thay portability baseline.

| Thuộc tính | Giá trị                                           |
| ---------- | ------------------------------------------------- |
| Trạng thái | `In review`                                       |
| Owner      | Technical owner                                   |
| Implements | `TA-ADR-011..024`, `PRD-NFR-004..008`, `PB-BIZ-*` |
| Depends on | [Cost model](../delivery/05-cost-model.md)        |
| Cập nhật   | 2026-11-05                                        |

## 1. Objective

Dùng giải pháp rẻ/đủ tốt ở mỗi giai đoạn mà không buộc learning domain, mobile API contract hoặc dữ liệu người dùng vào một provider. Không xây abstraction chung chung; chỉ đặt port tại boundary có khả năng thay: identity, billing, object storage, key management, telemetry và runtime/deploy.

## 2. Recommended evolution stages

Các range là platform budget sơ bộ, chưa gồm store commission, thuế, content/support và paid email volume. [Cost model](../delivery/05-cost-model.md) sở hữu phép tính workload đầy đủ.

| Stage                            | Stack đề xuất                                                                                  |      Platform budget | Trigger/phạm vi                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------: | ------------------------------------------------------ |
| 0 — Development/internal         | Cloud Run scale-to-zero; Supabase Free; R2 Free; Firebase Crashlytics; EAS Free; store sandbox |    gần `0 USD/tháng` | development, device POC, TestFlight/internal test      |
| 1 — Controlled Store Release     | Stage 0 hardened + daily encrypted DB dump/R2 + restore drill + quota/availability alerts      |     `1–15 USD/tháng` | public listing, tải thấp, chấp nhận no-SLA Free risk   |
| 2 — Reliable low scale           | Cloud Run + Supabase Pro + R2 Standard; managed daily backup/support quota tốt hơn             |    `30–80 USD/tháng` | paying-user impact khiến Free risk không còn chấp nhận |
| 3 — Cost-optimized steady growth | cùng OCI API trên VPS/Compose nếu rẻ hơn; Supabase Pro hoặc PostgreSQL managed riêng; R2       |   `40–180 USD/tháng` | sustained workload/Cloud Run cost hoặc runtime need    |
| 4 — Managed/HA production        | multi-instance API/LB, managed PostgreSQL HA, tested DR, CDN/WAF chỉ theo số đo                | `150–500+ USD/tháng` | downtime/RTO có business cost rõ, tải/đội ngũ đủ lớn   |

Stage là trigger-based, không theo lịch hoặc chỉ theo user count. Không giữ Free khi paying-user incident/RPO-RTO vượt risk; cũng không chuyển VPS nếu serverless vẫn rẻ và vận hành đơn giản hơn.

## 3. Option ladder by subsystem

| Boundary          | Rẻ nhất/initial production                 | Bước cân bằng                                    | Chuyên nghiệp/HA                                   | Portability control                                                |
| ----------------- | ------------------------------------------ | ------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------ |
| API runtime       | Cloud Run request-based, `min=0`           | Docker Compose VPS khi sustained load rẻ hơn     | multi-instance/LB hoặc managed container platform  | OCI image, stateless API, health endpoints, config env             |
| PostgreSQL        | Supabase Free 500 MB                       | Supabase Pro hoặc managed single-zone PostgreSQL | regional HA/read replica theo RPO/RTO              | standard PostgreSQL, reviewed migrations, verified logical restore |
| Object storage    | R2 Standard free allowance                 | R2 paid usage hoặc S3/GCS/B2 adapter             | multi-region/CDN theo measured access pattern      | logical object key/hash, no persisted presigned URL                |
| Source archive    | Google Drive 5 TB                          | giữ Drive hoặc backup thêm                       | governed content DAM chỉ khi cần                   | Drive ID không đi vào runtime manifest                             |
| Authentication    | Supabase Auth Free non-phone               | Supabase paid/custom SMTP maturity               | Keycloak/Auth0/Cognito/other provider khi có lý do | internal account ID + `IdentityGateway`, provider identity table   |
| Subscription      | direct Apple/Google adapters               | giữ direct + automation/test tốt hơn             | RevenueCat chỉ khi maintenance economics tốt hơn   | `BillingGateway`, normalized event/entitlement                     |
| iOS build         | EAS Free vì không có Mac                   | EAS paid khi queue/quota chặn release            | dedicated/shared Mac CI hoặc enterprise EAS        | committed native config, Fastlane/scripts, no OTA lock             |
| Android build     | local Gradle                               | GitHub Actions/self-hosted runner                | signed controlled CI with provenance               | Gradle task/scripts và keystore in secret store                    |
| Mobile crash      | Firebase Crashlytics                       | giữ nếu đủ                                       | Sentry/Datadog chỉ khi có diagnostic gap           | `CrashReporter` facade + privacy schema                            |
| Backend telemetry | Pino + OpenTelemetry + Cloud Logging       | managed collector/Grafana nếu cần                | dedicated observability/SIEM                       | OpenTelemetry, structured logs, exportable metrics                 |
| Notification      | local-only                                 | FCM/APNs nếu có remote-push user story           | campaign platform khi business requirement         | PRD/ADR mới; không có token schema sẵn trong v1                    |
| Secrets/KMS       | GCP Secret Manager/KMS                     | provider secret/KMS adapter                      | HSM/multi-project separation theo risk             | envelope encryption + key IDs + rewrap procedure                   |
| DNS/TLS           | stable domain → reviewed Cloud Run ingress | DNS cutover tới VPS/LB                           | multi-zone traffic policy                          | client pin hostname/contract, không pin provider URL/IP            |

## 4. Mandatory provider boundaries

```text
Mobile → versioned KidEDU API (never Supabase Data API/R2 privileged API)

Application services
├─ IdentityGateway
├─ BillingGateway
├─ ObjectStorageGateway
├─ KeyManagementGateway
└─ TelemetryPort

Adapters
├─ SupabaseIdentityAdapter
├─ AppleBillingGateway / GooglePlayBillingGateway
├─ R2ObjectStorageAdapter
├─ GoogleKmsAdapter
└─ OpenTelemetry/CloudLoggingAdapter
```

Không tạo port cho pure domain logic hoặc library ổn định chỉ vì “có thể đổi”. Provider DTO/error/credential không được lọt qua application boundary; adapter map về internal result/error model.

## 5. Data portability rules

- Server database dùng PostgreSQL supported version, reviewable migration và extension allowlist; domain không gọi Supabase Data API/proprietary database API.
- Runtime Cloud Run dùng Supavisor transaction pooler; connection URL là config/secret, không xuất hiện trong domain code.
- Backup phải restore được sang PostgreSQL mới ngoài Supabase. Dump/restore report phải kiểm schema, data, constraints, migration state và identity mapping; provider-managed auth data có export/migration procedure riêng.
- Object table lưu logical storage class + immutable object key + hash/size/provider tag, không lưu presigned/public URL làm identity.
- Family/content objects có inventory/export; migration copy song song và checksum trước cutover.
- `accounts.id` là internal stable ID; Supabase user ID/provider subject chỉ nằm ở `auth_identities`.
- Store raw event tối thiểu phục vụ audit và normalized entitlement riêng; learning module không dùng Apple/Google/RevenueCat field trực tiếp.
- KMS dùng envelope encryption; migration provider rewrap data key thay vì decrypt/re-encrypt toàn bộ media khi có thể.

## 6. Build and deployment portability

- Dockerfile, Compose migration target, migrations và deploy scripts được version-control; image pin immutable digest.
- OpenTofu/provider modules tách Cloud Run, Supabase và R2 provisioning khỏi app config.
- Cloud Run config có explicit region/min/max/concurrency/timeout/service account. Docker image phải chạy local và trên VPS mà không import Cloud Run runtime API.
- iOS native project/config được sinh/commit theo prebuild policy đủ để EAS hoặc Mac CI cùng build; không dùng EAS-only runtime API.
- Android release là standard Gradle signed bundle; EAS không cần cho Android baseline.
- API client dùng stable production hostname; đổi Cloud Run/VPS bằng ingress/DNS cutover, không phát mobile version chỉ để đổi host.
- Feature/content kill switch nằm ở KidEDU API/config, không phụ thuộc release vendor độc quyền.

## 7. Migration playbooks

### 7.1. Cloud Run → VPS

1. Provision VPS, Caddy, Docker/Compose và secret adapter; deploy cùng image digest.
2. Smoke health/API against staging hostname; verify Supabase/R2 connectivity và callback allowlist.
3. Lower DNS TTL, cut stable API hostname, observe, giữ Cloud Run rollback window.
4. Chỉ ngừng Cloud Run revision sau log/SLO reconciliation.

### 7.2. Supabase → PostgreSQL khác

1. Ghi metric/cost/SLO trigger và chốt target bằng ADR.
2. Restore latest verified logical dump vào target; apply roles/extensions/migrations allowlist.
3. Backfill/reconcile changes phát sinh trong migration window; verify count/hash/constraints và auth identity mapping.
4. Deploy API config target, smoke critical write/read/billing, cut traffic và giữ source read-only rollback window.

### 7.3. R2 → object provider khác

1. Implement target `ObjectStorageGateway` adapter và contract tests.
2. Copy objects theo logical key, verify size/hash/inventory; không rewrite lesson manifest chỉ vì URL đổi.
3. Switch provider tag/config cho new transfer authorization; giữ source đến hết rollback/retention window.

Không dual-write vô thời hạn. Migration secret/key/data production cần change record, audit và rollback rõ.

## 8. Upgrade triggers

- Supabase database size hoặc egress đạt 70% Free quota hay projected hit trong 30 ngày.
- Supabase pause/outage/backup limitation ảnh hưởng subscriber hoặc RPO/RTO; đây là trigger dù user count còn nhỏ.
- Cloud Run cold-start/latency vượt SLO sau optimization, sustained compute làm VPS rẻ hơn hoặc cần long-running process.
- DB pool wait/connection exhaustion dù đã bound max instances và query/pool tuning.
- R2 operation/storage policy hoặc provider incident không còn đáp ứng; cache/egress không phải lý do tự động thêm CDN.
- EAS Free quota/queue gây trễ release thực tế.
- Direct billing maintenance/incident cost đo được lớn hơn RevenueCat fee/vendor risk.
- Supabase Auth quota/policy/SMTP/recovery không đáp ứng account requirement mới.
- Crash/log tooling không điều tra được production incident trong target time.

## 9. Prohibited premature upgrades

Không thêm Kubernetes, microservices, Redis/Kafka, multi-region database, streaming pipeline, remote push provider, provider-routing platform, RevenueCat, Sentry/Datadog hoặc paid EAS nếu chưa có requirement/metric/ADR chứng minh. “Professional” nghĩa secure, observable, recoverable, tested và portable; không đồng nghĩa nhiều dịch vụ.

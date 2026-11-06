# AGENTS.md — KidEDU Engineering Instructions

## 1. Authority

`docs-v2` là target documentation cho Store Release v1.0. `docs` là legacy baseline chỉ dùng để hiểu/so sánh code hiện tại; không được dùng để override requirement hoặc architecture v2.

Ba SOT phải đọc theo thứ tự:

1. `docs-v2/01-product-brief-sot.md` — why/product boundary;
2. `docs-v2/02-product-requirements-sot.md` — what/acceptance;
3. `docs-v2/03-technical-architecture-sot.md` — system architecture/constraints.

Sau đó đọc detailed spec liên quan và `docs-v2/CHANGELOG.md`. Tài liệu `In review` chưa tự động cho phép implementation; task implement phải dựa phạm vi đã được owner duyệt hoặc yêu cầu trực tiếp.

Thứ tự ưu tiên:

```text
Product Brief → PRD → Technical Architecture → detailed specs/ADR
→ delivery/task → code → legacy docs/screenshots
```

Nếu mâu thuẫn, dừng ở phân tích, chỉ rõ ID/file và xin owner quyết định nếu thay đổi có ảnh hưởng scope/architecture.

## 2. Product invariants

- Store Release v1.0, không gọi là MVP.
- Focus hỗ trợ phụ huynh luyện ngôn ngữ/giao tiếp tiếng Việt cho trẻ chậm nói.
- Không chẩn đoán, điều trị, thay chuyên gia hoặc AI chấm phát âm trong v1.
- Learning progression/activity theo PRD, không thu hẹp về card/flashcard.
- Parent-guided transfer và family media là capability cốt lõi.
- Custom Library thủ công/AI thuộc paid v1 theo owner decision 2026-11-05/C50. Provider/dispatcher và quota/fee phải qua decision gates; không tự provision provider/queue hoặc mặc định AI vô hạn.
- Free lâu dài có bộ học cơ bản; paid full + custom authoring; không third-party ads. Tập nói không giới hạn lượt trong scope; game một phiên/ngày reset 00:00 theo C50.
- Parent login/backend bắt buộc; không quảng bá offline mode.
- Prepared lesson chạy local; không API trong activity loop.
- Premium cache không đồng nghĩa quyền; entitlement server-authoritative và content mã hóa.
- Dữ liệu gia đình không bị khóa chỉ vì subscription hết hạn.

## 3. Architecture invariants

- Mobile client-heavy cho learning domain nhưng không tự quyết identity/authorization/entitlement/key.
- App server riêng: Docker, Node.js/TypeScript, NestJS/Fastify, Prisma.
- Mobile chỉ gọi versioned app-server API; không truy cập PostgreSQL hoặc object storage bằng privileged credential.
- Baseline production ban đầu là Cloud Run `min-instances=0` chạy OCI image NestJS/Fastify; Supabase Free cung cấp PostgreSQL + Auth và R2 cung cấp object storage.
- Mobile không dùng Supabase Data API/Storage trực tiếp; Cloud Run app server là application boundary duy nhất và runtime database dùng Supavisor transaction pooler với connection/max-instance budget.
- Supabase Free không có SLA/automatic backup: daily verified logical dump phải lưu mã hóa ngoài Supabase tại R2; cảnh báo quota và restore drill là release gate.
- R2 private là runtime origin cho production pack/media/backup; Google Drive 5 TB chỉ source/master/archive, không là entitlement boundary hoặc family-media origin.
- Supabase Authentication cho parent identity; app server verify JWT/JWKS rồi map provider subject sang internal account ID. Firebase chỉ dùng Crashlytics.
- OCI image, PostgreSQL dump/migration và provider adapters phải portable để chuyển Cloud Run sang VPS và Supabase sang PostgreSQL khác mà không đổi mobile contract.
- Apple/Google store là billing authority; backend tích hợp trực tiếp server API/notification, chuẩn hóa entitlement và làm activation authority.
- Progressive signed/encrypted lesson packs, atomic generation sync và durable local cache.
- Notification v1 chỉ local trên device; không FCM/APNs app push, push-token/backend notification module.
- Mobile crash dùng CrashReporter → Firebase Crashlytics; backend Pino/OpenTelemetry → Cloud Logging/Error Reporting; không Sentry baseline.
- Expo SDK được giữ; EAS Free chỉ build/submit iOS vì owner không có Mac, không EAS Update/OTA hoặc paid plan mặc định.
- Provider SDK/DTO nằm sau Identity/Billing/ObjectStorage/KeyManagement/Telemetry adapters; domain lưu internal ID/object key, không signed URL/provider UID.
- Default media: Veo candidate mouth video, human-reviewed Vietnamese audio, Reanimated/SVG + Lottie; FFmpeg normalize, AI không auto-publish.
- Không microservice, Kubernetes, Redis/Kafka mặc định khi chưa có ADR/số đo.

## 4. Detailed spec routing

### Product behavior

- curriculum/plan: `docs-v2/product/01-curriculum-learning-plan-spec.md`
- activities/session: `docs-v2/product/02-learning-activity-spec.md`
- family media: `docs-v2/product/03-parent-family-media-spec.md`
- progress: `docs-v2/product/04-progress-observation-spec.md`
- subscription: `docs-v2/product/05-subscription-access-spec.md`
- default media production: `docs-v2/product/06-content-media-production-spec.md`
- AI custom library (v1, C50): `docs-v2/product/07-ai-custom-library-spec.md`

### Design/UI

Đọc lần lượt:

1. `docs-v2/design/01-information-architecture-user-flows.md`;
2. `docs-v2/design/02-design-system.md`;
3. `docs-v2/design/03-wireframes.md`;
4. `docs-v2/design/04-accessibility-child-safety.md`;
5. screenshot liên quan trong `screenshots/` và component hiện có.

Reuse Gentle Growth visual/component foundation nhưng không giữ IA/domain card/category-centric khi trái v2. Không tự sáng tạo style mới khi design spec đã có.

### Technical

- mobile: `docs-v2/architecture/01-mobile-architecture.md`
- backend/Docker: `docs-v2/architecture/02-backend-architecture.md`
- data: `docs-v2/architecture/03-data-model-and-migrations.md`
- sync/pack: `docs-v2/architecture/04-sync-manifest-pack-protocol.md`
- media/security: `docs-v2/architecture/05-media-storage-and-content-security.md`
- entitlement: `docs-v2/architecture/06-entitlement-activation-security.md`
- operations: `docs-v2/architecture/07-operations-observability-backup.md`
- threat model: `docs-v2/architecture/08-threat-model.md`
- notifications: `docs-v2/architecture/09-notification-architecture.md`
- provider portability/evolution: `docs-v2/architecture/10-portability-and-evolution.md`
- initial platform deployment: `docs-v2/architecture/11-initial-platform-deployment.md`
- AI custom generation (v1, C50): `docs-v2/architecture/12-ai-custom-library-generation.md`
- contracts: `docs-v2/contracts/`
- roadmap/test/release/task/cost: `docs-v2/delivery/`

## 5. Research privacy

`docs-v2/giao-trinh/` chứa PII của trẻ/chuyên viên và đã bị ignore. Không đọc/chép dữ liệu nhận dạng vào code, test, log, prompt artifact hoặc tài liệu commit. Chỉ dùng insight đã ẩn danh. Không đưa file này vào Git/build/CI.

## 6. Implementation rules

- Mỗi task có `Implements: PRD-..., TA-ADR-...`, dependency, acceptance, tests, migration/rollback và out-of-scope.
- Không dùng code hiện tại để hợp thức hóa requirement legacy.
- Giữ thay đổi nhỏ theo boundary; không gom schema + toàn backend + nhiều activity/UI vào một task.
- Route/screen không truy cập API/SQLite/file trực tiếp.
- Không share Prisma model với mobile; dùng OpenAPI/generated client và content schema versioned.
- Mutation progress commit SQLite + outbox atomically; content sync dùng generation/staging.
- Entitlement guard ở server/repository/loader/resolver/decrypt boundary, không chỉ paywall UI.
- Không log token/key/receipt/signed URL/PII/family media.
- File/media replace: stage → validate/preview → atomic commit → cleanup.
- Account switch phải đóng session/player và purge/isolate token/key/cache/data namespace.
- Không thêm dependency/service lớn nếu capability có trong baseline stack; thay stack cần ADR/owner approval.

## 7. UI implementation rules

- Mở screenshot thật trước khi sửa screen liên quan.
- Reuse `AppText`, `Screen`, cards/buttons, media containers, tab bar và theme khi phù hợp.
- Target child touch ≥56px; parent ≥44px; accessible name/state và không chỉ dùng màu.
- Mouth video không bị overlay control cố định; foreground không tự phát media.
- Child Mode không purchase/delete/external link/judgement score.
- Hỗ trợ large text, screen reader, reduce motion và sensory settings.

## 8. Verification

Chạy kiểm tra theo rủi ro:

- docs: Prettier, link/reference/contradiction scan;
- mobile: typecheck, lint, Jest/RNTL, Maestro/device khi native/lifecycle;
- backend: unit, Supertest, Testcontainers, OpenAPI/migration/security;
- content: schema/fixture/signature/readiness + human QA;
- release: sandbox subscription, process kill, low storage, account switch, expiry/refund, backup/restore.

Sau task báo file, behavior, test đã chạy, bug/risk đã rà soát, migration/rollback và SOT/changelog impact. Không nói pass nếu chưa chạy.

## 9. Documentation changes

Sửa file sở hữu trước. Detailed spec tham chiếu ID thay vì copy rule. Thêm/xóa/đổi file phải cập nhật `docs-v2/README.md`; thay product/architecture/stack phải cập nhật `docs-v2/CHANGELOG.md` và ADR khi có trade-off. Không sửa `docs/` legacy.

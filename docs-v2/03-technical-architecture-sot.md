# KidEDU — Technical Architecture SOT

| Thuộc tính         | Giá trị                                                            |
| ------------------ | ------------------------------------------------------------------ |
| Tài liệu           | Technical Architecture — Source of Truth                           |
| Mã tài liệu        | `SOT-TA-03`                                                        |
| Trạng thái         | `In review`                                                        |
| Architecture owner | Technical owner KidEDU                                             |
| Cập nhật           | 2026-09-08                                                         |
| Phạm vi            | Hệ thống production cho Store Release v1.0                         |
| Phải đáp ứng       | [02-product-requirements-sot.md](./02-product-requirements-sot.md) |

## 1. Vai trò và thẩm quyền

Tài liệu này là Source of Truth cho kiến trúc toàn hệ thống KidEDU: mobile, backend, content delivery, local runtime, security, subscription, sync, observability và vận hành.

Nó sở hữu các architecture invariant và boundary. Tài liệu stack, API, schema, sync protocol, media pipeline, security, deployment và test được phép chi tiết hóa nhưng không được phá các quyết định tại đây. Thay đổi một quyết định `TA-ADR-*` phải có ADR mới, impact analysis, migration plan và product traceability.

## 2. Architecture drivers

Kiến trúc phải đồng thời đáp ứng:

1. app production có backend và account ngay từ đầu;
2. lesson chạy nhanh từ local, không gọi API trong từng activity;
3. first-use không tải toàn bộ thư viện;
4. media đã tải được tái sử dụng, không streaming;
5. subscription hết hạn không dùng tiếp premium cache theo luồng app bình thường;
6. force-kill không phải logout và reopen không reload toàn bộ;
7. dữ liệu trẻ/family media được bảo vệ và không lẫn giữa account;
8. content tăng dần mà không phải đổi kiến trúc;
9. chi phí phù hợp dự án cá nhân nhưng không hy sinh reliability/security cốt lõi;
10. có thể release, quan sát, rollback và migrate an toàn trên store.

## 3. Kiểu kiến trúc đã chốt

> **Server-authoritative online activation + manifest-driven progressive lesson packs + local encrypted runtime/cache.**

KidEDU không phải local-first/offline-first. Server là authority cho account, entitlement, published content, learning-plan state đã sync và cloud data. Mobile duy trì một local projection/versioned cache để UI và learning session chạy nhanh.

`Online activation` không có nghĩa activity gọi API liên tục. Cold start cần một activation handshake nhỏ. Khi lesson đã `Ready`, learning loop dùng local hoàn toàn và chịu được mất mạng tạm thời.

## 4. Architecture decisions

### `TA-ADR-001` — Server-authoritative system

Backend là nguồn xác thực cuối cho identity, entitlement, published content versions và trạng thái cloud. Local state không tự cấp quyền premium hoặc publish content.

**Trace:** `PRD-ACC-001`, `PRD-SUB-*`, `PRD-NFR-005`.

### `TA-ADR-002` — Mandatory parent authentication

Learning content yêu cầu parent account. Refresh credential được lưu trong OS secure storage; access token ngắn hạn nằm trong memory khi có thể. App close, background hoặc process kill không tự revoke phiên.

### `TA-ADR-003` — Bốn lifecycle độc lập

Hệ thống tách rõ:

1. **Auth session:** ai đang đăng nhập và token nào hợp lệ;
2. **Activation/entitlement session:** device/account được dùng capability nào đến thời điểm nào;
3. **Sync generation:** snapshot local nào đã verify và đang active;
4. **Learning session:** child, lesson, activity và checkpoint đang chạy.

Không dùng một biến `isLoggedIn` hoặc một expiry chung để đại diện cả bốn lifecycle.

### `TA-ADR-004` — Progressive content delivery

App sync bootstrap và catalog index nhỏ, tải active lesson pack rồi prefetch mặc định hai lesson tiếp theo. Không bulk-download toàn bộ content library ở first launch. Prefetch window là policy server-configurable và thích nghi với network, battery, storage/data-saver.

### `TA-ADR-005` — Atomic, generation-based sync

Content/user projection update không ghi đè từng phần vào generation đang dùng. Quy trình bắt buộc:

```text
fetch manifest/delta
→ download to staging
→ validate schema + signature + checksum
→ install in transaction/new generation
→ atomically switch active generation
→ clean old generation when unreferenced
```

Nếu bất kỳ bước nào trước switch thất bại, generation cũ vẫn hoạt động.

### `TA-ADR-006` — Local database plus durable object cache

Mobile dùng local relational database cho projection, indices, progress outbox, pack state và checkpoint; media/pack bytes nằm ở durable app storage. UI/domain không truy cập file/database trực tiếp mà đi qua repository/use case boundary.

### `TA-ADR-007` — Content-addressed media

Default media được định danh bằng immutable content hash và version metadata. Cùng một asset chỉ lưu một bản trên thiết bị. Resolver kiểm tra entitlement, integrity và readiness trước khi trả local URI.

### `TA-ADR-008` — No streaming dependency

Video khẩu hình và media bắt buộc được download/verify trước lesson. Không thiết kế streaming video trong v1. Range request/resume download có thể dùng để tải bền vững nhưng playback học đọc local.

### `TA-ADR-009` — Premium content encrypted at rest

Premium lesson payload và premium media persist local dưới dạng authenticated encryption, mặc định `AES-256-GCM` hoặc primitive tương đương đã được security review. Content encryption key riêng theo pack/version không hard-code trong app và không lưu plaintext trong SQLite/file.

Server chỉ cấp wrapped key/content grant cho activation hợp lệ. Root/jailbreak có thể phá trust boundary của client; mục tiêu là ngăn bypass thông thường, copy file/database và lỗi entitlement, không tuyên bố DRM tuyệt đối.

### `TA-ADR-010` — User data has a separate trust domain

Child data và family media không dùng premium content key. Chúng được mã hóa bằng key theo account/device phù hợp, có export/delete path và không bị mất quyền chỉ vì subscription hết hạn.

### `TA-ADR-011` — Client-heavy domain, thin backend control plane

Mobile sở hữu learning engine, progression rule, prompt fading, lesson orchestration, activity state, local progress calculation và UI behavior. Backend v1 không chạy learning session, không render lesson và không tính từng bước activity.

Backend là một **app server/control plane mỏng** cho identity verification, authorization, entitlement, signed activation/content key, published content versions, sync, cloud persistence, quota và privacy operations. App server có module boundary rõ nhưng không chạy learning engine và không tách microservice ở v1.

`Client-heavy` không có nghĩa client được tự quyết quyền truy cập. Bất kỳ quyết định nào cần trust — account có quyền đọc child nào, subscription còn hạn không, pack key nào được cấp, upload có vượt quota không — vẫn phải được kiểm tra server-side.

### `TA-ADR-012` — Managed PostgreSQL/Auth with a separate app-server boundary

V1 có app server riêng và mobile không kết nối application database trực tiếp. Baseline ban đầu dùng Supabase Free cho standard PostgreSQL và Auth; mobile chỉ dùng Supabase Auth session, không gọi Data API hoặc database bằng application/privileged credential. Cloud Run app server, migration job và backup job là các client database được cấp quyền tương ứng.

Binary media/pack dùng Cloudflare R2 Standard private bucket và presigned URL ngắn hạn do app server cấp qua `ObjectStorageGateway`. Google Drive 5 TB chỉ làm kho source/master hoặc archive, không là production entitlement boundary, application database hoặc family-media origin.

### `TA-ADR-013` — Store-authoritative billing, backend-normalized entitlement

Apple/Google là authority cho giao dịch store. App server tích hợp trực tiếp App Store Server API/Notifications V2 và Google Play Developer API/RTDN, chuẩn hóa entitlement rồi ghi projection vào PostgreSQL theo cách idempotent. Mobile purchase callback hoặc receipt/token local không phải nguồn quyền cuối để cấp content key.

### `TA-ADR-014` — Versioned contracts and backward compatibility

API, manifest, lesson pack, local schema và event đều có version. Backend công bố minimum supported app version; migration phải forward-safe, có rollback strategy và không silent-drop user data.

### `TA-ADR-015` — Expo/React Native mobile retained

Mobile v1 tiếp tục dùng React Native + Expo + TypeScript. Production sử dụng Expo Development Build/prebuild, không phụ thuộc Expo Go, để tích hợp native purchase, secure storage, crypto và platform hardening. Version cụ thể phải được nâng lên bản stable được Expo hỗ trợ tại thời điểm implementation/release; Expo SDK 54 và React Native 0.81 hiện tại chỉ là code baseline, không phải version bị khóa đến ngày phát hành.

### `TA-ADR-016` — App server is the only application data boundary

Mobile và admin browser chỉ gọi versioned HTTPS API của app server. Chỉ app server và migration CI được kết nối PostgreSQL hoặc object storage bằng privileged credential. Authorization được kiểm tra tại guard và service/repository boundary; database constraint là lớp bảo vệ bổ sung, không thay thế application authorization.

### `TA-ADR-017` — Direct Apple/Google billing adapters

V1 không dùng RevenueCat. Mobile gọi StoreKit 2/Google Play Billing qua một React Native IAP adapter; app server xác thực trực tiếp với App Store Server API/Notifications V2 và Google Play Developer API/RTDN. Mỗi provider nằm sau `BillingGateway`, còn entitlement module chuẩn hóa state dùng cho activation. Store credential nằm ở server-side secret provider, không ở mobile.

### `TA-ADR-018` — No queue/cache infrastructure by default

V1 không triển khai Redis, Kafka hoặc message broker nội bộ. Webhook và trusted command phải idempotent. Google Play RTDN bắt buộc đi qua Google Cloud Pub/Sub theo contract của Play; Pub/Sub này chỉ là provider transport, không biến hệ thống thành event platform tổng quát. Tác vụ lịch/cleanup/backup nhỏ chạy bằng one-shot command từ cùng app image qua Cloud Run Job + Cloud Scheduler và khóa trùng bằng PostgreSQL advisory lock. Retry bền vững nếu cần dùng PostgreSQL job/outbox; chỉ tách always-on worker hoặc queue khác khi số đo chứng minh baseline không đáp ứng duration/throughput. Content pack được build bởi CLI/CI.

### `TA-ADR-019` — Internal content admin

Content editor dùng một web admin nội bộ viết bằng Next.js + TypeScript. Browser admin chỉ gọi app server bằng user session có role phù hợp; publish/build pack là privileged command có audit, không phải thao tác CRUD trực tiếp vào database/storage.

### `TA-ADR-020` — Operational simplicity is an architecture constraint

Baseline initial production là **serverless low-workload**, không cluster: Cloud Run request-based tại `asia-southeast1`, `min-instances=0`, chạy OCI image app server; Supabase Free cung cấp PostgreSQL/Auth và Cloudflare R2 Standard cung cấp private media/backup. Supabase Free không có SLA/automatic backup và có thể pause khi không hoạt động, nên chỉ được dùng với daily encrypted logical dump, restore drill, quota alert và degraded/retry UX. Khi revenue/RPO-RTO/quota vượt mức chấp nhận, nâng Supabase Pro hoặc restore sang PostgreSQL khác; khi Cloud Run economics/runtime không còn phù hợp, chuyển cùng image sang VPS.

### `TA-ADR-021` — Local-only notifications in v1

Routine learning reminder được schedule local trên thiết bị. V1 không triển khai remote push, FCM/APNs application delivery, push-token registry hoặc notification worker/outbox trên server.

Server state được lấy qua activation/bootstrap/delta sync khi app mở/foreground. Màn cần trạng thái mới trong lúc đang mở có thể dùng bounded polling hoặc foreground subscription; không giữ WebSocket/SSE ở background. Local notification không chứa child/family detail và tap phải qua auth/current-state/Parent Gate bình thường.

### `TA-ADR-022` — Supabase Auth without phone/SMS in v1

V1 dùng Supabase Authentication cho email/password và các provider Google/Apple được enable theo platform. Nếu hiển thị third-party sign-in trên iOS, Sign in with Apple phải được cấu hình theo App Store rule. Phone OTP/SMS không thuộc v1 vì có variable cost và abuse surface; account linking/recovery vẫn do app server map vào internal account an toàn. Supabase default SMTP chỉ dùng development; production email verification/reset cần custom SMTP/domain được chốt tại `TA-TBD-011`.

### `TA-ADR-023` — Portability at external provider boundaries

Application/domain code chỉ phụ thuộc các port `IdentityGateway`, `BillingGateway`, `ObjectStorageGateway`, `KeyManagementGateway` và `TelemetryPort`; provider SDK/DTO/error/credential nằm trong adapter. Server dùng standard PostgreSQL, OCI images và stable production domain; object identity là logical key/hash, không phải signed URL.

Không tạo abstraction cho mọi library. Port chỉ tồn tại ở external boundary có migration path thực tế. Mọi provider change phải chứng minh trigger bằng cost/SLO/risk, chạy data/contract verification và có rollback theo [portability plan](./architecture/10-portability-and-evolution.md).

### `TA-ADR-024` — Replaceable media authoring, deterministic production

AI/media provider cho default corpus chỉ nằm trong authoring pipeline, không là learning runtime dependency. Baseline dùng Veo 3/Veo 3.1 cho candidate mouth video; giọng người Việt được duyệt là nguồn canonical audio ưu tiên, Google Cloud TTS `vi-VN` tạo candidate/batch draft và Gemini TTS chỉ thử nghiệm khi còn Preview. Reanimated + SVG là motion code-native mặc định, Lottie cho animation minh họa không tương tác có static/reduce-motion fallback; Rive/Skia/Spine không thuộc baseline.

FFmpeg normalize/transcode deterministic. Source/master/provenance lưu ở Drive; output đã human-review được hash, immutable, encrypt và publish qua R2/pack/manifest. ChatGPT/Gemini image generation và Codex được dùng tạo candidate/code/tooling nhưng không tự publish. Provider/model và tài khoản authoring không xuất hiện trong mobile runtime contract; API automation có billing/quota riêng và chỉ bật sau cost/quality review.

## 4.1. Post-release architecture candidate

Mục này lưu hướng thiết kế để không mất quyết định nghiên cứu; nó không thuộc reference architecture hay implementation scope v1.

### `TA-FUTURE-001` — Paid asynchronous AI custom-library generation

Đây là candidate architecture cho phase sau, không phải invariant/stack/release gate v1. Mobile gửi typed draft tới app server; backend resolve/reuse published default asset bằng semantic/locale/role trước khi quote/generate, giữ durable `GenerationJob` và credit ledger trong PostgreSQL, dispatch/poll/retry bằng Cloud Tasks và chạy generation handler trên Cloud Run từ cùng OCI image/codebase. Candidate provider adapters dùng Gemini cho structured Vietnamese/image, Google Cloud TTS `vi-VN` cho audio và allowlisted motion recipes cho Reanimated/SVG/Lottie; custom flow không AI-generate mouth video mặc định.

Parent phải preview/approve trước khi backend build private family-scoped signed/encrypted pack. Credit add-on được store xác thực, reserve/capture/release idempotent; provider key, family media, child profile/progress và diagnosis không được gửi từ client hoặc đưa vào provider prompt mặc định. `GenerationGateway`/`SpeechGenerationGateway`, job authority ở PostgreSQL và immutable pack contract giữ khả năng thay provider/dispatcher mà không đổi learning runtime.

## 5. Reference technology stack v1

### 5.1. Mobile

| Concern                         | Chọn                                                         | Quy tắc                                                                     |
| ------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| App framework                   | React Native + Expo Development Build                        | Giữ một codebase iOS/Android; cho phép native module qua prebuild           |
| Language                        | TypeScript strict                                            | Không dùng `any` để né contract ở boundary                                  |
| Navigation                      | Expo Router                                                  | Route guard chỉ là UX; authorization vẫn ở repository/server                |
| Server state/sync orchestration | TanStack Query                                               | Không dùng query cache làm durable database hoặc entitlement authority      |
| Local UI/session state          | Zustand                                                      | Chỉ state ngắn hạn; checkpoint quan trọng ghi SQLite                        |
| Forms/validation                | React Hook Form + Zod                                        | Validate client để UX tốt; server vẫn validate lại trusted mutation         |
| Local database                  | `expo-sqlite` / SQLite                                       | Projection, outbox, checkpoint, pack state và indices                       |
| Files/download                  | Expo FileSystem                                              | Staging, resume, atomic install và durable app storage                      |
| Image/video/audio               | Expo Image, Expo Video, Expo Audio                           | Lesson phát local; video không streaming                                    |
| Code-native motion              | React Native Reanimated + `react-native-svg`                 | Prompt/transition/semantic motion; tôn trọng reduce-motion                  |
| Content animation               | `lottie-react-native`                                        | Loop minh họa không tương tác; JSON versioned + static fallback             |
| Secure credential/key wrapping  | Expo SecureStore + iOS Keychain/Android Keystore             | Không lưu token/key plaintext trong AsyncStorage/SQLite                     |
| Content cryptography            | Native AES-256-GCM implementation qua Expo-compatible module | Package cuối phải qua POC và security review; không tự viết crypto          |
| Parent authentication           | Supabase Auth client                                         | Mobile lấy access token; app server verify JWT/JWKS và map internal account |
| Subscription client             | React Native IAP adapter for StoreKit 2/Play Billing         | Chỉ purchase/restore; backend direct store verification mới là authority    |
| Error monitoring                | Firebase Crashlytics                                         | Dùng Firebase project sẵn có; redact child/family data và content key/token |
| Test                            | Jest, React Native Testing Library, Maestro, device test     | Bổ sung lifecycle, pack, expiry và account-switch test                      |
| Build/release                   | EAS Free Build/Submit cho iOS; Gradle local cho Android      | Không có Mac; EAS build-only, không EAS Update/OTA hoặc paid plan baseline  |

Các package đã có trong repository được giữ khi phù hợp, nhưng bảng trên là target stack; việc package chưa được cài không làm requirement biến mất.

### 5.2. App server/control plane

| Concern              | Chọn                                                                   | Quy tắc                                                                      |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Runtime/language     | Node.js LTS + TypeScript strict                                        | Một backend codebase; không chia microservice v1                             |
| Server framework     | NestJS với Fastify adapter                                             | Module boundary, DI, guard, validation và OpenAPI; Fastify làm HTTP engine   |
| API style            | REST/JSON `/v1` + OpenAPI 3.1                                          | Contract versioned; sinh typed client cho mobile/admin                       |
| Validation           | Zod DTO/schema tại boundary                                            | Client validation không thay server validation                               |
| Authentication       | Supabase Auth + `IdentityGateway`                                      | Verify JWT/JWKS; Supabase subject chỉ nằm trong `auth_identities`            |
| Authorization        | NestJS guards/policies + service/repository checks                     | Object ownership bắt buộc kiểm tra server-side                               |
| Data access          | Prisma ORM + reviewed SQL migrations                                   | Connection pool có budget; migration chạy one-shot job riêng                 |
| Database             | Supabase Free PostgreSQL                                               | Runtime qua transaction pooler; standard SQL/migration, không mobile access  |
| Object storage       | Cloudflare R2 Standard private buckets                                 | Presigned URL ngắn hạn; S3-compatible adapter, Drive chỉ source/archive      |
| Secrets/key material | Google Secret Manager + Cloud KMS                                      | Không có database/service/content key plaintext trong client hoặc repository |
| Deployment           | Cloud Run request-based, Singapore                                     | OCI image; scale-to-zero, bounded max instances/connections, pin digest      |
| Scheduled/retry work | Cloud Run Job + Cloud Scheduler; PostgreSQL job/outbox                 | Cùng app image; không thêm Redis/message broker                              |
| Subscription         | App Store Server API/V2 notifications + Google Play Developer API/RTDN | Direct adapters; entitlement projection trong PostgreSQL                     |
| Logging/tracing      | Pino + OpenTelemetry + Cloud Logging/Error Reporting                   | Không thêm monitoring SaaS; redaction và alert theo user impact              |
| Test                 | Jest, Supertest, Testcontainers                                        | Unit, integration PostgreSQL, API contract và security tests                 |
| Backup               | Daily verified logical dump → separate private R2 bucket               | Free tier không auto-backup/PITR; isolated restore drill bắt buộc            |
| Notifications        | Expo/native local notification                                         | On-device schedule only; không push token/server delivery                    |

### 5.3. Content/admin/tooling

| Concern               | Chọn                                         | Quy tắc                                                                      |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Internal admin        | Next.js + TypeScript                         | Chỉ gọi app server; role/authorization/audit bắt buộc                        |
| Content schema        | Zod + JSON Schema                            | Cùng schema dùng validate authoring, build và mobile install                 |
| Pack builder          | Node.js LTS + TypeScript CLI                 | Deterministic build, hash, sign, encrypt và xuất manifest                    |
| Media normalization   | FFmpeg pinned/containerized                  | Deterministic derivative và machine-readable technical QC                    |
| Default mouth video   | Veo 3/Veo 3.1 candidates                     | Human Vietnamese/lip-sync QA; không là runtime dependency                    |
| Vietnamese audio      | Human recording; Google Cloud TTS candidates | TTS không bypass linguistic/listening QA; family audio là private override   |
| Illustration drafting | ChatGPT/Gemini image generation candidates   | Human semantic/safety/license review; không auto-publish                     |
| Animation authoring   | Reanimated/SVG + Lottie                      | Không baseline Rive/Skia/Spine khi chưa có measured requirement              |
| Source media archive  | Google Drive 5 TB                            | Chỉ source/archive; file production là immutable output trong object storage |
| Source control/CI     | Git + GitHub Actions                         | Lint, test, schema compatibility, secret scan và pack validation             |
| Infrastructure/config | Prisma migrations + OpenTofu/provider config | Không chỉnh production thủ công mà không có change record                    |

### 5.4. Không dùng trong baseline v1

- microservices;
- Redis/Kafka/RabbitMQ;
- GraphQL;
- Kubernetes;
- streaming/CDN video pipeline;
- AI/ML service chấm phát âm.

Các thành phần này chỉ được thêm bằng ADR khi có requirement hoặc số đo chứng minh baseline không đáp ứng.

## 6. System context

```text
Parent + Child
      │
      ▼
KidEDU Mobile App
      │ HTTPS/TLS
      ▼
Cloud Run Docker App Server — NestJS/Fastify
 ├─ Versioned REST API / OpenAPI
 ├─ AuthN/AuthZ + Family/Child
 ├─ Content/Sync/Progress
 ├─ Entitlement/Activation/Key delivery
 └─ Media/Privacy/Admin commands
      │
      ├─ Supabase Free PostgreSQL + Auth/JWKS
      ├─ Cloudflare R2 private object storage
      ├─ Google KMS/Secret Manager
      ├─ Apple App Store Server API/Notifications V2
      ├─ Google Play Developer API + RTDN/Pub/Sub
      └─ Cloud Logging/Error Reporting/OpenTelemetry

Internal Content Admin
      └─ Next.js → review → approve → CI build → signed packs
```

## 7. Backend control-plane boundaries

| Module             | Sở hữu                                                            | Không sở hữu                         |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------ |
| Identity & Family  | account, family membership, consent, device registration          | subscription truth, lesson content   |
| Child Profile      | profile, settings, goals selected by parent                       | diagnosis/medical record             |
| Learning Plan      | persisted plan state, assignment/version và sync                  | chạy progression/recommendation rule |
| Curriculum         | domains, goals, targets, activity templates, prerequisites        | family media, entitlement            |
| Content Publishing | review workflow, versions, pack build/publish/retire              | runtime progress                     |
| Progress & Sync    | observations, sessions, outbox idempotency, sync cursors          | raw child recording                  |
| Entitlement        | plans, trial, normalized store state, activation grant            | store payment UI                     |
| Media              | metadata, upload authorization, processing state, quota/retention | public sharing                       |
| Privacy            | export/delete workflow, retention enforcement, audit              | business analytics profiling         |

Các dòng trên là NestJS module trong cùng một deployable, không phải microservice. Detail design phải quy định data ownership và application contract; mobile/admin không được kết nối database hoặc storage bằng privileged credential.

## 8. Mobile module boundaries

```text
Presentation / Navigation
        ↓
Feature application layer
  account · onboarding · plan · learning · parent
  progress · media · subscription · downloads · privacy
        ↓
Domain policies / use cases
        ↓
Repository ports
        ↓
Local DB · secure storage · encrypted pack/media store
        ↕
Sync / API / upload-download adapters
```

Quy tắc:

- screen không query SQLite/file/API trực tiếp;
- learning engine nhận một immutable `PreparedLesson` từ active generation;
- media resolver là cửa duy nhất chuyển asset reference thành usable local resource;
- entitlement guard nằm ở route, session creation, content repository, activity loader, media resolver và key unwrap; UI paywall không phải security boundary;
- progress write local trước qua transaction/outbox, rồi sync idempotent;
- account switch tạo storage namespace mới hoặc purge namespace cũ theo policy, không tái sử dụng projection sai account.

## 9. Data authority và storage

| Data class                  | Server authority                         | Local role                     | Encryption/access                                  |
| --------------------------- | ---------------------------------------- | ------------------------------ | -------------------------------------------------- |
| Account/consent             | Server                                   | session projection             | TLS, DB at-rest, token secure storage              |
| Entitlement                 | Server + normalized store events         | signed activation cache        | signed, expiry/device/account bound                |
| Curriculum/catalog          | Published server version                 | read projection/index          | signed manifest; public metadata tối thiểu         |
| Premium lesson payload      | Server published pack                    | encrypted runtime pack         | AEAD, per pack/version key                         |
| Default media               | Object storage metadata-authorized       | durable encrypted cache        | hash/checksum + entitlement guard                  |
| Child profile/plan/progress | Server after sync                        | responsive projection + outbox | encrypted local DB/fields as threat model requires |
| Family media                | Parent-owned metadata/server if opted in | durable local primary/cache    | separate user key, private object ACL              |
| Learning checkpoint         | Local during session; summarized server  | crash recovery                 | account/child scoped                               |
| Analytics/diagnostics       | Telemetry backend                        | bounded queue                  | no raw child/family media, redact PII              |

Server conflict policy phải rõ theo entity. Content là server-wins theo published version; append-only observations dùng idempotent merge; profile/settings dùng optimistic concurrency và explicit conflict resolution, không dùng timestamp client mù quáng.

## 10. Core domain entities

Technical detail có thể tách bảng nhưng không được làm mất các identity/boundary sau:

- `Account`, `Family`, `FamilyMember`, `ConsentRecord`, `Device`;
- `ChildProfile`, `Goal`, `LearningPlan`, `PlanItem`;
- `SkillDomain`, `Target`, `ActivityTemplate`, `ActivityInstance`, `Lesson`;
- `ContentRelease`, `LessonPack`, `PackAsset`, `Manifest`;
- `LearningSession`, `ActivityAttempt`, `Observation`, `Checkpoint`;
- `Subscription`, `Entitlement`, `ActivationGrant`, `StoreEvent`;
- `UserMedia`, `MediaBinding`, `Upload`, `RetentionState`;
- `SyncCursor`, `OutboxEvent`, `IdempotencyRecord`, `AuditEvent`.
- `LocalNotificationPreference`, `LocalNotificationSchedule` chỉ ở mobile namespace.

Mọi ID sync qua network là opaque, stable và không tái sử dụng. Timestamp server dùng UTC; client display theo timezone nhưng không dùng wall clock client làm authority cho expiry.

## 11. Content packaging và readiness

### 11.1. Manifest

Manifest có tối thiểu:

- format/schema version;
- content release ID và generation;
- pack ID/version, size, hash và signature;
- capability/entitlement tags;
- dependency và minimum app version;
- asset descriptors và encryption metadata không chứa plaintext key;
- issued/published/retired state.

### 11.2. Lesson pack

Pack là đơn vị install/update/lock, không nhất thiết trùng một lesson. Kích thước phải đủ nhỏ để progressive delivery nhưng đủ cohesive để lesson không tải giữa chừng. Pack chứa structured activity data và reference tới media object; video lớn có thể là encrypted object riêng được manifest ràng buộc.

### 11.3. Activity readiness

Readiness được tính theo tuple `(contentVersion, target, activityType, deviceCapability, entitlement)`.

Ví dụ:

- học khẩu hình cần approved mouth video + audio + semantic visual theo authoring rule;
- nhận biết có thể cần instruction audio + visual options, không cần mouth video;
- vuốt đuôi cần authored sentence/audio + pause marker + accepted completion;
- parent-guided command cần instruction và prop guidance, không bắt buộc video.

Không dùng một boolean `cardReady` chung.

### 11.4. Pack state machine

```text
not_downloaded
  → downloading
  → verifying
  → installing
  → ready

downloading/verifying/installing → failed → retry
ready → update_available → downloading(new version)
ready → locked                 (entitlement mất; bytes còn mã hóa)
ready/locked → evicted         (storage policy; user data không bị xóa)
```

State transition được persist; crash recovery không đánh dấu `ready` nếu atomic install chưa hoàn tất.

## 12. Sync protocol

### 12.1. Bootstrap/cold start

```text
restore refresh credential
→ authenticate/rotate token if required
→ send device/app/schema versions + last cursors
→ receive trusted server time + entitlement activation + flags
   + catalog/user deltas + required manifest versions
→ validate and atomically apply small delta
→ open current local generation
→ continue/prefetch packs in background
```

Activation handshake phải nhỏ; không trả full catalog/media khi cursor còn hợp lệ.

### 12.2. User data sync

- mobile mutations ghi local transaction cùng outbox event;
- mỗi event có stable event ID/idempotency key;
- server validate auth, family/child ownership, schema và optimistic version;
- ack chỉ xóa/compact outbox sau khi local commit;
- pull delta dùng cursor opaque do server cấp;
- delete dùng tombstone/retention phù hợp, tránh record sống lại từ device cũ.

### 12.3. Prefetch policy

Default window: current lesson + two next lessons. Policy có thể:

- tăng khi Wi-Fi, charging và storage dư;
- giảm khi cellular, data-saver, low battery hoặc storage thấp;
- ưu tiên asset bắt buộc trước asset optional;
- pause an toàn và resume bằng range/chunk nếu provider hỗ trợ;
- không prefetch pack không thuộc entitlement.

### 12.4. Cleanup

Cache eviction dùng LRU có trọng số bởi active plan, next lessons, kích thước và recency. Không xóa active lesson/checkpoint, unsynced user data hoặc family media như cache. Encrypted premium pack có thể giữ khi locked để resubscribe nhanh, nhưng phải nhường storage theo policy.

## 13. App lifecycle

| Event                                                | Hành vi bắt buộc                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Warm foreground, process còn sống, activation hợp lệ | Resume UI/local state; không full sync; có thể delta sync background                                                            |
| Background trong khi phát media                      | Pause media, persist checkpoint, không logout                                                                                   |
| Force-kill/process eviction                          | Key plaintext mất; local generation/checkpoint còn; reopen chạy cold activation nhỏ                                             |
| Cold start online                                    | Auto-login nếu refresh credential hợp lệ; activation + delta; không re-download valid pack                                      |
| Cold start không có mạng                             | Không mở premium session mới; hiển thị trạng thái kết nối có retry/account-data access phù hợp                                  |
| Mất mạng giữa lesson đã Ready                        | Hoàn thành lesson từ local, queue progress, sync khi mạng trở lại                                                               |
| Activation hết hạn khi app còn sống                  | Check guard trước activity/session boundary; kết thúc an toàn activity hiện tại, không mở premium activity mới, hủy key runtime |
| Account switch/logout                                | Close session, flush/preserve outbox theo policy, purge keys và isolate/purge local namespace                                   |
| Content update giữa lesson                           | Session giữ immutable version đến khi kết thúc; generation mới áp dụng cho session sau                                          |

Không phụ thuộc duy nhất vào lifecycle callback để khóa entitlement vì app có thể bị kill mà không nhận callback.

## 14. Entitlement and content-key flow

```text
Mobile authenticated activation request
→ Backend reads normalized entitlement + trusted time + device/account state
→ Backend returns signed short-lived ActivationGrant
   and only wrapped keys for authorized required packs
→ Mobile verifies signature/binding/expiry
→ OS-backed device key unwraps content key for runtime
→ Repository + lesson loader + media resolver check grant before use
→ Expiry/revoke/account switch invalidates runtime key and access
```

Security requirements:

- grant bind account, device/app instance, capabilities, issued-at, not-before, expiry và key IDs;
- grant expiry không vượt subscription/trial end;
- server xử lý refund/revoke/webhook idempotently;
- app phát hiện clock rollback bằng server-time anchor/monotonic elapsed trong process;
- deep link không bypass activation/Parent Gate;
- không log receipt, token, content key, signed URL hoặc child PII;
- database row/content URI có cache cũng không được bypass resolver;
- production build dùng platform integrity signals/risk controls nếu chi phí và store support phù hợp, nhưng không coi đó là trust duy nhất.

## 15. Subscription integration

1. Mobile bắt đầu/restore purchase qua store SDK trong Parent Mode.
2. Receipt/purchase token được gửi backend qua authenticated, idempotent command.
3. App server verify Apple signed transaction/notification hoặc Google purchase token/RTDN, gọi provider server API để reconcile và persist event tối thiểu cần audit.
4. Billing adapter chuẩn hóa renewal, billing retry, grace, refund và revoke từ Apple/Google vào entitlement projection.
5. Entitlement module tính effective state; activation endpoint chỉ đọc state chuẩn hóa.
6. Client refresh UI và grant, không tự cộng ngày hoặc tin local receipt.

Test bắt buộc gồm duplicate/out-of-order webhook, delayed webhook, refund, reinstall, restore trên device khác, account mismatch và store outage.

## 16. Media architecture

### 16.1. Default content

Source/master asset đi qua content brief → recording/generation → ingest → deterministic validation/transcode → modality-specific human review → immutable output → pack/manifest publish. Google Drive nếu dùng chỉ ở lớp source/archive, không phát public link cố định làm authorization. Video, audio, animation và ảnh tuân [Content Media Production Specification](./product/06-content-media-production-spec.md) và `TA-ADR-024`.

### 16.2. Family media

```text
parent explicitly selects capture/import
→ request permission in context
→ stage local file
→ validate + normalize if needed
→ preview
→ atomic commit metadata + durable file
→ optional encrypted cloud upload under consent/quota
```

Thay media không xóa bản đang dùng trước khi bản mới commit. Xóa binding fallback về default nếu có. Orphan cleanup chạy best-effort sau database commit và có retry.

### 16.3. Download delivery

API kiểm tra entitlement rồi trả download authorization/short-lived signed URL hoặc proxy token. Client verify expected size/hash/signature trước install. URL hết hạn không làm mất bytes đã tải; client xin authorization mới để resume khi cần.

## 17. Security and privacy architecture

### 17.1. Threats trong phạm vi

- credential/token theft;
- broken object-level authorization giữa family/child;
- copy/modify local DB, manifest hoặc cache để mở premium;
- stale entitlement sau expiry/refund;
- clock rollback;
- account switch data leak;
- malicious/corrupt pack và supply-chain asset;
- family media xuất hiện trong log/analytics/backup sai quyền;
- API replay, duplicate webhook và upload abuse.

### 17.2. Controls bắt buộc

- TLS cho mọi network traffic; secret không nằm trong app bundle;
- authentication và authorization server-side trên từng object/action;
- refresh token trong platform secure storage, rotation/revocation theo auth design;
- database/object storage encryption at rest và least-privilege service identity;
- signed manifest, AEAD content, checksum và safe parser limits;
- short-lived signed upload/download authorization;
- rate limit/quota/abuse protection ở auth, upload và expensive endpoints;
- structured audit cho consent, delete/export, entitlement/admin publish;
- log redaction và environment/data separation;
- dependency scanning, secret scanning, mobile/backend security review trước release;
- backup encrypted và restore drill định kỳ.

### 17.3. Child privacy

Không thu raw audio/video của trẻ chỉ để analytics. Nếu tương lai thêm recording/scoring, phải có requirement, consent, retention, threat model và review mới; không được tái sử dụng permission/media pipeline v1 một cách ngầm định.

## 18. Reliability, performance và capacity targets

Các target dưới đây là release SLO ban đầu và phải đo trên reference device/network do performance spec chốt:

| ID           | Target                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `TA-SLO-001` | Crash-free learning sessions ≥ 99.5% trong rolling 30 ngày sau khi đủ sample                               |
| `TA-SLO-002` | Lesson đã `Ready` mở đến stimulus đầu p95 ≤ 1.5 giây trên reference device                                 |
| `TA-SLO-003` | Warm foreground không rebuild/reload content generation; UI usable p95 ≤ 1 giây                            |
| `TA-SLO-004` | Activation/bootstrap API không chứa media; response p95 server processing ≤ 500 ms, không tính network     |
| `TA-SLO-005` | Sync apply hoặc hoàn tất toàn bộ generation mới, hoặc giữ nguyên generation cũ; không partial active state |
| `TA-SLO-006` | Progress outbox không mất event đã commit qua crash/process kill                                           |
| `TA-SLO-007` | Media cache hit không tạo network download mới cho cùng valid hash                                         |

Capacity plan đo catalog size, pack size distribution, media bytes/active subscriber, API requests/active user, outbox lag, object egress và DB growth. Không chọn microservice/CDN/provider đắt tiền chỉ từ giả định; scale dựa số đo.

## 19. Observability

Tối thiểu phải có:

- structured logs có correlation/request ID và redaction;
- metrics cho API latency/error, auth/activation, sync, webhook lag, pack build/download/verify/install, upload và delete/export jobs;
- mobile crash/error reporting không đính kèm child/family content;
- distributed trace hoặc request trace đủ điều tra luồng quan trọng;
- alert theo user impact, không chỉ CPU;
- audit trail tách khỏi analytics sản phẩm;
- dashboard release version để phát hiện regression/migration lỗi.

Analytics event schema phải version hóa và tham chiếu `PRD-PRIV-003`. Không ghi text note, target tùy chỉnh hoặc filename gia đình như event property mặc định.

## 20. Environments, delivery và operations

Tối thiểu có:

- local/dev không dùng production data;
- staging/server-test tách credential, database, bucket và store sandbox;
- production có least privilege, secret manager, backup và audit;
- migration chạy qua CI/CD có preflight, backup/rollback và compatibility window;
- content publish độc lập app release nhưng có signed version/minimum app compatibility;
- mobile release dùng staged rollout khi platform hỗ trợ, crash/SLO gate và rollback/kill switch cho feature/content;
- infrastructure/config được version-control theo mức phù hợp, không thao tác production chỉ bằng ghi nhớ cá nhân.

## 21. Testing architecture

| Lớp                | Trọng tâm                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Unit/domain        | plan rules, readiness, entitlement policy, state machines, conflict/merge                       |
| Contract           | API schema/version, manifest, pack, store webhook, idempotency                                  |
| Integration        | PostgreSQL/object storage/job, sync atomicity, upload/download, key flow                        |
| Mobile integration | local migration, repository, resolver, checkpoint/outbox, lifecycle                             |
| E2E                | onboarding → plan → download → lesson → observation → sync; trial/purchase/expiry; family media |
| Security/privacy   | BOLA, token/key handling, tampered pack, account switch, export/delete, log leakage             |
| Resilience         | loss/slow network, low storage, corrupt/partial download, process kill at every transition      |
| Store sandbox      | purchase, restore, renew, grace, cancel, refund/revoke trên Apple/Google                        |
| Content QA         | Vietnamese language, mouth video, audio, pause marker, prompt và activity readiness             |

Production release không được dựa chỉ vào happy-path E2E hoặc emulator; cần test thiết bị thật, ít nhất một thiết bị cấu hình thấp trong support matrix.

## 22. Derived technical specifications

Các tài liệu sau sẽ chi tiết hóa Technical Architecture và phải ghi `Implements: TA-ADR-... / PRD-...`:

1. mobile stack và module structure;
2. backend stack, module/data ownership và API conventions;
3. identity, consent và authorization;
4. server/local data model và migration;
5. sync protocol, manifests và pack format;
6. media ingest/upload/download/cache pipeline;
7. subscription, entitlement, activation và content-key security;
8. content authoring/publishing/admin system và media production specification;
9. performance, observability, backup/DR và operations;
10. security/privacy threat model;
11. local notification permission/schedule/privacy design;
12. provider portability và service-evolution plan;
13. initial Cloud Run/Supabase/R2 deployment specification;
14. testing, CI/CD, cost model và store release plan.

## 23. Open architecture decisions

- `TA-TBD-001`: Expo stable target khi bắt đầu refactor và kết quả POC native crypto/direct StoreKit 2/Google Play Billing trên Development Build;
- `TA-TBD-002`: production budget ceiling và numeric RPO/RTO/backup retention cho Supabase Free controlled release;
- `TA-TBD-003`: package AES-GCM cụ thể và format wrapped-key tương thích iOS/Android;
- `TA-TBD-005`: ActivationGrant TTL, online grace và revoke latency;
- `TA-TBD-006`: local database encryption strategy khả dụng trên cả iOS/Android;
- `TA-TBD-007`: family media cloud quota, retention và encryption/key recovery model;
- `TA-TBD-008`: pack granularity/size budget sau khi đo corpus thật;
- `TA-TBD-009`: supported OS/device matrix và numeric download/storage thresholds;
- `TA-TBD-010`: app integrity/attestation level theo platform và ngân sách.
- `TA-TBD-011`: production transactional SMTP provider/domain, quota và deliverability controls cho Supabase Auth email flows;
- `TA-TBD-012`: stable `api.<domain>` ingress option cho Cloud Run (managed load balancer, Firebase Hosting hoặc reviewed domain mapping) sau cost/latency POC;

Các lựa chọn chi tiết phải ưu tiên giải pháp open-source/free-tier hiệu quả nhưng được đánh giá cả giới hạn, egress, lock-in, backup, SLA và tổng chi phí vận hành; `free` không được là lý do bỏ security hoặc khả năng migrate.

## 24. Architecture acceptance gate

Technical Architecture chỉ chuyển `Approved` khi:

1. tất cả `Must` trong PRD có component owner và end-to-end data/control flow;
2. threat model và entitlement bypass review không còn lỗ hổng business logic nghiêm trọng đã biết;
3. Cloud Run/NestJS/Expo/Supabase/R2/direct Apple-Google billing baseline có cost review và proof-of-concept cho connection pooling, backup/restore, crypto, activation, subscription và sync;
4. pack/sync/key lifecycle đã test bằng prototype với process kill, expiry và account switch; local notification đã test trên thiết bị thật với permission, schedule/cancel và deep link;
5. privacy/data retention, backup/restore và store subscription flow có design được duyệt;
6. SLO có reference environment và phương pháp đo;
7. derived specs không mâu thuẫn với các `TA-ADR-*`; provider boundaries có adapter/backup migration test tương ứng.

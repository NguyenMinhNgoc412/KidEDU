# AI Custom Library Generation Architecture

| Thuộc tính | Giá trị                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Trạng thái | `In review — v1 scope approved`                                                                                    |
| Owner      | Backend + Mobile + Content Platform + Billing                                                                      |
| Implements | `TA-ADR-026`, `PRD-CUSTOM-*`, `PRD-SUB-005`                                                                        |
| Depends on | [Backend Architecture](./02-backend-architecture.md), [Media Security](./05-media-storage-and-content-security.md) |
| Cập nhật   | 2026-11-05                                                                                                         |

## 1. Architecture shape

> AI workflow thuộc v1 theo TA-ADR-026/ADR-0010. Provider/model, dispatcher và allowance policy vẫn là candidate cần C50-D03/POC. Sơ đồ Cloud Tasks dưới đây là phương án, không là authorization provision; dùng baseline PostgreSQL job/outbox nếu đủ số đo.

AI generation là asynchronous control-plane workflow, không nằm trong learning runtime:

```text
Mobile Parent Mode
  → App Server API: draft / quote / reserve / status / approve
  → approved-catalog resolver: semantic/locale/role reuse before generation
  → PostgreSQL: GenerationJob + AssetAttempt + QuotaLedger (optional credit)
  → Cloud Tasks: dispatch/poll/retry, payload chỉ có opaque job ID
  → Cloud Run generation handler từ cùng OCI image/repository
      → GenerationGateway: Gemini text/image candidate
      → SpeechGenerationGateway: Google Cloud TTS vi-VN candidate
      → deterministic motion-template selector + FFmpeg validators
  → R2 private staging
  → parent preview authorization
  → private pack build/sign/encrypt/publish
  → normal manifest/delta/download/install path
```

API và handler có thể deploy thành hai Cloud Run services từ cùng image để tách concurrency/timeout/service identity, nhưng vẫn là một modular monolith/codebase và một PostgreSQL authority; không chia microservice domain.

## 2. Candidate provider and portability

C50-D03 owner amendment 2026-11-06: Gemini AI Studio free chỉ developer-only synthetic harness, không application runtime; model phát hành dự kiến GPT-5.6 Luna cho draft chữ, qua evaluation/privacy gates. Quota/budget/retry/dispatcher còn theo decision table C50 và cost model; không provisioning/billing từ lựa chọn model. Các Gemini text/image trong sơ đồ candidate bên trên không là provider production đã duyệt.

- Text/structured draft + image: Gemini model qua `GenerationGateway`; production ưu tiên Google Cloud/Vertex AI service identity và allowlisted model/config thay vì API key trong client.
- Audio: Google Cloud Text-to-Speech `vi-VN` qua `SpeechGenerationGateway`.
- Motion: server chỉ trả `motionRecipeId` và bounded parameters từ registry versioned; client render bằng Reanimated/SVG hoặc bundled Lottie. Model không được tạo arbitrary code hoặc executable asset.
- Optional providers như OpenAI API/Imagen khác chỉ thêm trong adapter/config sau quality, privacy và cost comparison; ChatGPT Pro/Gemini Pro account không được dùng như server credential.

Domain lưu `providerClass`, internal `modelConfigId` và provenance snapshot, không lan provider request/response DTO vào API/content schema. Model name thực nằm trong ops config/audit để pin và migrate có kiểm soát.

## 3. State machines

### 3.1. Generation job

```text
draft → quoted → quota_reserved → queued
queued → generating_text → generating_assets → validating
validating → preview_ready → parent_approved → packaging → ready

queued/generating/validating → retry_wait → queued
any pre-ready state → failed | cancelled
preview_ready → revision_requested → queued
```

Transition dùng optimistic version + transaction. Mỗi task có `(jobId, step, attemptNo, idempotencyKey)`; handler reload state từ DB, không tin task payload. Duplicate/out-of-order task phải no-op an toàn.

### 3.2. Allowance/quota ledger và optional credit

Ledger quota là append-only; included allowance có grant server-side và unique reservation/job. Nếu owner duyệt add-on, credit journal có: `purchase_granted`, `promo_granted`, `reserved`, `released`, `captured`, `compensated`, `store_reversed`. Unique constraint theo store transaction/event và job reservation ngăn double-spend/double-charge. Balance là projection có thể rebuild từ journal.

Reservation và job transition commit trong một DB transaction. Provider call không nằm trong transaction; retry dùng stored attempt/result hash.

## 4. API boundary

Các command/query chính:

- `POST /v1/custom-libraries/drafts`;
- `PATCH /v1/custom-libraries/{id}` với optimistic version;
- `POST /v1/custom-libraries/{id}/quote`;
- `POST /v1/generation-jobs` với idempotency key;
- `GET /v1/generation-jobs/{id}` và bounded foreground polling/backoff;
- `POST /v1/generation-jobs/{id}/revision`;
- `POST /v1/custom-libraries/{id}/approve`;
- `POST /v1/custom-libraries/{id}/publish`;
- normal `/v1/sync`/manifest/download endpoints cho ready private pack.

Mọi endpoint derive family/account từ auth, kiểm Parent Gate proof khi cần và object authorization tại service/repository. Preview URL presigned ngắn hạn, không là object identity.

## 5. Prompt and output boundary

Prompt builder nhận typed/sanitized fields, render server-owned template version và inject no-secret instruction. Không nối raw note/system-like text vào developer/system prompt. Request record có redacted input hash, template version, model config, safety setting, region, token/output budget và correlation ID.

Reuse resolver chỉ nhận published compatible default asset và match theo semantic target identity + classifier/meaning + locale/accent + role, không chỉ normalized string. Quote snapshot pin reused asset version/hash; nếu asset retire trước publish, job re-resolve và yêu cầu parent xác nhận quote/review lại khi output/cost thay đổi. Không cross-family deduplicate custom output.

Structured output phải parse bằng strict JSON Schema/Zod với maximum depth/count/string. Unknown activity/motion/asset role bị reject. Image binary đi qua MIME/dimension/decompression-bomb/malware checks. Audio đi qua codec/duration/loudness/clipping checks và transcript-role binding.

Provider safety filter không là lớp duy nhất: server allowlist use case, moderation rule, schema/technical gate và parent approval cùng tham gia. Unsafe output không được cấp preview URL.

## 6. Asset and pack isolation

- Staging object path dùng opaque family/job/attempt IDs, không chứa target/name.
- Generated asset immutable theo hash; revision tạo asset/version mới.
- Private pack bind `familyId`, content generation, entitlement capability và per-pack key; không deduplicate plaintext/object across family boundary nếu làm lộ equality.
- Pack builder chỉ nhận approved asset references từ DB, không nhận arbitrary client URL/path.
- Reject/cancel cleanup theo retention job; audit/billing record được giữ riêng theo legal policy.
- Parent video tiếp tục đi qua family-media pipeline và không được copy vào provider workspace.

## 7. Queue, concurrency and cost control

Cloud Tasks là candidate dispatcher. Trước provision phải có ADR/POC extend TA-ADR-018; scope AI v1 không tự duyệt service mới. Baseline PostgreSQL job/outbox cần đo timeout/throughput/retry trước lựa chọn dispatcher. Queue có thể tách text/image/audio/packaging khi quota cần khác, với:

- per-account concurrent job limit;
- global/project rate and spend cap;
- provider timeout, exponential backoff + jitter và max attempts;
- circuit breaker/config kill switch theo provider/model;
- quote estimate + actual cost ledger theo step;
- Cloud Run worker max instances/concurrency thấp để không vượt provider/DB quota;
- dead-letter state trong PostgreSQL và manual retry có audit.

Long-running provider operation lưu opaque operation ID mã hóa/least-sensitive và enqueue poll task; không giữ request mở hoặc busy-wait. Job status lấy bằng polling lúc screen foreground và normal delta lúc app reopen; candidate phase đầu không thêm remote push.

## 8. Secrets, privacy and observability

- Provider credential trong Secret Manager/service identity; worker có IAM tối thiểu, API service không cần mọi provider permission nếu tách service account.
- Raw prompt/output không vào standard log, trace, Crashlytics hoặc analytics.
- Metrics dùng job/step/status/model-config/cost bucket, không target text.
- Content support access là break-glass RBAC + reason + audit.
- Provider data-use/retention/region config được review và ghi data inventory/DPA trước production.
- Delete workflow xóa raw request/output/staging/private objects theo retention, giữ ledger/audit tối thiểu đã pseudonymize nếu pháp lý yêu cầu.

## 9. Failure and rollback

- Provider lỗi: bounded retry; release reservation khi terminal failure.
- Asset partial: giữ staging đến retry deadline; không publish partial pack dưới minimum quote.
- Parent không approve: preview expires theo retention; credit capture/compensation theo disclosed policy, không silent delete.
- Pack build lỗi: content remains preview-ready; retry packaging không gọi AI/trừ credit lại.
- Provider quality/cost regression: disable model config; existing immutable packs không đổi.
- Cloud Tasks unavailable: job stays `quota_reserved/queued`; reconciler resubmits idempotently hoặc releases stale reservation.
- Rollback app/server: schema expand-compatible, unknown custom pack capability không được render best-effort.

## 10. Verification gate

- Contract/integration test mọi job/credit transition, duplicate task/store event và crash giữa DB/provider/storage boundary.
- Load/cost test concurrent jobs với hard max; no unbounded provider retry/poll.
- Security test prompt injection, oversized input/output, cross-family BOLA, leaked preview URL, malicious image/audio và arbitrary motion recipe.
- Privacy test xác nhận family media/child profile/progress không có trong provider request/log.
- E2E production-like: reserve allowance (buy chỉ nếu add-on approved) → kill app → generate → reopen → preview/revise → approve → pack ready → expiry/resubscribe/delete.

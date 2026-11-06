# AI Custom Library Specification

| Thuộc tính | Giá trị                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Trạng thái | `In review — v1 scope approved`                                                                                            |
| Owner      | Product + Content + Backend + Mobile + Billing                                                                             |
| Implements | `PRD-CUSTOM-*`, `PRD-SUB-005`, `PRD-CONT-001`, `PRD-CONT-006`, `PRD-MEDIA-*`, `PRD-PRIV-*`                                 |
| Depends on | [Content Media Production](./06-content-media-production-spec.md), [Subscription Access](./05-subscription-access-spec.md) |
| Cập nhật   | 2026-11-05                                                                                                                 |

## 1. Định nghĩa sản phẩm

> Owner đã chuyển vào Store Release v1.0 ngày 2026-11-05. PRD-CUSTOM-* và C50 là scope/gate; paid được tạo thủ công hoặc AI, free không tạo bộ. Không mặc định mandatory consumable add-on.

Tên capability trong tài liệu: **AI Custom Library**; label UX tiếng Việt dự kiến: **Bộ học tùy chỉnh AI**.

Đây là công cụ Parent Mode cho phép gia đình tạo một private collection gồm target từ/cụm/câu, ngữ cảnh và activity tương thích. Server hỗ trợ tạo nội dung và asset, sau đó đóng gói để mobile tải về. Nó không phải chat tự do, không phải marketplace, không tự xây phác đồ và không chạy AI trong learning session.

## 2. Điều kiện sử dụng

- Parent account, Parent Gate và active subscription.
- AI cần allowance/quota khả dụng theo policy server; optional store credit chỉ khi SKU được owner duyệt. Manual không tiêu generation quota.
- Consent/privacy notice cho việc gửi input đã tối thiểu hóa sang provider.
- Device online để tạo/preview/publish; sau khi private pack `Ready`, learning runtime dùng local theo entitlement như pack khác.

Trial không được tạo bộ thủ công hoặc AI theo C50-D02/PRD-SUB-006. Không dùng promotional credit hay local flag để vượt giới hạn này.

## 3. Authoring flow

```text
Tạo bộ mới
→ nhập/chọn chủ đề, từ/cụm/câu và mục tiêu sử dụng
→ AI đề xuất structured draft tiếng Việt
→ parent sửa/chọn/bỏ từng target
→ resolve target/asset mặc định đã duyệt có thể reuse
→ hiển thị quote: reused/generated, allowance/quota, phí nếu có, retry/refund
→ reserve allowance/quota + enqueue generation
→ server tạo audio + image + allowlisted motion recipe
→ automated safety/schema/technical validation
→ parent preview, sửa/regenerate/bỏ asset
→ parent approve
→ build signed/encrypted private pack
→ mobile download/verify/install
→ parent chủ động gắn vào plan/lesson phù hợp
```

AI suggestion không tự được coi là mục tiêu học. App phải cho biết đây là nội dung tùy chỉnh do parent duyệt, không phải khuyến nghị chuyên môn.

## 4. Input model

Một draft collection có:

- tên bộ do parent đặt, không gửi provider nếu không cần;
- purpose/setting allowlist như ăn uống, đồ chơi, thành viên gia đình, đi học, sinh hoạt;
- target seed: từ/cụm/câu tiếng Việt;
- activity types mong muốn;
- preference về giọng vùng miền/tốc độ trong phạm vi support;
- optional family-media binding chỉ lưu nội bộ, không đưa vào prompt generation mặc định.

Server giới hạn số target, độ dài text, Unicode/control character, link, script/injection pattern và content không phù hợp trẻ. Free-form note không được gửi nguyên văn sang provider; prompt builder chỉ lấy field đã allowlist/sanitize.

Trước provider call, resolver tìm canonical target theo normalized text + meaning/classifier + locale/accent + asset role. Chỉ reuse khi semantic match chắc chắn và default asset vẫn published/compatible; không match chỉ bằng chuỗi text mơ hồ. Parent có thể yêu cầu hình/ngữ cảnh riêng, khi đó quote ghi generation mới. Custom asset của gia đình khác không được dùng làm nguồn deduplicate.

## 5. Output cho mỗi target

| Output                | Quy tắc                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Structured Vietnamese | canonical text, classifier/word type, phrase/context, accepted variants và compatible activities |
| Audio                 | `vi-VN` TTS candidate cho target/câu/segment; parent nghe trước khi approve                      |
| Semantic image        | một chủ thể/ngữ cảnh rõ, không chữ sinh trong ảnh, pass provider + server safety gate            |
| Motion recipe         | ID + parameter từ allowlist Reanimated/SVG/Lottie; không arbitrary JavaScript/Lottie từ model    |
| Mouth video           | không AI-generate mặc định; optional parent capture/import qua family-media pipeline             |
| Fallback/readiness    | audio + static image luôn có; activity cần video chỉ ready khi family video đạt validation       |

Với vuốt đuôi, server tạo full text, `cloze_lead`, `cloze_completion`, pause marker và audio segment riêng. Parent phải nghe cả câu và segment; runtime không cắt waveform.

## 6. Preview and editing

Preview list hiển thị trạng thái từng target: `draft`, `generating`, `needs_review`, `approved`, `rejected`, `failed`. Parent có thể:

- sửa text trước khi regenerate asset phụ thuộc;
- nghe target/câu/segment riêng;
- xem static/reduce-motion và animated preview;
- chọn regenerate chỉ audio/image hoặc đổi motion template;
- quay/import video riêng;
- bỏ target lỗi mà không làm hỏng phần còn lại;
- approve toàn bộ target hợp lệ rồi publish.

Parent approval không biến asset thành default content. Report content unsafe/incorrect phải có entry point; repeated provider failure không được lặp vô hạn tiêu credit.

## 7. Fee and credit behavior

Owner C50-D03 chọn mỗi bộ AI khoảng năm từ theo gợi ý phụ huynh; trial không tạo bộ theo `PRD-SUB-006`. Số từ trong bộ không phải số lượt generation được cấp. Theo `PRD-CUSTOM-005`, `PRD-SUB-005`: included allowance, số lần retry, fee vượt hạn mức/SKU và retention cần đóng `PRD-TBD-08`/C50-D03. Không tự chốt mua credit riêng. Ledger reserve → capture khi đạt deliverable đã công bố; fail/cancel release idempotent; retry hệ thống không thu thêm. Nếu chọn store add-on, verify/reconcile Apple/Google và test refund/duplicate; nếu không có add-on, không provision SKU. Không dùng local balance cấp quyền. Chi phí text/image/audio/storage/job phải có cap trước production.

## 8. Privacy and safety

- Không gửi child profile, progress, diagnosis/note, family photo/audio/video hoặc legal name sang provider mặc định.
- Tên người thân trong target được thay placeholder semantic khi có thể; app cảnh báo parent tránh dữ liệu nhận dạng.
- Provider request dùng project/service credential phía server, logging tối thiểu và data-retention/training control phù hợp production terms.
- Output text qua JSON schema + Vietnamese rules; image qua provider safety filter, file validation và child-safe policy.
- Prompt/output log mặc định lưu hash, model/config, status và redacted reason; raw prompt/output retention ngắn, access-limited và phải được nêu trong privacy inventory.
- Không dùng custom content để train, benchmark công khai hoặc đưa vào default corpus nếu chưa có consent riêng.
- Flag severe/ambiguous output sang manual support review; không hiển thị unsafe asset chỉ để parent tự quyết.

## 9. Subscription expiry and deletion

- Expiry khóa tạo job mới và learning access tới private premium pack.
- Draft, approved custom metadata, purchase/credit ledger và family media không bị xóa chỉ vì expiry.
- Parent vẫn xem inventory, export/delete theo chính sách; preview asset sau expiry chỉ ở mức cần cho data management, không biến thành learning mode miễn phí.
- Delete collection tạo tombstone, revoke pack generation, purge device on next sync và schedule object cleanup theo retention.
- Resubscribe có thể cấp lại key cho valid pack mà không regenerate/download lại hash còn cache.

## 10. Analytics và support

Được đo: job state duration, provider failure category, estimated/actual provider cost, generated/approved/rejected count, credit reserve/capture/release và pack download outcome. Không gửi raw target, prompt, transcript, image hoặc family binding vào product analytics.

Support view chỉ thấy job ID, redacted error, billing state, model/config version và asset technical status. Xem raw private content cần break-glass permission, reason, audit và policy riêng.

## 11. Acceptance

- Parent tạo draft → quote → allowance reserve (purchase chỉ nếu add-on được duyệt) → background generation → preview → approve → download → học từ local thành công.
- Kill/reopen/switch account ở mọi state không mất job, double-charge hoặc lộ preview.
- Provider timeout/429/5xx retry có bound; fail/cancel release credit đúng một lần.
- Text/audio/image/motion không đạt gate không vào private pack; edit tạo immutable version mới.
- Family media không xuất hiện trong provider request/log; provider key không có trong mobile.
- Expiry khóa session nhưng giữ data/export/delete; resubscribe không regenerate asset hợp lệ.
- Cost cap, per-account quota, abuse limit và operational dashboard hoạt động trước public release.

## Manual path và release gates C50

Manual: parent nhập target/câu, gắn media qua stage/validate/preview, chọn compatible activity → approve → private pack. Không provider call. Không tự thêm vào plan; chỉ hoạt động đạt readiness mới học được. C50 P7–P9 sở hữu delivery, D03 sở hữu quota/provider/commercial decisions; mọi trường hợp expiry vẫn về basic nhưng private premium learning khóa, dữ liệu xem/export/delete được.

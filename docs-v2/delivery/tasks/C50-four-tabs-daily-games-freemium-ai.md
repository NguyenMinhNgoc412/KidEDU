# C50 — Bốn tab, trò chơi mỗi ngày, bộ sưu tập và bộ học AI

Status: In progress — durable game/reward flow đã nối backend/SQLite trên corpus local synthetic; production content/activation, free learning và manual private-library acceptance chưa hoàn tất.
Date: 2026-11-05. Owner: Product + Mobile + Backend + Content + QA.
Implements: `PB-PLAY-01`, `PB-BIZ-01..05`, `PRD-NAV-001`, `PRD-GAME-001..004`, `PRD-REWARD-001..003`, `PRD-SUB-006`, `PRD-CUSTOM-001..008`, `PRD-PROG-005`, `TA-ADR-001`, `TA-ADR-005..006`, `TA-ADR-014`, `TA-ADR-025..026`.
Dependencies: C29–C49 như implementation baseline; production activation/encrypted packs, auth, sync và release gates còn mở phải hoàn tất trước production.

## 1. Authority và phạm vi

Owner đã yêu cầu một task tổng gồm các phase. Mỗi phase là một implementation slice riêng, không gom schema, backend, toàn bộ UI và AI trong một thay đổi. Chỉ phạm vi ghi trong task này đã được duyệt; ba SOT vẫn `In review` cho các phần/TBD khác. Turn tạo task ban đầu chỉ cập nhật documentation. Owner sau đó yêu cầu bắt đầu implementation; các decision gate dưới đây vẫn áp dụng và chưa có authorization provision provider/queue.

Requirement owner là [PRD](../../02-product-requirements-sot.md); quyết định kỹ thuật tại [ADR-0010](../../decisions/ADR-0010-freemium-daily-games-and-custom-library.md). C50 supersedes hành vi liên quan trong C36–C49: ba tab, game có review, thưởng giữa từng trò, một hộp duy nhất, catalog nhỏ, ưu tiên tranh đang dở, chủ đề không cố định giới tính. Giữ evidence lịch sử, không coi code C49 là acceptance mới.

## 2. Kết quả cần đạt

Owner amendment 2026-11-06: **hoãn AI, tiếp tục toàn bộ phần ngoài AI**, ưu tiên UI hợp lý, ít nhiễu. P8/P9 và AI-specific P10 evidence được deferred; D03 không chặn phần ngoài AI. P7 manual, free/basic activation, production content và non-AI P10 vẫn trong scope.

- Bốn tab: Tập nói, Trò chơi, Bộ sưu tập, Phụ huynh. Goal/progression, parent-guided transfer và family media vẫn được giữ trong luồng Tập nói/Phụ huynh.
- Tập nói không giới hạn số phiên/ngày trong content scope được cấp; chỉ phần này có nhận xét phụ huynh.
- Một phiên game/ngày/child gồm bóng khuyết → nghe rồi chọn → lật thẻ. Dở thì tiếp tục cùng phiên; 00:00 hằng ngày hết hiệu lực phiên cũ dù chưa xong, không cộng dồn.
- Free lâu dài: bóng khuyết 2 màn × khoảng 3 hình; nghe chọn 5 từ × 3 đáp án; lật thẻ 5 cặp. Paid: tương ứng 5 màn × khoảng 3 hình, 12 từ × 3 đáp án, 5 cặp.
- Hết lượt vẫn vào tab game, nút Vào chơi disabled/mờ, thông báo đã hết lượt và thời điểm mở lượt mới. Không chặn tab khác. Dở hiện Tiếp tục.
- Đúng có celebration nhẹ; nghe chọn sai phát lại tên vật cần tìm; không phạt hoặc tự tạo observation. Lật thẻ dự kiến ghép cặp hình giống nhau, có QA độ khó.
- Hoàn tất đủ ba trò mới được chọn Mảnh ghép/Sticker, chọn một trong bốn hộp và nhận một món chưa có. Một phiên chỉ một quà; không thưởng từng round/trò hoặc thêm quà cuối bài.
- Hai nhóm giới tính cố định theo hồ sơ: mỗi nhóm 15–20 tranh / 3–4 chủ đề / 5–6 mảnh mỗi tranh (tổng 30–40 tranh, 150–240 mảnh). Sticker 3–4 chủ đề áp dụng mỗi nhóm, 15–20 hình/bộ; chủ đề chung có thể reuse asset.
- Bé trai: siêu nhân, máy bay/tên lửa/vũ trụ; bé gái: công chúa, phòng bếp, bác sĩ; sticker có đồ vật trong nhà, động vật và siêu nhân/công chúa tương ứng. Nhân vật có quyền sử dụng; random khắp pool phù hợp chưa có, không ưu tiên hoàn tất chủ đề/tranh.
- Free chỉ học catalog cơ bản và không tự thêm bộ. Paid mở full và tạo thủ công/AI trong Parent Zone. AI là v1, preview/approve bắt buộc; học từ private pack local, không AI trong activity loop.

## 3. Các quyết định cần đóng trước phase phụ thuộc

| ID      | Quyết định / đề xuất                                                                                                                                                                                                                                                                             | Owner / gate                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| C50-D01 | Approved: reset 00:00 theo `Asia/Ho_Chi_Minh`, thay mốc 08:00 ban đầu; server time là authority.                                                                                                                                                                                                 | Owner 2026-11-05                                   |
| C50-D02 | Approved: free gồm năm bộ hiện có `deck-family`, `deck-needs`, `deck-objects`, `deck-animals`, `deck-actions`; trial không tạo bộ thủ công/AI. Target mapping giữ snapshot hiện tại, không tự cấp nội dung mới.                                                                                  | Owner 2026-11-05                                   |
| C50-D03 | Partially decided: khoảng năm từ; owner 2026-11-06 chọn Gemini AI Studio free cho test nội bộ synthetic, GPT-5.6 Luna cho phát hành sau quality/privacy review. Đề xuất 20 drafts/tháng paid, $5 API/tháng, một retry và không SKU lẻ chưa ghi approved; retention/dispatcher vẫn mở.            | Product + Tech, trước P8/P9 production             |
| C50-D04 | Approved: đến reset chưa nhận quà thì hủy, kể cả local completion chưa sync. Server-confirmed receipt giữ nguyên; retry không phát lại quà và không tin client timestamp.                                                                                                                        | Owner 2026-11-05                                   |
| C50-D05 | Approved new profile: nhập giới tính cùng tên con, không suy từ tên. Hồ sơ cũ null không tự backfill; cần parent nhập trước quà mới, inventory cũ giữ nguyên. Chính sách sửa giới tính đã nhập còn cần quyết định trước mutation tương ứng.                                                      | Owner 2026-11-05; correction policy còn mở         |
| C50-D06 | Approved: thiết bị đồng bộ và tiếp tục cùng phiên, không thêm lượt; reset game lúc 00:00. Implementation giữ quota/content của phiên, entitlement vẫn kiểm boundary; không kéo expiry store tới midnight. Đồng bộ optimistic revision chống ghi đè checkpoint mới; reset không mở round cũ tiếp. | Owner 2026-11-05 + existing entitlement invariants |
| C50-D07 | Approved: chỉ nhận món mới, khóa loại hết và hiển thị số quà còn lại. Giữ bốn hộp, pool nhỏ có thể lặp candidate nhưng claim một món; hết cả hai vẫn chơi. Bổ sung catalog sau bằng immutable release, không tự tạo quà đã duyệt.                                                                | Owner 2026-11-05                                   |

Các gate này không cản documentation, schema proposal, artwork brief và phần độc lập; không được tự đánh dấu Approved hoặc release khi còn mở.

## 4. Phases thực hiện

### P0 — Đồng bộ nguồn yêu cầu và thiết kế

- Dependency: owner decisions trong hội thoại; không phụ thuộc runtime.
- Scope: cập nhật SOT, ADR, spec, IA, cost/release gates và AGENTS; inventory route/component hiện tại; mở screenshot thật trước UI phase.
- Acceptance: traceability đầy đủ, hành vi cũ được ghi superseded, không mất activity/transfer/family media.
- Tests: Prettier, relative links, requirement IDs và contradiction scan.
- Migration/rollback: docs only; đảo riêng thay đổi C50, giữ phần sửa trước đó của owner.
- Out of scope: triển khai runtime, tự phê duyệt các TBD.

### P1 — Contracts, catalog và migration dữ liệu

- Dependency: P0; D01/D02/D05 cho field phụ thuộc.
- Scope: versioned DTO/schema cho access tier, session kind, ngày chơi, reward catalog/item/receipt, profile reward group, custom collections; OpenAPI/generated client riêng Prisma.
- Acceptance: legacy sticker/mảnh/observation đọc được, ID không đổi hoặc có mapping rõ; catalog không còn regex giới hạn 18 sticker/8 mảnh; unknown version bị chặn an toàn.
- Tests: schema/contract parity, migration có dữ liệu C49, rollback-reader compatibility, account/child isolation.
- Migration/rollback: expand → backfill có kiểm kê → dual-read → cutover; backup và dry run; không xóa receipt/observation cũ. Down migration không drop dữ liệu đã phát sinh.
- Out of scope: toàn bộ UI, provider hoặc claim runtime đã hoàn thành.

### P2 — Quyền free/paid và lượt chơi server-authoritative

- Dependency: P1; D01/D04/D06.
- Scope: basic/full activation scopes; unique ngày chơi theo child; atomic start/resume/complete/claim commands; stable idempotency keys; server-issued reservation gắn child/day/session/device policy và resetAt.
- Acceptance: hai thiết bị không tạo hai phiên/lượt thưởng; chỉnh giờ, reinstall, logout/login không reset; 00:00 hết phiên cũ; mất mạng giữa prepared game không gọi API trong loop, không tự cấp lượt mới.
- Tests: PostgreSQL race/unique constraints, BOLA, replay, 23:59:59/00:00, network retry, expiry/refund, restore và cross-device conflict.
- Migration/rollback: additive tables/indexes, feature flag; rollback khóa start mới nếu chưa enforce được quota, giữ free learning/data access và receipt.
- Out of scope: engine game, AI, tăng số hồ sơ trong gói để tạo thêm lượt.

### P3 — Runtime ba trò theo gói

- Dependency: P1/P2; content authored readiness.
- Scope: ba renderer, sequence và checkpoint; nghe chọn dùng chạm thay kéo hình vào mẫu; bóng khuyết kéo thả với assistive alternative; pause/lifecycle/audio priority.
- Acceptance: đúng số màn/từ/cặp của từng tier; không thưởng giữa trò, không review game; completion không phải mastery; resume giữ hình/đáp án đã làm.
- Tests: unit state machine, RNTL interactions, audio đúng/sai/replay, reduce motion, process kill, boundary reset và entitlement.
- Migration/rollback: version session runtime; giữ reader checkpoint cũ, không diễn giải phiên C49 thành phiên mới đã hoàn thành.
- Out of scope: thay progression Tập nói hoặc tự chấm phát âm.

### P4 — Một quà/ngày và bốn hộp

- Dependency: P2/P3; D04/D07.
- Scope: completed → choose kind → four boxes → choose one → reveal → inventory; lựa chọn/candidates bất biến, server reconciliation, local transaction + outbox.
- Acceptance: chỉ claim sau đủ ba trò; mỗi ngày/session một receipt; món chưa có thuộc group; random xuyên chủ đề; không reroll khi back/kill hoặc trùng khi sync hai thiết bị.
- Tests: crash từng transition, duplicate claim, đồng thời hai device, stale inventory, hết pool, còn 1–3 món, ranh giới reset và không có observation event.
- Migration/rollback: không re-award receipt cũ; lưu reward catalog version và pending state, flag tắt reveal mới nhưng không mất quyền/receipt đã xác nhận.
- Out of scope: paid box, rarity, đổi quà, quảng cáo lấy lượt hoặc streak gây áp lực.

### P5 — Bộ sưu tập và production asset

- Dependency: P1; D05/D07; P4 để end-to-end.
- Scope: album hai loại, gender-fixed catalog mapping, master tranh/masks/ảnh preview/sticker, provenance/license/review, asset version/hash và progressive loading.
- Acceptance: đủ corpus quy mô mục 2; mảnh đã có hiện đúng vị trí, tranh đủ hiện hoàn chỉnh; quà cũ vẫn xem được kể cả khác group mới; expiry không xóa/khóa inventory.
- Tests: catalog cardinality/uniqueness/mask coverage, readiness, visual/accessibility, human art QA, missing asset/low storage.
- Migration/rollback: immutable catalog releases; giữ asset/version có receipt tham chiếu; revert release manifest không xóa inventory.
- Out of scope: mini-game ghép lại tranh, chapter progression hoặc asset AI auto-publish.

### P6 — Bốn tab và nhận xét Tập nói

- Dependency: P2/P3/P5; D02.
- Scope: Tập nói theo chủ đề nhưng giữ goal/lesson progression; chuyển parent-guided learning vào đúng nơi; Bộ sưu tập top-level; Phụ huynh qua gate; games hub có exhausted/resumable/loading/error states.
- Acceptance: hết lượt vẫn vào tab; CTA disabled + text và accessible state, không chỉ đổi màu; tab khác bình thường; Tập nói không cap ngày; chỉ speech session có nhận xét cuối phiên; history cũ không mất.
- Tests: route/deep link/gate, RNTL, screenshot phone nhỏ/tablet/large text; E2E free/full, speech→review và game→gift không review.
- Migration/rollback: route aliases cho deep link cũ, session kind phân biệt; feature flags không mở premium/free sai quyền.
- Out of scope: thay Gentle Growth hoặc bỏ các activity v1 đang bắt buộc.

### P7 — Tạo bộ thủ công cho paid

- Dependency: P1/P2/P6; existing family media/pack pipeline.
- Scope: Parent create/edit/preview/approve collection; target/activity mapping, media staging và signed/encrypted private pack.
- Acceptance: free bị chặn ở server/service/loader, không chỉ UI; paid tạo/học được; chưa đủ readiness không publish; dữ liệu vẫn export/delete sau expiry.
- Tests: ownership, validation/rollback media, version pinning, create→publish→prepare→speech, expiry/account switch.
- Migration/rollback: draft/collection versions additive, tombstones, giữ export reader; tắt tạo mới không xóa bộ đã tạo.
- Out of scope: AI generation hoặc chia sẻ công khai.

### P8 — AI backend, quota và vận hành

- Dependency: P7; D03; dispatcher/provider ADR/POC trước provision.
- Scope: typed draft/quote, job/quota reservation ledger, provider adapters, bounded retry, validation/safety, cost cap/kill switch và cleanup; reuse approved assets trước generate.
- Acceptance: server-only credentials; không gửi child PII/family media; không double-charge/retry vô hạn; AI không tự publish; job bền vững khi app đóng; model/provider còn candidate đến quality/cost/privacy review.
- Tests: duplicate dispatch, timeout/429/partial fail, quota concurrency, prompt injection, unsafe asset, deletion, cost cap; sandbox store tests chỉ nếu add-on SKU được duyệt.
- Migration/rollback: expand job/ledger schema; disable submissions, drain/cancel/refund reservation theo policy; giữ approved packs và ledger/audit.
- Out of scope: mặc định Cloud Tasks/provider cụ thể đã được duyệt, mua credit bắt buộc, AI mouth video hoặc speech scoring.

### P9 — AI Parent UX và private pack

- Dependency: P8/P7; D03 disclosures.
- Scope: chọn manual/AI, input, quote/allowance, progress/retry, preview sửa từng target/asset, approve, pack readiness, resume job qua foreground polling/delta.
- Acceptance: parent nghe/xem trước duyệt; edit invalidates asset phụ thuộc; không đưa private content vào default corpus; học local sau Ready; free không vào create qua deep link.
- Tests: E2E job→kill→reopen→review→approve→download→learn; provider failure/cancel, export/delete, privacy log scan, screen reader.
- Migration/rollback: compatibility guards và feature flag, không reset job/ledger khi hạ app; existing packs giữ version.
- Out of scope: push notification, AI trong gameplay hoặc tự mở thêm lượt game.

### P10 — Release verification và cutover

- Dependency: P1–P9; tất cả C50-D đóng; khắc phục hạ tầng test C49 trước integration.
- Scope: run full acceptance trên signed/encrypted production-like packs, real PostgreSQL và Android/iOS; cost/privacy/store declarations; rollout/rollback rehearsals.
- Acceptance: evidence cho tất cả PRD mới; không đánh đồng fixture/unit/browser với native/production pass; mọi lỗi blocker đóng.
- Tests: free/paid/trial transitions, reset/double-device/claim races, lifecycle/low storage, backup/restore, AI cost/security và content human QA.
- Migration/rollback: staged flags, server/client compatibility window, backup verified; rollback giữ account data/inventory/ledger, không bật client cũ có thể ghi đè field mới.
- Out of scope: tuyên bố release-ready khi còn TBD, fixture content hoặc thiếu native/store evidence.

## 5. Tracking

- [ ] P0: docs thống nhất và owner đóng decision cần thiết trước phase phụ thuộc.
- [ ] P1–P2: contracts/migration/access/day authority.
- [ ] P3–P6: game/reward/catalog/navigation/review.
- [ ] P7–P9: manual/AI custom library.
- [ ] P10: release evidence và rollback rehearsal.

Mỗi phase báo file/behavior/tests thực chạy/risk/migration/rollback/docs impact; cập nhật checkbox chỉ khi acceptance có evidence. Thay đổi documentation C50 không đánh dấu các phase runtime hoàn tất.

## 6. Documentation evidence — 2026-11-05

Đã tạo task tổng/ADR và cập nhật ba SOT, product/design/architecture/contracts/delivery, README/CHANGELOG và AGENTS. Phạm vi kiểm tra: 41 file tài liệu, 145 relative links; kiểm definition requirement mới và đủ P0–P10. Prettier check và link/reference scan đạt. Rà mâu thuẫn đã chuyển free/basic, AI v1 và no-game-review về requirement mới; mô tả C36–C49/ADR-0009 được giữ rõ là lịch sử superseded.

Không chạy mobile/backend/native tests vì không sửa runtime. Không SQL migration, provider/queue provisioning hoặc media publication. Rollback documentation chỉ đảo phần C50, không ghi đè các sửa đổi đang có của owner; implementation migration/rollback nằm ở từng phase. C50-D01..D07 còn mở trước phase phụ thuộc; chưa tuyên bố release-ready.

## 7. P1 slice đầu — reward content contract, 2026-11-05

Implements: `PRD-REWARD-002..003`, `PRD-CONT-005..006`, `TA-ADR-014`.
Dependency: approved catalog requirements; không phụ thuộc D01/D02/D04..D07. Tại thời điểm slice đầu, owner chọn tự chỉ định decision; quyết định mới nhất được cập nhật ở mục 3.

- Thêm `src/content/contracts/rewardCatalog.ts`: schema v1 riêng cho catalog, theme, tranh, mảnh và sticker; ID không encode membership vào regex catalog C49. Kiểm 30–40 tranh, 15–20 tranh/group, 3–4 theme/group, 5–6 mảnh/tranh và 15–20 sticker/theme/group. Kiểm unique ID, ordered piece position, orphan và group consistency.
- Asset descriptor yêu cầu hash/version, provenance/rights/review/format references và accessible label. Đây chỉ là metadata validation: publisher còn phải resolve các reference tới record đã duyệt, verify bytes/signature và kiểm mask coverage/human art QA. JSON Schema biểu diễn structural checks; cross-reference/cardinality refinement phải chạy bằng Zod validator.
- Giữ reader/receipt C49 nguyên vẹn, chưa nối catalog mới vào checkpoint API, claim, UI hoặc activation. Chưa tạo production artwork, không tự đánh dấu reference giả trong test thành approval.
- Acceptance slice: unknown version/field bị từ chối, catalog đủ kích thước đọc được, corruption bị chặn và toàn bộ 26 ID receipt C49 còn đọc được.
- Verification: mobile typecheck đạt; Jest hai suites reward contract/legacy reward đạt 15 tests; ESLint hai file code, Prettier bốn file thay đổi và `git diff --check` phạm vi docs đạt. Chưa chạy native, real PostgreSQL, migration hoặc store sandbox cho slice này.
- Migration/rollback: không đổi SQLite/Prisma/persisted documents; không backfill và không re-award. Rollback bỏ module chưa được tích hợp và tests tương ứng; giữ nguyên history/inventory.
- Out of scope: API/generated client, grant/claim authority, gender profile migration, catalog publication và P1 acceptance đầy đủ. Không tick hoàn tất P1–P2.

Đối chiếu child-safety release gate với nguồn chính thức ngày 2026-11-05: [Apple Kids](https://developer.apple.com/kids/), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play Families](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en). Parent Gate và consent dữ liệu là hai việc khác nhau; cần kiểm SDK/data declarations và age-appropriate content. Việc tham chiếu policy không thay native QA hoặc store review.

## 8. Owner amendment và server policy foundation — 2026-11-05

Implements: `PRD-GAME-001..002`, `PRD-REWARD-001`, `PRD-SUB-006`, `TA-ADR-025`.
Dependency: quyết định mục 3 và normalized entitlement policy hiện có. Đây là slice chuẩn bị cho P2, không thay acceptance P1/P2.

- Reset 00:00 theo `Asia/Ho_Chi_Minh`, thay 08:00. Ngày chơi dùng khoảng nửa mở; claim mới tại đúng reset bị từ chối, retry receipt đã xác nhận giữ kết quả cũ.
- Xác định năm bộ trong `src/data/seedData.ts`: Gia đình (4 target), Nhu cầu cơ bản (7), Đồ vật quen thuộc (6), Con vật (5), Hành động (7). Đây là mapping phạm vi 29 target hiện có, không xác nhận tất cả asset production đã Ready.
- `apps/api/src/daily-games/daily-game.policy.ts` tính cửa sổ ngày từ server time, basic/full game length, trial không authoring, remaining pool theo group đã nhập và inventory, bốn candidate không ưu tiên tranh đang dở. Hết pool trả rỗng, không cấp món trùng; missing group yêu cầu profile thay vì đoán từ tên.
- Helper chưa nối controller/database/activation/UI. Auth/ownership, published catalog verification, CSPRNG và transaction persist candidates/claim phải được service tích hợp; helper không chứng minh cross-device quota hoặc cấp signed grant. AI generation giữ disabled đến D03/production gates.
- Verification: API typecheck và ESLint hai file mới đạt; Jest daily-game-policy + entitlement-policy đạt 2 suites / 25 tests. Bao gồm trước/đúng midnight Việt Nam, cuối năm/năm nhuận, expiry không kéo tới midnight, trial denial, hết pool và pool 1–3 món. Không có real PostgreSQL race, native/store hoặc migration evidence trong slice này.
- Migration/rollback: không sửa database/persisted document hoặc public API, không backfill/reset inventory. Có thể bỏ module chưa tích hợp; khi cutover phải giữ reader/receipt C49 như P1.
- SOT impact: PB/PRD/TA, ADR-0010, subscription/custom spec, test/release/owner checklist, README/CHANGELOG và AGENTS đồng bộ quyết định mới. Không tự đóng quota/pricing/provider AI hoặc policy sửa giới tính đã nhập.
- Out of scope/remaining: P1 versioned API/generated client/profile migration; P2 transaction-backed day/session/claim và sync; P3–P9 runtime/UI/content/custom pipeline; P10 production evidence. Chưa tick hoàn tất bất kỳ nhóm phase runtime nào.

## 9. P1 profile slice — explicit gender, 2026-11-05

Implements: `PRD-ACC-003..005`, `PRD-REWARD-002`, `TA-ADR-014/016`.
Dependencies: owner D05 initial entry; D05 correction policy chưa đóng nên không cho đổi giá trị đã nhập.

- Migration `20261105000000_child_gender`: nullable enum boy/girl, không default hoặc backfill từ tên. Family API select/create/patch field qua ownership/consent/optimistic version hiện có. PATCH chỉ bổ sung thiếu hoặc giữ nguyên; đổi/clear bị chặn. Hai thiết bị khai báo đồng thời chỉ một write thắng.
- OpenAPI/generated client cập nhật; field response optional/nullable để đọc server cũ. POST v1 vẫn chấp nhận thiếu cho compatibility; client mới yêu cầu lựa chọn rõ. Hồ sơ legacy null chưa đủ điều kiện reward group, không bị suy diễn hoặc mất history.
- Form hiện có tại `app/parent/local-api.tsx` là development-only, đã thêm chọn giới tính bên tên, disabled submit khi chưa chọn, bổ sung field cho hồ sơ cũ. Reuse `AppText`/`KidButton`, target 56, accessible selected/disabled và dấu chọn nhìn thấy, không chỉ màu. Đây chưa phải production onboarding hoàn chỉnh.
- `useLocalBackend` bỏ phản hồi muộn sau đổi account/API URL/child; không trả profile/gender cũ lên UI. Regression test account switch có promise trả muộn.
- Native component tests tách `jest.native.config.js`/`pnpm test:native` dùng Expo iOS preset vì node preset ánh xạ text thành DOM. `pnpm check` bao gồm suite mới; không dùng mock DOM để tuyên bố native layout đạt.
- Evidence: Prisma generate/OpenAPI generate đạt; migration deploy toàn bộ sáu migrations trên database local riêng `kidedu_c50_test` đạt. PostgreSQL identity/consent 2 suites/4 tests và gender ownership/concurrent update/legacy-reader 1 suite/1 test đạt. Mobile Jest 73 suites/343 tests, native component 1 suite/2 tests, API Jest 12 suites/67 tests đạt. Mobile/API typecheck và lint các file sửa đạt.
- Đã mở screenshot baseline parent 390 trước UI. Lệnh mở Expo với env test bị automatic approval review từ chối (`blocked by policy`); chưa có browser screenshot mới. Chưa kiểm VoiceOver/TalkBack, native device/process kill/store hoặc production onboarding; không ghi các gate đó pass.
- Migration/rollback: chỉ chạy database test riêng, chưa migrate database dùng chung/production. Deploy migration trước server mới. Rollback app/server giữ column/type và parent-entered data, không drop/down migration. Không sửa/delete inventory hoặc observation; database test chỉ dùng synthetic data, không đọc research PII.
- Scope còn lại: profile slice không hoàn tất toàn P1/P2; daily-game DTO/session/claim/migration, game UI và custom library vẫn còn. SOT behavior không đổi ngoài quyết định mục 3; contracts/data spec, README/CHANGELOG cập nhật evidence.

## 10. P1 prepared daily-game content — 2026-11-05

Implements: `PRD-GAME-002..003`, `PRD-PROG-005`, `TA-ADR-014`.
Dependency: approved sequence/length; contract này không phụ thuộc provider AI hoặc reward publication.

- `src/content/contracts/dailyGame.ts` tách `daily_game` schema v1 khỏi speech/legacy checkpoint. Plan pin content version và tier: 2/5 màn bóng khuyết (ba hình/màn trong authored baseline này), 5/12 lượt nghe với ba đáp án và target riêng từng lượt, năm cặp memory. Kiểm unique round ID và đáp án thuộc option authored.
- Checkpoint không chứa observation, URL/media hoặc quyền truy cập. Restore validator đối chiếu content version, thứ tự bóng khuyết → nghe chọn → memory, bounds theo tier, placed/matched/open ID và chặn mở lại card đã ghép. Không tạo observation hoặc tự cấp completion/reward.
- Zod chịu trách nhiệm semantic/reference validation ngoài structural JSON Schema. Service/loader phải thêm signature/readiness/entitlement và đối chiếu monotonic checkpoint trước sync; không dùng parse thành bằng chứng session đã được server reserve.
- Tests: sáu tests mới đạt cho length/tier, unknown version/field, answer/reference corruption, cross-version restore và thứ tự game. Bộ 343 mobile tests ở mục 9 chạy trước slice này; không gộp thành một lần full-run mới. API build ở cuối profile slice đạt.
- Migration/rollback: module chưa nối persistence/API/UI; không đổi checkpoint C49, không backfill hoặc thưởng lại. Bỏ reader mới chưa dùng được khi rollback, giữ legacy reader. Acceptance P1 đầy đủ và P2 transaction-backed authority vẫn chưa hoàn tất.

## 11. P2 daily-session persistence boundary — 2026-11-05

Implements: `PRD-GAME-001..003`, `TA-ADR-014/025`. Dependencies: approved day/reset/tier policy và prepared content contract ở mục 10.

- Additive migration `20261105010000_daily_game_session`: unique child/day, server window, immutable tier/plan snapshot, checkpoint/revision/completed timestamp. Không backfill C49 hoặc tạo reward receipt.
- `DailyGameRepository` kiểm ownership/soft deletion, khóa child row, rồi mới đọc server clock. Start/resume đồng thời trả cùng row; completed session vẫn chiếm lượt ngày đó. Gói thay đổi chỉ được dùng khi tạo phiên ngày tiếp theo; saved session không phải content/decryption grant.
- Checkpoint kiểm plan/reference/sequence rồi CAS revision; completed IDs/index không được lùi. Hoàn tất ba trò chỉ ghi completion, không tạo observation/reward. Reset dùng half-open window và trả expired tại đúng 00:00. Conflict yêu cầu reload row hiện tại, không tự merge đè dữ liệu.
- API build root độc lập nên server có bản validator riêng đồng nhất content contract; parity test so sánh source để chặn drift, không share Prisma model với mobile.
- Verification: migration deploy database riêng `kidedu_c50_test` đạt. PostgreSQL regression kiểm tám concurrent starts, concurrent checkpoint, BOLA, rollback tiến độ, completion không mở lượt, đúng midnight và tier pin. API typecheck và contract/policy suites đạt 16 tests. Không coi đây là end-to-end sync trên thiết bị.
- Migration/rollback: giữ bảng/unique constraint/checkpoint khi rollback, không reset lượt và không drop data. Chưa chạy migration database dùng chung/production.
- Out of scope tại thời điểm slice này (HTTP/reward được bổ sung ở mục 13, SQLite ở mục 15): repository chưa register/expose HTTP; cần published catalog resolver, entitlement/key checks ở activity boundary, OpenAPI/generated client, mobile outbox/reconcile và reward reservation/claim. Không nhận client-authored plan hoặc mở production route chỉ để né readiness gate. P2 chưa hoàn tất.

## 12. P3 local daily-game engine — 2026-11-06

Implements: `PRD-GAME-002..003`, `PRD-PROG-005`. Dependencies: prepared plan/checkpoint v1 ở mục 10; engine độc lập network/provider.

- `src/features/dailyGames/sessionEngine.ts` xử lý bóng khuyết → nghe chọn → memory theo plan pin. Đặt/chọn sai giữ tiến độ; ba hình hoàn tất mới chuyển màn; memory chỉ mở hai thẻ và giữ cặp sai đến action đóng. Ghép đủ năm cặp mới completed. Không phát sinh observation, purchase hoặc reward claim.
- Action bóng khuyết/nghe mang round ID để thao tác đến muộn không tính sang màn tiếp. Action đóng cặp sai mang card IDs để callback cũ không đóng cặp mới. Duplicate/unknown/wrong-phase inputs không thay checkpoint; restore kiểm content version và semantic references.
- Verification: hai suites engine/content đạt 10 tests; chạy toàn bộ basic/full và serialize/restore sau mỗi action, wrong answer, duplicate card, delayed input/close, unknown input và cross-version restore. Mobile/API typecheck, API build và scoped lint đạt. Đây là unit domain coverage, không thay RNTL/device/audio QA.
- Migration/rollback: không schema/persisted migration mới; coordinator phải commit checkpoint trước khi trình bày round mới, kiểm entitlement/reset ở boundary và dùng server session đã reserve. Engine chưa nối UI/SQLite/outbox nên rollback bỏ module không đổi dữ liệu cũ.
- Remaining: renderer, media/audio, accessibility/sensory/reduce-motion, local durable persistence, API reconcile và native lifecycle. P3 chưa hoàn tất; không có assertion Store Release đã đạt.

## 13. P2/P4 reward transactions và guarded HTTP — 2026-11-06

Implements: `PRD-GAME-001..003`, `PRD-REWARD-001..003`, `TA-ADR-014/025`.
Dependency: session persistence ở mục 11; published catalog resolver là gate cutover, chưa dùng synthetic corpus làm production.

- Migration `20261106000000_daily_game_rewards`: reservation/session, bốn candidate pin, inventory unique child/item và receipt unique session. Cùng child lock serialize reserve/claim; dùng CSPRNG; không lộ candidate qua DTO. Pool một món vẫn bốn hộp; chọn loại rồi không reroll. Claim đầu tiên thắng và mọi retry trả receipt đó, kể cả khác box/device/sau reset. Unclaimed đúng reset trả expired. Inventory không cần paid entitlement.
- API `/v1/children/{childId}/daily-game`: status/start/checkpoint/reward reserve/claim, AuthGuard và ownership. OpenAPI/generated mobile client tương ứng. Production content gateway hiện unavailable nên start trả 503 không tiêu lượt; không mở fixture bypass. Saved full plan kiểm entitlement trước khi trả; checkpoint ACK không chứa premium plan. Đây chưa phải activation/decryption/key pipeline.
- Checkpoint retry cùng session/base revision/payload đã commit trả ACK hiện tại; payload khác từ revision cũ trả conflict, không merge đè. Receipt là idempotency identity theo session. Các thiết bị phải reconcile cùng state, không tự tạo lượt mới.
- Evidence: migration chỉ deploy `kidedu_c50_test`; hai PostgreSQL suites session/reward đạt 4 tests gồm race/BOLA/reset/exhausted/stale inventory. HTTP contract hai suites đạt 2 tests (service mocked, không thay DB tests); service tests kiểm unavailable/client-authored-plan/expired-full. Không native/store QA.
- Rollback: giữ bảng/unique constraints/receipt/inventory; tắt start/reserve mới, không drop data hoặc mở lại lượt. Chưa migrate database dùng chung/production; legacy C49 inventory import/dual-read và published catalog readiness còn là cutover gates.
- Inventory API `GET .../daily-game/inventory` đọc được quà đã có ngay cả khi catalog chưa sẵn sàng; `remaining=null` nghĩa là chưa xác định pool, không phải hết quà. Không có paid entitlement guard trên dữ liệu đã sở hữu. Cursor/pagination và legacy import còn thiếu.
- Remaining: mobile coordinator/reconcile, content resolver và signed/encrypted activation, UI/renderers/reveal/album, legacy reconciliation và production release evidence. Không đánh dấu P2/P4 hoàn tất.

## 14. D03 test-only provider experiment — 2026-11-06

Owner chọn Gemini AI Studio free **chỉ thử nghiệm nội bộ synthetic**, chưa dùng trong KidEDU runtime; phát hành dự kiến GPT-5.6 Luna. Tham chiếu cost/terms và đề xuất quota tại [cost model](../05-cost-model.md), không tự mở billing/provider production.

- `scripts/ai-custom-smoke.cjs`: mặc định offline; live chỉ khi có `GEMINI_API_KEY`, `GEMINI_TEST_MODEL` và `GEMINI_TEST_FREE_TIER=confirmed`. Chỉ một fixed synthetic prompt, tối đa 512 output tokens, 30s timeout, không retry/fallback, không đọc database/file/media/user prompt, không publish. Cờ free-tier là xác nhận operator, không có khả năng tự kiểm billing của Google.
- Chạy `node --test scripts/ai-custom-smoke.test.cjs`: 4 tests đạt cho setup/endpoint, credential isolation, 429 không retry và output validation. Offline smoke đạt. Sau khi owner cấu hình local key và xác nhận setup free, một live request thành công ngày 2026-11-06: đúng năm từ đồ dùng gia đình, schema hợp lệ, không lưu/publish. Không ghi key vào repo/chat/log. Đây chưa phải eval tiếng Việt hoặc bằng chứng provider production đạt.
- Live setup trong `.env.ai-smoke.local` (đã xác nhận Git ignore), dùng `node --env-file=.env.ai-smoke.local scripts/ai-custom-smoke.cjs --live`. Lần chạy có key đầu tiên dừng trước network do thiếu cờ Free Tier; sau xác nhận setup của owner, đặt cờ trong process và gửi đúng một request thành công, không retry/fallback. Công cụ không tự xác minh billing project. Output vẫn cần human review; schema không chứng minh an toàn/ngôn ngữ/phù hợp chuyên môn.
- Migration/rollback: không database/provider provisioning; xóa công cụ test không ảnh hưởng app. P8/P9 production, quota ledger/dispatcher và human evaluation vẫn chưa hoàn tất.

## 15. P3 durable local checkpoint/outbox — 2026-11-06

Implements: `PRD-GAME-003`, `PRD-PROG-005`, `TA-ADR-014/025`.
Dependencies: server-issued session + prepared contract; coordinator/access/time boundary và production encrypted content vẫn chưa nối.

- `DailyGameLocalRepository` dùng dedicated account SQLite schema v1; pin account/session/plan/day, kiểm local revision. Action chỉ cập nhật checkpoint và outbox cùng transaction; không observation, không local quota/grant/receipt. Namespace đóng từ chối handle cũ.
- Outbox giữ payload đầu tiên đến khi ACK, kể cả có thêm thao tác local; ACK sau đó cập nhật server revision và tạo payload kế tiếp từ tiến độ mới nhất. Không thay payload đang chờ ACK, tránh lost-response biến thành stale-write conflict. Exact ACK không được ghi đè tiến độ mới. Install snapshot chặn overwrite nếu còn outbox chưa sync.
- `flushDailyCheckpoint` chỉ cho boundary coordinator, tối đa hai writes mỗi lần, không API trong action engine. Conflict/expiry giữ local checkpoint để reconcile, không tự merge/award hoặc vứt history. Network lỗi giữ payload cho retry. Chưa có UI xử lý conflict/cancel/expiry.
- Verification: hai suites local repository/engine đạt 7 tests; real Node SQLite kiểm rollback khi outbox write lỗi, đóng/mở lại file, account/child isolation, local writes trong khi ACK đang về, duplicate ACK, lost ACK và giữ conflict/expired state. Mobile typecheck đạt. Đây không thay Expo SQLite/native process-kill test.
- Migration/rollback: schema additive trong database riêng chưa nối provider/app; giữ file/reader/outbox khi rollback, không đổi database C49. Không coi local state là quyền premium; phải đi qua signed-pack/key/access và trusted-time boundary trước cutover.
- Remaining: provider lifecycle, route/runtime/renderers, durable reward command/receipt reconciliation, conflict-resolution UX và Android/iOS evidence. P3/P6 chưa hoàn tất.

## 16. P6 navigation và owned-inventory reader — 2026-11-06

Implements: `PRD-NAV-001`, `PRD-REWARD-003`, `PRD-GAME-003`, `TA-ADR-014`.
Dependencies: existing authenticated routes, Parent Gate, legacy checkpoint reader và daily inventory API. Đây là navigation slice; không tuyên bố hoàn tất gameplay cutover.

- `ChildTabBar` dùng shared `MobileTabBar` với bốn tab Tập nói/Trò chơi/Bộ sưu tập/Phụ huynh. Chuyển khỏi Parent Zone khóa gate; vào Parent Zone phải qua gate. Tab Tập nói từ `/practice` quay về root; Cùng luyện giữ entry trong Tập nói. Tab không phụ thuộc premium guard.
- `/games` đọc status server, có loading/retry/no-profile/completed states và thông báo reset 00:00 Việt Nam. CTA vẫn disabled vì chưa nối prepared-content renderer; không coi màn hình này là luồng game đã dùng được.
- `/collection` giữ reader/ảnh quà legacy, hiển thị số inventory/remaining mới; remaining null không bị coi là exhausted. `useLegacyCollection` chỉ gọi owned checkpoint/local collection, không gọi catalog, plan hoặc subscription. `useDailyGameHub` cũng không phụ thuộc parent learning plan. Account/child/API URL là query namespace; phản hồi muộn của account cũ không xuất hiện ở account mới.
- Sửa nhãn accessibility tiếng Việt lỗi trong `StickerAlbum`; đếm mảnh legacy theo unique IDs. Album mới chưa có published art resolver, không thay số lượng mảnh legacy hoặc tự coi legacy art là corpus C50 đã duyệt.
- `DailyGameLocalRepository.reconcile` nhận snapshot server mới tại paused boundary, kiểm child/local revision/immutable plan/day, lưu bản local và pending checkpoint vào bảng additive `daily_checkpoint_conflicts`, rồi thay snapshot và retire outbox trong cùng transaction. Không merge answers hoặc cấp reward; chưa nối conflict UX/coordinator.
- Verification: native tab tests đạt 1 suite/3 tests (selected role, gate khi vào/ra parent, speech-root navigation); SQLite/engine 2 suites/8 tests; owned-reader account-switch regression 1 suite/1 test. Đã mở screenshot baseline trước UI. Chưa có screenshot mới, native device/VoiceOver/TalkBack/large-text/process-kill evidence; component tests không thay những gate đó.
- Regression cuối slice: mobile TypeScript đạt; toàn mobile Jest 77 suites/358 tests đạt; API Jest 15 suites/72 tests và API build đạt. Scoped ESLint UI/daily-games đạt; không gộp PostgreSQL/native-device vào các con số Jest này.
- Migration/rollback: không đổi backend schema trong slice này; SQLite thêm bảng archive idempotently vào namespace chưa cutover. Giữ database/outbox/conflict archives/inventory khi rollback; có thể rollback navigation component mà không xóa quà. Không publish corpus/provider hoặc chạy production migration.
- Remaining C50: free-scoped signed activation, published daily content/reward corpus, renderer/audio/lifecycle/coordinator, reward receipt UX, production onboarding, manual custom library/private pack, AI jobs/quota/preview pipeline và release-device/store evidence. P6 và toàn C50 vẫn In progress.

## 17. Local deployment mismatch repair — 2026-11-06

Implements: local verification cho `PRD-GAME-001`, `PRD-REWARD-003`; không thay behavior hoặc decision gates.

- Tái hiện lỗi thông báo kiểm tra lượt: container API đang chạy image cũ không có module daily-games; authenticated status/inventory đều trả 404. Database `kidedu_local` chỉ có năm migration, thiếu gender/session/reward C50. Đây không phải D03 hoặc lỗi quota AI.
- Tạo logical dump trước migration, kiểm readable dump catalog và lưu ngoài container vào thư mục Temp của máy. Chưa thực hiện restore drill. Áp dụng ba migration additive vào database local (tổng tám migration), giữ column/table/inventory khi rollback; không migrate staging/production.
- Docker build gặp hết dung lượng ổ C, filesystem read-only và image có package files rỗng. Đã dọn cache bằng `pnpm store prune`, restart Docker/WSL và build lại; kiểm package JSON hợp lệ trước khởi động API mới. Không reset database/volume. Tự động review từ chối xóa bộ cài Docker trong Temp; không thực hiện thao tác bị từ chối đó.
- `scripts/local-daily-game-smoke.cjs` dùng synthetic local fixture, chặn origin ngoài local/private HTTP, chỉ đọc children/status/inventory. Trước sửa script thất bại đúng 404; sau sửa đạt HTTP 200 và schema v1. Không start session, tạo reward hoặc log JWT/child IDs. Script syntax/ESLint đạt; README API bổ sung cách kiểm image + migrations khi test screen mới.
- Browser check không chạy được do preview `localhost:8081` không còn lắng nghe (`ERR_CONNECTION_REFUSED`); không có screenshot/device evidence mới. Fixture identity restart đổi signing key nên phiên test cũ cần đăng nhập lại. API status thành công vẫn trả content chưa ready; gameplay renderer/corpus ở mục 16 còn thiếu, không đánh dấu C50 hoàn tất.
- Owner để quota/budget/fee AI và policy sửa giới tính chốt sau; giữ các gates chưa approved, không dùng làm lý do chặn công việc ngoài AI.

## 18. Local playable three-game preview — 2026-11-06

Implements: testable interaction slice cho `PRD-GAME-002..003`, `PRD-NAV-001`; không thay acceptance production ở P3/P6.
Dependencies: C50 local engine/contract, existing drag board/art và approved local-fixture boundary. Owner yêu cầu kiểm tra để tự test trò chơi; không mở synthetic content gateway production.

- `DailyGameStage` render C50 checkpoint: kéo hình vào bóng dùng `WordMatchingBoard`/scroll lock/accessibility assist; nghe chọn bằng tap ba đáp án; memory mười thẻ shuffled, không lộ tên khi úp. Cặp sai giữ đến thao tác úp lại, không phạt hoặc tạo observation; đủ năm cặp hoàn thành.
- `/parent/game-preview` chỉ mở khi `localFixtureEnabled()` và Parent Gate unlocked. Entry từ tab Trò chơi đi qua gate; menu phụ huynh có entry riêng. Predicate hiện có chặn release build, Supabase account config và LAN chưa opt in. Focus loss khóa action/pauses board; account/auth/parent lifecycle hiện có vẫn áp dụng. Không sửa unavailable production content resolver hoặc mở CTA daily chưa tích hợp.
- Owner test nhầm daily CTA disabled vì preview CTA nằm ngoài card. Local hub đã đổi thành một nút chính “Vào chơi thử” enabled, mở gate mới trước preview; không hiển thị daily CTA disabled cạnh bản thử. Local preview vẫn dùng được khi status API lỗi vì không dùng daily authority/data. Ngoài local boundary, unavailable daily CTA vẫn disabled và preview không xuất hiện. Native hub regression 1 suite/3 tests và browser toàn luồng qua entry mới đạt; ảnh trước/sau `artifacts/c50-games-entry-{before,after}-390.png` đã xem.
- Fixture basic có hai màn bóng, năm lượt chọn và năm cặp; dùng năm ảnh có sẵn. Phần nghe hiện người lớn đọc prompt trên màn hình, chưa audio mẫu/automatic replay. Screen ghi rõ dữ liệu mẫu, không lưu tiến độ/tiêu lượt/nhận quà; có chơi lại. Không coi fixture là corpus human-reviewed, private pack, activation hoặc daily-session E2E.
- Native RNTL với engine/board thật đạt 1 suite/2 tests: complete toàn bộ ba trò, wrong choice, mismatch, paused input. Test hơn bốn mươi native events cần timeout 30s; lần đầu timeout mặc định 5s, sau điều chỉnh chạy đạt, không bỏ assertion.
- Native guard tests đạt thêm 1 suite/2 tests: chặn preview ngoài local boundary dù gate unlocked, và yêu cầu gate trước khi render local preview. Đây là component/security regression, không phải native-device QA.
- `scripts/daily-game-preview-web-smoke.cjs` dùng fixture account, Parent Gate thật và drag/scroll-lock helper. Browser 390px hoàn thành hai màn bằng touch drag, wrong/correct choices, mismatch/five pairs, completion/replay; không page errors, không horizontal overflow hoặc daily-game mutation. Artifacts `artifacts/c50-preview-{shadow,listen,memory,complete}-390.png`; đã mở kiểm tra ảnh thật. Không có device/VoiceOver/TalkBack evidence mới.
- Chạy lại browser toàn luồng ở 320px bằng mouse drag cũng đạt cùng assertions; artifacts hậu tố `-320.png`, đã xem ảnh shadow để kiểm layout wrap và khả năng chạm/kéo trên màn hẹp. Không extrapolate thành large-text/screen-reader certification.
- TypeScript/scoped ESLint đạt; live local API status/inventory smoke đạt HTTP 200. Docker/Metro được khởi động bằng cấu hình local hiện có; không thêm service/dependency, billing hoặc test-auth bypass.
- Migration/rollback: không schema/data migration mới, không writes progress/inventory/observations. Rollback gỡ entry/route/preview component, giữ reader và dữ liệu cũ. README/CHANGELOG cập nhật evidence; SOT behavior không đổi. Remaining production renderer coordinator, signed/encrypted media, audio, receipts/catalog và release gates ở mục 16 vẫn mở.

## 19. Daily session coordinator và account lifecycle — 2026-11-06

Implements: `PRD-GAME-003`, `PRD-PROG-005`, `TA-ADR-014/025`.
Dependencies: guarded daily HTTP và local transactional repository/outbox. Production preparation vẫn phụ thuộc signed activation, trusted time, media/key readiness adapter; không thay bằng UI flag hoặc synthetic lease.

- `DailyGameRuntimeProvider` đã nối vào authenticated AppProviders: account-specific `daily-games-{internal-account-id}.db`, UUID validation, FK/busy timeout và repository initialize. Late DB open/init/error của account cũ không publish vào account mới. Init lỗi đóng database ngay; cleanup lỗi vẫn đóng SQLite sau khi drain, không log tài khoản/key/payload.
- `DailyGameAccountRuntime` quản lý một game screen đang hoạt động trên device/account. Thay screen/child đóng coordinator/lease cũ trước khi tạo mới; account close invalidates tất cả handles và drain queue trước DB close. Không xóa checkpoint/outbox hoặc coi mở database là activation grant.
- `DailyGameSessionCoordinator` gọi status/start và durable flush ở explicit preparation/pause/completion boundaries. Input chỉ dùng local engine + SQLite transaction; snapshot pin được deep-freeze. Chuyển giữa ba game dừng input đến boundary mới. Không API theo tap/drag, observation hoặc tự cấp reward.
- `continuePrepared()` kiểm boundary của grant/time/media hiện có tại chuyển trò, không cần request mạng mới; phiên Ready có thể hoàn tất cả ba trò với mạng chập chờn (`PRD` readiness). Background/pause đóng lease nên foreground phải prepare lại; completion local đóng lease và chờ server ACK. Không đồng nhất completion local với receipt/quyền nhận quà.
- Prepared access phải do `DailyGamePreparationBoundary` cung cấp sau kiểm signed grant/generation/local asset/key/trusted deadline; không có default production permit. Assertion chạy cả đầu/cuối transaction ghi checkpoint/outbox; hết quyền/reset giữa các async disk writes rollback cả hai. Lease lỗi đóng phiên; pause/close hoặc phản hồi preparation đến muộn không xuất frame cũ và đóng late lease.
- Repository action yêu cầu access assertion bắt buộc, không có default allow; storage-only tests phải truyền explicit synthetic callback. Provider context không cấp permit hoặc biến checkpoint cache thành quyền chơi.
- Network retry giữ exact pending payload. Conflict nhận snapshot server mới, archive local branch, không merge answers; expired giữ progress nhưng không claim/re-award. Completion local chỉ thành server-confirmed sau ACK có `completedAt`; coordinator không tạo receipt.
- Verification: full mobile Node 79 suites/370 tests, native component 5 suites/12 tests đạt; typecheck đạt. Real SQLite coordinator/repository coverage và provider lifecycle mock DB kiểm full sequence/no API loop, coalesced ACK, reset giữa transaction, network/conflict archive, same-child/new-child replacement, account mismatch, late lease/DB response và cleanup/init failure. Component tests không thay native process kill/foreground/account-switch device QA.
- Browser regression qua AppProviders mới và local preview đạt: Parent Gate/touch-drag/choice/memory/completion/replay, không page errors/daily mutations. Lần thử đầu không đăng nhập được vì Docker đã tắt; bật lại local DB/identity/API rồi chạy thành công trên cổng web tạm 19007. Đã tắt Metro tạm sau kiểm tra, không giữ cổng 8081 của terminal owner.
- Migration/rollback: không thêm backend migration. Dedicated SQLite schema trước đó được initialize idempotently; giữ file/checkpoint/outbox/conflict archives khi rollback provider/coordinator, không drop tables hoặc reset ngày/quà. Runtime references không chứa plaintext media/key. Mobile architecture/README/CHANGELOG cập nhật wiring/evidence; product behavior và D03 không đổi.
- Remaining: adapter signed-pack/activation/time/media, daily-game route/lifecycle hook và reward UI chưa nối coordinator này; preview vẫn in-memory, không đổi label thành durable. Không tick P3/P6 complete hoặc C50 release-ready. Manual/private library và production AI/release gates ở mục 16 vẫn mở.

## 20. Durable local game flow và UI ít nhiễu — 2026-11-06

- Implements: `PRD-NAV-001`, `PRD-GAME-001..004`, `PRD-REWARD-001..003`, `PRD-SUB-006`, `TA-ADR-025`. Dependencies: P1/P2 repositories/contracts, mục 19 account runtime; production content/preparation chưa đạt.
- `/daily-game` nối coordinator với account SQLite, khóa input trong commit, pause/background/foreground và explicit completion sync. Chuyển trò chỉ kiểm lease local; không HTTP trong activity loops. `/daily-reward` chỉ claim sau server-confirmed completion; server giữ kind/candidates, SQLite pin hộp trước HTTP. Foreground recovery xếp sau command đang chạy; lost ACK đọc lại receipt đầu tiên. Screen dùng lifecycle hooks, không trực tiếp gọi API/SQLite/file.
- `GET .../{sessionId}/reward` kiểm ownership, không yêu cầu subscription/catalog còn sẵn sàng và không lộ candidates. Đã nhận vẫn `claimed` sau reset; chưa nhận thành `expired`. OpenAPI/generated client đồng bộ.
- Compose local bật `C50_LOCAL_DAILY_FIXTURE=1` cùng `APP_ENV=local`; adapter từ chối staging/production dù có flag. Corpus synthetic có đủ basic/full rounds, sticker và tranh sáu mảnh, IDs riêng `local_*`. Mobile preparation kiểm pinned version/target refs, identity và conservative monotonic deadline theo server reset/paid expiry; **không thay** signed production activation/key/media loader hoặc human content approval.
- UI Tập nói ưu tiên một bài/hành động chính; các cách luyện khác mở theo nhu cầu, giữ guided learning/transfer. Game có available/resume/completed/error, hết lượt vẫn xem quà; không nút chơi lại giữa activity. Memory grid thích ứng, đủ chỗ thành hai hàng năm thẻ, touch target ≥56. Album chuyển Sticker/Tranh ghép, ưu tiên quà đã có thay vì trải ô trống; sáu mảnh hiện đúng vị trí. Catalog/version lạ giữ count, không đoán artwork.
- `/parent/profiles` sửa tên/điền gender thiếu qua API versioned, không suy tên hoặc đổi/clear gender đã nhập. Stale revision yêu cầu deliberate reload; late response không hiện lên form đã đổi. Parent Gate allowlist destination `profiles`; bỏ thuật ngữ server/revision khỏi UI bình thường khi không giúp quyết định.
- Verification: mobile Node **81 suites/378 tests**, native component/hook **7 suites/18 tests**, API **16 suites/79 tests**, PostgreSQL reward **3 tests** đạt. Browser full local flow 320px/390px/768px, basic preview, four tabs 320px/390px/768px đạt; bundle readiness 34 files/2 videos đạt. Browser kiểm actual server reservation/SQLite/full quotas/no loop HTTP/four boxes/one receipt/album. Tranh sáu mảnh + deliberately lost claim ACK đi qua retry UI; gửi lại hộp khác vẫn cùng receipt. Native component/hook kiểm commit/background late frame/profile conflict/gate; không thay device QA.
- C50 cutover giữ `fixture_play_today_words` chỉ để đọc history/assets cũ: server catalog/prepare không mở mới; mobile picker/selection/deep link chuyển khỏi luồng Cùng luyện cũ. Các guided activity khác giữ nguyên. `C50_DAILY_GAMES_CUTOVER=1` chặn thay đổi checkpoint retired game (exact committed ACK vẫn đọc lại được) và chặn mint thêm legacy receipts/stickers/pending reward kể cả client giả lesson ID khác. Không xóa history, receipt hoặc inventory cũ; flag này độc lập synthetic-content flag và phải giữ khi rollback C50.
- Bug tìm được/sửa: rapid input có thể bị bỏ lúc SQLite commit, gây memory mismatch; nay disable input trong transaction và test 320px chạy lại đạt. Sửa SVG non-boolean attribute và album container rỗng. Metro local thêm COOP/COEP cho expo-sqlite SharedArrayBuffer; không thêm dependency/native storage khác.
- Migration/rollback: không backend migration mới; SQLite thêm additive `daily_reward_choices` (session/child/box), giữ schema v1 và dữ liệu cũ. Rollback tắt fixture/new routes, giữ checkpoint/outbox/choice/inventory/receipt, không mở lại quota. Smoke tạo riêng synthetic profiles; guarded cleanup kiểm local DB, fixture ownership, tên máy sinh và không có learning data trước teardown, giữ family/hồ sơ có sẵn.
- **Remaining ngoài AI, không có owner approval mới đang chờ:** production signed/encrypted content/activation/media; Vietnamese listening audio đúng/sai/replay; corpus phát hành 30–40 tranh/sticker/provenance/human QA; free năm bộ qua server/loader; production onboarding/profile creation; manual paid create/edit/preview/approve/private publish và owned export/delete; native lifecycle/process-kill/large-text/screen-reader/low-storage/store/backup evidence. Không tick P3–P7/P10 hoặc tuyên bố toàn C50 đã xong.

## 21. Owner correction: board và completion flow — 2026-11-06

Implements: `PRD-GAME-003..004`, `PRD-REWARD-001`, `PRD-UX-004`, `TA-ADR-025`.
Dependencies: mục 19–20, coordinator/outbox/receipt authority và Gentle Growth foundation. Owner trực tiếp yêu cầu sửa tương tác/giao diện; AI tiếp tục hoãn.

- Acceptance: màn chơi không cuộn; drag không dời screen/document, stack swipe và Android hardware/edge back bị chặn khi focus. Header có Back 56px, rời game pause/lưu qua coordinator rồi về Trò chơi; resume giữ cùng session, không cấp lượt mới.
- Hình nghe chọn lớn theo diện tích; phone portrait dùng ba hàng ảnh lớn, tablet dùng hai hàng thay vì ba ô nhỏ trong một hàng; landscape dùng một hàng. Memory tính kích thước và số cột theo cả chiều rộng/cao, giữ mười thẻ trên viewport; landscape không dồn chín thẻ + một thẻ. Shadow có hai cột nguồn/đích trên portrait, hai hàng khi landscape. Không ép touch target dưới 56px.
- Cặp sai tự úp sau 1,2 giây lúc triển khai ban đầu, **owner chỉnh xuống 0,6 giây ngày 2026-11-07**; screen reader giữ 2,4 giây. Timer giữ exact card IDs và hủy khi pause/change/unmount. Không còn nút úp thủ công. Commit SQLite vẫn khóa input nhưng giữ ảnh rõ, không nhấp nháy opacity giữa mỗi lượt. Timing-only correction implements `PRD-GAME-003`, không migration/data change; rollback khôi phục delay, không reset tiến độ.
- Completion tự commit/flush; chỉ ACK có completedAt mới chuyển reward. Lỗi mạng giữ tiến độ và hiện Thử kết nối lại, không replay hoặc nút Lưu lượt chơi. Receipt đã xác nhận hiện quà lớn rồi tự về games sau 2,4 giây; background hủy timer, foreground cho đủ thời gian xem lại. Không grant từ local completion hoặc từ timer.
- Shared Screen/tab bar mở rộng responsive tới 720px, board tới 900px; header thay cụm nút lớn cuối board. Album tăng artwork/sticker/tranh đã có, chia cột tablet và giữ kích thước phù hợp phone. Không thêm nội dung nhiễu để lấp vùng trống khi inventory ít.
- Verification: mobile TypeScript và Node **82 suites/383 tests**, native **8 suites/23 tests** đạt. Native tests kiểm auto completion success/network retry, automatic mismatch, BackHandler cleanup và receipt/background timers. Browser daily flow **320/390/768px và 844×390 landscape** đạt, gồm target bounds, drag không cuộn, không HTTP trong loop, mismatch tự úp, không save/replay, auto reward→hub đã hết lượt. 390px kiểm Back/resume giữ session; 768px kiểm tranh ghép và lost claim ACK/retry vẫn một receipt. Các số này không thay native-device/VoiceOver/TalkBack/large-text QA.
- Migration/rollback: không đổi schema/backend/API/dependency; rollback presentation/hooks/routes, giữ checkpoint/outbox/inventory/receipt và server quota. Không xóa hoặc reset lượt để rollback. PRD/design/README/CHANGELOG ghi owner amendment; không đổi stack/ADR. Ngoài phạm vi slice: AI và các production/release gates còn mở ở mục 20; không đánh dấu toàn C50 hoàn tất.
- Kiểm tra bổ sung: preview qua menu phụ huynh/Parent Gate đạt completion→Back, không daily mutations; bốn tab 320/768px đạt. Typecheck, ESLint, Prettier và relative Markdown targets đạt; sau chỉnh layout nghe chọn phone chạy lại full flow 320/390px và native stage đạt. Guarded cleanup đã gỡ 11 hồ sơ máy sinh của đợt kiểm tra, giữ hồ sơ/history/family có sẵn. Metro test cổng 19007 đã tắt, không chiếm terminal/cổng 8081 của owner.

## 22. Fullaccess local QA exception — 2026-11-07

Implements: QA exception owner trực tiếp yêu cầu cho `PRD-GAME-004`, `PRD-REWARD-001`, `TA-ADR-002/025`; dependencies: Compose synthetic identity, local content adapter và mục 20–21. Không sửa hành vi release cho tài khoản thật.

- Riêng fixed internal fullaccess account trong guarded development/local fixture bỏ thao tác hold Parent Gate. AuthProvider cấu hình exception theo account; đổi account/sign out xóa exception, tài khoản thường relock bình thường. Release build, Supabase identity hoặc remote API không được cấp exception từ tên/email trên client.
- Local seed giữ full paid capabilities với hạn mười năm, không cần renew sau mỗi tháng. Không thêm grant endpoint, AI quota hoặc tự bật provider/content/private publishing chưa triển khai.
- Hub sau completion thay nút disabled bằng **Chơi phiên thử mới**. POST local-test/restart chỉ cho APP_ENV local + synthetic-content flag + exact fixture identity/internal ID/entitlement source + owned child; active/replaced session trả 409. Child lock serialize reset/start/claim. Transaction xóa metadata receipt/reservation/session thử hiện tại, **giữ RewardInventory và toàn bộ learning history/family data**. Nút explicit này là ngoại lệ test, không tự reset cho người dùng thường.
- SQLite giữ document/choice/conflict archive cũ theo session ID; local fullaccess có thể retire day index của phiên completed khi server trả ID mới cùng ngày. Không drop table hoặc bỏ unique-day constraint; account khác/default install vẫn từ chối replacement, pending/active local progress không bị tự xóa. Sửa lỗi replay bị unique day index chặn khi kiểm tra thực tế.
- Async restart không điều hướng nếu đổi account/child, unmount hoặc rời hub. API/OpenAPI/generated client và test helper Parent Gate đồng bộ. Không API trong activity loop.
- Migration/rollback: không migration/schema/dependency mới. Rollback UI/helper/endpoint/seed exception giữ owned inventory/local archives; không hoàn tác bằng xóa account/family hoặc mở lại quota production. Receipt metadata của các phiên thử đã explicit reset không được khôi phục tự động; owned gifts vẫn còn. AI và production/release gates ở mục 20 ngoài phạm vi yêu cầu này.
- Verification: mobile Node **83 suites/386 tests**, native **8 suites/24 tests**, API **17 suites/86 tests** đạt; mobile/API TypeScript, ESLint và scoped Prettier đạt. Docker local đã build/deploy và renew fixture entitlement. Browser 390px full daily flow → quà → hub → phiên thử ID mới cùng ngày → Back đạt, inventory vẫn một món; fullaccess vào parent không hold, sign out/login ordinary khôi phục hold thật. Live API ordinary restart trả 404, full paid capabilities active; endpoint HTTP/auth/generated-client regression đạt. Không có Android/iOS device evidence mới; không coi test exception là production readiness.

## 23. Silhouette fidelity — 2026-11-07

Implements: `PRD-GAME-003`, `PRD-UX-004`; dependencies: existing bundled sprite art, matching renderer và mục 21. Owner yêu cầu sửa bóng sai để trẻ nhìn rõ; không đổi plan/quota/progression hoặc cấp nội dung production.

- Root cause: WordSilhouette chỉ có bốn nhánh shape vẽ gần đúng; mọi picture khác rơi vào cùng hình bánh. Shape xe/gấu/sữa không theo contour artwork, trong khi hình nguồn có thể đổi frame hoặc mang cảnh nền.
- `wordSilhouetteContours.ts` phủ đủ 12 local targets. Năm PNG dùng external alpha contour của frame đầu, loại disconnected speckles và fill internal holes; generator Node/zlib không sửa raster hoặc thêm dependency. `--check` xác minh geometry đã commit khớp alpha nguồn. Bảy scene JPEG có clipping vector riêng, tách chủ thể khỏi decorative circle/branch/background; không dùng bounding rectangle làm bóng.
- `WordMatchingArt` dùng chung contour/viewBox/static first-frame crop cho nguồn, bóng và hình sau ghép; không animation dịch tư thế trong matching. Shadow tô đặc bằng theme primary trên surfaceAlt, khung đích vẫn có cue/accessible name/state. Picture không có contour dùng đúng thumbnail làm gợi ý mờ, không thay thành đồ vật khác; loading failure giữ static fallback + artwork-error callback/timeout hiện có. Các trò khác giữ sprite presentation riêng.
- Giữ drag lock, target IDs, shuffle, assistive activation, local commit/outbox và completion/reward flow. Sửa warning SVG non-boolean accessible prop tìm được khi browser test; không bỏ assertion hoặc ép click qua error toast.
- Verification: native **9 suites/39 tests** đạt, gồm 12 picture/shadow geometry pairs, distinct contour coverage, unknown-art handling và load/timeout callback. Browser full daily flow **320/390px** đạt, kéo đủ năm màn → nghe chọn → memory → một quà, không loop HTTP/page errors/overflow. Đã mở xem năm màn và gallery 12 original/clip/shadow comparisons; artifacts `c50-shadow-round-{1..5}-{320,390}.png`, `c50-shadow-review.png`. Đây là visual/component/browser QA, chưa device hoặc child usability/human content release approval.
- Migration/rollback: không schema/backend/API/dependency/data migration. Rollback renderer/contour files, giữ toàn bộ phiên, SQLite checkpoint/outbox và inventory/receipt. Product acceptance/design/README/CHANGELOG cập nhật; original assets/provenance không đổi, không auto-publish corpus. Các production gates C50 còn lại giữ trạng thái tại mục 20.

## 24. Listen choice feedback — 2026-11-07

Implements: `PRD-GAME-003`, `PRD-UX-004`; dependencies: mục 21, local authored engine + transactional checkpoint và existing settings/theme. Owner yêu cầu hiệu ứng đúng/sai ở chọn hình; không thay scoring/mastery/quota.

- `ListenChoices` cho phản hồi ngay ở tile đã chọn: đúng có check/Đúng rồi và sao + pulse scale nhẹ khi reinforcement/motion cho phép; sai có cue thử lại màu secondary và opacity pulse nhẹ, không shake/còi/phạt. Không thêm điểm, timer áp lực hoặc đổi bố cục. Native accessible announcement dùng outcome authored, không suy đoán phát âm.
- Khóa double tap bằng ref ngay trong handler. `useDailyGameSession` commit ngay qua coordinator; chỉ publish frame/mode mới sau 900ms để xem phản hồi, gồm đáp án cuối trước chuyển game. Không đợi effect mới ghi checkpoint; network vẫn chỉ boundary. Preview cũng giữ presentation window, không quota/reward mutation.
- `useFeedbackWindow` cancel/resolve timer khi pause/unmount; epoch/focus guard không publish frame cũ. Background dừng animation và xóa feedback, foreground không replay effect. Reduce Motion/tắt reinforcement giữ check/retry tĩnh; setting đổi trong effect cũng dừng animation. Không thêm sound asset hoặc thay audio-content gate còn thiếu.
- Verification: mobile Node **83 suites/386 tests**, native **10 suites/45 tests** đạt; TypeScript/lint đạt. Coverage: immediate authored action, one tap only, wrong→retry, reduced/sensory static cues, background/no replay, durable commit trước presentation và cancel delayed frame sau background. Browser full three-game flow **320/390px** đạt với wrong choice rồi correct, finite feedback, full completion/reward và không activity-loop HTTP/errors/overflow. Đã xem `artifacts/c50-choice-{retry,correct}-390.png`; không có physical-device/screen-reader usability evidence mới.
- Migration/rollback: không schema/API/backend/dependency mới. Rollback presentation component/window và hook publication delay; giữ SQLite/outbox/server checkpoints, lượt và inventory/receipt. PRD/design/README/CHANGELOG cập nhật acceptance; AI và các production content/release gates không thuộc slice này.

## 25. Picture-centered drop acceptance — 2026-11-09

Implements: `PRD-GAME-003`, `PRD-UX-004`; dependencies: C45/C46 drag/drop foundation, matching board và C50 local renderer. Owner báo kéo hình vào ô đúng nhưng không nhận; không đổi đáp án authored hoặc progression.

- Đã tái hiện bằng touch: cầm ở mép phải/dưới, tâm hình nằm trong ô đúng nhưng ngón tay ở ngoài → phiên cũ không ghi nhận. Root cause: DragPiece gửi gesture.moveX/moveY (vị trí ngón tay), không phải tâm hình. Cả trường hợp centered-drag đã pass trước đó không phủ được lỗi này.
- Đo tâm khung nguồn qua measureInWindow, dùng cùng hệ tọa độ window với useDropTargets; điểm thả là origin + dx/dy, độc lập chỗ cầm. Giữ nguyên đúng target ID/rectangle/rule và assistive alternative, không mở rộng nhận nhầm sang ô khác.
- Kiểm tra kéo nhanh tìm thêm race: measure callback có thể đến sau move đầu, khiến origin đo trên hình đã dịch rồi bị cộng delta hai lần. Giữ translation ở origin đến khi measurement settle, sau đó áp dụng delta mới nhất; release sớm chờ cùng promise. Timeout 120ms tránh treo nếu native không phản hồi; fallback lấy release page coordinates, không dùng stale moveX/Y có thể bằng 0. Source không collapsable để native đo được.
- Gesture revision chặn measurement/drop callback của gesture cũ sau cancel/disable/unmount hoặc lần kéo mới. Cancel settle promise và giữ scroll lock lifecycle; web dùng JS animation driver, native giữ native return animation. Không API trong drag loop hoặc thay durable checkpoint behavior.
- Verification: mobile TypeScript và native **11 suites/51 tests** đạt. Sáu regression tests mới kiểm translated center khi cầm lệch, page-coordinate fallback, stale callback sau cancel, disable mid-drag, release trước measurement và measurement timeout. Browser full five-shadow/three-game→reward flow đạt với touch 390px cầm lệch hai trục và mouse 320px cầm lệch; scroll/document không trượt và không HTTP trong loop. Baseline off-center fail trước sửa đã được tái hiện, không bỏ assertion để làm pass. Physical Android/iOS drag chưa được kiểm trực tiếp.
- Migration/rollback: không schema/backend/API/dependency/data migration. Rollback DragPiece/helper/tests, giữ SQLite/outbox/session/inventory/receipt và quota; không reset ngày hoặc xóa hồ sơ người dùng. PRD/accessibility/README/CHANGELOG cập nhật. AI và các production/release gates còn mở không thuộc yêu cầu này.

## 26. Bundled game artwork readiness — 2026-11-09

Implements: `PRD-GAME-003`, `PRD-NFR-002`, `TA-ADR-008`; dependencies: local daily preparation boundary, Expo Asset/Image and existing bundled corpus. Owner reports slow image loading.

- Finding: five custom RGBA sprite sheets total 5,243,428 bytes; the daily adapter previously admitted the board without preparing artwork. Prefetch alone still transferred 5,898,114 bytes during the browser activity loop through SVG/image consumers under Metro.
- Fix: prepare unique pictures referenced by the pinned session before granting a playable lease; at most three concurrent preparations. Check identity again after media await, then obtain server status/entitlement and reset deadline. Media failure prevents entry and can be retried; artwork never grants access.
- `prepareWordArtwork` and `cacheBundledArtwork` reuse the existing Expo stack. Native stores bundled assets locally and warms Expo Image; both renderers use the prepared URI. Web shares page-lifetime blob URLs across SVG/HTML images. Only fixed public bundled art may enter this cache; no family media, signed URLs or decrypted premium content. Existing sprite geometry/contours remain unchanged; web sprite loading is eager.
- Acceptance/evidence: full 390px browser flow through five shadow rounds, listening, memory, automatic completion, reward and return passed. Resource Timing recorded 12 artwork resources and **0 late transfer bytes** after the first board. No activity-loop API/scroll/errors. This measures transfer behavior, not a native frame-time or decode benchmark. First preparation still downloads the corpus; no raster compression or new artwork was introduced.
- Verification: TypeScript and scoped ESLint passed; Node boundary/cache tests **2 suites/6 tests**, native **12 suites/54 tests** passed. Coverage includes failed media/retry, unique assets, shared concurrent web fetch and identity change while preparing. Physical Android/iOS cold-cache and low-memory performance remain to be measured.
- Migration/rollback: no schema/backend/API/dependency migration. Revert the artwork adapters/preparation wiring and renderer source changes without deleting session/checkpoint/inventory data. Mobile spec/README/changelog updated; no product or architecture decision change. AI, production signed/encrypted content activation and store release evidence remain outside this fix.

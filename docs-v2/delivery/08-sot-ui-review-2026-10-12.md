# Review SOT và UI — 2026-10-12

Trạng thái: `Reviewed — release gaps open`.
Implements: kiểm tra traceability `PRD-ACC-*`, `PRD-PLAN-*`, `PRD-ACT-*`, `PRD-SES-*`, `PRD-PROG-*`, `PRD-SUB-*`, `PRD-SYNC-*`, `PRD-MEDIA-*`, `PRD-UX-*`, `PRD-NFR-*`.

## Kết luận

### Cập nhật sau sửa lỗi cùng ngày

Các finding bên dưới ghi nhận baseline trước sửa; line number không còn là vị trí hiện tại. User yêu cầu sửa trực tiếp, phạm vi triển khai và rollback nằm tại C11–C14. Không đổi trạng thái duyệt SOT.

| Finding | Kết quả hiện tại                                                                       | Phần còn mở                                                                                                         |
| ------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| R01     | Today đọc plan; C15 có prepared fixture + atomic observation/outbox + transfer/history | Production plan/pack loader, media activity renderers và full provenance sync còn mở                                |
| R02     | Production learning fail closed; projection chỉ dùng development                       | Signed activation, encrypted packs/key/resolver/generation sync chưa triển khai; production chưa dùng được learning |
| R03     | Bỏ continuous; setting cũ và engine luôn hữu hạn                                       | Session budget cần owner, native pause/kill QA                                                                      |
| R04     | Hold thay toán cố định, short release/background cancel, rời foreground khóa gate      | Native screen-reader/store usability QA                                                                             |
| R05     | Expiry refresh, lỗi mạng giữ credential, block expired access, chống logout race       | Live provider và native lifecycle/process kill                                                                      |
| R06     | Tab/media chip 56px, chữ tile tối và nút secondary dùng màu theme đủ contrast          | Audit toàn bộ màn, native Dynamic Type                                                                              |
| R07     | Selected state settings; bỏ pulse/bounce/celebration/press transform                   | Native Reduce Motion/Transparency, screen reader và sensory media QA                                                |
| R08     | Android dùng local Gradle, production yêu cầu signing, EAS chỉ iOS                     | Build APK/AAB thật và device/store proof                                                                            |

Browser sau sửa: `node artifacts/fix-ui.cjs`, synthetic intercepted API tại 320/390/768px. Short tap bị từ chối, hold bằng keyboard/mouse mở gate, đổi hồ sơ giữ đúng plan ở Today, prototype hoàn thành; không page exception hoặc document overflow ở các màn được chụp. Tab hiện 56px. [Kết quả](../../artifacts/fixed-ui-results.json), [Today 320](../../artifacts/fixed-child-allowed-320.png), [Parent 320](../../artifacts/fixed-parent-320.png). Không thay thế backend/native proof.

Android preview preflight pass; production preflight từ chối missing signing đúng kỳ vọng. Chưa build native, chưa gửi lên store. Không migration schema; legacy continuous được normalize khi đọc. API/backend chưa sửa trong lượt fix này, Docker/PostgreSQL integration chưa chạy lại.

Validation cuối lượt fix: `pnpm check` pass (default media, typecheck, lint, **47 suites / 239 tests**). Prettier và local documentation links pass. Các child control đang hiển thị trong captures đều ≥56px. Contrast foreground/background đã đổi: cyan 5,70:1, pink 4,58:1, green 6,35:1, secondary button 5,62:1. Chỉ xác nhận các cặp màu và các màn đã đo; không coi là audit toàn ứng dụng. Migration/rollback và phạm vi còn mở xem [C11](./tasks/C11-child-safety-ui-fixes.md), [C12](./tasks/C12-auth-refresh-lifecycle.md), [C13](./tasks/C13-local-android-build.md), [C14](./tasks/C14-today-plan-production-containment.md).

Chưa đáp ứng toàn bộ Store Release v1.0. Hiện có foundation và các slice local; không được coi đăng nhập/full-access fixture hay unit test pass là bằng chứng hoàn thành sản phẩm. UI đã theo palette, typeface và primitives Gentle Growth, nhưng IA/learning flow còn legacy và chưa đạt accessibility/visual release gate.

Không sửa behavior trong lượt review này. Không đổi SOT, schema/API hoặc trạng thái approval. Rollback tài liệu/artifact review không ảnh hưởng dữ liệu ứng dụng.

## Cách kiểm tra và giới hạn

- Đọc ba SOT, design 01–04, mobile architecture, activity/family-media/progress/subscription specs, task slice hiện có và release checklist; đối chiếu code/routes/contracts.
- Mở screenshot legacy study/parent và screenshot UI v2; chụp thêm Chromium 320×844, 390×844, 768×844 cho Child allowed/locked, Parent dashboard và prototype activity.
- Chạy `node artifacts/review-ui.cjs`: synthetic intercepted API, đi login → child → gate → parent → prototype → observation → transfer → finish → locked. Cả ba viewport không có page exception hoặc horizontal document overflow ở bốn màn được đo. DOM vẫn chứa route bị ẩn; control kích thước 0 trong JSON không được tính là lỗi touch target.
- Artifact: [kết quả JSON](../../artifacts/review-ui-results.json), [Child allowed 320](../../artifacts/review-child-allowed-320.png), [Parent 320](../../artifacts/review-parent-320.png), [Prototype 320](../../artifacts/review-prototype-activity-320.png), [Child locked 390](../../artifacts/review-child-locked-390.png). File chứa fixture giả, không có PII thật.
- Docker daemon không hoạt động (`dockerDesktopLinuxEngine` pipe không tồn tại), nên không chạy lại PostgreSQL/full-access backend smoke. Browser interception không xác nhận JWT, database, billing hoặc server authorization.
- Bộ kiểm tra local ở lượt implementation ngay trước: mobile 43 suites/223 tests; API 10 suites/36 tests và build pass. Không chạy lại toàn bộ trong lượt review chỉ thêm tài liệu/artifact này. Chưa kiểm native, large text, VoiceOver/TalkBack, reduce motion, process kill hay store sandbox.

## Findings cần sửa

### R01 — P1: Learning flow thực tế chưa là goal/lesson/activity theo v2

[`app/index.tsx`](../../app/index.tsx) dòng 68–83 luôn hiển thị “Kế hoạch học đang được chuẩn bị” khi allowed, rồi mount `LegacyLearningChoices`. Không đọc active plan để mở Today lesson. [`app/prototype.tsx`](../../app/prototype.tsx) dùng reducer dữ liệu giả, chỉ development và không persist observation/transfer. Backend plan/observation API và content schemas là nền tảng; không tương đương complete runtime.

Ảnh hưởng `PRD-PLAN-001..005`, `PRD-ACT-001..010`, `PRD-PROG-001..004`, IA Today → prepared lesson. Cần vertical slice Today → prepared lesson → activity → local observation/outbox → transfer, sau đó bổ sung đầy đủ activity. Threshold/corpus cần owner input; wiring/state/persistence không phải chỉ thiếu credential.

### R02 — P1: Premium guard mới ở UI, chưa có signed activation/encrypted pack boundary

[`app/_layout.tsx`](../../app/_layout.tsx) guard route bằng subscription read. [`useDisplayMediaUri.ts`](../../src/features/media/useDisplayMediaUri.ts) dòng 36–38 nhận URI thường là ready, không kiểm grant/pack integrity hay decrypt authorization. Không thấy pipeline manifest/download/signature/atomic generation hoặc KeyManagement/activation implementation trong source đã rà soát.

Chưa đáp ứng `TA-ADR-001/005/007/009`, mobile architecture §7, `PRD-SUB-003`, `PRD-NFR-003`. Không kết luận đã exploit bypass server; kết luận hiện chưa có enforcement/content protection bắt buộc cho production. Timer C10 chỉ sửa thời điểm lock của local projection.

### R03 — P1: Có autoplay vô hạn trái SOT

[`app/parent/settings.tsx`](../../app/parent/settings.tsx) dòng 175 vẫn có “Lặp liên tục”. [`autoPlayEngine.ts`](../../src/features/autoPlay/autoPlayEngine.ts) dòng 78–95 dùng null làm không giới hạn và dòng 177–180 cho tiếp tục vòng mới. Đây là behavior được test legacy duy trì, trái `PRD-ACT-011`, activity spec §4/15 và child safety §2.

Cần bỏ lựa chọn vô hạn, xử lý setting cũ khi đọc/migrate và kiểm pause/stop; giới hạn cụ thể theo `PRD-TBD-03`, không tự chốt session budget production.

### R04 — P1: Parent Gate cố định và không có lifecycle expiry

[`parentGate.ts`](../../src/features/parent/parentGate.ts) dòng 22 trả `3 + 5` khi không có argument; screen luôn gọi không argument. Dòng 44 `parseInt` chấp nhận tiền tố số: Chromium đã mở Parent Zone bằng `8garbage` ở cả ba viewport. Store chỉ giữ boolean, không có expiry/background handler. [`app/parent/_layout.tsx`](../../app/parent/_layout.tsx) chỉ đọc boolean.

Ảnh hưởng `PRD-ACC-004`, IA §9, accessibility §3. Cần parser strict, cơ chế gate phù hợp accessibility/store và lifecycle invalidation. Không tự chọn TTL chưa duyệt. Gate vẫn không được thay server authentication/authorization.

### R05 — P1: Access-token expiry có thể làm mất auth session thay vì refresh/recovery

[`AuthProvider.tsx`](../../src/features/auth/AuthProvider.tsx) dòng 58–70 gọi `gateway.signOut()` khi access token hết hạn. Supabase gateway bật auto refresh nhưng source không có mobile AppState start/stop refresh orchestration. Nếu app background hoặc refresh chậm/offline đến expiry, timer có thể xóa refresh session trước recovery.

Đây là rủi ro đọc từ code, chưa reproduce trên native. Trái lifecycle intent `TA-ADR-002/003`, `PRD-ACC-001`, `PRD-SYNC-005`. Cần tách invalid access token khỏi logout và có refresh/retry flow; chỉ xóa auth khi explicit logout hoặc refresh credential thực sự không hợp lệ.

### R06 — P2: Touch targets và contrast chưa đạt

[`MobileTabBar.tsx`](../../src/components/MobileTabBar.tsx) dòng 86 có minHeight 48; DOM đo tab 53px ở cả ba viewport, dưới child target 56px. Parent row/chip đo 58/44px đạt tối thiểu ở các màn được đo.

White text trên coral `#E47D45` của secondary KidButton có contrast 2.87:1; white trên cyan/pink/green category tokens lần lượt 2.38/2.97/2.14:1. Tính theo relative luminance sRGB, chưa tính mọi state/rendering. Label nút 16px và tile 18px không đạt AA 4.5:1 cho chữ thường; chỉ tăng cỡ chữ không đủ với các cặp dưới 3:1. Palette vẫn có thể giữ, đổi foreground/semantic use theo contrast. Primary green + white 5.18:1 đạt ở cặp này.

### R07 — P2: Accessibility state/reduce motion thiếu evidence và wiring

[`KidButton.tsx`](../../src/components/KidButton.tsx) không khai báo selected state cho settings dùng variant màu để chỉ lựa chọn; label bị giới hạn hai dòng. Press styles scale/translate chưa có reduce-motion handling; Parent settings chỉ có SFX/khen, chưa thấy sensory motion preference. Chưa thể sign-off dynamic type/reflow, modal focus hay screen reader theo `PRD-UX-002/003` và design QA gate.

### R08 — P2: Build script Android còn lệch baseline architecture

[`package.json`](../../package.json) dòng 18–19 dùng EAS build Android. `TA-ADR-015`, mobile stack và release checklist quy định Gradle local cho Android, EAS Free chỉ iOS. Cần sửa pipeline/build instructions hoặc owner duyệt thay đổi tại file sở hữu; không coi script hiện tại là architecture authority.

## Coverage chức năng

“Một phần” nghĩa là có code nền tảng/local hoặc API subset; không có nghĩa requirement đã đạt E2E.

| Nhóm SOT                                     | Trạng thái               | Bằng chứng / phần còn thiếu                                                                                                                              |
| -------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account/login `PRD-ACC-001`                  | Một phần                 | Email/password local + Supabase gateway; thiếu sign-up/recovery/social entry, logout mọi device và native refresh proof                                  |
| Consent/child `PRD-ACC-002/003`              | Một phần                 | Backend consent/create/read/update; consumer onboarding/edit/delete/withdraw flow chưa đủ, create test chỉ development                                   |
| Parent Gate/account switch `PRD-ACC-004/005` | Một phần, có lỗi         | Gate route; query clear + SQLite account namespace đã có; R04/R05; media file/key isolation chưa hoàn chỉnh                                              |
| Onboarding/plan `PRD-PLAN-001..005`          | Chưa đủ                  | API lưu plan và dashboard summary; chưa goal discovery, initial-plan engine, progression/parent control và Today thật                                    |
| Content `PRD-CONT-001..006`                  | Một phần                 | Target/activity/lesson schema + graph validation; chưa approved corpus, publish admin, pack build/publish và modality QA evidence                        |
| Activity `PRD-ACT-001..010`                  | Chưa đủ                  | Legacy word/mouth/media và games; prototype handoff/transfer. Không có đầy đủ prepared activity runtime v2                                               |
| Auto Play `PRD-ACT-011`                      | Một phần, trái SOT       | Có pause/replay/timing; còn infinite loop R03                                                                                                            |
| Session `PRD-SES-001..005`                   | Một phần                 | Legacy session/player hooks; chưa Ready gate/checkpoint theo lesson generation + activation + atomic observation outbox                                  |
| Family media `PRD-MEDIA-001..005`            | Một phần                 | Capture/import/staging/preview/local cleanup; binding vẫn LearningItem, chưa child-target-activity, encryption, consent/quota/cloud finalize             |
| Progress `PRD-PROG-001..004`                 | Một phần                 | Backend observation ingest/supersession, dashboard latest; UI legacy vẫn new/practicing/familiar; chưa goal trend/recommendation/history correction flow |
| Subscription `PRD-SUB-001..003`              | Chưa đủ                  | Server projection read + synthetic 30-day fixture; chưa trial/store purchase/restore/reconcile, grants/keys và sandbox                                   |
| No ads `PRD-SUB-004`                         | Phù hợp qua rà soát code | Không thấy third-party ad integration; chưa store/privacy audit                                                                                          |
| Sync/cache `PRD-SYNC-001..005`               | Chưa đủ                  | Local database/media; chưa signed manifest/prefetch/install generation/outbox/activation reopen E2E                                                      |
| Notification `PRD-NOTIF-001..005`            | Chưa đủ                  | Không thấy local notification scheduler/preferences/tap orchestration; không có backend push là đúng scope                                               |
| Child/accessibility `PRD-UX-001..004`        | Một phần                 | Hai zone/tab, lock CTA qua gate, font/theme đúng; R03/R04/R06/R07 và QA native còn mở                                                                    |
| Privacy `PRD-PRIV-001..004`                  | Một phần                 | Inventory/export/delete local legacy; chưa server account/child/media export/delete, complete consent/legal/store flow                                   |
| Reliability/operations `PRD-NFR-*`           | Chưa đủ                  | API skeleton/tests/Prisma/Docker/CI có; chưa production crypto, telemetry adapters/Crashlytics, staging/backup/restore/SLO và release evidence           |
| AI Custom Library                            | Đúng khi chưa implement  | Post-release; không cần thêm để đạt v1                                                                                                                   |

## UI đánh giá

Đã phù hợp: background/palette/font Plus Jakarta Sans, rounded cards, max content width 460px, bottom tab hai mục, Parent settings/list hierarchy, child switch có name/selected state, locked copy trung tính, không mở paywall trực tiếp từ child ở flow đã xem.

Chưa phù hợp: Today allowed không có lesson/goal/duration/Ready/start CTA thật; learning navigation vẫn category/deck; dashboard chỉ count/last observation và legacy entries, thiếu plan/progress/download/subscription management routes. Prototype stimulus là text “Cốc nước”, không phải media activity production. Menu parent ở dưới fold cuộn được, không coi thiếu trong screenshot đầu màn là mất chức năng. Không có horizontal document overflow trong viewport thử không chứng minh toàn bộ large-text/modal/media layout đạt.

Mouth-video UI hiện tại chưa được chụp/chạy native trong lượt này; không dùng screenshot legacy có overlay để kết luận code player hiện tại còn overlay. Cần kiểm player thực tế trên thiết bị và media đã human-review.

## Thứ tự xử lý

### Kết quả triển khai tiếp theo yêu cầu đọc phần xử lý

- Mục 1: sửa từ C11, giữ nguyên kết quả đã ghi; native accessibility QA chưa xác nhận.
- Mục 2: auth đã có C12; [C16](./tasks/C16-account-media-storage-boundary.md) bổ sung storage/resolver theo account và sweep an toàn. Encryption/key/cloud scope vẫn mở.
- Mục 3: [C15](./tasks/C15-prepared-lesson-local-observation-slice.md) có luồng chạy thật bằng fixture local: Today → immutable PreparedLesson → functional communication → atomic SQLite observation/outbox/checkpoint → parent transfer → sync retry → parent local history. Restore sau reload ở đúng activity, paused; không tự phát/resume. Không mở đủ mười activity hoặc production corpus; media-dependent renderers/player/pack loader còn cần implement.
- Mục 4: **chưa mở production**. P0-01 và `TA-TBD-001/003/006` chưa có native AEAD/OS key proof; `TA-TBD-005` (grant TTL/grace/revoke) và `TA-TBD-007` (family key recovery) chưa chốt. Theo bước này và architecture §14, không thay bằng plaintext key, timer hay client subscription projection. Việc tiếp theo là crypto/device POC → quyết định policy → signed activation/key/pack/manifest/resolver tasks, rồi store billing. Đây là engineering + owner decisions, không chỉ credential. Local notification/privacy là các boundary riêng, chưa được coi là hoàn thành.
- Mục 5: giữ [owner checklist](./07-owner-input-checklist.md) là chỗ điền quyết định, [proof register](./06-phase-0-proof-register.md) ghi rõ web/SQLite evidence và native/staging/store còn mở. Không tự đổi SOT sang Approved.

Evidence C15: [kết quả browser](../../artifacts/lesson-runtime-web-results.json), [transfer 320](../../artifacts/runtime-transfer-320.png), [restore 320](../../artifacts/runtime-restored-320.png), [finish 390](../../artifacts/runtime-finished-390.png). Chromium 320/390/768px + **real Expo web SQLite**, API intercepted synthetic; không API call trong activity đoạn đo, không page errors/document overflow, mất acknowledgement retry giữ nguyên event ID/payload, hai observation xuất hiện trong Parent local history. Connection-close/reopen tests dùng SQLite thật trên Node; không gọi đây là native process-kill proof.

Validation cuối C15/C16: `pnpm check` pass **51 suites / 260 tests**, gồm default media, typecheck và lint. Prettier, local links và `git diff --check` pass. Không thay backend/API/schema server, chưa chạy live backend/store/native. Máy hiện chưa có thư mục Android prebuild và không tìm thấy `adb` trong PATH; không coi preflight hoặc Node SQLite là P0-01. Migration/rollback: database runtime riêng additive và media mới theo namespace; preserve database/outbox/file hiện có khi bỏ wiring, không reset hoặc chuyển semantics progress legacy. Không thêm dependency/service hoặc đổi SOT approval.

Phần baseline/thứ tự gốc dưới đây giữ để đối chiếu; status R01/R02 ở bảng đầu không có nghĩa chưa làm C15/C16 hoặc đã đạt release.

1. R03/R04/R06 và parser/accessibility fixes có thể làm ngay theo invariant, không đợi provider credential.
2. R05 auth refresh/lifecycle với tests phù hợp; account-bound media storage/key resolver trước cloud.
3. R01 vertical slice learning v2 với synthetic fixtures, atomic local observation/outbox và parent transfer; không đánh dấu corpus production Ready giả.
4. R02 signed/encrypted pack/activation sau crypto proof và policy owner; store billing/notification/privacy theo boundary task riêng.
5. Hoàn thành [owner-input checklist](./07-owner-input-checklist.md), proof register và release checklist; native/store/staging QA trước sign-off.

Không có migration runtime trong review. Các migration cần cho fixes/feature tiếp theo phải ghi ở task riêng, giữ nguyên semantics progress legacy, không chuyển “Đã quen” thành observation độc lập.

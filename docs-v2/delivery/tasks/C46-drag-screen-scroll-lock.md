# C46 — Khóa cuộn màn hình trong khi kéo vật

Implements: `PRD-ACT-012`, `PRD-UX-*`, `TA-ADR-005..006`.
Depends on: C45. Authorization: owner báo kéo vật làm trượt màn hình, yêu cầu cố định màn khi focus vật kéo (2026-11-05).

## Acceptance / implementation

- `DragPiece` chiếm responder từ khi giữ vật, khóa ScrollView của Screen hiện tại; không khóa cuộn khi chạm vùng khác. Web khai báo `touch-action: none` trước touchstart để browser không giành thao tác pan.
- Screen vẫn giữ nguyên ScrollView/vị trí hiện tại, chỉ đổi `scrollEnabled`; native cập nhật ngay khi nhận lock, React prop giữ đồng bộ. Không đổi layout/remount để giả khóa cuộn.
- Sau thả/hủy, disable/pause hoặc unmount vật, trả lock; nếu đang resolve tọa độ đích thì giữ khóa đến khi xử lý xong. Lock theo owner token, cleanup cũ không mở khóa gesture khác. Chặn native responder giành gesture, nhưng vẫn xử lý system touchCancel.
- Áp dụng chung cho mọi DragPiece trong các presentation game và bộ 5 từ; sai về nguồn/đúng gắn đích theo C45. Không API trong loop.

## Verification

Hook tests lock đồng bộ, nhiều owner, release lặp/cũ và unmount. Browser regression thêm wheel khi đang giữ vật, kiểm tra scroll offset không đổi và overflow phục hồi sau thả; mô phỏng touch tại 390px, touchCancel tại trò ghép đôi. Các viewport 320/768 dùng pointer. Native Android/iOS vẫn cần kiểm tra thiết bị thật.

## Migration / rollback / out of scope

Kết quả FE 2026-11-05: `pnpm typecheck`, `pnpm lint`, Prettier và `git diff --check` đạt. Jest toàn bộ đạt 68 suites / 320 tests, gồm 3 tests ScreenScrollLock mới. Không chạy BE/DB tests vì không đổi backend/persistence.

Browser đạt: 13 presentation scenarios và bộ 3 word games ở 320/390/768px, giữ scrollTop/scrollLeft khi wheel trong lúc đang kéo và phục hồi khả năng cuộn sau thả. 390px dùng CDP touchStart/touchMove/touchEnd, thêm touchCancel ở ghép đôi; 320/768px dùng mouse. Restore, quà/album và end-review vẫn đạt, không API trong loop/browser errors. Evidence: `artifacts/practice-feature/play-results.json`, `word-games-results.json`; assertions tại `scripts/drag-scroll-lock-web.cjs`. Metro local đã khởi động lại port 19006 để chạy kiểm tra.

Không BE/API/SQL/checkpoint migration, không dependency mới. Rollback context/controller, ScrollView props và gesture hooks trong ba file UI; không xóa progress/observation. Không sửa nội dung, ảnh, âm thanh, thưởng hoặc luồng nhận xét.

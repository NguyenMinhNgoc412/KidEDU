# C42 — Chuẩn hóa màn chơi theo Gentle Growth

Implements: `PRD-ACT-012`, `PRD-UX-*`, `TA-ADR-005..006`.
Depends on: C40/C41, design system §3/5/6/7 và accessibility spec.
Authorization: owner yêu cầu sửa các phát hiện design-system review (2026-11-04).

## Acceptance

- Không có nút bỏ bài dạng biểu tượng ở board/quà. Đưa thao tác vào màn tạm dừng có chữ rõ hậu quả, đặc biệt khi chưa chọn quà. Defer từ paused game commit đúng một revision và giữ review cuối phiên; paused review không được skip.
- Bóng gấu có outline primary như các bóng khác; outline so với surfaceAlt khoảng 4.8:1. Không dựa vào fill nhạt để phân biệt hình.
- Dùng `spacing`, `radii`, `gameSizes` thay số layout tùy ý. Geometry theo 8px, radius thuộc 12/18/24/32/pill. Không thay palette hoặc giới hạn Screen 460px.
- `GameControl` là Pressable chung cho ô hình/nguồn/đích/quà/tiếp tục: touch tối thiểu 56px, pressed/disabled cùng `KidButton`. Ô đã hoàn tất vẫn rõ hình, không bị dim như thao tác đang khóa.
- Album đọc tên tiếng Việt thay internal ID. Screen reader được báo chọn nguồn, thử ô khác và ghép đúng/số hình hoàn tất. Assistive selection có state và highlight; thao tác chính vẫn kéo trực tiếp.

## Verification / migration / rollback

Chạy frontend typecheck/lint/Jest, test defer từ paused game và restore; browser 320/390/768px kiểm tra pause/resume, image-only board, memory, kéo trực tiếp, quà và album. Native VoiceOver/TalkBack, Reduce Motion và touch/scroll vẫn cần device QA.

Không API/OpenAPI/SQL migration hoặc dependency mới. Rollback component/style và paused-defer branch, giữ checkpoint/reward readers C41 và dữ liệu gia đình. Không thay chương, bộ từ, billing hoặc hệ thống thưởng.

Executed 2026-11-04: frontend `pnpm check` đạt typecheck/lint/default media và 64 suites / 308 tests. Sau bổ sung test paused-defer, typecheck đạt và ba suite runtime/word-games/repository đạt 23 tests, gồm restore đúng một revision và không skip paused review. Browser `practice-word-games-web-smoke.cjs` đạt 320/390/768px, kiểm tra skip không nằm trên board, có trong pause và resume, kéo sai/đúng, quà, tên sticker tiếng Việt và album sau reload/sign-in; không API trong activity/review và không browser exception/DOM warning. Prettier, diff whitespace và documentation references đạt. Evidence cập nhật trong `artifacts/practice-feature/word-games-*`. Native accessibility/device QA chưa chạy.

# C45 — Kéo thả trực tiếp cho các trò chơi

Implements: `PRD-ACT-012`, `PRD-BR-006..008`, `TA-ADR-005..006`.
Depends on: C38–C44. Authorization: owner correction 2026-11-04: trò chơi kéo thả; riêng lật thẻ chạm để lật; sai về chỗ cũ, đúng gắn vào đích.

## Scope / acceptance

- Bỏ nút “Chọn Cá/Chó…”, “Đặt vào…” và luồng chạm nguồn–chạm đích trong presentation games của Cùng luyện. Bộ 5 từ: memory giữ chạm; tìm hình kéo vào hình mẫu, ghép kéo vào bóng khuyết. Cả hai giữ hình đúng trong ô, bỏ nguồn đã ghép, checkpoint như C43.
- Các presentation pair/sort, sequence/sentence, scene/turns dùng DragPiece và drop target chung: thả ngoài/sai trả về nguồn; đúng hiển thị tại đích. Sort nhận nhiều hình cùng giỏ; sequence chỉ nhận bước kế tiếp đúng. Scene giữ authored reply, không tự đánh giá lời trẻ; turns kéo bóng sang người tiếp theo. Hunt là mở thẻ nên vẫn chạm.
- Không có pointer/touch tap-to-select. Assistive alternative chỉ qua accessibility action, giữ accessible name/state; không xuất hiện nút chọn trong board. Modal hướng dẫn tìm hình đổi sang minh họa kéo.
- Drag release giữ hình tới khi đo xong vùng đích; reject trả về bằng spring không nảy, reduced motion trả ngay. Pause/unmount khi đo không được gắn hình; không phát sinh API request trong loop. Không suy game correctness thành observation ngôn ngữ.
- `playState` reject sai matches và sai thứ tự; dữ liệu cũ không đổi. Trong word-game find, các hình mẫu cùng hiện và có thể ghép theo bất kỳ thứ tự; vẫn ghi `found` duy nhất theo ID như schema v1.

## Verification

Pure matching/order/duplicate guards; hook tests vùng thả/đang đo thì pause/unmount. Browser kéo thật qua bộ 5 từ và 13 presentation scenarios ở 320/390/768px: tap không gắn, sai trở về tọa độ gốc, đúng gắn/hide nguồn, sort nhiều hình, thứ tự, thoại và chuyển lượt; cuối phiên vẫn parent review. Không lấy pointer Chromium làm bằng chứng native touch.

## Migration / rollback / out of scope

Kết quả browser 2026-11-04: `practice-play-web-smoke.cjs` đạt 13 scenarios × 320/390/768px (`play-results.json`); `practice-word-games-web-smoke.cjs` đạt 3 trò × 320/390/768px (`word-games-results.json`), có restore giữa trò tại 390px. Không API trong loop/browser errors. Đã xem screenshot feed/sequence/find ở 390px. `pnpm check:api` đạt 11 suites / 48 tests, generate/typecheck/lint/build. Không chạy DB integration vì không đổi schema/service persistence.

FE: media check/typecheck/lint đạt; Jest 67 suites / 317 tests đạt, gồm ba ca useDropTargets. `git diff --check` đạt. Docker local rebuild không hoàn tất: BuildKit báo `EROFS`/metadata filesystem chỉ đọc; kiểm tra ổ C còn khoảng 25 MB. Chưa thay container hiện hữu; hai mô tả chuẩn bị mới có trong source/build host nhưng chưa chạy trong Docker. Không xóa dữ liệu hoặc reset Docker để xử lý dung lượng trong task này.

Không API/SQL/checkpoint schema migration hoặc dependency mới. Backend chỉ đổi mô tả chuẩn bị ghép đôi/xếp lời cho đúng cơ chế kéo. Rollback renderer/reducer và metadata tương ứng, giữ dữ liệu gia đình và readers C43. Tiến độ chi tiết của presentation legacy ngoài bộ 5 từ vẫn theo baseline, không mở rộng persistence trong task gesture này. Không đổi luồng Học/media recognition, yes/no sở thích, audio, sticker collections hoặc chuyên môn nội dung; các phần đã owner để sau giữ nguyên.

# C44 — Ảnh một chủ thể và hướng dẫn đầu trò

Implements: `PRD-ACT-012`, `PRD-UX-*`, `TA-ADR-005..006`.
Depends on: C40–C43. Authorization: owner yêu cầu sửa PU-02/PU-03 ngày 2026-11-04.

## Scope / acceptance

- Bộ mẫu 5 từ dùng ảnh chỉ có bóng, gấu bông, xe đồ chơi, bánh hoặc ly sữa; không người/vật phụ. Atlas nền trong suốt 2×2, 4 frame, 400ms/frame, chạy hữu hạn rồi về frame tĩnh; tiếp tục dùng reduce motion/lifecycle hiện có.
- Thay ảnh trong `WordSprite` của bộ trò và album; không thay toàn bộ catalog/media của luồng Học. Bóng khuyết bánh/sữa đổi theo chủ thể mới. Source/prompts tại `assets/word-game-art`, built-in image_gen; là development candidates, chưa được duyệt chuyên môn.
- Khi bắt đầu mỗi trò hiện modal nền mờ với minh họa thao tác và hướng dẫn ngắn. Chạm bất kỳ vùng nào để đóng; Back Android đóng qua `onRequestClose`. Board bị pause khi hướng dẫn mở; không tính lượt/chọn đáp án khi đóng.
- Trong cùng màn phiên, pause/resume không hiện lại hướng dẫn đã đóng. Restore trò có phần đang làm không chèn hướng dẫn. Phiên mới vẫn có hướng dẫn; đây là trạng thái giao diện, không thêm schema checkpoint.

## Owner deferral

PU-01/audio để lập kế hoạch sau. PU-05 không thay số thẻ hoặc timing 350ms. PU-04/phần thưởng hiện là thử nghiệm; các bộ sưu tập sticker và nâng cấp thưởng sẽ làm sau, không mở rộng đợt này.

## Verification

Typecheck/lint/Jest và browser 320/390/768px: hướng dẫn từng trò, chạm nền đóng, không lật thẻ khi đóng, pause/resume, restore giữa trò, toàn bộ game/quà/album/end-review. Kiểm tra ảnh thật từng atlas và ảnh runtime. Native touch/screen reader/process kill vẫn cần thiết bị thật.

## Migration / rollback / risks

Kết quả 2026-11-04: `pnpm check` đạt media/typecheck/lint và 66 suites / 314 tests. Browser smoke đạt 320/390/768px, có ảnh `word-games-guide-memory/find/match-*.png`; chạm đóng hướng dẫn không lật thẻ phía sau, pause/resume không hỏi lại, restore phần đang chơi tại 390px và quà/album/end-review vẫn đạt. Không API trong game hoặc browser errors. Đã xem cả 5 atlas và screenshot runtime 320/390px. `git diff --check` đạt. Không chạy lại BE vì không đổi BE/API/schema.

Không BE/API/SQL migration, không dependency mới. Rollback registry ảnh về baseline và bỏ modal/props; checkpoint/progress không đổi. Ảnh AI cần human content QA trước production; generation không đồng nghĩa publish/duyệt chuyên môn. Không thay entitlement, quan sát của phụ huynh hoặc thu dữ liệu trẻ.

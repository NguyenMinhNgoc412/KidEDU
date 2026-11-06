# C41 — Màn chơi bằng hình và album sticker

Superseded recovery detail: C43 adds per-piece durable progress, independent renderers and artwork fallback/retry; earlier C41 evidence covers the original round-level implementation.

Implements: `PRD-ACT-012`, `PRD-BR-006..008`, `PRD-UX-*`, `TA-ADR-005..006`.
Depends on: C36, C40 và runtime SQLite/checkpoint sync hiện có.
Authorization: owner yêu cầu bỏ chữ trên ô chơi, lật sai tự úp, dùng frame chuyển động nhẹ, kéo vào bóng khuyết và chọn hộp quà nhận sticker sưu tập (2026-11-04).

## Acceptance và behavior

- Ô memory là hình/logo lá, không có nút/chữ “Lật thẻ”. Mở sai cặp tự úp sau 350 ms, khóa chạm trong lúc chờ để không mở thẻ thứ ba. Cặp đúng giữ mở. Pause/unmount hủy timer; không cần chạm thẻ mới để úp cặp sai.
- Tìm hình hiển thị hình mẫu và các ô hình, không tên từ/nút “Chọn”. Tên và trạng thái vẫn dành cho screen reader.
- Ghép hình hiển thị toàn bộ bóng khuyết và khay hình. Kéo trực tiếp, đúng thì dính vào ô, sai thì trở lại khay. Không có bước bấm chọn rồi bấm ô cho thao tác thông thường. Assistive activation vẫn cho phép chọn nguồn và kích hoạt đích.
- Màn chơi ẩn tiêu đề dài, danh sách từ, hướng dẫn parent và nút chữ không cần thiết. Dùng biểu tượng tiến độ, tiếp tục, pause/skip; Parent Gate và review cuối phiên vẫn rõ chữ trong Parent Zone.
- Tái dùng sprite sheet 8 frame có sẵn; một chu kỳ nhẹ, không chạy vô hạn; Reduce Motion giữ hình tĩnh, pause/background ngừng playback và không tự phát tiếp khi foreground.
- Hoàn tất ba trò, bé chọn một trong ba hộp quà bằng hình. Một lựa chọn duy nhất cho mỗi activity trong phiên; nhận sticker trong bộ sưu tập năm hình, không mua/quay trả phí hoặc mở quyền học.
- Gift choice là optional `gameStickers` trong session/checkpoint; ghi SQLite trước khi UI xác nhận. Album local lấy DISTINCT qua tất cả session của child trong account DB. Server trả `stickers` DISTINCT từ tất cả checkpoint của child, độc lập giới hạn 30 checkpoint resume; vẫn xem/sync sau expiry. Không tạo observation từ game/reward.

## Verification

Unit: memory lock/settle, gift prerequisites/idempotence, restore; real SQLite collection survive finished sessions/reopen/deduplicate/child isolation; API validates enum/rounds and immutable choices; PostgreSQL integration checks collection after expiry. Browser: image-only board, automatic mismatch closure, picture selection, wrong/right pointer drag, three-box choice, final review and checkpoint/album sync at 320/390/768px. Artifact: `artifacts/practice-feature/word-games-*` after actual execution.

Native touch/scroll, VoiceOver/TalkBack, device lifecycle và content/human QA vẫn là release gate; không coi pointer drag Chromium là chứng cứ thiết bị thật.

Executed 2026-11-04: `pnpm check` đạt 64 suites / 308 tests với default-media validation/typecheck/lint. Sau thay đổi cuối về namespace collection, `pnpm typecheck` và 8 hook tests đều đạt. API typecheck/lint/build đạt, unit đạt 11 suites / 47 tests; PostgreSQL integration đạt 4 suites / 6 tests, gồm gift immutable và album sau expiry. `node scripts/practice-word-games-web-smoke.cjs` đạt 320/390/768px: board không chữ, tự úp cặp sai, chọn hình, kéo sai/đúng bằng pointer, chọn hộp, lưu reward, nhận xét/sync, album còn sau reload và đăng nhập lại. Không activity-loop API, browser exception hoặc React DOM-prop warning. Local web identity cần đăng nhập lại khi reload; kiểm tra này không khẳng định native session persistence. Screenshots và `word-games-results.json` đã ghi trong artifact directory.

## Migration / rollback / limits

Không SQL migration hoặc dependency mới: thêm optional checkpoint JSON và response field; checkpoint cũ không có gift vẫn đọc được. Giữ `gameStickers`/album reader khi rollback, ẩn bài mới trước khi bỏ renderer; không xóa dữ liệu gia đình. Bộ sticker ban đầu có năm hình mẫu, thu thập trùng được gộp; chưa có bản đồ chương hoặc bộ sticker production mới. Chương vẫn theo kế hoạch tiếp theo của C40.

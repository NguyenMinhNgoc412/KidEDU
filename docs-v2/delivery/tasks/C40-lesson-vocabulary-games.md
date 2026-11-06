# C40 — Một bài có bộ từ dùng chung qua nhiều trò chơi

2026-11-04: [C41](./C41-picture-first-games-and-sticker-album.md) supersedes the text-heavy board, two-choice matching layout and nonpersistent gift UI below. C41 adds the initial cross-session sticker album; chapters remain planned. C40 verification is historical evidence for its original implementation.

Implements: `PRD-ACT-012`, `PRD-BR-006`, `PRD-BR-008`, `TA-ADR-005..006`.
Dependency: C36 cuối phiên mới nhận xét, C37 sửa danh sách bài, C38 schema, C39 tương tác.
Authorization: owner yêu cầu trẻ chơi trực tiếp, thưởng sticker/hộp quà và nhiều trò dùng từ hôm nay (2026-11-04).

## Kế hoạch

1. C40: lesson chứa 3–5 target từ dùng chung cho lật thẻ tìm cặp, chọn hình theo từ và kéo hình vào ô. Không tạo ba lesson riêng. Phản hồi đúng/thử lại, sticker theo trò và quà cố định cuối bài. Checkpoint lưu số trò hoàn tất; parent nhận xét từng bài cuối phiên.
2. Nội dung tiếp theo: soạn bộ từ theo ngày/chủ đề và audio tiếng Việt được duyệt; thêm phân loại, tìm đồ trong cảnh, ghép câu theo readiness. Cùng bộ từ nhưng thay cơ chế/ngữ cảnh. Không ép trò không phù hợp với từ.
3. Hành trình tiếp theo: bản đồ chương, album sticker theo trẻ, huy hiệu theo bài/trò hoàn tất. Điều kiện mở chương do content soạn, không suy diễn mastery ngôn ngữ. Inventory sync idempotent theo account/child/lesson/version, có task/migration riêng.

## Acceptance C40

- Bài mẫu bóng/gấu/xe/bánh/sữa có ba trò trong cùng bài, cả ba dùng đúng bộ từ này.
- Memory có 10 thẻ; chỉ đúng cặp mới ghi nhận. Chọn sai không hoàn tất lượt; kéo sai không giữ hình ở ô sai. Có cách chạm chọn rồi chạm ô thay kéo.
- Một sticker mỗi trò, đủ ba trò mở quà cố định, không mua/quay ngẫu nhiên hoặc phạt lỗi.
- Xong ba trò mới tiếp tục bài, vẫn có dừng/bỏ bài. Không tạo observation tự động.
- Hoàn tất mỗi trò lưu SQLite checkpoint; sync API ngoài activity loop. Resume giữ trò đã xong và số sticker; trò đang dở chơi lại. Quà là giao diện của mốc hoàn tất, không cộng inventory riêng.
- Plan cũ giữ nguyên; parent có shortcut chọn bài 5 từ.

## Tests / migration / rollback / out of scope

Tests: reducer memory, runtime monotonic rounds/restore, schema/API bounds/monotonic, catalog parity; UI ba trò và thưởng qua browser 320/390/768px. Native touch/lifecycle/screen reader và human content QA vẫn là release gate.

Đã chạy 2026-11-04: `pnpm check` đạt 64 suites / 307 tests, media validation/typecheck/lint; `pnpm check:api` đạt 11 suites / 46 tests, typecheck/lint/build. `node scripts/practice-word-games-web-smoke.cjs` đạt 320/390/768px với Nest/JWKS/PostgreSQL thật: đủ ba trò, đáp án sai/thử lại, sticker/quà, nhận xét cuối phiên và sync; không gọi API trong game/review. 768px có pointer drag thật; các cỡ đều có chọn–đặt thay kéo. Evidence: `artifacts/practice-feature/word-games-results.json` và `word-games-*.png`. Bài mẫu chưa có audio yêu cầu cho các từ mới; người lớn có thể đọc lời mời, audio được duyệt thuộc bước nội dung tiếp theo.

Optional `wordGames` trong presentation và `gameRounds` trong checkpoint JSON; không SQL migration. Rollback ẩn lesson mới trước khi bỏ renderer, giữ reader checkpoint và dữ liệu gia đình. Không đổi provider. Chương/album xuyên phiên, nhiều bộ từ production, audio mới và tự chấm phát âm ngoài C40; bước 2/3 chưa tính hoàn tất.

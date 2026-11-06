# C43 — Khôi phục tiến độ trong trò, ảnh lỗi và renderer độc lập

Implements: `PRD-ACT-012`, `PRD-BR-006..008`, `TA-ADR-005..006`.
Depends on: C40–C42 và lesson runtime/checkpoint API hiện có.
Authorization: owner yêu cầu sửa phát hiện pattern review: pause mất phần đang chơi, ảnh lỗi thiếu recovery và controller nhiều trò gắn cứng (2026-11-04).

## Acceptance

- Mọi thao tác làm thay đổi trạng thái hợp lệ đi qua pure step reducer → runtime → SQLite checkpoint, không gọi API trong game. Memory giữ thẻ đang mở/cặp đúng; tìm hình giữ từ đã tìm; kéo thả giữ hình đã đặt đúng. Không lưu tọa độ kéo dở hoặc trạng thái hover.
- Pause có thể unmount board; renderer nhận lại progress từ session khi resume. Local reopen và cloud restore giữ đúng phần đã làm. Cặp sai đang mở tiếp tục tự úp sau resume, không làm mất cặp đúng. Observation vẫn do parent ở cuối phiên.
- Optional `gameProgress` là map activity-ID → schema v1 có `memoryOpen`, `memoryMatched`, `found`, `placed`. Giới hạn số lượng/độ dài/unique, validate references với prepared content khi restore. Server không cho xóa phần đã hoàn tất bằng checkpoint revision mới.
- Artwork có loading/ready/error, timeout 8s, pause/unmount hủy timeout, late onLoad không làm hình lỗi tự bật lại. Error/timeout dùng silhouette tĩnh có nghĩa; parent pause có retry bằng remount, giữ progress. Không log URL, thêm provider hoặc gọi API sửa media trong vòng chơi.
- `TodayWordGames` chỉ điều phối step registry, tiến độ và reward. Memory/find/match, album/reward, artwork readiness và pure step rules tách riêng. Schema v1 hiện có ba step; mở rộng protocol/content version phải cập nhật contract tương ứng, không thêm engine/service lớn.

## Tests

Pure rules và restore qua pause/cloud; SQLite per-piece checkpoint/reopen/isolation/no fabricated observation; artwork hook timeout/error/late event/pause/retry; API bounds/monotonic và PostgreSQL JSON persistence. Browser kiểm tra phần làm dở giữ qua pause ở cả ba trò, reload/sign-in giữa trò kéo thả, nhận quà/album và end-review ở 320/390/768px. Không coi browser/hook test là native device QA.

## Kết quả kiểm tra 2026-11-04

- `pnpm check`: typecheck/lint/media checks đạt, 66 suites / 314 tests.
- `pnpm check:api`: generate/typecheck/lint/build đạt, 11 suites / 48 tests.
- `pnpm --filter @kidedu/api test:db` với PostgreSQL local: 4 suites / 6 tests.
- `node scripts/practice-word-games-web-smoke.cjs`: Chromium + Nest/JWKS/PostgreSQL đạt ở 320/390/768px; pause/resume từng trò, kéo thả thật, quà/album và nhận xét cuối phiên. Reload/sign-in giữa trò được chạy ở 390px; album reload ở cả ba kích thước. Không request API trong vòng chơi, không browser errors. Evidence: `artifacts/practice-feature/word-games-results.json` và `word-games-restored-progress-390.png`.
- `git diff --check` đạt. Chưa chạy trên thiết bị iOS/Android thật; native process kill, VoiceOver/TalkBack và sensory settings vẫn cần device QA.

## Migration / rollback / out of scope

Không SQL migration: thêm optional field JSON, OpenAPI/generated DTO và schema readers. Snapshot cũ không có progress vẫn đọc được; phần chưa từng lưu trước C43 bắt đầu lại trò đang dở. Rollback phải giữ reader `gameProgress` và server merge/monotonic guard, ẩn entry mới nếu renderer không hỗ trợ; không reset dữ liệu gia đình. Không thay bài/từ, reward authority, entitlement, provider hoặc production content gate.

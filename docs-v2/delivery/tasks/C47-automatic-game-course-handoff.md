# C47 — Tự chuyển trò/bài, phụ huynh nhận xét cuối phiên

Implements: `PRD-ACT-012`, `PRD-BR-006..008`, `TA-ADR-005..006`.
Depends on: C36, C43–C46. Authorization: owner yêu cầu bỏ bấm “tạo cơ hội”/chờ giữa trò, hoàn thành đúng tự qua bài, chỉ nhận xét cuối phiên (2026-11-05).

## Acceptance / implementation

- Presentation games không hiển thị nút “Đã tạo cơ hội, chờ con”, chờ hết timer hay bấm sang bài. Hoàn thành thao tác đã soạn → phản hồi ngắn → tự checkpoint và sang bài; hết phiên mới Parent Gate và nhận xét từng bài theo C36. Không tự tạo observation từ game completion.
- Pair/sort hoàn tất mọi matches; sequence/sentence đúng toàn bộ thứ tự; hunt mở hết thẻ; scene hoàn tất authored dialogue; turns hoàn tất một vòng trao đổi (mỗi bên một lượt). Không diễn giải hành động thành năng lực ngôn ngữ. Scene tự qua câu tiếp sau phản hồi.
- Bộ 5 từ tự chuyển trò khi hoàn thành; vẫn cho bé chọn hộp quà, giữ sticker hiển thị ngắn rồi tự sang bài/nhận xét cuối phiên. Bỏ các mũi tên xác nhận trò và footer hoàn tất bài. Sticker không bị claim lại.
- `finish_play` kiểm tra activity ID, phase và trạng thái hoàn tất theo pure rules, chống callback cũ/sai/đúp. Reuse completeCourseLesson và checkpoint transaction; entitlement boundary trong useLessonSession vẫn áp dụng.
- Timer UI hữu hạn, pause/unmount/busy/error hủy timer; resume tiếp tục feedback trước khi chuyển. Không bỏ qua nội dung đang làm sai/dở; Parent có thể pause/để lúc khác khi con chưa sẵn sàng.
- Không đổi các hoạt động cần quan sát với đồ/người thật ngoài presentation game; các bước parent-guided có requirement riêng.

## Tests

Pure completion của 7 cơ chế, partial/wrong/stale callback/paused không qua bài; đủ 13 bài mới vào review, giữ attempts qua restore và không tạo observation. Hook tests single handoff/cancel/resume. Browser thực hiện đủ 13 bài và bộ 5 từ bằng thao tác chơi, không defer hoặc bấm xác nhận để qua; kiểm tra Parent Gate chỉ cuối phiên, nhận xét/sync và scroll lock như C46.

## Migration / rollback / out of scope

Kết quả 2026-11-05: `pnpm check` đạt media/typecheck/lint và 70 suites / 324 tests. Browser 320/390/768px đạt đủ 13 presentation games và bộ 3 word games, tự chuyển qua hết phần học rồi mới Parent Gate/nhận xét; harness không còn dùng defer hoặc nút xác nhận để đi tiếp. Scroll lock/touchCancel, quà/album/restore và sync cuối phiên vẫn đạt; không API trong loop hoặc browser errors. Evidence: `artifacts/practice-feature/play-results.json`, `word-games-results.json`; đã xem screenshot feed 390px không còn footer/parent panel giữa bài. Prettier và `git diff --check` đạt. Chưa chạy trên điện thoại thật; không chạy BE/DB tests vì không đổi BE/API/schema.

Không API/SQL/checkpoint schema migration, dependency mới hoặc backend runtime change. Action hoàn tất là local, course attempts theo schema hiện có. Snapshot presenting/waiting cũ vẫn đọc; trò hoàn tất được checkpoint trước khi hiển thị bài kế. Rollback controller/timer/rules action, giữ attempts/sticker/observations đã commit. Không đổi production content, audio, reward collection hoặc rubric; không chấm nói tự động.

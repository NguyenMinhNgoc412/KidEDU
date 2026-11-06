# C49 — Chọn loại quà, mở box và chuông hoàn thành bài

Implements: `PRD-ACT-012`, `PB-PLAY-01`, `PRD-UX-*`, `TA-ADR-005..007`, `TA-ADR-024`.
Dependency: C40–C47 và phần reward trong C48. Authorization: owner yêu cầu triển khai hai lựa chọn Mảnh ghép/Sticker và tạo sound chúc mừng nhẹ khi hoàn thành một bài, ngày 2026-11-05.

## Behavior / acceptance

- Mỗi presentation game hoàn thành hoặc mỗi round của bộ từ → hai lựa chọn Mảnh ghép/Sticker → một hộp kín → chạm mở → nhận một món đúng loại → feedback 2.2 giây → tự tiếp tục. Bộ từ giữ thêm hộp cuối bài. Không yêu cầu parent xác nhận giữa trò; nhận xét từng bài chỉ sau toàn phiên.
- Ba chủ đề sticker × sáu món, hai tranh × bốn mảnh; artwork SVG/icon gốc theo theme hiện có. Album giữ cả sticker cũ. Mảnh nhận được tự hiện trên preview; chưa có thao tác chơi ghép lại trong album.
- Candidates được gán ổn định trước khi chọn; ưu tiên sticker chưa có và mảnh thiếu của tranh đang ghép. Khi cả hai tranh đủ mảnh, lựa chọn mảnh mới bị khóa. Mọi chủ đề đều có trong pool; không suy đoán giới tính hoặc khóa chủ đề.
- `pendingReward` giữ bước chọn/mở; receipt theo activity+slot immutable, chống bấm mở lặp và giữ qua restore/sync. Local transaction hiện có, không API trong loop, collection query theo đúng child/account. Receipt không là observation, quyền hoặc tiền tệ.
- Chuông gốc `assets/practice-fixtures/lesson-complete-v1.wav`: PCM mono 44.1kHz, 950ms, ba nốt mềm, không lời, không sample ngoài. Tái tạo bằng `scripts/build-lesson-chime.py`; JSON ghi SHA/provenance. Phát một lần khi mở quà cuối bài, không phát mỗi round; theo `sfxEnabled` (mặc định tắt), nhãn cài đặt là Âm hiệu. Pause/background/unmount dừng; restored revealed receipt không tự phát lại. Lỗi SFX không giữ UI.

## Boundaries / migration / rollback

Optional JSON fields trong SQLite/checkpoint; OpenAPI/generated client cập nhật. Không SQL migration, dependency/provider hoặc API mới. Backend giữ receipt đã nhận và candidates cùng slot không đổi qua revision. Inventory family data vẫn đọc được khi hết subscription.

Rollback UI phải giữ reader/inventory cho optional reward fields và không chạy client cũ ghi đè document mất receipts. Asset có version riêng, không thay asset congratulations cũ. Nguồn content vẫn là development fixture theo owner; chưa tuyên bố production content đã duyệt. Không triển khai canonical word audio, preference presets, manual puzzle replay hoặc chapter progression trong task này.

## Verification

Xem kết quả kiểm tra cập nhật cuối task. Native listening/device QA và browser/real PostgreSQL end-to-end là gate riêng; không coi unit tests là thay thế.

Kết quả 2026-11-05:

- FE: media readiness, typecheck, lint đạt; Jest toàn bộ 72 suites / 329 tests đạt, sau đó thêm kiểm tra toàn chuỗi ba round + hộp cuối bài và chạy lại nhóm reward 3/3 đạt. Real SQLite kiểm chứng inventory/child isolation và không tạo outbox observation; hook audio kiểm chứng bật/tắt, phát một lần, pause và restore.
- BE: typecheck/lint đạt, 11 suites / 49 tests đạt; build đã đạt trước khi thêm test cuối (runtime code không đổi). Schema parity và immutable receipt/candidate được kiểm tra. OpenAPI generated client đã tái tạo.
- WAV: 0.95 giây, peak -19.51 dBFS, không sample clipping, SHA khớp provenance. Chưa nghe/QA trên máy iOS/Android thật.
- Browser thực hiện được ba word games và ba hộp/reveal trên 320px, đã mở xem screenshot hộp và preview tranh. Harness gặp lúc round cuối chuyển ngay sang panel quà cuối bài: đổi chờ panel detach thành chờ receipt detach; chưa xác nhận lại end-to-end sau sửa vì hạ tầng lỗi. Không ghi nhận browser E2E pass cho C49.
- Docker build image thành công nhưng recreate container thất bại: `metadata.db: read-only file system`; ổ C chỉ còn khoảng 1MB sau build. PostgreSQL cũng báo filesystem chỉ đọc. DB integration 4 suites thất bại ở khởi tạo fixture; browser rerun dừng tại API plan 500. API Docker đang chạy chưa cập nhật C49. Không xóa/reset Docker, database hoặc dữ liệu người dùng. Cần khôi phục dung lượng/filesystem Docker trước khi chạy lại real-DB/browser integration.
- Prettier và `git diff --check` đạt. Chỉ cập nhật detailed spec/contracts/task/index/changelog cho phần reward owner đã yêu cầu, không thay architecture hoặc SOT boundary.

# KidEDU SOT — CHANGELOG

Tất cả thay đổi quan trọng của bộ Source of Truth được ghi tại file này.

Format dùng theo hướng đơn giản:

- ngày thay đổi;
- version tài liệu;
- nhóm thay đổi;
- các file bị ảnh hưởng;
- lý do thay đổi.

---

## [0.3.0] — 2026-07-04

### Added

- Thêm `09-design-system-sot.md` làm SOT cho design system và visual direction.
- Thêm quy tắc bắt buộc đọc `09-design-system-sot.md` và mở ảnh trong `screenshots/` khi làm task giao diện/UI/UX.
- Thêm nhiệm vụ `T-011 — Design system alignment pass` trong `08-codex-task-splitting-sot.md`.
- Bổ sung mapping ảnh reference cho Child Mode, Child word list, Child study, media upload và Parent word list.

### Changed

- Cập nhật workflow chia task Codex để task UI luôn có input design system + screenshots.
- Cập nhật prompt template Codex để nhắc rõ yêu cầu đọc `09` và ảnh reference khi task có UI.

### Affected files

- `README.md`
- `AGENTS.md`
- `08-codex-task-splitting-sot.md`
- `09-design-system-sot.md`
- `screenshots/`

### Reason

Chuẩn hóa cách Codex triển khai giao diện theo design system Gentle Growth và ảnh tham chiếu, tránh tự tạo phong cách UI lệch khỏi định hướng sản phẩm.

---

## [0.2.0] — 2026-07-01

### Changed

- Đổi entry point của bộ SOT từ `00-sot-index.md` sang `README.md`.
- Tách lịch sử thay đổi SOT sang file `CHANGELOG.md`.
- Cập nhật quy tắc đọc tài liệu: mọi task phải đọc `README.md` trước.
- Cập nhật hướng dẫn Codex để không còn trỏ tới `00-sot-index.md`.

### Removed

- Loại bỏ vai trò canonical entry point của `00-sot-index.md` để tránh trùng lặp với README.

### Affected files

- `README.md`
- `CHANGELOG.md`
- `08-codex-task-splitting-sot.md`
- `kidedu-sot-pack.zip`

### Reason

Dùng `README.md` làm điểm vào chính giúp bộ tài liệu giống cấu trúc dự án chuẩn hơn. Dùng `CHANGELOG.md` giúp theo dõi lịch sử thay đổi SOT rõ ràng, tránh nhồi lịch sử vào file index hoặc file nghiệp vụ/kỹ thuật.

---

## [0.1.0] — 2026-07-01

### Added

- Tạo bộ SOT đầu tiên cho KidEDU mobile MVP.
- Tách business và technical documentation thành các file riêng.
- Tách các nghiệp vụ/kỹ thuật phức tạp thành file riêng để dễ giao task cho Codex.

### Files

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `03-business-auto-play-deck-sot.md`
- `04-business-parent-content-management-sot.md`
- `05-tech-mobile-stack-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `08-codex-task-splitting-sot.md`

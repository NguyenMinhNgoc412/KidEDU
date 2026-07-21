# KidEDU SOT — CHANGELOG

Tất cả thay đổi quan trọng của bộ Source of Truth được ghi tại file này.

Format dùng theo hướng đơn giản:

- ngày thay đổi;
- version tài liệu;
- nhóm thay đổi;
- các file bị ảnh hưởng;
- lý do thay đổi.

---

## [0.5.0] — 2026-07-21

### Added

- Đưa BIZ-016 “Quyền riêng tư & kiểm soát dữ liệu” vào P1.
- Bổ sung tổng quan dữ liệu local và trạng thái quyền camera, micro, thư viện ảnh/video mà không tự hiện permission prompt.
- Bổ sung ba thao tác có xác nhận riêng: xóa lịch sử học, xóa toàn bộ media cá nhân hóa và đặt lại toàn bộ dữ liệu app.
- Bổ sung module `privacy`, repository aggregate/mutation transaction, post-commit file cleanup và query/session reset.
- Bổ sung startup recovery sweep cho file app-owned không còn DB reference, bao gồm bảo vệ avatar/thumbnail và giới hạn concurrency cleanup.
- Bổ sung task `T-013 — Privacy & Data Controls P1` cùng acceptance và yêu cầu test/device smoke.

### Changed

- Làm rõ reset-all phải reseed nội dung/cài đặt mặc định hiện hành, khóa Parent Gate và quay về Child Mode.
- Làm rõ xóa/reset trong app không thể xóa backup đã lưu ngoài app hoặc tự thu hồi permission do hệ điều hành quản lý.

### Affected files

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `08-codex-task-splitting-sot.md`

### Reason

Owner duyệt làm Privacy & Data Controls ở P1 để phụ huynh hiểu và chủ động kiểm soát dữ liệu local của trẻ trước khi dự án cân nhắc backend hoặc các luồng chia sẻ khác.

---

## [0.4.0] — 2026-07-20

### Added

- Đưa BIZ-012 “Sao lưu & khôi phục local” vào P1 trước backend.
- Bổ sung luồng nghiệp vụ tạo tệp, preview, xác nhận replace-all và giữ nguyên dữ liệu cũ khi restore lỗi.
- Bổ sung module `backup`, custom binary container `.kidedu` v1 streaming theo chunk 512 KB, logical snapshot 11 bảng, relative media path, offset/size/CRC32 và restore transaction/rollback.
- Bổ sung `expo-document-picker` `~14.0.8` và `expo-sharing` `~14.0.8` cho chọn/chuyển tệp thủ công.
- Bổ sung task `T-012 — Local backup & restore P1` cùng acceptance và yêu cầu test/device smoke.

### Changed

- Chuyển export/backup media khỏi danh sách tối ưu sau MVP và quy định budget, chunked I/O, staging cleanup, disk/memory safety cho P1.
- Làm rõ share sheet chỉ dùng chuyển tệp local theo thao tác phụ huynh; không mở rộng sang cloud sync, backend, tài khoản online hoặc chia sẻ công khai.

### Affected files

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `05-tech-mobile-stack-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `08-codex-task-splitting-sot.md`

### Reason

Owner duyệt làm BIZ-012 ở P1 để phụ huynh có cách bảo vệ và chuyển dữ liệu local trước khi dự án cân nhắc backend hoặc đồng bộ online.

---

## [0.3.3] — 2026-07-15

### Added

- Bổ sung font loading bằng `expo-font` và `@expo-google-fonts/plus-jakarta-sans` để app dùng đúng Plus Jakarta Sans theo design system.
- Bổ sung `expo-blur` cho Parent Gate/modal backdrop theo design system.

### Changed

- Làm rõ ngoại lệ typography: riêng từ/cụm từ mục tiêu trong màn Child study và Auto Play được phép viết hoa để tăng tập trung và khớp ảnh reference.

### Affected files

- `05-tech-mobile-stack-sot.md`
- `09-design-system-sot.md`

### Reason

Đồng bộ implementation UI với design system Gentle Growth, đồng thời giải quyết mâu thuẫn giữa quy tắc tránh All-Caps và ảnh reference màn học.

---

## [0.3.2] — 2026-07-15

### Added

- Bổ sung `expo-video-thumbnails` vào media stack để tạo thumbnail tĩnh cho video khẩu hình custom.

### Affected files

- `05-tech-mobile-stack-sot.md`

### Reason

Đồng bộ tech stack với media pipeline local-first: danh sách chỉ hiển thị thumbnail, không render video trực tiếp.

---

## [0.3.1] — 2026-07-04

### Changed

- Cập nhật timeline Auto Play: phát hết video/audio mẫu trước khi chuyển sang lượt trẻ nói.
- Cố định giai đoạn trẻ nói theo là 5 giây trong MVP.
- Cố định khoảng sau khi trẻ nói trước khi sang thẻ tiếp theo là 1 giây; nếu bật phản hồi thì phản hồi nằm trong khoảng này.
- Làm rõ preset tốc độ không được rút ngắn thời gian trẻ nói theo.

### Affected files

- `03-business-auto-play-deck-sot.md`

### Reason

Đồng bộ SOT với yêu cầu vận hành Auto Play mới: không chuyển sang phần trẻ nói khi video mẫu chưa phát hết và đảm bảo trẻ luôn có đủ 5 giây để nói theo.

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

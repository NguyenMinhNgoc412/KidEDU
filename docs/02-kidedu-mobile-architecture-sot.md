# KidEDU SOT 02 — Mobile Architecture Overview

**Trạng thái:** Source of Truth chính cho kiến trúc tổng quan  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-01  
**Phạm vi:** Mobile app MVP / Phase 0–1  
**Ghi chú:** File này chỉ mô tả architecture ở mức tổng quan. Tech stack chi tiết nằm ở `05-tech-mobile-stack-sot.md`. Data/media chi tiết nằm ở `06-tech-local-data-media-sot.md`. Performance/cache/memory nằm ở `07-tech-performance-cache-memory-sot.md`.

---

## 1. Kết luận kiến trúc đã chốt

KidEDU MVP là **mobile app local-first**.

Thiết kế tổng quan:

```text
Mobile App
  ├── App Shell & Navigation
  ├── Child Learning Experience
  ├── Auto Play Deck Experience
  ├── Parent Area
  ├── Content Management
  ├── Progress Tracking
  ├── Media Playback
  ├── Media Management
  ├── Local Data Layer
  └── Local File Storage
```

MVP không có:

- backend;
- login/register online;
- cloud sync;
- marketplace;
- AI speech scoring;
- web admin.

---

## 2. Architecture goals

1. **Mobile-first:** ưu tiên trải nghiệm trên thiết bị mobile thật, đặc biệt Android.
2. **Offline-first/local-first:** trẻ vẫn học được khi không có mạng.
3. **Media-aware:** video, ảnh động và audio là core của app, nên architecture phải xử lý media cẩn thận.
4. **Low-friction for child:** màn hình học cho trẻ phải ít thao tác và phản hồi nhanh.
5. **Parent-controlled:** mọi thay đổi nội dung nằm trong khu phụ huynh.
6. **Modular:** mỗi nhóm nghiệp vụ có module riêng để dễ giao Codex implement.
7. **Performance-conscious:** không render hoặc preload media quá mức.
8. **Testable:** nghiệp vụ autoplay, media resolver, repository và progress phải test được độc lập.

---

## 3. Layer tổng quan

### 3.1. Presentation layer

Chịu trách nhiệm:

- routes/screens;
- layout;
- component UI;
- interaction của trẻ/phụ huynh;
- hiển thị trạng thái loading/error/empty;
- gọi hook hoặc service phù hợp.

Presentation layer không tự xử lý business rule phức tạp và không truy cập trực tiếp storage.

### 3.2. Feature modules

Mỗi feature lớn có module riêng:

| Module | Trách nhiệm |
|---|---|
| `learning` | Màn hình học từng thẻ |
| `deck` | Danh sách bộ học, chi tiết bộ học, sắp xếp thẻ trong bộ |
| `autoPlay` | Phiên học tự chạy theo bộ |
| `parent` | Khu phụ huynh, Parent Gate, dashboard quản lý |
| `media` | Chọn, xem trước, thay, xóa nội dung ảnh/video/audio |
| `progress` | Ghi nhận và hiển thị tiến độ cơ bản |
| `settings` | Cài đặt tốc độ học, lặp vòng, âm thanh, hành vi học |

### 3.3. Domain/service layer

Chịu trách nhiệm xử lý logic dùng chung:

- chọn media nào sẽ được phát cho một thẻ;
- điều phối phiên học tự chạy;
- validate dữ liệu trước khi lưu;
- xử lý lifecycle phát video/audio;
- ghi nhận tiến độ;
- kiểm tra quyền vào khu phụ huynh;
- cleanup dữ liệu/media không còn dùng.

### 3.4. Data layer

Chịu trách nhiệm:

- đọc/ghi metadata nội dung học;
- đọc/ghi bộ học;
- đọc/ghi tiến độ;
- đọc/ghi cài đặt;
- quản lý mapping giữa bản ghi nội dung và file media trên thiết bị.

Data layer không quyết định UI hiển thị như thế nào.

### 3.5. Local file layer

Chịu trách nhiệm:

- lưu file ảnh/video/audio do phụ huynh thêm;
- tách file tạm và file đã lưu bền vững;
- tạo và lưu thumbnail nếu cần;
- xóa file không còn được sử dụng;
- đảm bảo app không đọc file đã mất hoặc hỏng mà không xử lý fallback.

---

## 4. Module boundaries

### 4.1. Learning module

Learning module chỉ tập trung vào trải nghiệm học một thẻ:

- hiển thị hình minh họa;
- phát khẩu hình/video;
- phát audio mẫu;
- nút phát lại;
- chuyển bài nếu được gọi từ deck hoặc autoplay;
- ghi nhận lượt luyện cơ bản.

Không xử lý form phụ huynh, upload media hoặc schema data trực tiếp.

### 4.2. Auto Play module

Auto Play module điều phối một phiên học tự chạy:

- nhận bộ học;
- xác định danh sách thẻ cần phát;
- điều phối thứ tự hiển thị;
- điều phối giai đoạn phát mẫu, chờ trẻ nói, chuyển bài;
- pause/resume/stop;
- báo sự kiện cho progress module.

Chi tiết nghiệp vụ nằm trong `03-business-auto-play-deck-sot.md`.

### 4.3. Parent module

Parent module quản lý:

- Parent Gate;
- dashboard phụ huynh;
- entry point tới quản lý thẻ, bộ học, media, tiến độ và cài đặt.

Parent module không tự xử lý media pipeline chi tiết; nó gọi media module/service.

### 4.4. Media module

Media module quản lý toàn bộ nội dung ảnh/video/audio:

- chọn hoặc quay nội dung;
- preview;
- validate;
- lưu;
- thay thế;
- xóa;
- fallback về nội dung mặc định;
- resolve nội dung sẽ dùng khi học.

Chi tiết kỹ thuật nằm trong `06-tech-local-data-media-sot.md` và `07-tech-performance-cache-memory-sot.md`.

### 4.5. Progress module

Progress module ghi nhận:

- lượt xem thẻ;
- lượt hoàn thành phiên học;
- lần học gần nhất;
- trạng thái do phụ huynh đánh dấu.

MVP không có scoring tự động.

---

## 5. Data flow tổng quan

### 5.1. Read flow

```text
Screen
  -> Feature hook
  -> Domain service nếu cần
  -> Repository
  -> Local data store
  -> UI render
```

Ví dụ: màn hình danh sách bộ học đọc danh sách bộ học qua repository, sau đó render danh sách.

### 5.2. Mutation flow

```text
Parent form/action
  -> Validate input
  -> Domain/media service nếu có file
  -> Repository ghi metadata
  -> Invalidate/read refresh
  -> UI báo thành công/thất bại
```

Ví dụ: phụ huynh thay video cho thẻ, app phải validate file, lưu file, cập nhật metadata, rồi màn hình học dùng video mới.

### 5.3. Auto Play flow

```text
Parent/Child chọn bộ học
  -> Auto Play session khởi tạo
  -> Resolve nội dung cho thẻ hiện tại
  -> Phát minh họa/video/audio
  -> Chờ trẻ nói theo
  -> Ghi nhận event
  -> Chuyển thẻ tiếp theo
  -> Kết thúc hoặc lặp lại
```

---

## 6. Navigation zones

App chia thành hai vùng trải nghiệm chính:

### 6.1. Child zone

Dành cho trẻ:

- màn hình học từng thẻ;
- màn hình học theo bộ tự chạy;
- danh sách bộ học đơn giản nếu cần;
- nút lớn, ít chữ, ít thao tác.

### 6.2. Parent zone

Dành cho phụ huynh:

- Parent Gate;
- quản lý thẻ;
- quản lý bộ học;
- quản lý media cá nhân hóa;
- tiến độ;
- cài đặt.

Child zone không được lẫn thao tác xóa/sửa nội dung.

---

## 7. Data ownership tổng quan

| Nhóm dữ liệu | Owner module | Ghi chú |
|---|---|---|
| Hồ sơ trẻ | `progress` / `settings` | MVP có thể bắt đầu đơn giản |
| Thẻ học | `learning` + data repository | Parent module tạo/sửa, learning module hiển thị |
| Bộ học | `deck` | Auto Play dùng deck làm input |
| Media asset | `media` | Bao gồm default/custom/generated |
| Phiên học | `autoPlay` / `learning` | Dùng để ghi nhận progress |
| Tiến độ | `progress` | Không chứa AI scoring |
| Cài đặt | `settings` | Tốc độ học, lặp vòng, âm thanh |

---

## 8. Error handling tổng quan

App phải xử lý tốt các lỗi thường gặp:

1. Thẻ thiếu video nhưng còn ảnh/audio.
2. Thẻ thiếu ảnh nhưng còn video/audio.
3. File cá nhân hóa bị xóa hoặc không đọc được.
4. Phụ huynh chọn file quá dài hoặc không phù hợp.
5. Phiên học bị pause/thoát giữa chừng.
6. App vào background trong lúc đang phát video/audio.
7. Danh sách thẻ/bộ học rỗng.

Nguyên tắc chung:

- Không crash.
- Ưu tiên fallback về nội dung hợp lệ còn lại.
- Báo lỗi rõ trong khu phụ huynh.
- Không hiển thị thông báo kỹ thuật khó hiểu cho trẻ.

---

## 9. Testing strategy tổng quan

| Nhóm test | Mục tiêu |
|---|---|
| Unit test | Kiểm tra service, resolver, timing, progress calculation |
| Component test | Kiểm tra component học, card, form, empty/error state |
| Integration test | Kiểm tra flow lưu thẻ, thay media, đọc lại nội dung |
| E2E test | Kiểm tra luồng phụ huynh tạo nội dung và trẻ học theo bộ |
| Manual device test | Kiểm tra playback, memory, background/foreground, thiết bị Android yếu |

Chi tiết tooling nằm trong `05-tech-mobile-stack-sot.md`.

---

## 10. Tài liệu chi tiết liên quan

Khi implement, đọc thêm:

- Business tổng quan: `01-kidedu-business-sot.md`
- Auto Play nghiệp vụ: `03-business-auto-play-deck-sot.md`
- Parent/content nghiệp vụ: `04-business-parent-content-management-sot.md`
- Tech stack: `05-tech-mobile-stack-sot.md`
- Local data/media: `06-tech-local-data-media-sot.md`
- Lazy load/cache/memory: `07-tech-performance-cache-memory-sot.md`
- Chia task Codex: `08-codex-task-splitting-sot.md`

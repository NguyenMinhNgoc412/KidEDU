# KidEDU SOT 02 — Mobile Architecture Overview

**Trạng thái:** Source of Truth chính cho kiến trúc tổng quan  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-08-06
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
  ├── Review Activities (Mini Test & Mini-games)
  ├── Parent Area
  ├── Content Management
  ├── Progress Tracking
  ├── Local Backup & Restore
  ├── Privacy & Data Controls
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
9. **Privacy-controlled:** phụ huynh xem được dữ liệu/quyền local và mọi thao tác xóa phải có phạm vi rõ, transaction an toàn và xác nhận riêng.

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

| Module     | Trách nhiệm                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `learning` | Màn hình học từng thẻ                                                                              |
| `deck`     | Danh sách bộ học, chi tiết bộ học, sắp xếp thẻ trong bộ                                            |
| `autoPlay` | Phiên học tự chạy theo bộ                                                                          |
| `review`   | Mini test theo tuổi, ghép hình và lật thẻ sau bộ; điều phối câu hỏi/cấp và phản hồi sensory-safe   |
| `parent`   | Khu phụ huynh, Parent Gate, dashboard quản lý                                                      |
| `media`    | Chọn, xem trước, thay, xóa nội dung ảnh/video/audio                                                |
| `progress` | Ghi nhận và hiển thị tiến độ cơ bản                                                                |
| `settings` | Cài đặt tốc độ học, lặp vòng, âm thanh, hành vi học                                                |
| `backup`   | Tạo, kiểm tra, xem trước và khôi phục tệp sao lưu local có version                                 |
| `privacy`  | Tổng quan dữ liệu local, trạng thái quyền thiết bị và các thao tác xóa/reset do phụ huynh chủ động |

### 3.3. Domain/service layer

Chịu trách nhiệm xử lý logic dùng chung:

- chọn media nào sẽ được phát cho một thẻ;
- điều phối phiên học tự chạy;
- validate dữ liệu trước khi lưu;
- xử lý lifecycle phát video/audio;
- ghi nhận tiến độ;
- tạo câu mini test theo tuổi, chọn hình nhiễu local và điều phối phiên mini-game theo đặc tả `10`/`11`;
- kiểm tra quyền vào khu phụ huynh;
- cleanup dữ liệu/media không còn dùng;
- tạo logical snapshot, kiểm tra version/checksum và điều phối restore có rollback.
- tổng hợp số liệu dữ liệu local và điều phối xóa lịch sử/media/reset mà không để DB ở trạng thái ghi một phần.

### 3.4. Data layer

Chịu trách nhiệm:

- đọc/ghi metadata nội dung học;
- đọc/ghi bộ học;
- đọc/ghi tiến độ;
- đọc tuổi hồ sơ và ghi trạng thái mini test đã làm/chưa làm ở cấp bộ mà không lưu đáp án từng câu;
- đọc/ghi cài đặt;
- quản lý mapping giữa bản ghi nội dung và file media trên thiết bị;
- export/import logical snapshot bằng transaction, không thay thế trực tiếp file SQLite.
- xóa lịch sử, gỡ media cá nhân hóa và reset dữ liệu bằng transaction theo đúng quan hệ khóa ngoại.

Data layer không quyết định UI hiển thị như thế nào.

### 3.5. Local file layer

Chịu trách nhiệm:

- lưu file ảnh/video/audio do phụ huynh thêm;
- tách file tạm và file đã lưu bền vững;
- tạo và lưu thumbnail nếu cần;
- xóa file không còn được sử dụng;
- đảm bảo app không đọc file đã mất hoặc hỏng mà không xử lý fallback;
- quản lý staging, tệp `.kidedu` và media được khôi phục bằng đường dẫn local mới.

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
- entry point tới quản lý thẻ, bộ học, media, tiến độ, cài đặt và sao lưu dữ liệu.
- entry point tới quyền riêng tư, trạng thái quyền thiết bị và kiểm soát dữ liệu local.

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

### 4.6. Backup module

Backup module chịu trách nhiệm:

- tạo tệp sao lưu local `.kidedu` có version từ logical snapshot và media cá nhân hóa;
- dùng đường dẫn tương đối trong tệp sao lưu, không mang theo URI tuyệt đối của thiết bị nguồn;
- kiểm tra version, cấu trúc và checksum trước khi cho phép khôi phục;
- cung cấp dữ liệu preview để phụ huynh xác nhận;
- điều phối restore kiểu replace-all bằng staging, transaction và rollback;
- cleanup tệp tạm và làm mới read cache sau khi restore thành công.

Backup module không thực hiện cloud sync, upload nền, chia sẻ công khai hoặc quản lý tài khoản. Việc chuyển tệp do phụ huynh chủ động qua picker/share sheet của hệ điều hành.

### 4.7. Privacy module

Privacy module chịu trách nhiệm:

- đọc tổng quan dữ liệu local từ repository mà không tạo một source of truth mới;
- đọc trạng thái hiện tại của quyền camera, micro và thư viện ảnh/video mà không tự hiện permission prompt;
- mở trang cài đặt hệ thống khi phụ huynh muốn thay đổi quyền;
- điều phối xóa lịch sử học, xóa media cá nhân hóa và reset toàn bộ dữ liệu;
- cleanup file local sau khi DB transaction đã commit;
- reset query cache và khóa lại Parent Gate sau reset toàn bộ.

Privacy module không chứa analytics/telemetry, không gửi dữ liệu ra mạng và không thể xóa bản backup mà phụ huynh đã lưu bên ngoài vùng dữ liệu của app.

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

### 5.4. Backup và restore flow

```text
Parent chọn tạo backup
  -> Backup service đọc logical snapshot
  -> Stream metadata + media vào tệp .kidedu có version/checksum
  -> Parent tự lưu hoặc chuyển tệp qua hệ điều hành

Parent chọn tệp restore
  -> Copy vào staging và kiểm tra version/cấu trúc/checksum
  -> Hiển thị preview
  -> Parent xác nhận replace-all
  -> Copy media sang durable storage với URI mới
  -> Restore logical data trong một transaction
  -> Commit, cleanup dữ liệu cũ và refresh query cache
```

Nếu bất kỳ bước nào trước commit thất bại, app rollback transaction, xóa staging/media mới chưa dùng và giữ nguyên dữ liệu local hiện tại.

### 5.5. Privacy/data-control flow

```text
Parent mở Privacy & Data Controls
  -> Query tổng quan dữ liệu local
  -> Đọc trạng thái quyền thiết bị, không request quyền
  -> Parent chọn một thao tác xóa
  -> UI giải thích phạm vi và yêu cầu xác nhận riêng
  -> Repository mutation trong transaction
  -> Commit DB
  -> Cleanup file liên quan best-effort
  -> Reset query cache và làm mới màn hình
```

Nếu DB mutation lỗi, app rollback và không xóa file đang còn được dữ liệu hiện tại tham chiếu. Nếu cleanup file sau commit lỗi, DB vẫn là source of truth và cleanup orphan được thử lại ở thời điểm an toàn.

---

## 6. Navigation zones

App chia thành hai vùng trải nghiệm chính:

### 6.1. Child zone

Dành cho trẻ:

- màn hình học từng thẻ;
- màn hình học theo bộ tự chạy;
- mini test và menu mini-game sau khi hoàn thành bộ;
- danh sách bộ học đơn giản nếu cần;
- nút lớn, ít chữ, ít thao tác.

### 6.2. Parent zone

Dành cho phụ huynh:

- Parent Gate;
- quản lý thẻ;
- quản lý bộ học;
- quản lý media cá nhân hóa;
- tiến độ;
- cài đặt;
- sao lưu và khôi phục local.
- quyền riêng tư và kiểm soát dữ liệu local.

Child zone không được lẫn thao tác xóa/sửa nội dung.

---

## 7. Data ownership tổng quan

| Nhóm dữ liệu             | Owner module                 | Ghi chú                                                                 |
| ------------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| Hồ sơ trẻ                | `progress` / `settings`      | MVP có thể bắt đầu đơn giản                                             |
| Thẻ học                  | `learning` + data repository | Parent module tạo/sửa, learning module hiển thị                         |
| Bộ học                   | `deck`                       | Auto Play dùng deck làm input                                           |
| Media asset              | `media`                      | Bao gồm default/custom/generated                                        |
| Phiên học                | `autoPlay` / `learning`      | Dùng để ghi nhận progress                                               |
| Phiên ôn tập cuối bộ     | `review`                     | Mini test/mini-game local; không lưu điểm hoặc đáp án chi tiết          |
| Tiến độ                  | `progress`                   | Không chứa AI scoring                                                   |
| Cài đặt                  | `settings`                   | Tốc độ học, lặp vòng, âm thanh                                          |
| Tệp sao lưu local        | `backup`                     | Snapshot có version, metadata và media dùng đường dẫn tương đối         |
| Tổng quan quyền riêng tư | `privacy`                    | Dữ liệu suy ra từ repository và permission API; không lưu bản sao riêng |

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
8. Tệp sao lưu sai định dạng, không tương thích hoặc checksum không khớp.
9. Thiết bị không đủ dung lượng để tạo hoặc khôi phục bản sao lưu.
10. Restore bị gián đoạn trước khi transaction hoàn tất.
11. Permission API không khả dụng hoặc phụ huynh đã chặn hỏi lại.
12. Xóa/reset DB thành công nhưng một số file local chưa cleanup được.

Nguyên tắc chung:

- Không crash.
- Ưu tiên fallback về nội dung hợp lệ còn lại.
- Báo lỗi rõ trong khu phụ huynh.
- Không hiển thị thông báo kỹ thuật khó hiểu cho trẻ.

---

## 9. Testing strategy tổng quan

| Nhóm test          | Mục tiêu                                                               |
| ------------------ | ---------------------------------------------------------------------- |
| Unit test          | Kiểm tra service, resolver, timing, progress calculation               |
| Component test     | Kiểm tra component học, card, form, empty/error state                  |
| Integration test   | Kiểm tra flow lưu thẻ, thay media, đọc lại nội dung                    |
| E2E test           | Kiểm tra luồng phụ huynh tạo nội dung và trẻ học theo bộ               |
| Manual device test | Kiểm tra playback, memory, background/foreground, thiết bị Android yếu |

Backup cần unit test cho format/version/checksum, integration test cho replace-all và rollback, cùng manual device test với tệp có media lớn và picker/share sheet thật.

Privacy/data controls cần unit test cho phạm vi từng mutation và rollback, test permission mapping không hiện prompt, component/hook test cho confirm/mutex/cache refresh, cùng manual device test cho trang cài đặt hệ thống và xóa file thật.

Review activities cần unit test cho số lựa chọn 2/4/6 theo tuổi, chọn câu/hình nhiễu, tiến trình cấp game và trạng thái hoàn thành; component/device test phải kiểm tra khóa chạm khi audio đang phát, drag/drop không bị scroll chiếm gesture, audio không chồng và layout tối đa 6 hình trên thiết bị nhỏ.

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
- Chia task Codex: `08-Agent-task-splitting-sot.md`
- Mini-game đã duyệt: `10-minigame-discussion.md`
- Mini test đã duyệt: `11-minitest-discussion.md`

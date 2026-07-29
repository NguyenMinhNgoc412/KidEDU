# KidEDU SOT — README

**Trạng thái:** Source of Truth chính của dự án  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-04  
**Phạm vi:** Mobile app MVP / Phase 0–1  
**Ngôn ngữ:** Tiếng Việt

---

## 1. Mục đích

Bộ tài liệu SOT này là nguồn tham chiếu chính thức để thiết kế sản phẩm, chia task và implement KidEDU.

KidEDU là ứng dụng mobile hỗ trợ trẻ chậm nói luyện phát âm tại nhà bằng:

- video hoặc animation khẩu hình miệng;
- hình ảnh hoặc ảnh động minh họa;
- âm thanh phát âm rõ ràng;
- bộ thẻ học tự chạy như playlist;
- nội dung cá nhân hóa do phụ huynh tự thêm.

README này là **file phải đọc đầu tiên** trước khi đọc các file SOT còn lại.

---

## 2. Quy tắc đọc tài liệu

### 2.1. Khi bắt đầu một task bất kỳ

Luôn đọc theo thứ tự:

1. `README.md`
2. `01-kidedu-business-sot.md`
3. `02-kidedu-mobile-architecture-sot.md`
4. File chi tiết liên quan tới task
5. `CHANGELOG.md` nếu cần biết lịch sử thay đổi gần đây

### 2.2. Khi làm task nghiệp vụ

Đọc thêm các file business chi tiết:

- `03-business-auto-play-deck-sot.md` nếu làm chế độ bộ thẻ tự chạy;
- `04-business-parent-content-management-sot.md` nếu làm khu phụ huynh, quản lý thẻ, bộ học hoặc nội dung cá nhân hóa.

### 2.3. Khi làm task kỹ thuật

Đọc thêm các file technical chi tiết:

- `05-tech-mobile-stack-sot.md` nếu setup app, dependency, framework hoặc library;
- `06-tech-local-data-media-sot.md` nếu làm database, file local, media import hoặc media resolver;
- `07-tech-performance-cache-memory-sot.md` nếu làm lazy load, cache, playback, list performance hoặc quản lý bộ nhớ.

### 2.4. Khi giao task cho AI Agent

Đọc thêm:

- `08-AI Agent-task-splitting-sot.md`

File này chỉ dùng để chia task và viết prompt implement. Nó không được dùng để thay đổi nghiệp vụ hoặc kiến trúc.

### 2.5. Khi làm task giao diện / UI / UX

Sau khi đọc các file bắt buộc ở mục 2.1, đọc thêm theo thứ tự:

1. `09-design-system-sot.md`
2. Ảnh tham chiếu liên quan trong thư mục `screenshots/`
3. File nghiệp vụ hoặc kỹ thuật chi tiết liên quan tới màn hình/chức năng đang làm

`09-design-system-sot.md` là Source of Truth cho visual direction, màu sắc, typography, spacing, shape, component style và nguyên tắc phân biệt Child Mode với Parent Zone.

Ảnh trong `screenshots/` là reference bắt buộc khi code giao diện. AI Agent/dev phải mở và quan sát ảnh tương ứng với màn hình hoặc chức năng đang sửa để match layout, hierarchy, component state, spacing, màu sắc và hành vi hiển thị.

Các ảnh tham chiếu hiện có:

- `screenshots/01-home-childmode.JPG` — màn chọn nhóm ở Child Mode.
- `screenshots/02-Child-Word-List.JPG` — danh sách từ trong Child Mode.
- `screenshots/03-child-study-screen.JPG` — màn học/thẻ đang phát.
- `screenshots/04-media-upload.JPG` — form thêm thẻ và upload media.
- `screenshots/05-parent-word-list.JPG` — danh sách/quản lý từ ở Parent Zone.

---

## 3. Danh sách tài liệu SOT

| File | Vai trò | Khi nào cần đọc |
|---|---|---|
| `README.md` | Entry point, quy tắc đọc, bản đồ tài liệu, quyết định đã chốt | Luôn đọc đầu tiên |
| `CHANGELOG.md` | Lịch sử thay đổi SOT theo version/ngày | Khi cần kiểm tra tài liệu đã đổi gì |
| `01-kidedu-business-sot.md` | Mô tả sản phẩm, feature, nghiệp vụ bằng ngôn ngữ business | Khi làm bất kỳ feature nào |
| `02-kidedu-mobile-architecture-sot.md` | Thiết kế tổng quan mobile architecture | Khi setup hoặc thay đổi kiến trúc app |
| `03-business-auto-play-deck-sot.md` | Nghiệp vụ chi tiết chế độ bộ thẻ tự chạy | Khi làm màn hình tự học, playlist, autoplay |
| `04-business-parent-content-management-sot.md` | Nghiệp vụ khu phụ huynh, quản lý thẻ/bộ học/nội dung cá nhân hóa | Khi làm parent area hoặc quản lý nội dung |
| `05-tech-mobile-stack-sot.md` | Tech stack mobile đã chốt | Khi setup dependency hoặc chọn library |
| `06-tech-local-data-media-sot.md` | Local data, media storage, schema, media pipeline | Khi làm database, file local hoặc media upload |
| `07-tech-performance-cache-memory-sot.md` | Lazy load, state management, cache, memory management | Khi làm list, media playback, autoplay hoặc tối ưu app |
| `08-AI Agent-task-splitting-sot.md` | Cách chia task cho AI Agent | Khi bắt đầu một đợt implement |
| `09-design-system-sot.md` | Design system, visual direction, màu sắc, typography, spacing, shape, component style | Khi làm bất kỳ task giao diện/UI/UX nào |

---

## 4. Ranh giới nghiệp vụ và kỹ thuật

### 4.1. File nghiệp vụ chỉ được mô tả

- Mục tiêu sản phẩm.
- Nhóm người dùng.
- Hành vi mong muốn.
- Luồng sử dụng.
- Quy tắc nghiệp vụ.
- Trạng thái nội dung theo cách phụ huynh hiểu.
- MVP scope và out-of-scope.
- Acceptance criteria ở mức hành vi.

File nghiệp vụ **không mô tả framework, database, thư viện, folder structure, cache implementation hoặc code pattern**.

### 4.2. File kỹ thuật chỉ được mô tả

- Mobile architecture.
- Module/layer.
- Tech stack.
- Data/media architecture.
- Performance, cache, lazy load, memory.
- Testing strategy.
- Gợi ý chia module và contract kỹ thuật.

File kỹ thuật **không tự thêm feature mới** ngoài file nghiệp vụ.

---

## 5. Quy tắc ưu tiên khi tài liệu mâu thuẫn

1. `01-kidedu-business-sot.md` quyết định sản phẩm làm gì.
2. `02-kidedu-mobile-architecture-sot.md` quyết định kiến trúc tổng quan.
3. Các file `03` đến `07` quyết định chi tiết trong phạm vi của mình.
4. `09-design-system-sot.md` quyết định visual system và UI implementation style trong phạm vi giao diện.
5. Ảnh trong `screenshots/` quyết định hình tham chiếu cụ thể cho layout/component/state của màn hình tương ứng.
6. `08-AI Agent-task-splitting-sot.md` chỉ dùng để chia việc, không được thay đổi nghiệp vụ.
7. `README.md` quyết định cách đọc, cách dùng và danh sách tài liệu trong bộ SOT.
8. `CHANGELOG.md` chỉ ghi lịch sử thay đổi, không thay thế nội dung SOT chính.

---

## 6. Quyết định sản phẩm đã chốt

1. KidEDU MVP là **mobile app**.
2. MVP ưu tiên **offline/local-first**.
3. MVP **không có backend**.
4. MVP **không có đăng nhập online**.
5. MVP **không có AI chấm phát âm**.
6. Trẻ học bằng **thẻ học** và **bộ thẻ tự chạy**.
7. Phụ huynh có thể **cá nhân hóa nội dung** bằng video/ảnh/audio của người thân.
8. Trẻ ít thao tác nhất có thể; app phải tự phát và tự chuyển bài trong chế độ luyện tự động.
9. Nội dung ảnh động và âm thanh phải thu hút nhưng không gây quá tải giác quan.
10. Khu phụ huynh phải có Parent Gate đơn giản.

---

## 7. Quy tắc update SOT

Khi thay đổi tài liệu SOT:

1. Chỉ sửa file đúng phạm vi.
2. Không thêm feature/tech decision mới nếu chưa được duyệt.
3. Nếu thêm, xóa hoặc đổi tên file SOT, phải cập nhật `README.md`.
4. Nếu thay đổi quyết định sản phẩm, kiến trúc, tech stack hoặc cách chia task, phải cập nhật `CHANGELOG.md`.
5. Không duplicate nội dung chi tiết giữa nhiều file; README chỉ là bản đồ và quy tắc đọc.

---

## 8. Quy tắc cho AI Agent/dev

1. Trước khi implement task, đọc `README.md`, `01`, `02` và file chi tiết liên quan.
2. Không tự thêm business idea mới.
3. Nếu phát hiện cần thay đổi nghiệp vụ, ghi rõ: ý tưởng, lý do, ảnh hưởng, rủi ro, rồi chờ duyệt.
4. Mỗi task phải có output nhỏ, test được, không gom quá nhiều phạm vi.
5. Sau khi thay đổi hành vi hoặc kiến trúc, cập nhật đúng file SOT liên quan và `CHANGELOG.md` nếu quyết định thay đổi.
6. Không đưa backend, cloud sync, login online, AI scoring vào MVP nếu chưa được duyệt.
7. Với feature media/video/ảnh, luôn kiểm tra performance và memory theo file `07`.
8. Với mọi task giao diện, đọc `09-design-system-sot.md` và mở ảnh liên quan trong `screenshots/` trước khi code UI.

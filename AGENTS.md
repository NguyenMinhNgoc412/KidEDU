# AGENTS.md — Hướng dẫn cho AI Agent khi làm việc với KidEDU

## 1. Vai trò của file này

File này là hướng dẫn bắt buộc cho AI Agent/dev agent khi đọc tài liệu, chia task và implement trong dự án KidEDU.

`README.md` là entry point và Source of Truth chính về cách đọc bộ tài liệu SOT. Trước khi làm bất kỳ task nào, AI Agent phải tuân thủ thứ tự đọc và ranh giới được mô tả trong file này.

---

## 2. Tổng quan dự án

KidEDU là mobile app MVP hỗ trợ trẻ chậm nói luyện phát âm tại nhà bằng:

- video hoặc animation khẩu hình miệng;
- hình ảnh hoặc ảnh động minh họa;
- âm thanh phát âm rõ ràng;
- bộ thẻ học tự chạy như playlist;
- mini test và mini-game ngắn sau khi học xong bộ;
- nội dung cá nhân hóa do phụ huynh tự thêm.

Trọng tâm MVP là trải nghiệm học đơn giản, ít thao tác cho trẻ, ưu tiên offline/local-first và không phụ thuộc backend.

---

## 3. Thứ tự đọc tài liệu bắt buộc

Khi bắt đầu bất kỳ task nào, AI Agent bắt buộc phải sử dụng công cụ đọc file (File-read/Search tools) để nạp nội dung theo thứ tự sau:

1. `README.md`
2. `01-kidedu-business-sot.md`
3. `02-kidedu-mobile-architecture-sot.md`
4. File chi tiết liên quan trực tiếp tới task
5. `CHANGELOG.md` nếu cần kiểm tra lịch sử thay đổi gần đây

Riêng với task giao diện/UI/UX, sau bước 3 AI Agent phải đọc `09-design-system-sot.md` trước, sau đó mở ảnh liên quan trong thư mục `screenshots/`, rồi mới đọc tiếp file chi tiết nghiệp vụ/kỹ thuật của màn hình hoặc chức năng đang làm.

Không bắt đầu implement chỉ dựa trên prompt task nếu chưa đọc các file SOT bắt buộc.

---

## 4. File cần đọc theo loại task

### 4.1. Task nghiệp vụ / product behavior

Đọc thêm:

- `03-business-auto-play-deck-sot.md` nếu làm chế độ bộ thẻ tự chạy, màn hình tự học, playlist hoặc autoplay.
- `04-business-parent-content-management-sot.md` nếu làm khu phụ huynh, quản lý thẻ, bộ học hoặc nội dung cá nhân hóa.
- `10-minigame-discussion.md` nếu làm ghép hình hoặc lật thẻ.
- `11-minitest-discussion.md` nếu làm mini test nghe và chọn hình.

### 4.2. Task kỹ thuật / implementation

Đọc thêm:

- `05-tech-mobile-stack-sot.md` nếu setup app, dependency, framework hoặc library.
- `06-tech-local-data-media-sot.md` nếu làm database, local file, media import, media resolver hoặc media pipeline.
- `07-tech-performance-cache-memory-sot.md` nếu làm lazy load, cache, playback, list performance hoặc quản lý bộ nhớ.

### 4.3. Task chia việc cho AI Agent

Đọc thêm:

- `08-Agent-task-splitting-sot.md`

File `08` chỉ dùng để chia task và viết prompt implement. Không dùng file này để thay đổi nghiệp vụ hoặc kiến trúc.

### 4.4. Task giao diện / UI / UX

Đọc thêm:

- `09-design-system-sot.md` trước khi code bất kỳ UI nào.
- Ảnh tham chiếu liên quan trong thư mục `screenshots/`.

Quy tắc bắt buộc:

- Nếu làm màn Child Mode, danh sách từ, màn học, upload media hoặc Parent Zone, phải mở ảnh tương ứng trong `screenshots/` trước khi sửa UI.
- Khi ảnh và code hiện tại khác nhau, ưu tiên bám `09-design-system-sot.md` và ảnh reference, miễn là không mâu thuẫn với nghiệp vụ trong `01`/`03`/`04`.
- Không tự sáng tạo phong cách giao diện mới nếu chưa có trong `09` hoặc ảnh reference.
- Mini test/mini-game hiện chưa có screenshot reference riêng: bắt buộc dùng `09` cùng `10`/`11`, tạo screenshot kiểm chứng và xin owner review thay vì tự thêm mechanic/visual ngoài đặc tả.
- Nếu hệ thống môi trường hiện tại không cho phép AI tự động đọc file ảnh local, AI Agent phải chủ động yêu cầu user upload/cung cấp ảnh screenshot đó vào khung chat trước khi tiến hành code UI. Tuyệt đối không tự tưởng tượng ra giao diện nếu chưa nhìn thấy reference.

Ảnh tham chiếu hiện có:

- `screenshots/01-home-childmode.JPG` — màn chọn nhóm ở Child Mode.
- `screenshots/02-Child-Word-List.JPG` — danh sách từ trong Child Mode.
- `screenshots/03-child-study-screen.JPG` — màn học/thẻ đang phát.
- `screenshots/04-media-upload.JPG` — form thêm thẻ và upload media.
- `screenshots/05-parent-word-list.JPG` — danh sách/quản lý từ ở Parent Zone.

---

## 5. Quy tắc ưu tiên khi tài liệu mâu thuẫn

Khi các tài liệu có dấu hiệu mâu thuẫn, áp dụng thứ tự ưu tiên sau:

1. `01-kidedu-business-sot.md` quyết định sản phẩm làm gì.
2. `02-kidedu-mobile-architecture-sot.md` quyết định kiến trúc tổng quan.
3. Các file `03` đến `07` và đặc tả đã duyệt `10`/`11` quyết định chi tiết trong phạm vi của từng file.
4. `09-design-system-sot.md` quyết định design system, visual direction, component style, typography, spacing và shape cho giao diện.
5. Ảnh trong `screenshots/` quyết định reference cụ thể cho layout/component/state của màn hình tương ứng.
6. `08-Agent-task-splitting-sot.md` chỉ dùng để chia việc, không thay đổi nghiệp vụ.
7. `README.md` quyết định cách đọc, cách dùng và danh sách tài liệu SOT.
8. `CHANGELOG.md` chỉ ghi lịch sử thay đổi, không thay thế nội dung SOT chính.

Nếu vẫn chưa rõ, AI Agent phải dừng ở mức phân tích, ghi rõ mâu thuẫn và đề xuất hướng xử lý để owner duyệt.

---

## 6. Ranh giới MVP đã chốt

AI Agent không được tự ý thay đổi các quyết định sau:

1. KidEDU MVP là mobile app.
2. MVP ưu tiên offline/local-first.
3. MVP không có backend.
4. MVP không có đăng nhập online.
5. MVP không có AI chấm phát âm.
6. Trẻ học bằng thẻ học và bộ thẻ tự chạy.
7. Phụ huynh có thể cá nhân hóa nội dung bằng video/ảnh/audio của người thân.
8. Trẻ ít thao tác nhất có thể; app phải tự phát và tự chuyển bài trong chế độ luyện tự động.
9. Nội dung ảnh động và âm thanh phải thu hút nhưng không gây quá tải giác quan.
10. Khu phụ huynh phải có Parent Gate đơn giản.
11. Beta có mini test 2/4/6 hình theo tuổi, ghép hình 2–4 mảnh và lật thẻ 2–5 cặp theo các đặc tả `10`/`11`; không có điểm hoặc AI chấm phát âm.

---

## 7. Những việc AI Agent không được tự làm

AI Agent không được tự ý:

- thêm backend, cloud sync, tài khoản online hoặc login online vào MVP;
- thêm AI scoring/chấm phát âm nếu chưa được duyệt;
- mở rộng feature ngoài phạm vi file nghiệp vụ;
- đổi tech stack, database, framework hoặc library lớn nếu chưa có quyết định trong SOT;
- duplicate nội dung chi tiết giữa nhiều file SOT;
- sửa file nghiệp vụ để hợp thức hóa một quyết định kỹ thuật;
- sửa file kỹ thuật để thêm feature chưa được mô tả trong nghiệp vụ;
- gom nhiều phạm vi lớn vào một task implement;
- bỏ qua kiểm tra performance/memory khi xử lý video, ảnh, audio, list, autoplay hoặc cache.

Nếu phát hiện cần thay đổi nghiệp vụ hoặc kiến trúc, AI Agent chỉ được ghi đề xuất gồm:

- ý tưởng thay đổi;
- lý do;
- phạm vi ảnh hưởng;
- rủi ro;
- file SOT cần cập nhật;
- câu hỏi cần owner duyệt.

Không implement thay đổi đó trước khi được duyệt.

---

## 8. Nguyên tắc implement

Mỗi task implement phải:

- có phạm vi nhỏ, rõ ràng và test được;
- bám đúng nghiệp vụ đã có trong SOT;
- không thêm business idea mới;
- không đổi architecture nếu task không yêu cầu;
- giữ code đơn giản, dễ đọc, phù hợp mobile MVP;
- tách phần business logic, data/media logic và UI theo architecture đã chốt;
- với UI, bám `09-design-system-sot.md` và ảnh trong `screenshots/` thay vì tự tạo phong cách mới;
- ưu tiên local-first/offline behavior;
- xử lý lỗi theo hướng an toàn, dễ hiểu cho phụ huynh và không làm trẻ bị kẹt luồng học;
- cân nhắc performance, cache, memory với mọi phần có media hoặc list.

---

## 9. Checklist trước khi sửa code

Trước khi sửa code, AI Agent phải tự kiểm tra:

- Đã đọc `README.md`, `01-kidedu-business-sot.md`, `02-kidedu-mobile-architecture-sot.md` chưa?
- Task này thuộc file chi tiết nào trong `03` đến `07`, `10` hoặc `11`?
- Nếu là task giao diện, đã đọc `09-design-system-sot.md` và mở ảnh liên quan trong `screenshots/` chưa?
- Có cần đọc `08-Agent-task-splitting-sot.md` để chia nhỏ task không?
- Có cần đọc `CHANGELOG.md` để kiểm tra quyết định mới gần đây không?
- Task có đụng tới backend, login online, cloud sync hoặc AI scoring không?
- Task có đụng tới media/video/ảnh/audio/cache/list/autoplay không?
- Có acceptance criteria rõ ràng chưa?
- Có rủi ro mâu thuẫn giữa nghiệp vụ và kỹ thuật không?

Nếu thiếu thông tin quan trọng, AI Agent phải ghi rõ giả định thay vì tự quyết định ngầm.

---

## 10. Checklist sau khi sửa code

Sau khi sửa code, AI Agent phải báo cáo:

- file đã thay đổi;
- hành vi đã implement;
- cách test hoặc lệnh test đã chạy;
- rủi ro còn lại, nếu có;
- SOT nào cần cập nhật, nếu có thay đổi hành vi, kiến trúc, tech stack hoặc cách chia task.

Nếu có thay đổi quyết định sản phẩm, kiến trúc, tech stack hoặc cách chia task, phải cập nhật đúng file SOT liên quan và `CHANGELOG.md`.

---

## 11. Quy tắc cập nhật SOT

Khi cần sửa tài liệu SOT:

1. Chỉ sửa file đúng phạm vi.
2. Không thêm feature hoặc tech decision mới nếu chưa được duyệt.
3. Nếu thêm, xóa hoặc đổi tên file SOT, phải cập nhật `README.md`.
4. Nếu thay đổi quyết định sản phẩm, kiến trúc, tech stack hoặc cách chia task, phải cập nhật `CHANGELOG.md`.
5. Không duplicate nội dung chi tiết giữa nhiều file.
6. README chỉ là bản đồ và quy tắc đọc, không thay thế các file chi tiết.

---

## 12. Cách phản hồi khi hoàn thành task

Khi trả kết quả, AI Agent nên dùng format ngắn gọn:

```md
## Done

- ...

## Files changed

- `path/to/file`

## Tests

- `command` — result

## Notes / Risks

- ...

## SOT updates

- Không cần cập nhật / Đã cập nhật `...` / Cần owner duyệt trước khi cập nhật
```

Không viết báo cáo dài nếu task nhỏ. Không che giấu phần chưa làm được hoặc chưa test được.

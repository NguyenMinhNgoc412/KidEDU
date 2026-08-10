# KidEDU SOT 01 — Business & Nghiệp Vụ Sản Phẩm

**Trạng thái:** Source of Truth chính cho nghiệp vụ  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-08-06
**Phạm vi:** MVP / Phase 0–1 và Beta
**Ngôn ngữ:** Tiếng Việt  
**Ghi chú:** File này chỉ mô tả sản phẩm theo ngôn ngữ business/nghiệp vụ. Không mô tả framework, database, thư viện hoặc cách implement.

---

## 1. Tầm nhìn sản phẩm

KidEDU là ứng dụng hỗ trợ trẻ chậm nói luyện phát âm tại nhà thông qua trải nghiệm học trực quan, lặp lại và ít thao tác.

Trẻ học bằng cách:

1. Nhìn hình ảnh hoặc ảnh động minh họa.
2. Xem khẩu hình miệng khi phát âm.
3. Nghe âm thanh phát âm rõ ràng.
4. Nói theo mẫu.
5. Lặp lại theo từng thẻ hoặc theo một bộ thẻ tự chạy.

KidEDU không thay thế chuyên gia âm ngữ trị liệu. Sản phẩm đóng vai trò công cụ luyện tập tại nhà, giúp phụ huynh duy trì việc luyện nói đều đặn, gần gũi và có cấu trúc.

---

## 2. Giá trị cốt lõi

### 2.1. Với trẻ

- Được học bằng hình ảnh, chuyển động, âm thanh và khẩu hình.
- Không cần đọc nhiều chữ.
- Không cần thao tác phức tạp.
- Có thể học cùng nội dung từ người thân quen thuộc.
- Có thể xem liên tục giống một playlist ngắn, thay vì phải bấm từng bài.

### 2.2. Với phụ huynh

- Tạo được bộ từ phù hợp với đời sống của trẻ.
- Thay được video/ảnh/audio mặc định bằng nội dung gia đình tự chuẩn bị.
- Cho trẻ luyện tập nhiều lần mà không cần thao tác liên tục.
- Theo dõi được trẻ đã luyện những gì ở mức đơn giản.
- Kiểm soát nội dung học và tốc độ học.

---

## 3. Người dùng chính

### 3.1. Trẻ em

Trẻ là người học chính.

Trẻ cần:

- Xem nội dung học.
- Nghe mẫu phát âm.
- Nói theo.
- Có thể học tự động theo bộ.
- Có thể phát lại khi cần.

Giao diện cho trẻ phải:

- ít chữ;
- nút lớn;
- ít lựa chọn;
- không có quảng cáo;
- không có thao tác xóa/sửa nội dung;
- hạn chế trẻ thoát nhầm sang khu phụ huynh.

### 3.2. Phụ huynh

Phụ huynh là người quản lý nội dung và buổi học.

Phụ huynh cần:

- tạo thẻ học mới;
- tạo bộ học mới;
- sắp xếp thứ tự thẻ trong bộ học;
- thêm hoặc thay ảnh minh họa;
- thêm hoặc thay video người thân phát âm;
- thêm hoặc thay âm thanh phát âm;
- chọn tốc độ tự chạy;
- xem tiến độ cơ bản;
- xóa nội dung cá nhân hóa khi không còn muốn dùng.
- biết dữ liệu nào đang được lưu local và quyền thiết bị nào KidEDU đang dùng;
- xóa lịch sử học, xóa toàn bộ media cá nhân hóa hoặc đặt lại app khi cần.

### 3.3. Chuyên gia/giáo viên

Chuyên gia/giáo viên chưa thuộc MVP.

Có thể mở rộng ở phase sau để:

- tạo bộ học chuẩn;
- giao bài cho phụ huynh;
- theo dõi tiến độ từ xa;
- tư vấn nội dung luyện tập.

---

## 4. Nguyên tắc nghiệp vụ bắt buộc

1. **Trẻ ít thao tác nhất có thể.** Ứng dụng phải hỗ trợ chế độ tự chạy theo bộ thẻ.
2. **Phụ huynh kiểm soát nội dung.** Trẻ không tự thêm, sửa hoặc xóa nội dung.
3. **Nội dung cá nhân hóa là điểm khác biệt chính.** Phụ huynh có thể dùng video/ảnh/audio của người thân để tăng sự gần gũi.
4. **Không chấm phát âm tự động ở MVP/Beta.** App không kết luận trẻ phát âm đúng/sai bằng AI. Mini test Beta chỉ được so sánh lựa chọn hình của trẻ với đáp án cố định, không được suy diễn thành điểm phát âm hoặc đánh giá y khoa.
5. **Không gây quá tải giác quan.** Ảnh động và âm thanh phải hỗ trợ tập trung, không được lấn át khẩu hình và âm phát âm.
6. **Mỗi bài học phải ngắn.** Một thẻ học nên tập trung vào một từ hoặc một cụm từ ngắn.
7. **Phải có cách quay về nội dung mặc định.** Nếu phụ huynh xóa nội dung cá nhân hóa, app dùng lại nội dung mặc định nếu có.
8. **MVP ưu tiên sử dụng trong gia đình.** Không thiết kế luồng chuyên gia, lớp học, marketplace hoặc chia sẻ cộng đồng ở giai đoạn này.
9. **Phụ huynh phải kiểm soát dữ liệu của trẻ.** App phải giải thích dữ liệu được lưu local, không tự upload, và cung cấp thao tác xóa rõ ràng trong khu phụ huynh.

---

## 5. Khái niệm nghiệp vụ

### 5.1. Hồ sơ trẻ

Hồ sơ trẻ đại diện cho một trẻ đang dùng app.

MVP có thể bắt đầu với một hồ sơ trẻ mặc định. Sau này có thể hỗ trợ nhiều trẻ trong cùng gia đình.

Thông tin ở mức nghiệp vụ:

- tên trẻ;
- ảnh đại diện nếu có;
- độ tuổi hoặc ghi chú ngắn nếu phụ huynh muốn nhập;
- tiến độ học gắn với trẻ đó.

### 5.2. Thẻ học

Thẻ học là đơn vị học nhỏ nhất.

Ví dụ:

- “mẹ”;
- “ba”;
- “ăn”;
- “uống”;
- “đau”;
- “mẹ bế”.

Một thẻ học gồm:

| Thành phần                    | Ý nghĩa nghiệp vụ                                | Bắt buộc ở MVP     |
| ----------------------------- | ------------------------------------------------ | ------------------ |
| Từ/cụm từ                     | Nội dung trẻ cần luyện                           | Có                 |
| Nhóm/chủ đề                   | Gia đình, nhu cầu, đồ vật, con vật, hành động... | Có                 |
| Hình minh họa                 | Giúp trẻ hiểu nghĩa của từ                       | Nên có             |
| Ảnh động/chuyển động minh họa | Thu hút chú ý nếu dùng đúng mức                  | Nên có nếu phù hợp |
| Khẩu hình phát âm             | Giúp trẻ quan sát cách miệng phát âm             | Nên có             |
| Âm thanh phát âm              | Giúp trẻ nghe mẫu rõ ràng                        | Nên có             |
| Âm thanh minh họa             | Ví dụ tiếng mèo, tiếng xe, tiếng nước            | Không bắt buộc     |
| Nội dung cá nhân hóa          | Nội dung do phụ huynh thêm/thay                  | Không bắt buộc     |

### 5.3. Bộ học

Bộ học là danh sách nhiều thẻ học được gom theo một mục tiêu.

Ví dụ:

- Bộ “Gia đình”: ba, mẹ, ông, bà.
- Bộ “Nhu cầu”: ăn, uống, ngủ, đau.
- Bộ “Con vật”: chó, mèo, cá, gà.
- Bộ “Hành động”: đi, ngồi, lấy, đưa.

Bộ học dùng cho chế độ học tự chạy.

### 5.4. Phiên học

Phiên học là một lần trẻ học trong app.

Có hai kiểu phiên học chính:

1. **Học từng thẻ:** trẻ hoặc phụ huynh chọn một thẻ để xem và luyện.
2. **Học theo bộ tự chạy:** app phát lần lượt nhiều thẻ trong một bộ.

### 5.5. Nội dung cá nhân hóa

Nội dung cá nhân hóa là nội dung phụ huynh tự thêm để thay thế hoặc bổ sung nội dung mặc định.

Ví dụ:

- video mẹ thật nói “mẹ”;
- video ba thật nói “ba”;
- ảnh đồ chơi thật của trẻ;
- âm thanh người thân đọc từ;
- ảnh động minh họa do phụ huynh chọn.

Khi có nội dung cá nhân hóa, app ưu tiên dùng nội dung đó trong trải nghiệm học, miễn là nội dung đó còn hợp lệ.

### 5.6. Khu phụ huynh

Khu phụ huynh là nơi quản lý nội dung, bộ học, cài đặt và tiến độ.

Trẻ không nên tự vào được khu này.

MVP dùng Parent Gate đơn giản trước khi vào khu phụ huynh.

### 5.7. Tiến độ học

Tiến độ học trong MVP chỉ mang tính ghi nhận cơ bản, không đánh giá y khoa.

Có thể ghi nhận:

- thẻ nào đã xem;
- số lần luyện;
- lần học gần nhất;
- trạng thái do phụ huynh đánh dấu: mới, đang luyện, đã quen;
- nhận xét ngắn của phụ huynh nếu cần.

### 5.8. Ôn tập và game theo bộ trong Beta

Sau khi hoàn thành một bộ học, trẻ có thể củng cố các từ vừa học bằng ba hoạt động đã duyệt:

1. **Mini test nghe và chọn hình:** app phát audio của từ mục tiêu rồi cho trẻ chọn trong 2, 4 hoặc 6 hình theo tuổi; không dùng video và không chấm điểm.
2. **Ghép hình hoàn chỉnh:** trẻ kéo mảnh vào khung qua các màn tự tăng 2, 3 rồi tối đa 4 mảnh, dùng các hình khác nhau được chọn từ bộ.
3. **Lật thẻ tìm cặp:** trẻ chơi các màn tự tăng từ 2 đến tối đa 5 cặp; cặp đúng thu nhỏ, mờ dần rồi biến mất.

Từ mục tiêu/audio mini test và toàn bộ hình của hai mini-game phải thuộc đúng bộ học, ưu tiên media cá nhân hóa hợp lệ rồi mới fallback về media mặc định. Riêng hình nhiễu mini test được lấy từ hình local hợp lệ ngoài bộ khi cần đủ số lựa chọn theo tuổi. Các hoạt động không được dùng để kết luận trẻ biết hoặc chưa biết một từ.

---

## 6. Feature list MVP / Phase 0–1

| Mã      | Feature                            | Mục tiêu nghiệp vụ                                                                                   | Phạm vi |
| ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------: |
| BIZ-001 | Màn hình học từng thẻ              | Trẻ học một từ/cụm từ bằng hình, khẩu hình và âm thanh                                               |      Có |
| BIZ-002 | Bộ học tự chạy                     | Trẻ học liên tục nhiều thẻ mà không cần bấm nhiều                                                    |      Có |
| BIZ-003 | Quản lý thẻ học                    | Phụ huynh tạo/sửa/xóa thẻ phù hợp với trẻ                                                            |      Có |
| BIZ-004 | Quản lý bộ học                     | Phụ huynh gom thẻ thành bộ và sắp xếp thứ tự học                                                     |      Có |
| BIZ-005 | Cá nhân hóa video khẩu hình        | Trẻ học bằng video người thân quen thuộc                                                             |      Có |
| BIZ-006 | Cá nhân hóa hình/ảnh động          | Nội dung gần với đồ vật/người thật quanh trẻ                                                         |      Có |
| BIZ-007 | Cá nhân hóa âm thanh phát âm       | Phụ huynh có thể dùng giọng người thân                                                               |  Nên có |
| BIZ-008 | Parent Gate                        | Bảo vệ khu phụ huynh khỏi thao tác nhầm của trẻ                                                      |      Có |
| BIZ-009 | Cài đặt tốc độ học                 | Phụ huynh điều chỉnh nhịp tự chạy theo khả năng của trẻ                                              |      Có |
| BIZ-010 | Tiến độ cơ bản                     | Phụ huynh biết trẻ đã luyện gì                                                                       |      Có |
| BIZ-011 | Bộ học mẫu ban đầu                 | Có nội dung để trẻ học ngay sau khi cài app                                                          |      Có |
| BIZ-012 | Sao lưu & khôi phục local          | Sao lưu dữ liệu học và media cá nhân hóa thành tệp để tự lưu hoặc chuyển thủ công sang thiết bị khác | Có (P1) |
| BIZ-013 | Tài khoản online                   | Quản lý người dùng trên nhiều thiết bị                                                               | Sau MVP |
| BIZ-014 | Chuyên gia giao bài                | Chuyên gia tạo lộ trình từ xa                                                                        | Sau MVP |
| BIZ-015 | AI chấm phát âm                    | App tự phân tích phát âm của trẻ                                                                     | Sau MVP |
| BIZ-016 | Quyền riêng tư & kiểm soát dữ liệu | Minh bạch dữ liệu local, trạng thái quyền thiết bị và cho phụ huynh xóa dữ liệu theo phạm vi         | Có (P1) |
| BIZ-017 | Mini test cuối bộ                  | Phát mẫu của từ và cho trẻ chọn hình tương ứng để ôn lại các từ vừa học                              |    Beta |
| BIZ-018 | Mini-game theo bộ học              | Củng cố nội dung bằng ghép hình hoàn chỉnh và lật thẻ tìm cặp                                        |    Beta |

---

## 7. Scope MVP / Phase 0–1 và Beta đã chốt

### 7.1. Bắt buộc có trong Phase 0–1

1. Màn hình học từng thẻ.
2. Màn hình chọn bộ học.
3. Chế độ tự chạy một bộ thẻ.
4. Khoảng dừng để trẻ nói theo.
5. Nút tạm dừng/phát lại/thoát trong phiên học.
6. Khu phụ huynh.
7. Parent Gate trước khu phụ huynh.
8. Tạo/sửa/xóa thẻ học.
9. Tạo/sửa/xóa/sắp xếp bộ học.
10. Thay video khẩu hình bằng video người thân.
11. Thay hình minh họa bằng ảnh/ảnh động của phụ huynh.
12. Lưu tiến độ học cơ bản.
13. Cài đặt tốc độ học và số vòng lặp.
14. Sao lưu và khôi phục toàn bộ dữ liệu local bằng tệp trước khi cân nhắc backend.
15. Minh bạch dữ liệu local, trạng thái quyền thiết bị và các thao tác xóa dữ liệu có xác nhận trong khu phụ huynh.

### 7.2. Nên có nếu không làm chậm MVP

1. Âm thanh khen ngắn sau mỗi thẻ hoặc cuối bộ.
2. Âm thanh minh họa nhẹ cho một số thẻ phù hợp.
3. Cho phép đảo thứ tự thẻ khi ôn tập.
4. Cho phép phụ huynh ghi chú riêng cho từng thẻ.

### 7.3. Phạm vi Beta đã duyệt

1. Sau khi hoàn thành bộ học, app hiện ba lựa chọn: về chọn bộ học, mini test hoặc trò chơi.
2. Mini test nghe và chọn hình chỉ phát audio mẫu sau khi hoàn thành bộ học; số hình là 2/4/6 theo tuổi của trẻ.
3. Game ghép hình tự tăng theo màn 2 → 3 → 4 mảnh, dùng tối đa ba hình khác nhau chọn ngẫu nhiên trong bộ và giảm số màn nếu bộ có ít hình hơn.
4. Game lật thẻ tự tăng từ 2 đến tối đa 5 cặp, dừng ở cấp cao nhất tương ứng số hình hợp lệ trong bộ.
5. Phản hồi đúng/sai của câu chọn hình phải nhẹ nhàng, không có trạng thái đạt/rớt.
6. Ghép hình và lật thẻ chỉ ghi nhận việc tham gia/hoàn thành, không tính thành điểm ngôn ngữ.
7. Toàn bộ hoạt động hoạt động offline, không thu âm và không dùng AI chấm phát âm.

### 7.4. Chưa làm trong Phase 0–1/Beta

1. Đăng nhập online.
2. Đồng bộ nhiều thiết bị.
3. Lưu trữ đám mây.
4. Marketplace bộ học.
5. Chia sẻ công khai bộ học.
6. Luồng chuyên gia/giáo viên.
7. AI nhận diện hoặc chấm phát âm.
8. Chat/tư vấn trong app.
9. Thanh toán/subscription.

---

## 8. Luồng nghiệp vụ chính

### 8.1. Trẻ học từng thẻ

1. Phụ huynh hoặc trẻ chọn một thẻ.
2. App hiển thị hình minh họa.
3. App phát khẩu hình và âm thanh mẫu.
4. Trẻ nói theo.
5. Phụ huynh có thể phát lại hoặc chuyển sang thẻ khác.
6. App ghi nhận lượt luyện ở mức cơ bản.

### 8.2. Trẻ học theo bộ tự chạy

1. Phụ huynh chọn một bộ học.
2. Phụ huynh bấm bắt đầu.
3. App phát từng thẻ trong bộ theo thứ tự đã định.
4. Sau mỗi mẫu phát âm, app có khoảng dừng để trẻ nói theo.
5. App tự chuyển sang thẻ tiếp theo.
6. Khi hết bộ, app kết thúc hoặc lặp lại theo cài đặt.
7. App ghi nhận phiên học ở mức cơ bản.

Chi tiết nghiệp vụ nằm trong `03-business-auto-play-deck-sot.md`.

### 8.3. Phụ huynh tạo thẻ học

1. Phụ huynh vào khu phụ huynh.
2. Phụ huynh chọn tạo thẻ mới.
3. Phụ huynh nhập từ/cụm từ.
4. Phụ huynh chọn nhóm/chủ đề.
5. Phụ huynh thêm hình minh họa nếu có.
6. Phụ huynh thêm video hoặc âm thanh nếu có.
7. Phụ huynh lưu thẻ.
8. Thẻ mới xuất hiện trong danh sách học.

### 8.4. Phụ huynh cá nhân hóa thẻ

1. Phụ huynh chọn một thẻ có sẵn.
2. Phụ huynh chọn thay video, thay hình hoặc thay âm thanh.
3. Phụ huynh chọn nội dung từ thiết bị hoặc quay/ghi mới nếu app hỗ trợ.
4. Phụ huynh xem trước.
5. Phụ huynh lưu.
6. Từ lần học sau, app ưu tiên dùng nội dung cá nhân hóa.

Chi tiết nghiệp vụ nằm trong `04-business-parent-content-management-sot.md`.

### 8.5. Phụ huynh xem tiến độ

1. Phụ huynh vào khu phụ huynh.
2. Phụ huynh mở phần tiến độ.
3. App hiển thị các thẻ/bộ đã luyện gần đây.
4. Phụ huynh có thể đánh dấu trạng thái của từng thẻ.
5. Phụ huynh dùng thông tin này để chọn bộ học tiếp theo.

### 8.6. Phụ huynh sao lưu và khôi phục dữ liệu local

1. Phụ huynh vào khu phụ huynh và mở phần sao lưu dữ liệu.
2. Phụ huynh tạo một tệp sao lưu local chứa dữ liệu học, tiến độ, cài đặt và media cá nhân hóa.
3. Phụ huynh tự lưu hoặc chuyển tệp đó bằng chức năng chia sẻ tệp của thiết bị.
4. Khi khôi phục, phụ huynh chọn một tệp sao lưu từ thiết bị.
5. App kiểm tra tệp và hiển thị bản xem trước gồm thời điểm tạo, phiên bản, số thẻ, số bộ học và dung lượng media.
6. App chỉ bắt đầu khôi phục sau khi phụ huynh xác nhận rằng dữ liệu local hiện tại sẽ được thay thế.
7. Nếu khôi phục thất bại, app giữ nguyên dữ liệu hiện tại và báo lỗi dễ hiểu.

Đây là luồng chuyển tệp thủ công, không phải cloud sync, chia sẻ công khai hoặc tài khoản online. Chi tiết nghiệp vụ nằm trong `04-business-parent-content-management-sot.md`.

### 8.7. Phụ huynh kiểm soát dữ liệu local

1. Phụ huynh mở phần “Quyền riêng tư & dữ liệu” trong khu phụ huynh.
2. App giải thích dữ liệu học và media cá nhân hóa được lưu trong vùng riêng của KidEDU trên thiết bị và không tự upload.
3. App hiển thị tổng quan dữ liệu local cùng trạng thái quyền camera, micro và thư viện ảnh/video.
4. Phụ huynh có thể mở cài đặt hệ thống để thay đổi quyền; app không tự yêu cầu quyền chỉ vì mở màn hình này.
5. Phụ huynh có thể chọn xóa lịch sử học, xóa toàn bộ media cá nhân hóa hoặc đặt lại toàn bộ dữ liệu app.
6. Mỗi thao tác phá hủy phải giải thích chính xác dữ liệu bị xóa và yêu cầu xác nhận riêng.
7. Sau khi hoàn tất, app làm mới dữ liệu hiển thị và không còn dùng file đã bị gỡ khỏi dữ liệu local.

Việc xóa dữ liệu trong app không thể thu hồi tệp backup mà phụ huynh đã chủ động lưu hoặc chia sẻ ra ngoài vùng lưu trữ của KidEDU. Chi tiết nghiệp vụ nằm trong `04-business-parent-content-management-sot.md`.

### 8.8. Trẻ ôn tập và chơi sau bộ học

1. Trẻ hoàn thành một phiên học theo bộ không bị thoát giữa chừng.
2. Nếu phụ huynh đã bật mini test cuối bộ, app bắt đầu phần nghe và chọn hình bằng các thẻ đủ điều kiện trong bộ vừa học; nếu tắt, app kết thúc phiên như bình thường.
3. Hình xuất hiện đồng thời khi audio bắt đầu nhưng chỉ nhận lựa chọn sau khi audio phát xong; câu hỏi không hiển thị chữ/tên từ.
4. Nếu trẻ chọn chưa đúng, hình vừa chọn rung ngang nhẹ rồi cho thử lại; không có chữ hoặc âm báo lỗi. Nếu đúng, hình nổi/phóng nhẹ, phát âm thanh chúc mừng rồi tự chuyển câu.
5. Mỗi lượt có tối đa 5 câu ngẫu nhiên, giảm theo số thẻ hợp lệ; mini test chỉ mở khi bộ có ít nhất 2 thẻ có cả hình và audio local.
6. Khi mini test kết thúc, app chúc mừng rồi hiển thị “Làm lại”, “Trò chơi” và “Học tiếp”.
7. App chỉ lưu bộ đã học và mini test đã làm/chưa làm; không lưu đáp án, số lần sai/phát lại, điểm tổng, trạng thái đạt/rớt hoặc tự đánh dấu thẻ là “Đã quen”.

Chi tiết nghiệp vụ nằm trong `03-business-auto-play-deck-sot.md`.

---

## 9. Quy tắc nội dung học

### 9.1. Độ dài nội dung

- Một thẻ nên tập trung vào một từ hoặc cụm từ ngắn.
- Video mẫu nên ngắn, chỉ đủ để trẻ quan sát khẩu hình.
- Âm thanh phát âm phải rõ, không lẫn nhiều tiếng nền.
- Ảnh động nên ngắn, nhẹ và có liên quan trực tiếp đến từ.

### 9.2. Mức kích thích

Được dùng:

- chuyển động nhẹ;
- âm thanh minh họa ngắn;
- âm thanh khen ngắn;
- hiệu ứng chuyển bài đơn giản.

Không nên dùng:

- nhạc nền liên tục;
- nhiều vật thể chuyển động cùng lúc;
- hiệu ứng nhấp nháy mạnh;
- âm thanh quá lớn hoặc chồng nhiều lớp;
- animation khiến trẻ chú ý vào hiệu ứng thay vì khẩu hình.

### 9.3. Ưu tiên hiển thị nội dung

Khi học một thẻ, app ưu tiên nội dung theo thứ tự nghiệp vụ:

1. Nội dung cá nhân hóa của phụ huynh.
2. Nội dung mặc định của app.
3. Nếu thiếu một loại nội dung, vẫn cho học với các nội dung còn lại nếu thẻ còn đủ ý nghĩa.
4. Nếu thẻ thiếu quá nhiều nội dung, hiển thị trạng thái cần bổ sung trong khu phụ huynh.

---

## 10. Bộ học mẫu ban đầu

MVP nên có bộ học mẫu để phụ huynh dùng ngay.

### 10.1. Gia đình

- ba
- mẹ
- ông
- bà

### 10.2. Nhu cầu cơ bản

- ăn
- uống
- ngủ
- đau
- bế
- nữa
- không

### 10.3. Đồ vật quen thuộc

- bóng
- xe
- ly
- sữa
- bánh
- gấu

### 10.4. Con vật

- mèo
- chó
- cá
- gà
- chim

### 10.5. Hành động

- đi
- ngồi
- đứng
- lấy
- đưa
- mở
- đóng

---

## 11. Tiêu chí thành công Phase 0–1

Phase 0–1 được coi là đạt nếu:

1. Trẻ có thể học một thẻ bằng hình, khẩu hình và âm thanh.
2. Trẻ có thể học một bộ thẻ tự chạy mà gần như không cần thao tác.
3. Phụ huynh có thể tạo thẻ học mới.
4. Phụ huynh có thể tạo bộ học mới.
5. Phụ huynh có thể thay video của một thẻ bằng video người thân.
6. Phụ huynh có thể quay về nội dung mặc định khi xóa nội dung cá nhân hóa.
7. App ghi nhận được tiến độ cơ bản.
8. Trải nghiệm học không có quảng cáo, không có thao tác gây nhiễu.
9. Nội dung animation/âm thanh thu hút nhưng không làm trẻ mất tập trung vào phát âm.
10. Phụ huynh có thể sao lưu và khôi phục toàn bộ dữ liệu local bằng tệp mà không cần backend.
11. Phụ huynh biết dữ liệu nào được lưu local, xem được trạng thái quyền thiết bị và chủ động xóa dữ liệu bằng các thao tác có xác nhận.

---

## 12. Thứ tự mở rộng

Sau khi feature lõi ổn định, BIZ-012 được thực hiện ở P1 và phải hoàn tất trước khi cân nhắc backend, tài khoản online hoặc đồng bộ nhiều thiết bị.

Thứ tự ưu tiên mở rộng đề xuất:

1. Hoàn thiện mini test nghe và chọn hình, ghép hình hoàn chỉnh và lật thẻ tìm cặp cho Beta.
2. Hoàn thiện sao lưu và khôi phục local ở P1.
3. Hoàn thiện quyền riêng tư và kiểm soát dữ liệu local ở P1.
4. Thêm nhiều hồ sơ trẻ.
5. Thêm bộ học mẫu nâng cao.
6. Thêm chia sẻ bộ học riêng tư sau khi có quy tắc quyền riêng tư rõ ràng.
7. Sau đó mới cân nhắc backend, tài khoản online, cloud sync hoặc chuyên gia giao bài.
8. AI chấm phát âm chỉ nên nghiên cứu khi có đủ dữ liệu và có tiêu chí đánh giá rõ ràng.

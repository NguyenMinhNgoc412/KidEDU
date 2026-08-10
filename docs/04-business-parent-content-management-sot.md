# KidEDU SOT 04 — Business Spec: Parent & Content Management

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-08-06
**Phạm vi:** Khu phụ huynh, quản lý thẻ/bộ, nội dung cá nhân hóa, hoạt động cuối bộ, sao lưu/khôi phục và kiểm soát dữ liệu local
**Ghi chú:** File này mô tả nghiệp vụ. Không mô tả framework, database hoặc code.

---

## 1. Mục tiêu

Khu phụ huynh giúp phụ huynh kiểm soát nội dung học của trẻ.

Phụ huynh có thể:

- thêm thẻ học;
- sửa thẻ học;
- xóa thẻ học;
- thêm nội dung cá nhân hóa;
- tạo bộ học;
- sắp xếp thẻ trong bộ học;
- xem tiến độ cơ bản;
- cấu hình tốc độ học;
- bật/tắt mini test cuối bộ và xem trạng thái đã làm/chưa làm theo bộ;
- sao lưu và khôi phục dữ liệu local.
- xem cách KidEDU lưu dữ liệu và trạng thái quyền thiết bị;
- xóa lịch sử học, media cá nhân hóa hoặc đặt lại toàn bộ app.

Trẻ không được truy cập trực tiếp vào các thao tác quản lý này.

---

## 2. Parent Gate

### 2.1. Mục tiêu

Parent Gate ngăn trẻ vào nhầm khu phụ huynh.

MVP dùng thử thách đơn giản, ví dụ phép tính:

```text
3 + 5 = ?
```

### 2.2. Nguyên tắc

1. Parent Gate chỉ xuất hiện khi vào khu phụ huynh.
2. Không bắt phụ huynh nhập PIN mỗi lần mở app.
3. Thử thách phải đủ đơn giản với người lớn nhưng khó với trẻ nhỏ.
4. Nếu trả lời sai, cho thử lại.
5. Không hiển thị thông báo làm trẻ tò mò hoặc khuyến khích thử nhiều.

---

## 3. Khu phụ huynh

Khu phụ huynh gồm các nhóm chức năng:

1. Quản lý thẻ học.
2. Quản lý bộ học.
3. Quản lý nội dung cá nhân hóa.
4. Xem tiến độ.
5. Cài đặt học.
6. Sao lưu và khôi phục dữ liệu local.
7. Quyền riêng tư và kiểm soát dữ liệu local.

MVP không cần dashboard phức tạp. Chỉ cần rõ ràng, dễ dùng và ít bước.

---

## 4. Quản lý thẻ học

### 4.1. Tạo thẻ học

Phụ huynh tạo thẻ mới bằng cách nhập:

| Trường            | Bắt buộc | Ghi chú nghiệp vụ        |
| ----------------- | -------: | ------------------------ |
| Từ/cụm từ         |       Có | Nội dung trẻ cần luyện   |
| Chủ đề/nhóm       |       Có | Giúp sắp xếp và tìm kiếm |
| Hình minh họa     |   Nên có | Có thể thêm sau          |
| Video khẩu hình   |   Nên có | Có thể thêm sau          |
| Âm thanh phát âm  |   Nên có | Có thể thêm sau          |
| Âm thanh minh họa |    Không | Chỉ dùng nếu phù hợp     |
| Ghi chú phụ huynh |    Không | Dành cho phụ huynh       |

### 4.2. Sửa thẻ học

Phụ huynh có thể sửa:

- từ/cụm từ;
- chủ đề;
- hình minh họa;
- video;
- audio;
- ghi chú;
- trạng thái học.

Khi sửa nội dung đã nằm trong bộ học, bộ học phải tự dùng thông tin mới của thẻ đó.

### 4.3. Xóa thẻ học

Khi xóa thẻ học:

- thẻ không còn xuất hiện trong danh sách học;
- thẻ không còn xuất hiện trong bộ học;
- nếu thẻ có nội dung cá nhân hóa, phụ huynh phải hiểu rằng nội dung đó cũng không còn được dùng trong app.

MVP có thể dùng xác nhận đơn giản trước khi xóa.

---

## 5. Trạng thái thẻ học

Thẻ học có thể có các trạng thái nghiệp vụ:

| Trạng thái     | Ý nghĩa                                       |
| -------------- | --------------------------------------------- |
| Sẵn sàng học   | Có đủ nội dung cần thiết để đưa vào phiên học |
| Cần bổ sung    | Thiếu hình/video/audio quan trọng             |
| Đã cá nhân hóa | Có ít nhất một nội dung do phụ huynh thêm     |
| Đang luyện     | Phụ huynh đánh dấu trẻ đang luyện             |
| Đã quen        | Phụ huynh đánh dấu trẻ đã quen từ này         |
| Tạm ẩn         | Không hiển thị cho trẻ nhưng chưa xóa         |

---

## 6. Nội dung cá nhân hóa

### 6.1. Mục tiêu

Nội dung cá nhân hóa giúp trẻ học với người, vật, không gian gần gũi.

Ví dụ:

- video mẹ nói “mẹ”;
- video ba nói “ba”;
- ảnh ly nước thật của trẻ;
- âm thanh ông/bà đọc từ;
- ảnh động đồ chơi trẻ thích.

### 6.2. Loại nội dung cá nhân hóa

| Loại              | Mục đích                                   |
| ----------------- | ------------------------------------------ |
| Video khẩu hình   | Cho trẻ quan sát miệng người thân          |
| Hình minh họa     | Cho trẻ thấy đồ vật/người quen thuộc       |
| Ảnh động ngắn     | Thu hút chú ý và minh họa nghĩa            |
| Audio phát âm     | Dùng giọng người thân                      |
| Âm thanh minh họa | Tăng liên kết ngữ cảnh nếu không gây nhiễu |

### 6.3. Quy tắc ưu tiên

Khi một thẻ có nội dung cá nhân hóa:

1. App ưu tiên dùng nội dung cá nhân hóa.
2. Nếu nội dung cá nhân hóa bị xóa, dùng lại nội dung mặc định nếu có.
3. Nếu cả nội dung cá nhân hóa và mặc định đều thiếu, thẻ được đánh dấu cần bổ sung.

### 6.4. Quy tắc chất lượng nội dung

Video cá nhân hóa nên:

- ngắn;
- có độ phân giải tối thiểu HD 1280 × 720 để khẩu hình hiển thị rõ;
- rõ mặt hoặc rõ miệng;
- âm thanh không quá ồn;
- chỉ tập trung vào từ/cụm từ cần học;
- không có nhiều yếu tố gây xao nhãng.

Hình/ảnh động nên:

- có một chủ thể chính;
- liên quan trực tiếp đến từ;
- không nhấp nháy mạnh;
- không có quá nhiều chuyển động.

Audio nên:

- phát âm rõ;
- không lẫn nhạc nền;
- không quá dài;
- âm lượng dễ nghe.

---

## 7. Quản lý bộ học

### 7.1. Tạo bộ học

Phụ huynh tạo bộ học bằng cách:

1. Đặt tên bộ.
2. Chọn chủ đề nếu cần.
3. Thêm các thẻ vào bộ.
4. Sắp xếp thứ tự.
5. Lưu bộ.

Ví dụ bộ học:

- “Gia đình”;
- “Con muốn gì?”;
- “Con vật”;
- “Đồ chơi của con”;
- “Từ cần luyện tuần này”.

### 7.2. Sửa bộ học

Phụ huynh có thể:

- đổi tên bộ;
- thêm thẻ;
- xóa thẻ khỏi bộ;
- sắp xếp lại thứ tự;
- tạm ẩn bộ.

### 7.3. Xóa bộ học

Khi xóa bộ học:

- chỉ xóa bộ học;
- không tự xóa thẻ học gốc;
- không tự xóa nội dung cá nhân hóa của các thẻ.

---

## 8. Cài đặt học

Phụ huynh có thể cấu hình:

- tuổi của hồ sơ trẻ để mini test chọn mức 2/4/6 hình; để trống thì dùng mặc định 2 hình;

| Cài đặt           | Ý nghĩa                                                         |
| ----------------- | --------------------------------------------------------------- |
| Tốc độ học        | Chậm, bình thường, nhanh                                        |
| Số vòng lặp       | 1 vòng, 3 vòng, lặp liên tục                                    |
| Âm thanh khen     | Bật/tắt                                                         |
| Âm thanh minh họa | Bật/tắt                                                         |
| Tự chuyển bài     | Bật/tắt trong một số mode                                       |
| Hiển thị chữ      | Bật/tắt hoặc chọn kích thước nếu cần sau MVP                    |
| Mini test cuối bộ | Bật/tắt phần nghe và chọn hình sau khi hoàn thành bộ trong Beta |

MVP chỉ cần những cài đặt thật sự ảnh hưởng đến phiên học.

---

## 9. Tiến độ cơ bản

Khu phụ huynh có thể hiển thị:

- thẻ học gần đây;
- bộ học gần đây;
- số lượt học;
- ngày học gần nhất;
- trạng thái phụ huynh đánh dấu.
- bộ đã học và mini test đã làm/chưa làm;
- mini-game theo bộ đã bắt đầu/hoàn thành.

Không hiển thị lựa chọn từng câu, số lần sai/phát lại, điểm tổng, đạt/rớt hoặc điểm phát âm tự động. Trạng thái mini test không phải đánh giá khả năng ngôn ngữ hay phát âm.

---

## 10. Sao lưu và khôi phục local

### 10.1. Mục tiêu và phạm vi

Phụ huynh có thể tạo một tệp sao lưu để bảo vệ dữ liệu local hoặc tự chuyển dữ liệu sang thiết bị khác.

Tệp sao lưu gồm:

- hồ sơ trẻ local;
- chủ đề, thẻ học và bộ học;
- media cá nhân hóa và mapping liên quan;
- phiên học và tiến độ cơ bản;
- lịch sử mini test và mini-game theo bộ nếu đã được ghi nhận;
- cài đặt học.

Nội dung mặc định đã đóng gói trong app không cần được nhân bản nếu có thể khôi phục lại từ chính phiên bản app đích.

### 10.2. Tạo bản sao lưu

1. Phụ huynh mở phần “Sao lưu & khôi phục” trong khu phụ huynh.
2. App mô tả phạm vi dữ liệu sẽ được sao lưu.
3. Phụ huynh chọn tạo bản sao lưu.
4. App tạo một tệp local có định dạng và phiên bản nhận diện được.
5. Phụ huynh dùng chức năng lưu/chia sẻ tệp của thiết bị để tự lưu hoặc chuyển tệp.

App không tự upload tệp, không tự đồng bộ và không gửi tệp cho người khác.

### 10.3. Xem trước và xác nhận khôi phục

Sau khi phụ huynh chọn tệp, app phải kiểm tra tệp trước khi thay đổi dữ liệu hiện tại.

Preview tối thiểu hiển thị:

- thời điểm tạo bản sao lưu;
- phiên bản định dạng;
- số thẻ học;
- số bộ học;
- số media và tổng dung lượng media;
- trạng thái kiểm tra tính toàn vẹn.

Nếu tệp sai định dạng, không tương thích hoặc bị hỏng, app không hiển thị hành động khôi phục và giải thích lỗi bằng ngôn ngữ đơn giản.

### 10.4. Quy tắc replace-all

Restore P1 dùng quy tắc **replace-all**:

1. Chọn tệp và xem preview chưa được phép thay đổi dữ liệu hiện tại.
2. App phải cảnh báo rõ rằng thẻ, bộ học, tiến độ, cài đặt và media cá nhân hóa hiện tại sẽ được thay thế.
3. Chỉ bắt đầu restore sau một xác nhận riêng của phụ huynh.
4. Khi restore thành công, app dùng dữ liệu trong bản sao lưu và các media đã được lưu lại trên thiết bị đích.
5. Nếu restore thất bại hoặc bị gián đoạn trước khi hoàn tất, dữ liệu hiện tại phải được giữ nguyên.

P1 không hỗ trợ merge hai bản dữ liệu, chọn từng thẻ để restore hoặc tự giải quyết xung đột.

### 10.5. Ranh giới local-only

- Tệp được tạo và đọc trên thiết bị.
- Phụ huynh tự quyết định nơi lưu và cách chuyển tệp.
- Chức năng chia sẻ của hệ điều hành chỉ là cách chuyển tệp thủ công.
- Không có backend, cloud storage, cloud sync, tài khoản online hoặc chia sẻ công khai.

---

## 11. Quyền riêng tư & kiểm soát dữ liệu

### 11.1. Mục tiêu

Phụ huynh phải hiểu dữ liệu nào KidEDU lưu trên thiết bị và có thể chủ động xóa dữ liệu của trẻ mà không cần tài khoản online hoặc liên hệ hỗ trợ.

Màn hình này phải giải thích rõ:

- dữ liệu học, tiến độ, cài đặt và media cá nhân hóa được lưu trong vùng dữ liệu local của KidEDU;
- KidEDU không tự upload nội dung này lên server;
- camera, micro và thư viện ảnh/video chỉ được dùng khi phụ huynh chủ động chọn chức năng liên quan;
- thay đổi quyền được thực hiện trong cài đặt hệ thống của thiết bị.

Không dùng màn hình này để hiện permission prompt ngay khi mở.

### 11.2. Tổng quan dữ liệu local

App hiển thị tối thiểu:

- số thẻ học;
- số bộ học;
- số phiên, lượt và bản ghi tiến độ học đã ghi nhận;
- số media cá nhân hóa;
- dung lượng media cá nhân hóa đã ghi nhận nếu app xác định được.

Số liệu này dùng để giúp phụ huynh hiểu phạm vi dữ liệu, không phải báo cáo y khoa hoặc thống kê theo dõi từ xa.

### 11.3. Trạng thái quyền thiết bị

App hiển thị riêng trạng thái của:

- camera;
- micro;
- thư viện ảnh/video.

Trạng thái phải dùng từ dễ hiểu như đã cho phép, giới hạn, chưa cho phép hoặc cần mở Cài đặt. Phụ huynh có thể mở trang cài đặt hệ thống từ màn hình này. KidEDU không được tuyên bố đã thu hồi quyền nếu hệ điều hành chưa thực sự thay đổi quyền đó.

### 11.4. Xóa lịch sử học

Khi phụ huynh xác nhận xóa lịch sử học:

- xóa các phiên học, sự kiện học, lượt luyện, lần học gần nhất và trạng thái tiến độ đã đánh dấu;
- xóa trạng thái mini test đã làm/chưa làm và lịch sử mini-game theo bộ;
- đưa trạng thái học của thẻ về “mới”;
- giữ nguyên thẻ, bộ học, media cá nhân hóa và cài đặt học.

### 11.5. Xóa toàn bộ media cá nhân hóa

Khi phụ huynh xác nhận xóa media cá nhân hóa:

- gỡ toàn bộ ảnh, video, audio, thumbnail và avatar custom/generated khỏi dữ liệu app;
- giữ nguyên thẻ, bộ học, tiến độ và cài đặt;
- dùng lại media mặc định nếu có;
- nếu không có media mặc định phù hợp, hiển thị trạng thái thiếu nội dung thay vì crash.

App chỉ báo hoàn tất sau khi metadata đã được cập nhật an toàn. Cleanup file lỗi không được làm app dùng lại mapping đã xóa.

### 11.6. Đặt lại toàn bộ dữ liệu app

Đặt lại toàn bộ dữ liệu app sẽ:

- xóa hồ sơ, nội dung do phụ huynh tạo/sửa, bộ học, tiến độ, cài đặt và media cá nhân hóa hiện tại;
- khôi phục bộ nội dung mẫu và cài đặt mặc định của phiên bản app đang dùng;
- khóa lại Parent Gate và đưa người dùng về Child Mode sau khi hoàn tất.

Trước khi xác nhận, app phải khuyên phụ huynh tạo backup nếu còn muốn giữ dữ liệu. Thao tác này không xóa được tệp `.kidedu` mà phụ huynh đã lưu/chia sẻ ra ngoài vùng dữ liệu KidEDU và không tự thay đổi quyền camera/micro/thư viện do hệ điều hành quản lý.

### 11.7. Quy tắc xác nhận và lỗi

1. Mỗi thao tác xóa có hộp xác nhận riêng, nêu đúng dữ liệu bị xóa và dữ liệu được giữ lại.
2. Không gom nhiều loại xóa vào một nút mơ hồ.
3. Trong lúc xử lý, disable thao tác lặp để tránh chạy đồng thời.
4. Nếu mutation dữ liệu thất bại, giữ nguyên dữ liệu trước đó và báo lỗi dễ hiểu.
5. Sau thành công, làm mới toàn bộ số liệu và màn hình liên quan.
6. Các thao tác này chỉ nằm sau Parent Gate.

---

## 12. Empty state và hướng dẫn phụ huynh

Khi chưa có nội dung:

- danh sách thẻ rỗng nên hướng dẫn tạo thẻ đầu tiên;
- danh sách bộ rỗng nên hướng dẫn tạo bộ học;
- thẻ thiếu nội dung nên gợi ý thêm hình/video/audio;
- bộ học không có thẻ nên không cho bắt đầu Auto Play;
- khi chưa chọn tệp restore, hướng dẫn phụ huynh chọn một tệp `.kidedu` hợp lệ.
- khi chưa có media cá nhân hóa hoặc lịch sử học, disable thao tác xóa tương ứng và giải thích không có dữ liệu cần xóa.

Thông báo nên dùng ngôn ngữ đơn giản, không kỹ thuật.

---

## 13. Acceptance criteria

Tính năng khu phụ huynh đạt khi:

1. Trẻ không vào thẳng khu phụ huynh nếu chưa qua Parent Gate.
2. Phụ huynh tạo được thẻ học mới.
3. Phụ huynh sửa được thẻ học.
4. Phụ huynh xóa hoặc tạm ẩn được thẻ học.
5. Phụ huynh thêm/thay được video cá nhân hóa cho một thẻ.
6. Phụ huynh xóa được nội dung cá nhân hóa để quay lại nội dung mặc định.
7. Phụ huynh tạo được bộ học từ nhiều thẻ.
8. Phụ huynh sắp xếp được thứ tự thẻ trong bộ.
9. Bộ học rỗng không thể bắt đầu Auto Play.
10. Thẻ thiếu nội dung được hiển thị rõ là cần bổ sung.
11. Phụ huynh xem được tiến độ cơ bản.
12. Cài đặt tốc độ học ảnh hưởng đến phiên Auto Play.
13. Phụ huynh tạo được tệp sao lưu khi không có mạng.
14. Tệp sao lưu chứa metadata và media cá nhân hóa cần thiết để chuyển dữ liệu thủ công.
15. Chọn tệp restore chỉ tạo preview, chưa thay đổi dữ liệu hiện tại.
16. App từ chối tệp sai định dạng, không tương thích hoặc không đạt kiểm tra tính toàn vẹn.
17. App cảnh báo rõ hành vi replace-all và yêu cầu xác nhận riêng trước khi restore.
18. Restore thành công làm dữ liệu học, tiến độ, cài đặt và media cá nhân hóa khớp bản sao lưu.
19. Restore thất bại giữ nguyên dữ liệu trước khi restore.
20. Luồng sao lưu/khôi phục không phụ thuộc backend, cloud sync hoặc đăng nhập online.
21. Màn quyền riêng tư giải thích dữ liệu được lưu local và KidEDU không tự upload nội dung học/media cá nhân hóa.
22. Phụ huynh xem được tổng quan thẻ, bộ, lịch sử học và media cá nhân hóa.
23. Mở màn quyền riêng tư không tự hiện permission prompt.
24. App hiển thị trạng thái camera, micro và thư viện ảnh/video, đồng thời mở được cài đặt hệ thống khi phụ huynh yêu cầu.
25. Xóa lịch sử học giữ nguyên nội dung/media/cài đặt và đưa tiến độ thẻ về trạng thái mới.
26. Xóa media cá nhân hóa giữ nguyên thẻ/bộ/progress/settings và fallback về media mặc định khi có.
27. Đặt lại toàn bộ dữ liệu khôi phục seed/cài đặt mặc định, khóa Parent Gate và quay về Child Mode.
28. Mỗi thao tác phá hủy có mô tả phạm vi và xác nhận riêng.
29. Thao tác lỗi không để dữ liệu ở trạng thái ghi một phần hoặc xóa file còn được metadata hiện tại tham chiếu.
30. Sau thao tác thành công, query/UI được làm mới và không còn dùng media đã xóa.
31. Xóa/reset trong app không tuyên bố xóa tệp backup ngoài app hoặc tự thu hồi quyền do hệ điều hành quản lý.
32. Phụ huynh bật/tắt được mini test cuối bộ trong Beta.
33. Khu phụ huynh chỉ hiển thị bộ đã học và mini test đã làm/chưa làm, không hiển thị chi tiết lựa chọn, điểm phát âm hoặc đạt/rớt.
34. Xóa lịch sử học cũng xóa lịch sử mini test và mini-game nhưng giữ nguyên thẻ, bộ, media và cài đặt.

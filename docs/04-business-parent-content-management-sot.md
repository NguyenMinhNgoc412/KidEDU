# KidEDU SOT 04 — Business Spec: Parent & Content Management

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-01  
**Phạm vi:** Khu phụ huynh, quản lý thẻ học, bộ học, nội dung cá nhân hóa  
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
- cấu hình tốc độ học.

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

MVP không cần dashboard phức tạp. Chỉ cần rõ ràng, dễ dùng và ít bước.

---

## 4. Quản lý thẻ học

### 4.1. Tạo thẻ học

Phụ huynh tạo thẻ mới bằng cách nhập:

| Trường | Bắt buộc | Ghi chú nghiệp vụ |
|---|---:|---|
| Từ/cụm từ | Có | Nội dung trẻ cần luyện |
| Chủ đề/nhóm | Có | Giúp sắp xếp và tìm kiếm |
| Hình minh họa | Nên có | Có thể thêm sau |
| Video khẩu hình | Nên có | Có thể thêm sau |
| Âm thanh phát âm | Nên có | Có thể thêm sau |
| Âm thanh minh họa | Không | Chỉ dùng nếu phù hợp |
| Ghi chú phụ huynh | Không | Dành cho phụ huynh |

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

| Trạng thái | Ý nghĩa |
|---|---|
| Sẵn sàng học | Có đủ nội dung cần thiết để đưa vào phiên học |
| Cần bổ sung | Thiếu hình/video/audio quan trọng |
| Đã cá nhân hóa | Có ít nhất một nội dung do phụ huynh thêm |
| Đang luyện | Phụ huynh đánh dấu trẻ đang luyện |
| Đã quen | Phụ huynh đánh dấu trẻ đã quen từ này |
| Tạm ẩn | Không hiển thị cho trẻ nhưng chưa xóa |

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

| Loại | Mục đích |
|---|---|
| Video khẩu hình | Cho trẻ quan sát miệng người thân |
| Hình minh họa | Cho trẻ thấy đồ vật/người quen thuộc |
| Ảnh động ngắn | Thu hút chú ý và minh họa nghĩa |
| Audio phát âm | Dùng giọng người thân |
| Âm thanh minh họa | Tăng liên kết ngữ cảnh nếu không gây nhiễu |

### 6.3. Quy tắc ưu tiên

Khi một thẻ có nội dung cá nhân hóa:

1. App ưu tiên dùng nội dung cá nhân hóa.
2. Nếu nội dung cá nhân hóa bị xóa, dùng lại nội dung mặc định nếu có.
3. Nếu cả nội dung cá nhân hóa và mặc định đều thiếu, thẻ được đánh dấu cần bổ sung.

### 6.4. Quy tắc chất lượng nội dung

Video cá nhân hóa nên:

- ngắn;
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

| Cài đặt | Ý nghĩa |
|---|---|
| Tốc độ học | Chậm, bình thường, nhanh |
| Số vòng lặp | 1 vòng, 3 vòng, lặp liên tục |
| Âm thanh khen | Bật/tắt |
| Âm thanh minh họa | Bật/tắt |
| Tự chuyển bài | Bật/tắt trong một số mode |
| Hiển thị chữ | Bật/tắt hoặc chọn kích thước nếu cần sau MVP |

MVP chỉ cần những cài đặt thật sự ảnh hưởng đến phiên học.

---

## 9. Tiến độ cơ bản

Khu phụ huynh có thể hiển thị:

- thẻ học gần đây;
- bộ học gần đây;
- số lượt học;
- ngày học gần nhất;
- trạng thái phụ huynh đánh dấu.

Không hiển thị điểm phát âm tự động ở MVP.

---

## 10. Empty state và hướng dẫn phụ huynh

Khi chưa có nội dung:

- danh sách thẻ rỗng nên hướng dẫn tạo thẻ đầu tiên;
- danh sách bộ rỗng nên hướng dẫn tạo bộ học;
- thẻ thiếu nội dung nên gợi ý thêm hình/video/audio;
- bộ học không có thẻ nên không cho bắt đầu Auto Play.

Thông báo nên dùng ngôn ngữ đơn giản, không kỹ thuật.

---

## 11. Acceptance criteria

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

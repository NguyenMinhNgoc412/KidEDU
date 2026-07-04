# KidEDU SOT 03 — Business Spec: Auto Play Deck

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-04  
**Phạm vi:** Chế độ bộ thẻ tự chạy / luyện tự động  
**Ghi chú:** File này mô tả hành vi nghiệp vụ, không mô tả framework hoặc code.

---

## 1. Mục tiêu tính năng

Auto Play Deck giúp trẻ học một bộ từ/cụm từ liên tục mà không cần thao tác nhiều.

Trải nghiệm mong muốn giống một playlist ngắn:

```text
Mở bộ học
→ Bắt đầu
→ App tự phát từng thẻ
→ Trẻ nhìn, nghe, nói theo
→ App tự chuyển bài
→ Hết bộ thì kết thúc hoặc lặp lại
```

Tính năng này là core của KidEDU vì trẻ nhỏ hoặc trẻ chậm nói thường khó thao tác nhiều bước.

---

## 2. Người dùng và bối cảnh

### 2.1. Trẻ

Trẻ chỉ cần:

- nhìn màn hình;
- nghe mẫu;
- nói theo;
- không cần tự chọn từng thẻ.

### 2.2. Phụ huynh

Phụ huynh cần:

- chọn bộ học;
- chọn tốc độ học;
- chọn số vòng lặp;
- tạm dừng khi trẻ mất tập trung;
- phát lại thẻ hiện tại nếu cần;
- kết thúc phiên học.

---

## 3. Khái niệm nghiệp vụ

### 3.1. Auto Play Deck

Một bộ học được phát tự động theo danh sách thẻ đã sắp xếp.

### 3.2. Auto Play Session

Một lần trẻ học bằng chế độ tự chạy.

Session bắt đầu khi phụ huynh/trẻ bấm bắt đầu và kết thúc khi:

- hết bộ;
- hết số vòng lặp;
- phụ huynh bấm thoát;
- app bị đóng giữa chừng.

### 3.3. Card Step

Một thẻ trong phiên tự chạy có nhiều bước nhỏ:

1. Thu hút chú ý.
2. Phát mẫu.
3. Chờ trẻ nói theo.
4. Củng cố/phản hồi nhẹ.
5. Chuyển thẻ.

---

## 4. Timeline nghiệp vụ cho một thẻ

Timeline mặc định cho một thẻ:

```text
1. Hiển thị hình/ảnh động minh họa
2. Phát hết khẩu hình/video mẫu
3. Phát âm thanh phát âm nếu có audio riêng
4. Hiển thị tín hiệu “con nói theo”
5. Chờ trẻ nói theo 5 giây
6. Phản hồi nhẹ trong khoảng chuyển thẻ nếu bật
7. Tự chuyển sang thẻ tiếp theo
```

Thời lượng gợi ý:

| Giai đoạn | Thời lượng gợi ý | Ghi chú |
|---|---:|---|
| Thu hút chú ý | 0.5–1 giây | Animation nhẹ, không gây nhiễu |
| Phát mẫu | Theo độ dài video/audio thực tế | Không tự chuyển trước khi media phát xong |
| Chờ trẻ nói theo | 5 giây | Cố định trong MVP để trẻ có đủ thời gian bắt chước |
| Củng cố/phản hồi | Tối đa 1 giây | Có thể tắt; nếu bật thì phản hồi là khoảng chuyển thẻ |
| Chuyển thẻ | 1 giây | Tránh hiệu ứng quá mạnh |

---

## 5. Preset tốc độ học

MVP có 3 preset:

| Preset | Dành cho | Đặc điểm |
|---|---|---|
| Chậm | Trẻ mới bắt đầu hoặc cần nhịp mẫu chậm hơn | Phát media chậm hơn, nhịp chú ý/mẫu chậm hơn |
| Bình thường | Mặc định | Nhịp vừa phải |
| Nhanh | Ôn lại hoặc trẻ đã quen | Phát media nhanh hơn, nhịp chú ý/mẫu ngắn hơn |

Phụ huynh có thể chọn preset trước khi bắt đầu hoặc trong phần cài đặt.

Preset tốc độ không được rút ngắn giai đoạn trẻ nói theo trong MVP. Giai đoạn này cố định 5 giây sau khi video/audio mẫu đã phát xong.

---

## 6. Số vòng lặp

MVP hỗ trợ:

| Lựa chọn | Ý nghĩa |
|---|---|
| 1 vòng | Phát hết bộ một lần rồi kết thúc |
| 3 vòng | Phù hợp luyện lặp lại ngắn |
| Lặp liên tục | Chỉ dùng khi phụ huynh chủ động chọn |

Khi lặp liên tục, app vẫn phải có nút dừng rõ ràng cho phụ huynh.

---

## 7. Chế độ phát

### 7.1. Phát theo thứ tự

Đây là mặc định MVP.

App phát theo thứ tự phụ huynh đã sắp xếp trong bộ học.

### 7.2. Ôn tập đảo thứ tự

Có thể thêm nếu không làm chậm MVP.

Mục tiêu là tránh trẻ chỉ nhớ thứ tự, không nhớ nội dung.

### 7.3. Ôn tập cuối bộ

Có thể thêm nếu không làm chậm MVP.

Sau khi học hết bộ, app phát lại nhanh từng thẻ hoặc cho trẻ xem lại các từ vừa học.

---

## 8. UI hành vi bắt buộc

Màn hình Auto Play phải có:

- tên bộ học;
- tiến độ thẻ hiện tại, ví dụ `2/6`;
- hình/ảnh động minh họa;
- khẩu hình/video mẫu;
- từ/cụm từ đang học;
- tín hiệu đang phát mẫu hoặc đến lượt trẻ nói;
- nút tạm dừng;
- nút phát lại thẻ hiện tại;
- nút thoát.

Giao diện phải ưu tiên trẻ:

- ít chữ;
- nút lớn;
- không có menu phụ phức tạp;
- không có thao tác quản lý nội dung.

---

## 9. Hành vi pause/resume

Khi phụ huynh bấm tạm dừng:

1. App dừng phát nội dung hiện tại.
2. Màn hình giữ thẻ hiện tại.
3. Hiển thị nút tiếp tục.
4. Không tự chuyển bài khi đang tạm dừng.

Khi bấm tiếp tục:

1. App tiếp tục từ thẻ hiện tại.
2. Không nhảy sang thẻ khác ngoài ý muốn.

---

## 10. Hành vi phát lại

Khi bấm phát lại:

1. App phát lại thẻ hiện tại.
2. Không tăng thứ tự sang thẻ tiếp theo ngay.
3. Sau khi phát lại xong, tiếp tục timeline bình thường nếu phiên không bị tạm dừng.

---

## 11. Hành vi kết thúc phiên

Một phiên tự chạy kết thúc khi:

- phát hết số vòng đã chọn;
- phụ huynh bấm thoát;
- không còn thẻ hợp lệ để phát.

Màn hình kết thúc nên hiển thị đơn giản:

- “Con đã học xong bộ này”;
- số thẻ đã học;
- nút học lại;
- nút về danh sách bộ.

Không cần điểm số ở MVP.

---

## 12. Quy tắc khi thẻ thiếu nội dung

Nếu thẻ thiếu một phần nội dung:

| Trường hợp | Hành vi nghiệp vụ |
|---|---|
| Có hình + audio, thiếu video | Vẫn cho học, nhưng không có khẩu hình |
| Có video + audio, thiếu hình | Vẫn cho học, ưu tiên video |
| Có hình + video, thiếu audio | Vẫn cho học nếu video đã có tiếng hoặc phụ huynh chấp nhận |
| Chỉ có text, không có media | Không nên đưa vào Auto Play trừ khi phụ huynh chủ động |
| File cá nhân hóa không dùng được | Quay về nội dung mặc định nếu có |

Trong khu phụ huynh, thẻ thiếu nội dung nên có nhãn “Cần bổ sung”.

---

## 13. Quy tắc âm thanh và animation

Auto Play được phép dùng:

- âm thanh phát âm;
- âm thanh minh họa ngắn;
- âm thanh khen ngắn;
- ảnh động nhẹ;
- chuyển cảnh nhẹ.

Không được biến phiên học thành video giải trí quá kích thích.

Ưu tiên chú ý của trẻ phải là:

1. khẩu hình;
2. âm phát âm;
3. hình minh họa;
4. hiệu ứng phụ.

---

## 14. Progress được ghi nhận

MVP ghi nhận ở mức cơ bản:

- bộ nào đã học;
- thẻ nào đã phát;
- số lượt xem/luyện;
- thời điểm học gần nhất;
- phiên hoàn thành hay bị thoát giữa chừng.

Không ghi điểm đúng/sai tự động.

---

## 15. Acceptance criteria

Tính năng đạt khi:

1. Phụ huynh chọn được một bộ học và bắt đầu Auto Play.
2. App tự phát lần lượt các thẻ trong bộ.
3. Mỗi thẻ có giai đoạn phát mẫu và giai đoạn chờ trẻ nói theo.
4. App tự chuyển sang thẻ tiếp theo mà trẻ không cần bấm.
5. Phụ huynh có thể tạm dừng, tiếp tục, phát lại và thoát.
6. App xử lý được thẻ thiếu một phần nội dung mà không crash.
7. Khi có nội dung cá nhân hóa, Auto Play dùng nội dung cá nhân hóa trước.
8. Khi hết bộ, app hiển thị màn hình kết thúc đơn giản.
9. Progress cơ bản được ghi nhận.
10. Trải nghiệm không có hiệu ứng/âm thanh gây quá tải.

# KidEDU SOT 03 — Business Spec: Auto Play Deck & End-of-Deck Activities

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-08-06
**Phạm vi:** Chế độ bộ thẻ tự chạy, mini test cuối bộ và mini-game theo bộ
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

### 3.4. Mini test cuối bộ

Mini test là phần ôn tập ngắn sau khi trẻ hoàn thành bộ học. App phát audio của một từ và yêu cầu trẻ chọn hình tương ứng trong 2, 4 hoặc 6 hình theo tuổi.

Kết quả chỉ phản ánh lựa chọn trong lượt chơi, không đánh giá phát âm, khả năng ngôn ngữ hoặc tình trạng phát triển của trẻ.

### 3.5. Mini-game theo bộ

Beta có hai mini-game dùng nội dung của bộ vừa học:

- ghép hình hoàn chỉnh;
- lật thẻ tìm cặp.

Hai game dùng để củng cố và tạo hứng thú, không thuộc phần chấm kết quả của mini test.

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

| Giai đoạn        |                Thời lượng gợi ý | Ghi chú                                               |
| ---------------- | ------------------------------: | ----------------------------------------------------- |
| Thu hút chú ý    |                      0.5–1 giây | Animation nhẹ, không gây nhiễu                        |
| Phát mẫu         | Theo độ dài video/audio thực tế | Không tự chuyển trước khi media phát xong             |
| Chờ trẻ nói theo |                          5 giây | Cố định trong MVP để trẻ có đủ thời gian bắt chước    |
| Củng cố/phản hồi |                   Tối đa 1 giây | Có thể tắt; nếu bật thì phản hồi là khoảng chuyển thẻ |
| Chuyển thẻ       |                          1 giây | Tránh hiệu ứng quá mạnh                               |

---

## 5. Preset tốc độ học

MVP có 3 preset:

| Preset      | Dành cho                                   | Đặc điểm                                      |
| ----------- | ------------------------------------------ | --------------------------------------------- |
| Chậm        | Trẻ mới bắt đầu hoặc cần nhịp mẫu chậm hơn | Phát media chậm hơn, nhịp chú ý/mẫu chậm hơn  |
| Bình thường | Mặc định                                   | Nhịp vừa phải                                 |
| Nhanh       | Ôn lại hoặc trẻ đã quen                    | Phát media nhanh hơn, nhịp chú ý/mẫu ngắn hơn |

Phụ huynh có thể chọn preset trước khi bắt đầu hoặc trong phần cài đặt.

Preset tốc độ không được rút ngắn giai đoạn trẻ nói theo trong MVP. Giai đoạn này cố định 5 giây sau khi video/audio mẫu đã phát xong.

---

## 6. Số vòng lặp

MVP hỗ trợ:

| Lựa chọn     | Ý nghĩa                              |
| ------------ | ------------------------------------ |
| 1 vòng       | Phát hết bộ một lần rồi kết thúc     |
| 3 vòng       | Phù hợp luyện lặp lại ngắn           |
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

Beta đã duyệt ba hoạt động sau bộ học.

#### 7.3.1. Mini test nghe và chọn hình

1. Chỉ bắt đầu khi phụ huynh đã bật tính năng và phiên Auto Play hoàn thành bình thường; phiên bị thoát hoặc gián đoạn không tự mở mini test.
2. Mini test chỉ mở khi bộ có ít nhất 2 thẻ mục tiêu hợp lệ. Một thẻ mục tiêu cần cả hình minh họa và audio phát âm local dùng được; thẻ thiếu media bị loại riêng.
3. Mỗi lượt chọn ngẫu nhiên tối đa 5 từ mục tiêu trong bộ, không lặp; nếu bộ có dưới 5 từ hợp lệ thì giảm số câu theo số từ hiện có.
4. Số hình mỗi câu theo tuổi: dưới 3 tuổi, 3 tuổi hoặc thiếu tuổi dùng 2 hình; 4 tuổi dùng 4 hình; trên 4 tuổi dùng 6 hình.
5. Từ mục tiêu, đáp án và audio thuộc bộ vừa học. Ưu tiên hình nhiễu cùng bộ; nếu thiếu thì chọn ngẫu nhiên từ mọi hình local hợp lệ ở bộ khác. Không dùng hình trùng hoặc mơ hồ.
6. Khi mở câu, tất cả hình xuất hiện đồng thời với lúc audio tự phát. Hình chỉ nhận lựa chọn sau khi audio kết thúc; mini test không phát video hoặc hiển thị chữ/tên từ.
7. Nút “Phát lại” lớn nằm dưới khu vực hình và tạm khóa khi audio đang phát để tránh chồng âm.
8. Chọn chưa đúng chỉ làm hình vừa chọn rung ngang nhẹ; không có chữ/âm báo lỗi và trẻ được chọn lại không giới hạn.
9. Chọn đúng làm hình nổi lên/phóng nhẹ và phát file chúc mừng hiện có. Sau khi hiệu ứng/âm thanh kết thúc, app tự chuyển câu và không có nút “Tiếp tục”.
10. Sau câu cuối, app phát bước chúc mừng bằng cùng file âm thanh sau âm câu cuối, không chồng âm, rồi hiện menu “Làm lại”, “Trò chơi”, “Học tiếp” mà không có điểm số.
11. “Làm lại” tạo lượt ngẫu nhiên mới; “Trò chơi” mở menu mini-game của bộ; “Học tiếp” về chọn bộ. Đóng giữa lượt quay ngay về popup cuối bộ, không xác nhận/cảnh báo.
12. Lịch sử chỉ ghi bộ đã học và mini test đã làm/chưa làm. Chỉ hoàn thành toàn bộ lượt mới đánh dấu đã làm; không lưu lựa chọn, số lần sai hoặc phát lại.

#### 7.3.2. Ghép hình hoàn chỉnh

1. Game tự chạy theo các màn 2 → 3 → 4 mảnh và không cho chọn số mảnh thủ công. Một hình hợp lệ chơi màn 2 mảnh; hai hình chơi màn 2 và 3 mảnh; từ ba hình trở lên chơi đủ ba màn.
2. Mỗi lượt chọn ngẫu nhiên tối đa ba hình khác nhau từ đúng bộ và không lặp hình trong cùng lượt. “Chơi lại” chọn lại bộ hình ngẫu nhiên, ưu tiên khác lượt trước; được dùng lại khi không đủ hình thay thế.
3. Trẻ kéo từng mảnh từ khay phía dưới vào đúng vùng trong khung phía trên. Khung, khay và toàn bộ mảnh phải nằm trọn trong một màn hình không cuộn.
4. Khung chỉ có vùng đặt trống; mảnh và vùng đặt không hiển thị ảnh mờ, số hoặc chữ gợi ý. Thả chưa đúng thì mảnh quay nhẹ về vị trí ban đầu, không phạt hoặc phát cảnh báo.
5. Ứng dụng cắt ảnh bằng bộ mẫu có sẵn cho 2, 3 và 4 mảnh. Mỗi hình được gán mẫu phù hợp để giữ phần nhận diện; nếu chưa có mẫu riêng thì dùng mẫu an toàn mặc định không cắt bỏ hoặc che mất vùng ảnh.
6. Mảnh không bắt buộc là ô vuông/chữ nhật; mẫu có thể dùng hình dạng phù hợp với vật thể. Các mảnh không chồng lấn và khi ghép đúng phải khôi phục nguyên vẹn hình ban đầu.
7. Hoàn thành hình chỉ làm hình hoàn chỉnh nổi lên, không phát âm thanh và không tự chuyển màn. Nếu còn màn, hiển thị “Tiếp tục” và “Học tiếp”; màn cuối hiển thị “Chơi lại” và “Học tiếp”.
8. “Tiếp tục” sang cấp kế tiếp; “Chơi lại” bắt đầu từ 2 mảnh; “Học tiếp” về màn chọn bộ. Game chỉ ghi nhận bắt đầu/hoàn thành, không tạo điểm ngôn ngữ.

#### 7.3.3. Lật thẻ tìm cặp

1. Game tự tăng theo màn 2 → 3 → 4 → tối đa 5 cặp, không cho chọn cấp thủ công. Hai hình hợp lệ chơi màn 2 cặp; 3–4 hình dừng ở số cặp tương ứng; từ 5 hình chơi đủ tới 5 cặp; dưới 2 hình thì không mở game.
2. Mỗi cấp chọn lại toàn bộ hình ngẫu nhiên từ đúng bộ. Trong cùng cấp, mỗi hình chỉ tạo đúng một cặp. Mặt sau tất cả thẻ dùng logo KidEDU và không để lộ hình mặt trước.
3. Mỗi lượt trẻ lật tối đa hai thẻ. Cặp chưa đúng úp lại nhẹ nhàng, không có âm báo lỗi mạnh. Cặp đúng đồng thời thu nhỏ và mờ dần rồi biến mất.
4. Mỗi cặp đúng phát file chúc mừng hiện có ở âm lượng vừa phải, không phát âm thanh mẫu của từ. Khi tất cả cặp biến mất, phát lại cùng file để báo hoàn thành sau khi âm của cặp cuối kết thúc; không chồng âm thanh.
5. Sau cấp chưa phải cao nhất, hiển thị “Tiếp tục” và “Học tiếp”. Sau cấp cao nhất mà bộ đủ hình, hiển thị “Chơi lại” và “Học tiếp”; chơi lại bắt đầu từ 2 cặp với hình chọn lại ngẫu nhiên.
6. Không có đếm ngược hoặc lượt sống. Game chỉ ghi nhận bắt đầu/hoàn thành, không tạo điểm ngôn ngữ.

#### 7.3.4. Quy tắc chung

- Ưu tiên media cá nhân hóa hợp lệ rồi fallback về media mặc định.
- Không phát nhiều lớp âm thanh cùng lúc.
- Phản hồi/animation khen phải ngắn, nhẹ và không lấn át từ mục tiêu.
- Không thu âm trẻ và không dùng AI chấm phát âm.
- Sau khi Auto Play hoàn thành, popup hiển thị ba lựa chọn: về màn chọn bộ học, mini test và trò chơi. Trò chơi mở lựa chọn ghép hình hoặc lật thẻ.
- Nút đóng giữa lượt có hiệu lực ngay và quay về menu chọn trò chơi của bộ hiện tại, không cần popup xác nhận. Chỉ “Học tiếp” mới về màn chọn bộ học.
- Với chế độ lặp liên tục, hoạt động cuối bộ chỉ xuất hiện sau khi phụ huynh chủ động kết thúc vòng học và chọn ôn tập.

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

Sau khi Auto Play hoàn thành bình thường, app hiển thị popup đơn giản với ba hành động lớn:

- “Học bộ tiếp” để về màn chọn bộ học;
- “Mini test” khi bộ có ít nhất hai thẻ có ảnh minh họa và audio phát âm local hợp lệ;
- “Trò chơi” để chọn ghép hình hoặc lật thẻ với ảnh hợp lệ của đúng bộ vừa học.

Nếu một hoạt động chưa đủ media, popup giải thích ngắn, thân thiện và không tự mở hoạt động đó.

MVP không cần điểm số. Trong Beta, app chỉ được ghi nhận kết quả đúng lần đầu, đúng sau khi nghe lại hoặc được hướng dẫn của câu chọn hình; không tính điểm tổng hoặc dùng kết quả game để đánh giá ngôn ngữ.

---

## 12. Quy tắc khi thẻ thiếu nội dung

Nếu thẻ thiếu một phần nội dung:

| Trường hợp                       | Hành vi nghiệp vụ                                          |
| -------------------------------- | ---------------------------------------------------------- |
| Có hình + audio, thiếu video     | Vẫn cho học, nhưng không có khẩu hình                      |
| Có video + audio, thiếu hình     | Vẫn cho học, ưu tiên video                                 |
| Có hình + video, thiếu audio     | Vẫn cho học nếu video đã có tiếng hoặc phụ huynh chấp nhận |
| Chỉ có text, không có media      | Không nên đưa vào Auto Play trừ khi phụ huynh chủ động     |
| File cá nhân hóa không dùng được | Quay về nội dung mặc định nếu có                           |

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

Beta được ghi nhận thêm:

- mini test của bộ đã làm hay chưa làm; chỉ hoàn thành toàn bộ lượt mới tính là đã làm;
- mini-game nào đã bắt đầu/hoàn thành.

App chỉ tự so sánh lựa chọn hình với đáp án cố định. App không ghi điểm phát âm, không tự đổi trạng thái thẻ sang “Đã quen” và không diễn giải kết quả thành đánh giá y khoa.

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
11. Sau khi hoàn thành bộ, app tạo tối đa 5 câu mini test ngẫu nhiên khi bộ có ít nhất 2 thẻ mục tiêu hợp lệ.
12. Mỗi câu hiển thị 2/4/6 hình theo tuổi, cho phép hình nhiễu local ngoài bộ khi cần và không tạo lựa chọn trùng hoặc mơ hồ.
13. Hình chỉ nhận chạm sau audio; trẻ có thể phát lại/chọn lại, sai chỉ rung nhẹ, đúng nổi/phóng nhẹ + âm thanh rồi tự chuyển câu.
14. Ghép hình tự tăng 2 → 3 → 4 mảnh, dùng tối đa ba hình khác nhau trong bộ; kéo sai quay lại nhẹ, ghép xong chỉ làm hình nổi lên và chờ “Tiếp tục”/“Học tiếp”.
15. Lật thẻ tự tăng 2 → tối đa 5 cặp theo số hình hợp lệ; cặp đúng thu nhỏ, mờ dần, biến mất và phát file chúc mừng, sau cặp cuối phát lại file đó mà không chồng âm.
16. Hai mini-game không tạo điểm ngôn ngữ, không có timer/lượt sống và không dùng AI.
17. Thẻ/media thiếu điều kiện được bỏ qua an toàn; lịch sử chỉ ghi đã học và mini test đã làm/chưa làm, không lưu chi tiết từng câu.

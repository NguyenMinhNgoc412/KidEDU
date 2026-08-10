# KidEDU 11 — Thảo luận lại Mini test

**Trạng thái:** Owner đã duyệt — đặc tả nghiệp vụ chi tiết cho mini test  
**Dự án:** KidEDU  
**Ngày tạo:** 2026-08-05  
**Cập nhật gần nhất:** 2026-08-06  
**Phạm vi:** Mini test nghe âm thanh và chọn hình sau khi học xong một bộ

---

## 1. Mục đích của file

File này ghi lại đặc tả mini test đã được owner duyệt sau khi đối chiếu helper/code hiện tại. `01` và `03` chứa bản tóm tắt nghiệp vụ chính thức; file này giữ chi tiết hành vi để thiết kế, chia task và kiểm thử.

Nếu code hiện tại khác file này, không dùng implementation để suy ngược hoặc thay đổi yêu cầu sản phẩm. Thay đổi mới phải quay lại bước thảo luận và được owner duyệt trước khi sửa SOT/code.

---

## 2. Mục tiêu cần giữ

- Giúp trẻ nối âm thanh vừa nghe với hình ảnh tương ứng.
- Trải nghiệm giống một lượt ôn nhẹ, không giống bài thi gây áp lực.
- Không thu âm, không dùng AI và không chấm phát âm.
- Không hiển thị điểm tổng, phần trăm, xếp hạng hoặc đạt/rớt.
- Từ mục tiêu, đáp án đúng và audio phải thuộc đúng bộ vừa học; hình nhiễu được phép lấy từ bộ khác khi bộ hiện tại không đủ lựa chọn.
- Ưu tiên media cá nhân hóa hợp lệ rồi mới dùng media mặc định.

---

## 3. Những điểm owner đã xác nhận

- Mỗi câu chỉ cần hiển thị hình và phát âm thanh; không phát video khẩu hình để tránh chờ lâu.
- Có nút lớn để phát lại âm thanh nếu trẻ quên.
- Nếu trẻ chọn chưa đúng, hình vừa chọn rung ngang nhẹ như lắc đầu rồi cho chọn lại; không hiện thông báo chữ và không phát âm báo lỗi.
- Không tự khóa câu hỏi sau lần chọn sai và không tạo cảm giác bị phạt.
- Khi trẻ chọn đúng, hình đúng hiển thị phản hồi hình ảnh ngắn và phát file âm thanh chúc mừng hiện có.
- Hiệu ứng đúng làm hình được chọn nổi lên và phóng nhẹ; không thêm viền sáng hoặc hiệu ứng mạnh khác.
- App chỉ tự chuyển sang câu tiếp theo sau khi hiệu ứng và âm thanh khen kết thúc; không có nút “Tiếp tục” và không phát chồng audio câu mới.
- Mỗi lượt mini test có tối đa 5 câu được chọn ngẫu nhiên từ các từ hợp lệ trong bộ vừa học.
- Không lặp từ mục tiêu trong cùng lượt khi bộ có đủ từ hợp lệ khác nhau.
- Nếu bộ có dưới 5 từ mục tiêu hợp lệ, số câu giảm theo số từ hiện có; không lặp từ để cố đủ 5 câu.
- Một thẻ chỉ đủ điều kiện làm từ mục tiêu khi có cả hình minh họa hợp lệ và audio phát âm local dùng được.
- Thẻ thiếu hình hoặc thiếu audio chỉ bị loại khỏi mini test; không khóa mini test của toàn bộ bộ nếu vẫn còn thẻ mục tiêu hợp lệ khác.
- Mini test chỉ mở khi bộ có ít nhất 2 thẻ mục tiêu hợp lệ. Nếu bộ chỉ có 1 hoặc không có thẻ hợp lệ, không tạo mini test và hiển thị giải thích ngắn rằng bộ chưa đủ nội dung để ôn.
- Khi hoàn thành lượt, app hiển thị menu ba nút và không hiển thị điểm số: **“Làm lại”**, **“Trò chơi”** và **“Học tiếp”**.
- Sau câu cuối, app hiển thị bước chúc mừng ngắn trước; chỉ khi bước chúc mừng kết thúc mới hiện menu ba nút.
- Bước chúc mừng cuối lượt phát file âm thanh chúc mừng hiện có sau khi âm thanh khen của câu cuối kết thúc; không phát chồng hai âm thanh.
- “Làm lại” tạo lượt mini test mới với câu hỏi và hình nhiễu được chọn lại ngẫu nhiên; “Trò chơi” mở menu ghép hình/lật thẻ của bộ hiện tại; “Học tiếp” quay về màn chọn bộ học.
- Nút đóng giữa lượt quay về popup cuối bộ với ba lựa chọn ban đầu, không về menu trò chơi hoặc màn chọn bộ trực tiếp.
- Đóng giữa lượt có hiệu lực ngay, không hiển thị popup xác nhận và không phát cảnh báo hoặc âm thanh khi thoát.
- Lịch sử chỉ ghi ở cấp bộ: bộ đã học hay chưa và mini test đã làm hay chưa; không lưu lựa chọn từng câu, số lần chọn sai hoặc số lần phát lại.
- Chỉ đánh dấu “đã làm mini test” khi trẻ hoàn thành toàn bộ lượt. Đóng giữa lượt không được tính là đã làm test.
- Số hình lựa chọn thay đổi theo tuổi của trẻ: 3 tuổi hiển thị 2 hình, 4 tuổi hiển thị 4 hình, trên 4 tuổi hiển thị 6 hình.
- Trẻ dưới 3 tuổi hoặc hồ sơ chưa nhập tuổi dùng mặc định 2 hình lựa chọn.
- Ưu tiên lấy hình đáp án và hình nhiễu trong bộ vừa học. Nếu không đủ 4 hoặc 6 hình khác nhau, ứng dụng lấy thêm hình nhiễu từ bộ khác để đủ số lượng theo tuổi; không giảm số lựa chọn chỉ vì bộ hiện tại thiếu hình.
- Hình lấy từ bộ khác chỉ được làm phương án nhiễu, không được trở thành từ mục tiêu hoặc thay audio của câu hỏi.
- Hình nhiễu ngoài bộ được chọn ngẫu nhiên từ bất kỳ hình hợp lệ nào đang có local trên thiết bị, không phụ thuộc trẻ đã học bộ chứa hình đó hay chưa.
- Không chọn hình trùng đáp án, trùng với phương án khác hoặc có nội dung dễ gây mơ hồ với từ mục tiêu.
- Khi mở một câu, toàn bộ hình lựa chọn xuất hiện đồng thời với lúc audio mẫu bắt đầu phát; không chờ audio kết thúc mới hiển thị hình.
- Audio mẫu tự phát một lần khi mở câu. Trong lúc audio đang phát, các hình vẫn hiển thị nhưng chưa nhận thao tác chọn; chỉ bật lựa chọn sau khi audio phát xong.
- Câu hỏi chỉ hiển thị hình, không hiển thị chữ hoặc tên từ dưới hình.
- Nút **“Phát lại”** nằm bên dưới khu vực các hình, có kích thước lớn và dễ bấm.
- Trong lúc audio đang phát, nút phát lại tạm khóa để không khởi chạy nhiều lượt audio chồng lên nhau.
- Mini test được mở từ popup sau khi học xong bộ.
- Popup cuối bộ có ba lựa chọn: về chọn bộ học, mini test và trò chơi.

---

## 4. Implementation hiện tại — chỉ để đối chiếu

Phần này mô tả code đang có, **không khẳng định đây là UX đúng**.

- Đã có helper chọn từ mục tiêu và hình nhiễu trong cùng bộ.
- Logic hiện tại cố định hai lựa chọn hình cho mỗi câu, chưa đáp ứng quy tắc 2/4/6 hình theo tuổi.
- Dự kiến tạo tối đa 5 câu từ các thẻ có cả hình và audio local hợp lệ.
- Chưa có màn mini test hoàn chỉnh; nút mini test cuối bộ hiện chưa mở được luồng chơi.

Các chi tiết chính đã được thảo luận xong và đang chờ owner duyệt tổng thể trước khi đồng bộ vào SOT chính thức.

---

## 5. Luồng cần thống nhất lại

```text
Mở mini test từ cuối bộ
→ hiển thị các lựa chọn hình
→ phát âm thanh mẫu
→ trẻ chọn một hình
   → chưa đúng: rung ngang nhẹ hình vừa chọn, giữ câu hiện tại, cho chọn lại
   → đúng: phản hồi hình ảnh + âm thanh chúc mừng, sau đó tự chuyển câu
→ hết số câu
→ sau âm thanh câu cuối: hiển thị bước chúc mừng và phát lại file chúc mừng, không có điểm số
→ sau khi chúc mừng kết thúc, hiển thị menu hoàn thành
   → “Làm lại”: tạo lượt câu hỏi ngẫu nhiên mới
   → “Trò chơi”: mở menu mini-game của bộ hiện tại
   → “Học tiếp”: về màn chọn bộ học
```

---

## 6. Trạng thái quyết định

### 6.1. Cấu trúc một câu

Không còn câu hỏi mở về cấu trúc và thời điểm tương tác của một câu.

### 6.2. Phản hồi

Không còn câu hỏi mở về phản hồi đúng/chưa đúng.

### 6.3. Số câu và lựa chọn nội dung

Không còn câu hỏi mở về số câu và điều kiện media.

### 6.4. Kết thúc và điều hướng

Không còn câu hỏi mở về màn hoàn thành, điều hướng và lịch sử.

---

## 7. Ranh giới không được vượt

- Không kết luận trẻ “biết/không biết”, “đúng phát âm/sai phát âm”.
- Không biến số lần chọn sai thành điểm hoặc cảnh báo cho trẻ.
- Không phát video trong câu hỏi.
- Không dùng từ mục tiêu, đáp án đúng hoặc audio ngoài bộ học hiện tại. Hình ngoài bộ chỉ được dùng làm phương án nhiễu khi cần đủ số lựa chọn theo tuổi.
- Không phát audio câu hỏi cùng lúc với âm thanh khen.
- Không thêm đếm ngược, số mạng hoặc màn đạt/rớt nếu chưa có quyết định mới.

---

## 8. Checklist duyệt

- [x] Chốt số hình theo tuổi và fallback: dưới 3 tuổi/thiếu tuổi/3 tuổi = 2 hình, 4 tuổi = 4 hình, trên 4 tuổi = 6 hình; thiếu hình trong bộ thì lấy hình nhiễu từ bộ khác.
- [x] Chốt hình nhiễu ngoài bộ được chọn ngẫu nhiên từ mọi hình local hợp lệ, không yêu cầu trẻ đã học bộ đó.
- [x] Chốt hình lựa chọn xuất hiện đồng thời với lúc audio mẫu bắt đầu phát.
- [x] Chốt audio tự phát khi mở câu; hình chỉ nhận lựa chọn sau khi audio kết thúc.
- [x] Chốt câu hỏi chỉ dùng hình và audio, không hiển thị chữ/tên từ dưới hình.
- [x] Chốt nút “Phát lại” nằm dưới khu vực hình và tạm khóa trong lúc audio đang phát.
- [x] Chốt hoàn chỉnh phản hồi: sai rung ngang nhẹ; đúng nổi lên/phóng nhẹ, phát âm thanh chúc mừng rồi tự chuyển câu.
- [x] Chốt phản hồi chưa đúng: hình được chọn rung ngang nhẹ, không có chữ/âm báo lỗi và cho chọn lại.
- [x] Chốt câu đúng phát file chúc mừng hiện có; chuyển câu sau khi hiệu ứng/âm thanh kết thúc, không chồng audio.
- [x] Chốt chọn đúng tự chuyển sang câu kế tiếp sau hiệu ứng hình ảnh, không có nút “Tiếp tục”.
- [x] Chốt số câu bằng tối đa 5 và giảm theo số từ mục tiêu hợp lệ trong bộ, không lặp từ để đủ số lượng.
- [x] Chốt mini test cần ít nhất 2 thẻ mục tiêu hợp lệ; bộ chỉ có 0–1 thẻ thì không mở mini test.
- [x] Chốt thẻ mục tiêu cần cả hình và audio local; thẻ thiếu media bị loại riêng, không khóa toàn bộ bộ.
- [x] Chốt màn hoàn thành/điều hướng: chúc mừng có âm thanh, menu ba nút, đóng giữa lượt về popup cuối bộ ngay không cần xác nhận.
- [x] Chốt nút đóng giữa lượt quay về popup cuối bộ.
- [x] Chốt lịch sử chỉ ghi bộ đã học và mini test đã làm/chưa làm; không lưu chi tiết từng câu hoặc thao tác.
- [x] Owner duyệt tổng thể; đã đồng bộ các SOT và hướng dẫn liên quan trước khi implement.

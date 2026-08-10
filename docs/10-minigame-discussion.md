# KidEDU 10 — Thảo luận lại Mini-game

**Trạng thái:** Owner đã duyệt — đặc tả nghiệp vụ chi tiết cho mini-game  
**Dự án:** KidEDU  
**Ngày tạo:** 2026-08-05  
**Cập nhật gần nhất:** 2026-08-06  
**Phạm vi:** Ghép hình và lật thẻ sau khi học xong một bộ

---

## 1. Mục đích của file

File này ghi lại đặc tả mini-game đã được owner duyệt sau khi đối chiếu implementation hiện tại. `01` và `03` chứa bản tóm tắt nghiệp vụ chính thức; file này giữ chi tiết hành vi để thiết kế, chia task và kiểm thử.

Nếu code hiện tại khác file này, không dùng implementation để suy ngược hoặc thay đổi yêu cầu sản phẩm. Thay đổi mới phải quay lại bước thảo luận và được owner duyệt trước khi sửa SOT/code.

---

## 2. Mục tiêu cần giữ

- Củng cố hình ảnh của những từ trẻ vừa học.
- Cách chơi ngắn, dễ hiểu, ít chữ và không gây áp lực.
- Không chấm khả năng ngôn ngữ, không có thắng/thua, điểm số, đồng hồ hoặc số mạng.
- Chỉ dùng hình thuộc đúng bộ học đang chơi.
- Ưu tiên hình cá nhân hóa hợp lệ rồi mới dùng hình mặc định.
- Âm thanh và chuyển động nhẹ, không gây giật mình.

---

## 3. Những điểm owner đã xác nhận

### 3.1. Ghép hình

- Trẻ ghép bằng cách kéo từng mảnh vào đúng vị trí trong khung hình.
- Nếu thả chưa đúng vị trí, mảnh quay lại chỗ ban đầu bằng chuyển động nhẹ để trẻ chọn lại.
- Khung ghép nằm phía trên và toàn bộ mảnh chưa ghép nằm trong khay phía dưới.
- Khung và khay mảnh phải cùng hiển thị trọn vẹn trong một màn hình, không yêu cầu cuộn để nhìn hoặc kéo mảnh.
- Khung ghép chỉ hiển thị các vùng đặt mảnh trống, không dùng ảnh hoàn chỉnh mờ làm gợi ý phía dưới.
- Mảnh ghép và vùng đặt không hiển thị số hoặc chữ gợi ý; phần ghép chỉ dùng hình ảnh và hình dạng mảnh.
- Ứng dụng tự cắt ảnh theo một bộ mẫu hình dạng có sẵn cho từng mức 2, 3 và 4 mảnh; không yêu cầu chuẩn bị asset mảnh ghép riêng cho từng hình.
- Mỗi mẫu cắt phải tạo đủ số mảnh, các mảnh không chồng lấn và khi đặt đúng phải khôi phục trọn vẹn hình ban đầu.
- Mỗi hình được gán trước mẫu cắt phù hợp; ứng dụng không chọn mẫu cắt ngẫu nhiên khi bắt đầu màn.
- Mẫu được gán phải giữ được phần nhận diện chính của vật thể và không làm mất nội dung quan trọng của hình.
- Nếu hình chưa được gán mẫu riêng, ứng dụng dùng mẫu cắt an toàn mặc định tương ứng với mức 2, 3 hoặc 4 mảnh thay vì bỏ qua hình.
- Mẫu an toàn phải chia đủ toàn bộ ảnh, không cắt bỏ hoặc che mất vùng ảnh; khi ghép đúng phải khôi phục nguyên vẹn hình ban đầu.
- Game chơi theo nhiều màn và tự tăng dần số **mảnh ghép**; trẻ không chọn thủ công số mảnh trước khi chơi.
- Tiến trình cố định là **2 → 3 → 4 mảnh** rồi kết thúc; không tăng quá 4 mảnh vì đây là hoạt động giải trí nhẹ sau khi học.
- Ba màn dùng ba hình khác nhau được chọn ngẫu nhiên từ đúng bộ học: màn 2 mảnh dùng hình thứ nhất, màn 3 mảnh dùng hình thứ hai và màn 4 mảnh dùng hình thứ ba.
- Không lặp lại một hình trong cùng lượt ghép hình.
- Nếu bộ có ít hơn 3 hình hợp lệ, game vẫn mở và chỉ tạo số màn tương ứng: 1 hình chơi màn 2 mảnh; 2 hình chơi màn 2 rồi 3 mảnh; từ 3 hình trở lên chơi đủ màn 2, 3 rồi 4 mảnh.
- Màn 2 mảnh phải có đúng 2 mảnh ghép để tạo thành một hình hoàn chỉnh, không tạo sẵn 4 mảnh rồi yêu cầu chọn hoặc ghép 2 mảnh.
- Mảnh ghép không bắt buộc là ô vuông hoặc chữ nhật. Hình dạng có thể bám theo vật thể; ví dụ quả bóng có thể tách thành hai nửa hình tròn, hoặc tách theo bốn góc ở màn nhiều mảnh hơn.
- Khi ghép xong, hình hoàn chỉnh nổi lên và game không tự chuyển màn.
- Hoàn thành hình ghép không phát âm thanh chúc mừng; chỉ dùng hiệu ứng hình hoàn chỉnh nổi lên.
- Nếu còn màn ghép, hiển thị hai lựa chọn: **“Tiếp tục”** để sang màn kế tiếp hoặc **“Học tiếp”** để thoát trò chơi và quay về màn chọn bộ học.
- Ở màn ghép cuối, không hiển thị “Tiếp tục”; hiển thị **“Chơi lại”** để bắt đầu lại trò ghép hình và **“Học tiếp”** để quay về chọn bộ học.
- Khi chọn “Chơi lại”, game tạo lượt mới từ màn 2 mảnh và chọn lại hình ngẫu nhiên trong bộ, ưu tiên các hình khác lượt vừa hoàn thành. Nếu bộ không có đủ hình thay thế, game được phép dùng lại hình cũ.
- Hình tiếp theo chỉ được lấy từ bộ học hiện tại.
- Đặt sai không phạt trẻ và không phát âm báo lỗi mạnh.

### 3.2. Lật thẻ

- Số lượng nằm trong khoảng 2 đến 5 **cặp**.
- Game tự tăng cấp theo tiến trình **2 → 3 → 4 → 5 cặp**; người chơi không chọn thủ công số cặp trước hoặc trong lượt.
- Mỗi cặp dùng cùng một hình và hình phải thuộc bộ học hiện tại.
- Khi bắt đầu mỗi cấp, game chọn lại toàn bộ hình ngẫu nhiên từ bộ thay vì giữ hình cũ rồi thêm hình mới.
- Trong cùng một cấp, mỗi hình chỉ tạo đúng một cặp; không dùng cùng một hình để tạo nhiều cặp khác nhau.
- Cấp cao nhất phụ thuộc số hình hợp lệ trong bộ: 2 hình dừng ở 2 cặp, 3 hình dừng ở 3 cặp, 4 hình dừng ở 4 cặp, từ 5 hình trở lên chơi đủ tới 5 cặp.
- Bộ có ít hơn 2 hình hợp lệ không đủ điều kiện mở trò lật thẻ.
- Mặt sau tất cả thẻ dùng logo KidEDU, hiển thị thống nhất và không để lộ hình ở mặt trước.
- Ghép đúng từng cặp không cần phát âm thanh mẫu.
- Khi lật đúng một cặp, hai thẻ đồng thời thu nhỏ và mờ dần rồi biến mất; hiệu ứng phải ngắn và nhẹ.
- Hiệu ứng biến mất chạy cùng một âm thanh chúc mừng ngắn, vừa phải dành cho cặp đúng.
- Khi tất cả cặp đã biến mất, game phát thêm một âm thanh hoàn thành màn.
- Âm thanh hoàn thành chỉ bắt đầu sau khi âm thanh khen của cặp cuối kết thúc; không phát chồng hai âm thanh và giữ âm lượng vừa phải.
- Cả âm thanh khen cặp đúng và âm thanh hoàn thành màn đều dùng file chúc mừng hiện có; không cần thêm file âm thanh riêng.
- Sau màn 2, 3 hoặc 4 cặp, game không tự chuyển ngay mà hiển thị **“Tiếp tục”** để sang cấp kế tiếp và **“Học tiếp”** để thoát về màn chọn bộ học.
- Sau cấp cao nhất mà bộ đủ hình, game hiển thị **“Chơi lại”** để bắt đầu lại từ 2 cặp với bộ hình được chọn lại ngẫu nhiên và **“Học tiếp”** để về màn chọn bộ học.

### 3.3. Điều hướng

- Từ popup cuối bộ, “Trò chơi” mở nơi chọn ghép hình hoặc lật thẻ.
- “Học bộ tiếp” thoát về màn chọn bộ học, không tự chọn một bộ thay cho trẻ/phụ huynh.
- Nút đóng trong lúc ghép hình hoặc lật thẻ quay về menu chọn trò chơi của bộ hiện tại, không về thẳng màn chọn bộ học.
- Nút đóng quay về menu trò chơi ngay, không hiển thị popup xác nhận; lượt đang chơi được kết thúc nhẹ nhàng mà không phát cảnh báo.
- “Học tiếp” là thao tác riêng để thoát khu trò chơi và quay về màn chọn bộ học.

---

## 4. Implementation hiện tại — chỉ để đối chiếu

Phần này mô tả code đang có, **không khẳng định đây là UX đúng**.

### Ghép hình hiện tại

- Chia mọi hình thành 4 mảnh theo lưới 2 × 2.
- Hiển thị một bảng đích và một khay 4 mảnh bên dưới.
- Các ô và mảnh có số 1–4 làm gợi ý.
- Trẻ kéo từng mảnh vào ô cùng vị trí.
- Chơi lần lượt toàn bộ hình hợp lệ trong bộ.

### Lật thẻ hiện tại

- Hiển thị nút để chọn thủ công 2, 3, 4 hoặc 5 cặp.
- Ghép sai thì hai thẻ tự úp lại.
- Ghép đúng thì cặp thẻ hiện giữ nguyên trên bàn, chưa biến mất và chưa phát âm thanh khen theo từng cặp.
- Ghép xong toàn bộ màn mới phát một âm thanh chúc mừng.

Các chi tiết đã xác định là đang lệch ý tưởng gồm: ghép hình cố định 4 mảnh vuông, số mảnh không tăng theo màn, hiển thị số gợi ý, tự chuyển hình, lật đúng nhưng cặp thẻ không biến mất, và chỉ phát âm thanh khi hoàn thành toàn bộ màn.

---

## 5. Luồng cần thống nhất lại

### 5.1. Ghép hình

```text
Mở game
→ chọn ngẫu nhiên tối đa 3 hình khác nhau trong bộ
→ tự bắt đầu ở màn 2 mảnh với hình thứ nhất
→ xem khung ghép phía trên và đúng số mảnh cần ghép trong khay phía dưới
→ kéo từng mảnh vào đúng vị trí trong khung hình
→ nếu đặt chưa đúng: mảnh quay lại vị trí ban đầu
→ hoàn thành: hình nổi lên
→ hiển thị “Tiếp tục” và “Học tiếp”
   → “Tiếp tục”: nếu có hình thứ hai, sang màn 3 mảnh; nếu có hình thứ ba, sang màn 4 mảnh
   → “Học tiếp”: thoát game và về màn chọn bộ học
→ ở màn cuối hiển thị “Chơi lại” và “Học tiếp”
   → “Chơi lại”: chọn lại bộ hình ngẫu nhiên và bắt đầu từ màn 2 mảnh
   → “Học tiếp”: thoát game và về màn chọn bộ học
```

### 5.2. Lật thẻ

```text
Mở game
→ tự bắt đầu ở màn 2 cặp
→ mỗi lượt mở tối đa hai thẻ
→ đúng: phát âm thanh khen nhẹ và cho cặp thẻ biến mất
→ chưa đúng: úp lại nhẹ nhàng
→ hoàn thành màn
→ sau màn chưa phải cấp cao nhất: hiển thị “Tiếp tục” và “Học tiếp”
   → “Tiếp tục”: tăng lên cấp kế tiếp theo thứ tự 3, 4 rồi tối đa 5 cặp
   → “Học tiếp”: thoát game và về màn chọn bộ học
→ sau cấp cao nhất mà bộ đủ hình: hiển thị “Chơi lại” và “Học tiếp”
   → “Chơi lại”: chọn lại bộ hình ngẫu nhiên và bắt đầu từ màn 2 cặp
   → “Học tiếp”: thoát game và về màn chọn bộ học
```

---

## 6. Trạng thái quyết định

### 6.1. Ghép hình

Owner đã duyệt cơ chế cắt ảnh. Các mẫu cụ thể và cách lưu/gán mẫu sẽ được thiết kế trong bước kỹ thuật trước khi sửa code.

### 6.2. Lật thẻ

Owner đã duyệt tiến trình cấp, cách chọn hình, mặt sau thẻ, hiệu ứng biến mất và âm thanh.

### 6.3. Kết thúc và thoát

Owner đã duyệt điều hướng, hành vi đóng giữa lượt và phạm vi âm thanh của cả hai game.

---

## 7. Ràng buộc khi triển khai

- Thay cơ chế ghép hình cố định 4 mảnh và nút chọn cấp hiện tại bằng tiến trình đã duyệt.
- Thay hành vi cặp lật đúng nằm lại trên bàn bằng hiệu ứng biến mất đã duyệt.
- Không bổ sung điểm, thời gian, phần thưởng, nhân vật hoặc hiệu ứng mới.
- Trước khi code mẫu cắt/gán mẫu, phải chốt ảnh hưởng tới data/media architecture và cập nhật đúng SOT kỹ thuật nếu cần thay đổi schema hoặc bundled metadata.
- Mọi thay đổi nghiệp vụ mới phải được owner duyệt và đồng bộ lại `01`/`03`.

---

## 8. Checklist duyệt

- [x] Chốt kéo từng mảnh vào đúng vị trí trong khung; đặt chưa đúng thì mảnh quay lại nhẹ nhàng.
- [x] Chốt khung ghép ở trên, khay mảnh ở dưới và tất cả nằm trọn trong một màn hình không cuộn.
- [x] Chốt khung chỉ có vùng đặt trống, không hiển thị ảnh hoàn chỉnh mờ làm gợi ý.
- [x] Chốt mảnh và vùng đặt không có số/chữ gợi ý, chỉ dùng hình ảnh và hình dạng.
- [x] Chốt ứng dụng tự cắt ảnh bằng bộ mẫu có sẵn cho các mức 2, 3 và 4 mảnh.
- [x] Chốt mỗi hình được gán trước mẫu phù hợp để giữ phần nhận diện và không làm mất nội dung quan trọng.
- [x] Chốt hình chưa được gán mẫu riêng dùng mẫu cắt an toàn mặc định, không bị loại khỏi game.
- [x] Chốt tự tăng theo ba màn 2 → 3 → 4 mảnh và không vượt quá 4 mảnh.
- [x] Chốt ba màn dùng ba hình khác nhau, chọn ngẫu nhiên và không lặp trong cùng lượt.
- [x] Chốt bộ có ít hơn 3 hình vẫn chơi số màn tương ứng với số hình hợp lệ hiện có.
- [x] Chốt không tự chuyển màn; dùng “Tiếp tục” để sang màn ghép kế tiếp hoặc “Học tiếp” để về chọn bộ.
- [x] Chốt màn ghép cuối có cả “Chơi lại” và “Học tiếp”.
- [x] Chốt “Chơi lại” chọn lại bộ hình ngẫu nhiên, ưu tiên khác lượt trước và chỉ dùng lại khi không đủ hình thay thế.
- [x] Chốt mỗi lượt dùng tối đa 3 hình, giảm theo số hình hợp lệ hiện có trong bộ.
- [x] Chốt lật thẻ tự tăng 2 → 3 → 4 → 5 cặp, không chọn cấp thủ công.
- [x] Chốt mỗi cấp chọn lại toàn bộ hình ngẫu nhiên; một hình chỉ tạo một cặp trong cùng cấp.
- [x] Chốt dừng ở cấp cao nhất tương ứng số hình hợp lệ; dưới 2 hình thì không mở lật thẻ.
- [x] Chốt mặt sau tất cả thẻ dùng logo KidEDU.
- [x] Chốt cặp đúng đồng thời thu nhỏ và mờ dần rồi biến mất.
- [x] Chốt phát thêm âm thanh hoàn thành màn sau âm thanh của cặp cuối, không phát chồng nhau.
- [x] Chốt dùng cùng file chúc mừng hiện có cho cặp đúng và hoàn thành màn.
- [x] Chốt sau mỗi cấp dùng “Tiếp tục”/“Học tiếp”; sau cấp cuối dùng “Chơi lại”/“Học tiếp” giống ghép hình.
- [x] Chốt cặp lật đúng sẽ phát âm thanh khen nhẹ rồi biến mất.
- [x] Chốt nút đóng trong lúc chơi quay về menu chọn trò chơi; “Học tiếp” mới quay về chọn bộ.
- [x] Chốt đóng giữa lượt quay về menu trò chơi ngay, không cần popup xác nhận.
- [x] Chốt ghép hình chỉ có hiệu ứng hình nổi lên, không phát âm thanh chúc mừng.
- [x] Owner duyệt tổng thể; đã đồng bộ `01`, `03` và `CHANGELOG.md` trước khi sửa code.

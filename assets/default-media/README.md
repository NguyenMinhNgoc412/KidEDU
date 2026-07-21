# KidEDU default media

Thư mục này chứa media được đóng gói sẵn trong app. Không đặt file thử hoặc file chưa có
quyền phát hành vào đây.

## Cách thêm một asset

1. Tạo thư mục theo seed item, ví dụ `item-me/`.
2. Đặt file đã duyệt với tên có revision, ví dụ `mouth-video-v1.mp4`.
3. Thêm một entry dùng `require(...)` tĩnh vào
   `src/data/defaultMediaRegistry.ts`.
4. Với video, thêm thumbnail JPEG/WebP riêng. Video không được render trong list.
5. Khai báo `durationMs` đúng cho video/audio để Auto Play đặt timeout an toàn mà không
   cắt sớm nội dung hợp lệ.
6. Chạy `pnpm check`, sau đó test fresh install ở chế độ máy bay.

Mỗi thẻ phát hành nên có:

- `illustration`: JPG, PNG, WebP hoặc ảnh động nhẹ;
- `mouth_video`: MP4 ngắn, rõ khẩu hình, không có nhạc nền;
- `pronunciation_audio`: M4A/MP3/WAV ngắn, phát âm rõ;
- thumbnail tĩnh cho video.

Video có thể giữ tiếng gốc. Nếu khai báo thêm `pronunciation_audio`, Auto Play sẽ phát hết
video trước rồi mới phát voice riêng, đúng timeline học hiện tại.

Registry chỉ được khai báo khi file thật đã tồn tại. Nếu chưa khai báo, app sẽ hiển thị
“Cần bổ sung” thay vì coi URI placeholder là media có thể phát.

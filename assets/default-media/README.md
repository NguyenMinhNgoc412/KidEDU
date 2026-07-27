# KidEDU default media

Thư mục này chứa media học mặc định được đóng gói sẵn trong app để fresh install vẫn học
được khi thiết bị offline. Không đặt file thử hoặc file chưa có quyền phát hành vào đây.

## Cách thêm một asset

1. Tạo thư mục theo seed item, ví dụ `item-me/`.
2. Đặt file đã duyệt với tên có revision, ví dụ `mouth-video-v1.mp4`.
3. Với video, thêm thumbnail JPEG/WebP riêng, ví dụ `mouth-video-thumbnail-v1.jpg`.
4. Đo chính xác duration, kích thước byte, codec và resolution của file đã tối ưu.
5. Thêm entry dùng `require(...)` tĩnh vào `src/data/defaultMediaRegistry.ts`.
6. Chạy `pnpm check:default-media` để kiểm tra registry, file tồn tại và dung lượng khai báo.
7. Chạy `pnpm check`, sau đó test fresh install ở chế độ máy bay.

Mỗi thẻ phát hành nên có:

- `illustration`: JPG, PNG, WebP hoặc ảnh động nhẹ;
- `mouth_video`: MP4 ngắn, rõ khẩu hình, không có nhạc nền;
- `pronunciation_audio`: M4A/MP3/WAV ngắn, phát âm rõ;
- thumbnail tĩnh cho video.

Video có thể giữ tiếng gốc. Nếu khai báo thêm `pronunciation_audio`, Auto Play sẽ phát hết
video trước rồi mới phát voice riêng, đúng timeline học hiện tại.

## Yêu cầu video khẩu hình bundled

- MP4 dùng H.264;
- cạnh dài tối thiểu 1280 px và cạnh ngắn tối thiểu 720 px;
- tối đa 15 giây và 80 MB;
- có thumbnail JPEG hoặc WebP;
- asset key bắt đầu bằng seed item ID và kết thúc bằng revision `-vN`;
- `durationMs` và `sizeBytes` phải khớp file thật;
- chỉ dùng `require(...)` local, không dùng `http://` hoặc `https://`.

Ví dụ entry:

```ts
{
  itemId: "item-me",
  role: "mouth_video",
  type: "video",
  durationMs: 2400,
  sizeBytes: 1200000,
  videoMetadata: {
    codec: "h264",
    width: 1280,
    height: 720
  },
  asset: {
    key: "item-me-mouth-video-v1",
    module: require("../../assets/default-media/item-me/mouth-video-v1.mp4"),
    mimeType: "video/mp4"
  },
  thumbnail: {
    key: "item-me-mouth-video-thumbnail-v1",
    module: require("../../assets/default-media/item-me/mouth-video-thumbnail-v1.jpg"),
    mimeType: "image/jpeg"
  }
}
```

Auto Play dùng sự kiện kết thúc playback thực tế, không dùng `durationMs` để cắt video.
`durationMs` vẫn là metadata bắt buộc để kiểm kê và kiểm tra nội dung phát hành.

## Release gate

- `pnpm check:default-media` cho phép registry rỗng trong development nhưng vẫn bắt file
  thừa, file thiếu, URL remote và metadata sai.
- `pnpm check:default-media:release` yêu cầu ít nhất một video khẩu hình bundled.
- Build production Android/iOS tự chạy release gate trước khi gọi EAS.
- Sau mỗi nhóm video, theo dõi tổng dung lượng được in bởi preflight và kích thước APK/IPA.

Registry chỉ được khai báo khi file thật đã tồn tại. File có trong thư mục nhưng chưa được
đăng ký cũng làm preflight thất bại. Nếu chưa có media hợp lệ, app hiển thị “Cần bổ sung”
thay vì coi URI placeholder hoặc URL cloud là media có thể phát.

Video mở rộng sau MVP có thể được phân phối qua CDN, nhưng phải tải và kiểm tra xong vào
local storage trước khi học. Không stream URL trực tiếp trong Learning hoặc Auto Play.

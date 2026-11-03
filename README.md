# KidEDU

> **Documentation transition:** Code hiện tại vẫn là baseline card/deck local-first. Target product cho Store Release v1.0 nằm tại [`docs-v2/README.md`](./docs-v2/README.md), với Product Brief, PRD và Technical Architecture mới. Nội dung legacy bên dưới chỉ mô tả trạng thái code hiện tại, không được dùng để thay đổi requirement v2.

> **Build baseline v2:** Giữ Expo SDK miễn phí; dùng EAS Free chỉ để build/submit iOS do owner không có Mac. Android build local bằng Gradle, không dùng EAS Update/OTA hoặc paid plan mặc định.

KidEDU là ứng dụng di động hỗ trợ trẻ chậm nói luyện phát âm tại nhà. Ứng dụng ưu tiên trải nghiệm trực quan, ít thao tác và hoạt động local-first để trẻ vẫn có thể học khi không có kết nối mạng.

> KidEDU là công cụ hỗ trợ luyện tập tại nhà, không thay thế đánh giá hoặc can thiệp của chuyên gia âm ngữ trị liệu.

## Tính năng của code baseline hiện tại

- Học từng thẻ với hình minh họa, video khẩu hình và âm thanh phát âm mẫu.
- Học theo bộ thẻ tự chạy: app phát mẫu, dừng cho trẻ nói theo, rồi tự chuyển thẻ tiếp theo.
- Các bộ học mẫu theo chủ đề quen thuộc: gia đình, nhu cầu, đồ vật, con vật và hành động.
- Phát lại, tạm dừng và thoát phiên học đơn giản, phù hợp với trẻ.
- Khu vực phụ huynh có Parent Gate để quản lý nội dung.
- Phụ huynh tạo, sửa, xóa thẻ học và bộ học; có thể sắp xếp thứ tự thẻ trong bộ.
- Cá nhân hóa thẻ bằng ảnh, video khẩu hình hoặc âm thanh của người thân.
- Theo dõi tiến độ luyện tập cơ bản và điều chỉnh tốc độ/lặp lại của bộ học.
- Dữ liệu và media được lưu trên thiết bị; không cần tài khoản, backend hay đồng bộ đám mây.
- Sao lưu, khôi phục dữ liệu local và các công cụ kiểm soát dữ liệu riêng tư dành cho phụ huynh.

## Công nghệ

- React Native 0.88.1, Expo SDK 58 và TypeScript
- Expo Router
- SQLite và local file storage
- Expo Video/Audio/Image cho nội dung học
- pnpm để quản lý package

## Yêu cầu môi trường

- Node.js 22.22 trở lên; CI dùng Node 22, test SQLite thật dùng module `node:sqlite` (môi trường local đã kiểm chứng: 22.22.0).
- Corepack hoặc pnpm `10.14.0`
- Android Studio + Android Emulator để chạy Android giả lập, hoặc điện thoại Android có Expo Go
- Xcode + iOS Simulator để chạy iOS giả lập (chỉ có trên macOS), hoặc iPhone có Expo Go để chạy development
- Tài khoản Expo/EAS nếu cần tạo bản cài đặt độc lập hoặc gửi TestFlight

Kiểm tra nhanh môi trường:

```bash
node --version
corepack enable
pnpm --version
```

## Cài đặt dự án

```bash
git clone <repository-url>
cd KIDEDU
pnpm install
pnpm doctor
```

`pnpm doctor` kiểm tra các package native đang phù hợp với phiên bản Expo của dự án.

## Chạy ứng dụng

Khởi động Expo development server:

```bash
pnpm start
```

Sau đó chọn thiết bị/giả lập trong terminal Expo, hoặc dùng các lệnh trực tiếp bên dưới.

### Android

Khởi động Android Emulator trước, hoặc kết nối điện thoại Android qua USB. Sau đó chạy:

```bash
pnpm android
```

Để chạy trên điện thoại Android thật trong quá trình phát triển:

1. Cài **Expo Go** từ Google Play.
2. Chạy `pnpm start`.
3. Mở Expo Go và quét mã QR hiển thị trong terminal.

Điện thoại và máy chạy dự án nên dùng cùng mạng Wi-Fi. Nếu mạng nội bộ chặn kết nối, có thể chạy:

```bash
pnpm exec expo start --tunnel
```

### iOS

Trên macOS đã cài Xcode, chạy iOS Simulator bằng:

```bash
pnpm ios
```

Để chạy trên iPhone thật trong quá trình phát triển:

1. Cài **Expo Go** từ App Store.
2. Chạy `pnpm start`.
3. Mở Camera hoặc Expo Go để quét mã QR và mở dự án.

> iOS Simulator chỉ chạy trên macOS. Việc cài bản độc lập lên iPhone cần tài khoản Apple Developer và được phân phối qua TestFlight/App Store.

## Tạo bản cài thử cho code baseline hiện tại

Cài EAS CLI và đăng nhập Expo một lần trên máy build:

```bash
pnpm dlx eas-cli login
```

### Android: build local bằng Gradle

Cần Java và Android SDK trên máy build. Không dùng EAS cho Android.

```bash
pnpm build:android:preview
```

Script chạy Expo prebuild rồi Gradle `assembleDebug`; APK nằm tại
`android/app/build/outputs/apk/debug/app-debug.apk`.

Production yêu cầu bốn biến môi trường: `KIDEDU_ANDROID_KEYSTORE`
(đường dẫn keystore), `KIDEDU_ANDROID_STORE_PASSWORD`,
`KIDEDU_ANDROID_KEY_ALIAS`, `KIDEDU_ANDROID_KEY_PASSWORD`.
Không commit keystore hoặc mật khẩu vào repository.

```bash
pnpm build:android:production
```

AAB đã ký nằm tại `android/app/build/outputs/bundle/release/app-release.aab`.
Upload AAB qua Google Play Console. Script dừng nếu thiếu cấu hình ký;
kiểm tra cấu hình không thay thế build thật hoặc kiểm thử trên thiết bị.

### iOS: Simulator và TestFlight

Bản preview iOS của dự án được cấu hình cho iOS Simulator:

```bash
pnpm build:ios:preview
```

Để cài trên iPhone thật qua TestFlight, tạo bản production rồi gửi lên App Store Connect:

```bash
pnpm build:ios:production
pnpm submit:ios
```

Bạn cần cấu hình Apple Developer, App Store Connect và quyền truy cập EAS trước khi gửi TestFlight.

## Kiểm tra chất lượng

Chạy toàn bộ kiểm tra trước khi build production:

```bash
pnpm check
```

Hoặc chạy từng phần:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Lệnh thường dùng

| Lệnh                         | Mục đích                                      |
| ---------------------------- | --------------------------------------------- |
| `pnpm start`                 | Khởi động Expo development server             |
| `pnpm android`               | Mở app trên Android Emulator/thiết bị Android |
| `pnpm ios`                   | Mở app trên iOS Simulator (macOS)             |
| `pnpm doctor`                | Kiểm tra tương thích dependency Expo          |
| `pnpm check`                 | Chạy kiểm tra media, typecheck, lint và test  |
| `pnpm build:android:preview` | Tạo APK Android để cài thử nội bộ             |
| `pnpm build:ios:preview`     | Tạo bản dành cho iOS Simulator                |

## Tài liệu dự án

Target Source of Truth cho Store Release v1.0 nằm trong [`docs-v2`](docs-v2/README.md). Thư mục [`docs`](docs/README.md) là tài liệu legacy mô tả code local-first hiện tại, chỉ dùng để so sánh/refactor và không override v2.

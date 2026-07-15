# KidEDU Maestro & Device Smoke Checklist

Các flow trong thư mục này là smoke test cho MVP local-first. Chúng kiểm tra luồng chính ổn định trên build đã cài vào device/simulator, nhưng không thay thế unit test, integration test hoặc manual device smoke cho media native.

## Cách chạy Maestro

PowerShell:

```powershell
$env:APP_ID="com.kidedu.mobile"
maestro test maestro/parent-create-deck-autoplay.yaml
maestro test maestro/media-custom-smoke.yaml
maestro test maestro/parent-settings-progress-smoke.yaml
```

Bash:

```sh
APP_ID=com.kidedu.mobile maestro test maestro/parent-create-deck-autoplay.yaml
APP_ID=com.kidedu.mobile maestro test maestro/media-custom-smoke.yaml
APP_ID=com.kidedu.mobile maestro test maestro/parent-settings-progress-smoke.yaml
```

Dùng `com.kidedu.mobile` cho EAS/dev/release build. Chỉ dùng `host.exp.Exponent` khi chạy trong Expo Go.

## Coverage hiện tại

| Luồng / chức năng MVP | Maestro automated | Device smoke/manual | Ghi chú |
|---|---:|---:|---|
| App mở được và vào Child Home | Có | Có | `parent-create-deck-autoplay.yaml` |
| Parent Gate đúng câu hỏi và mở được khu phụ huynh | Có | Có | Cần manual thêm case nhập sai |
| Tạo thẻ học mới | Có | Có | Maestro tạo một thẻ đơn giản |
| Tạo bộ học và thêm thẻ vào bộ | Có | Có | Maestro tạo bộ từ thẻ vừa tạo |
| Child Home thấy bộ mới và bắt đầu Auto Play | Có | Có | Maestro vào phiên Auto Play |
| Auto Play: phát lại, tạm dừng, tiếp tục, thoát | Có | Có | Maestro kiểm tra điều khiển chính |
| Màn quản lý media cá nhân mở đúng entrypoint | Có | Có | `media-custom-smoke.yaml` |
| Chọn ảnh/video qua OS picker | Không | Có | Phụ thuộc fixture và UI hệ điều hành |
| Quay video bằng camera | Không | Có | Phải test trên device thật |
| Thu âm bằng microphone | Không | Có | Phải test quyền mic và file audio thật |
| Video custom tạo thumbnail và list không render video | Không | Có | Kiểm tra bằng mắt trên list/detail |
| Xóa custom media và fallback về default/placeholder | Không | Có | Maestro chưa có fixture media ổn định |
| Cleanup temp/orphan media sau replace/delete | Không | Có | Manual + quan sát không crash, không còn preview cũ |
| Mở màn cài đặt tốc độ/lặp/âm thanh | Có | Có | `parent-settings-progress-smoke.yaml` |
| Cài đặt tốc độ/lặp/âm thanh lưu được | Một phần | Có | Unit test kiểm logic, device smoke kiểm lưu và ảnh hưởng phiên học |
| Mở màn tiến độ | Có | Có | `parent-settings-progress-smoke.yaml` |
| Progress xuất hiện sau phiên học | Một phần | Có | Unit test kiểm ghi nhận, device smoke kiểm dữ liệu thật |
| Background/foreground khi đang học | Không | Có | Bắt buộc test trên device |
| Thiết bị Android yếu / memory / playback thật | Không | Có | Bắt buộc trước release |

Kết luận: chỉ chạy Maestro hiện tại là chưa đủ để xác nhận app sẵn sàng phát hành. Đủ mức release smoke khi `pnpm check` pass, tất cả flow Maestro pass, và checklist device smoke bên dưới pass trên ít nhất một thiết bị Android thật.

## Device Smoke Checklist Trước Release

Chuẩn bị:

- Cài build sạch hoặc clear app data.
- Tắt mạng ít nhất một lần để xác nhận local-first vẫn dùng được.
- Chuẩn bị một ảnh nhỏ, một video khẩu hình dưới 15 giây, và quyền camera/micro.

Checklist:

1. Mở app, Child Home hiển thị nhóm/bộ học mẫu và không cần đăng nhập.
2. Vào Parent Gate, nhập sai một lần thấy không mở; nhập `8` thì vào được Parent Zone.
3. Tạo thẻ mới, sửa lại thông tin thẻ, quay về danh sách thấy dữ liệu vẫn còn sau khi đóng/mở app.
4. Thêm ảnh minh họa custom từ thư viện; quay lại list/detail thấy preview dùng ảnh đã chọn.
5. Thêm video khẩu hình custom từ thư viện hoặc camera; list/detail hiển thị thumbnail tĩnh, không tự render video trong list.
6. Thu âm phát âm custom; vào màn học và xác nhận audio phát được, không chồng tiếng.
7. Xóa từng media custom; app quay về default/placeholder hợp lệ và không crash.
8. Tạo bộ học có ít nhất một thẻ, bắt đầu Auto Play, kiểm tra phát lại/tạm dừng/tiếp tục/thoát.
9. Khi video/audio mẫu đang phát, app không chuyển sang lượt trẻ nói trước khi media kết thúc.
10. Đưa app vào background trong lúc học; quay lại foreground, app không tự phát âm thanh bất ngờ và không nhảy thẻ.
11. Đổi cài đặt tốc độ/lặp, bắt đầu Auto Play lại và xác nhận phiên dùng cài đặt mới ở mức hành vi.
12. Sau một phiên học, mở Tiến độ và xác nhận có bản ghi; đổi trạng thái Mới/Đang luyện/Đã quen không lỗi.
13. Replace media nhiều lần rồi xóa custom; đóng/mở app lại, không còn preview cũ, không báo lỗi file mất.
14. Scroll danh sách thẻ/bộ học, không giật nặng; list chỉ hiển thị thumbnail/text/status.
15. Chạy app ít nhất 5 phút với vài lần vào/thoát Auto Play, không crash, không nóng/memory bất thường trên Android mục tiêu.

## Tiêu chí Qua Smoke

- `pnpm check` pass.
- `maestro/parent-create-deck-autoplay.yaml` pass.
- `maestro/media-custom-smoke.yaml` pass.
- `maestro/parent-settings-progress-smoke.yaml` pass.
- Device smoke checklist pass trên Android thật.
- Nếu có lỗi media permission, playback, thumbnail, fallback hoặc background/foreground thì chưa coi là đạt release smoke.

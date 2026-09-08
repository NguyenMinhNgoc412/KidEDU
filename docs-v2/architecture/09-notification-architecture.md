# Local Notification Architecture

| Thuộc tính | Giá trị                                                |
| ---------- | ------------------------------------------------------ |
| Trạng thái | `In review`                                            |
| Owner      | Product + Mobile                                       |
| Implements | `PRD-NOTIF-*`, `PRD-ACC-*`, `PRD-PRIV-*`, `TA-ADR-021` |
| Cập nhật   | 2026-09-08                                             |

## 1. Decision

Store Release v1.0 chỉ dùng **local notification do mobile schedule** cho lịch luyện mà parent chủ động cấu hình. App server không gửi user notification và không có FCM/APNs application delivery, push token, notification provider account, notification outbox hoặc worker.

Firebase chỉ dùng cho Crashlytics, không bật Authentication hoặc Cloud Messaging chỉ vì project đã có sẵn. Apple Developer account vẫn bắt buộc để phát hành iOS nhưng KidEDU v1 không cần tạo APNs key cho push.

## 2. Vì sao server push chưa cần

- Nhắc giờ học xuất phát từ lịch local của parent.
- Content/download completion được UI/background task local cập nhật; không cần server đánh thức app.
- Upload/sync lỗi hiển thị khi app chạy và retry theo outbox local.
- Entitlement/account/content version refresh qua bootstrap/delta khi open/foreground.
- Apple/Google tự gửi billing communication theo trách nhiệm store; KidEDU đọc state chính xác khi reconcile.
- Supabase Auth gửi email verification/password reset qua production custom SMTP; đây là auth transaction, không phải application push service.

Nếu một màn foreground cần state gần real time, mobile dùng bounded polling hoặc subscribe trong thời gian màn đó mở rồi dừng. Không dùng background WebSocket/SSE vì hệ điều hành có thể suspend, tốn pin và không bảo đảm delivery.

## 3. Local notification types

| Type                       | Trigger/source                       | Hành vi                                       |
| -------------------------- | ------------------------------------ | --------------------------------------------- |
| Learning schedule reminder | parent chọn ngày/giờ trong Parent UI | schedule/cancel/reschedule theo stable ID     |
| Download completion        | local download/install coordinator   | chỉ báo khi task hoàn tất và parent đã opt-in |
| Resume reminder            | parent chủ động đặt từ checkpoint    | một lần; tự hủy khi lesson hoàn thành         |

Không có marketing, trial-expiry hoặc behavioral notification trong v1.

## 4. Permission and schedule lifecycle

```text
Parent opens notification settings
→ app explains local reminder
→ OS permission request
→ parent selects day/time/quiet hours
→ app persists preference + stable schedule IDs in account namespace
→ native scheduler creates local notifications
```

- Không xin permission trong onboarding/Child Mode.
- Permission bị từ chối không khóa learning flow.
- Edit dùng cancel-by-ID rồi schedule lại, không append mù quáng.
- Timezone/DST/permission change được reconcile khi foreground.
- Logout/account switch hủy pending notification của namespace cũ trước khi mở namespace mới.
- Hoàn thành lesson hoặc tắt preference hủy reminder tương ứng.

## 5. Privacy and navigation

Lock-screen copy phải generic, ví dụ “Đến giờ luyện cùng bé”; không chứa child name, target, progress, diagnosis, observation hoặc family-media metadata. Notification data local chỉ chứa schema version, safe route intent và stable schedule ID.

Tap notification phải chạy app bootstrap, restore đúng account và fetch current state trước navigation. Không autoplay media, không bypass activation/entitlement và không mở paywall/Parent route trước Parent Gate.

## 6. Mobile implementation boundary

Mobile dùng `expo-notifications` hoặc native adapter tương thích Expo Development Build. `LocalNotificationRepository` quản preference/schedule ID; screen không gọi native API trực tiếp. Expo Go chỉ dùng cho flow không cần native capability đầy đủ; production test dùng Development Build.

Không tạo backend endpoint/table cho notification. Server không cần biết exact learning reminder time trừ khi tương lai có requirement multi-device schedule sync; nếu thêm phải đi qua PRD/ADR mới.

## 7. Cost

Local notification không có phí theo message và không tạo network traffic. Notification subsystem không cần Firebase Cloud Messaging, APNs push key, Expo Push Service, OneSignal, SMS gateway, notification queue hoặc VM bổ sung. Cloud Tasks của AI Custom Library không được tái sử dụng để giả lập remote push.

## 8. Future trigger for remote push

Chỉ xem xét remote push khi có user story đã chứng minh cần đánh thức app ngoài phiên, có consent/cadence/privacy rõ và foreground sync không đáp ứng. Khi đó review FCM/APNs, token lifecycle, server outbox, delivery semantics, cost và threat model bằng ADR riêng; không bật sẵn “để sau dùng”.

## 9. Verification

- iOS/Android device: allow/deny/change permission.
- Schedule/edit/cancel, timezone/DST, reboot và duplicate prevention.
- Download completion/resume reminder không fire sau khi state đã hoàn thành/hủy.
- Cold/warm tap, expired auth, wrong account và Parent Gate.
- Account switch/logout không để reminder cũ xuất hiện.
- Lock screen/history/log/Crashlytics không lộ child/family data.

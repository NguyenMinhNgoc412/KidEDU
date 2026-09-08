# Subscription & Access Product Specification

| Thuộc tính | Giá trị                                              |
| ---------- | ---------------------------------------------------- |
| Trạng thái | `In review`                                          |
| Owner      | Product + Backend + Mobile                           |
| Implements | `PRD-SUB-*`, `PRD-ACC-001`, `PRD-SYNC-*`, `PB-BIZ-*` |
| Cập nhật   | 2026-09-08                                           |

## 1. Business model

V1 dùng trial-to-paywall và subscription. Không có permanent free learning tier, third-party ads hoặc quảng cáo hành vi. Giá, trial length và gói tháng/năm còn theo `PB-TBD-02..05`.

## 2. Effective access states

| State                  | Learning access                                              |
| ---------------------- | ------------------------------------------------------------ |
| `trial_active`         | capability trong trial grant đến server expiry               |
| `active`               | capability của subscription plan                             |
| `grace_period`         | theo normalized Apple/Google store policy đã công bố         |
| `billing_retry`        | không tự suy luận; dùng effective entitlement do server tính |
| `canceled_active`      | vẫn dùng đến paid-through date                               |
| `expired`              | không tạo premium session/content key mới                    |
| `refunded` / `revoked` | khóa theo server effective-at và revoke policy               |
| `account_hold`         | khóa purchase-sensitive access; giữ data-control path        |

UI label không được dùng raw store state nếu effective entitlement khác.

## 3. Capability model

Entitlement cấp capability/versioned scope, không chỉ boolean `isPremium`:

- `learning.plan.full`;
- `content.pack.<tier>`;
- `family_media.cloud` + quota;
- `profiles.count`;
- feature capability tương lai.

Activation grant chỉ chứa capability cần cho device/session, có account/device binding và expiry.

## 4. Purchase flow

1. Parent qua Parent Gate mở paywall có price/period/trial/renewal disclosure từ store.
2. Native StoreKit 2/Google Play Billing adapter bắt đầu purchase.
3. Mobile gửi transaction/purchase token qua authenticated idempotent command; app server xác thực và reconcile trực tiếp với store server API.
4. Server persist entitlement, phát activation grant mới.
5. Mobile atomically cập nhật access state và chuẩn bị pack.

Không unlock chỉ từ client callback “purchase success”. Restore purchase và account mismatch có flow rõ.

## 5. Expiry behavior

- Không bắt đầu premium session/activity mới.
- Runtime premium key bị hủy tại boundary an toàn.
- Encrypted pack/media có thể ở lại local nhưng resolver trả `locked`.
- Resubscribe tải grant/key mới; valid bytes không phải download lại.
- Parent vẫn xem/export/delete dữ liệu gia đình và quản lý account/subscription.
- Upload/cloud sync family media mới dừng theo policy; local file không bị xóa.

## 6. Trial abuse controls

Trial bind server account và store/app identity signals phù hợp; reinstall hoặc đổi device không reset. Không dùng invasive fingerprint. Các case lạm dụng xử lý bằng server history/rate limit và store introductory-offer eligibility.

## 7. Paywall/content lock UX

- Child Mode không tự bật paywall.
- Khi child chạm content locked, hiển thị thông báo trung tính và chuyển parent action qua Parent Gate.
- Paywall không dùng countdown giả, nút đóng khó thấy hoặc wording gây sợ hãi.
- Cancellation không làm mất access trước paid-through date.
- Error/store unavailable có retry và không xóa entitlement local còn trong signed validity.

## 8. Server events

Apple App Store Server Notification V2 JWS và Google Play RTDN/Pub/Sub phải được verify, persist event ID, xử lý idempotent và chịu out-of-order. App server gọi provider server API để reconcile thay vì tin notification payload. Audit lưu state transition/reason nhưng không log signed transaction/purchase token đầy đủ.

## 9. Acceptance matrix

Test sandbox iOS/Android cho purchase, cancel, renew, trial convert, grace, billing retry, expire, refund/revoke, reinstall, restore trên device khác, duplicate/out-of-order store event, Apple/Google API/RTDN outage và account switch.

Security acceptance: copy SQLite/pack sang account/device khác hoặc rollback clock không mở được premium theo normal app flow.

# Entitlement, Activation & Content-Key Security

| Thuộc tính | Giá trị                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| Trạng thái | `In review`                                                              |
| Owner      | Backend + Mobile Security                                                |
| Implements | `TA-ADR-001..003`, `TA-ADR-009`, `TA-ADR-013`, `TA-ADR-017`, `PRD-SUB-*` |
| Cập nhật   | 2026-09-08                                                               |

## 1. Trust model

Apple/Google xác nhận giao dịch; app-server billing adapters verify/reconcile trực tiếp và chuẩn hóa state; entitlement module quyết effective entitlement; activation service cấp signed grant/wrapped keys; mobile enforcement nhiều lớp. SQLite, client clock, UI state và native purchase callback không phải authority.

## 2. Activation grant

Grant có: version, grant ID, account/device/app-instance, capabilities, pack-key IDs, issued/not-before/expiry, trusted server-time anchor, subscription effective end, app/min schema và signature/key ID.

TTL là ngắn hạn và không vượt paid/trial end. Exact TTL qua POC giữa revoke latency, network resilience và server cost.

## 3. Key flow

Pack builder tạo CEK → encrypt content → gọi `KeyManagementGateway` wrap CEK bằng baseline KMS hierarchy → store wrapped record với opaque key ID. Activation server chỉ trả wrapped key cho authorized pack. Device-bound key trong Keychain/Keystore unwrap/derive runtime access; plaintext CEK không persist SQLite/log. Provider migration dùng rewrap procedure thay vì leak provider DTO vào domain.

## 4. Enforcement points

API authorization, activation endpoint, lesson preparation, local repository, activity loader, media resolver, decrypt adapter và session transition đều kiểm scope. Deep link, stale screen hoặc direct local URI không bypass.

## 5. Time/lifecycle

Client dùng server time + monotonic elapsed trong process; wall-clock rollback không kéo dài grant. Background/foreground kiểm boundary; force-kill làm mất plaintext runtime key. Cold start online activation mới mở premium session. Mất mạng giữa prepared lesson được kết thúc trong grant/policy cho phép.

## 6. Billing events

Apple signed notification và Google RTDN có provider event/transaction identity, raw minimal audit, idempotent upsert và out-of-order resolution bằng effective timestamp/version. Server verify signature/auth rồi reconcile provider API; refund/revoke ưu tiên hơn stale renewal. Reconciliation định kỳ phát hiện event miss.

## 7. Expiry/account switch

Hết quyền: deny new premium session, clear runtime key, mark pack locked; bytes giữ encrypted. Account switch: close session/player, revoke namespace handles, clear tokens/grants/keys/query cache trước load account mới.

## 8. Threat limitations

Root/jailbreak/instrumented client có thể đọc runtime plaintext; không tuyên bố DRM tuyệt đối. Có thể thêm Play Integrity/App Attest, obfuscation và risk response sau POC nhưng server authority/key rotation vẫn là control chính.

## 9. Acceptance attacks

Copy DB/files, patch client clock, reuse grant device/account khác, replay activation, deep-link locked route, forged/replayed Apple JWS hoặc Google purchase token, stale store state, refund while active, key ID tamper, process survive past expiry và rooted-device risk response.

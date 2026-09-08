# ADR-0007 — Direct Apple and Google subscription integration

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**References:** `TA-ADR-013`, `TA-ADR-017`, `TA-ADR-018`, `PRD-SUB-*`

## Context

Subscription là business-critical trust boundary. RevenueCat đơn giản hóa đa nền tảng nhưng không bắt buộc, thêm provider account/data boundary và tính 1% monthly tracked revenue sau ngưỡng hiện hành. KidEDU đã có app server riêng và ưu tiên tự chủ server-side.

## Decision

Không dùng RevenueCat trong v1. Mobile dùng open-source React Native IAP adapter để gọi StoreKit 2/Google Play Billing. Backend có `AppleBillingGateway` và `GooglePlayBillingGateway`:

- Apple: verify signed transaction/App Store Server Notification V2 và reconcile App Store Server API.
- Google: verify authenticated RTDN qua Cloud Pub/Sub, reconcile `purchases.subscriptionsv2` bằng Google Play Developer API và acknowledge theo contract.

Mọi store event/purchase command idempotent, chịu duplicate/out-of-order và chỉ normalized server projection được cấp activation/content key. Store private keys/service credentials nằm trong server-side secret provider; baseline là Secret Manager.

## Alternatives

- RevenueCat bị loại khỏi baseline để tránh dependency/phí theo doanh thu; có thể đánh giá lại nếu maintenance thực tế vượt lợi ích tự chủ.
- Chỉ tin mobile receipt/callback bị loại vì có thể bypass và không nhận refund/revoke đáng tin cậy.
- Polling store duy nhất bị loại; Apple notifications/Google RTDN + periodic reconciliation cần đi cùng nhau để giảm missed event.

## Consequences

Không có SaaS subscription fee ngoài commission bắt buộc của store. Đổi lại, backend phải sở hữu adapter, key rotation, Apple JWS verification, Google Pub/Sub IAM, state normalization và sandbox/E2E matrix. Đây là logic trust cần thiết, không được coi backend là CRUD thuần túy.

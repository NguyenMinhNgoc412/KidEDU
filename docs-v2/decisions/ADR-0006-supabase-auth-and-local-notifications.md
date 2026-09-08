# ADR-0006 — Supabase Auth and local-only notifications

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**References:** `TA-ADR-021`, `TA-ADR-022`, `TA-ADR-023`, `PRD-ACC-001`, `PRD-NOTIF-*`

## Context

KidEDU cần parent identity, session recovery và local learning reminder. Server state không có use case nào bắt buộc phải đánh thức app ngoài phiên; app đã có bootstrap/delta sync khi open/foreground. Supabase đã được chọn cho PostgreSQL ban đầu nên dùng cùng project cho Auth giảm thêm một runtime identity provider.

## Decision

Dùng Supabase Authentication với email/password và Google/Apple provider theo platform; không dùng phone OTP/SMS trong v1. Mobile giữ provider session trong secure storage, app server verify JWT qua pinned issuer/audience và cached JWKS, rồi map `(provider, subject)` sang internal account ID. Supabase user ID không trở thành domain/account primary key.

Supabase default SMTP chỉ dùng development/test. Trước public release, email verification/password reset phải dùng domain và transactional SMTP provider đã cấu hình SPF/DKIM/DMARC, rate limit và abuse monitoring; provider cụ thể thuộc `TA-TBD-011`.

Routine reminder được mobile schedule local. Không bật FCM/APNs application push, không có push token hoặc notification server module trong v1. App fetch current state sau auth; foreground màn cần cập nhật nhanh dùng bounded polling/subscription và dừng khi rời màn.

Firebase project nếu giữ chỉ dùng Crashlytics; không dùng Firebase Auth hoặc Cloud Messaging.

## Alternatives

- Firebase Auth vẫn là adapter fallback nếu Supabase Auth gặp policy/quota/operability blocker; application code không phụ thuộc Firebase/Supabase DTO.
- FCM, Expo Push Service hoặc OneSignal bị loại vì chưa có server event cần push và sẽ thêm token/permission/privacy/operations không cần thiết.
- Background WebSocket/SSE bị loại vì mobile có thể suspend connection, tốn pin và không bảo đảm delivery.
- Phone OTP có UX đơn giản ở một số case nhưng phát sinh SMS cost, abuse/fraud và recovery complexity.

## Consequences

Auth ban đầu nằm trong Supabase Free quota và local notification không có network/backend cost. Phải test JWT rotation, revoke/sign-out-all, account linking, provider outage và migration/export identity. Email/password không được phát hành bằng default SMTP best-effort.

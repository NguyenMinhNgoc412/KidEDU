# ADR-0002 — Serverless Docker application stack for initial production

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**References:** `TA-ADR-011`, `TA-ADR-012`, `TA-ADR-016`, `TA-ADR-020`, `TA-ADR-023`

## Context

Mobile không được truy cập application database/storage trực tiếp. Backend domain nhỏ nhưng auth, authorization, entitlement, key, sync, billing webhook và privacy cần trust boundary riêng. Workload ban đầu chủ yếu xuất hiện khi app open/foreground, delta sync, purchase/restore hoặc store gửi notification; chạy VM 24/7 tạo fixed cost không tương xứng.

## Decision

Baseline initial production dùng Cloud Run request-based billing tại Singapore, `min-instances=0`, chạy OCI image Node.js/TypeScript NestJS + Fastify. Supabase Free cung cấp managed PostgreSQL và Auth; Cloudflare R2 Standard cung cấp private object storage cho media/pack/export/backup. Google Drive 5 TB chỉ là source/master/archive.

Cloud Run app server vẫn là application/security boundary duy nhất. Mobile dùng Supabase client cho Auth session nhưng không gọi Supabase Data API, database hoặc R2 bằng privileged credential. Runtime PostgreSQL dùng Supavisor transaction pooler với pool và Cloud Run `max-instances` bị chặn theo connection budget. Migration/backup dùng direct endpoint khi runner có IPv6 hoặc session pooler sau POC.

API image stateless, database là PostgreSQL chuẩn, object access qua `ObjectStorageGateway` và identity qua `IdentityGateway`. Vì vậy có thể chuyển image sang Docker Compose/VPS và restore database sang PostgreSQL khác mà không đổi mobile/API contract.

## Reliability conditions

Supabase Free không có uptime SLA hoặc automatic backup và có thể pause sau một tuần không hoạt động. KidEDU chấp nhận giới hạn này chỉ cho controlled Store Release tải thấp với các điều kiện bắt buộc:

- daily encrypted logical dump ra R2 bucket tách biệt;
- restore drill vào PostgreSQL isolated trước release và mỗi quý;
- alert tại 70% database/egress quota, cùng runbook upgrade/migrate;
- Cloud Run retry/backoff và mobile degraded/retry UX khi bootstrap dependency tạm lỗi;
- không tuyên bố HA và không giữ Free khi incident/revenue/RPO-RTO vượt risk đã chấp nhận.

## Alternatives

- GCE/VPS one-node bị hoãn vì fixed cost và self-operations không tương xứng workload khởi đầu; vẫn là migration target khi Cloud Run economics hoặc runtime requirement phù hợp hơn.
- Supabase Pro là bước nâng gần nhất khi cần no-pause, daily managed backup, support/quota tốt hơn.
- Edge Functions không chạy app server baseline để tránh rewrite NestJS/Docker sang Deno/provider runtime.
- Kubernetes, cluster PostgreSQL, Redis/Kafka và microservices bị loại vì chưa có tải hoặc đội ngũ cần chúng.

## Consequences

Fixed infrastructure cost ban đầu gần bằng 0 trong free quota và app server vẫn có security boundary rõ. Đổi lại, hệ thống phụ thuộc availability/quota của các free tier và phải tự động hóa backup, restore, alert và migration sớm. “Free” là lựa chọn cost stage, không phải cam kết kiến trúc lâu dài.

# Documentation v2 Changelog

## 2026-09-08

- Giữ tên sản phẩm KidEDU.
- Thiết lập ba SOT gốc: Product Brief, PRD và Technical Architecture.
- Chuyển định vị từ MVP thẻ từ/local-first sang Store Release v1.0 hỗ trợ progression giao tiếp tiếng Việt.
- Chốt subscription/trial, không third-party ads, server-authoritative activation và encrypted progressive lesson packs.
- Chốt client-heavy learning domain nhưng có Docker app server riêng làm security/data boundary.
- Chọn mobile React Native/Expo; backend Node.js/NestJS/Fastify/Prisma và PostgreSQL.
- Chốt baseline low-workload production: Cloud Run scale-to-zero chạy Docker app server, Supabase Free cung cấp PostgreSQL + Auth, R2 giữ runtime media/backup; Google Drive chỉ source/master/archive.
- Supabase Free được chấp nhận cho controlled Store Release với quota alerts, daily encrypted logical backup ngoài Supabase và restore drill; nâng Pro hoặc migrate PostgreSQL theo reliability/quota trigger, không chờ tới khi outage.
- Giữ stable KidEDU API contract, OCI image, standard PostgreSQL và provider adapters để chuyển Cloud Run sang VPS, Supabase sang PostgreSQL khác và R2 sang S3/GCS mà không đổi learning domain/mobile contract.
- Thu gọn notification v1 về local-only; không FCM/APNs app push, push token hoặc notification backend. Server state cập nhật qua open/foreground sync.
- Chốt Supabase Auth email/password + Google/Apple, loại phone OTP khỏi v1; default SMTP chỉ dùng development, production email cần provider/domain configuration riêng.
- Loại RevenueCat; backend tích hợp trực tiếp Apple/Google subscription để tránh account/data boundary và 1% MTR.
- Giữ Expo SDK/framework miễn phí; do owner không có Mac, dùng EAS Free chỉ để build/submit iOS, Android build local. Không dùng EAS Update/OTA hoặc paid plan trong baseline.
- Loại Sentry; Firebase chỉ còn dùng Crashlytics cho mobile, backend dùng Cloud Logging/Error Reporting.
- Thêm account inventory và cost model chỉ gồm service thực sự cần.
- Thêm option ladder từ free-tier serverless/EAS Free tới Supabase Pro, VPS cost-optimized, managed DB và HA; quy định provider ports/data migration để thay dịch vụ mà không đổi learning domain/API contract.
- Thêm product, design/wireframe, architecture, contract, delivery specs và ADRs.
- Giữ/reuse Gentle Growth design system và UI foundation hiện có; thay information architecture card/category-centric.
- Đưa research DOCX chứa PII vào `.gitignore` và ghi rõ không được commit/distribute.
- Chốt media production: Veo 3/Veo 3.1 chỉ tạo candidate mouth video; canonical audio ưu tiên giọng người Việt, Google Cloud TTS `vi-VN` tạo candidate; FFmpeg normalize deterministic; Reanimated/SVG + Lottie là animation baseline có static/reduce-motion fallback.
- Cho phép ChatGPT/Gemini/Codex tạo candidate/code/tooling nhưng không auto-publish; ghi rõ ChatGPT Pro/Google AI Pro không phải API automation credit và mọi asset phải có provenance/rights/modality QA.
- Ghi nhận thiết kế AI Custom Library nhưng chuyển toàn bộ sang `Deferred — Post-release`; không thuộc `Must`, v1 stack, account/cost baseline, release gate hoặc implementation backlog trước Store Release v1.0.
- Giữ candidate architecture phase sau: private pack có parent preview, PostgreSQL job/credit ledger, Cloud Tasks/Cloud Run và Gemini + Google Cloud TTS adapters; các thành phần này chưa được provision/implement trong v1.

## 2026-09-07

- Tạo `docs-v2` tách khỏi legacy `docs` để review/so sánh.
- Tổng hợp insight ẩn danh từ giáo trình thực tế và market desk research.

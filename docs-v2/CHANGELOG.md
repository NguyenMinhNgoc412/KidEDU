# Documentation v2 Changelog

## 2026-10-30

- C25 thêm bộ chọn ba bài trải nghiệm ở khu phụ huynh, lưu lựa chọn theo hồ sơ/account và giữ checkpoint riêng khi đổi bài. SQLite fixture lên v2; không thay kế hoạch server, production corpus hoặc entitlement.

- C24 tích hợp Today → bài học có lưu → ghi nhận → thử trong sinh hoạt thành một luồng giao diện Gentle Growth, bỏ lối vào prototype trùng lặp. Fixture trên LAN riêng cần opt-in development; không thay production readiness, identity hoặc entitlement.

- C23 nối 29 bộ frame mẫu vào learning player, bổ sung ảnh ba/mẹ và hiển thị bundled still trực tiếp. Animation hữu hạn trước canonical speech, có static/reduce-motion/lifecycle fallback; không đổi production entitlement hoặc content publishing gate.

- C21 sửa login treo khi local endpoint không phản hồi: deadline/abort cho identity và app-server request, lỗi an toàn cho retry và regression tests. Không đổi identity authority, API contract hoặc entitlement guard.

- Theo yêu cầu owner, nâng mobile baseline SDK 57 → 58 và đồng bộ Expo/React Native/React/test dependencies theo compatibility matrix chính thức. C20 ghi verification và native rebuild gate; không đổi product scope, provider hoặc architecture invariant.

## 2026-10-12

- C19 kiểm tra tự động sau SDK 57, sửa TypeScript 6 backend test/build compatibility và cấu hình origin cho full-access smoke. Báo cáo tách automated/browser evidence khỏi Android/iPhone native proof; release gate không đổi.

- C18 sửa cấu hình test đăng nhập Expo Go trên thiết bị thật: opt-in LAN bind cho identity/API local và hướng dẫn hai endpoint dùng địa chỉ Wi-Fi máy tính. Không đổi production identity hoặc database schema.

- Theo yêu cầu owner, nâng mobile baseline từ Expo SDK 54 lên SDK 57, đồng bộ React Native/React và Expo native/test dependencies. Ghi compatibility/build gate tại mobile architecture và task C17; không đổi product scope hoặc native crypto/IAP acceptance gate.

- C15 triển khai luồng fixture Today → PreparedLesson → functional communication → SQLite observation/outbox/checkpoint → parent transfer → retry sync/history. Chỉ backend local, không dùng corpus giả làm production Ready; R01 vẫn còn media activities/production loader.
- C16 tách media mới theo account, chặn URI scoped của account khác và giới hạn orphan sweep. Chưa thay encrypted pack/key policy, không khóa dữ liệu gia đình theo subscription.

- Ghi các sửa lỗi C11–C14 từ review: autoplay hữu hạn, hold Parent Gate/lifecycle, touch target/contrast/selected state, auth refresh, Android local build và Today đọc plan theo hồ sơ. Không đổi SOT hoặc tự chốt TBD.
- Production learning tạm khóa vì projection chưa thay thế signed activation/encrypted packs; R01/R02 và native/release proof vẫn mở trong báo cáo review.

- Tổng hợp PB/PRD/TA TBD v1 vào owner-input checklist để owner bổ sung sau; giữ nguyên trạng thái SOT và Post-release boundary.
- Ghi task C10 sửa local entitlement timer cho quyền dài hơn giới hạn timer JavaScript; không thay contract, schema hoặc activation architecture.

## 2026-09-29

- Owner xác nhận giữ taxonomy `targetType` sáu loại và `activityType` mười loại đang dùng trong content contract v1; bổ sung sau phải qua schema version/compatibility review. Quyết định này không đổi trạng thái `In review` của ba SOT hoặc chốt các TBD khác.

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

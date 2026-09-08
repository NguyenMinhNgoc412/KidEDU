# ADR-0009 — Paid AI custom library generation

**Status:** Deferred — Post-release  
**Date:** 2026-09-08  
**References:** `TA-FUTURE-001`, `PRD-CUSTOM-*`, `PRD-SUB-005`

## Context

Family media cho phép thay asset đã có nhưng chưa giải quyết nhu cầu tạo một bộ từ/cụm/ngữ cảnh riêng. User-facing generation phát sinh variable AI cost, có thể kéo dài hơn một app request và tạo nội dung trẻ em cần safety/preview. Gọi provider trực tiếp từ mobile sẽ lộ credential, khó giới hạn cost và không tạo được pack/entitlement nhất quán.

## Decision

Quyết định này được lưu cho phase sau và không thay đổi scope, stack, release gate hoặc account/cost baseline của Store Release v1.0.

- Khi phase sau được owner approve, thêm AI Custom Library như paid add-on dành cho active subscriber, dùng consumable generation credit được Apple/Google xác thực và backend quản lý bằng ledger.
- Mobile chỉ gửi typed draft cho app server. Generation bất đồng bộ qua PostgreSQL job state + Cloud Tasks; handler chạy trên Cloud Run từ cùng OCI image/codebase.
- Candidate provider: Gemini cho structured Vietnamese/image candidate, Google Cloud TTS `vi-VN` cho audio. Motion dùng allowlisted Reanimated/SVG/Lottie recipe; custom flow không AI-generate mouth video mặc định, parent có thể tự quay/import.
- Parent preview và approve trước private pack publish. Automated schema, technical, privacy và child-safety gate chạy trước preview.
- Credit được reserve trước job, capture tại minimum successful output/preview-ready theo disclosed policy và release/refund idempotently khi terminal server/provider failure.
- Custom pack family-scoped, signed/encrypted/versioned và dùng normal download/activation path. AI/provider không được gọi trong learning loop.
- Không gửi family media, child profile/progress/diagnosis hoặc raw private note sang provider mặc định. Provider nằm sau generation adapters và có cost/rate/kill controls.

## Alternatives

- Gọi AI trực tiếp từ client bị loại vì credential, abuse, billing, privacy và schema-control risk.
- Sinh real-time khi mở activity bị loại vì latency/cost/network làm hỏng learning loop.
- Dùng AI video cho mọi custom target bị loại khỏi v1 vì chi phí và độ tin cậy khẩu hình; audio + image + bounded motion có fallback tốt hơn.
- Cho model sinh arbitrary Lottie/code bị loại vì supply-chain/execution/quality risk.
- Tính phí qua payment link ngoài app bị loại cho digital content in-app; dùng store product để tuân platform policy.
- Trừ credit ngay khi enqueue mà không hoàn khi fail bị loại vì không công bằng và khó support.

## Consequences

Khi triển khai phase sau, backend sẽ cần durable job, provider adapters, credit ledger, safety/validation và cost operations. Cloud Tasks khi đó là dependency mới nhưng job authority vẫn ở PostgreSQL, nên có thể thay dispatcher khi migrate khỏi GCP. Trước phase đó, backend v1 không provision hoặc vận hành các thành phần này.

# ADR-0008 — Generated media and animation production

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**References:** `TA-ADR-024`, `PRD-BR-004..005`, `PRD-CONT-001`, `PRD-CONT-004..006`, `PRD-ACT-*`

## Context

KidEDU cần corpus tiếng Việt nhất quán nhưng chỉ mouth-model activity thực sự cần video; các activity khác chủ yếu cần audio, semantic visual và motion có mục đích. Owner đã có ChatGPT Pro, Google AI Pro/Gemini và workflow Veo, trong khi runtime phải nhẹ, chạy local sau khi lesson `Ready` và không bị khóa vào một AI provider.

Rủi ro lớn nhất không phải khả năng sinh đủ asset mà là phát âm/khẩu hình sai, animation làm trẻ thụ động, quyền sử dụng không rõ, output không tái tạo được và nhầm subscription UI với API automation miễn phí.

## Decision

- Veo 3/Veo 3.1 tạo candidate mouth video; clip chỉ publish sau human Vietnamese/mouth-sync QA. Clip khó không đạt dùng canonical audio + semantic visual hoặc family video.
- Canonical speech ưu tiên recording giọng người Việt. Google Cloud TTS `vi-VN` tạo candidate/batch draft; Gemini TTS chỉ là lựa chọn thử nghiệm khi còn Preview. OpenAI TTS không là baseline Vietnamese cho đến khi listening QA chứng minh phù hợp.
- Reanimated + SVG là motion code-native mặc định. Lottie dùng cho animation minh họa không tương tác, có static/reduce-motion fallback. Không baseline Rive, Skia hoặc Spine.
- ChatGPT/Gemini image generation được dùng tạo candidate ảnh; không auto-publish.
- Codex được dùng để triển khai Reanimated/SVG, Lottie đơn giản/generator, storyboard, pipeline normalization và integration/test; không giả định Codex tự tạo được `.riv`/character animation phức tạp đạt production.
- FFmpeg thực hiện normalize/transcode deterministic. Source/master/provenance ở Drive; derivative đã duyệt là immutable, hashed, encrypted và publish qua R2/pack/manifest.
- Mọi generated asset ghi tool/provider/model/version, prompt/recipe reference, rights, reviewer, QA status và hash. AI output không bypass content lifecycle.
- ChatGPT/Google AI subscription chỉ dùng authoring thủ công theo entitlement của account. OpenAI/Gemini/Veo/TTS API automation có billing/quota riêng và chỉ bật sau cost/quality review.

## Alternatives

- Video cho mọi activity bị loại vì không tạo đủ learning value so với kích thước, QA và distraction cost.
- Một provider AI duy nhất cho toàn bộ media bị loại vì chất lượng mỗi modality khác nhau và tăng lock-in.
- TTS làm canonical authority bị loại vì lỗi thanh điệu/phụ âm/ngữ điệu có tác động trực tiếp đến mục tiêu học.
- Rive/Skia/Spine ngay từ đầu bị loại vì chưa có interaction/performance requirement đủ mạnh để đổi lấy authoring, bundle và maintenance cost.
- Auto-publish output AI bị loại vì vi phạm human-reviewed content rule.

## Consequences

Runtime không cần gọi Veo, ChatGPT, Gemini hoặc TTS API và provider authoring có thể thay mà không đổi mobile contract. Corpus cần thời gian review và quản lý provenance; giọng người/rights và QA trở thành release work thực sự. Đổi lại, KidEDU giảm sai mẫu tiếng Việt, giảm dependency/cost runtime và chỉ tải video ở nơi mang lại giá trị.

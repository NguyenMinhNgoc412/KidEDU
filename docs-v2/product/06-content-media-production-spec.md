# Content Media Production Specification

> C50 target update 2026-11-05 — PRD-REWARD-002 bổ sung production corpus tranh/sticker và quyền sử dụng, preview/mask/hash/review. PRD-CUSTOM-* là private authoring v1 riêng; parent approval không biến asset private thành default published content.

| Thuộc tính | Giá trị                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| Trạng thái | `In review`                                                                                          |
| Owner      | Product + Content + Design + Mobile                                                                  |
| Implements | `PRD-BR-004..005`, `PRD-CONT-001`, `PRD-CONT-004..006`, `PRD-ACT-*`, `TA-ADR-007..009`, `TA-ADR-024` |
| Depends on | [Learning Activity Specification](./02-learning-activity-spec.md)                                    |
| Cập nhật   | 2026-11-05                                                                                           |

## 1. Mục tiêu và boundary

Tài liệu này chốt cách KidEDU tạo, duyệt, chuẩn hóa và phát hành video, audio, animation và ảnh minh họa mặc định của v1. Các công cụ AI chỉ nằm trong **authoring pipeline**, không nằm trong learning runtime và không được tự publish output. AI Custom Library thuộc v1 tại [AI Custom Library Specification](./07-ai-custom-library-spec.md), là pipeline private riêng, không gọi AI trong learning runtime.

Mỗi asset phải phục vụ một vai trò học tập đã xác định. Không thêm video hoặc animation chỉ để làm màn hình sinh động; stimulus ngôn ngữ, khoảng chờ và tương tác giữa phụ huynh với trẻ luôn có ưu tiên cao hơn hiệu ứng.

## 2. Ma trận modality mặc định

| Nhóm activity                | Audio                                  | Ảnh/semantic visual           | Animation                                 | Mouth video                                   |
| ---------------------------- | -------------------------------------- | ----------------------------- | ----------------------------------------- | --------------------------------------------- |
| Học từ/khẩu hình             | canonical target audio, bắt buộc       | bắt buộc                      | optional để làm rõ nghĩa                  | bắt buộc chỉ với variant `articulation_model` |
| Nghe hiểu/nhận biết          | authored instruction, bắt buộc         | 2–4 option, bắt buộc          | optional, không làm lộ đáp án             | không cần                                     |
| Gọi tên/nói theo             | cue/model theo prompt ladder           | bắt buộc                      | optional                                  | optional khi content author thấy có giá trị   |
| Vuốt đuôi                    | câu/đoạn đã author và chia segment sẵn | semantic context, bắt buộc    | optional cue                              | không cần                                     |
| Cụm/câu, Có/Không, hỏi đáp   | câu hỏi/model đã author                | bắt buộc khi activity yêu cầu | optional                                  | không cần                                     |
| Mệnh lệnh/giao tiếp/transfer | instruction/model khi phù hợp          | prop/context guidance         | optional, không giả lập hành động của trẻ | không cần                                     |

`Optional` không tham gia readiness nếu không có authored fallback. Thiếu mouth video không được chặn activity chỉ cần audio/ảnh.

## 3. Video khẩu hình

### 3.1. Nguồn tạo

- Baseline authoring là Veo 3/Veo 3.1 để tạo **candidate** video khẩu hình ngắn.
- Video phụ huynh tự quay là override cá nhân hóa và thường có giá trị cao vì quen người/giọng, nhưng không thay đổi default corpus cho gia đình khác.
- Video quay người thật hoặc sản xuất thủ công luôn được phép thay Veo nếu chất lượng/chi phí tốt hơn.
- Veo/model cụ thể không xuất hiện trong mobile contract; đổi provider không làm đổi activity schema ngoài provenance metadata.

### 3.2. Quy chuẩn nội dung

- Một target/cụm ngắn cho mỗi clip; camera chính diện, khung hình cố định, đủ thấy môi-hàm, ánh sáng đều và nền trung tính.
- Phát âm tự nhiên, không thêm nhạc, caption động, vật thể gây nhiễu hoặc camera motion.
- Giữ audio đi cùng hình từ bản được duyệt. Không tự thay audio track nếu làm mất lip-sync.
- Không dùng slow playback nếu âm bị méo; nếu hỗ trợ tốc độ thì chỉ dùng mức đã test với clip cụ thể.
- Từ khó hoặc clip AI sai khẩu hình phải bị reject. Fallback là canonical audio + semantic visual hoặc family video, không cố phát clip kém để đủ độ phủ.

### 3.3. Delivery profile

- Source/master: lưu Drive cùng release form/provenance.
- Derivative mặc định: MP4, H.264, `yuv420p`, AAC-LC; 720p là baseline đủ cho vùng miệng trên mobile, chỉ tăng khi device test chứng minh cần.
- FFmpeg normalize/transcode deterministic; giữ aspect ratio, không crop vùng miệng.
- Output đã duyệt được hash, immutable, mã hóa và publish lên R2 qua pack/manifest.

Human QA phải kiểm phát âm tiếng Việt, khẩu hình–audio sync, vùng miệng, artifact AI, ánh sáng, âm lượng, semantic target và child safety trên thiết bị thật.

## 4. Audio tiếng Việt

### 4.1. Thứ tự nguồn ưu tiên

1. **Giọng người Việt được thu và duyệt** cho canonical target, câu mẫu, câu vuốt đuôi và instruction quan trọng.
2. Google Cloud Text-to-Speech giọng `vi-VN` là provider ổn định để tạo candidate/batch draft khi cần; chọn voice cụ thể bằng blind listening test trước khi dùng trong corpus.
3. Gemini TTS có thể thử cho candidate cần điều khiển nhịp, sắc thái hoặc giọng vùng miền, nhưng trạng thái Preview phải được kiểm lại trước production và không là authority duy nhất.
4. OpenAI TTS không phải baseline cho canonical Vietnamese vì tài liệu hiện hành nói voice được tối ưu cho tiếng Anh; chỉ đánh giá lại bằng QA nếu chất lượng thay đổi.
5. Audio phụ huynh/người thân tự ghi là override cá nhân hóa; default vẫn luôn có fallback được duyệt.

AI TTS không tự động trở thành content hợp lệ. Reviewer người Việt phải nghe toàn bộ canonical corpus hoặc sampling policy đã được owner phê duyệt, kiểm thanh điệu, âm đầu/cuối, nhịp, độ tự nhiên, cách đọc chữ số/viết tắt và ngữ cảnh.

Không clone giọng trẻ/người thân hoặc dùng giọng của họ để train/generate default content nếu chưa có requirement, consent, quyền sử dụng và retention riêng.

### 4.2. Authoring theo vai trò

- `canonical_target`: một từ/cụm ở tốc độ tự nhiên, không kéo âm giả tạo.
- `sentence_model`: nguyên câu có ngữ điệu tự nhiên.
- `cloze_lead` và `cloze_completion`: được content author tạo thành segment riêng cùng một voice/session; pause marker nằm trong schema. Runtime không waveform-cut một file câu đầy đủ.
- `instruction_parent` và `instruction_child`: tách file/role; không dùng một giọng hoặc wording mơ hồ cho cả hai.
- `reinforcement`/SFX: tách khỏi speech; không overlap, che âm mẫu hoặc trở thành reward gây áp lực.

### 4.3. Chuẩn kỹ thuật

- Master: PCM WAV mono, 48 kHz, 24-bit khi nguồn cho phép.
- Xử lý: trim silence hợp lý, loại click/clipping/noise, không noise-gate làm mất phụ âm cuối.
- Loudness target baseline: khoảng `-16 LUFS`, true peak không vượt `-1 dBTP`; clip rất ngắn vẫn cần human listening vì meter không thay perceptual QA.
- Delivery: AAC-LC `.m4a`, mono, 44.1/48 kHz, 64–96 kbps; chỉ đổi codec sau compatibility/size/listening test trên iOS và Android support matrix.
- Không normalize từng segment theo cách làm các phần của cùng một câu lệch âm lượng/giọng.

Mỗi audio descriptor phải có locale `vi-VN`, voice/speaker ID nội bộ, accent/region nếu có ý nghĩa, speaking-rate intent, transcript canonical, role, rights, QA status và content hash.

## 5. Animation

### 5.1. Stack v1

1. `react-native-reanimated` + `react-native-svg`: motion code-native, prompt emphasis, pointing/arrows, state transition và animation semantic đơn giản.
2. `lottie-react-native`: loop minh họa không tương tác hoặc transition tái sử dụng; JSON là asset versioned trong content pack.
3. Rive không thuộc baseline. Chỉ đánh giá khi có nhu cầu state-machine/interactive character cụ thể mà Reanimated/SVG/Lottie không đáp ứng.
4. Skia/Spine không thuộc baseline; chỉ thêm bằng ADR sau POC hiệu năng, bundle size, authoring workflow và license.

Animation không continuous trong lúc trẻ cần nghe/nói. Mỗi animation phải có static fallback và hành vi reduce-motion; timing không được thay wait/prompt state của activity.

### 5.2. Codex có thể làm gì

Codex có thể trực tiếp:

- viết và test animation Reanimated/SVG theo design tokens;
- tạo/chỉnh Lottie JSON đơn giản hoặc script generator, validate và tích hợp asset;
- tạo storyboard, prompt/recipe, file normalization script và wiring vào activity;
- khi capability image generation có sẵn, tạo candidate ảnh raster rồi chuẩn hóa/tích hợp.

Codex không được coi là công cụ authoring đáng tin cậy cho `.riv` phức tạp hoặc character animation hoàn chỉnh chỉ bằng một bước. Animation nhân vật nhiều trạng thái cần tool export/designer hoặc được thay bằng sequence ảnh/video đã review.

## 6. Ảnh minh họa

- ChatGPT image generation hoặc Gemini image generation có thể tạo draft/variant; ảnh stock/tự vẽ/chụp vẫn được phép.
- Duy trì style recipe/reference: palette Gentle Growth, hình rõ chủ thể, ít vật nền, không chữ AI sinh trong ảnh và không chi tiết dễ gây nhầm target.
- Reviewer kiểm semantic tiếng Việt/ngữ cảnh Việt Nam, child safety, consistency, artifact, quyền sử dụng, provenance và không chứa PII.
- Minh họa cần alpha dùng PNG/WebP lossless; ảnh thường dùng WebP theo quality được visual QA duyệt. Luôn giữ source/master và export derivative theo kích thước support matrix.
- Alt/semantic label nằm trong content schema, không suy ra từ filename.

## 7. Workflow phát hành

```text
content brief + target/asset role
→ source/candidate generation or recording
→ source/master + provenance record in Drive
→ deterministic normalize/transcode
→ automated technical validation
→ Vietnamese linguistic/editorial/visual/mouth-motion review
→ approved immutable derivative + content hash
→ encrypted R2 staging
→ pack/manifest readiness validation
→ two-person or owner-approved publish
```

AI output không đi thẳng từ provider vào production bucket. Rejected asset giữ tối thiểu metadata/lý do reject để tránh tái sinh cùng lỗi; raw file retention theo content-operations policy.

## 8. Provenance tối thiểu

Mỗi default asset record có:

- `assetId`, `version`, `kind`, `role`, locale và target/activity binding;
- source type: human recording, family recording, generated, licensed hoặc original design;
- tool/provider, model/version và ngày tạo; prompt/seed/recipe reference khi cho phép lưu;
- source/master/derivative hash, codec/dimensions/duration/loudness liên quan;
- creator/voice/speaker release hoặc license/right scope;
- reviewer, checklist version, review timestamp, status và reject reason;
- accessibility/static fallback và replacement/supersession link.

Prompt/provenance không chứa PII hoặc dữ liệu từ `giao-trinh/`. Secret/API key không bao giờ nằm trong provenance.

## 9. Tài khoản, API và chi phí authoring

- ChatGPT Pro/Codex và Google AI Pro/Gemini hiện có được dùng cho authoring thủ công, thử prompt và tạo candidate theo quota/điều khoản của từng gói.
- Subscription giao diện người dùng không đồng nghĩa API key/automation miễn phí hoặc không giới hạn. OpenAI API và Gemini API có billing/quota riêng khi pipeline gọi programmatically.
- Veo/TTS/image generation cost được ghi theo từng batch/release nếu phát sinh; không đưa chúng vào runtime cost cho mỗi learning session.
- FFmpeg, Reanimated, SVG và Lottie runtime là baseline open-source; vẫn phải audit license của font, voice, model output và từng Lottie/stock asset lấy từ bên ngoài.

Trước khi bật batch API, content owner phải có volume estimate, spending cap, retry/idempotency, source retention và quality sampling plan. Không automate chỉ vì đã có tài khoản Pro.

## 10. Acceptance gate

- Có ít nhất một fixture được duyệt cho từng asset role của activity v1.
- Video khẩu hình pass sync/linguistic/device QA; clip fail có authored fallback.
- Audio pass transcript, thanh điệu, âm đầu/cuối, loudness, clipping/noise và blind listening trên loa/tai nghe thiết bị thật.
- Animation pass reduce-motion, static fallback, performance và không che/giành chú ý với language stimulus.
- Ảnh pass semantic, consistency, accessibility, license/provenance và child-safety review.
- Pack builder từ chối asset thiếu provenance, rights, hash, QA status hoặc format profile.
- Không có raw PII, API key, prompt chứa dữ liệu trẻ hoặc asset chưa duyệt trong production release.

## 11. Tài liệu tham khảo provider

Thông tin availability/pricing phải được kiểm lại trước batch production:

- [Veo video generation](https://ai.google.dev/gemini-api/docs/video)
- [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini speech generation](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Google Cloud Text-to-Speech voices](https://cloud.google.com/text-to-speech/docs/voices)
- [Google AI plans and API billing](https://ai.google.dev/gemini-api/docs/google-ai-plans)
- [OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation)
- [OpenAI text to speech](https://developers.openai.com/api/docs/guides/text-to-speech)
- [ChatGPT/Codex plan usage](https://learn.chatgpt.com/docs/pricing)

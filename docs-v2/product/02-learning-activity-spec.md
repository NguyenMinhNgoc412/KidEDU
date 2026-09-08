# Learning Activity Specification

| Thuộc tính | Giá trị                                                             |
| ---------- | ------------------------------------------------------------------- |
| Trạng thái | `In review`                                                         |
| Owner      | Product + Content + Mobile                                          |
| Implements | `PRD-ACT-*`, `PRD-SES-*`, `PRD-BR-003..006`                         |
| Depends on | [Curriculum & Learning Plan](./01-curriculum-learning-plan-spec.md) |
| Cập nhật   | 2026-09-08                                                          |

## 1. Activity contract chung

Mọi activity instance phải cung cấp:

```text
identity/version
goal + target + activityType
parentInstruction
stimulus sequence
required/optional assets
expected response + authored variants
prompt ladder + wait timing
completion/skip rule
observation rubric
transfer suggestion
```

Learning engine không suy đoán expected response từ text hiển thị và không dùng asset optional để quyết định readiness.

Media role/format/QA tuân [Content Media Production Specification](./06-content-media-production-spec.md). Activity không phân biệt asset đến từ default corpus hay private custom pack sau khi cả hai đã thành `PreparedActivity`; resolver vẫn kiểm source scope, readiness, entitlement, integrity và family binding.

## 2. Media modality contract

| Activity                    | Required baseline                             | Optional/fallback                                                     |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Word/mouth                  | canonical audio + semantic visual             | approved mouth video cho `articulation_model`; static visual fallback |
| Recognition                 | authored instruction audio + visual options   | bounded motion cue, không mouth video                                 |
| Naming/repetition           | semantic visual + authored prompt audio       | mouth video chỉ khi đã review                                         |
| Cloze/sentence/Q&A          | authored text/audio segments + context visual | allowlisted motion/static fallback                                    |
| Command/functional/transfer | parent instruction + prop/context guidance    | audio/motion nếu có learning value                                    |

## 3. Activity state machine

```text
preparing → ready → presenting → waiting
                         ↑          ↓
                         └─ prompt/replay
waiting → observed/skipped → completed
any active state → paused → active state
any active state → safely_terminated
```

- `preparing` không hiển thị là có thể học.
- Media không tự phát lại khi app vừa foreground.
- Replay không tự ghi observation.
- Mỗi activity commit checkpoint trước khi chuyển activity tiếp theo.

## 4. Session shell

Session shell hiển thị primary goal, progress nhỏ, pause/exit và parent hint có thể mở sau Parent Gate nhẹ tùy flow. Không hiển thị timer đếm ngược gây áp lực cho trẻ.

Kết thúc session gồm: lời khen trung tính, observation còn thiếu, một gợi ý ngoài màn hình và lựa chọn kết thúc. Không autoplay vô hạn hoặc tự chuyển sang lesson khác không được parent chuẩn bị.

## 5. Học từ và khẩu hình — `PRD-ACT-001`

**Mục tiêu:** liên kết nghĩa, âm mẫu và khẩu hình của target.

**Required:** canonical audio và semantic visual. Mouth video chỉ required với activity variant `articulation_model`.

**Flow:** visual → audio/video mẫu → khoảng chờ → replay theo parent/trẻ → observation. Illustration và mouth video là hai slot riêng; video không che mất visual.

**Không được:** loop video vô hạn, slow playback làm méo âm, dùng video chưa review hoặc overlay nút lên vùng miệng.

## 6. Nghe hiểu/nhận biết — `PRD-ACT-002`

**Stimulus:** audio instruction và 2–4 visual option theo độ khó đã author.

**Behavior:** vị trí option được random bằng seed của attempt, không lặp pattern đáp án; sau wait time mới cho prompt. App không phát tiếng “sai” mạnh. Parent ghi observation dựa response thực, kể cả khi thao tác chọn do parent thực hiện.

**Variants:** chỉ, chọn, lấy/đưa đồ vật thật, ghép cặp. Variant đồ vật thật chuyển sang parent-guided screen thay vì giả vờ app cảm biến được hành động.

## 7. Gọi tên/nói theo — `PRD-ACT-003`

**Flow expressive-first:** hiện stimulus → chờ cơ hội gọi tên → nếu chưa có response, đưa cue → partial/full model → chờ → observation.

App không phát canonical audio ngay khi stimulus xuất hiện ở mọi lượt. `Nói theo` là prompt/fallback hoặc lesson riêng; không được biến toàn bộ gọi tên thành echolalia practice.

## 8. Vuốt đuôi — `PRD-ACT-004`

Content author khai báo câu đầy đủ, pause marker, phần trẻ hoàn thành, audio segments đã author cùng voice/session và accepted variants.

```text
Người mẫu: “Con mèo kêu…”
PAUSE
Trẻ: “meo meo”
```

Level 1 hoàn thành một từ/cụm ngắn; Level 2 hoàn thành hai từ; Level 3 dùng natural cue/context không phát phần đầu quá dài. Không cắt waveform tự động tại runtime. Parent có thể replay toàn câu sau attempt nhưng replay không thay cơ hội chủ động.

## 9. Cụm/câu chức năng — `PRD-ACT-005`

Sentence frame có slot rõ, ví dụ `Con muốn {đồ vật}`. Activity phải tạo lý do giao tiếp: đưa lựa chọn, giữ vật trong tầm nhìn, chờ hoặc mô tả cảnh. Không yêu cầu trẻ đọc chữ trên màn hình.

Các bước: từ/cụm đã biết → model frame → completion → whole phrase → dùng với vật/người thật.

## 10. Có/Không — `PRD-ACT-006`

Question set cân bằng truth value, chủ đề và vị trí. Không chạy quá ba câu cùng đáp án liên tiếp. Tách:

- preference/need question, không có “đáp án đúng” khách quan ngoài phản hồi trẻ;
- factual identification question có authored truth;
- confirmation trong context thực.

Observation rubric phải phân biệt hiểu câu hỏi và chỉ bắt chước từ cuối.

## 11. Hỏi đáp trực quan — `PRD-ACT-007`

V1 hỗ trợ:

- `Đây là gì/con gì/quả gì/ai?`;
- `Cái gì dùng để...?`;
- `Ai đang làm gì?`.

Question template không tự ghép mọi target. Content author kiểm tra ngữ pháp, classifier (`cái/con/quả`) và expected sentence length. Prompt đi từ lựa chọn/partial frame đến câu độc lập.

## 12. Mệnh lệnh một/hai bước — `PRD-ACT-008`

App hiển thị danh sách đồ cần chuẩn bị cho parent, sau đó phát instruction một lần. Parent quan sát trẻ thực hiện; nếu cần nhắc/làm mẫu, chọn `+/-` và prompt level. Hai bước phải có ordered actions và distinct objects; app không tự kết luận dựa touch screen.

## 13. Giao tiếp chức năng — `PRD-ACT-009`

Scenario v1: yêu cầu, lựa chọn, từ chối, gọi người, chào, rủ chơi, chờ/đến lượt và sở hữu. Mỗi scenario định nghĩa communication opportunity, partner action và natural consequence. Reward ưu tiên kết quả thật của giao tiếp, không phải coin/badge.

## 14. Parent-guided transfer — `PRD-ACT-010`

Màn hướng dẫn chỉ gồm:

1. chuẩn bị gì;
2. nói/làm gì;
3. chờ bao lâu;
4. gợi ý từ ít đến nhiều;
5. ghi nhận thế nào.

Có nút “Bắt đầu quan sát”, “Ghi nhận” và “Để lúc khác”. Không dùng từ `offline mode`.

## 15. Auto Play — `PRD-ACT-011`

Auto Play chỉ dành cho chuỗi stimulus có thể tự điều phối an toàn. Nó hỗ trợ `pause`, `replay`, `next`, `stop`, số vòng giới hạn và khoảng chờ. Activity cần đồ vật thật, trả lời parent hoặc observation chi tiết không được đưa vào autoplay không giám sát.

## 16. Observation UI

Sau một cụm attempt ngắn, parent chọn:

- `Độc lập (+)`;
- `Có hỗ trợ (+/-)` và prompt level nếu có;
- `Chưa thực hiện (-)`;
- `Bỏ qua/Không quan sát được`.

Child Mode không hiển thị dấu trừ hoặc thông điệp thất bại cho trẻ.

## 17. Error/fallback

| Lỗi                            | Hành vi                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| optional asset thiếu           | dùng authored fallback, vẫn chạy nếu readiness đạt                |
| required local asset lỗi       | không bắt đầu; pack chuyển failed/repair                          |
| media player lỗi trong session | pause, thử lại một lần hoặc bỏ activity có giải thích cho parent  |
| app background                 | pause tất cả media/timer, commit checkpoint                       |
| process kill                   | reopen sau activation, đề nghị resume từ checkpoint               |
| entitlement mất                | kết thúc activity boundary an toàn, không mở activity premium mới |

## 18. Reuse UI hiện có

Có thể giữ `LearningMediaPlayer`, `MediaContainer`, control bar, pause/replay/next và Auto Play engine/timeline làm foundation. Phải thay input `LearningItem/Card` bằng `PreparedActivity`, bổ sung prompt/wait/observation state và tách illustration khỏi mouth video đúng activity contract.

## 19. Acceptance

Mỗi loại activity phải có fixture content, unit test state machine, component test prompt/wait, lifecycle test, accessibility test và ít nhất một E2E từ lesson ready đến observation sync. Không release activity chỉ có UI mà chưa có rubric/content QA.

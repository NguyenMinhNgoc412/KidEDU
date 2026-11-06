# Curriculum & Learning Plan Specification

> C50 target update 2026-11-05 — PRD-NAV-001/PRD-SUB-006: chủ đề là entry của Tập nói, không thay goal/progression; basic/full content tier độc lập skill/readiness. Custom authoring paid theo PRD-CUSTOM-*. Không cap số phiên Tập nói/ngày.

| Thuộc tính | Giá trị                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| Trạng thái | `In review`                                                                           |
| Owner      | Product + Content                                                                     |
| Implements | `PRD-PLAN-*`, `PRD-CONT-*`, `PRD-BR-001..005`                                         |
| Depends on | [Product Brief](../01-product-brief-sot.md), [PRD](../02-product-requirements-sot.md) |
| Cập nhật   | 2026-11-05                                                                            |

## 1. Mục tiêu

Định nghĩa cách KidEDU tổ chức curriculum tiếng Việt và tạo learning plan có thể giải thích. Đây không phải giáo trình chẩn đoán hoặc phác đồ can thiệp. Tuổi chỉ là context; kỹ năng quan sát được mới quyết định điểm bắt đầu.

## 2. Curriculum map v1

Cùng luyện session controls (C36/C37, owner request): parents may select which available lessons belong to the next session and set their order, rather than always running all samples. Add/remove, clear/select-all and up/down controls are parent-gated. Explicit selection survives goal changes/reload; empty selection cannot start. An active prepared session keeps its original list; subsequent edits apply to the next session. Parent reviews still follow the complete selected learning sequence, one review per lesson. Progression/rubric/entitlement requirements remain unchanged.

| Domain              | Goal điển hình                                         | Đầu ra quan sát                                     |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Nghe hiểu           | nhận biết người/vật/hành động; làm theo yêu cầu        | chỉ/chọn/lấy/đưa đúng, thực hiện đúng thứ tự        |
| Vốn từ diễn đạt     | gọi tên người, vật, hành động, thuộc tính              | gọi tên trước khi nghe mẫu                          |
| Bắt chước lời nói   | âm/từ/cụm ngắn theo mẫu phù hợp                        | thử nói sau mẫu và khoảng chờ                       |
| Vuốt đuôi           | hoàn thành 1 rồi 2 từ cuối câu quen thuộc              | chủ động điền phần bị dừng                          |
| Kết hợp từ/câu      | `Muốn + vật`, chủ thể + hành động, câu 2–4 từ          | dùng cấu trúc trong tình huống                      |
| Hỏi đáp             | Có/Không, Đây là gì, Cái gì dùng để, Ai làm gì         | trả lời đúng loại và đủ mức câu mục tiêu            |
| Mệnh lệnh           | yêu cầu một rồi hai bước                               | thực hiện đủ, đúng thứ tự                           |
| Giao tiếp chức năng | yêu cầu, từ chối, lựa chọn, gọi, chào, rủ chơi, sở hữu | dùng lời nói với mục đích thật                      |
| Khái quát hóa       | cùng target với người/vật/bối cảnh khác                | dùng ngoài màn hình và không phụ thuộc một stimulus |

Các lĩnh vực vận động tinh, xã hội/hành vi và cơ quan cấu âm trong research input chỉ được đưa vào app khi trực tiếp hỗ trợ mục tiêu giao tiếp và đã có review chuyên môn. Chúng không tự động trở thành curriculum domain v1.

## 3. Content hierarchy

```text
SkillDomain
  └─ Goal
      ├─ prerequisite Goal
      ├─ Target
      │   └─ ActivityInstance theo ActivityType
      └─ Lesson
          ├─ activity sequence
          └─ parent-guided transfer
```

- `Target` là nội dung tái sử dụng; không đồng nhất với màn hình/card.
- `ActivityInstance` định nghĩa stimulus, expected response, prompt và asset bắt buộc.
- `Lesson` là đơn vị trải nghiệm ngắn, có một primary goal và tối đa một supporting goal.
- `PlanItem` tham chiếu lesson/version và trạng thái của riêng child.

## 4. Metadata bắt buộc

Mỗi target có: canonical Vietnamese text, normalized search text, target type, topic, semantic tags, complexity, region/accent note nếu có, prerequisite, allowed activity types, safety note, provenance và content version.

Mỗi activity instance có: instruction, stimulus, expected response, accepted variants do người biên soạn xác định, prompt ladder, wait time range, repetition limit, asset requirements, observation rubric và transfer activity.

## 5. Onboarding input

Onboarding chỉ hỏi điều phụ huynh quan sát được:

- trẻ có hiểu yêu cầu quen thuộc không;
- trẻ đang dùng cử chỉ, âm, từ đơn hay cụm/câu;
- trẻ có chủ động yêu cầu hoặc chủ yếu nhắc lại;
- trẻ trả lời được loại câu hỏi nào;
- target/người/vật nào có ý nghĩa trong gia đình;
- mục tiêu phụ huynh ưu tiên.

Không hỏi để tính “mức chậm nói”, không trả phần trăm phát triển và không dùng kết quả thay đánh giá chuyên môn.

## 6. Initial plan

Client nhận curriculum snapshot đã publish và chạy deterministic plan rules:

1. loại activity không tương thích device/content readiness;
2. lấy goal phù hợp với observation đầu vào;
3. thêm prerequisite chưa được xác nhận;
4. chọn target chức năng/quen thuộc trước target trang trí;
5. tạo một plan ngắn gồm lesson làm quen, lesson luyện và transfer activity;
6. giải thích cho parent: “Bài này giúp gì” và “Khi nào thử bước tiếp”.

Plan computation chạy client; server chỉ lưu input, selected content version và persisted plan state.

## 7. Daily plan composition

Một daily plan ưu tiên:

1. một lesson ôn target gần đây cần hỗ trợ;
2. một lesson primary goal hiện tại;
3. không quá một target mới trong cùng cụm ngắn nếu trẻ đang cần nhiều prompt;
4. một hoạt động ngoài màn hình có thể làm trong sinh hoạt;
5. kết thúc trước khi trẻ mất hợp tác, không dùng streak để ép kéo dài.

Số activity và thời lượng cụ thể thuộc usability tuning; server config có thể đặt giới hạn nhưng không thay curriculum rule.

## 8. Recommendation rule

Sau observation, client tạo recommendation có `reasonCode`:

| Điều kiện khái niệm                              | Đề nghị                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| nhiều lượt `-` hoặc cần prompt mạnh              | giảm độ khó, đổi stimulus, quay prerequisite hoặc hướng dẫn parent |
| `+/-` ổn định                                    | lặp với prompt thấp hơn hoặc bối cảnh khác                         |
| `+` lặp lại ở nhiều stimulus/ngày                | thử activity kế tiếp hoặc transfer                                 |
| kết quả khác biệt lớn giữa app và ngoài màn hình | ưu tiên khái quát hóa, không tăng target mới                       |
| bị skip/thiếu observation                        | không tự suy luận thành thất bại                                   |

Ngưỡng số học là `PRD-TBD-01`; trước khi chốt phải test với dataset giả lập và review chuyên môn. Mọi recommendation phải hiển thị lý do, cho parent bỏ qua và không gắn nhãn y khoa.

## 9. Prompt ladder chung

Từ nhiều trợ giúp đến ít:

1. full model/làm mẫu và lựa chọn đơn giản;
2. partial verbal/visual model;
3. gesture/visual cue;
4. natural cue + wait;
5. independent opportunity.

Không phải activity nào cũng dùng đủ năm mức. Content author phải khai báo prompt hợp lệ; hệ thống không tự giảm prompt chỉ vì đã xem nhiều lần.

## 10. Generalization

Một target chưa được coi là khái quát hóa chỉ vì trẻ chọn đúng cùng một ảnh. Plan cần luân chuyển có kiểm soát:

- default visual và family visual;
- ảnh, đồ vật thật và người thật;
- người hỏi khác;
- vị trí/ordering khác;
- activity receptive và expressive;
- tình huống có nhu cầu thật.

## 11. Content authoring và QA

Content đi qua `draft → in_review → approved → published → retired`.

Review checklist tối thiểu:

- tiếng Việt tự nhiên và phù hợp ngữ cảnh;
- mục tiêu/expected response rõ;
- pause marker của vuốt đuôi không làm câu vô nghĩa;
- câu Có/Không cân bằng đáp án;
- visual không mơ hồ hoặc chứa quá nhiều đối tượng;
- audio rõ, không nhạc nền lấn lời;
- video khẩu hình đúng target và không bị mirror/crop sai;
- license/provenance đầy đủ;
- không có PII trong research source;
- activity readiness và fallback chính xác.

## 12. Versioning

- Published target/activity/lesson là immutable theo version.
- Sửa semantic/expected response tạo version mới.
- Sửa typo không ảnh hưởng meaning vẫn tạo content revision để cache invalidation rõ.
- Session đang chạy giữ version cũ đến hết.
- Progress history giữ ID/version đã quan sát; retire không xóa lịch sử.

## 13. Acceptance scenarios

1. Hai child cùng tuổi nhưng input kỹ năng khác nhận plan khác mà không có chẩn đoán.
2. Target thiếu mouth video vẫn xuất hiện trong recognition nếu đủ asset của recognition.
3. Một từ đã học được tái sử dụng trong câu chức năng và transfer activity.
4. `+/-` không tự chuyển goal thành mastered.
5. Parent có thể từ chối recommendation và thấy plan cập nhật nhất quán.
6. Content version mới không thay stimulus giữa learning session đang chạy.

## 14. Open items

- `CUR-TBD-01`: corpus target/lesson tối thiểu của v1;
- `CUR-TBD-02`: numeric recommendation thresholds;
- `CUR-TBD-03`: Vietnamese accent policy cho default audio;
- `CUR-TBD-04`: hội đồng/người chịu trách nhiệm content approval.

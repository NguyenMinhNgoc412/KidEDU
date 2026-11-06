# Kế hoạch tính năng Cùng luyện bên cạnh Học

> Historical proposal/baseline: các mô tả navigation, game/review/reward/free/AI trái PRD C50 đã superseded ngày 2026-11-05. Target thực thi là C50; phần dưới không cấp scope riêng hoặc giữ AI post-release.

Owner correction implemented in [C36](./tasks/C36-multi-lesson-session-end-review.md): **một phiên học nhiều bài liên tiếp, học hết rồi phụ huynh mới nhận xét riêng từng bài**. Danh sách bài trong phiên thay cho lựa chọn một bài làm cả phiên; chọn mục tiêu/bài chỉ ưu tiên thứ tự, hoãn bài là thao tác chủ động. Các mô tả milestone ban đầu về một buổi/một primary goal hoặc nhận xét xen giữa được đọc theo cập nhật này; không dùng chúng để khôi phục flow cũ.

| Thuộc tính | Giá trị                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trạng thái | `Draft — kế hoạch theo yêu cầu owner`, chưa là xác nhận hoàn tất tính năng                                                                                                                                                                                                                                                                                                             |
| Ngày       | 2026-11-03                                                                                                                                                                                                                                                                                                                                                                             |
| Owner      | Product + Design + Content + Mobile + Backend                                                                                                                                                                                                                                                                                                                                          |
| Yêu cầu    | Phát triển bản mô phỏng giáo trình thành một tính năng riêng bên cạnh Học                                                                                                                                                                                                                                                                                                              |
| Implements | `PB-PILLAR-01..05`, `PRD-PLAN-001..005`, `PRD-ACT-001..011`, `PRD-PROG-*`, `PRD-MEDIA-*`, `PRD-SES-*`, `TA-ADR-004..006`                                                                                                                                                                                                                                                               |
| Depends on | [Bản điều chỉnh giáo trình](../product/08-classroom-curriculum-v2-adaptation.md), [Curriculum](../product/01-curriculum-learning-plan-spec.md), [Activities](../product/02-learning-activity-spec.md), [Family media](../product/03-parent-family-media-spec.md), [Observation](../product/04-progress-observation-spec.md), [IA](../design/01-information-architecture-user-flows.md) |

## 1. Kết quả cần đạt

Owner clarification 2026-11-04: ưu tiên luồng trẻ trực tiếp chơi nhiều trò trên bộ từ của cùng bài. [C40](./tasks/C40-lesson-vocabulary-games.md) là kế hoạch cập nhật, gồm ba trò mẫu đã triển khai và các đợt nội dung/chương/album tiếp theo. Những giả định neutral-only hoặc loại bỏ sticker trong phần kế hoạch cũ được thay bởi `PRD-ACT-012`; nhận xét parent vẫn độc lập cuối phiên.

Phụ huynh mở Cùng luyện và biết hôm nay luyện mục tiêu nào, cần chuẩn bị gì, cách chờ/gợi ý, trẻ sẽ làm gì và lần sau nên thử gì. Mỗi buổi có trình tự rõ nhưng có thể dừng, hoãn hoặc đổi hoạt động theo phản hồi thực tế.

Đây là một trải nghiệm có lối vào, trang tổng quan, kế hoạch, hoạt động và lịch sử riêng. Tái sử dụng target, media, lesson runtime và dữ liệu quan sát chung với KidEDU; không tạo hệ thống tài khoản, subscription hoặc chấm năng lực thứ hai.

Tên làm việc: **Cùng luyện**. Không gọi là lớp can thiệp hoặc hứa thay thế chuyên viên. Phạm vi vẫn là hỗ trợ ngôn ngữ/giao tiếp tiếng Việt theo Store Release v1.0.

## 2. Vị trí cạnh Học

Đề xuất thanh điều hướng:

```text
Học             Cùng luyện             Phụ huynh
                 ├─ Buổi hôm nay
                 ├─ Mục tiêu đang luyện
                 ├─ Chọn buổi phù hợp
                 └─ Tiếp tục buổi đã lưu
```

| Khu vực    | Công việc chính                                                           | Quan hệ với Cùng luyện                                                                |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Học        | Truy cập nội dung/hoạt động học hiện có                                   | Có thể gợi ý dùng target quen thuộc trong một buổi Cùng luyện; không nhân đôi lịch sử |
| Cùng luyện | Tổ chức buổi luyện theo goal, có nhiều cơ hội phản hồi và transfer        | Là entry point riêng; không giấu phần cốt lõi trong menu chọn bài mẫu của Parent Zone |
| Phụ huynh  | Hồ sơ, điều chỉnh plan, quan sát chi tiết, media, subscription và dữ liệu | Sở hữu cấu hình nhạy cảm và báo cáo; đi qua Parent Gate                               |

Tab Cùng luyện có thể hiển thị tên buổi, mục tiêu diễn đạt dễ hiểu, trạng thái chuẩn bị và nút bắt đầu/tiếp tục. Sửa goal, chọn child, thay media, xem kết quả chi tiết và ghi observation cần Parent Gate/handoff tương ứng. Child Zone không hiện dấu trừ, thông tin thanh toán hoặc nút sửa plan.

**Impact IA:** IA §1 hiện quy định hai tab. Yêu cầu mới cho phép lập phương án tính năng cạnh Học; chưa tự thay tài liệu baseline. Trước task navigation, cập nhật IA §1–3, wireframes và reuse map để ba tab có cùng quy tắc back/active state/deep link. Không đổi Product Brief hoặc mở thêm lĩnh vực đào tạo.

## 3. Luồng sử dụng trọn vẹn

```text
Cùng luyện
→ lần đầu: phụ huynh xác nhận hồ sơ và điều đang muốn hỗ trợ
→ xem mục tiêu/buổi được đề nghị và lý do
→ chuẩn bị đồ vật + media + kiểm tra sẵn sàng
→ bắt đầu buổi
→ hoạt động theo mục tiêu → khoảng chờ → hỗ trợ nếu cần
→ phụ huynh ghi nhận sau cơ hội/cụm lượt ngắn
→ thử với người/đồ vật/ngữ cảnh thật
→ kết thúc + xem điều vừa ghi nhận + gợi ý lần tới
```

Người đã có hồ sơ/goal không phải onboarding lại. Không khảo sát bảy lĩnh vực hay đặt bậc bằng tuổi. Cho phép giữ mục tiêu, thay một bài hoặc để hôm khác; không bắt phụ huynh biên soạn toàn bộ buổi từ đầu.

## 4. Các màn hình phải có

| Màn hình            | Nội dung và hành động                                                                  | Điều kiện hoàn thành                                                                       |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Trang Cùng luyện    | Buổi hôm nay, goal, lý do, trạng thái chuẩn bị, tiếp tục buổi dở                       | Người dùng thấy ngay tính năng riêng khi vào tab; không chỉ một card dẫn tới player cũ     |
| Chọn mục tiêu       | Các nhu cầu nghe hiểu, gọi tên, kết hợp lời, trả lời, giao tiếp; ví dụ quan sát cụ thể | Parent chọn/hoãn được; không trả tuổi phát triển hoặc chẩn đoán                            |
| Bản đồ mục tiêu     | Goal đang luyện, quan hệ prerequisite, hoạt động liên quan và gợi ý tiếp theo          | Không biến thành thang bậc tuyến tính hoặc tự mở khóa bằng số lượt xem                     |
| Chuẩn bị buổi       | Primary goal, supporting goal nếu có, chuỗi hoạt động, đồ vật, media/fallback          | Thấy required/optional rõ; thiếu required chưa được bắt đầu                                |
| Sân hoạt động       | Cách trình bày riêng cho từng activity, khoảng chờ, replay/prompt/pause                | Trẻ có việc nghe/chọn/nói/làm thật; không phải mọi bài cùng một ảnh và lời hướng dẫn chung |
| Ghi nhận            | Rubric đúng goal, mức prompt, bốn kết quả, không quan sát được                         | Chỉ parent xác nhận; touch completion không tự thành independent                           |
| Thử trong sinh hoạt | Chuẩn bị, câu nói/hành động, khoảng chờ, gợi ý và ghi nhận                             | Để lúc khác được; quan sát tách context, không phụ thuộc đạt điểm màn hình                 |
| Kết thúc            | Hoạt động đã làm/bỏ qua, observation còn thiếu, gợi ý lần tới                          | Parent chấp nhận/hoãn; không autoplay nối vô hạn                                           |
| Lịch sử mục tiêu    | Quan sát theo activity/ngữ cảnh/ngày và mức hỗ trợ                                     | Trong Parent Zone; không gọi phân phối quan sát là phần trăm phát triển                    |

Tất cả có loading/empty/error/locked/paused và large-text state theo thiết kế hiện có. Dùng Gentle Growth, AppText/Screen/Card/KidButton/MediaContainer và player foundation; không tạo visual system mới.

## 5. Chương trình luyện và sự khác biệt giữa các hoạt động

Các nhóm dưới đây là cách giới thiệu goal cho phụ huynh, không phải enum/schema mới. Mười activity type hiện có tiếp tục là taxonomy kỹ thuật; Auto Play là khả năng điều phối có kiểm soát.

| Nhóm mục tiêu             | Activity có sẵn trong contract | Trải nghiệm phải xây                                                                                      |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Làm quen từ/âm mẫu        | word_model                     | Hình nghĩa và âm mẫu; khẩu hình ở variant cần video đã review; có khoảng trẻ thử                          |
| Nghe hiểu/nhận biết       | recognition                    | Nghe yêu cầu, chỉ/chọn trong tập lựa chọn; đổi vị trí theo seed; parent phân biệt bấm hộ với phản hồi trẻ |
| Gọi tên/nói theo          | naming                         | Hiện stimulus, chờ trước mẫu; cue/model chỉ xuất hiện theo kịch bản và nhu cầu hỗ trợ                     |
| Hoàn thành lời quen thuộc | cloze_tail                     | Audio segment có điểm dừng đã author; chờ phần trẻ hoàn thành; không tự cắt âm runtime                    |
| Kết hợp cụm/câu           | functional_sentence            | Cảnh/nhu cầu có ý nghĩa và sentence frame; không yêu cầu trẻ đọc chữ hoặc chỉ ghép khối đúng              |
| Trả lời                   | yes_no, visual_qa              | Tách câu về sở thích khỏi factual; hỏi đúng ngữ cảnh/loại câu và mức câu mục tiêu                         |
| Hiểu và làm theo yêu cầu  | command                        | Chuẩn bị đồ thật, phát/nói yêu cầu một hoặc hai bước; parent quan sát thứ tự thực hiện                    |
| Giao tiếp chủ động        | functional_communication       | Yêu cầu, lựa chọn, từ chối, gọi/chào/rủ chơi/chờ lượt/sở hữu có partner action và kết quả tự nhiên        |
| Dùng trong đời sống       | parent_transfer                | Đổi người/vật/context, hướng dẫn ngắn và ghi nhận riêng với đời thật                                      |

Một buổi có một primary goal, tối đa một supporting goal và các activity phù hợp. Không bắt đủ chín nhóm hoặc đủ bốn giai đoạn ở mọi buổi. Thời lượng/số lượt là tham số usability, không tự chốt 12–15 phút hay 5–8 lượt.

### Buổi minh họa để kiểm chứng trải nghiệm

**Mục tiêu: dùng lời/cử chỉ phù hợp để yêu cầu bóng.**

1. Parent chuẩn bị bóng thật, chọn ảnh quen thuộc nếu có; xem cách tạo cơ hội mà không ép nói.
2. Theo đầu vào của trẻ, buổi có thể ôn nhận biết bóng hoặc vào thẳng cơ hội yêu cầu; không bắt nhận biết làm cửa khóa mọi goal.
3. App tạo/người lớn thực hiện tình huống; chờ phản hồi trước cue/model.
4. Parent ghi riêng response và mức hỗ trợ. Gọi tên “bóng” không tự chứng minh yêu cầu chủ động.
5. Trong sinh hoạt, đổi người chơi hoặc dùng một bóng khác; ghi parent_guided.
6. Kết thúc với lời giải thích lần tới nên ôn, giảm prompt hay tiếp tục đổi ngữ cảnh. Không gắn nhãn mastered nếu rule còn TBD.

Buổi này phải khác rõ cả về màn hình và tương tác với buổi nghe–chọn hoặc mệnh lệnh hai bước. Chỉ đổi tên/ảnh trên cùng một template chưa đạt acceptance của tính năng.

## 6. Nội dung và media là một workstream riêng

Lập coverage matrix `goal → prerequisite → target → activity → required asset → rubric → transfer → reviewer`. Corpus tối thiểu vẫn thuộc `CUR-TBD-01`/`PRD-TBD-02`; không dùng bảy fixture hiện có làm bằng chứng đủ chương trình.

- Soạn bộ nội dung đại diện đủ để kiểm chứng từng interaction trước khi mở rộng số bài.
- Audio, classifier/câu tiếng Việt, accepted variants và pause markers cần editorial review.
- Mouth video có modality QA riêng; không bắt có video cho mọi activity.
- Family media gắn theo child/target/activity/role, có preview, fallback và resolver kiểm quyền.
- Publish chỉ sau content approval, provenance/rights, readiness và pack validation.

Không coi permission camera/micro cho family capture là quyền tự nhận diện/chấm trẻ. Không thêm trò luyện hơi, vận động tinh độc lập, sticker/hộp thưởng hoặc AI Custom Library vào scope.

## 7. Kế hoạch triển khai theo boundary

Mỗi dòng là một nhóm task; khi bắt đầu cần task riêng có requirement IDs, dependency, acceptance, tests, migration và rollback. Không gom UI, schema, toàn backend và nhiều activity vào một task.

| Giai đoạn                     | Việc cần làm                                                                                                                   | Dependency                                           | Bằng chứng hoàn thành                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| P1 — Product/UX               | Chốt trách nhiệm Học/Cùng luyện, cập nhật IA và wireframes; dựng walkthrough có normal/error/locked/paused                     | Yêu cầu owner + ba SOT + adaptation §08              | Có thể review một hành trình từ tab mới tới kết thúc; phân biệt rõ các loại hoạt động                           |
| P2 — Entry/navigation         | Thêm tab, route shell, back/deep-link/auth/Parent Gate, trạng thái loading/empty                                               | P1                                                   | Vào tính năng trực tiếp từ thanh tab trên phone/tablet; không làm mất phiên Học                                 |
| P3 — Plan domain              | Goal discovery, curriculum snapshot, prerequisite, tạo buổi deterministic có lý do, chọn/hoãn/thay bài                         | P1, content graph mẫu                                | Unit scenarios cho trẻ khác đầu vào, goal song song, missing observation; chưa tự chốt mastery                  |
| P4 — Persistence/API          | Đối chiếu contract hiện có; bổ sung adapter/repository và migration tối thiểu cho plan/session nếu cần                         | P3 domain contract                                   | Child/account isolation, optimistic update, idempotency, sync/rollback được test; không share Prisma với mobile |
| P5 — Một luồng hoạt động thật | Hoàn thiện một buổi giao tiếp chức năng + transfer từ tab mới, dùng preparation/checkpoint/observation chung                   | P2–P4                                                | Trải nghiệm end-to-end thực sự; dừng/khôi phục/hoãn và context đúng; chưa gọi là đủ feature                     |
| P6 — Runtime media            | PreparedActivity asset resolver/player, local readiness, role binding/fallback; kiểm nguồn/quyền                               | Content contracts và security delivery có bằng chứng | Không phát asset thiếu QA hoặc dùng network giữa lượt; naming không lộ mẫu trước cơ hội                         |
| P7 — Activity coverage        | Tách task lần lượt: word model; recognition; naming; cloze; sentence; yes/no; visual QA; command; mở rộng functional scenarios | P6 + nội dung được duyệt cho từng loại               | Mỗi type có UI/state machine/fixture/rubric/content QA và E2E riêng; không dùng template request để thay tất cả |
| P8 — Family media             | Nối editor/resolver theo child-target-activity-role và prepared session                                                        | P6                                                   | Replace stage/preview/atomic commit, fallback, account switch; dữ liệu không bị khóa do hết subscription        |
| P9 — Progress/recommendation  | Lịch sử theo goal/context, reasonCode, đủ/thiếu quan sát, parent accept/hoãn bền vững                                          | P3–P8                                                | Không tự mastery từ click; không mất observation; input mâu thuẫn ưu tiên quan sát thêm                         |
| P10 — Production integration  | Nối published corpus, signed/encrypted packs, activation và entitlement; loại đường fixture khỏi bản phát hành                 | Các workstream production R01/R02 và content QA      | Mở bài từ server-authorized prepared pack; không bật fixture để vượt gate                                       |
| P11 — Release hardening       | Accessibility, sensory, lifecycle, process kill, low storage, expiry/refund/account switch, thiết bị thật                      | P10                                                  | Báo cáo device/security/content review và release gates thực chạy                                               |

Content authoring có thể chuẩn bị song song với thiết kế, nhưng UI không công bố bài Ready trước khi đủ asset và quyền. P5 là milestone chạy xuyên suốt đầu tiên; P7–P11 vẫn là công việc bắt buộc tương ứng cho Store Release, không mặc nhiên đẩy core activity sang Post-release.

Không ước lượng ngày hoàn thành trước khi chốt coverage nội dung, reviewer và lượng việc production còn thiếu. Theo dõi tiến độ bằng capability và evidence thay vì số task/test.

## 8. Dùng lại phần đã có và phần còn thiếu

| Foundation hiện có               | Cách dùng trong tính năng mới                             | Giới hạn phải xử lý                                                                 |
| -------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| C26 catalog/goal filter          | Fixture để thử navigation/plan mapping                    | Bảy bài chưa là curriculum production hoặc chương trình đủ activity                 |
| C27 session/guidance/observation | Dùng lại wait/prompt/checkpoint/rubric và command context | Prepared loader hiện chỉ nhận activity hướng dẫn không required media               |
| C28 recommendation               | Bộ tình huống kiểm chứng skip/context/reasonCode          | Chỉ latest local history; hoãn hiện là UI tạm; chưa là persisted plan progression   |
| SQLite observation/outbox        | Giữ atomic commit, stable IDs và history                  | Không convert status thẻ legacy; chỉ migration additive có version                  |
| Media editor/player/theme        | Reuse UX nền, staging và lifecycle                        | Binding legacy LearningItem cần adapter/refactor đúng role/child; không nối tắt URI |
| Auth/backend/entitlement nền     | Giữ application boundary và account namespace             | Signed activation/encrypted production packs chưa thể thay bằng projection local    |

Trước implementation lập code inventory theo từng task; không khẳng định foundation hỗ trợ capability chỉ vì đã có tên component tương tự.

## 9. Acceptance cho toàn tính năng

1. Thanh tab có Cùng luyện rõ ràng, vào đúng hub; từ Học sang Cùng luyện rồi quay lại không làm mất checkpoint.
2. Phụ huynh có thể chọn mục tiêu, biết vì sao buổi được đề nghị và thấy chuẩn bị trước khi bắt đầu.
3. Các hoạt động nghe–chọn, gọi tên, vuốt đuôi, câu/hỏi đáp và giao tiếp/đồ thật có interaction đúng mục tiêu, được review riêng.
4. Bài đã Ready chạy local, immutable version; background không tự phát tiếp khi foreground.
5. Trẻ có cơ hội trước mẫu ở naming; prompt/replay không tự tạo independent hoặc completion thành năng lực.
6. Parent ghi bốn kết quả với đúng rubric; observation + checkpoint + outbox atomic; duplicate không nhân đôi.
7. Transfer là phần nhìn thấy được của buổi, có thể hoãn và ghi context riêng; không xem app-response là bằng chứng dùng ngoài đời.
8. Family media đúng child/role có preview/fallback; replace thất bại không mất bản cũ.
9. Recommendation có lý do và parent control; hoãn/thay plan được lưu theo semantics đã chốt, không chỉ ẩn UI.
10. Trial/subscription, expired/refund, account switch và resolver/key guards áp dụng như phần Học; dữ liệu gia đình vẫn xem/xuất/xóa được.
11. Release có corpus/asset QA và device evidence; test fixture/browser không được báo thành feature production đã hoàn tất.

## 10. Migration, rollback và tài liệu sở hữu

- Navigation: thêm route/tab, giữ deep link cũ qua adapter; không xóa entry Học để ép chuyển tính năng. Khi rollback, ẩn entry mới nhưng giữ reader cho session/data đã tạo.
- Data: review schema gap rồi mới migration versioned; giữ nguyên child/account ID, observation history, unsynced outbox và immutable content versions. Không reset database để đổi giao diện.
- Content: version mới áp dụng cho session mới; session đang dở giữ generation cũ tới khi kết thúc hoặc được parent xử lý an toàn.
- Documentation: cập nhật IA/wireframes tại P1; curriculum/activity/media/progress spec sở hữu hành vi; contract/data/architecture spec chỉ đổi khi có delta thực sự. README/changelog index kế hoạch và task. ADR chỉ cần nếu thực sự đổi architecture/trade-off, không tạo ADR chọn stack mới cho một tab.
- Implementation update: owner yêu cầu triển khai FE/BE và chọn dùng nội dung mẫu. C29–C35 đã thêm tab/hub/API/checkpoint, 14 bài phủ 10 activity type, media gia đình và lịch sử phân trang. [C32](./tasks/C32-practice-verification-and-remaining-coverage.md) ghi evidence thực chạy và gate production/device; không dùng sample implementation để tự đóng các TBD hoặc phê duyệt Store Release.

Các quyết định còn mở giữ tại nơi sở hữu: `PRD-TBD-01` (rules/ngưỡng), `PRD-TBD-02`/`CUR-TBD-01` (coverage/corpus), `PRD-TBD-03` (session tuning), `CUR-TBD-03` (accent), `CUR-TBD-04`/`PB-TBD-06` (content review), cùng các TA/media TBD liên quan. Phần lập kế hoạch/UI có thể tiến hành với trạng thái pending; không tự điền các giá trị này để mở production.

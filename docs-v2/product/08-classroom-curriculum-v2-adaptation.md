# Điều chỉnh mô phỏng giáo trình lớp học cho KidEDU v2

> Historical proposal/baseline: các mô tả navigation, game/review/reward/free/AI trái PRD C50 đã superseded ngày 2026-11-05. Target thực thi là C50; phần dưới không cấp scope riêng hoặc giữ AI post-release.

Owner implementation C49: sau m?i tr?, b? ch?n **M?nh gh?p** ho?c **Sticker**, ch?m m? **m?t h?p qu?**, nh?n random trong lo?i ?? ch?n r?i t? sang tr?/b?i. B? th? nghi?m g?m 18 sticker thu?c ??ng v?t/Si?u nh?n/C?ng ch?a v? hai tranh ? b?n m?nh. ?u ti?n m?n ch?a c?; kh?ng ?o?n hay kh?a ch? ?? theo gi?i t?nh. H?t m?nh m?i th? l?a ch?n m?nh gh?p b? kh?a. Cu?i b?i c? chu?ng nh? theo c?i ??t ?m hi?u. Xem [C49](../delivery/tasks/C49-reward-choice-and-completion-chime.md); ti?ng ??c t?, preset s? th?ch v? ch?i gh?p l?i trong album v?n thu?c C48.

## Owner clarification 2026-11-04 — ưu tiên cho phạm vi trò chơi

C43 lưu phần đang làm trong từng trò để pause/mở lại không bắt trẻ ghép/tìm lại từ đầu; ảnh lỗi có hình tĩnh và parent retry. Các mô tả trước C43 chỉ lưu trò hoàn tất được thay bởi [C43](../delivery/tasks/C43-game-progress-recovery-and-renderers.md).

Visual correction C41: phần bé chơi chủ yếu là hình, không chữ trên ô/nút chọn. Memory sai tự úp; tìm hình có hình mẫu; ghép là kéo trực tiếp vào các bóng khuyết. Quà là hộp để chọn và nhận sticker vào album theo bé, giữ qua phiên. Xem [C41](../delivery/tasks/C41-picture-first-games-and-sticker-album.md); phần chương vẫn là kế hoạch tiếp theo.

Theo `PB-PLAY-01`/`PRD-ACT-012`, đây là trò chơi trẻ trực tiếp thao tác, không chỉ hướng dẫn parent. Một bài có bộ từ (ví dụ 5 từ hôm nay), luyện lại qua nhiều trò như lật thẻ tìm cặp, chọn hình và kéo thả. App kiểm tra đáp án game, cho phản hồi đúng/thử lại, sticker theo trò, hộp quà cuối bài và hành trình thành tích. Parent nhận xét từng bài sau khi kết thúc toàn phiên, riêng với thành tích game.

Clarification này thay các đề xuất trước đây loại bỏ thưởng hoặc chỉ phản hồi trung tính đối với bộ trò mới; không cho phép suy diễn năng lực ngôn ngữ từ thao tác. [C40](../delivery/tasks/C40-lesson-vocabulary-games.md) chứa plan và phần đã triển khai; chương/album xuyên phiên vẫn là đợt tiếp theo.

| Thuộc tính | Giá trị                                                                                                                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trạng thái | `In review` — đề xuất điều chỉnh tài liệu, chưa là lệnh triển khai                                                                                                                                                                                                                                        |
| Owner      | Product + Content                                                                                                                                                                                                                                                                                         |
| Cập nhật   | 2026-11-05                                                                                                                                                                                                                                                                                                |
| Implements | `PRD-PLAN-001..005`, `PRD-CONT-002..006`, `PRD-ACT-001..011`, `PRD-BR-002..008`, `TA-ADR-004..006`                                                                                                                                                                                                        |
| Đầu vào    | Bản mô phỏng DSG-002 do owner cung cấp trong hội thoại; chỉ dùng mô tả phương pháp không định danh                                                                                                                                                                                                        |
| Depends on | [Product Brief](../01-product-brief-sot.md), [PRD](../02-product-requirements-sot.md), [Technical Architecture](../03-technical-architecture-sot.md), [Curriculum](./01-curriculum-learning-plan-spec.md), [Activities](./02-learning-activity-spec.md), [Observation](./04-progress-observation-spec.md) |

## 1. Mục đích và giới hạn

Chuyển nhịp tổ chức học trên lớp thành buổi luyện ngôn ngữ/giao tiếp tại nhà: app chuẩn bị và làm mẫu, phụ huynh tạo cơ hội, trẻ phản hồi, phụ huynh ghi nhận, app đề nghị lần luyện tiếp theo.

Giữ giá trị của bản mô phỏng: lặp lại có mục đích, giảm trợ giúp, đổi ngữ cảnh và tương tác có kết quả tự nhiên. Điều chỉnh những giả định khác SOT v2 theo bảng dưới. Các quyết định duyệt trong bản nguồn không tự chuyển thành phê duyệt cho v2.

Tài liệu này giải thích cách áp dụng các spec sở hữu hành vi; không thay ba SOT, không mở rộng Store Release v1.0 sang giáo dục tổng hợp và không thay taxonomy đã được owner xác nhận ngày 2026-09-29.

## 2. Đối chiếu bản mô phỏng với v2

| Bản mô phỏng lớp học                            | Điều chỉnh cho v2                                                                                                                 | Nơi sở hữu                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Bảy lĩnh vực can thiệp là trục chính            | Dùng nhóm năng lực ngôn ngữ/giao tiếp trong curriculum v1; hoạt động hỗ trợ chỉ dùng khi phục vụ goal cụ thể và có review phù hợp | Curriculum §2; `PB-PILLAR-02`      |
| Một nội dung lớp học có đúng một bản trên app   | Tách thành goal, target và activity tái sử dụng; có thể bỏ phần không phù hợp môi trường số                                       | `PRD-CONT-002..003`                |
| Tháng T5–T10 quy thành 4–6 bậc cố định          | Không suy từ tháng hoặc tuổi thành cấp độ; dùng prerequisite và observation riêng từng goal                                       | `PRD-BR-002`; `PRD-PLAN-001..003`  |
| Mọi nội dung bắt buộc đủ bốn giai đoạn          | Chọn điểm vào theo mục tiêu: nhận biết có thể cần mẫu trước, gọi tên cần cơ hội tự nói trước mẫu                                  | Activities §5–9                    |
| Mọi bài đủ Hiểu–Làm–Nói                         | Mỗi activity có expected response riêng; các năng lực không suy ra thay nhau                                                      | `PRD-BR-006`; Observation §1–4     |
| App chấm thao tác rồi quy thành năng lực        | Thao tác là dữ liệu tương tác; phụ huynh xác nhận observation, kể cả khi chính phụ huynh bấm hộ                                   | `PRD-BR-006`                       |
| Đồ thật được thay tối đa bằng kéo thả           | Màn hình làm mẫu/diễn tập; mục tiêu cần đồ/người thật có hướng dẫn parent-guided trong lesson                                     | `PRD-ACT-008..010`                 |
| Đạt 4/5 lượt, hai buổi; 80% nội dung để lên bậc | Không áp dụng các ngưỡng nguồn; ngưỡng recommendation/mastery vẫn thuộc `PRD-TBD-01`                                              | Curriculum §8; Observation §7      |
| Buổi 12–15 phút, 3–4 nội dung từ nhiều lĩnh vực | Lesson ngắn với một primary goal, tối đa một supporting goal; thời lượng/số lượt qua usability tuning                             | Curriculum §3, §7; `PRD-SES-002`   |
| Tự chơi vẫn lấy được dấu Hiểu                   | Không có người quan sát thì giữ completion riêng, observation là `not_observed`                                                   | Observation §4                     |
| Sticker, hộp bất ngờ, mở cảnh theo thành tích   | Owner đã yêu cầu: thưởng cho thành tích game, tách khỏi observation ngôn ngữ; triển khai phân kỳ tại C40                          | `PRD-ACT-012`, `PB-PLAY-01`        |
| Gói cơ bản không bao giờ khóa; chơi offline     | Theo subscription/trial và activation v2; lesson đã Ready chạy local, dữ liệu gia đình có quyền riêng                             | `PB-BIZ-01..04`; `PRD-BR-007..008` |
| Micro đo hơi, camera nhận khẩu hình             | Không đưa thành capability/release gate v1; camera/micro cho family-media capture không mặc nhiên cho phép chấm trẻ               | `PRD-BR-006`; `PRD-MEDIA-002`      |

Hệ thống thưởng và bộ trò dùng chung từ đã được owner yêu cầu, ghi nhận tại `PRD-ACT-012`. Bảy lĩnh vực độc lập, bậc năng lực cố định và tự chấm năng lực vẫn cần quyết định riêng tại SOT.

## 3. Mô hình nội dung và cách phụ huynh sử dụng

Giữ hierarchy tại Curriculum §3: `SkillDomain → Goal → Target/ActivityInstance → Lesson → PlanItem của child`. Chủ đề như gia đình, đồ ăn, động vật là ngữ cảnh nội dung, không thay trục năng lực.

Ví dụ cùng target “nước” có thể dùng để nhận biết, gọi tên, hoàn thành “Con muốn…”, luyện câu yêu cầu và dùng với cốc nước thật. Chọn đúng ảnh nước không chứng minh trẻ đã tự yêu cầu nước.

Phụ huynh bắt đầu từ kế hoạch hôm nay và lý do chọn bài. Họ có thể hoãn/thay bài hoặc điều chỉnh goal theo `PRD-PLAN-004`; không phải tự chọn hàng chục bài theo lĩnh vực. Một trẻ có thể luyện nghe hiểu và giao tiếp chức năng song song mà không cần vượt hết một thang chung.

Family media dùng đúng target/activity/role theo [Parent & Family Media](./03-parent-family-media-spec.md): ảnh cốc quen thuộc cho nghĩa, audio người thân cho mẫu, video khẩu hình cho variant phù hợp. Không yêu cầu mọi target có đủ tranh, ảnh và mô hình 3D mới được dùng.

## 4. Chuyển các lĩnh vực lớp học thành hoạt động phù hợp

Owner clarification implemented by [C38](../delivery/tasks/C38-authored-play-presentations.md)/[C39](../delivery/tasks/C39-diverse-play-interactions.md): đa dạng phải nằm ở **cách chơi và cơ hội phản hồi**, không chỉ tên bài hoặc danh sách phiên. Bộ mẫu bổ sung ghép đôi đồ chơi, giỏ đồ ăn/đồ chơi, thức ăn/nơi ở con vật, công dụng đồ vật, trước–sau, ghép mảnh lời, mở ô tìm đồ, chào/gọi/rủ chơi/chia lượt/sở hữu. Đây là presentation variants trong activity hợp lệ, có lời mời/rubric/transfer; không phải 13 activity type mới. Phụ huynh chọn các bài cho phiên, trẻ chơi liên tiếp, rồi phụ huynh mới nhận xét từng bài ở cuối.

| Nhóm trong giáo trình           | Cách dùng trong v2                                                                               | Không suy luận từ màn hình                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Nhận thức, nhận biết, phân loại | Chỉ/chọn/ghép cặp để nghe hiểu; chức năng đồ vật và hành động để hỏi đáp trực quan               | Ghép đúng không tự chứng minh gọi tên hoặc nói câu                     |
| Ngôn ngữ–giao tiếp              | Ánh xạ trực tiếp sang các activity `PRD-ACT-001..010`; tái dùng target qua nhiều mục tiêu        | Nghe mẫu rồi nhắc không tương đương chủ động dùng lời                  |
| Bắt chước                       | Bắt chước âm/từ/cụm phù hợp; chuỗi hành động thật chỉ làm ngữ cảnh cho hiểu yêu cầu/giao tiếp    | Chạm chuỗi thẻ không chứng minh cơ thể đã làm đúng                     |
| Vận động tinh                   | Cốc, hộp, khối lớn có thể là đạo cụ cho “đưa”, “vào”, “nữa”, “giúp con” trong bài đã review      | Kéo thả không đo lực tay, cầm bút hoặc khả năng xúc thìa               |
| Xã hội/hành vi                  | Chào, rủ chơi, lựa chọn, từ chối, chờ lượt trong giao tiếp với người thật                        | Không xếp hạng tuân thủ hoặc dùng thời gian nhìn mắt làm điểm năng lực |
| Luyện hơi/cơ quan cấu âm        | Khẩu hình gắn âm/từ đã review theo `PRD-ACT-001`; không mặc định thêm giáo trình luyện hơi riêng | Âm lượng micro và nhận diện mặt không là observation                   |
| Thơ, đồng dao                   | Đoạn có quyền sử dụng, điểm dừng và accepted variants được author cho vuốt đuôi                  | Chọn đúng tranh không chứng minh đọc thuộc bài                         |

Các cơ chế chạm, ghép hoặc kéo thả chỉ là cách trình bày bên trong activity tương thích. Bản nguồn có 12 cơ chế không đồng nghĩa cần 12 activity type mới. Không thêm tracing, đa chạm, physics, trò thổi hay nhận mặt chỉ để phủ đủ giáo trình.

## 5. Nhịp một bài học

1. **Chuẩn bị ở khu phụ huynh:** cho biết mục tiêu, đồ cần có, media đã chọn và cách ghi nhận. Lesson chỉ mở sau readiness/activation gate hiện có.
2. **Tạo cơ hội:** stimulus rõ, ít nhiễu. Gọi tên/yêu cầu có khoảng chờ trước mẫu; bài học mẫu phát mẫu theo kịch bản đã author.
3. **Hỗ trợ nếu cần:** phụ huynh dùng prompt hợp lệ từ ít đến nhiều theo activity; những lần luyện tiếp có thể giảm hỗ trợ theo observation. Không phát mẫu lại sau mọi lỗi một cách máy móc.
4. **Thử phản hồi:** trẻ chỉ/chọn/nói/làm thật tùy mục tiêu. Không bắt mọi hoạt động đều có cả ba phần Hiểu–Làm–Nói.
5. **Ghi nhận ngắn:** phụ huynh chọn kết quả và mức prompt; app lưu checkpoint, observation và outbox theo spec hiện có.
6. **Đổi ngữ cảnh hoặc chuyển ra sinh hoạt:** dùng vật/người/ảnh quen thuộc khác theo nội dung đã author. Có lựa chọn để lúc khác; không bắt phải đạt điểm trên app mới được thử với đồ thật.
7. **Kết thúc:** tóm tắt goal đã luyện, observation còn thiếu và một gợi ý lần sau. Không tự nối bài vô hạn.

Chu trình “làm mẫu → có hỗ trợ → độc lập → khái quát” là nguyên tắc thiết kế cơ hội học qua nhiều lượt/buổi, không phải bốn màn bắt buộc mọi lần mở target.

## 6. Ví dụ: từ nhận biết nước đến yêu cầu nước

Đây là các lesson minh họa cho các goal khác nhau, không bắt ghép tất cả thành một buổi hoặc ép mọi trẻ đi tuần tự.

| Goal của lesson     | Trong app                                                 | Với phụ huynh/đồ thật                                                 | Điều ghi nhận                                           |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- |
| Hiểu từ “nước”      | Nghe yêu cầu và chọn trong tập hình ít lựa chọn đã author | Đặt cốc nước cùng vật khác, mời trẻ chỉ/lấy                           | Phản hồi theo yêu cầu; ai thao tác và có nhắc lại không |
| Gọi tên             | Hiện ảnh cốc quen thuộc, chờ trước khi đưa mẫu            | Hỏi về cốc trước mặt theo instruction                                 | Trẻ tự gọi tên hay chỉ nhắc sau mẫu                     |
| Hoàn thành cụm/câu  | Audio “Con muốn…” dừng ở marker đã author                 | Người lớn chờ trẻ hoàn thành theo rubric                              | Phần trẻ thực sự nói và mức gợi ý                       |
| Dùng lời để yêu cầu | App hướng dẫn tạo lựa chọn phù hợp nhu cầu thực           | Phụ huynh đưa lựa chọn; đáp ứng khi trẻ giao tiếp, hỗ trợ theo rubric | Có chủ động yêu cầu hay cần cue/model                   |
| Khái quát hóa       | Nhắc đổi một yếu tố theo hướng dẫn                        | Đổi cốc, người tương tác hoặc tình huống quen thuộc                   | Observation `parent_guided`, tách với kết quả `in_app`  |

Với câu hỏi “Con có muốn uống nước không?”, phản hồi Có/Không phản ánh nhu cầu trẻ; không có đáp án chuẩn do app áp đặt. Hướng dẫn tạo cơ hội giao tiếp không yêu cầu giữ lại nhu cầu thiết yếu để buộc trẻ nói.

## 7. Ghi nhận và đề nghị bài tiếp theo

Áp dụng nguyên nghĩa bốn giá trị tại Observation §2: `independent`, `supported`, `not_yet`, `not_observed`. Parent ghi theo rubric của goal và prompt đã dùng; skip/gián đoạn không chuyển thành thất bại.

App có thể biết stimulus nào đã phát, option nào được bấm và prompt nào đã mở. Những dữ liệu này không tự thay kết quả quan sát hoặc suy ra người bấm là trẻ.

Đề nghị tiếp theo dùng rule tại Curriculum §8: ôn prerequisite, giảm prompt, đổi stimulus, thử goal liên quan hoặc ưu tiên transfer khi kết quả trong app và đời thật khác nhau. Parent thấy lý do và có quyền hoãn. Không tự áp dụng lịch ôn 3 ngày/1 tuần/1 tháng, ngưỡng 4/5 hoặc 80% từ bản nguồn.

Progress giữ lịch sử từng observation và phân biệt context; không đổi một dấu tổng duy nhất rồi xóa dấu cũ. Một lần hôm nay chưa làm được không tự biến thành kết luận “mất kỹ năng”.

## 8. Runtime và quyền truy cập

Tuân `PRD-BR-008`, `PRD-SES-001..005` và `TA-ADR-004..006`: chuẩn bị đủ dữ liệu/media local trước học, session giữ content version, không tải hoặc gọi AI/API để quyết định từng lượt.

Mobile chạy plan rules deterministic và lưu local state; backend xác thực identity, quyền, content publish và trạng thái đã sync. Không thêm endpoint xác nhận lên bậc theo mô hình bản nguồn. Cold start và hết activation tuân Technical Architecture, không quảng bá offline mode.

Subscription/trial theo [Subscription & Access](./05-subscription-access-spec.md). Family media và quyền xem/xuất/xóa dữ liệu gia đình tách khỏi quyền mở premium lesson; thêm ảnh gia đình không làm bypass entitlement của lesson.

Không provision AI Custom Library, queue/provider mới, microservice hoặc engine game mới cho đề xuất này.

## 9. Acceptance để review nội dung và chuẩn bị task

- Mỗi lesson truy được primary goal, prerequisite, target, expected response, prompt, required asset, rubric và transfer phù hợp.
- Gọi tên có cơ hội trước mẫu; hoạt động làm mẫu vẫn có thời gian trẻ phản hồi.
- Chọn đúng trên màn hình không tự tạo observation `independent` hoặc mở bậc.
- Mệnh lệnh/hành động thật dùng parent-guided flow; không thay bằng kết quả kéo thả để kết luận cùng năng lực.
- Family override đúng role có fallback; thiếu mouth video không chặn activity không cần nó.
- Skip/thiếu người quan sát giữ `not_observed`; Child Mode không thấy dấu trừ/điểm phán xét.
- Recommendation có lý do, parent hoãn được; không hard-code ngưỡng mastery còn TBD.
- Bài đã Ready không phụ thuộc mạng trong activity loop; expiry/account switch vẫn áp dụng guard hiện có.

Đây là checklist review, chưa phải kết quả test implementation. Khi triển khai, tách task theo boundary: content mapping/fixture, activity flow, observation/recommendation, family-media binding. Mỗi task cần ID requirement, dependency, acceptance, tests và rollback riêng; không gom schema/backend/toàn bộ activity vào một task.

## 10. Migration, rollback và tác động tài liệu

Parent session editing (C37): trước khi bắt đầu, phụ huynh chọn tập bài và thứ tự cho phiên, có thể thêm/bỏ hoặc đưa bài lên/xuống. Danh sách được lưu rõ ràng thay vì chỉ ưu tiên bài đầu; chọn rỗng phải giữ rỗng. Phiên đang dở giữ snapshot; màn chuẩn bị giải thích nếu danh sách đã lưu khác kế hoạch vừa chỉnh. [C37](../delivery/tasks/C37-edit-session-lessons.md) sở hữu acceptance/contract delta.

Owner đã chốt lại đơn vị phiên: **học hết các bài trong một phiên rồi phụ huynh mới nhận xét lần lượt từng bài**. Một bài không còn tương ứng một phiên riêng; mục tiêu/chọn bài dùng để ưu tiên thứ tự, không thay cả phiên bằng một bài. Bộ mẫu mặc định gồm toàn bộ bài đang có, trừ bài phụ huynh chủ động hoãn. Chuẩn bị hiển thị danh sách/thứ tự bài; trong phần học chỉ chuyển bài hoặc bỏ qua. Form nhận xét chỉ xuất hiện khi kết thúc phần học. Xem [C36](../delivery/tasks/C36-multi-lesson-session-end-review.md) cho checkpoint/review cursor và bằng chứng triển khai.

Owner yêu cầu triển khai trực tiếp ngày 2026-11-03. Phạm vi code, acceptance và bằng chứng được tách tại [C26 — Catalog theo goal](../delivery/tasks/C26-goal-based-guided-lessons.md), [C27 — Guidance/observation](../delivery/tasks/C27-authored-guidance-observation.md), [C28 — Gợi ý luyện tiếp](../delivery/tasks/C28-observation-practice-guidance.md). Đây chưa phải triển khai toàn bộ corpus/media/production readiness của tài liệu.

Riêng tài liệu này bổ sung hướng dẫn đối chiếu; migration/rollback của code được ghi tại từng task C26–C28. Không sửa `docs/` legacy và không migrate dấu/bậc của bản nguồn sang observation v2.

Rollback tài liệu: bỏ file này cùng mục liên kết README và ghi chú changelog tương ứng. Không cần ADR mới vì không thay architecture; mọi mong muốn giữ lại phần xung đột tại §2 cần quyết định owner/SOT riêng.

Các mục còn mở được giữ tại nơi sở hữu: `PRD-TBD-01` cho ngưỡng tiến bộ, `CUR-TBD-01` cho corpus tối thiểu, `CUR-TBD-03` cho accent policy, `CUR-TBD-04` cho content approval và các TBD usability/media liên quan. Bản đề xuất không tự đóng chúng.

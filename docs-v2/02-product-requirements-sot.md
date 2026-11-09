# KidEDU — Product Requirements Document SOT

| Thuộc tính         | Giá trị                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| Tài liệu           | Product Requirements Document — Source of Truth                        |
| Mã tài liệu        | `SOT-PRD-02`                                                           |
| Trạng thái         | `In review`                                                            |
| Product owner      | Chủ dự án KidEDU                                                       |
| Cập nhật           | 2026-11-05                                                             |
| Phạm vi            | Store Release v1.0                                                     |
| Dẫn xuất từ        | [01-product-brief-sot.md](./01-product-brief-sot.md)                   |
| Được hiện thực bởi | [03-technical-architecture-sot.md](./03-technical-architecture-sot.md) |

## 1. Vai trò và quy tắc sử dụng

PRD là Source of Truth cho câu hỏi **KidEDU phải làm gì và hành vi nào được xem là đúng**. Product Brief sở hữu định vị và mục tiêu; Technical Architecture sở hữu cách hệ thống đáp ứng các requirement tại đây.

Mỗi requirement có ID ổn định. Feature spec, UX flow, API contract, data model, test plan và task implementation phải tham chiếu ID thay vì định nghĩa lại requirement. `Must` thuộc Store Release v1.0; `Post-release` không được lén đưa vào scope v1.

## 2. Mục tiêu release

Store Release v1.0 phải cho phép một phụ huynh:

1. tạo tài khoản và hồ sơ trẻ;
2. xác định nhóm kỹ năng và mục tiêu muốn luyện mà không bị app chẩn đoán;
3. nhận một learning plan tiếng Việt có thứ tự;
4. tải đủ nội dung cho các bài sắp học;
5. luyện cùng trẻ bằng nhiều loại activity từ từ đơn đến giao tiếp trong ngữ cảnh;
6. dùng media gia đình để cá nhân hóa target phù hợp;
7. ghi nhận mức độc lập/hỗ trợ sau hoạt động;
8. xem xu hướng và biết bước tiếp theo;
9. dùng trial, mua subscription và được áp dụng quyền truy cập đúng trạng thái;
10. quản lý, xuất và xóa dữ liệu của gia đình.

## 3. Vai trò người dùng

| Role             | Quyền chính                                                                        | Giới hạn                                                                           |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Parent/Guardian  | Account, hồ sơ trẻ, plan, lesson, observation, media, subscription và data control | Phải qua Parent Gate cho thao tác nhạy cảm                                         |
| Child            | Thực hiện learning activity và điều khiển tối thiểu                                | Không mua hàng, xóa/sửa dữ liệu, mở link ngoài hoặc vào cài đặt                    |
| Content editor   | Soạn target, activity, lesson pack và media chuẩn trong hệ thống nội bộ            | Không truy cập family media/progress nếu không có nhu cầu công việc được cấp quyền |
| Support operator | Hỗ trợ account/subscription theo quyền tối thiểu                                   | Không mặc định xem dữ liệu nhạy cảm của trẻ                                        |

Portal chuyên gia/giáo viên không thuộc v1.

## 4. Thuật ngữ nghiệp vụ

| Thuật ngữ         | Định nghĩa                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Skill domain      | Nhóm năng lực như nghe hiểu, diễn đạt, hỏi đáp hoặc giao tiếp chức năng                                   |
| Goal              | Kết quả cụ thể đang muốn hình thành, ví dụ dùng mẫu `Muốn + đồ vật`                                       |
| Target            | Đơn vị ngôn ngữ/ngữ nghĩa có thể dùng trong nhiều activity, ví dụ `uống`, `quả táo`, `Con muốn uống nước` |
| Activity type     | Cơ chế luyện một năng lực: nhận biết, gọi tên, nói theo, vuốt đuôi, Có/Không...                           |
| Activity instance | Một activity type áp dụng cho target/ngữ cảnh cụ thể                                                      |
| Lesson            | Một phiên bản nội dung ngắn có mục tiêu, activity và hướng dẫn phụ huynh xác định                         |
| Learning plan     | Chuỗi goal/lesson đang active cho một trẻ                                                                 |
| Prompt            | Trợ giúp bằng hình, âm, chữ, khẩu hình, lựa chọn hoặc lời nhắc của người lớn                              |
| Observation       | Đánh giá do phụ huynh ghi cho một lần thực hiện: `+`, `+/-`, `-`                                          |
| Lesson pack       | Gói dữ liệu phiên bản hóa đủ để chạy một hoặc nhiều lesson ở local                                        |
| Family media      | Ảnh/audio/video do phụ huynh tạo hoặc chọn cho gia đình mình                                              |
| Entitlement       | Quyền sử dụng capability/nội dung tại một thời điểm                                                       |

## 5. Product-wide business rules

### `PRD-BR-001` — Không chẩn đoán

App không được kết luận trẻ chậm nói ở mức nào, mắc rối loạn gì hoặc cần phác đồ điều trị nào. Onboarding chỉ hỏi điều phụ huynh quan sát và mục tiêu họ muốn hỗ trợ.

**Acceptance:** không có output nào dùng wording chẩn đoán; các màn liên quan hiển thị disclaimer dễ hiểu và hướng dẫn tìm chuyên gia nếu phụ huynh lo ngại.

### `PRD-BR-002` — Progress không tuyến tính cứng

Progression trong Product Brief là bản đồ năng lực. Plan được phép lặp lại, lùi hoặc luyện song song goal; tuổi không tự động khóa/mở nội dung.

### `PRD-BR-003` — Prompt fading

Activity hỗ trợ prompt phải cho phép đi từ trợ giúp nhiều đến ít. Hệ thống không tính một lần có hỗ trợ là thành thạo độc lập.

### `PRD-BR-004` — Readiness theo activity

Một target chỉ được dùng trong activity khi đủ asset/data bắt buộc của activity đó. Thiếu video khẩu hình không được khóa target khỏi activity không cần video.

### `PRD-BR-005` — Human-reviewed default content

Nội dung mặc định phải có provenance và trạng thái review theo đúng modality. Asset AI-generated/TTS chưa review, audio tiếng Việt sai hoặc video khẩu hình bị đánh giá sai không được publish làm default. Công cụ sinh asset không được tự publish thẳng vào content release.

### `PRD-BR-006` — Parent owns the observation

Trong v1, app có thể nhắc phụ huynh ghi nhận nhưng không tự khẳng định trẻ thực hiện đúng/sai qua microphone hoặc camera.

### `PRD-BR-007` — Dữ liệu premium và dữ liệu gia đình tách quyền

Hết entitlement phải khóa premium learning content; không được khóa quyền xem/xuất/xóa dữ liệu và media do gia đình tạo.

### `PRD-BR-008` — Không API trong vòng lặp học

Sau khi lesson báo `Ready`, toàn bộ activity của lesson phải chạy từ local runtime. Mạng mất giữa phiên không làm trẻ bị kẹt; event được xếp hàng để sync sau.

## 6. Account, consent và hồ sơ trẻ

### `PRD-ACC-001` — Parent account (`Must`)

App yêu cầu phụ huynh đăng nhập trước khi kích hoạt learning content. Phương thức đăng nhập cụ thể do architecture/detail spec chốt, nhưng phải hỗ trợ khôi phục phiên an toàn và đăng xuất mọi thiết bị khi cần.

### `PRD-ACC-002` — Consent (`Must`)

Trước khi tạo hồ sơ trẻ hoặc upload family media, phụ huynh phải xác nhận họ là người có thẩm quyền và đồng ý chính sách dữ liệu tương ứng. Consent phải được version hóa và có thể thu hồi.

### `PRD-ACC-003` — Child profile (`Must`)

Phụ huynh tạo, sửa và xóa hồ sơ trẻ gồm tên gọi trong app, năm/tháng sinh ở mức cần thiết, mục tiêu và thiết lập trải nghiệm. Theo C50-D05, khi nhập tên con phụ huynh nhập thêm giới tính phục vụ reward group; không suy diễn từ tên. Hồ sơ cũ thiếu field không tự backfill, giữ inventory cũ và yêu cầu parent bổ sung trước nhận quà mới. Policy sửa giới tính đã nhập còn tại C50-D05. Không bắt buộc nhập họ tên pháp lý, chẩn đoán hoặc hồ sơ y tế.

### `PRD-ACC-004` — Parent Gate (`Must`)

Mua hàng, account, media management, xóa dữ liệu, link ngoài và thay đổi plan phải nằm sau Parent Gate phù hợp chính sách nền tảng. Thoát/khóa app không được coi là logout.

### `PRD-ACC-005` — Account switch (`Must`)

Khi đổi account, app phải đóng learning session, xóa key/quyền runtime của account cũ và không hiển thị lẫn profile, progress hoặc family media.

## 7. Onboarding và learning plan

### `PRD-PLAN-001` — Goal discovery (`Must`)

Onboarding hỏi bằng ngôn ngữ quan sát được, ví dụ trẻ có chỉ/lấy theo yêu cầu, gọi tên, ghép hai từ hay chủ động yêu cầu. Không dùng câu hỏi để trả về chẩn đoán.

### `PRD-PLAN-002` — Initial plan (`Must`)

Sau onboarding, app tạo initial plan có goal hiện tại, lesson đầu tiên và giải thích ngắn cho phụ huynh. Không yêu cầu tải toàn bộ thư viện để bắt đầu.

### `PRD-PLAN-003` — Plan progression (`Must`)

Plan đề xuất ôn, tiếp tục hoặc mở activity tiếp theo dựa trên observation theo activity, tần suất và recency. Quy tắc phải deterministic/explainable ở v1; không cần mô hình AI.

### `PRD-PLAN-004` — Parent control (`Must`)

Phụ huynh có thể hoãn, thay thế, thêm vào mục ôn hoặc báo lesson chưa phù hợp. App phải cảnh báo khi bỏ qua prerequisite quan trọng nhưng không tự nhận đó là quyết định chuyên môn.

### `PRD-PLAN-005` — Daily plan (`Must`)

Màn kế hoạch hiển thị một khối lượng ngắn, có thể hoàn thành, gồm bài trong app và ít nhất một gợi ý áp dụng ngoài màn hình khi phù hợp.

## 8. Content library và curriculum model

### `PRD-CONT-001` — Native Vietnamese content (`Must`)

Target, câu mẫu, instruction, transcript và audio phải được soạn cho tiếng Việt tự nhiên, có metadata về vùng giọng nếu cần và không phụ thuộc bản dịch máy. Canonical audio phải được người Việt review thanh điệu, âm đầu/cuối, nhịp và ngữ cảnh; TTS chỉ là nguồn candidate cho đến khi qua cùng quality gate.

### `PRD-CONT-002` — Target taxonomy (`Must`)

Kho target phải phân loại tối thiểu theo skill domain, chủ đề, loại từ/câu, độ phức tạp, prerequisite, activity readiness và content version.

### `PRD-CONT-003` — Context expansion (`Must`)

Một từ đã học phải có khả năng tái sử dụng trong cụm/câu và ngữ cảnh. Ví dụ target `uống` có thể dẫn đến `uống nước`, `Con muốn uống nước` và câu hỏi `Con đang làm gì?`.

### `PRD-CONT-004` — Publish workflow (`Must`)

Nội dung có vòng đời `draft → in_review → approved → published → retired`. Chỉ bản `published` tương thích mới đi vào lesson pack production; retire không được làm hỏng lịch sử progress.

### `PRD-CONT-005` — Content provenance (`Must`)

Mỗi default asset phải biết nguồn, license/quyền sử dụng, người hoặc quy trình tạo, tool/provider/model/version nếu được sinh bằng AI, recipe/prompt reference phù hợp, content hash và trạng thái review. Không đưa DOCX giáo trình chứa PII hoặc prompt/provenance chứa dữ liệu nhận dạng vào content package.

### `PRD-CONT-006` — Media role and modality QA (`Must`)

Mỗi default video, audio, animation hoặc ảnh phải khai báo semantic role, target/activity binding, required/optional, format profile, accessibility/fallback và review status. Video khẩu hình phải pass phát âm/lip-sync QA; audio phải pass linguistic/listening QA; animation phải có reduce-motion/static fallback và không che hoặc cạnh tranh với stimulus ngôn ngữ.

**Acceptance:** pack builder từ chối asset required thiếu provenance, rights, hash, format profile hoặc approval; activity vẫn chạy bằng authored fallback khi asset optional không có.

## 9. Learning activities v1

Các activity Tập nói có goal, instruction, stimulus, prompt strategy, khoảng chờ và observation theo rubric. Phụ huynh nhận xét từng bài sau toàn phiên, không chen giữa bài. Game session là luồng riêng theo `PRD-GAME-*` và không có observation; xem `PRD-PROG-005`.

### `PRD-ACT-001` — Học từ và khẩu hình (`Must`)

Trẻ xem hình/animation ngữ nghĩa, nghe mẫu và xem video khẩu hình khi asset đạt chuẩn. Phụ huynh có thể replay, giảm tốc trong giới hạn không làm méo âm và thay bằng family media.

### `PRD-ACT-002` — Nghe hiểu và nhận biết (`Must`)

App đưa yêu cầu như chỉ/chọn/lấy/đưa trong tập lựa chọn trực quan. Prompt phải giảm dần; vị trí đáp án được xáo trộn hợp lý để tránh học thuộc vị trí.

### `PRD-ACT-003` — Gọi tên và nói theo (`Must`)

App tạo cơ hội trẻ gọi tên trước, sau khoảng chờ mới đưa mẫu/gợi ý. Không phát mẫu ngay lập tức trong mọi lượt vì sẽ biến activity thành nói leo.

### `PRD-ACT-004` — Vuốt đuôi (`Must`)

App phát câu, bài thơ hoặc ngữ cảnh quen thuộc rồi dừng có chủ đích để trẻ hoàn thành một từ; sau đó có thể nâng lên hai từ. Điểm dừng, đáp án chấp nhận, audio segment và prompt phải được author trước; runtime không tự cắt waveform tùy tiện.

### `PRD-ACT-005` — Cụm và câu chức năng (`Must`)

Hỗ trợ mẫu tăng dần như `Muốn + đồ vật`, gọi người + hành động, chủ thể + hành động và câu ngắn dùng trong sinh hoạt. Câu phải gắn với nhu cầu/ngữ cảnh, không chỉ ghép từ vô nghĩa.

### `PRD-ACT-006` — Có/Không (`Must`)

Bao gồm câu hỏi về nhu cầu/bản thân và nhận biết thế giới xung quanh. Hệ thống phải tránh chuỗi đáp án một phía khiến trẻ học đoán.

### `PRD-ACT-007` — Hỏi đáp trực quan (`Must`)

Bao gồm `Đây là gì/con gì/quả gì/ai?`, `Cái gì dùng để...?` và `Ai đang làm gì?`, với câu trả lời từ cụm ngắn đến câu đầy đủ theo goal.

### `PRD-ACT-008` — Mệnh lệnh một/hai bước (`Must`)

App hướng dẫn phụ huynh chuẩn bị đồ vật hoặc dùng đối tượng trực quan để trẻ thực hiện đúng thứ tự. Observation phải phân biệt thực hiện độc lập và cần nhắc lại/làm mẫu.

### `PRD-ACT-009` — Giao tiếp chức năng (`Must`)

Tạo cơ hội yêu cầu, từ chối, lựa chọn, gọi người, chào, rủ chơi, chờ đến lượt hoặc diễn đạt sở hữu trong tình huống phù hợp.

### `PRD-ACT-010` — Parent-guided offline activity (`Must`)

Mỗi goal thích hợp có ít nhất một hướng dẫn ngắn để phụ huynh thực hiện ngoài màn hình bằng đồ vật/tình huống thật. `Offline activity` ở đây nghĩa là hoạt động rời màn hình, không phải app có chế độ offline.

### `PRD-ACT-011` — Auto Play có kiểm soát (`Must`)

App có thể tự chuyển qua một chuỗi stimulus ngắn, nhưng phải có khoảng chờ, pause/replay/stop và không thay thế activity cần tương tác của phụ huynh. Không thiết kế autoplay vô hạn.

## 10. Learning session

### `PRD-SES-001` — Ready gate (`Must`)

Chỉ cho bắt đầu khi lesson pack và toàn bộ asset bắt buộc đã `Ready`. Nếu thiếu asset tùy chọn, app dùng fallback đã author; không tải ngầm giữa activity.

### `PRD-SES-002` — Session length (`Must`)

Session được chia thành các đoạn ngắn; phụ huynh có thể dừng bất cứ lúc nào. Giới hạn cụ thể theo loại activity nằm trong feature spec và phải được usability test.

### `PRD-SES-003` — Checkpoint (`Must`)

Sau mỗi activity, app lưu checkpoint local. Nếu bị background hoặc process kill, lần mở sau có thể đề nghị tiếp tục từ checkpoint hợp lệ nhưng không tự phát media.

### `PRD-SES-004` — Background behavior (`Must`)

Media dừng an toàn khi app vào background. Quay lại app không reload lesson nếu process, data generation và activation còn hợp lệ.

### `PRD-SES-005` — Network interruption (`Must`)

Phiên đã `Ready` hoàn thành được khi mạng chập chờn. App ghi progress vào outbox và sync sau; không mô tả hành vi này như offline mode.

## 11. Family media và cá nhân hóa

### `PRD-MEDIA-001` — Supported overrides (`Must`)

Phụ huynh có thể thêm/thay ảnh, audio hoặc video cho target/activity hỗ trợ loại media đó, xem preview và quay về default.

### `PRD-MEDIA-002` — Capture/import (`Must`)

App hỗ trợ chọn từ thiết bị và quay/ghi trực tiếp nếu có quyền. Chỉ request camera/micro/photo permission tại thời điểm người dùng chủ động dùng tính năng.

### `PRD-MEDIA-003` — Validation (`Must`)

Media được kiểm tra định dạng, dung lượng/thời lượng, khả năng đọc và quota trước khi commit. File lỗi không được thay thế bản đang dùng.

### `PRD-MEDIA-004` — Ownership and privacy (`Must`)

Family media private theo family/account, không dùng huấn luyện AI, quảng cáo hoặc chia sẻ công khai nếu không có consent riêng. Parent có thể xem dung lượng, export và delete.

### `PRD-MEDIA-005` — Cloud behavior (`Must`)

Local media dùng được trên thiết bị tạo nó. Cloud backup/sync media chỉ hoạt động theo entitlement, consent và quota. Hết subscription không xóa local family media; cloud retention tuân chính sách đã công bố.

## 12. Bộ học tùy chỉnh thủ công/AI — v1

Owner phê duyệt 2026-11-05: nhóm `PRD-CUSTOM-*` thuộc Must v1 cho paid. Manual authoring và AI đều có parent preview/approval. Provider/dispatcher, quota và commercial policy phải qua gate C50 trước production; không tự provision theo thiết kế candidate.

### `PRD-CUSTOM-001` — Parent-authored scope (`Must`)

Trong Parent Mode, subscriber tạo bộ thủ công với nội dung/media của mình hoặc dùng AI hỗ trợ; draft có chủ đề, từ, cụm, câu/ngữ cảnh và activity mong muốn. Manual không gọi provider hoặc tiêu generation quota. AI có thể đề xuất mở rộng nhưng không tự thêm vào learning plan, không chẩn đoán và không biến input thành nội dung dùng chung cho gia đình khác.

### `PRD-CUSTOM-002` — Generated asset bundle (`Must`)

Server phải tìm/reuse target và asset mặc định đã duyệt khi semantic/locale/role khớp, rồi mới tạo phần còn thiếu hoặc ngữ cảnh riêng. Phần cần tạo gồm structured Vietnamese content, canonical audio candidate, semantic image và allowlisted motion recipe cho từng target phù hợp. Video khẩu hình không được AI-generate mặc định trong custom flow v1; parent có thể quay/import video riêng, còn target không có video dùng audio + ảnh/motion và chỉ tham gia activity đã đạt readiness.

### `PRD-CUSTOM-003` — Asynchronous generation lifecycle (`Must`)

Generation chạy bất đồng bộ trên server với trạng thái, progress và retry có thể phục hồi; app không phải mở liên tục. Client không gọi thẳng provider AI và không chứa provider API key. Khi app đang mở, trạng thái được polling có giới hạn; khi mở/foreground lại, bootstrap/delta lấy trạng thái mới mà không cần remote push.

### `PRD-CUSTOM-004` — Preview and approval (`Must`)

Trước khi publish private pack, parent phải preview từng target, nghe audio, xem ảnh/motion, sửa text, regenerate asset lỗi hoặc loại target. Server chạy schema, duplicate, Vietnamese text, technical media và child-safety checks; asset bị provider/safety gate từ chối không được tải xuống như content usable.

### `PRD-CUSTOM-005` — Generation quota and cost (`Must`)

Paid AI có hạn mức do server quản lý; allowance included, phí vượt mức và retry/refund policy là `PRD-TBD-08`. Không mặc định phải mua credit riêng. Hiển thị quota/quote trước confirm; reserve/capture/release idempotent, không thu lại khi retry hệ thống. Chỉ triển khai store add-on nếu owner duyệt policy/SKU.

### `PRD-CUSTOM-006` — Privacy and provider boundary (`Must`)

Prompt gửi provider phải giảm thiểu dữ liệu và không chứa tên/ảnh/audio/video của trẻ, family media, progress, chẩn đoán hoặc note riêng nếu không có requirement/consent riêng. Family media không được dùng làm generative-AI input mặc định. Provider/model/region/data-retention setting phải được inventory và công bố phù hợp privacy policy.

### `PRD-CUSTOM-007` — Ownership, access and deletion (`Must`)

Draft, generated asset và private pack thuộc namespace gia đình, có xem/xóa/export và không được dùng train model hoặc làm default corpus nếu không có consent riêng. Hết subscription không xóa custom data hoặc unused credit ledger, nhưng không mở learning session/giải mã pack khi entitlement không hợp lệ; quy tắc retention và tải dữ liệu phải được công bố.

### `PRD-CUSTOM-008` — Private pack delivery (`Must`)

Sau khi parent duyệt, backend đóng custom content thành versioned, signed, encrypted family-scoped pack và client tải/verify/install bằng cùng atomic protocol với lesson pack. Edit/regenerate tạo version mới; version đang dùng trong learning session không bị mutate giữa phiên.

## 13. Observation và progress

### `PRD-PROG-001` — Observation scale (`Must`)

Phụ huynh ghi một trong ba mức:

- `+` — trẻ thực hiện độc lập theo tiêu chí activity;
- `+/-` — trẻ thực hiện khi có một phần trợ giúp;
- `-` — trẻ chưa thực hiện được trong lượt quan sát.

Có thể skip nếu phụ huynh không quan sát được; skip không được tính là `-`.

### `PRD-PROG-002` — Observation context (`Must`)

Mỗi record gắn với child, goal, target, activity type, prompt level, lesson/session, thời điểm và content version. Ghi chú là tùy chọn.

### `PRD-PROG-003` — Progress view (`Must`)

Parent thấy lịch sử/xu hướng theo goal và activity, không chỉ tổng thời gian. Wording phải dùng `quan sát`, `đang luyện`, `độc lập/có hỗ trợ`, không dùng `bình thường/bất thường`.

### `PRD-PROG-004` — Plan recommendation (`Must`)

App có thể đề nghị ôn hoặc tăng mức khó bằng rule có thể giải thích. Phụ huynh quyết định áp dụng; app không tuyên bố trẻ đã đạt chuẩn phát triển y khoa.

## 14. Subscription và entitlement

| Capability                                     | Free / expired paid         | Active paid       | Trial            |
| ---------------------------------------------- | --------------------------- | ----------------- | ---------------- |
| Tập nói basic, không cap lượt/ngày             | Có                          | Có                | Có               |
| Full catalog                                   | Không                       | Có                | Theo grant       |
| Tạo bộ thủ công/AI                             | Không                       | Có, AI theo quota | Không            |
| Ba trò/ngày                                    | Free length                 | Paid length       | Theo grant       |
| Xem collection/data, export/delete family data | Có                          | Có                | Có               |
| Cloud media mới                                | Theo quota basic được duyệt | Theo quota paid   | Theo quota trial |

Hết paid không có quyền upload cloud mới mặc định; không xóa local family data. Xem `PRD-SUB-006`.

### `PRD-SUB-001` — Trial (`Must`)

Trial có ngày bắt đầu/kết thúc server-authoritative và không reset bằng cài lại app hoặc đổi device cùng account. Thời lượng và payment-method policy là `PB-TBD-02`.

### `PRD-SUB-002` — Store subscription (`Must`)

Purchase, restore purchase, renewal, grace period, billing retry, cancellation, refund và revoke phải phản ánh đúng entitlement từ Apple/Google; UI không tự suy luận chỉ từ receipt local.

### `PRD-SUB-003` — Expiry (`Must`)

Khi hết quyền, không được tạo premium session mới hoặc giải mã premium lesson/media. App không xóa progress/family media local và đưa đường dẫn rõ để subscribe lại hoặc quản lý dữ liệu.

### `PRD-SUB-004` — No third-party ads (`Must`)

Không tích hợp third-party ad SDK trong v1. Promotion của KidEDU chỉ xuất hiện trong Parent Mode và không dùng dữ liệu hành vi của trẻ để nhắm mục tiêu.

### `PRD-SUB-005` — Generation allowance and optional credit (`Must`)

Server quản lý quota/ledger cho AI theo `PRD-CUSTOM-005`. Nếu owner chọn consumable add-on, Apple/Google xác thực purchase và backend reconcile idempotent; không mở learning quyền premium bằng local balance. Add-on chưa là yêu cầu bắt buộc; policy phải đóng trước AI release.

## 15. Sync và download behavior nhìn từ người dùng

### `PRD-SYNC-001` — Progressive delivery (`Must`)

First login chỉ tải bootstrap, user data/catalog index cần thiết và lesson pack đầu. App không bắt người dùng chờ tải toàn bộ thư viện.

### `PRD-SYNC-002` — Prefetch (`Must`)

Mặc định chuẩn bị lesson hiện tại và prefetch hai lesson kế tiếp; chính sách được phép giảm/tăng theo mạng, pin, storage và data-saver mà không đổi learning plan.

### `PRD-SYNC-003` — Download transparency (`Must`)

Parent xem được trạng thái, kích thước, lỗi, retry và quản lý dung lượng. Lesson không được hiển thị `Ready` trước khi verify/install xong.

### `PRD-SYNC-004` — Durable media cache (`Must`)

Media chuẩn đã tải và còn version hợp lệ được tái sử dụng, không tải lại mỗi lần. Cache bytes không được tự cấp entitlement.

### `PRD-SYNC-005` — Reopen (`Must`)

Force-kill không phải logout. Lần mở sau tự khôi phục auth hợp lệ, thực hiện activation/delta handshake nhỏ và dùng local generation; không reload toàn bộ content.

## 16. Parent notifications

### `PRD-NOTIF-001` — Permission and preferences (`Must`)

Chỉ xin quyền notification trong Parent Mode sau khi giải thích lợi ích. Parent có thể bật/tắt reminder học, có quiet hours và không bị mất learning access khi từ chối. V1 không yêu cầu remote-push permission hoặc remote notification preference.

### `PRD-NOTIF-002` — Local learning reminder (`Must`)

Nhắc lịch luyện thường ngày được schedule trên thiết bị theo timezone/preference của parent, không cần server push. Đổi lịch, logout, đổi account hoặc tắt preference phải hủy/reschedule notification cũ và không tạo duplicate.

### `PRD-NOTIF-003` — Server state refresh without remote push (`Must`)

V1 không gửi remote push từ server. Content, sync, account và entitlement state được refresh bằng bootstrap/delta khi app mở hoặc foreground; màn cần trạng thái gần thời gian thực được polling/subscribed có giới hạn khi đang foreground. App không giữ connection nền để giả lập push.

### `PRD-NOTIF-004` — Privacy-safe payload and navigation (`Must`)

Local lock-screen notification không chứa tên trẻ, progress, target đang học, family-media metadata hoặc thông tin nhạy cảm. Khi mở app phải restore đúng account, refresh current state và qua Parent Gate nếu điều hướng tới subscription/account/media.

### `PRD-NOTIF-005` — No child-targeted marketing (`Must`)

V1 không gửi quảng cáo, behavioral marketing hoặc trial/subscription push. Local reminder chỉ phục vụ lịch luyện do parent tự cấu hình và không xuất hiện như reward/punishment trong Child Mode.

## 17. Child experience, accessibility và safety

### `PRD-UX-001` — Child Mode (`Must`)

Ít chữ, target chạm lớn, visual hierarchy rõ, không thao tác phá hủy, không purchase/link ngoài và không notification thương mại.

### `PRD-UX-002` — Sensory restraint (`Must`)

Animation, âm thanh khen và hiệu ứng chỉ hỗ trợ chú ý, không lấn át stimulus ngôn ngữ. Parent có thể giảm chuyển động/âm thanh phụ.

### `PRD-UX-003` — Accessible parent UI (`Must`)

Parent Mode hỗ trợ screen reader label, dynamic text trong giới hạn layout, contrast và thao tác không chỉ dựa vào màu.

### `PRD-UX-004` — No manipulative engagement (`Must`)

Không streak gây áp lực, paid loot box, autoplay vô hạn, social comparison hoặc dark pattern subscription. Ngoại lệ owner duyệt 2026-11-05: bốn hộp quà sưu tập miễn phí theo `PRD-REWARD-001`, không mua lượt, rarity hoặc reroll.

## 18. Privacy và data control

### `PRD-PRIV-001` — Data inventory (`Must`)

Parent xem được nhóm dữ liệu đang có: account, child profile, plan/progress, downloaded content, local family media và cloud family media.

### `PRD-PRIV-002` — Export/delete (`Must`)

App cung cấp export dữ liệu gia đình ở định dạng có thể sử dụng và xóa theo phạm vi hoặc xóa account. Thao tác phải xác nhận, có trạng thái xử lý và không tuyên bố hoàn tất trước khi server hoàn tất.

### `PRD-PRIV-003` — Analytics consent (`Must`)

Telemetry sản phẩm phải giảm thiểu dữ liệu, không ghi raw child audio/video và không gửi family media. Analytics/diagnostic nào cần consent phải tôn trọng lựa chọn và có thể tắt.

### `PRD-PRIV-004` — Store/legal readiness (`Must`)

Trước release phải hoàn thành privacy policy, terms/subscription disclosure, account deletion, data safety/app privacy declarations và child/family policy review của từng store.

## 19. Non-functional product requirements

| ID            | Requirement                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `PRD-NFR-001` | Không mất dữ liệu đã commit khi app crash, process kill hoặc sync thất bại; sync content áp dụng atomic              |
| `PRD-NFR-002` | Lesson `Ready` bắt đầu từ local mà không phụ thuộc network request trong activity loop                               |
| `PRD-NFR-003` | Premium content không persist plaintext và không usable chỉ nhờ copy local database/files                            |
| `PRD-NFR-004` | API và local schema hỗ trợ version/migration tương thích ít nhất với các app version còn được backend hỗ trợ         |
| `PRD-NFR-005` | Mọi thao tác nhạy cảm có authorization server-side, audit phù hợp và error state có thể phục hồi                     |
| `PRD-NFR-006` | App đo crash-free sessions, startup/lesson readiness, sync success và playback failures mà không thu raw child media |
| `PRD-NFR-007` | Có staging và production tách biệt; không dùng dữ liệu trẻ production để test                                        |
| `PRD-NFR-008` | Release gate gồm test chức năng, security/privacy, subscription sandbox, migration, low-storage và lifecycle         |

SLO số học và reference device/network được Technical Architecture quy định, sau đó performance spec chi tiết hóa.

## 20. Release acceptance

Không được phát hành public v1.0 nếu còn một trong các điều kiện sau:

1. core activity từ `PRD-ACT-001` đến `PRD-ACT-010` chưa có end-to-end flow và content đạt chuẩn;
2. purchase/restore/expiry/refund chưa test trên sandbox của cả platform phát hành;
3. cache local vẫn mở được premium sau entitlement expiry theo luồng app bình thường;
4. account switch hoặc delete có thể lộ dữ liệu của account trước;
5. sync failure có thể làm hỏng generation đang active;
6. family media có thể upload khi chưa consent hoặc gửi vào analytics/log;
7. store/privacy documentation chưa hoàn chỉnh;
8. nội dung mặc định chưa có provenance/review;
9. learning session không chịu được background/foreground và process kill theo requirement;
10. local notification permission, privacy copy, duplicate/schedule và account-switch behavior chưa được test trên cả hai platform;
11. các `TBD` có ảnh hưởng giá, disclosure hoặc data retention chưa được product owner chốt.

## 21. Traceability cho tài liệu dẫn xuất

Các tài liệu chi tiết dự kiến và requirement owner:

| Nhóm tài liệu                   | Requirement chính                           |
| ------------------------------- | ------------------------------------------- |
| Learning plan & curriculum spec | `PRD-PLAN-*`, `PRD-CONT-*`                  |
| Activity specifications         | `PRD-ACT-*`, `PRD-SES-*`, `PRD-BR-003..006` |
| Parent/family media spec        | `PRD-MEDIA-*`, `PRD-PRIV-*`                 |
| Custom library spec v1          | `PRD-CUSTOM-*`, `PRD-SUB-005`               |
| Progress spec                   | `PRD-PROG-*`                                |
| Subscription spec               | `PRD-SUB-*`                                 |
| Sync/download spec              | `PRD-SYNC-*`, `PRD-NFR-001..004`            |
| Notification spec               | `PRD-NOTIF-*`, `PRD-ACC-*`, `PRD-PRIV-*`    |
| Design system/UX                | `PRD-UX-*`, `PRD-ACC-004`                   |
| QA/release plan                 | toàn bộ acceptance criteria và mục 20       |

### `PRD-ACT-012` — Bộ từ của bài học qua nhiều trò chơi

Superseded presentation policy bởi `PRD-GAME-001..004`, `PRD-REWARD-001..003` và `PRD-PROG-005` ngày 2026-11-05. Ba trò nằm trong một phiên/ngày, độ dài theo tier, chỉ một quà khi hoàn tất; không nhận xét game. C40–C49 là implementation history, không override C50. Đáp án authored kiểm local, không phải mastery ngôn ngữ.

## 22. Open decisions

PRD kế thừa toàn bộ `PB-TBD-*` và bổ sung:

- `PRD-TBD-01`: rule tạo initial plan và ngưỡng tiến/lùi cụ thể;
- `PRD-TBD-02`: danh mục target/lesson tối thiểu đủ để v1 có chiều sâu;
- `PRD-TBD-03`: giới hạn session theo activity và nhóm trẻ qua usability test;
- `PRD-TBD-04`: format export và SLA account deletion;
- `PRD-TBD-05`: platform phát hành đồng thời hay Android trước/iOS sau trong cùng release program;
- `PRD-TBD-06`: policy grace/billing retry hiển thị cho từng store.
- `PRD-TBD-07`: cadence/default preference cụ thể cho từng loại notification qua usability test.
- `PRD-TBD-08`: giới hạn target/job, included quota, optional overage fee/SKU, retry/regenerate/refund và retention của AI; gate C50-D03.
- `PRD-TBD-09`: đóng theo PRD-SUB-006: hết paid khóa private premium learning, giữ xem/export/delete dữ liệu; basic catalog vẫn dùng được.

Các `TBD` phải được đóng trước khi phần liên quan qua release gate; không cản việc thiết kế các invariant không phụ thuộc chúng.

## 23. Owner-approved scope 2026-11-05 — C50

Các requirement dưới đây thuộc `Must` Store Release v1.0. Chúng thay mô hình ba tab, game có review và thưởng từng trò trong C36–C49; không bỏ progression, family media hoặc parent-guided transfer.

### `PRD-NAV-001` — Bốn tab

Tập nói · Trò chơi · Bộ sưu tập · Phụ huynh. Tập nói vào theo chủ đề, vẫn có goal/lesson/progression và nhận xét cuối phiên; sensitive parent actions sau Parent Gate. Không giới hạn số phiên Tập nói/ngày trong content scope được cấp.

### `PRD-GAME-001` — Một phiên/ngày

Mỗi child có một phiên gồm bóng khuyết, nghe rồi chọn, lật thẻ. Dừng thì tiếp tục cùng phiên. Reset 00:00 hằng ngày theo `Asia/Ho_Chi_Minh` kể cả phiên hôm trước chưa xong; không cộng dồn hoặc mở phiên thứ hai sau hoàn tất. Server là authority lượt/ngày, reinstall/device clock/đổi thiết bị không cấp lượt mới. Các thiết bị tiếp tục cùng phiên từ checkpoint đã đồng bộ; không dùng client timestamp để kéo dài ngày chơi. Quà chưa nhận khi reset bị hủy, kể cả completion local chưa sync. Receipt đã xác nhận trước reset vẫn giữ và retry trả receipt cũ. Xử lý thao tác đang chạy/đổi gói tại boundary theo C50-D06; không thay expiry store thành midnight.

### `PRD-GAME-002` — Độ dài theo gói

| Trò           | Free                  | Paid                   |
| ------------- | --------------------- | ---------------------- |
| Bóng khuyết   | 2 màn × khoảng 3 hình | 5 màn × khoảng 3 hình  |
| Nghe rồi chọn | 5 từ, mỗi từ 3 đáp án | 12 từ, mỗi từ 3 đáp án |
| Lật thẻ       | 5 cặp                 | 5 cặp                  |

Catalog author bảo đảm số lượng/readiness từng gói. Không yêu cầu cùng một bộ năm từ cho mọi trò; có thể reuse từ nhưng phải đủ 12 target cho paid nghe chọn. Không có thưởng giữa round/trò.

### `PRD-GAME-003` — Tương tác và feedback

Bóng khuyết kéo vật vào silhouette tương ứng (assistive alternative bắt buộc); nghe chọn phát tên vật và chạm một trong ba hình; lật hình ghép cặp theo authored rule. Đúng có hiệu ứng nhẹ, sai nghe chọn nhắc lại tên vật cần tìm rồi cho thử lại. Không trừ điểm, phạt, timer gây áp lực, tự chấm phát âm hoặc observation. Tự chuyển sau completion; pause/background dừng media và restore không autoplay.

Owner amendment 2026-11-06: màn chơi cố định, không cuộn khi kéo và không vuốt/system back để thoát; có nút Quay lại Trò chơi rõ ràng, lưu tiến độ khi rời. Hình chọn và mười thẻ dùng diện tích khả dụng, thích ứng cỡ màn hình thay vì giữ ô nhỏ giữa khoảng trống lớn. Cặp sai tự úp sau khoảng nhìn ngắn, không nút úp thủ công; dừng timer khi background/pause, có thời gian dài hơn cho screen reader. Không giảm touch target dưới chuẩn accessibility để nhét nội dung.

Acceptance hình bóng khuyết (`PRD-GAME-003`, owner correction 2026-11-07): mỗi bóng có đúng đường bao ngoài của hình nguồn, cùng tư thế/tỉ lệ/crop tĩnh khi ghép. Không dùng một bóng chung cho nhiều đồ vật hoặc cảnh nền làm silhouette. Cần bóng đủ tương phản, giữ assistive alternative và feedback không phạt; hình chưa hỗ trợ không được thay bằng bóng của đồ vật khác.

Drag acceptance clarification 2026-11-09: nhận hình khi tâm khung hình được thả vào đúng ô, không yêu cầu ngón tay nằm trong ô hoặc cầm chính giữa hình. Đo nguồn/đích trong cùng hệ tọa độ cửa sổ; phép đo nguồn phải hoàn tất trước khi áp dụng translation để kéo nhanh không làm lệch origin. Sai ô/ngoài ô vẫn không nhận, pause/unmount/hủy không được commit thao tác muộn.

Owner correction 2026-11-07 — nghe chọn có phản hồi tại hình vừa chạm: đúng có xác nhận/chúc mừng nhẹ; sai có cue thử lại trung tính, không còi/phạt/rung lắc gây áp lực. Giữ phản hồi ngắn trước chuyển lượt, kể cả lượt cuối; checkpoint ghi ngay, chỉ presentation trì hoãn. Tắt chuyển động theo Reduce Motion/reinforcement setting, giữ cue tĩnh và thông báo accessible. Background/unmount hủy hiệu ứng/handoff, foreground không replay.

### `PRD-GAME-004` — Hết lượt vẫn xem được tab

Local QA exception do owner duyệt 2026-11-06: riêng synthetic account `fullaccess` trong guarded local development được bỏ thao tác Parent Gate và mở phiên kiểm thử mới sau completion. Lệnh explicit giữ owned inventory/learning history, retire metadata phiên thử vừa xong; không dùng cho production hoặc tài khoản thường, không cấp nội dung/quyền chưa triển khai. Đây là tiện ích test, không sửa quota/ngày của sản phẩm.

Tab game luôn vào được; khi hết lượt, nút Vào chơi disabled/mờ, có accessible disabled state và thông báo “Đã hết lượt chơi hôm nay”, kèm lần reset tiếp theo. Không chỉ dùng màu. Phiên dở có Tiếp tục; tab Tập nói/Bộ sưu tập/Phụ huynh vẫn hoạt động theo quyền riêng.

### `PRD-REWARD-001` — Một quà sau đủ ba trò

Hoàn tất đủ ba trò theo gói → chọn Mảnh ghép/Sticker → bốn hộp → chọn một → nhận một món chưa sở hữu. Một receipt/ngày chơi/child, không nhận lại qua resume/retry/multi-device. Candidates và lựa chọn bất biến; random trong toàn pool chưa có thuộc loại/group phù hợp, không cần xong một tranh/chủ đề trước. Không mua hộp/lượt, rarity, reroll hoặc quảng cáo lấy lượt. Chỉ nhận món mới; hết loại nào khóa loại đó và vẫn hiển thị số quà còn lại của từng loại, gồm số 0. Hết cả hai không chặn quyền chơi. Bốn hộp là bốn vị trí lựa chọn, không phải cam kết bốn món khác nhau; pool còn 1–3 món có thể lặp candidate giữa các hộp nhưng chỉ cấp duy nhất một món mới. Quà chưa nhận hết hiệu lực tại reset theo PRD-GAME-001.

Owner amendment 2026-11-06: hoàn tất tự ghi checkpoint/outbox và đồng bộ ở completion boundary, không bấm Lưu lượt chơi hoặc Chơi lại. Chỉ sau server ACK mới tự sang màn nhận quà. Lỗi mạng giữ tiến độ, cho thử kết nối lại, không mở lượt mới hoặc tự cấp quà. Sau receipt được xác nhận, hiện món quà một khoảng ngắn rồi tự về tab Trò chơi; tab giữ trạng thái hết lượt. Background không tiêu thời gian xem quà.

### `PRD-REWARD-002` — Catalog theo giới tính hồ sơ

Group cố định theo giới tính đã nhập; không suy từ tên và không thay bằng sở thích tự chọn. Mỗi nhóm 15–20 tranh, 3–4 chủ đề, 5–6 mảnh/tranh; tổng hai nhóm 30–40 tranh. Bé trai: siêu nhân, máy bay/tên lửa/vũ trụ; bé gái: công chúa, phòng bếp, bác sĩ. Sticker 3–4 chủ đề/group, 15–20 hình/bộ, có đồ vật trong nhà/động vật và siêu nhân/công chúa tương ứng. Chủ đề chung có thể reuse artwork. Asset có rights/provenance/review. Profile nhập giới tính theo PRD-ACC-003; giữ quà cũ, không tự đoán group khi thiếu field.

### `PRD-REWARD-003` — Bộ sưu tập bền vững

Album tranh hiển thị mảnh đã có và tranh hoàn chỉnh; album sticker hiển thị món đã nhận/còn thiếu. Lưu theo account/child, sync và giữ inventory/receipt cũ; hết subscription không khóa xem collection đã nhận. Không có yêu cầu mini-game ghép lại tranh ở C50.

### `PRD-PROG-005` — Chỉ nhận xét Tập nói

Game session không mở review và không tạo observation/negative observation/missing-review reminder. Tập nói vẫn nhận xét từng bài cuối phiên qua Parent Gate; không có nhận xét không phải chưa đạt. Game completion/reward không nâng mastery hoặc tự thay progression. Giữ nguyên lịch sử cũ với nguồn/session kind rõ.

### `PRD-SUB-006` — Basic/free và full/paid

Free lâu dài học năm bộ hiện có: Gia đình (`deck-family`), Nhu cầu cơ bản (`deck-needs`), Đồ vật quen thuộc (`deck-objects`), Con vật (`deck-animals`), Hành động (`deck-actions`); giữ phạm vi target hiện tại, không tự mở nội dung mới vào basic. Đây là mapping từ catalog hiện có, không biến legacy deck thành architecture learning v2 hoặc bỏ goal/progression/transfer. Free và trial không tạo bộ riêng thủ công/AI. Paid mở full + custom authoring. Cả hai một lượt game/ngày theo PRD-GAME-002; Tập nói không cap số lượt. Hết trial/paid về basic; không cấp premium key chỉ vì cached bytes. Account/activation và content publish/readiness vẫn bắt buộc. AI tạo bộ khoảng năm từ theo gợi ý phụ huynh; số từ/job không đồng nghĩa quota generation vô hạn. Quota/pricing/provider AI còn gate D03.

Acceptance chung: server/loader/repository enforce scope; runtime không gọi API mỗi lượt thao tác; atomic local mutation+outbox; test 00:00, race hai thiết bị, process kill, expiry, legacy migration và private data isolation trước release. Task thực thi: [C50](./delivery/tasks/C50-four-tabs-daily-games-freemium-ai.md).

# KidEDU — Product Brief SOT

| Thuộc tính       | Giá trị                                                            |
| ---------------- | ------------------------------------------------------------------ |
| Tài liệu         | Product Brief — Source of Truth                                    |
| Mã tài liệu      | `SOT-PB-01`                                                        |
| Trạng thái       | `In review`                                                        |
| Product owner    | Chủ dự án KidEDU                                                   |
| Cập nhật         | 2026-11-05                                                         |
| Phạm vi          | Store Release v1.0                                                 |
| Tài liệu kế tiếp | [02-product-requirements-sot.md](./02-product-requirements-sot.md) |

## 1. Vai trò và thẩm quyền

Tài liệu này là Source of Truth cao nhất cho định hướng sản phẩm KidEDU. Nó trả lời bốn câu hỏi: sản phẩm dành cho ai, giải quyết vấn đề nào, tạo giá trị gì và không trở thành sản phẩm gì.

PRD phải dẫn xuất từ Product Brief. Technical Architecture phải đáp ứng PRD. Tài liệu chi tiết không được tự thay đổi định vị, đối tượng, mô hình kinh doanh hoặc phạm vi đã ghi tại đây.

Tên sản phẩm được giữ là **KidEDU**. Việc đổi tên thương hiệu, bundle ID hoặc domain không thuộc đợt refactor tài liệu này.

## 2. Product statement

Owner decision 2026-11-05 — `PB-PLAY-01`: Tập nói theo chủ đề và progression có nhận xét phụ huynh; Trò chơi là phiên riêng gồm ba trò, một lượt mỗi ngày reset 00:00 và quà sưu tập sau khi hoàn tất. Game không có nhận xét ngôn ngữ. Bốn tab và chi tiết tại `PRD-NAV-001`, `PRD-GAME-*`, `PRD-REWARD-*`.

> KidEDU là ứng dụng di động tiếng Việt giúp phụ huynh tổ chức việc luyện ngôn ngữ và giao tiếp tại nhà cho trẻ chậm nói theo một lộ trình có cấu trúc, từ hiểu và gọi tên đến nói câu, trả lời và chủ động dùng lời nói trong đời sống.

Sản phẩm mô phỏng những phần phù hợp với môi trường số từ hoạt động hỗ trợ 1-1: làm mẫu rõ ràng, lặp lại có chủ đích, giảm dần trợ giúp, luyện trong nhiều ngữ cảnh và hướng dẫn phụ huynh chuyển kỹ năng từ màn hình ra đời sống. App không cố thay thế sự quan sát và tương tác trực tiếp của người lớn.

Mục tiêu mô phỏng “khoảng 80%” giá trị của một số hoạt động trực tiếp chỉ là **product aspiration ban đầu**, không phải chỉ số hiệu quả, tuyên bố lâm sàng hay thông điệp marketing. KidEDU phải số hóa tối đa những phần thực sự phù hợp, sau đó kiểm chứng bằng usability study, dữ liệu sử dụng và review chuyên môn thay vì dùng một tỷ lệ chủ quan làm cam kết.

Thông điệp giá trị cốt lõi:

> **Không chỉ học thêm từ, mà học cách dùng từ.**

## 3. Vấn đề cần giải quyết

### `PB-PROBLEM-01` — Nội dung rời rạc

Nhiều ứng dụng cho trẻ chủ yếu cung cấp flashcard, hình và âm thanh. Trẻ có thể nhớ thêm từ nhưng phụ huynh không có lộ trình rõ để chuyển từ nhận biết sang giao tiếp chủ động.

### `PB-PROBLEM-02` — Khó duy trì luyện tập tại nhà

Can thiệp trực tiếp có chi phí đáng kể và thời lượng giới hạn. Phụ huynh cần một công cụ giúp chuẩn bị nội dung, tổ chức buổi luyện ngắn, lặp lại đúng mục tiêu và áp dụng vào sinh hoạt thường ngày.

### `PB-PROBLEM-03` — Nội dung chung thiếu tính gần gũi

Trẻ phản ứng tốt hơn với người, vật và tình huống quen thuộc. Kho nội dung mặc định không thể phản ánh đầy đủ gia đình của từng trẻ.

### `PB-PROBLEM-04` — Theo dõi sai trọng tâm

Chỉ đếm lượt xem hoặc thời gian dùng app không cho biết trẻ làm độc lập, cần trợ giúp hay chưa thực hiện được. Phụ huynh cần cách ghi nhận đơn giản nhưng gắn với mục tiêu giao tiếp.

## 4. Bằng chứng và nguồn hình thành sản phẩm

Định hướng v1 dựa trên:

- quan sát thực tế hoạt động hỗ trợ trẻ chậm nói 1-1;
- chuỗi kế hoạch và nhận xét can thiệp thực tế từ 28 đến 32 tháng tuổi;
- progression quan sát được: nhận biết/gọi tên → từ đơn và cụm ngắn → vuốt đuôi → mẫu câu chức năng → hỏi đáp → mệnh lệnh hai bước → dùng ngôn ngữ trong ngữ cảnh;
- desk research các ứng dụng tại Việt Nam và quốc tế về học nói, parent coaching, AAC và early learning.

Các tài liệu can thiệp gốc chỉ là **research input**, không phải giáo trình y khoa đã được KidEDU thẩm định. Chúng có dữ liệu nhận dạng của trẻ và chuyên viên, vì vậy không được phân phối hoặc commit vào repository sản phẩm. Chỉ insight đã ẩn danh và được product owner cho phép mới được đưa vào content specification.

## 5. Người dùng mục tiêu

### `PB-AUDIENCE-01` — Người mua và người điều phối

Phụ huynh hoặc người chăm sóc trẻ nói tiếng Việt, nhận thấy trẻ cần được hỗ trợ phát triển ngôn ngữ và muốn luyện cùng trẻ tại nhà. Họ không được giả định là chuyên gia và phải nhận được hướng dẫn ngắn, cụ thể, dễ làm.

### `PB-AUDIENCE-02` — Người học

Trẻ đang cần hỗ trợ về vốn từ, hiểu lời nói, kết hợp từ/câu hoặc tính chủ động giao tiếp. App không dùng tuổi đơn thuần để kết luận cấp độ và không tự chẩn đoán tình trạng của trẻ.

### `PB-AUDIENCE-03` — Người hỗ trợ chuyên môn

Giáo viên hoặc chuyên viên có thể khuyến nghị mục tiêu và phối hợp với phụ huynh, nhưng portal chuyên gia, lớp học và theo dõi từ xa không thuộc v1.

## 6. Job to be done

Khi phụ huynh cần luyện ngôn ngữ cùng con giữa các buổi hỗ trợ hoặc trong sinh hoạt tại nhà, họ muốn biết hôm nay nên luyện gì, app làm mẫu thế nào, lúc nào cần chờ hoặc gợi ý và làm sao ghi nhận phản ứng của trẻ, để việc luyện có cấu trúc nhưng vẫn gần gũi với đời sống thật.

## 7. Kết quả sản phẩm hướng tới

### `PB-OUTCOME-01` — Có lộ trình

Phụ huynh luôn biết mục tiêu hiện tại, bài nên học tiếp và hoạt động ngoài màn hình cần thực hiện.

### `PB-OUTCOME-02` — Tăng cơ hội giao tiếp có mục đích

Sản phẩm tạo nhiều cơ hội để trẻ yêu cầu, lựa chọn, trả lời, gọi người, mô tả hoặc tham gia tương tác; không chỉ nhắc lại âm thanh thụ động.

### `PB-OUTCOME-03` — Chuyển kỹ năng ra đời sống

Mỗi nhóm mục tiêu phù hợp phải có gợi ý parent-guided để phụ huynh luyện với đồ vật, con người và tình huống thật.

### `PB-OUTCOME-04` — Cá nhân hóa có ý nghĩa

Phụ huynh có thể dùng ảnh, audio hoặc video gia đình cho đúng target mà không làm mất nội dung chuẩn và có thể quay về mặc định.

### `PB-OUTCOME-05` — Tiến bộ có thể quan sát

Phụ huynh ghi nhận theo ba mức `Độc lập (+)`, `Có hỗ trợ (+/-)`, `Chưa thực hiện (-)` và xem xu hướng theo mục tiêu; app không diễn giải thành chẩn đoán y khoa.

## 8. Progression cốt lõi

KidEDU tổ chức nội dung theo progression tham chiếu sau, nhưng learning plan của từng trẻ có thể đi khác tốc độ và quay lại mục tiêu trước:

```text
Nghe–hiểu
→ Nhận biết
→ Gọi tên
→ Nói theo
→ Vuốt đuôi
→ Kết hợp từ/câu
→ Trả lời
→ Dùng câu trong ngữ cảnh
→ Chủ động giao tiếp ngoài app
```

Đây là bản đồ năng lực, không phải cam kết rằng mọi trẻ phải đi qua tuyến tính hoặc đạt kết quả trong một khoảng thời gian cố định.

## 9. Trụ cột sản phẩm Store Release v1.0

### `PB-PILLAR-01` — Learning plan cá nhân

App tạo và duy trì một kế hoạch luyện phù hợp với hồ sơ, mục tiêu phụ huynh chọn và kết quả quan sát. Kế hoạch phải giải thích được vì sao bài xuất hiện và cho phép phụ huynh điều chỉnh trong phạm vi an toàn.

### `PB-PILLAR-02` — Hoạt động ngôn ngữ tiếng Việt có cấu trúc

V1 bao phủ: học từ và khẩu hình, nghe hiểu/nhận biết, gọi tên, nói theo, vuốt đuôi, kết hợp cụm/câu, Có/Không, hỏi đáp trực quan, mệnh lệnh một/hai bước và giao tiếp chức năng.

### `PB-PILLAR-03` — Parent-guided transfer

App hướng dẫn người lớn dừng, chờ, gợi ý, giảm trợ giúp và tạo cơ hội dùng lời nói ngoài màn hình. Trẻ không được thiết kế để dùng app hoàn toàn một mình trong mọi hoạt động.

### `PB-PILLAR-04` — Family media

Ảnh, audio và video do gia đình cung cấp là khả năng cốt lõi. Video khẩu hình được ưu tiên ở hoạt động cần quan sát miệng; hoạt động khác chỉ dùng video khi có giá trị rõ ràng.

### `PB-PILLAR-05` — Progress quan sát được

Kết quả gắn với target, loại activity, mức trợ giúp và thời điểm, thay vì chỉ gắn nhãn chung chung `new/practicing/familiar`.

### `PB-PILLAR-06` — Trải nghiệm production có tài khoản

App có backend, đăng nhập phụ huynh, subscription, đồng bộ dữ liệu và local runtime nhanh. Không xây một bản local-only tạm thời rồi thay kiến trúc sau.

## 10. Nguyên tắc sản phẩm bắt buộc

1. **Tiếng Việt là ngôn ngữ can thiệp duy nhất của v1.** Nội dung phải tự nhiên theo ngữ cảnh Việt Nam, không dịch máy từ giáo trình ngoại ngữ.
2. **Giao tiếp quan trọng hơn thời gian màn hình.** App phải chủ động tạo khoảng dừng và hoạt động rời màn hình.
3. **Trẻ ít thao tác, phụ huynh giữ quyền điều phối.** Child Mode đơn giản; cấu hình, mua hàng, dữ liệu và media nằm sau Parent Gate.
4. **Không chẩn đoán, không hứa điều trị.** Mọi wording trên store và trong app phải mô tả đây là công cụ hỗ trợ.
5. **Không AI chấm đúng/sai phát âm trong v1.** Phụ huynh ghi nhận phản ứng; không đưa ra kết luận tự động thiếu độ tin cậy.
6. **Không dùng media sai để đổi lấy độ phủ.** Nội dung AI-generated mặc định phải qua editorial review. Target có video khẩu hình chưa đạt không được phát video đó làm mặc định.
7. **Readiness theo activity.** Thiếu video không làm target vô dụng cho nhận biết, vuốt đuôi, hỏi đáp hoặc hoạt động khác.
8. **Không quảng cáo bên thứ ba.** Child Mode tuyệt đối không có quảng cáo; Parent Mode chỉ được giới thiệu sản phẩm/gói của KidEDU.
9. **Quyền mua không đồng nghĩa quyền sở hữu nội dung premium vĩnh viễn.** Subscription hết hạn thì nội dung trả phí ngừng hoạt động dù bytes còn trên máy.
10. **Dữ liệu gia đình thuộc về gia đình.** Không khóa việc xem/xuất/xóa dữ liệu do phụ huynh tạo chỉ vì subscription hết hạn.
11. **Privacy by design cho dữ liệu trẻ em.** Chỉ thu thập dữ liệu cần thiết, có consent rõ ràng và không dùng cho quảng cáo hành vi.
12. **Không quảng bá offline mode.** Một buổi đã chuẩn bị có thể chịu được mạng chập chờn, nhưng quyền truy cập được server xác nhận.

## 11. Mô hình kinh doanh và quyền truy cập

### `PB-BIZ-01` — Subscription

V1 có free lâu dài với bộ học cơ bản; subscription mở toàn bộ thư viện, tạo bộ học thủ công/AI và capability theo gói. Tập nói không giới hạn số phiên/ngày trong content scope được cấp. AI có hạn mức riêng, không mặc định vô hạn; allowance/fee vượt mức còn cần owner chốt. Không third-party ads.

### `PB-BIZ-02` — Trial thay cho quảng cáo

Trial là trải nghiệm quyền mở rộng có thời hạn nếu được cung cấp; policy còn tại `PB-TBD-02`. Hết trial hoặc subscription trở về free/basic theo `PB-BIZ-04`, không khóa mọi learning. Dữ liệu gia đình vẫn xem/xuất/xóa được.

### `PB-BIZ-03` — Chi phí tài khoản hết hạn

Cloud backup media gia đình là quyền lợi subscriber và phải có quota. Khi subscription hết hạn, upload/sync media mới dừng; retention và quy trình tải dữ liệu trước khi xóa phải được công bố rõ. Media gia đình mặc định có thể lưu trên thiết bị để tránh chi phí cloud không cần thiết.

### `PB-BIZ-04` — Free learning tier lâu dài tại v1

Owner phê duyệt 2026-11-05: free lâu dài gồm năm bộ hiện có: Gia đình, Nhu cầu cơ bản, Đồ vật quen thuộc, Con vật, Hành động; không tự thêm bộ. Paid mở full và tạo bộ thủ công/AI; trial không tạo bộ. Cả hai có một phiên ba trò/ngày với độ dài khác nhau, reset 00:00 theo `Asia/Ho_Chi_Minh`; không mua thêm lượt. Quà chưa nhận khi reset bị hủy; đồng bộ cùng phiên giữa thiết bị, không cấp lượt mới. Tập nói không giới hạn số phiên trong quyền được cấp. Quyết định này thay mốc 08:00 ban đầu.

### `PB-BIZ-05` — Tạo bộ học thủ công/AI trong v1

Owner phê duyệt 2026-11-05: subscriber tạo private collection bằng nội dung/media tự nhập hoặc AI hỗ trợ. Safety validation và parent preview/approval trước publish; không AI chấm phát âm, không gửi PII/family media mặc định. Đây là phạm vi Store Release v1.0 thay cho post-release. Hạn mức, pricing vượt mức, provider và operational budget cần chốt trước production; không mặc định paid add-on bắt buộc. Chi tiết `PRD-CUSTOM-*`.

## 12. Phạm vi không thuộc v1

- chẩn đoán chậm nói, rối loạn ngôn ngữ hoặc tình trạng phát triển;
- thay thế chuyên viên, giáo viên hoặc hoạt động tương tác trực tiếp;
- AI tự động chấm phát âm của trẻ;
- portal chuyên gia, quản lý lớp và giao bài từ xa;
- tư vấn y khoa hoặc chat với chuyên gia;
- mạng xã hội, marketplace hoặc chia sẻ công khai nội dung trẻ;
- quảng cáo bên thứ ba hoặc quảng cáo hành vi;
- streaming video như mô hình xem phim;
- cam kết offline hoàn toàn;
- tiếng Anh hoặc các lĩnh vực đào tạo tổng hợp ngoài ngôn ngữ tiếng Việt.

## 13. Thước đo thành công

Các chỉ số dưới đây đo chất lượng sử dụng sản phẩm, không được quảng bá như bằng chứng hiệu quả điều trị:

| Mã             | Chỉ số                                            | Ý nghĩa                                       |
| -------------- | ------------------------------------------------- | --------------------------------------------- |
| `PB-METRIC-01` | Tỷ lệ hoàn tất onboarding và sẵn sàng bài đầu     | Người dùng hiểu và vào được giá trị cốt lõi   |
| `PB-METRIC-02` | Tỷ lệ tuần có ít nhất 3 phiên luyện ngắn          | Khả năng duy trì thói quen                    |
| `PB-METRIC-03` | Tỷ lệ phiên có observation hợp lệ                 | Progress có dữ liệu thực thay vì chỉ lượt xem |
| `PB-METRIC-04` | Tỷ lệ target chuyển từ `Có hỗ trợ` sang `Độc lập` | Xu hướng quan sát trên cùng năng lực          |
| `PB-METRIC-05` | Tỷ lệ hoàn thành hoạt động parent-guided          | Khả năng chuyển ra ngoài màn hình             |
| `PB-METRIC-06` | Trial-to-paid và paid retention                   | Tính bền vững thương mại                      |
| `PB-METRIC-07` | Crash-free learning sessions và sync success      | Chất lượng production                         |

Target số học của từng metric được chốt trong release plan sau khi có baseline beta; không bịa target trước khi có dữ liệu.

## 14. Giai đoạn phát triển v1

Phase chỉ là thứ tự delivery; toàn bộ capability đã ghi `v1` vẫn thuộc Store Release v1.0.

1. **Foundation:** account, child profile, content model, content pipeline, backend, entitlement, sync và local runtime.
2. **Core learning:** learning plan và các activity theo progression.
3. **Parent & personalization:** parent-guided flow, family media, observation và progress.
4. **Commercial & release hardening:** trial/subscription, privacy, analytics có consent, accessibility, reliability và store compliance.

## 15. Rủi ro sản phẩm chính

| Mã           | Rủi ro                                         | Nguyên tắc xử lý                                                                 |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `PB-RISK-01` | Phụ huynh hiểu app là công cụ điều trị         | Wording rõ, không chẩn đoán/hứa hẹn, khuyến nghị tìm chuyên gia khi lo ngại      |
| `PB-RISK-02` | Trẻ xem thụ động thay vì giao tiếp             | Session ngắn, khoảng chờ, prompt cho phụ huynh và hoạt động ngoài màn hình       |
| `PB-RISK-03` | Video khẩu hình AI sai                         | QA nội dung, trạng thái readiness, fallback audio/hình hoặc family video         |
| `PB-RISK-04` | Giáo trình thực tế bị sao chép như chuẩn chung | Chỉ trích xuất pattern đã ẩn danh; content cần review chuyên môn riêng           |
| `PB-RISK-05` | Dữ liệu trẻ em và family media bị lộ           | Data minimization, encryption, consent, deletion và access control               |
| `PB-RISK-06` | Subscription bị bypass bằng cache local        | Server-authoritative entitlement và encrypted premium packs                      |
| `PB-RISK-07` | Phạm vi quá rộng làm giảm chất lượng           | Release gate theo capability, không bỏ core progression để chạy theo feature phụ |

## 16. Quyết định còn mở

Các mục sau là `TBD` và không được tự suy diễn ở tài liệu cấp thấp hơn:

- `PB-TBD-01`: tên KidEDU, domain và store listing có vượt kiểm tra pháp lý/khả dụng hay không;
- `PB-TBD-02`: thời lượng trial và có yêu cầu phương thức thanh toán trước hay không;
- `PB-TBD-03`: giá monthly/annual và chính sách introductory offer;
- `PB-TBD-04`: số child profile trong mỗi gói;
- `PB-TBD-05`: quota và retention cụ thể cho cloud family media;
- `PB-TBD-06`: phạm vi review của chuyên gia ngôn ngữ trước public release;

## 17. Điều kiện phê duyệt Product Brief

Tài liệu chuyển sang `Approved` khi product owner:

1. duyệt tên/định vị và toàn bộ product principles;
2. xác nhận free/basic + paid/full, trial policy và không third-party ads;
3. xác nhận các trụ cột và out-of-scope của Store Release v1.0;
4. chấp nhận danh sách `TBD` có owner và thời điểm giải quyết;
5. xác nhận tài liệu giáo trình chứa PII đã được loại khỏi phạm vi commit/phân phối.

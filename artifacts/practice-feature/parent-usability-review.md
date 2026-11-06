# Review trải nghiệm cùng con — 2026-11-04

Sau review, owner yêu cầu C44 sửa PU-02/PU-03: ảnh một chủ thể/4 frame và popup đầu trò đã triển khai. PU-01/audio để plan sau; phần thưởng/collection hiện là thử nghiệm, nâng cấp sau. Các phát hiện bên dưới ghi nhận phiên bản tại thời điểm review, trước C44.

Đóng vai phụ huynh lần đầu dùng bộ mẫu “5 từ hôm nay · 3 trò chơi”. Đây là walkthrough bằng Chromium và kiểm tra source, không phải buổi thử với trẻ/phụ huynh thật hoặc đánh giá chuyên môn. Không suy ra năng lực ngôn ngữ từ kết quả game. Không sửa sản phẩm trong lượt review này.

## Phạm vi và cách thử

- Tài khoản seed local, hồ sơ synthetic Local Practice Test Child; Nest/JWKS/PostgreSQL local.
- Vào bài từ Cùng luyện; mở thẻ sai/đúng; chọn hình sai/đúng; kéo vào ô sai/đúng; pause/resume sau từng phần; mở lại và đăng nhập giữa trò ở 390px; chọn quà, kiểm tra album sau reload; phụ huynh ghi nhận cuối phiên.
- Viewport 320/390/768 × 844. Chỉ pointer drag trên Chromium, chưa chứng minh touch/native.
- Evidence từ `practice-word-games-web-smoke.cjs`, `word-games-results.json` và screenshots cùng thư mục. Không dùng thời gian chạy automation làm thời lượng học của trẻ.
- Lượt chạy lại ngày 2026-11-04 đạt ở cả ba viewport: ba trò, sai/thử lại, pause/resume, quà/album và nhận xét cuối phiên; không browser errors hoặc API request trong activity loop. Mở lại giữa trò được chạy ở 390px; `partialProgressSurvivesReload: false` ở 320/768 nghĩa là ca đó không được chạy, không phải phát hiện mất tiến độ.

## Kết luận sử dụng

Có nền tảng để phụ huynh chơi cùng con, nhưng chưa đủ cơ sở kết luận phù hợp rộng rãi với trẻ mục tiêu. Trải nghiệm đang nghiêng về đối chiếu hình và trí nhớ; phần hướng dẫn thao tác và gắn hình với từ còn thiếu. Có thể tiếp tục thử có người lớn hướng dẫn sau khi sửa các điểm ưu tiên dưới đây.

## Phát hiện

| ID    | Ưu tiên                  | Bằng chứng hiện tại                                                                                                                                                                              | Tác động theo góc nhìn phụ huynh                                                                                                                            | Đề nghị và điều kiện xác nhận                                                                                                                                                           |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PU-01 | Cao                      | `WordFindGame.tsx` hiện hình mẫu và lựa chọn; không có canonical audio hay nút nghe từ trong renderer. `announceForAccessibility` là hỗ trợ trình đọc màn hình, không là mẫu audio thông thường. | Con có thể chọn ảnh giống nhau mà không cần hiểu từ “bóng”. Phụ huynh phải tự đọc mẫu; không được hiểu hoàn tất game là đã hiểu/nói được từ.                | Thêm nghe lại từ tiếng Việt đã duyệt, chủ động phát bằng thao tác; parent cue ngắn để gọi tên/chờ đáp lại. Kiểm tra mute, không chồng tiếng, không tự phát khi foreground.              |
| PU-02 | Cao                      | `word-games-find-390.png`, `word-games-match-320.png`: ảnh Gấu gồm cả em bé ôm gấu; silhouette chỉ có gấu. Ảnh Bánh là bánh tròn trên đĩa trong khi silhouette có dạng khuôn/bánh khác.          | Người lớn phải giải thích con cần nhìn vào vật nào; bài ghép hình đòi suy luận ngoài nhiệm vụ chính. Đây là bất nhất quan sát được, chưa đo tỷ lệ trẻ nhầm. | Dùng ảnh một vật nổi bật; bóng khuyết bám hình dáng vật thật trong ảnh. Nhờ người review nội dung kiểm tra từng cặp hình–từ–bóng.                                                       |
| PU-03 | Cao                      | Vào memory hiện ngay 10 thẻ úp; vào matching hiện toàn bộ nguồn/ô, không có demo chạm/kéo. Overview chỉ liệt kê tên ba trò.                                                                      | Phụ huynh lần đầu phải tự khám phá rồi làm mẫu. Icon lá không giải thích cách tìm cặp; con chưa biết kéo có thể chỉ chạm.                                   | Demo một lượt ngắn có thể xem lại, không thêm chữ trên ô; người lớn chọn độ hỗ trợ. Xác nhận bằng quan sát lần đầu dùng, không bằng test biết trước luật.                               |
| PU-04 | Vừa                      | `TodayWordGames.tsx` sau mỗi trò chỉ hiện ngôi sao và mũi tên; sticker được ghi khi chọn hộp ở cuối bài. `giftChoices` có thể đưa lại sticker đã sở hữu.                                         | Phản hồi giữa các trò chưa tạo cảm giác “nhận sticker”; cuối bài có thể nhận lại cùng hình, nhất là album chỉ có 5 mẫu.                                     | Làm rõ thưởng từng trò bằng phản hồi hình ngắn; phân biệt sticker mới/trùng bằng hình, không tạo áp lực hoặc bắt chơi thêm. Kiểm tra với album rỗng và đầy.                             |
| PU-05 | Vừa — giả thuyết cần thử | Bộ mẫu cố định 5 từ, memory 10 thẻ; sai tự úp sau 350ms. Đây là hành vi đúng theo yêu cầu trước, không là regression.                                                                            | Có thể khó nhớ với người học mới; chưa có bằng chứng thực nghiệm để kết luận 10 thẻ/350ms phù hợp cho từng trẻ.                                             | Giữ bộ 5 từ nhưng thử chia lượt 2–3 cặp và mức hỗ trợ do phụ huynh chọn. So sánh trẻ có nhận ra cặp sai, có muốn tiếp tục và cần bao nhiêu trợ giúp. Không tự đổi timing trước khi thử. |

## Những điểm đã thuận lợi

- Board ít chữ, màu dịu; không đếm ngược hay trừ điểm khi làm sai. Sai có thể thử tiếp.
- Các vùng chơi lớn; ở ba viewport kiểm tra không tràn ngang. Chưa đo thao tác ngón tay thật.
- Pause giữ phần đã làm; mở lại không mất hình đã ghép trong ca 390px.
- Kéo sai không bị mất hình nguồn; kéo đúng gắn vào ô. Có cách kích hoạt thay kéo cho assistive access trong code, chưa kiểm chứng TalkBack/VoiceOver.
- Ba hộp quà chọn được; album giữ sau reload/đăng nhập. Chưa có quảng cáo/mua hàng trong board đã thử.
- Nhận xét để cuối phiên và có “Chưa có dịp quan sát”, không tự chuyển đúng game thành đánh giá ngôn ngữ.

## Còn phải thử với người dùng thật

Một buổi ngắn, có đồng ý của phụ huynh, quan sát khả năng hiểu nhiệm vụ lần đầu, nhu cầu làm mẫu, thao tác kéo trên điện thoại, phản ứng khi sai/nhận quà và thời điểm muốn nghỉ. Không ép hoàn tất bài để lấy quà; cho dừng khi trẻ không muốn tiếp tục. Không ghi dữ liệu nhận dạng vào repo. Native reduce motion, screen reader và touch trên thiết bị cấu hình thấp chưa được xác nhận trong lượt này.

## Ảnh và nguồn đối chiếu

- `word-games-memory-320.png`: 10 thẻ, không có demo trực quan.
- `word-games-find-390.png`: hình mẫu và hình Gấu có nhiều chủ thể.
- `word-games-match-320.png`: quan hệ hình–bóng và khay kéo.
- `word-games-restored-progress-390.png`: phần ghép giữ sau mở lại.
- `word-games-boxes-390.png`, `word-games-gift-390.png`: thưởng và album.
- `src/features/practice/WordFindGame.tsx`, `WordMemoryGame.tsx`, `WordMatchingBoard.tsx`, `TodayWordGames.tsx`, `WordGameRewards.tsx`; `src/features/lessonRuntime/LessonSessionScreen.tsx`.

Review không đổi SOT, schema hoặc dữ liệu production; không migration/rollback ứng dụng.

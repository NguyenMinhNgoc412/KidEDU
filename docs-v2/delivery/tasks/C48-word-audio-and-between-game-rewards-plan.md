# C48 — Plan tiếng đọc từ và thưởng giữa trò

Execution update: owner ?? y?u c?u tri?n khai qu? v? sound ho?n th?nh b?i; ph?n n?y ???c th?c hi?n t?i [C49](./C49-reward-choice-and-completion-chime.md). Tr?ng th?i Draft b?n d??i ?p d?ng cho ph?n c?n l?i (audio t?, preset s? th?ch, ch?i gh?p l?i trong album); kh?ng c?n ngh?a to?n b? reward runtime ch?a ???c tri?n khai.

| Thuộc tính  | Giá trị                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------- |
| Trạng thái  | Draft — plan theo yêu cầu owner, chưa triển khai                                             |
| Ngày        | 2026-11-05                                                                                   |
| Implements  | `PRD-ACT-012`, `PRD-MEDIA-*`, `PRD-BR-006..008`, `PRD-UX-*`, `TA-ADR-005..007`, `TA-ADR-024` |
| Depends on  | C40–C47; content/media production, family-media resolver, checkpoint/sync hiện có            |
| Phạm vi đầu | 5 từ Bóng, Gấu, Xe, Bánh, Sữa × 3 trò; sau đó mở rộng 13 presentation games                  |

## 1. Kết quả cần đạt

1. Bé liên hệ được hình với tiếng Việt qua mẫu đọc đúng từ, âm lượng ổn định và có thể nghe lại bằng biểu tượng loa.
2. Xong một trò có phần thưởng nhìn thấy rõ: sticker theo chủ đề hoặc mảnh ghép để hoàn thành tranh, tự vào bộ sưu tập.
3. Hoàn thành → tiếng đọc/phản hồi → bé chọn Mảnh ghép hoặc Sticker → chạm mở một hộp quà → nhận ngẫu nhiên đúng loại → tự sang trò/bài. Phụ huynh không phải xác nhận; nhận xét vẫn chỉ cuối phiên theo C47.
4. Thưởng phản ánh thao tác chơi. Nhận xét ngôn ngữ vẫn do parent sau toàn phiên; không suy rằng chọn/ghép đúng là đã hiểu hoặc nói được từ.

Mọi timing dưới đây là giá trị khởi đầu để thử usability, không phải chuẩn chuyên môn hoặc kết quả đã kiểm chứng.

## 2. Baseline đã kiểm tra

- `WordMemoryGame`/`WordMatchingBoard` đang có hình, feedback và accessibility announcements; announcement không phải canonical audio cho trẻ nghe thông thường.
- `PlayPiece` hiện có `id/label/picture`, chưa có binding từ → audio theo target. Không dùng `label`, tên file hoặc `sample.itemId` để đoán audio: các bài mẫu có metadata cấp bài không đại diện cho mọi hình bên trong.
- `preparePlayIllustrations` chỉ chuẩn bị hình. Cần chuẩn bị cả audio và kiểm readiness trước khi vào game.
- `LearningMediaPlayer` đã dùng `expo-audio`; `PracticeActivityPlayer` tái sử dụng player đó. Kế hoạch tái sử dụng playback/resolver/lifecycle, không tạo player độc lập trong mỗi ô.
- Kiểm kê file audio dưới `assets/` có `kidedu-congratulations.mp3` và fixture ba/mẹ; chưa thấy bộ canonical audio cho đủ 5 từ. File chúc mừng hiện có là effect riêng, chưa mặc nhiên phù hợp làm tiếng thưởng mới.
- `gameRounds`, `gameProgress`, `gameStickers` và album đã có checkpoint. Thực tế mỗi trò mới hiện sao; sticker chỉ claim ở hộp cuối bài. Chưa có receipt cho mỗi lần thưởng giữa trò.
- Settings có `reinforcementEnabled`, `sfxEnabled`; chưa đủ cơ sở coi đã có đầy đủ điều khiển speech/celebration của bộ game mới. C47 chuyển tự động sau feedback khoảng 900ms, sau quà khoảng 1800ms: không giữ timer cố định này nếu nó cắt ngang tiếng đọc.

## 3. Trải nghiệm tiếng đọc từ

### 3.1. Lúc nào đọc

| Tình huống                                    | Hành vi đề xuất                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bắt đầu trò                                   | Chờ thao tác chủ động; không đọc đồng loạt 5 từ. Hướng dẫn hình vẫn chạm để đóng như C44.                                                              |
| Lật đúng một cặp                              | Đọc tên từ một lần khi hai hình đã ghép và còn hiển thị; không đọc hai lần cho hai thẻ cùng từ.                                                        |
| Lật sai                                       | Giữ tự úp 350ms; không thêm tiếng chê hoặc đọc vội khi hình sắp biến mất.                                                                              |
| Kéo đúng hình vào mẫu/bóng                    | Hình gắn vào đích rồi đọc từ tương ứng một lần.                                                                                                        |
| Kéo sai hoặc hủy                              | Hình về nguồn; không đọc đáp án khác, không thêm SFX lỗi.                                                                                              |
| Đang giữ/kéo vật                              | Không bắt đầu tiếng đọc mới; ưu tiên thao tác và scroll lock C46.                                                                                      |
| Chạm biểu tượng loa                           | Nghe lại từ vừa ghép đúng; accessible label nêu rõ từ, không cần chọn hình rồi chọn đáp án. Trước khi có từ phù hợp, nút không phát nội dung đoán sẵn. |
| Đổi trò, pause, background, đổi account/child | Hủy audio/callback cũ, không tự phát lại lúc foreground. Resume bằng thao tác của người dùng; game không tự quay lại từ đầu.                           |

Nguồn ưu tiên theo [family-media resolver](../../product/03-parent-family-media-spec.md): override hợp lệ của đúng child/target/role → default đã duyệt → authored fallback → trạng thái thiếu media. Override phải được chọn/chuẩn bị trước phiên; không xin quyền micro hoặc tải file trong lúc bé chơi.

Đợt sau cho pair/sort sẽ đọc nguồn vừa ghép, ví dụ Cá đưa cho Mèo thì đọc “Cá”; chỉ đọc thêm “Mèo”/câu mẫu nếu có role được soạn riêng. Sentence/scene cần mẫu cụm/câu đúng vai trò, không tự nối audio từ rời hoặc đọc tên icon.

### 3.2. Điều phối âm thanh và chuyển trò

- Một speech channel cho phiên. Không để nhiều tile phát cùng lúc; sự kiện lặp cùng từ không tạo hàng đợi dài. Hủy request đã mất ngữ cảnh thay vì đọc các thao tác cũ sau khi bé sang trò mới.
- Canonical speech ưu tiên trước SFX. Trong lúc đọc, artwork về frame tĩnh; hiệu ứng thưởng không chạy tranh chú ý với mẫu đọc.
- Từ cuối của trò: ghi nhận thao tác → phát từ → khi kết thúc hoặc báo lỗi/timeout hữu hạn → thưởng ngắn → tự chuyển. Auto-advance chờ trạng thái player, không tự tạo các timer rời trong từng component.
- Watchdog đề xuất tối đa 3 giây cho một request canonical word trong pilot; file dài bất thường bị chặn ở content QA. Lỗi decoder hoặc callback không đến không được treo phiên.
- Speech tắt hoặc lỗi thì dùng hình/feedback tĩnh và vẫn tự tiếp tục. Màn pause cho parent thấy trạng thái và thử lại sau; không để bé gặp thông báo kỹ thuật.
- Tách điều khiển `tiếng đọc`, `âm hiệu`, `hiệu ứng thưởng`; reuse settings và theme. SFX mặc định tắt theo baseline. Giảm chuyển động không đồng nghĩa tắt tiếng đọc hoặc mất sticker.
- Screen reader vẫn có tên/trạng thái nhưng tránh đọc trùng canonical voice. Cần kiểm trên VoiceOver/TalkBack; không coi `announceForAccessibility` là player thay thế.

### 3.3. Nội dung 5 từ

| Target | Transcript pilot | Ghi chú hình/ngữ nghĩa                                                                       |
| ------ | ---------------- | -------------------------------------------------------------------------------------------- |
| Bóng   | “Bóng”           | Quả bóng, không đọc tên màu hoặc câu chúc mừng.                                              |
| Gấu    | “Gấu”            | Thống nhất hình gấu bông; review khả năng cần dùng cụm “gấu bông” trước khi chốt transcript. |
| Xe     | “Xe”             | Xe đồ chơi đang dùng trong game.                                                             |
| Bánh   | “Bánh”           | Thống nhất với hình bánh hiện tại.                                                           |
| Sữa    | “Sữa”            | Mẫu thanh điệu rõ, khớp chủ thể ly sữa.                                                      |

Đề xuất thu cùng một người Việt, một accent nhất quán cho pilot; voice/accent cụ thể còn phải chọn và review nghe. Mỗi từ có một bản canonical; không tự sinh biến thể giọng ngẫu nhiên giữa trò.

Theo [Media Production §4/§7/§8](../../product/06-content-media-production-spec.md): master WAV, derivative AAC-LC `.m4a`, transcript/locale/rights/reviewer/hash đầy đủ; normalize theo profile hiện hành rồi human listening trên loa điện thoại. TTS nếu dùng chỉ tạo candidate trong authoring, theo review gate sẵn có. Chưa chọn provider, tạo tài khoản, gọi API hoặc phát sinh chi phí trong plan này.

## 4. Thưởng giữa các trò

### 4.1. Nhịp thưởng

```text
Hoàn thành trò đúng
→ ghi completion và pending reward slot
→ đọc từ cuối nếu đang bật và media sẵn sàng
→ hiện 2 lựa chọn: [Mảnh ghép] [Sticker]
→ bé chọn loại → hiện một hộp đóng → bé chạm mở hộp
→ commit receipt → hiện món ngẫu nhiên đúng loại + đưa vào bộ sưu tập
→ tự sang trò tiếp theo

Hết các trò của bài
→ vẫn có phần thưởng của trò vừa hoàn thành
→ bonus cuối bài dùng cùng bước chọn loại → mở một hộp
→ nhận một lần → tự sang bài/nhận xét cuối phiên
```

- Một phần thưởng mỗi trò, thuộc loại sticker hoặc mảnh ghép; hộp quà là bonus cuối bài và dùng cùng pool phần thưởng. Ba trò có tối đa ba receipt thưởng trò và một receipt quà của bài trong phiên. Không thưởng mỗi lần chạm/kéo.
- Owner correction: hai lựa chọn **1. Mảnh ghép**, **2. Sticker** là hai ô hình lớn (mảnh puzzle/album sticker), chữ ngắn và accessible name. Sau khi chọn hiện **một box quà** để chạm mở; không còn ba hộp và không tự random loại thưởng. Áp dụng cho thưởng giữa trò và bonus cuối bài.
- Bé chủ động thực hiện hai thao tác chọn loại/mở hộp; không cần nút “Nhận”, “Tiếp tục” hoặc xác nhận từ parent. Có thể đổi loại trước khi mở hộp; đã nhận thì không chọn lại hoặc mở lại để lấy thêm.
- Sau mở hộp, hiệu ứng đề xuất 0,8–1,2 giây rồi tự chuyển. Sticker đi vào album; mảnh ghép đi vào vị trí trên tranh xem trước. Không confetti dài, flashing, âm thanh bất ngờ hoặc full-screen chặn thao tác lâu.
- Reduce Motion/celebration off: hiện sticker/mảnh ghép tĩnh ngắn rồi tự chuyển; vẫn được nhận và lưu thưởng. SFX optional chỉ phát sau speech, không dùng âm chúc mừng dài che từ.
- Sai không trừ thưởng, không phá chuỗi, không bắt chơi thêm để bù. Không có hết giờ, mất lượt, tiền ảo, mua hộp hoặc phần thưởng có giá trị giao dịch.
- Album nhỏ cho biết hình vừa nhận; màn album đầy đủ nằm ở hub. Thành tích sưu tập không đổi thành đánh giá ngôn ngữ.

### 4.2. Bộ sưu tập

Owner bổ sung 2026-11-05: hỗ trợ đồng thời **album sticker theo chủ đề** và **mảnh ghép hoàn thành tranh**, có nhiều bộ để nhận ngẫu nhiên. Yêu cầu này thay phương án một album Đồ chơi ở bản plan đầu.

| Dạng bộ    | Trải nghiệm                                                         | Nội dung pilot đề xuất                                               |
| ---------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Sticker    | Nhận hình rời, lưu vào album chủ đề                                 | Động vật, Siêu nhân, Công chúa; đề xuất 6 sticker/bộ                 |
| Tranh ghép | Nhận từng mảnh, tranh dần hiện ra; đủ mảnh lưu bức tranh hoàn chỉnh | Đề xuất 2 tranh gốc, 4 mảnh/tranh; cấu trúc hỗ trợ 6/9 mảnh ở bộ sau |

Số lượng là phương án pilot cần duyệt nội dung, không phải asset đã tạo. Siêu nhân/công chúa dùng nhân vật do KidEDU thiết kế riêng, cùng style Gentle Growth và provenance như các asset khác.

#### Chủ đề theo sở thích

- Gợi ý theo yêu cầu owner: bé trai có thể ưu tiên Động vật/Siêu nhân; bé gái có thể ưu tiên Động vật/Công chúa. Đây là preset gợi ý; phụ huynh có thể bật tất cả, chọn thêm hoặc đổi chủ đề theo sở thích của con.
- Không khóa bộ theo giới tính. Nếu chưa có thiết lập sở thích, dùng pool chủ đề chung; không suy giới tính từ tên/ảnh hoặc bắt nhập thêm thông tin để nhận quà.
- Parent chọn preset/chủ đề trước phiên, không phải chọn lại mỗi lần thưởng. Thay đổi áp dụng ở phiên sau; bộ đã nhận vẫn xem được dù sau đó đổi sở thích.

#### Nhận ngẫu nhiên có quy tắc

- Chuẩn bị pool đủ điều kiện từ các bộ đã phát hành, media sẵn sàng và chủ đề đang bật. Phân phối ngẫu nhiên giữa các bộ, không mặc định chỉ thưởng từ đang học.
- **Bé chọn loại, hệ thống random món bên trong loại đó**. Bỏ đề xuất random 50/50 giữa sticker và mảnh ghép. Chọn Mảnh ghép luôn nhận mảnh; chọn Sticker luôn nhận sticker, không âm thầm đổi sang loại khác.
- Nhánh sticker: chọn ngẫu nhiên bộ trong pool rồi ưu tiên sticker chưa có. Nhánh tranh: ưu tiên một tranh đang ghép để bé có cơ hội hoàn thành; chọn ngẫu nhiên mảnh còn thiếu, xong tranh mới chọn ngẫu nhiên tranh kế tiếp.
- Sticker đã đủ bộ vẫn có thể nhận lại nhẹ nhàng. Nếu toàn bộ tranh đủ mảnh và chưa có bộ mới sẵn sàng, lựa chọn Mảnh ghép hiển thị trạng thái đã hoàn thành và không mở box giả; bé có thể chọn Sticker. Không yêu cầu chơi/mua thêm để bù, không đổi loại thay bé. Chuẩn bị phiên phải kiểm đủ media/pool cho các lựa chọn; lỗi cả hai loại dùng authored fallback hữu hạn, không treo phiên hoặc báo đã nhận món không tồn tại.
- Kết quả random được tạo và lưu trong prepared assignment trước khi chơi, có candidate theo **reward slot + loại**. Đổi loại trước khi mở không random lại candidate. Mở lại/đồng bộ không đổi món; các slot trong cùng prepared session tính cả phần thưởng đã phân bổ cho slot trước để tránh hứa trùng cùng một mảnh.
- Ưu tiên chưa có dựa trên snapshot đã biết. Hai phiên chuẩn bị độc lập trên hai thiết bị có thể cùng chọn một mảnh: sync giữ receipt thật, gộp sở hữu theo piece ID một lần, không đổi quà đã lộ; phiên sau ưu tiên mảnh khác. Không cam kết ngăn trùng tuyệt đối khi các thiết bị chưa sync.

#### Ghép thành tranh

- Mỗi tranh có ảnh hoàn chỉnh, grid/mask được soạn sẵn, ID riêng cho từng mảnh và preview tĩnh rõ phần đã có/còn thiếu. Ưu tiên 2×2 cho pilot; không tự nâng độ khó theo tuổi/giới tính.
- Nhận mảnh thì preview tự gắn mảnh đúng chỗ, không thêm thao tác bắt buộc giữa trò. Đủ mảnh: hiện tranh hoàn chỉnh thay feedback thường, tự tiếp tục trong cùng khoảng thưởng hữu hạn, không xếp chồng nhiều popup.
- Trong hub/bộ sưu tập, bé có thể mở “Ghép tranh” để kéo các mảnh đã có vào bóng khuyết: sai về nguồn, đúng gắn vào đích, giữ scroll lock. Đây là hoạt động tùy chọn; không buộc làm lại để giữ quà hay qua bài học.
- Trạng thái sở hữu mảnh tách khỏi vị trí trong lượt chơi ghép tranh. Reset lượt ghép chỉ reset bố cục chơi, không xóa mảnh hoặc bức tranh đã sưu tập. Chơi album không cấp thêm receipt, không được coi là observation học.
- Bắt đầu lượt chơi ghép tranh áp dụng activation/entitlement guard như game; việc xem bức tranh/mảnh đã nhận vẫn theo quyền dữ liệu gia đình, không biến album thành một learning tier miễn phí vĩnh viễn.

- Item có loại `sticker` hoặc `puzzle_piece`, ID riêng, `collectionId`, version, asset/static fallback, semantic label và provenance; không đồng nhất với ID từ học `item-*`. Mảnh ghép có thêm `puzzleId`, vị trí/mask và tham chiếu ảnh hoàn chỉnh.
- Chuẩn bị reward assignment/các lựa chọn quà cùng snapshot phiên để không đổi quà khi resume hoặc đổi content generation. Ưu tiên sticker chưa có dựa trên snapshot collection lúc chuẩn bị; assignment được chốt và lưu, không chọn lại theo collection đang thay đổi giữa các thiết bị.
- Nếu đã có sticker, hiển thị nhận lại nhẹ nhàng; album vẫn đếm các mẫu duy nhất. Không để trẻ thấy “trượt”, mất quà hoặc phải mua/đổi lượt. Quy tắc duplicate được test khi bộ đã đầy.
- Không tái hiện animation thưởng của mọi receipt cũ sau đăng nhập. Chỉ receipt đang pending feedback có thể hiện lại ngắn, không được cấp thêm sticker.
- Album/lịch sử nhận đã có là dữ liệu của gia đình; subscription hết hạn không khóa việc xem/xuất/xóa. Quyền mở phiên học mới vẫn theo entitlement.
- Asset sticker đã nhận cần quyền hiển thị cosmetic riêng (bundled hoặc catalog versioned phù hợp); không phụ thuộc key của premium lesson đã hết hạn và không cấp lại quyền xem nội dung học. Chốt quyền phân phối/cache ở C48-D.

## 5. Thiết kế kỹ thuật và dữ liệu dự kiến

### Audio

- Versioned content binding: `pieceId → targetId → pronunciationAudioAssetId`, kèm transcript/locale/role/version; validate target thuộc nội dung đã chuẩn bị. Các mô tả trong mục này chưa là tên field API chính thức.
- Prepared activity nhận local resolved assets đã verify, bao gồm family override hợp lệ; dùng resolver/repository chuẩn và quyền nội dung hiện tại. Prepared packs chạy local, không TTS/network trong game loop.
- Tách audio coordinator khỏi `WordMemoryGame`/`WordMatchingBoard`; các renderer phát intent có scope `(account, child, session, activity, step, target)`. Player cũ được reuse ở đúng boundary, không share Prisma model hoặc để screen tự đọc file.
- Readiness: bản luyện nghe yêu cầu audio phải sẵn sàng; variant chỉ chơi hình phải được công bố rõ là fallback, không đánh dấu nội dung nghe đã sẵn sàng khi thiếu tiếng. Lỗi xảy ra giữa phiên có fallback hữu hạn, không phát âm mẫu sai để phủ đủ từ.

### Reward

- Receipt key ổn định theo `(sessionId, activityId, gameKey, rewardSlot)`, scope account/child; một key chỉ một reward assignment có `kind`, item và collection version. Không dùng timestamp hoặc random mới mỗi render làm idempotency key.
- Transaction hoàn tất trò ghi **completion + pending reward slot**, chưa cấp receipt. Chọn loại lưu `selectedKind`/trạng thái box để resume đúng màn; mở hộp mới commit **receipt + ownership + pending reveal** cùng nhau. Chỉ hiển thị “đã nhận” sau commit. Reveal xong clear pending/advance tự động. Kill trước chọn, sau chọn, sau mở đều trở về đúng bước và không grant lần hai.
- Đề xuất optional checkpoint fields cho receipts/pending reward, versioned collection catalog và local journal cho sticker/mảnh ghép. Tiến độ tranh được suy từ tập mảnh duy nhất đã sở hữu; trạng thái chơi ghép tùy chọn tách riêng, không thay nguồn quyền sở hữu. Field names/SQL chỉ chốt ở task contract. Có thể giữ phase `presenting` với pending feedback riêng.
- Backend chỉ validate ownership/schema/catalog assignment, idempotency, merge và lưu cosmetic receipts ở bước sync; không chấm từng thao tác hoặc chạy game engine trên server. Không cần API claim trong activity loop.
- Session/cross-device conflict: cùng receipt key cùng assignment gộp; khác item/loại thì receipt hợp lệ được server chấp nhận đầu tiên giữ nguyên, receipt xung đột reconcile theo kết quả đó và không cộng cả hai. Server kiểm candidate thuộc prepared assignment của đúng loại; không dùng giờ máy client chọn người thắng. Distinct album không giới hạn bởi số checkpoint resume được trả về.
- `gameStickers` cũ được đọc/ánh xạ sang legacy collection, không tự phát sinh ba phần thưởng giữa trò cho các phiên cũ vốn chưa có receipt. Không xóa các sticker gia đình đã nhận.

## 6. Các task triển khai nhỏ

Mỗi task kế thừa Implements ở đầu plan, phải có PR riêng theo boundary khi triển khai. Chưa gộp content + schema + toàn BE/FE thành một thay đổi.

| Task  | Phạm vi và dependency                                                  | Acceptance chính                                                                                             | Test / migration / rollback                                                                                         |
| ----- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| C48-A | Audio content contract + preparation; depends C47                      | Binding target/audio có version, readiness rõ, prepared assets local                                         | Schema/fixture/missing-asset/account scope; optional reader tương thích, rollback tắt binding mới                   |
| C48-B | Thu và duyệt 5 canonical clips; depends A                              | Transcript/voice/rights/hash/reviewer và nghe thiết bị thật đạt                                              | Technical audio validation + human QA; asset immutable, rollback version trước                                      |
| C48-C | Audio coordinator, loa nghe lại, settings và auto-advance; depends A/B | Đúng từ, một channel, speech xong mới chuyển/thưởng, pause/error không treo                                  | Fake player lifecycle/race, rapid actions, mute/timeout, device QA; không SQL thưởng                                |
| C48-D | Reward catalog/receipt protocol và compatibility; depends C47          | Stable assignment/key, bounded payload, legacy mapping và merge rule                                         | Schema/OpenAPI fixtures, old/new client matrix; readers trước writers, feature chưa bật                             |
| C48-E | Local reward journal/checkpoint transaction; depends D                 | Crash/duplicate không mất hoặc grant hai lần, namespace child/account                                        | SQLite rollback/process-kill/low-storage; migration additive, giữ dữ liệu khi rollback                              |
| C48-F | Backend sync/merge/export rewards; depends D/E                         | Ownership/idempotency, phân trang album độc lập resume list, không claim API trong loop                      | Unit/Supertest/PostgreSQL/BOLA/conflict; OpenAPI/generated client, SQL chỉ nếu contract yêu cầu                     |
| C48-G | Feedback giữa trò + nhiều album/preview tranh; depends C/E/F/I         | Chọn Mảnh ghép/Sticker → mở một box → nhận đúng loại → tự tiếp tục; preset đổi được, legacy album còn nguyên | RNTL/browser/native, choice/box/reveal/duplicate/full puzzle/reduce motion; rollback ẩn UI mới, giữ receipt readers |
| C48-H | Mở rộng 13 games và QA cuối; depends C/G/J                             | Audio author theo variant, reward theo episode, parent review chỉ cuối phiên                                 | Regression C43–C47, VoiceOver/TalkBack, expiry/switch/kill, pilot parent-child; rollout theo flag                   |
| C48-I | Author các bộ sticker và tranh/mask pilot; depends D                   | 3 chủ đề sticker, 2 tranh; ID/mảnh/preview/rights/provenance nhất quán                                       | Visual/content QA, schema vị trí/mask; version immutable, rollback catalog                                          |
| C48-J | Ghép tranh tùy chọn trong album; depends E/G/I                         | Kéo sai về nguồn/đúng gắn; reset không mất sở hữu, không grant thêm thưởng                                   | Drag/scroll-lock/persistence/entitlement tests; rollback entry game, giữ mảnh và tranh đã nhận                      |

Thứ tự rollout: **audio 5 từ → receipt/journal/sync có hai loại reward → các bộ pilot/random/preview tranh → ghép tranh tùy chọn → mở rộng catalog và 13 trò**. Không bật UI thưởng mới trước khi local và backend hiểu receipt. Cần estimate sau khi chốt voice và số asset; plan này không cam kết số ngày hoặc ngân sách chưa có dữ liệu.

## 7. Ma trận nghiệm thu

| Ca thử                                                | Kết quả cần thấy                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Ghép đúng Bóng, Gấu, Xe, Bánh, Sữa                    | Đúng tiếng cho từng hình, không đọc một từ chung cho tất cả.                                                      |
| Lật sai, kéo sai, kéo hủy                             | Không cấp thưởng/qua trò; không có tiếng phạt; hình về trạng thái C45.                                            |
| Bé thao tác nhanh/nút loa liên tục                    | Không chồng tiếng hoặc đọc hàng đợi từ trò cũ.                                                                    |
| Đúng từ cuối trò                                      | Nghe trọn request hợp lệ hoặc timeout/fallback, sticker rõ, tự chuyển; parent không bấm.                          |
| Pause/background/foreground trong speech hoặc reward  | Dừng âm/motion; không tự bật âm khi foreground; receipt không cấp lại.                                            |
| Kill trước commit / sau commit / trước advance        | Chưa commit không báo đã nhận; commit rồi còn receipt; resume không grant trùng.                                  |
| Decoder lỗi, mute, thiếu asset, audio-ended không đến | Recovery hữu hạn, không treo phiên; không gọi dịch vụ TTS để vá.                                                  |
| Mất mạng trong prepared lesson                        | Vẫn chơi/nghe/thưởng từ local; sync sau, không hứa mở phiên premium mới không cần activation.                     |
| Hai thiết bị sync lại cùng receipt / khác assignment  | Merge một lần / reconcile có kiểm soát, không nhân đôi album.                                                     |
| Đổi child/account; hết hạn subscription               | Không lẫn tiếng override/receipt, player đóng đúng scope; album đã nhận còn truy cập theo quyền dữ liệu gia đình. |
| SFX tắt, reduce motion, screen reader                 | Canonical voice và điều khiển vẫn dùng được, không bị tiếng announcement/âm hiệu che.                             |
| Hoàn tất cả phiên                                     | Chỉ lúc này mở Parent Gate; parent nhận xét từng bài, game không tạo sẵn kết quả quan sát.                        |

## 8. Điểm cần chốt trước implementation tương ứng

QA collection bổ sung: hai option hình; chọn Mảnh ghép/Sticker luôn random đúng loại; chỉ một box sau chọn; đổi loại trước mở không reroll; mở nhiều lần không grant thêm; kill ở từng bước choice/box/reveal resume đúng bước. Random trong đúng pool preset, loại hết nội dung có trạng thái phù hợp, không bắt khai giới tính, không đổi quà khi resume; không cấp trùng mảnh trong cùng phiên; hai thiết bị sở hữu một mảnh không làm tăng phần trăm hai lần; đủ mảnh hiện tranh hoàn chỉnh; reset giữ sở hữu; album đã nhận còn xem khi hết hạn, game ghép vẫn kiểm quyền.

QA bổ sung trường hợp trình duyệt từ chối phát audio tự động: không treo auto-advance; có loa nghe lại bằng thao tác chủ động và trạng thái parent phù hợp.

- Content owner/reviewer và người thu/voice/accent cho 5 từ; có cần dùng “gấu bông” thay “gấu” hay không.
- Duyệt transcript/asset rights trước khi đánh dấu audio production-ready. Phần mềm có thể dựng fixture trước, nhưng fixture không được tự nhận là đã duyệt chuyên môn.
- Duyệt 3 chủ đề sticker, 2 tranh pilot, số item/mảnh và preset sở thích; thử hai option → một box, random trong loại đã chọn, ưu tiên hoàn tất tranh và phản hồi duplicate trước khi mở rộng catalog.
- Chốt payload/version/migration của reward contract ở C48-D, không thêm field tùy ý vào checkpoint strict schema hiện tại.
- Thử với phụ huynh/trẻ để chỉnh thời lượng nghe/thưởng, mức âm và motion. Không dùng tỷ lệ hoàn tất game làm bằng chứng hiệu quả ngôn ngữ.

## 9. Out of scope và trạng thái thực thi

Đợt lập plan này chỉ thêm tài liệu; chưa tạo audio/sticker, chỉnh FE/BE, chạy migration, gọi provider hoặc phát hành nội dung. Không thêm AI chấm phát âm, loot box trả phí, streak gây áp lực, thông báo push hoặc provider runtime mới. Kiến trúc vẫn theo SOT hiện hành; thay đổi contract/schema sẽ được review và kiểm thử trong từng task triển khai.

# KidEDU v1 Text Wireframes & Reuse Map

Owner C50 amendment 2026-11-06 (`PRD-GAME-003`, `PRD-REWARD-001`): `Back header → board lớn trong màn cố định`, không cuộn/vuốt thoát. Cặp sai tự úp; không nút úp thủ công. `Đủ ba trò → tự lưu/đồng bộ → ACK → chọn loại → bốn hộp → receipt + hiện quà → tự về Trò chơi đã hết lượt`. Chỉ lỗi mạng mới hiện thử kết nối lại; không nút lưu hoặc chơi lại. Các tab dùng cùng chiều rộng responsive, album ưu tiên ảnh đã có; không kéo giãn khoảng cách chỉ để lấp màn hình. Chính sách này thay presentation cũ bên dưới trong phạm vi C50.

> C50 supersedes game/reward/navigation sketches C36–C49 bên dưới. Target: Tập nói | Trò chơi | Bộ sưu tập | Phụ huynh. Game hub: Vào chơi / Tiếp tục / Vào chơi disabled + hết lượt. Ba trò → chọn loại quà → bốn hộp → một món → hoàn tất, không review. Tập nói → Parent Gate → review. AI authoring là v1 theo PRD-CUSTOM-*; quota/quote trước generation, preview trước publish.

C47: `Hoàn thành game → phản hồi ngắn → tự sang trò/bài → hết phiên → Parent Gate → nhận xét từng bài`. Không nút tạo cơ hội/chờ/hoàn tất bài trong board game. Bộ 5 từ tự chuyển các trò, bé chọn quà rồi phiên tự tiếp tục. Xem [C47](../delivery/tasks/C47-automatic-game-course-handoff.md).

C46: giữ vật để kéo sẽ khóa cuộn màn hình tại vị trí hiện tại; thả/hủy/tạm dừng trả lại khả năng cuộn. Vùng ngoài vật vẫn cuộn bình thường. Xem [C46](../delivery/tasks/C46-drag-screen-scroll-lock.md).

C45 supersedes tap-selection in presentation games: nguồn hình kéo trực tiếp vào đích, sai về nguồn, đúng giữ tại đích. Không còn “Chọn Cá/Chó” hoặc “Đặt vào…”; chỉ memory/hunt chạm để lật/mở. Bộ 5 từ: find kéo vào hình mẫu, match kéo vào silhouette, checkpoint giữ qua pause/reopen. Assistive activation là accessibility action riêng. Xem [C45](../delivery/tasks/C45-direct-drag-game-interactions.md).

C44: mỗi trò trong bộ 5 từ bắt đầu bằng modal nền mờ, hình minh họa thao tác và một hướng dẫn ngắn; chạm màn hình để đóng. Board pause trong lúc hướng dẫn. Ảnh mẫu chỉ một đồ vật, 4 frame nhẹ; xem [C44](../delivery/tasks/C44-focused-game-art-and-start-guides.md).

C43: pause/resume keeps partial work within each game. Failed/slow illustration loads use a static silhouette; paused parent panel offers `Thử tải lại hình` while retaining progress. Child board keeps the C42 picture-first layout.

C42: bỏ biểu tượng skip trên board/quà. `Pause → Tiếp tục` hoặc `Để bài này lúc khác` kèm giải thích; nếu chưa chọn hộp thì nêu rõ chưa nhận sticker. Parent review cuối phiên giữ nguyên.

C41 supersedes the C40 child board: picture/logo tiles with no visible word controls, automatic wrong-pair closure, image matching prompt, all silhouette holes above a draggable picture tray, then three pictorial gift boxes and a sticker album. Parent instructions/titles stay in overview/review. Gesture is direct drag; assistive activation remains available. Existing sprite sheets animate once with Reduce Motion/lifecycle controls.

C40: `Chọn bài 5 từ · 3 trò chơi → chuẩn bị → bài với bộ từ hôm nay → lật thẻ tìm cặp → sticker → tìm hình theo từ → sticker → kéo hình vào ô → sticker + hộp quà → bài tiếp theo / nhận xét cuối phiên`. Wrong choices invite retry. The matching board presents one movable image and two candidate destinations at a time, with tap placement as a drag alternative. Parent-only instructions are hidden during this child game board. Cross-session chapters/album remain planned.

C37 parent session editor: `Cùng luyện → Chỉnh sửa bài trong phiên → Parent Gate → Đã chọn N bài → [đưa lên / đưa xuống / bỏ khỏi phiên] trên từng bài → thêm bài từ phần chưa chọn`. Controls also include clear/select-all. Hub and preparation show the saved count/order; an empty list asks parents to add lessons. Active-session snapshot differences are explained on preparation. The learning/review flow remains C36.

| Thuộc tính | Giá trị                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| Trạng thái | `In review`                                                              |
| Owner      | Product Design                                                           |
| Implements | IA và các flow `PRD-PLAN`, `PRD-SES`, `PRD-PROG`, `PRD-MEDIA`, `PRD-SUB` |
| Baseline   | 5 screenshots và UI hiện tại                                             |
| Cập nhật   | 2026-11-05                                                               |

Các wireframe này khóa hierarchy/flow, không khóa pixel. Visual implementation dùng [Design System v2](./02-design-system.md).

## 0. Legacy UI reuse matrix

| Existing reference          | Reuse                                                   | Refactor                                                               |
| --------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `01-home-childmode.JPG`     | child spacing, category tiles, Parent entry             | category grid chuyển thành `Luyện thêm`; Today lesson là primary       |
| `02-Child-Word-List.JPG`    | compact visual list, back/header, completion icon style | list hiển thị lesson/target trong goal, không dùng trạng thái thẻ cũ   |
| `03-child-study-screen.JPG` | illustration + mouth frame + bottom controls            | thêm activity/prompt/wait/observation; bỏ control che vùng miệng       |
| `04-media-upload.JPG`       | rounded form sections, upload affordance                | binding theo child-target-activity-role, staging/cloud/readiness state |
| `05-parent-word-list.JPG`   | Parent visual density, summary/list pattern, bottom tab | dashboard theo plan/progress; bỏ “tổng từ/đã thuộc” card-centric       |

Code primitives và feature foundation tương ứng được liệt kê trong Design System; reuse là có chọn lọc, không copy domain model legacy.

## 1. Today — Child Zone

Navigation hiện tại theo yêu cầu owner ngày 2026-11-03: `Học / Cùng luyện / Phụ huynh`. Cột hai-tab trong các wireframe cũ bên dưới là baseline trước thay đổi; route/guard theo [IA](./01-information-architecture-user-flows.md).

```text
┌──────────────────────────────┐
│ ✦ KidEDU          [avatar]   │
│                              │
│ Hôm nay mình học gì?         │
│ ┌──────────────────────────┐ │
│ │ Mục tiêu: Nói điều con muốn│ │
│ │ 5 hoạt động · khoảng 7 phút│ │
│ │ [illustration]             │ │
│ │       [ Bắt đầu ]          │ │
│ │ ✓ Đã sẵn sàng              │ │
│ └──────────────────────────┘ │
│ [Luyện thêm] [Tiếp tục bài]  │
│                              │
│      Học       Phụ huynh     │
└──────────────────────────────┘
```

Reuse: `Screen`, brand bar, current rounded category/card style, `KidButton`, `MobileTabBar`. Category grid chuyển xuống `Luyện thêm`.

## 2. Lesson overview

```text
┌──────────────────────────────┐
│ ‹ Bài hôm nay                │
│ Mẫu câu “Con muốn…”          │
│ Bài này giúp con yêu cầu     │
│ bằng lời thay vì chỉ tay.    │
│ ┌ Chuẩn bị ────────────────┐ │
│ │ Cốc nước + món con thích │ │
│ └──────────────────────────┘ │
│ Nội dung đã tải: Ready       │
│ [ Hướng dẫn nhanh ]          │
│ [ Bắt đầu cùng con ]         │
└──────────────────────────────┘
```

## 3. Activity — mouth model

```text
┌──────────────────────────────┐
│ ‹   2 / 5       [Tạm dừng]   │
│          UỐNG                │
│ ┌──────────────────────────┐ │
│ │ semantic illustration    │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ mouth video, tap frame   │ │
│ └──────────────────────────┘ │
│ “Chờ con thử nói…”           │
│ [Gợi ý] [Phát lại] [Tiếp]    │
└──────────────────────────────┘
```

Reuse gần trực tiếp screenshot `03-child-study-screen.JPG` và learning components; bỏ overlay play trên miệng, thêm state wait/prompt.

## 4. Activity — vuốt đuôi

```text
┌──────────────────────────────┐
│ ‹   3 / 5       [Tạm dừng]   │
│ [context illustration]       │
│                              │
│ 🔊 “Con mèo kêu…”             │
│          ______              │
│      (khoảng chờ)            │
│ [Gợi ý một phần] [Phát lại]  │
└──────────────────────────────┘
```

Không dùng text blank như bài đọc bắt buộc với trẻ; đường trống chỉ là visual cue nếu test phù hợp.

## 5. Observation sheet

```text
┌──────────────────────────────┐
│ Con vừa thực hiện thế nào?   │
│ [ Độc lập  + ]               │
│ [ Có hỗ trợ  +/- ]           │
│ [ Chưa thực hiện  - ]        │
│ [ Không quan sát được ]      │
│ Gợi ý đã dùng: [chọn mức]    │
│             [ Lưu & tiếp ]   │
└──────────────────────────────┘
```

Sheet dành cho parent; có thể yêu cầu hold/Parent Gate nhẹ theo usability, nhưng không làm chậm mọi activity.

## 6. Parent dashboard

```text
┌──────────────────────────────┐
│ KidEDU      Bé An ▾     ⚙    │
│ Hôm nay: 1 bài · 1 hoạt động │
│ ┌ Tiến độ mục tiêu ────────┐ │
│ │ “Con muốn…” Có hỗ trợ    │ │
│ │ [Xem chi tiết]           │ │
│ └──────────────────────────┘ │
│ Kế hoạch học              ›  │
│ Tiến độ                   ›  │
│ Nội dung gia đình         ›  │
│ Tải xuống & dung lượng    ›  │
│ Gói đăng ký               ›  │
│ Quyền riêng tư & dữ liệu  ›  │
└──────────────────────────────┘
```

Reuse Parent Home list pattern và screenshot `05-parent-word-list.JPG`; bỏ thống kê card-centric “tổng từ”.

## 7. Family media editor

```text
┌──────────────────────────────┐
│ ‹ Cá nhân hóa: “Mẹ”          │
│ Ảnh minh họa                 │
│ [preview] [Chọn ảnh]         │
│ Video khẩu hình              │
│ [preview] [Chọn] [Quay]      │
│ Âm phát âm                   │
│ [preview] [Thu âm]           │
│ Cloud backup: Đã đồng bộ     │
│ [ Lưu thay đổi ]             │
└──────────────────────────────┘
```

Reuse screenshot `04-media-upload.JPG` và `PersonalizedMediaSection`; thêm preview atomic, role/readiness, child scope và cloud status.

## 8. Download/storage

```text
┌──────────────────────────────┐
│ ‹ Tải xuống & dung lượng     │
│ Bài hôm nay       Ready      │
│ Hai bài tiếp      42 MB  68% │
│ Video khẩu hình   120 MB     │
│ Nội dung đã khóa  80 MB [xóa]│
│ Media gia đình    340 MB     │
│ [Dọn cache an toàn]          │
└──────────────────────────────┘
```

Không gộp family media vào nút dọn cache.

## 9. Notification settings — Parent Zone

```text
┌──────────────────────────────┐
│ ‹ Nhắc lịch & thông báo      │
│ Quyền hệ thống: Đã bật       │
│ [Nhắc giờ luyện]          ●  │
│   19:30 · T2–T6       [Sửa] │
│ [Nội dung & đồng bộ]      ●  │
│ [Tài khoản & gói]         ●  │
│ Không làm phiền 21:00–07:00 │
│ [Mở cài đặt điện thoại]      │
└──────────────────────────────┘
```

Permission chỉ được xin sau explanation trong Parent Mode. Tắt permission không khóa app; UI giải thích local/remote class, quiet hours và trạng thái OS thực tế. Không hiển thị child name/progress trong preview notification.

## 10. Bộ học tùy chỉnh AI — v1

Wireframe thuộc v1 theo PRD-CUSTOM-*; manual/AI entry và quota/quote được hoàn thiện tại C50 P7–P9.

```text
┌──────────────────────────────┐
│ ‹ Bộ “Đồ dùng trong bếp”     │
│ 8 target · 6 đã sẵn sàng     │
│ ┌ CÁI CỐC ─────────────────┐ │
│ │ [ảnh] [xem chuyển động]  │ │
│ │ 🔊 Nghe từ · 🔊 Nghe câu  │ │
│ │ Video: [Quay video riêng]│ │
│ │ [Sửa] [Tạo lại ảnh/audio]│ │
│ └──────────────────────────┘ │
│ [Bỏ target lỗi]              │
│ [ Duyệt và tạo bộ tải về ]   │
└──────────────────────────────┘
```

Trước generation có màn quote riêng ghi số target/output, allowance/quota, phí nếu có và retry/refund. Khi chạy, app hiển thị state/progress có thể rời màn; không spinner bắt chờ. Preview có static/reduce-motion mode, transcript và warning “nội dung tùy chỉnh do phụ huynh duyệt”, không lộ provider prompt/error kỹ thuật cho trẻ.

## 11. Locked/paywall handoff

Child thấy card khóa trung tính → `Nhờ phụ huynh mở` → Parent Gate → paywall có price/period/trial/renewal/restore. Không đặt CTA mua trong activity đang chạy.

## 12. Prototype plan

### Cùng luyện — entry độc lập

```text
Cùng luyện
Một mục tiêu nhỏ, một khoảng thời gian bên nhau
┌ Buổi hôm nay ──────────────────┐
│ Goal + tên buổi + lý do       │
│ Chuẩn bị → Cùng thử → Sinh hoạt│
│ [Chuẩn bị / Tiếp tục]         │
│ [Nhờ phụ huynh điều chỉnh]    │
└───────────────────────────────┘
Mỗi buổi mình sẽ…
Mục tiêu đang luyện
[Cập nhật buổi đã lưu]
Học       Cùng luyện       Phụ huynh
```

Trong buổi, command hiển thị các bước làm với đồ thật; choice có hai lựa chọn trực quan; refusal đáp lại ý muốn dừng; transfer mời cùng rời màn hình. Các nút tương tác không tự sinh observation. Ghi nhận/rubric vẫn nằm ở parent handoff.

Prototype clickable nên làm theo thứ tự: onboarding → Today → lesson overview → mouth activity → vuốt đuôi → observation → transfer → parent progress; sau đó media và subscription. Có thể dựng trực tiếp trên component foundation hiện tại thay vì làm một visual system mới.

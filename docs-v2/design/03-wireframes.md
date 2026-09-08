# KidEDU v1 Text Wireframes & Reuse Map

| Thuộc tính | Giá trị                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| Trạng thái | `In review`                                                              |
| Owner      | Product Design                                                           |
| Implements | IA và các flow `PRD-PLAN`, `PRD-SES`, `PRD-PROG`, `PRD-MEDIA`, `PRD-SUB` |
| Baseline   | 5 screenshots và UI hiện tại                                             |
| Cập nhật   | 2026-09-08                                                               |

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

## 10. Post-release concept — Bộ học tùy chỉnh AI

Wireframe này không thuộc prototype/release gate v1; được giữ làm đầu vào phase sau.

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

Trước generation có màn quote riêng ghi số target/output, credit và retry/refund. Khi chạy, app hiển thị state/progress có thể rời màn; không spinner bắt chờ. Preview có static/reduce-motion mode, transcript và warning “nội dung tùy chỉnh do phụ huynh duyệt”, không lộ provider prompt/error kỹ thuật cho trẻ.

## 11. Locked/paywall handoff

Child thấy card khóa trung tính → `Nhờ phụ huynh mở` → Parent Gate → paywall có price/period/trial/renewal/restore. Không đặt CTA mua trong activity đang chạy.

## 12. Prototype plan

Prototype clickable nên làm theo thứ tự: onboarding → Today → lesson overview → mouth activity → vuốt đuôi → observation → transfer → parent progress; sau đó media và subscription. Có thể dựng trực tiếp trên component foundation hiện tại thay vì làm một visual system mới.

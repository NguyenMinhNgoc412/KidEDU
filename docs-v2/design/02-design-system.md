# KidEDU Design System v2 — Gentle Growth

> C50 target update 2026-11-05 — PRD-NAV-001/PRD-GAME-004: reuse MobileTabBar bốn mục và Gentle Growth; nút hết lượt phải disabled + accessible state + lời giải thích, không chỉ opacity. Celebration theo sensory settings, không che stimulus hoặc đè speech.

| Thuộc tính     | Giá trị                                                  |
| -------------- | -------------------------------------------------------- |
| Trạng thái     | `In review`                                              |
| Owner          | Product Design + Mobile                                  |
| Implements     | `PRD-UX-*`, `PRD-ACC-004`, `PRD-ACT-*`                   |
| Sources reused | `src/theme.ts`, components hiện có, 5 screenshots legacy |
| Cập nhật       | 2026-11-05                                               |

## 1. Direction

Giữ ngôn ngữ **Gentle Growth**: tối giản dịu, ấm, xúc giác nhẹ và không mang cảm giác bệnh viện. Child Zone vui nhưng không ồn; Parent Zone chuyên nghiệp nhưng cùng palette/shape.

Legacy `docs/09-design-system-sot.md` có merge-conflict chưa resolve nên không được copy làm SOT. V2 lấy nhánh token đang chạy trong `src/theme.ts` và UI/screenshot đã review làm baseline, sau đó mở rộng cho learning plan/activity mới.

## 2. Product design principles

1. Một mục tiêu chú ý chính trên mỗi màn child.
2. Giao tiếp và khoảng chờ quan trọng hơn hiệu ứng.
3. Mọi status dùng text/icon/shape, không chỉ màu.
4. Parent action nhạy cảm rõ hậu quả và có confirmation.
5. Loading/sync không che nội dung local vẫn dùng được.
6. Không dùng gamification gây áp lực, “sai” màu đỏ trước mặt trẻ hoặc celebration quá mức.

## 3. Color tokens

| Token              | Hex       | Use                            |
| ------------------ | --------- | ------------------------------ |
| `background`       | `#FFFDF2` | nền app ấm                     |
| `surfaceLowest`    | `#FFFFFF` | card nổi/form                  |
| `surface`          | `#FFF1D6` | learning/feature card          |
| `surfaceAlt`       | `#F4F8E8` | nhóm phụ                       |
| `surfaceContainer` | `#EAF3DB` | selected/subtle container      |
| `surfaceHigh`      | `#DDE8CE` | gate/header emphasis           |
| `text`             | `#253126` | text chính                     |
| `muted`            | `#66705C` | text phụ                       |
| `primary`          | `#4F7654` | growth/action chính            |
| `primaryDark`      | `#34583B` | shadow/strong state            |
| `primarySoft`      | `#D9EBCB` | selected/success surface       |
| `secondary`        | `#98572E` | parent/attention action        |
| `secondarySoft`    | `#FFE0C2` | active tab/accent surface      |
| `coral`            | `#E47D45` | child action accent            |
| `danger`           | `#C54949` | destructive parent action only |

Category accent giữ: cyan `#22B8CE`, yellow `#F6D957`, pink `#F064A6`, green `#5CC765`, orange `#F5A24B`. Chỉ dùng trong bounded tiles/illustration; không phủ toàn màn hoặc dùng làm semantic status.

## 4. Typography

Typeface duy nhất: **Plus Jakarta Sans**, weight 400/500/600/700.

| Style          | Size/line       | Use                         |
| -------------- | --------------- | --------------------------- |
| Learning title | 40/48, bold     | target từ/cụm trọng tâm     |
| Screen title   | 26/32, bold     | Parent/Child screen heading |
| Section title  | 24/30, bold     | section nổi bật             |
| Card title     | 18/24, semibold | lesson/goal/card            |
| Body           | 16/24, regular  | hướng dẫn parent            |
| Body strong    | 16/20, semibold | primary labels              |
| Label          | 14/20, semibold | field/status                |
| Caption        | 12/17, semibold | metadata ngắn               |

Không dùng uppercase cho câu hướng dẫn. Target từ đơn có thể uppercase khi usability test xác nhận không làm trẻ/phụ huynh khó đọc.

## 5. Spacing, shape và elevation

- 8px base grid; ngoại lệ token hiện hữu phải quy về named token khi refactor.
- Mobile horizontal padding 18–24px; content max width 460px.
- Radius: 12, 18, 24, 32 và pill.
- Child touch target tối thiểu 56px; control chính 64–80px khi không gây chật.
- Shadow mềm, opacity thấp; border tonal thay shadow nặng.
- Media clip radius 24px, không crop vùng miệng.

## 6. Core components

### Reuse gần nguyên trạng

`AppText`, `Screen`, `Card/PressableCard`, `KidButton`, `MediaContainer`, `MediaPlaceholder`, `MobileTabBar`, `SectionHeader`, `StateMessage`, icon system Lucide và safe-area/layout shell.

### Reuse nhưng refactor semantics

- `LearningItemView` → `ActivityStage` nhận `PreparedActivity`;
- `LearningMediaPlayer` giữ player/control behavior, thêm encrypted local source/entitlement resolver;
- `AutoPlaySessionView/engine` giữ timeline/pause, giới hạn activity được phép;
- `PersonalizedMediaSection` giữ staging/preview, chuyển binding sang child-target-activity-role;
- `Badge` bỏ status `new/practicing/familiar`, dùng readiness/download/observation labels;
- `ChildProgressIndicator` hiển thị vị trí trong session, không biểu diễn năng lực trẻ.

### Component mới

`GameControl` (C42) là control hình trong Child Zone, dùng cùng pressed/disabled tokens với `KidButton`; tên/trạng thái accessible không phụ thuộc chữ nhìn thấy. Layout game dùng `gameSizes` theo 8px trong theme và các radius chuẩn hiện có. Tile đã hoàn tất giữ hình rõ thay vì làm mờ theo trạng thái khóa thao tác.

C50 bóng khuyết (owner correction 2026-11-07): nguồn và bóng dùng chung contour/crop ở frame tĩnh; silhouette tô đặc `colors.primary` trên `surfaceAlt`, không nét đứt bên trong silhouette hoặc chi tiết cảnh nền. Đích vẫn có khung tương tác và accessible label/state; không dùng bóng chung hoặc icon thay đáp án khi thiếu contour. Các trò nghe/chọn/thẻ và illustration học giữ presentation riêng.

C50 nghe chọn: phản hồi overlay gọn trên tile đã chọn, không đổi chiều cao board. Đúng: border primary, check + “Đúng rồi!”, ngôi sao và scale nhẹ khi cho phép khích lệ/chuyển động. Sai: border secondary, biểu tượng thử lại + “Mình thử lại nhé”, opacity pulse nhẹ; không dấu chấm điểm, màu đỏ phạt hoặc shake. 900ms presentation window, input khóa tránh double tap; Reduce Motion/tắt khích lệ giữ cue tĩnh.

- `TodayLessonCard`;
- `GoalProgressCard`;
- `PromptPanel`;
- `ObservationSheet` với bốn lựa chọn;
- `TransferActivityCard`;
- `DownloadStateRow`;
- `EntitlementLock`;
- `ChildSwitcher`;
- `ActivationBlockingState`;
- `ParentHintSheet`.

## 7. Child Zone patterns

- Today-first, một CTA chính.
- Activity chỉ có stimulus, tối đa ba control trực tiếp cần thiết.
- Illustration và mouth video là hai vùng riêng trên mobile; video frame tự là play/pause target, không overlay icon cố định lên miệng.
- Pause session có label riêng.
- Observation UI thuộc parent handoff/sheet, không hiển thị judgement cho child.
- Celebration ngắn, dịu, có thể tắt và không phụ thuộc thành tích.

## 8. Parent Zone patterns

- Settings/list hierarchy, không grid mọi chức năng ngang nhau.
- Search/filter trong target/media/history.
- Form theo section card, validation cạnh field, save state rõ.
- Destructive action dùng danger token, giải thích scope và confirm.
- Subscription, privacy và sync không dùng màu/status mơ hồ.

## 9. Motion và sound

- Reanimated + SVG là stack cho press/transition/prompt/motion semantic; Lottie chỉ cho loop minh họa không tương tác đã version hóa. Không baseline Rive/Skia/Spine.
- Motion 150–250ms cho press/transition; mọi content animation có static/reduce-motion fallback.
- Không parallax/continuous decorative animation trong learning stage.
- Âm mẫu ngôn ngữ có priority; SFX/khen không overlap, tự duck/mute khi speech phát và có toggle.
- Audio target/câu/segment không được ghép/cắt waveform ở UI; player nhận authored asset role từ `PreparedActivity`.
- App background dừng media/timer; foreground không autoplay.

## 10. Responsive

Phone portrait là primary. Tablet giữ max-width cho form/list; activity có thể đặt semantic visual và mouth video cạnh nhau khi đủ chiều rộng. Landscape chỉ support nếu media/activity test được; không stretch card quá rộng.

## 11. Visual QA gate

Mỗi screen cần: normal/loading/empty/error/locked/offline-network-interrupted/large-text/reduce-motion state; contrast và touch-target test; screenshot regression trên phone nhỏ/chuẩn/tablet; kiểm tra không che miệng, không truncate tiếng Việt và không lộ parent action ở Child Zone.

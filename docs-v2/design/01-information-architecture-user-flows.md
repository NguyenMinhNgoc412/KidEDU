# Information Architecture & User Flows

> C50: route map/luồng Cùng luyện bên dưới là baseline cần migrate, không giữ tab Cùng luyện sau cutover. Parent-guided learning chuyển vào Tập nói; game có hub xem được khi hết lượt, CTA disabled theo PRD-GAME-004. Route aliases và session-kind mapping chốt P1/P6.

| Thuộc tính | Giá trị                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Trạng thái | `In review`                                                                                     |
| Owner      | Product Design                                                                                  |
| Implements | `PRD-ACC-*`, `PRD-PLAN-*`, `PRD-SES-*`, `PRD-MEDIA-*`, `PRD-PROG-*`, `PRD-SUB-*`, `PRD-NOTIF-*` |
| Cập nhật   | 2026-11-05                                                                                      |

## 1. Navigation model

Theo PRD-NAV-001: bốn tab Tập nói, Trò chơi, Bộ sưu tập, Phụ huynh. Tập nói giữ goal/progression, media gia đình và transfer; nhận xét từng bài sau phiên qua Parent Gate. Game theo PRD-GAME-* không review; collection theo PRD-REWARD-*. Parent Zone giữ quản lý plan/progress/media/download/subscription/privacy và tạo bộ thủ công/AI paid. Không sensitive action ở Child Zone.

## 2. Route map mục tiêu

```text
Boot
├─ Update required
├─ Login / Sign up / Recover
├─ Consent
├─ Child profile
├─ Goal discovery
└─ Initial plan preparation

Child Zone — Học
├─ Today / Bài hôm nay
│  ├─ Lesson overview + ready/download state
│  ├─ Learning session
│  ├─ Observation handoff
│  └─ Parent-guided transfer
├─ Luyện thêm
│  ├─ Goal/domain
│  └─ Prepared lessons
└─ Continue interrupted session

Parent Gate
└─ Parent Zone
   ├─ Dashboard + child switch
   ├─ Learning plan
   │  ├─ Goal detail
   │  ├─ Reorder/postpone/replace
   │  └─ Recommendation review
   ├─ Progress
   │  ├─ Goal trend
   │  └─ Observation history/edit correction
   ├─ Family content
   │  ├─ Target search
   │  └─ Media role capture/import/preview
   ├─ Downloads & storage
   ├─ Subscription
   ├─ Settings, notifications & accessibility
   └─ Account, consent, export/delete
```

Admin web tách khỏi mobile consumer app: login → content catalog → editor → review → publish/release → operational status.

Entry Cùng luyện được bổ sung bên cạnh cây Học:

```text
/practice                       # hub, buổi được đề nghị, tiếp tục/cập nhật dữ liệu đã lưu
/practice/prepare               # primary goal, props, chuỗi activity và readiness
/practice/session               # runtime theo lessonId, generation tách khỏi Học
Parent Gate → /parent/practice  # goal discovery, chọn/hoãn bài, lịch sử/reason
```

Không truyền media URI hoặc quyền truy cập trong deep link. Chuẩn bị session phải kiểm ownership/entitlement qua backend; đường fixture chỉ dành môi trường local, không thay signed production activation.

## 3. First-run flow

```text
Launch
→ connectivity/version check
→ Login
→ guardian consent
→ create child profile
→ answer observable skill questions
→ choose priority goals/family targets
→ server activation + catalog bootstrap
→ client builds initial plan
→ download first lesson pack
→ Today screen: lesson Ready
```

Yêu cầu UX:

- cho biết lý do mỗi câu hỏi, không tạo cảm giác đang chẩn đoán;
- progress onboarding có thể quay lại trước submit;
- không xin camera/micro/photo permission trong onboarding;
- nếu download chậm, giải thích dung lượng/trạng thái và cho retry;
- không vào learning session trước activation/pack readiness.

## 4. Daily learning flow

```text
Open app
→ small activation/delta handshake
→ Today reads active local generation
→ parent sees goal + duration estimate + required props
→ Start
→ child activity sequence from local
→ parent records observation
→ transfer activity or Finish
→ local checkpoint/outbox commit
→ background sync/prefetch
```

Nếu app vẫn ở memory và grant hợp lệ, foreground quay lại ngay màn hiện tại, không loading toàn bộ. Nếu process bị kill, app đề nghị resume checkpoint sau cold activation.

## 5. Family media flow

Parent Zone → Family content → chọn child/target → chọn media role → permission explanation → import/capture → validation → preview → save local → optional cloud status. Media active cũ chỉ bị thay sau commit. Delete đưa về default và có confirmation.

## 6. Subscription/locked flow

Child chạm lesson locked → thông báo “Cần phụ huynh mở” → Parent Gate → paywall/disclosure → purchase → server reconcile → activation → pack ready → quay lại lesson. Không mở store paywall trực tiếp trong Child Mode.

Hết hạn khi mở app → account/data control vẫn vào được; Today giải thích cần gia hạn; encrypted cache không bị hiển thị như usable.

## 7. Custom library v1 flow

Theo PRD-CUSTOM-* và C50 P7–P9: manual hoặc AI; AI quota/overage policy còn gate, không bắt buộc mua credit trước mọi job.

```text
Parent Zone → Bộ học tùy chỉnh AI
→ tạo/sửa draft và chọn target
→ Parent Gate → xem quota/quote → reserve allowance (mua chỉ nếu add-on được duyệt)
→ generation chạy nền; screen polling có backoff
→ app đóng/mở lại lấy trạng thái bằng delta
→ preview text/audio/image/motion từng target
→ sửa/regenerate/bỏ → approve
→ private pack build/download → parent gắn vào kế hoạch
```

Video riêng được thêm qua family-media editor; không có video thì activity dùng audio + ảnh/motion và không giả readiness khẩu hình. Child Zone không thấy credit, provider error hoặc purchase CTA. Job fail/cancel hiển thị credit release/compensation rõ, không bắt parent đoán.

## 8. Sync/download flow

Download state xuất hiện ở Lesson overview và Parent Downloads:

```text
Not downloaded → Downloading x% → Verifying → Installing → Ready
                       └─ Pause/Retry        └─ Failed + reason
Ready → Update available → update in background → atomic switch
Ready → Locked / Evicted
```

Không đặt spinner toàn màn hình cho background prefetch. Chỉ block khi bài người dùng sắp bắt đầu chưa ready.

## 9. Back/exit behavior

- Back trong activity hỏi parent nếu có unsaved observation; Child Mode dùng control rõ để tránh thoát nhầm.
- Background tự pause, không hiện confirm modal.
- Parent Gate hết validity khi app background lâu hoặc theo security policy, không logout account.
- Deep link vào parent/premium route vẫn chạy gate/activation.

Notification tap khi cold/warm start phải restore đúng account, fetch current state và đi qua Parent Gate; không điều hướng bằng payload detail cũ. Parent settings có permission status, ba nhóm preference, lịch/quiet hours và shortcut mở OS settings khi permission bị tắt.

## 10. Reuse hiện trạng

Giữ component bottom tab, chuyển bốn mục theo PRD-NAV-001; Child category tiles làm entry của `Luyện thêm`, Parent settings-list pattern, header/back conventions và learning control bar. Thay Child Home category-only bằng Today-first; thay `Deck/Word list` bằng goal/lesson/target views mà vẫn reuse card/list primitives.

## 11. IA acceptance

Mọi Must requirement có route/entry point; child không tới purchase/delete/link ngoài; không có route trực tiếp bypass Parent Gate; resume/account switch/locked/download states có đích rõ; navigation test bao phủ deep link và process restore.

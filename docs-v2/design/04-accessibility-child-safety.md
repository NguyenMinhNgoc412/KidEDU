# Accessibility & Child Safety Specification

Owner amendment 2026-11-06 — C50 có Back 56px tại header, chặn swipe/system back để tránh kéo nhầm thoát. Board cố định và hình/thẻ thích ứng diện tích, giữ child target ≥56px. Cặp sai tự úp sau 1,2 giây (2,4 giây khi screen reader), timer hủy khi pause/background/unmount; không phạt. Receipt đã xác nhận hiện quà 2,4 giây rồi tự về Trò chơi; background hủy timer, foreground cho lại đủ thời gian xem. Không phát media khi foreground. Xem `PRD-GAME-003`, `PRD-REWARD-001`; native large-text/VoiceOver/TalkBack vẫn là release QA.

> C50 target update 2026-11-05 — PRD-UX-004 cho phép ngoại lệ quà sưu tập miễn phí PRD-REWARD-001; không paid box/rarity/reroll hoặc quảng cáo lấy lượt. Gender group không hiển thị judgement; drag có assistive alternative; hết lượt có accessible disabled state và thông báo. Privacy AI theo PRD-CUSTOM-006.

| Thuộc tính | Giá trị                                 |
| ---------- | --------------------------------------- |
| Trạng thái | `In review`                             |
| Owner      | Product Design + QA                     |
| Implements | `PRD-UX-*`, `PRD-PRIV-*`, `PRD-ACC-004` |
| Cập nhật   | 2026-11-05                              |

## 1. Accessibility baseline

- Touch target parent tối thiểu 44×44pt; child control ưu tiên 56×56pt trở lên.
- Mọi icon button có accessible name/state/hint; media frame phát/tạm dừng khai báo trạng thái.
- Text/meaning không chỉ bằng màu; observation có label và symbol.
- Parent UI hỗ trợ dynamic type/reflow; không truncate dữ liệu quan trọng.
- Contrast kiểm theo WCAG 2.2 AA cho parent text/control; child visual stimulus không được làm giảm control contrast.
- Focus order theo visual order, modal/sheet trap focus đúng và trả focus khi đóng.
- Reduce Motion/Reduce Transparency và screen reader được kiểm tra trên iOS/Android.

## 2. Sensory safety

- Không flashing nhanh, confetti dài, âm thanh đột ngột hoặc layer âm chồng canonical speech.
- Parent tắt SFX, celebration và giảm motion.
- Session không tự lặp vô hạn; luôn có pause/stop.
- Error cho child trung tính; chi tiết kỹ thuật chỉ cho parent.
- Video mouth giữ đúng aspect/crop và không overlay control lên vùng phát âm.

## 3. Parent Gate

Gate bảo vệ purchase, account, external link, media/delete và Parent Zone. Không dùng câu toán gây loại trừ không cần thiết; ưu tiên hold gesture + instruction hoặc cơ chế store-compliant đã usability test. Gate không thay authentication cho thao tác server nhạy cảm.

Implementation local C11 dùng hold 1,5 giây, hủy khi thả sớm/rời foreground và khóa gate khi app inactive/background. Đây là tham số implementation cần native usability QA, không là xác nhận store compliance hay quyết định TTL mới; xem [C11](../delivery/tasks/C11-child-safety-ui-fixes.md).

## 4. Child privacy/safety

- Không quảng cáo, tracking hành vi để quảng cáo hoặc social sharing.
- Không xin permission khi child tự đi tới màn.
- Camera/micro/photo chỉ sau hành động parent có context.
- Không thu raw recording để analytics.
- Không hiển thị họ tên đầy đủ, email, billing hoặc cloud data trong Child Zone.
- Link pháp lý/support mở sau Parent Gate.

## 5. Language and claims

Không dùng “bình thường/bất thường”, “chữa khỏi”, “đạt chuẩn” hoặc tạo áp lực. Dùng “quan sát”, “đang luyện”, “có hỗ trợ”, “thử lại khi phù hợp”. Disclaimer không được giấu ở terms; xuất hiện ở onboarding/progress context cần thiết.

## 6. Safety QA

Test với VoiceOver/TalkBack, text scale lớn, reduce motion, color-blind simulation, phone nhỏ, một tay, background media, accidental taps và child exploration. Release checklist phải có review Apple Kids/Google Families và privacy declarations dù app được parent điều phối.

# Progress & Observation Specification

> C50 target update 2026-11-05 — PRD-PROG-005: chỉ Tập nói tạo observation. Game không có review/reminder nhận xét và không đưa completion/reward vào mastery. Collection theo PRD-REWARD-003. Giữ lịch sử cũ và session-kind provenance khi migrate; các đoạn C40/C41 dưới đây là implementation baseline.

| Thuộc tính | Giá trị                                     |
| ---------- | ------------------------------------------- |
| Trạng thái | `In review`                                 |
| Owner      | Product + Mobile                            |
| Implements | `PRD-PROG-*`, `PRD-BR-006`, `PB-OUTCOME-05` |
| Cập nhật   | 2026-11-05                                  |

## 1. Nguyên tắc

C41 triển khai album sticker mẫu theo child: nhận một sticker từ hộp quà sau bộ trò, lưu lựa chọn bất biến trong `gameStickers` checkpoint. Album gộp DISTINCT qua toàn bộ phiên local/server, không tự tạo observation/mastery và không mất quyền xem vì expiry. Không có bản đồ chương trong C41.

`PRD-ACT-012`: số trò hoàn tất và sticker/quà là thành tích game, lưu tách khỏi observation. Ghép/chọn/kéo đúng không tự điền `+`/độc lập hoặc kết luận phát âm. Theo PRD-PROG-005, chỉ phiên Tập nói có nhận xét từng bài cuối phiên; game không nhận xét. C40 lưu số trò hoàn tất trong checkpoint của phiên; album/chương xuyên phiên cần task dữ liệu riêng.

Progress phản ánh điều phụ huynh quan sát trong một activity/ngữ cảnh, không phải đánh giá y khoa. Không suy luận năng lực chỉ từ lượt xem, thời gian màn hình hoặc số lần bấm đúng.

## 2. Observation values

| Value          | Label               | Rule                                                         |
| -------------- | ------------------- | ------------------------------------------------------------ |
| `independent`  | Độc lập `+`         | thực hiện theo rubric mà không nhận prompt ngoài natural cue |
| `supported`    | Có hỗ trợ `+/-`     | hoàn thành với verbal/visual/gesture/model prompt            |
| `not_yet`      | Chưa thực hiện `-`  | chưa hoàn thành trong opportunity hợp lệ                     |
| `not_observed` | Không quan sát được | skip, gián đoạn hoặc parent không chắc; không tính là `-`    |

`completed` của UI/session không đồng nghĩa `independent`.

## 3. Observation record

Mỗi record immutable có:

- observation ID/event ID;
- account/family/child;
- goal, target, activity type/instance;
- lesson/content version;
- attempt/session ID;
- result và prompt level cao nhất đã dùng;
- context `in_app` hoặc `parent_guided`;
- client occurred-at, server received-at và timezone display;
- optional parent note đã sanitize/encrypt phù hợp;
- source app/device/schema version.

Correction tạo superseding record/audit relation, không âm thầm sửa lịch sử đã sync.

## 4. Capture UX

- Observation xuất hiện sau opportunity/cụm attempt, không chặn trẻ bằng form dài.
- Parent có thể bật quick-observation mode.
- Child Mode không thấy dấu trừ, score hoặc so sánh.
- Nếu không có parent tham gia, app ghi completion telemetry riêng và để observation `not_observed`.
- Prompt level có thể prefill từ flow nhưng parent xác nhận kết quả.

## 5. Local write và sync

Observation commit SQLite và outbox trong cùng transaction. Server ingest idempotent bằng event ID; duplicate không tạo hai record. Observation append-only được merge không phụ thuộc thứ tự upload. Delete child/account dùng tombstone và privacy workflow.

## 6. Derived progress

Client tính view model từ observation đã sync/local:

- recent distribution theo result;
- mức prompt theo thời gian;
- số ngữ cảnh/stimulus khác nhau;
- lần luyện/quan sát gần nhất;
- recommendation reason;
- confidence về đủ dữ liệu, không phải confidence y khoa.

Không cộng `+`, `+/-`, `-` thành điểm IQ/phần trăm phát triển. Có thể hiển thị xu hướng như “Đang cần ít hỗ trợ hơn” khi rule và sample tối thiểu đã chốt.

## 7. Mastery/recommendation guard

Không đánh dấu “độc lập” lâu dài chỉ từ một record `+`. Quy tắc phải xét lặp lại qua ngày/stimulus/context và khả năng ngoài màn hình. Nếu data mâu thuẫn, ưu tiên tiếp tục quan sát thay vì tăng difficulty tự động.

Numeric threshold thuộc `PRD-TBD-01`; UI phải có wording đúng kể cả trước khi threshold được chốt.

## 8. Parent views

1. **Today:** bài đã làm, observation còn thiếu, transfer suggestion.
2. **Goal detail:** trend theo activity/prompt và target liên quan.
3. **History:** chronological observations, filter context/result.
4. **Next step:** recommendation + lý do + parent accept/postpone.
5. **Data control:** export/delete scope.

Không dùng leaderboard, so sánh trẻ hoặc streak gây áp lực.

## 9. Reuse/migration

Có thể reuse repository/query patterns, session event hooks và Progress screen shell hiện tại. Không migrate `new/practicing/familiar` thành `+`, `+/-`, `-` vì semantics khác; dữ liệu legacy chỉ chuyển thành activity history/view count nếu provenance đủ.

## 10. Acceptance

- process kill sau commit không mất observation;
- duplicate sync không nhân bản;
- `not_observed` không làm giảm trend;
- account/child switch không lẫn dữ liệu;
- content retire không làm mất history;
- export chứa schema/version và giải thích giá trị;
- analytics không gửi note hoặc target tùy chỉnh.

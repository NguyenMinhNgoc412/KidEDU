# AGENTS.md - Quy tắc làm việc cho Codex trong dự án KidEDU

> File này là hướng dẫn bắt buộc cho Codex/AI coding agent khi đọc tài liệu, sửa code, tạo file, cập nhật tài liệu hoặc đề xuất thay đổi trong dự án KidEDU.

---

## 1. Ngôn ngữ giao tiếp

- Luôn trả lời chủ dự án bằng **tiếng Việt đầy đủ**.
- Không trả lời lẫn tiếng Anh, trừ các phần bắt buộc như tên thư viện, tên file, tên biến, tên API, command, log, enum hoặc code identifier.
- Khi tóm tắt thay đổi, nêu rõ bằng tiếng Việt:
  - Đã sửa gì.
  - Sửa ở file nào.
  - Đã chạy kiểm tra gì.
  - Còn gì chưa làm hoặc cần chủ dự án duyệt.
- Không dùng câu trả lời mơ hồ như “đã tối ưu” nếu không nói rõ tối ưu ở đâu và bằng cách nào.

---

## 2. Quy tắc thêm ý tưởng mới

Codex **không được tự ý thêm ý tưởng mới** vào sản phẩm, UI/UX, backend, database, business model hoặc roadmap nếu ý tưởng đó chưa có trong tài liệu hiện tại hoặc chưa được chủ dự án duyệt.

Trước khi thêm bất kỳ ý tưởng mới nào, bắt buộc đi theo quy trình:

```text
Ý tưởng → Hỏi → Giải thích → Chờ duyệt → Mới được thêm vào
```

Cụ thể:

1. **Ý tưởng**: nêu ngắn gọn ý tưởng muốn thêm.
2. **Hỏi**: hỏi chủ dự án có muốn thêm không.
3. **Giải thích**: giải thích vì sao ý tưởng đó hữu ích, ảnh hưởng tới scope, chi phí, kỹ thuật hoặc UX.
4. **Chờ duyệt**: chỉ tiếp tục sau khi chủ dự án đồng ý rõ ràng.
5. **Thêm vào**: sau khi được duyệt mới sửa code/tài liệu.

Ví dụ phải hỏi trước:

- Thêm game, sticker, reward, streak, nhiệm vụ hằng ngày.
- Thêm paywall, subscription, IAP, khóa nội dung.
- Thêm cloud backup video phụ huynh.
- Thêm ghi âm trẻ hoặc AI chấm phát âm.
- Thêm login bắt buộc.
- Thêm analytics nâng cao theo từng trẻ.
- Thêm therapist/B2B.
- Thêm package/dependency lớn.
- Đổi kiến trúc từ local-first sang cloud-first.
- Đổi roadmap phase hoặc đưa tính năng tương lai vào phase hiện tại.

Nếu phát hiện một ý tưởng có vẻ tốt nhưng chưa được duyệt, chỉ được ghi dưới dạng:

```text
Đề xuất cần duyệt: ...
Lý do: ...
Ảnh hưởng: ...
Bạn có muốn thêm không?
```

Không tự implement trước.

---

## 3. Quy tắc đọc tài liệu theo phase

Khi làm phase nào, Codex chỉ đọc tài liệu của phase đó và các tài liệu tổng quát bắt buộc.

### 3.1. Tài liệu tổng quát luôn cần đọc

Luôn đọc file tổng quát trước khi bắt đầu task lớn:

```text
docs/Tong_quat_he_thong_Kidedu.md
```

Nếu repo dùng tên khác, tìm file tổng quát có tên gần giống:

```text
Tong_quat_he_thong_Kidedu.md
tong_quat_he_thong_kidedu.md
thiet-ke-tong-quat-he-thong-kidedu.md
```

### 3.2. Khi làm Phase 0

Đọc folder:

```text
docs/phase0/
```

Bộ tài liệu Phase 0 gồm:

```text
docs/phase0/00-phase0-overview.md
docs/phase0/01-learning-screen-playback.md
docs/phase0/02-parent-video-local.md
docs/phase0/03-navigation-parent-gate.md
```

Nếu task đơn giản, đọc tối thiểu:

```text
docs/phase0/00-phase0-overview.md
```

Nếu task liên quan màn học/playback, đọc thêm:

```text
docs/phase0/01-learning-screen-playback.md
```

Nếu task liên quan video phụ huynh local, đọc thêm:

```text
docs/phase0/02-parent-video-local.md
```

Nếu task liên quan hidden navigation, parent gate hoặc tab Học/Phụ huynh/Cài đặt, đọc thêm:

```text
docs/phase0/03-navigation-parent-gate.md
```

### 3.3. Không đọc/lôi scope phase tương lai nếu không cần

- Không đọc tài liệu Phase 4 khi đang làm Phase 0, trừ khi chủ dự án yêu cầu rõ.
- Không tự đưa game/paywall/subscription vào Phase 0.
- Không tự tạo backend/CMS đầy đủ trong Phase 0 nếu tài liệu Phase 0 chỉ yêu cầu mock/local prototype.

---

## 4. Quy tắc cập nhật tài liệu sau khi sửa code

Sau khi sửa hoặc thêm bất kỳ chức năng nào, Codex phải cập nhật tài liệu tương ứng.

### 4.1. Nếu đang làm một phase cụ thể

Cập nhật cả hai nơi:

1. File module trong folder phase hiện tại.
2. File tổng quát hệ thống.

Ví dụ đang làm Phase 0:

```text
Sửa playback → cập nhật:
- docs/phase0/01-learning-screen-playback.md
- docs/Tong_quat_he_thong_Kidedu.md

Sửa video phụ huynh local → cập nhật:
- docs/phase0/02-parent-video-local.md
- docs/Tong_quat_he_thong_Kidedu.md

Sửa hidden navigation/parent gate → cập nhật:
- docs/phase0/03-navigation-parent-gate.md
- docs/Tong_quat_he_thong_Kidedu.md

Sửa scope/acceptance/seed data Phase 0 → cập nhật:
- docs/phase0/00-phase0-overview.md
- docs/Tong_quat_he_thong_Kidedu.md
```

### 4.2. Cách cập nhật tài liệu

- Không chỉ sửa code rồi bỏ qua tài liệu.
- Không viết tài liệu lệch với code vừa sửa.
- Không cập nhật tài liệu theo ý tưởng chưa được duyệt.
- Nếu thay đổi nhỏ, cập nhật đúng mục liên quan, không rewrite toàn bộ file.
- Nếu tài liệu và code đang mâu thuẫn, ghi rõ trong phản hồi:

```text
Phát hiện mâu thuẫn: ...
Tôi đã sửa theo nguồn ưu tiên: ...
```

### 4.3. Không sửa file backup

Không sửa các file backup như:

```text
*.backup*.md
*.bak
*.old
```

trừ khi chủ dự án yêu cầu rõ.

---

## 5. Thứ tự ưu tiên khi có mâu thuẫn

Khi có mâu thuẫn giữa nhiều nguồn, dùng thứ tự ưu tiên sau:

1. Yêu cầu mới nhất của chủ dự án trong cuộc trò chuyện hoặc issue/task hiện tại.
2. `AGENTS.md`.
3. Tài liệu phase hiện tại, ví dụ `docs/phase0/*`.
4. File tổng quát hệ thống.
5. Code hiện tại trong repo.

Nếu vẫn không chắc, phải hỏi lại chủ dự án trước khi quyết định.

---

## 6. Scope Phase 0 bắt buộc tuân thủ

Phase 0 là prototype để chứng minh concept học bằng khẩu hình.

### 6.1. Được làm trong Phase 0

- 1 chủ đề mẫu.
- 7-10 từ đầu tiên.
- Ít nhất 5 video khẩu hình thật cho phần demo lõi.
- Child Mode learning screen.
- Video/avatar khẩu hình lớn.
- Ảnh minh họa và chữ lớn.
- Play/Replay/Next.
- Playback sequence: lần 1 thường, lần 2 chậm, lần 3 chậm.
- Hidden Navigation Bar.
- Vuốt lên để hiện navigation.
- Tabs: Học, Phụ huynh, Cài đặt.
- Parent/Settings mở bằng giữ 1 giây.
- Video phụ huynh local override cho 1-2 từ.
- Copy video phụ huynh vào app private storage.
- Progress/session summary đơn giản.
- Local state, local JSON hoặc mock data.

### 6.2. Không làm trong Phase 0

- Game.
- Sticker/reward.
- Paywall.
- Subscription/IAP.
- Freemium content locking.
- Backend/CMS production đầy đủ.
- Cloud backup video phụ huynh.
- AI chấm phát âm.
- Ghi âm trẻ.
- Therapist/B2B.
- Avatar realtime.
- Analytics nâng cao.
- Login bắt buộc nếu prototype chưa cần.

Nếu task yêu cầu thứ nằm ngoài Phase 0, phải hỏi lại chủ dự án để xác nhận có muốn đổi scope hay không.

---

## 7. Quy tắc UI/UX cốt lõi

### 7.1. Child Mode

Child Mode là trang chính. Màn trẻ chỉ có các thành phần phục vụ trực tiếp việc học:

- Video/avatar khẩu hình.
- Ảnh minh họa.
- Chữ lớn của từ.
- Play/Replay.
- Next.
- Badge trạng thái nhỏ như `Lần 1/3 · thường`, `Lần 2/3 · chậm`.

Không đặt trực tiếp trong Child Mode:

- Upload/thay video.
- Xóa video.
- Cài đặt tốc độ/số lần phát.
- Báo cáo tiến trình.
- Paywall.
- Game config.
- Đánh dấu chi tiết gây gián đoạn.

### 7.2. Hidden Navigation Bar

- Navigation ẩn mặc định.
- Phụ huynh vuốt lên từ handle nhỏ trong app để hiện navigation.
- Navigation MVP gồm: `Học`, `Phụ huynh`, `Cài đặt`.
- Bấm `Học` quay về Child Mode ngay.
- Bấm `Phụ huynh` hoặc `Cài đặt` phải giữ 1 giây mới mở.
- Khi video đang phát, navigation tự ẩn.
- Không dùng gesture sát mép dưới gây xung đột với iOS/Android system gesture.

### 7.3. Sensory-friendly

- Không nhạc nền trong màn học.
- Không animation nhanh hoặc nhấp nháy.
- Không popup/toast che miệng avatar khi video đang phát.
- Không âm thanh báo sai mạnh.
- Không chấm điểm gây áp lực cho trẻ.
- Ưu tiên giao diện tĩnh, rõ, ít nhiễu.

---

## 8. Quy tắc video phụ huynh local

Với Phase 0 và các phase đầu, video phụ huynh mặc định là **local-only**.

Bắt buộc:

- Không upload video phụ huynh lên cloud mặc định.
- Không chỉ lưu URI/path từ thư viện ảnh.
- Phải copy video vào app private storage.
- Local DB chỉ lưu metadata và `local_file_path`.
- Khi phụ huynh xóa video gốc trong thư viện, video đã lưu trong app vẫn phát được.
- Khi phụ huynh gỡ app hoặc clear app data, video local có thể mất; cần cảnh báo rõ trong UX.
- Khi có custom video local active cho `child_profile_id + word_id`, màn học ưu tiên video local thay vì video mặc định.

Không được thêm cloud backup, signed URL hoặc sync nhiều thiết bị nếu chưa được duyệt.

---

## 9. Quy tắc naming và event

### 9.1. Naming dữ liệu

Dùng thống nhất:

```text
child_profile_id
```

Không dùng lẫn `child_id` cho entity hồ sơ trẻ.

Quy ước:

- Database table: plural snake_case.
- Database column: snake_case.
- TypeScript type/model: PascalCase.
- Event field: snake_case.

Ví dụ:

```text
users
child_profiles
categories
words
learning_events
learning_progress
custom_videos
```

### 9.2. Event Phase 0

Chỉ dùng canonical event names:

```text
word_opened
play_sequence_started
play_sequence_completed
custom_video_saved_local
custom_video_deleted_local
word_status_marked
lesson_started
lesson_completed
review_queue_opened
```

Không tạo event mới nếu chưa được duyệt.
Không dùng tên cũ như:

```text
open_word
play_sequence
finish_sequence
mark_status
```

---

## 10. Quy tắc kỹ thuật khi sửa code

Trước khi sửa:

1. Đọc đúng tài liệu phase/module liên quan.
2. Xác định scope hiện tại.
3. Kiểm tra code hiện tại trước khi chỉnh.
4. Không đổi kiến trúc lớn nếu task không yêu cầu.

Khi sửa:

- Giữ thay đổi nhỏ, đúng task.
- Không refactor lớn ngoài phạm vi nếu không cần.
- Không thêm dependency mới nếu chưa hỏi và được duyệt.
- Không xóa code/tài liệu quan trọng nếu chưa chắc.
- Không hard-code dữ liệu nhạy cảm.
- Không log raw video/audio hoặc dữ liệu trẻ em.
- Không lưu video vào database.
- Không để parent controls lọt vào Child Mode.

Sau khi sửa:

1. Chạy test/lint/typecheck nếu repo có script tương ứng.
2. Nếu không thể chạy test, ghi rõ lý do.
3. Cập nhật tài liệu phase và file tổng quát.
4. Trả lời bằng tiếng Việt, gồm:
   - Tóm tắt thay đổi.
   - Danh sách file đã sửa.
   - Kiểm tra đã chạy.
   - Rủi ro hoặc việc còn lại.

---

## 11. Quy tắc bảo mật và dữ liệu trẻ em

KidEDU xử lý dữ liệu liên quan đến trẻ nhỏ, nên Codex phải ưu tiên an toàn dữ liệu.

Không được tự ý thêm:

- Upload video trẻ/phụ huynh lên cloud.
- Ghi âm trẻ.
- Phân tích giọng nói trẻ.
- Chia sẻ dữ liệu trẻ cho therapist/admin.
- Analytics chi tiết theo trẻ.
- AI/ML dùng dữ liệu video/audio của trẻ.

Nếu cần làm các phần trên, phải hỏi chủ dự án và yêu cầu có:

- Parental consent.
- Retention policy.
- Deletion/export flow.
- Audit log.
- Privacy copy rõ ràng.

---

## 12. Quy tắc phản hồi cuối sau mỗi task

Mọi phản hồi cuối của Codex phải bằng tiếng Việt và theo mẫu:

```text
Đã làm:
- ...

File đã sửa:
- ...

Kiểm tra đã chạy:
- ...

Tài liệu đã cập nhật:
- ...

Lưu ý / cần duyệt thêm:
- ...
```

Nếu có ý tưởng mới chưa được duyệt, đặt ở phần cuối:

```text
Đề xuất cần duyệt:
- Ý tưởng: ...
- Lý do: ...
- Ảnh hưởng: ...
- Bạn có muốn tôi thêm vào không?
```

Không implement đề xuất đó cho tới khi được duyệt.

---

## 13. Nhắc lại các quyết định đã chốt

- Giao tiếp bằng tiếng Việt đầy đủ.
- Phase nào thì đọc folder phase đó.
- Làm/sửa xong phải cập nhật tài liệu trong folder phase và file tổng quát.
- Child Mode là trang chính.
- Navigation ẩn, vuốt lên để hiện.
- Parent Mode và Settings mở bằng giữ 1 giây.
- Parent controls không nằm trực tiếp trên màn trẻ.
- Phase 0 không có game/paywall/subscription.
- Video phụ huynh lưu local trong app private storage, không upload cloud mặc định.
- Dùng `child_profile_id` thống nhất.
- Không thêm ý tưởng mới nếu chưa hỏi và được duyệt.

# KidEDU Phase 0 Overview

> Phiên bản: 1.0  
> Ngày: 2026-06-24  
> Mục đích: File tổng quan ngắn cho Codex khi triển khai Phase 0. Các phần phức tạp được tách sang 3 file riêng: playback, video phụ huynh local, navigation/parent gate.

---

## 1. Mục tiêu Phase 0

Phase 0 dùng để chứng minh concept cốt lõi của KidEDU:

- Trẻ xem video/avatar khẩu hình rõ.
- Trẻ nghe phát âm tiếng Việt.
- Trẻ nhìn hình minh họa và chữ lớn.
- Mỗi từ được phát theo sequence: **thường → chậm → chậm**.
- Phụ huynh có thể thử thay video mặc định bằng video tự chọn/quay cho 1-2 từ.
- App có đánh dấu tiến trình đơn giản nhưng không làm gián đoạn trẻ.

Phase 0 là **prototype**, không phải production app. Ưu tiên chất lượng luồng học hơn số lượng tính năng.

### 1.1. Trạng thái triển khai hiện tại

Prototype Phase 0 hiện được triển khai dạng web tĩnh để có thể mở trực tiếp bằng browser:

```text
index.html
src/styles.css
src/app.js
```

Prototype hiện có Child Mode, Home/topic grid, danh sách từ theo từng topic, màn học chi tiết, playback sequence thường → chậm → chậm, Hidden Navigation Bar, parent gate giữ 1 giây, Parent Mode, Settings, Session Summary/đánh dấu nhanh và video phụ huynh local lưu bằng IndexedDB. UI 4 màn chính đã được cập nhật theo `docs/kidedu-ui-spec.md` và reference `screenshots/home.JPG`, `screenshots/childmode.JPG`, `screenshots/parentmode.JPG`, `screenshots/setting.JPG`; màn vocabulary topic dùng pattern từ `screenshots/vocab.JPG`.

Lưu ý: repo hiện chưa có 5 file video khẩu hình thật. Màn học có asset minh họa local `assets/images/mouth-focus.svg` để kiểm thử visual, nhưng acceptance `P0-02` chỉ đạt hoàn toàn sau khi bổ sung media thật cho ít nhất 5 từ demo lõi. Một số từ gia đình như `Ông`, `Bà`, `Anh`, `Chị` đang là seed demo để kiểm thử vocabulary grid data-driven, chưa thay thế yêu cầu media thật. Khi thêm seed word mới, prototype cần merge progress mặc định với localStorage cũ để tránh trắng màn do thiếu record progress.

---

## 2. Must build trong Phase 0

| Mã | Hạng mục | Yêu cầu Phase 0 |
|---|---|---|
| P0-01 | Bộ nội dung mẫu | 1 chủ đề, 7-10 từ đầu tiên |
| P0-02 | Video khẩu hình thật | Ít nhất 5 video thật, không dùng placeholder cho demo lõi |
| P0-03 | Child Mode | Là màn chính mặc định sau khi vào app |
| P0-04 | Hidden navigation | Vuốt lên để hiện thanh nav; Parent/Settings giữ 1 giây mới mở |
| P0-05 | Category/Word list | Hiển thị chủ đề và danh sách từ bằng card lớn, ít chữ |
| P0-06 | Learning screen | Video lớn, ảnh, chữ lớn, Play/Replay, Next |
| P0-07 | Playback sequence | Lần 1 tốc độ thường, lần 2/3 tốc độ chậm |
| P0-08 | Parent video local | Cho phép thay video local cho 1-2 từ mẫu |
| P0-09 | Progress đơn giản | viewed, imitated, review_needed |
| P0-10 | Session Summary | Tổng kết cuối phiên để phụ huynh chỉnh đánh dấu |

---

## 3. Must not build trong Phase 0

Không triển khai trong Phase 0:

- Backend API production.
- Admin CMS đầy đủ.
- Login bắt buộc.
- Đồng bộ nhiều thiết bị.
- Cloud backup video phụ huynh.
- Therapist access.
- Game.
- Sticker/reward.
- Paywall.
- Subscription/IAP.
- AI chấm phát âm.
- Ghi âm trẻ.
- Avatar realtime.
- Báo cáo tiến trình nâng cao.

Nếu cần placeholder, chỉ tạo stub/TODO. Không implement logic thật cho các module ngoài scope.

---

## 4. Quy tắc sản phẩm bắt buộc

1. **Child Mode là trang chính.** Trẻ không phải đi qua nhiều màn phức tạp.
2. **Màn trẻ không chứa parent controls trực tiếp.** Không upload, không xóa video, không chỉnh tốc độ, không paywall.
3. **Parent Mode và Settings phải qua parent gate.** Vuốt lên hiện nav, bấm/giữ Parent hoặc Settings trong 1 giây mới mở.
4. **Video/miệng là trung tâm.** Video/avatar phải là vùng lớn nhất trong Learning Screen.
5. **Không đánh dấu bắt buộc sau từng từ.** Khi bấm Play, từ `Chưa học` được tự lưu tối thiểu là `viewed` và UI hiển thị `Đã học`.
6. **Video phụ huynh mặc định local-only.** Không upload cloud trong Phase 0.
7. **Không chỉ lưu URI thư viện ảnh.** Video phụ huynh phải được copy vào app private storage.
8. **Không có game/paywall trong Phase 0.** Không tạo UI khóa nội dung hoặc tab game.

---

## 5. Stack giả định cho prototype

Có thể dùng stack khác nếu dự án đang có sẵn, nhưng nếu bắt đầu mới với React Native/Expo:

| Hạng mục | Khuyến nghị Phase 0 |
|---|---|
| Framework | React Native + Expo |
| Video | Expo Video hoặc video player tương đương có hỗ trợ local file + playback rate |
| File local | Expo FileSystem hoặc native file API tương đương |
| Chọn/quay video | Expo ImagePicker hoặc native media picker tương đương |
| Local state | Zustand/local store hoặc React state nếu prototype nhỏ |
| Local persistence | SQLite hoặc AsyncStorage/MMKV cho prototype; SQLite tốt hơn nếu đã chuẩn bị local DB |
| Data source | Local JSON/mock data |
| Backend | Không bắt buộc trong Phase 0 |

---

## 6. Seed data Phase 0

### 6.1. Chủ đề mẫu

```json
{
  "id": "first_words",
  "name": "Từ đầu tiên",
  "description": "Nhóm từ ngắn, gần gũi, dễ quan sát khẩu hình.",
  "sort_order": 1
}
```

### 6.2. Danh sách từ mẫu

| word_id | Từ | Nhóm | Video khẩu hình thật? | Gợi ý khẩu hình |
|---|---|---|---:|---|
| `ba` | Ba | Âm môi/gia đình | Có | Môi khép rồi bật ra cho /b/, miệng mở /a/ |
| `me` | Mẹ | Âm môi/gia đình | Có | Môi khép /m/, mở ngang nhẹ /e/ |
| `be` | Bé | Âm môi | Có | /b/ rõ, miệng mở vừa cho /e/ |
| `bu` | Bú | Âm môi/nhu cầu | Có | /b/ rồi môi tròn /u/ |
| `an` | Ăn | Nhu cầu | Có | Miệng mở vừa, âm ngắn rõ |
| `uong` | Uống | Nhu cầu | Chưa bắt buộc | Môi tròn, kéo dài vừa |
| `di` | Đi | Hành động | Chưa bắt buộc | Miệng kéo ngang nhẹ |
| `ngu` | Ngủ | Sinh hoạt | Chưa bắt buộc | Môi tròn /u/ |
| `bong` | Bóng | Đồ vật | Chưa bắt buộc | Âm /b/ đầu rõ, có thanh sắc |
| `meo` | Mèo | Động vật | Chưa bắt buộc | /m/ đầu rõ, hình minh họa dễ hiểu |

Phase 0 chỉ bắt buộc 7-10 từ. Nếu chưa đủ media thật, vẫn có thể hiển thị từ nhưng không dùng placeholder cho 5 từ demo lõi.

### 6.3. Word object đề xuất

```ts
export type Phase0Word = {
  id: string;
  categoryId: string;
  text: string;
  normalizedText: string;
  imageAsset: string;
  defaultAvatarVideo: string;
  defaultAudio?: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  mouthHint: string;
  tone?: 'ngang' | 'huyen' | 'sac' | 'hoi' | 'nga' | 'nang';
  hasRealMouthVideo: boolean;
};
```

---

## 7. Screens trong Phase 0

### 7.1. Child Mode

Trang chính cho trẻ học.

Hiển thị:

- Chủ đề học.
- Từ gợi ý hoặc danh sách từ.
- Màn học chi tiết khi chọn từ.
- Hidden nav handle ở cạnh dưới.

Không hiển thị:

- Paywall.
- Game.
- Upload/xóa video.
- Báo cáo phức tạp.
- Cài đặt tốc độ trực tiếp trên màn trẻ.

### 7.2. Category List

Phase 0 chỉ có một chủ đề `Từ đầu tiên`.

Yêu cầu UI:

- Card lớn.
- Icon/ảnh rõ.
- Chữ ngắn.
- Không có trạng thái khóa.

### 7.3. Word List

Yêu cầu UI:

- Card từ lớn.
- Ảnh minh họa rõ.
- Chữ lớn.
- Badge trạng thái nhỏ: `Chưa học`, `Đã học`, `Cần ôn`.
- Không có icon khóa/premium.

### 7.4. Learning Detail

Chi tiết ở file: `01-learning-screen-playback.md`.

Tóm tắt:

- Video/avatar lớn nhất.
- Ảnh minh họa.
- Chữ lớn.
- Play/Replay.
- Next.
- Badge trạng thái lượt phát.

### 7.5. Parent Mode placeholder

Phase 0 chỉ cần tối thiểu:

- Từ vừa học.
- Đánh dấu nhanh bằng combo box: chọn bất kỳ từ nào, kể cả `Chưa học`, rồi chọn đánh giá `Bé nhìn`, `Bắt chước`, `Cần ôn`.
- Nút chọn/lưu/xóa video local rõ ràng, không dùng input file mặc định khó nhìn.
- Hướng dẫn ngắn cho phụ huynh.

### 7.6. Settings placeholder

Phase 0 chỉ cần:

- Số lần phát: mặc định 3.
- Tốc độ chậm: mặc định 0.6x.
- Nghỉ giữa lượt: mặc định 1.5s, UI hiển thị theo giây thay vì ms.
- Chế độ ít kích thích: mặc định bật.

### 7.7. Session Summary

Hiện cuối phiên hoặc khi phụ huynh kết thúc phiên.

```text
Hôm nay bé đã học:
1. Ba   [Nhìn] [Bắt chước] [Cần ôn]
2. Mẹ   [Nhìn] [Bắt chước] [Cần ôn]
3. Ăn   [Nhìn] [Bắt chước] [Cần ôn]
```

Quy tắc:

- Không bắt buộc sau từng từ.
- Không phải màn trẻ.
- Nếu chưa đánh dấu, trạng thái mặc định là `viewed`; UI hiển thị là `Đã học`.

---

## 8. Local data model Phase 0

### 8.1. Progress local

```ts
export type Phase0WordStatus = 'not_started' | 'viewed' | 'imitated' | 'review_needed';

export type Phase0LearningProgress = {
  childProfileId: string;
  wordId: string;
  viewCount: number;
  practiceCount: number;
  latestStatus: Phase0WordStatus;
  lastPracticedAt?: string;
};
```

### 8.2. Learning event local

```ts
export type Phase0EventName =
  | 'word_opened'
  | 'play_sequence_started'
  | 'play_sequence_completed'
  | 'custom_video_saved_local'
  | 'custom_video_deleted_local'
  | 'word_status_marked'
  | 'lesson_started'
  | 'lesson_completed';

export type Phase0LearningEvent = {
  eventId: string;
  eventName: Phase0EventName;
  eventVersion: 1;
  childProfileId: string;
  wordId?: string;
  sessionId: string;
  clientTimestamp: string;
  payload?: Record<string, unknown>;
};
```

Quy tắc naming:

- Dùng `childProfileId` trong TypeScript.
- Dùng `child_profile_id` nếu viết SQL/local DB schema.
- Không dùng `childId`/`child_id` trong code mới.

---

## 9. Canonical events cho Phase 0

| Event | Khi nào ghi? | Payload gợi ý |
|---|---|---|
| `lesson_started` | Bắt đầu phiên học | `{ session_id }` |
| `word_opened` | Mở màn học một từ | `{ word_id }` |
| `play_sequence_started` | Bấm Play/Replay | `{ repeat_count, slow_speed, used_custom_video }` |
| `play_sequence_completed` | Phát xong toàn bộ sequence | `{ repeat_count, speeds, used_custom_video, completed: true }` |
| `word_status_marked` | Phụ huynh đánh dấu | `{ status }` |
| `custom_video_saved_local` | Copy video vào app storage thành công | `{ word_id, file_size_bytes, duration_ms }` |
| `custom_video_deleted_local` | Xóa video thay thế trong app | `{ word_id }` |
| `lesson_completed` | Kết thúc phiên học | `{ word_count, statuses }` |

Không dùng event cũ như:

- `open_word`
- `play_sequence`
- `finish_sequence`
- `mark_status`
- `game_correct`
- `purchase_success`

---

## 10. Task breakdown Phase 0

| Thứ tự | Task | File nên đọc |
|---:|---|---|
| 1 | Tạo seed data và mock media path | `00-phase0-overview.md` |
| 2 | Tạo App Shell + Child Mode | `00-phase0-overview.md`, `03-navigation-parent-gate.md` |
| 3 | Hidden Navigation + parent gate giữ 1 giây | `03-navigation-parent-gate.md` |
| 4 | Category List + Word List | `00-phase0-overview.md` |
| 5 | Learning Screen UI | `01-learning-screen-playback.md` |
| 6 | Playback sequence thường → chậm → chậm | `01-learning-screen-playback.md` |
| 7 | Parent video local override | `02-parent-video-local.md` |
| 8 | Progress + Session Summary | `00-phase0-overview.md`, `01-learning-screen-playback.md` |
| 9 | QA states/sensory/error handling | Tất cả 4 file nếu cần |

Trạng thái prototype web tĩnh hiện tại:

| Task | Trạng thái |
|---|---|
| Seed data và mock media path | Đã có 1 chủ đề, 10 từ, đường dẫn media local dự kiến |
| App Shell + Child Mode | Đã có trong `index.html` + `src/app.js` |
| Hidden Navigation + parent gate | Đã có vuốt/bấm handle, nav ẩn, giữ 1 giây |
| Category List + Word List | Đã có Home topic grid và vocabulary grid data-driven theo `topicId`; title, danh sách từ và learned star lấy từ topic/progress |
| Learning Screen UI | Đã có video stage lớn, ảnh, chữ, Play/Replay/Next |
| Playback sequence | Đã có sequence 3 lượt, tốc độ 1.0x rồi 0.6x |
| Parent video local override | Đã có chọn file video, lưu Blob vào IndexedDB, ưu tiên phát local |
| Progress + Session Summary | Đã có local progress, đánh dấu nhanh dạng combo box trong Parent Mode; combobox cho phép đổi cả từ `Chưa học` sang trạng thái đã học |
| Video khẩu hình thật | Chưa có asset thật trong repo; cần bổ sung để hoàn tất acceptance |

---

## 11. Acceptance criteria Phase 0

Phase 0 đạt nếu:

1. Có 1 chủ đề mẫu.
2. Có 7-10 từ mẫu.
3. Có ít nhất 5 video khẩu hình thật cho phần demo lõi.
4. Màn học phát được sequence: lần 1 thường, lần 2 chậm, lần 3 chậm.
5. Có hình minh họa và chữ lớn cho từng từ.
6. Child Mode không hiển thị parent controls trực tiếp.
7. Hidden navigation vuốt lên mới hiện.
8. Parent Mode/Settings mở bằng giữ 1 giây.
9. Có thao tác thay video phụ huynh cho ít nhất 1-2 từ mẫu.
10. Video phụ huynh được copy vào app private storage, không chỉ lưu URI gallery.
11. Xóa video gốc trong thư viện không làm mất video đã copy trong app.
12. Không đánh dấu sau từng từ vẫn tự lưu `viewed` khi bấm Play và UI hiển thị `Đã học`.
13. Có Session Summary cuối phiên.
14. Không có game, paywall, subscription, cloud backup, therapist access, AI scoring.

---

## 12. Prompt mẫu cho Codex

```text
Read only these docs:
- docs/phase0/00-phase0-overview.md
- docs/phase0/<relevant-module-file>.md

Task:
<task cụ thể>

Constraints:
- Phase 0 only.
- Do not implement game/paywall/subscription/cloud backup/therapist access.
- Keep Child Mode clean: no parent controls directly in child learning screen.
- Use childProfileId in TypeScript and child_profile_id in DB/schema.
- Use canonical Phase 0 event names only.
```

---

## 13. Ghi chú responsive layout

Prototype web tĩnh dùng viewport 390px làm mốc thiết kế cho các reference Stitch, nhưng không khóa app ở 390px. App shell cần dùng `width: 100%`, `max-width: 430px`, `min-height: 100dvh`, padding fluid và safe-area cho bottom navigation để tránh tràn ngang, tránh bottom nav che nội dung.

Khi test Phase 0, cần kiểm tra tối thiểu ở 320px, 360px, 390px, 430px và 768px. Các màn Home, Child Learning, Parent Mode và Settings phải tự co giãn bằng grid/flex, `clamp()`, `min-height` và `width: 100%`; không dùng `zoom` hoặc kích thước export của Stitch làm layout thật.

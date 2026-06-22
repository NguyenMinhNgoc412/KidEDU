# KidEDU Frontend Workflow Chuẩn

## 1. Mục tiêu frontend

Frontend của KidEDU cần phục vụ 2 nhóm người dùng khác nhau:

```text
1. Trẻ em
   -> Cần giao diện cực kỳ đơn giản, nút lớn, ít chữ, ít lựa chọn.

2. Phụ huynh / người chăm sóc
   -> Cần cấu hình bài học, xem tiến độ, quay video mẫu riêng, quản lý dữ liệu.
```

Nguyên tắc quan trọng nhất:

```text
Child Mode phải đơn giản hơn Parent Mode rất nhiều.
```

Trẻ không nên nhìn thấy quá nhiều menu, biểu đồ, cài đặt, upload, tài khoản hoặc thông báo hệ thống. Trẻ chỉ cần thấy:

- Hình lớn
- Nút lớn
- Âm thanh rõ
- Video khẩu hình rõ
- Phản hồi đơn giản
- Một hành động chính trên mỗi màn hình

---

## 2. Scope MVP frontend

MVP nên tập trung vào trải nghiệm học tại nhà, chưa cần làm app quá phức tạp.

### 2.1 Có trong MVP

- Màn hình chọn hồ sơ trẻ
- Child Mode cho trẻ học
- Parent Mode cho phụ huynh quản lý
- Danh mục bài học
- Danh sách từ / thẻ học
- Màn hình học 1 từ
- Phát video mẫu hệ thống
- Phát video phụ huynh nếu đã quay
- Quay / chọn video phụ huynh và lưu local-first
- Cache video mẫu để học offline
- Ghi nhận tiến độ học cơ bản
- Dashboard đơn giản cho phụ huynh
- Export báo cáo đơn giản dạng ảnh/PDF trong tương lai gần

### 2.2 Không nên có trong MVP

- Tài khoản đăng nhập cho trẻ
- Role chuyên gia trị liệu
- Dashboard chuyên gia riêng
- Mạng xã hội / chia sẻ công khai
- Chat cộng đồng
- Quảng cáo trong Child Mode
- Popup mua gói trong Child Mode
- Quá nhiều game hóa gây mất tập trung
- AI phức tạp ngay từ bản đầu tiên

Ghi chú về chuyên gia: nếu phụ huynh muốn chuyên gia xem tiến độ, phụ huynh chỉ cần mở Parent Dashboard hoặc xuất báo cáo để chuyên gia xem trong buổi tư vấn. Frontend MVP không cần màn hình riêng cho chuyên gia.

---

## 3. Nguyên tắc thiết kế giao diện cho trẻ

### 3.1 Giao diện tối giản

Mỗi màn hình của trẻ chỉ nên có 1 mục tiêu chính.

Ví dụ:

```text
Màn hình chọn chủ đề
-> Chọn 1 chủ đề

Màn hình chọn từ
-> Chọn 1 hình

Màn hình học
-> Nhìn hình, nghe từ, xem khẩu hình, bấm lặp lại
```

Không nên để trẻ nhìn thấy:

- Nhiều icon nhỏ
- Nhiều dòng chữ dài
- Nhiều nút phụ
- Menu phức tạp
- Form nhập liệu
- Biểu đồ
- Cài đặt

### 3.2 Button phải lớn

Kích thước đề xuất:

```text
Primary button: cao 72-96px
Card học từ: 140-180px mỗi cạnh
Icon chính: 48-72px
Touch target tối thiểu: 64x64px
Khoảng cách giữa các nút: 16-24px
```

Với trẻ chậm nói, trẻ ASD hoặc trẻ vận động tinh chưa tốt, nút nhỏ rất dễ gây bấm nhầm và làm trẻ mất tập trung.

### 3.3 Ít chữ, ưu tiên hình ảnh

Nên dùng:

```text
Ảnh / icon lớn
Một từ ngắn
Âm thanh đọc rõ
Màu sắc ổn định
```

Ví dụ card tốt:

```text
[ Ảnh con chó rất lớn ]
        Chó
```

Không nên:

```text
Con hãy nhấn vào đây để học phát âm từ con chó cùng với video hướng dẫn khẩu hình.
```

### 3.4 Không làm trẻ bị quá tải

Tránh:

- Animation quá nhanh
- Âm thanh bất ngờ quá lớn
- Nhấp nháy liên tục
- Nhiều phần thưởng cùng lúc
- Màu quá gắt
- Màn hình quá nhiều thông tin

Nên dùng phản hồi nhẹ:

```text
Đúng rồi
Giỏi lắm
Thử lại nhé
Con nghe lại nhé
```

### 3.5 Không để trẻ thoát app dễ dàng

Trong Child Mode, các nút như:

- Cài đặt
- Dashboard
- Mua gói
- Upload video
- Xóa dữ liệu
- Đăng xuất

phải nằm sau Parent Gate.

Parent Gate có thể là:

```text
Bản demo hiện tại: bấm nút Phụ huynh để vào ngay
Bản production nếu cần khóa lại: giữ nút 3 giây hoặc trả lời phép tính đơn giản
```

Ghi chú cho bản Web/PWA demo hiện tại: theo yêu cầu mới, nút `Phụ huynh` mở Parent Mode ngay bằng một lần bấm để phụ huynh test nhanh, không yêu cầu nhập mã PIN. Nếu sau này muốn khóa lại bằng PIN, giữ nút hoặc phép tính, cần hỏi người dùng trước khi thêm lại.

---

## 4. Kiến trúc frontend tổng quan

```text
KidEDU App
   |
   |-- Child Mode
   |   |-- Home trẻ
   |   |-- Chọn chủ đề
   |   |-- Chọn từ
   |   |-- Màn hình học
   |   |-- Màn hình giao tiếp nhanh
   |
   |-- Parent Mode
   |   |-- Hồ sơ trẻ
   |   |-- Quản lý bài học
   |   |-- Quay video phụ huynh
   |   |-- Dashboard tiến độ
   |   |-- Cài đặt
   |
   |-- Local Services
   |   |-- Local DB
   |   |-- Local media storage
   |   |-- Offline queue
   |   |-- Cache video mẫu
   |
   |-- API Client
       |-- Auth API
       |-- Child Profile API
       |-- Content API
       |-- Learning Event API
       |-- Media Sync API optional
```

---

## 5. Đề xuất stack frontend

Vì demo hiện tại đang ở dạng React/TSX, có thể đi theo 1 trong 2 hướng:

### 5.1 Mobile-first

Phù hợp nhất cho KidEDU.

```text
React Native / Expo
TypeScript
Expo Router hoặc React Navigation
Zustand cho app state đơn giản
TanStack Query cho API cache
Expo AV hoặc expo-video cho phát video/audio
Expo FileSystem cho local video/cache
Expo SQLite hoặc WatermelonDB cho local database
MMKV cho setting nhỏ
NativeWind hoặc StyleSheet cho UI
```

### 5.2 Web/PWA-first

Phù hợp nếu muốn test nhanh trên trình duyệt.

```text
Next.js / React
TypeScript
Tailwind CSS
IndexedDB cho local data
Cache Storage API cho media cache
Service Worker cho offline
```

Khuyến nghị sản phẩm:

```text
MVP nghiêm túc cho trẻ dùng hằng ngày: React Native / Expo.
Demo bán ý tưởng nhanh: Web/PWA.
```

---

## 6. Cấu trúc thư mục đề xuất

```text
src/
  app/
    child/
      home.tsx
      categories.tsx
      words.tsx
      lesson.tsx
      communication.tsx
    parent/
      dashboard.tsx
      child-profile.tsx
      content-settings.tsx
      parent-videos.tsx
      settings.tsx
    onboarding/
      index.tsx

  components/
    child/
      BigButton.tsx
      BigCard.tsx
      WordCard.tsx
      LessonPlayer.tsx
      RewardOverlay.tsx
      ParentGate.tsx
    parent/
      DashboardCard.tsx
      ProgressChart.tsx
      VideoPicker.tsx
      ReportPreview.tsx
    common/
      AppHeader.tsx
      SafeScreen.tsx
      LoadingState.tsx
      EmptyState.tsx
      ErrorState.tsx

  features/
    lessons/
      lesson.machine.ts
      lesson.service.ts
      lesson.types.ts
    media/
      localMedia.service.ts
      mediaCache.service.ts
      mediaSync.service.ts
      videoCompression.service.ts
    progress/
      progress.service.ts
      learningEvents.service.ts
    profile/
      childProfile.service.ts

  storage/
    localDb.ts
    mmkv.ts
    offlineQueue.ts

  api/
    client.ts
    auth.api.ts
    content.api.ts
    progress.api.ts
    media.api.ts

  theme/
    colors.ts
    spacing.ts
    typography.ts
    radius.ts

  types/
    child.ts
    lesson.ts
    media.ts
    progress.ts
```

---

## 7. Navigation chuẩn

Frontend nên tách rõ 2 khu vực:

```text
Child Mode
Parent Mode
```

### 7.1 Flow vào app

```text
Open App
   |
   |-- Có hồ sơ trẻ chưa?
   |      |-- Chưa -> Parent Onboarding
   |      |-- Rồi -> Chọn hồ sơ trẻ hoặc vào thẳng Child Home
   |
   |-- Child Home
```

### 7.2 Child Mode navigation

```text
Child Home
   |
   |-- Học từ
   |      |-- Chọn chủ đề
   |      |-- Chọn từ
   |      |-- Lesson Player
   |
   |-- Giao tiếp nhanh
   |      |-- Thẻ nhu cầu
   |      |-- App đọc câu
   |
   |-- Nghe lại bài yêu thích
```

Child Mode nên có rất ít tab. Đề xuất MVP chỉ cần:

```text
[Học] [Con muốn] [Yêu thích]
```

Nếu vẫn quá nhiều, MVP chỉ cần:

```text
[Học hôm nay]
[Con muốn]
```

### 7.3 Parent Mode navigation

```text
Parent Gate
   |
   |-- Dashboard
   |-- Hồ sơ trẻ
   |-- Video của phụ huynh
   |-- Nội dung học
   |-- Cài đặt
```

---

## 8. Luồng onboarding phụ huynh

### 8.1 Mục tiêu

Onboarding chỉ hỏi những thông tin cần thiết để bắt đầu học.

Không nên hỏi quá nhiều vì phụ huynh đang cần thử app nhanh.

### 8.2 Flow đề xuất

```text
Welcome
   |
   |-- Tạo hồ sơ trẻ
   |      |-- Tên gọi ở nhà / nickname
   |      |-- Năm sinh hoặc độ tuổi
   |      |-- Mức giao tiếp hiện tại
   |
   |-- Chọn mục tiêu ban đầu
   |      |-- Bắt chước âm
   |      |-- Từ đầu tiên
   |      |-- Nhu cầu cơ bản
   |      |-- Giao tiếp xã hội
   |
   |-- Chọn thời lượng học mỗi ngày
   |      |-- 5 phút
   |      |-- 10 phút
   |      |-- 15 phút
   |
   |-- Vào Child Home
```

### 8.3 Thông tin hồ sơ trẻ

```typescript
type ChildProfile = {
  id: string;
  nickname: string;
  birthYear?: number;
  ageMonths?: number;
  communicationLevel: 'non_verbal' | 'single_words' | 'two_word_phrases' | 'simple_sentences';
  learningGoal: 'imitate_sounds' | 'first_words' | 'basic_needs' | 'social_words';
  dailyGoalMinutes: 5 | 10 | 15;
  createdAt: string;
  updatedAt: string;
};
```

---

## 9. Child Home chuẩn

### 9.1 Mục tiêu màn hình

Đây là màn hình chính cho trẻ. Màn hình này phải cực kỳ đơn giản.

### 9.2 Layout đề xuất

```text
--------------------------------
Xin chào, Bống

[ HỌC HÔM NAY ]

[ CON MUỐN ]

[ NGHE LẠI ]

                    [Parent Gate]
--------------------------------
```

### 9.3 Quy tắc UI

- Tối đa 2-3 nút lớn
- Mỗi nút cao 88-120px
- Icon rất lớn
- Không dùng nhiều chữ
- Không hiển thị dashboard ở đây
- Không hiển thị số liệu phức tạp
- Nút Parent Gate nhỏ hơn, đặt ở góc, cần giữ lâu mới mở

### 9.4 Component mẫu

```typescript
type BigChildButtonProps = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
};
```

---

## 10. Màn hình chọn chủ đề

### 10.1 Mục tiêu

Trẻ hoặc phụ huynh chọn nhóm bài học.

### 10.2 Chủ đề MVP đề xuất

```text
1. Gia đình
2. Ăn uống
3. Đồ chơi
4. Động vật
5. Nhu cầu cơ bản
6. Chào hỏi
```

Không nên mở quá nhiều chủ đề ngay từ đầu. Với trẻ, quá nhiều lựa chọn làm trẻ khó chọn.

### 10.3 Layout

```text
[ Gia đình  ] [ Ăn uống ]
[ Đồ chơi  ] [ Động vật]
[ Con muốn ] [ Chào hỏi]
```

### 10.4 Quy tắc

```text
Grid: 2 cột
Card: 150-180px
Ảnh/icon lớn
Label 1-2 từ
```

---

## 11. Màn hình chọn từ

### 11.1 Mục tiêu

Chọn 1 từ để học.

### 11.2 Layout

```text
Chủ đề: Gia đình

[ Ảnh Ba ]    [ Ảnh Mẹ ]
   Ba            Mẹ

[ Ảnh Ông ]   [ Ảnh Bà ]
   Ông           Bà
```

### 11.3 Card từ vựng

Card nên có:

```text
Ảnh lớn
Từ ngắn
Icon video phụ huynh nếu có
Icon đã học nếu đã hoàn thành
```

Không nên có:

```text
Mô tả dài
Điểm số phức tạp
Button phụ nhỏ
```

### 11.4 State card

```typescript
type WordCardState = {
  wordId: string;
  label: string;
  imageUrl: string;
  hasSystemVideo: boolean;
  hasLocalParentVideo: boolean;
  hasCloudParentVideo: boolean;
  learnedToday: boolean;
  masteryLevel: 'new' | 'practicing' | 'familiar' | 'mastered';
};
```

---

## 12. Màn hình học 1 từ

Đây là màn hình quan trọng nhất của KidEDU.

### 12.1 Mục tiêu

Trẻ nhìn hình, nghe từ, xem khẩu hình và bắt chước.

### 12.2 Layout tối giản

```text
--------------------------------
              Mẹ

        [ Ảnh / Video lớn ]

        [ NÚT PHÁT LẠI ]

   [Con nói được] [Cần luyện thêm]

--------------------------------
```

Với trẻ, chỉ nên có 1 nút chính thật lớn:

```text
[ NGHE LẠI ]
```

Các nút đánh giá nên dành cho phụ huynh, có thể hiện sau khi bài học kết thúc.

### 12.3 Lesson Player state machine

```text
idle
  |
  |-- press play
  v
show_image_and_audio
  |
  v
play_video_normal_speed
  |
  v
pause_for_child_response
  |
  v
play_video_slow_speed
  |
  v
pause_for_child_response
  |
  v
play_video_slow_speed_again
  |
  v
done
  |
  v
reward_or_next_word
```

### 12.4 Quy tắc phát video

Mặc định:

```text
Lần 1: tốc độ thường
Lần 2: tốc độ chậm
Lần 3: tốc độ chậm
```

Nếu trẻ dễ mất tập trung:

```text
Lần 1: chỉ phát 1 lần
Sau đó hiện nút Nghe lại
```

Không nên auto-repeat quá nhiều làm trẻ bị quá tải.

### 12.5 Ưu tiên video nào?

```text
1. Video phụ huynh local
2. Video phụ huynh cloud synced nếu có
3. Video mẫu hệ thống đã cache
4. Video mẫu hệ thống online
```

Nếu phụ huynh tắt công tắc video phụ huynh trong Cài đặt, app bỏ qua video phụ huynh local và dùng video mẫu của app. Nếu bật công tắc nhưng từ hiện tại chưa có video phụ huynh hoặc blob local bị mất/lỗi đọc, app vẫn fallback sang video mẫu của app.

Logic:

```typescript
function resolveLessonVideo(wordId: string, preferParentVideo: boolean) {
  if (preferParentVideo && localParentVideoExists(wordId)) return 'local_parent_video';
  if (cloudParentVideoExists(wordId)) return 'cloud_parent_video';
  if (cachedSystemVideoExists(wordId)) return 'cached_system_video';
  return 'system_video_online';
}
```

---

## 13. Luồng quay video phụ huynh

### 13.1 Nguyên tắc

Video phụ huynh phải là local-first.

```text
Phụ huynh quay video
   -> App lưu trên thiết bị
   -> Không tự động upload cloud
   -> Metadata lưu local DB
   -> Nếu phụ huynh bật đồng bộ, app mới upload cloud private
```

### 13.2 Flow

```text
Parent Mode
   |
   |-- Video của phụ huynh
   |-- Chọn từ cần quay
   |-- Xem hướng dẫn quay
   |-- Quay video
   |-- Xem lại
   |-- Lưu trên thiết bị
   |-- Gắn video vào từ đó
```

### 13.3 Hướng dẫn quay trong UI

Trước khi quay, app nên nhắc phụ huynh:

```text
- Đưa mặt gần camera
- Nhìn rõ miệng
- Nói chậm
- Nói 1 từ hoặc 1 câu ngắn
- Video 2-5 giây là đủ
- Tránh nhạc nền hoặc tiếng ồn
```

### 13.4 Local video metadata

```typescript
type ParentVideo = {
  id: string;
  childId: string;
  wordId: string;
  localUri: string;
  cloudUri?: string;
  syncStatus: 'local_only' | 'pending_upload' | 'synced' | 'sync_failed';
  durationSeconds: number;
  fileSizeBytes: number;
  createdAt: string;
  updatedAt: string;
};
```

### 13.5 Màn hình quản lý video phụ huynh

```text
Video của phụ huynh

[ Mẹ ]       Đã có video local     [Xem] [Quay lại]
[ Ba ]       Chưa có video         [Quay]
[ Uống nước] Đã có video local     [Xem] [Quay lại]
```

Nút xóa video phải nằm sau xác nhận rõ ràng:

```text
Bạn có chắc muốn xóa video này khỏi thiết bị không?
```

---

## 14. Luồng cache video mẫu hệ thống

Video mẫu hệ thống được lưu ở cloud/CDN, nhưng app nên cache xuống máy để học mượt hơn.

### 14.1 Flow

```text
App tải danh sách bài học
   |
   |-- Kiểm tra video nào cần dùng hôm nay
   |-- Nếu chưa cache -> tải về khi có Wi-Fi
   |-- Lưu local cache
   |-- Khi học -> phát từ cache trước
```

### 14.2 Chính sách cache

```text
Ưu tiên cache:
1. Bài học hôm nay
2. Từ yêu thích
3. Từ phụ huynh chọn
4. Từ thường luyện sai
```

### 14.3 Không nên cache toàn bộ ngay

Không nên tải toàn bộ video hệ thống về máy ngay lần đầu vì:

- Tốn dung lượng
- Chậm onboarding
- Có thể làm phụ huynh bỏ app

Nên tải theo nhu cầu.

---

## 15. Giao tiếp nhanh / PECS đơn giản

Đây là tính năng rất phù hợp với trẻ giao tiếp kém.

### 15.1 Mục tiêu

Trẻ bấm vào thẻ để app nói thay trẻ.

Ví dụ:

```text
[ Nước ] -> App đọc: Con muốn uống nước
[ Ăn ]   -> App đọc: Con muốn ăn
[ Mẹ ]   -> App đọc: Con muốn mẹ
```

### 15.2 Layout MVP

```text
Con muốn

[ Uống nước ] [ Ăn ]
[ Đi vệ sinh ] [ Chơi ]
[ Mẹ ] [ Nghỉ ]
```

### 15.3 Quy tắc

- Button rất lớn
- Ảnh thật hoặc icon rõ
- App đọc câu ngay sau khi bấm
- Có thể lưu thẻ hay dùng lên đầu
- Không cần nhiều cấp menu trong MVP

### 15.4 Future

Sau này có thể nâng cấp thành ghép câu:

```text
Con + muốn + nước
Con + muốn + chơi bóng
```

Nhưng MVP chỉ cần 1 thẻ -> 1 câu là đủ.

---

## 16. Dashboard phụ huynh

### 16.1 Mục tiêu

Dashboard giúp phụ huynh thấy tiến bộ mà không quá phức tạp.

Không làm dashboard kiểu chuyên gia phức tạp trong MVP.

### 16.2 Nội dung MVP

```text
Hôm nay
- Đã học: 7 phút
- Đã luyện: 8 từ
- Từ phản hồi tốt: 3
- Từ cần luyện thêm: 5

Tuần này
- Số ngày học: 5/7
- Tổng số từ đã luyện: 24
- Từ mới: 6

Gợi ý
- Ngày mai luyện lại: Mẹ, Ba, Uống nước
```

### 16.3 Dashboard cho chuyên gia xem trực tiếp

Vì không có role chuyên gia trong MVP, dashboard nên có chế độ trình bày gọn để phụ huynh đưa cho chuyên gia xem.

```text
Parent Dashboard
   |
   |-- Nút: Chế độ xem tư vấn
   |      |-- Ẩn thông tin tài khoản không cần thiết
   |      |-- Hiện tóm tắt tiến độ
   |      |-- Hiện từ đang luyện
   |      |-- Hiện ghi chú của phụ huynh
```

Có thể thêm về sau:

```text
Xuất báo cáo PDF
Xuất ảnh tóm tắt
Chia sẻ file báo cáo
```

---

## 17. Parent Gate

### 17.1 Mục tiêu

Ngăn trẻ tự vào khu vực cài đặt hoặc xóa dữ liệu.

### 17.2 Flow

```text
Trẻ đang ở Child Mode
   |
   |-- Phụ huynh bấm nút Phụ huynh
   |-- Vào Parent Mode
```

Trong bản Web/PWA demo, Parent Gate không hỏi mã PIN để tránh phụ huynh phải nhập lại nhiều lần khi test. Với bản production dùng cho trẻ tự thao tác nhiều, có thể cân nhắc cơ chế khóa lại sau khi người dùng đồng ý.

### 17.3 Không nên

- Không đặt nút settings quá nổi bật trong Child Mode
- Với bản production, không nên coi bấm 1 lần là cơ chế bảo vệ đủ an toàn nếu chưa có quyết định sản phẩm rõ ràng
- Không để in-app purchase xuất hiện ở Child Mode

---

## 18. Learning event tracking

Frontend cần ghi nhận các sự kiện học để backend/local dashboard tính tiến độ.

### 18.1 Event MVP

```typescript
type LearningEvent = {
  id: string;
  childId: string;
  sessionId: string;
  eventType:
    | 'session_started'
    | 'category_selected'
    | 'word_selected'
    | 'video_played'
    | 'repeat_completed'
    | 'parent_marked_good_response'
    | 'parent_marked_need_practice'
    | 'communication_card_pressed'
    | 'session_completed';
  wordId?: string;
  categoryId?: string;
  mediaSource?:
    | 'system_default'
    | 'cached_system_video'
    | 'local_parent_video'
    | 'cloud_parent_video';
  timestamp: string;
  metadata?: Record<string, unknown>;
};
```

### 18.2 Offline-first event flow

```text
Child học bài
   |
   |-- Ghi event vào local DB
   |-- Cập nhật dashboard local ngay
   |-- Nếu có internet -> sync backend
   |-- Nếu mất mạng -> đưa vào offline queue
   |-- Có mạng lại -> sync sau
```

### 18.3 Không để tracking làm chậm bài học

Learning Player phải luôn ưu tiên trải nghiệm trẻ.

```text
Không chờ API xong mới phát video
Không hiện lỗi kỹ thuật cho trẻ
Không làm bài học dừng vì mất mạng
```

---

## 19. State management

### 19.1 App state chính

```typescript
type AppState = {
  currentChildId?: string;
  mode: 'child' | 'parent';
  isOffline: boolean;
  activeSessionId?: string;
  settings: AppSettings;
};
```

### 19.2 Lesson state

```typescript
type LessonState = {
  wordId: string;
  status: 'idle' | 'playing' | 'paused_for_response' | 'completed';
  repeatIndex: number;
  repeatCount: number;
  playbackSpeed: 1 | 0.75 | 0.5;
  mediaSource: 'system_default' | 'cached_system_video' | 'local_parent_video' | 'cloud_parent_video';
};
```

### 19.3 Settings

```typescript
type AppSettings = {
  repeatCount: 1 | 2 | 3 | 4 | 5;
  slowPlaybackSpeed: 0.5 | 0.75;
  pauseBetweenRepeatsMs: number;
  childModeSoundVolume: number;
  preferParentVideo: boolean;
  enableRewards: boolean;
  enableCloudSyncForParentVideos: boolean;
  cacheOnWifiOnly: boolean;
};
```

---

## 20. API integration workflow

Frontend không nên phụ thuộc hoàn toàn vào backend để học bài. Nội dung cần được cache.

### 20.1 Khi app mở

```text
1. Load local child profile
2. Load local settings
3. Load cached content
4. Hiển thị Child Home ngay nếu có dữ liệu local
5. Background sync nội dung mới nếu có internet
```

### 20.2 Khi học bài

```text
1. Resolve media source
2. Phát video/audio local nếu có
3. Ghi event local
4. Sync event backend sau
```

### 20.3 Khi phụ huynh quay video

```text
1. Quay video
2. Nén video nếu cần
3. Lưu vào app local directory
4. Ghi metadata local DB
5. Gắn video với wordId
6. Nếu cloud sync bật -> upload private storage
7. Nếu cloud sync tắt -> giữ local_only
```

---

## 21. UI component chuẩn

### 21.1 BigButton

Dùng cho Child Mode.

```typescript
type BigButtonProps = {
  title: string;
  icon?: React.ReactNode;
  imageUri?: string;
  size?: 'large' | 'xlarge';
  onPress: () => void;
};
```

Yêu cầu:

```text
Height >= 88px
Border radius lớn
Text lớn
Icon lớn
Feedback khi bấm rõ
Không có text nhỏ bên trong
```

### 21.2 WordCard

```typescript
type WordCardProps = {
  wordId: string;
  label: string;
  imageUri: string;
  learnedToday?: boolean;
  hasParentVideo?: boolean;
  onPress: () => void;
};
```

### 21.3 LessonPlayer

```typescript
type LessonPlayerProps = {
  wordId: string;
  label: string;
  imageUri: string;
  systemVideoUri: string;
  localParentVideoUri?: string;
  cloudParentVideoUri?: string;
  repeatCount: number;
  onCompleted: () => void;
  onEvent: (event: LearningEvent) => void;
};
```

### 21.4 ParentGate

```typescript
type ParentGateProps = {
  onSuccess: () => void;
};
```

---

## 22. Design system tối giản

### 22.1 Spacing

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### 22.2 Border radius

```typescript
export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};
```

### 22.3 Typography

```typescript
export const typography = {
  childTitle: 36,
  childButton: 28,
  wordLabel: 32,
  parentTitle: 24,
  parentBody: 16,
  parentCaption: 13,
};
```

### 22.4 Màu sắc

Màu nên mềm, rõ, nhất quán.

```text
Nền: trắng / xanh rất nhạt
Primary: xanh dương hoặc xanh lá dịu
Success: xanh lá
Warning: vàng dịu
Error: chỉ dùng trong Parent Mode
```

Không nên dùng màu đỏ lớn trong Child Mode vì dễ tạo cảm giác sai/sợ.

---

## 23. Empty state và error state

### 23.1 Trong Child Mode

Không hiển thị lỗi kỹ thuật.

Thay vì:

```text
Network request failed: 500 internal server error
```

Nên hiển thị:

```text
Mình nghe lại bài khác nhé
```

hoặc tự fallback sang nội dung local.

### 23.2 Trong Parent Mode

Có thể hiển thị lỗi rõ hơn:

```text
Không tải được video mẫu. Vui lòng kiểm tra kết nối mạng.
```

Nhưng vẫn nên có nút hành động:

```text
Thử lại
Dùng bản đã lưu
```

---

## 24. Offline-first frontend

KidEDU nên hoạt động tốt khi mất mạng.

### 24.1 Dữ liệu cần dùng offline

```text
Hồ sơ trẻ
Bài học đã tải
Ảnh bài học
Audio/video mẫu đã cache
Video phụ huynh local
Tiến độ học gần đây
Cài đặt app
```

### 24.2 Flow mất mạng

```text
Mất mạng
   |
   |-- Child Mode vẫn học được bằng cache/local
   |-- Learning events lưu local
   |-- Parent Dashboard dùng dữ liệu local
   |-- Media sync tạm dừng
   |-- Có mạng lại thì sync
```

### 24.3 UI báo offline

Trong Child Mode không cần báo offline quá rõ.

Trong Parent Mode có thể hiện:

```text
Đang dùng dữ liệu đã lưu trên thiết bị
```

---

## 25. Quy tắc bảo mật và riêng tư ở frontend

### 25.1 Video phụ huynh

```text
Mặc định: lưu trên thiết bị
Không upload cloud nếu phụ huynh chưa bật
Hiển thị rõ trạng thái: Local only / Đã đồng bộ
Cho phép xóa video local
Không chia sẻ public URL
```

### 25.2 Dữ liệu trẻ

Không hiển thị quá nhiều thông tin nhạy cảm trên Child Mode.

Parent Dashboard có thể có:

```text
Tên gọi ở nhà
Tuổi
Mục tiêu học
Tiến độ
```

Không nên yêu cầu thông tin không cần thiết như địa chỉ nhà, trường học chi tiết trong MVP.

### 25.3 Permission

App cần xin quyền rõ ràng:

```text
Camera: để phụ huynh quay video mẫu
Microphone: để ghi âm giọng trẻ nếu dùng luyện phát âm
Photo Library: nếu phụ huynh chọn video có sẵn
```

Thông báo permission nên viết dễ hiểu:

```text
KidEDU cần dùng camera để bố/mẹ quay video khẩu hình cho bé học theo.
```

---

## 26. Accessibility và usability

### 26.1 Touch

- Không đặt nút quá sát nhau
- Không dùng gesture khó như swipe bắt buộc
- Không yêu cầu double tap
- Nút back nên lớn trong Parent Mode, nhưng trong Child Mode nên hạn chế

### 26.2 Âm thanh

- Âm lượng ổn định
- Giọng đọc rõ
- Bản Web/PWA ưu tiên chọn voice `vi-VN` tốt nhất từ trình duyệt/hệ điều hành, ví dụ các giọng Microsoft/Google/Apple tiếng Việt nếu có
- Nếu muốn dùng AI TTS cloud thật để giọng ổn định trên mọi máy, cần hỏi người dùng trước vì sẽ phát sinh API/key, chi phí và luồng xử lý dữ liệu âm thanh
- Không dùng nhạc nền quá lớn
- Nên có nút phát lại dễ thấy

### 26.3 Hình ảnh

- Ảnh vật thể rõ, nền đơn giản
- Không dùng ảnh quá rối
- Ưu tiên ảnh thật cho vật quen thuộc
- Với từ gia đình, nên cho phụ huynh thay ảnh người thật nếu muốn

### 26.4 Tốc độ

- Màn hình chuyển chậm vừa phải
- Không loading lâu
- Nút bấm phản hồi ngay
- Video bắt đầu nhanh

---

## 27. Workflow bài học hằng ngày

### 27.1 Parent chuẩn bị

```text
Parent Mode
   |
   |-- Chọn mục tiêu tuần này
   |-- Chọn 5-10 từ cần luyện
   |-- Quay video phụ huynh cho từ quan trọng
   |-- Cache bài học hôm nay
```

### 27.2 Trẻ học

```text
Child Mode
   |
   |-- Bấm Học hôm nay
   |-- Xem từ 1
   |-- Nghe/video 3 lần
   |-- Phụ huynh đánh dấu phản hồi
   |-- Qua từ tiếp theo
   |-- Kết thúc bằng phần thưởng nhẹ
```

### 27.3 Sau buổi học

```text
Parent Dashboard
   |
   |-- Hôm nay học bao lâu
   |-- Từ nào phản hồi tốt
   |-- Từ nào cần luyện lại
   |-- Gợi ý bài ngày mai
```

---

## 28. Luồng đánh dấu phản hồi của phụ huynh

MVP chưa cần AI chấm phát âm ngay. Phụ huynh có thể đánh dấu đơn giản.

### 28.1 Sau mỗi từ

```text
Bé phản hồi thế nào?

[ Tốt ]
[ Cần luyện thêm ]
[ Bỏ qua ]
```

### 28.2 Không nên cho trẻ thấy điểm xấu

Không hiển thị:

```text
Sai
0 điểm
Phát âm kém
```

Nên dùng:

```text
Con nghe lại nhé
Mình luyện thêm nhé
```

---

## 29. Gợi ý UI cho màn hình học

### 29.1 Layout phiên bản rất tối giản

```text
+------------------------------+
|                              |
|              Mẹ              |
|                              |
|      [ Video / Ảnh lớn ]      |
|                              |
|        [ NGHE LẠI ]           |
|                              |
|     [ Tiếp theo ]             |
|                              |
+------------------------------+
```

### 29.2 Layout có phụ huynh hỗ trợ

```text
+------------------------------+
|              Mẹ              |
|      [ Video / Ảnh lớn ]      |
|                              |
|        [ PHÁT LẠI ]           |
|                              |
|  Phụ huynh đánh dấu:          |
|  [Tốt] [Cần luyện thêm]       |
+------------------------------+
```

Trong Child Mode độc lập, ẩn phần đánh dấu. Trong chế độ phụ huynh hỗ trợ, hiện phần đánh dấu.

---

## 30. MVP screen list

### Child Mode

```text
1. ChildHomeScreen
2. CategoryGridScreen
3. WordGridScreen
4. LessonPlayerScreen
5. QuickCommunicationScreen
6. RewardScreen
```

### Parent Mode

```text
1. ParentGateScreen
2. ParentDashboardScreen
3. ChildProfileScreen
4. DailyPlanScreen
5. ParentVideoListScreen
6. ParentVideoRecordScreen
7. ContentSettingsScreen
8. AppSettingsScreen
9. ReportPreviewScreen
```

### Shared

```text
1. LoadingScreen
2. OfflineBanner
3. ErrorFallback
4. MediaPermissionScreen
```

---

## 31. Roadmap frontend

### Phase 1 - Demo sạch

- Tách Child Mode và Parent Mode
- Button lớn hơn
- Màn hình học tối giản
- Có danh mục và từ vựng
- Có video mẫu hệ thống
- Có settings cơ bản

### Phase 2 - MVP local-first

- Hồ sơ trẻ
- Video phụ huynh lưu local
- Cache video mẫu
- Local progress
- Dashboard phụ huynh
- Parent Gate
- Quick Communication cơ bản

### Phase 3 - Sync và báo cáo

- Đăng nhập phụ huynh
- Sync tiến độ với backend
- Cloud sync optional cho video phụ huynh
- Export báo cáo
- Multi-device nếu phụ huynh bật sync

### Phase 4 - AI hỗ trợ

- Ghi âm giọng trẻ
- AI nhận diện từ đơn giản
- Gợi ý từ cần luyện
- Gợi ý kế hoạch học tuần

---

## 32. Checklist UI trước khi release MVP

### Child Mode checklist

- [ ] Mỗi màn hình có tối đa 1 hành động chính
- [ ] Button chính cao tối thiểu 72px
- [ ] Card từ đủ lớn để trẻ bấm dễ
- [ ] Không có chữ dài trong màn hình trẻ
- [ ] Không có popup mua gói trong Child Mode
- [ ] Không có settings mở bằng 1 lần bấm
- [ ] Video phát nhanh, không loading lâu
- [ ] Có fallback nếu mất mạng
- [ ] Không có lỗi kỹ thuật hiển thị cho trẻ
- [ ] Âm thanh rõ, không quá lớn

### Parent Mode checklist

- [ ] Phụ huynh tạo được hồ sơ trẻ
- [ ] Phụ huynh quay được video mẫu
- [ ] Video phụ huynh lưu local trước
- [ ] App hiển thị rõ local_only hoặc synced
- [ ] Dashboard dễ hiểu
- [ ] Có chế độ cho chuyên gia xem trực tiếp từ dashboard
- [ ] Có quyền camera/microphone rõ ràng
- [ ] Có xác nhận trước khi xóa video

### Offline checklist

- [ ] Mở app không mạng vẫn thấy hồ sơ trẻ
- [ ] Bài đã cache vẫn học được
- [ ] Video phụ huynh local vẫn phát được
- [ ] Event học được lưu local
- [ ] Có mạng lại thì sync được

---

## 33. Kết luận frontend

Frontend KidEDU nên đi theo hướng:

```text
Child Mode:
Tối giản, button lớn, hình lớn, ít chữ, một hành động chính.

Parent Mode:
Quản lý hồ sơ, video, dashboard, cài đặt, báo cáo.

Media:
Video mẫu hệ thống lấy từ cloud/CDN và cache local.
Video phụ huynh local-first, cloud sync là tuỳ chọn.

Dashboard:
Dành cho phụ huynh. Nếu chuyên gia cần xem, phụ huynh mở dashboard hoặc xuất báo cáo.
```

Định hướng UI quan trọng nhất:

```text
Đừng làm app giống app học tiếng Anh thông thường.
Hãy làm giống một công cụ hỗ trợ giao tiếp tại nhà cho trẻ cần can thiệp ngôn ngữ.
```

---

## 34. Trạng thái triển khai Web/PWA hiện tại

Repo hiện đã có bản Web/PWA đầu tiên để chạy demo nhanh trên trình duyệt.

### 34.1 Stack đang dùng

```text
React
TypeScript
Vite
LocalStorage cho state nhỏ
IndexedDB cho blob video phụ huynh local
Service Worker đơn giản cho app shell/offline fallback
```

### 34.2 Lệnh chạy

```bash
npm install --cache .npm-cache
npm run dev
npm run build
npm run preview
```

Trong bản hiện tại, `npm run dev` sẽ build production rồi serve thư mục `dist` bằng server Node nhỏ trong `scripts/serve-dist.mjs`. Cách này tránh lỗi dependency optimizer của Vite dev server trên một số môi trường Windows/sandbox.

Trên Windows PowerShell nếu `npm` bị chặn bởi execution policy, dùng:

```bash
npm.cmd install --cache .npm-cache
npm.cmd run dev
npm.cmd run build
```

### 34.3 Cấu trúc source hiện tại

```text
src/
  App.tsx
  main.tsx
  styles.css
  data/
    content.ts
  features/
    media/
      resolveMedia.ts
    progress/
      progress.ts
    speech/
      speech.ts
  storage/
    appStorage.ts
    localDb.ts
  types.ts

public/
  manifest.webmanifest
  sw.js
  icon.svg
```

### 34.4 Tính năng đã có trong bản Web/PWA đầu tiên

```text
- Onboarding tạo hồ sơ trẻ local.
- Child Mode với Học hôm nay, Chọn chủ đề, Con muốn.
- Danh mục chủ đề và danh sách từ vựng tiếng Việt.
- Giao diện Child Mode có nút lớn, màu nổi, emoji/icon lớn cho hành động, chủ đề và từ vựng.
- Màn hình học một từ với ảnh, video mẫu, emoji nổi, đọc từ bằng Web Speech API và ưu tiên voice tiếng Việt chuẩn nhất mà trình duyệt có.
- Lặp video/từ theo cài đặt, lần sau có thể phát chậm hơn.
- Quick Communication: trẻ bấm thẻ để app đọc câu nhu cầu.
- Parent Gate bằng nút phụ huynh, mở Parent Mode trực tiếp theo yêu cầu test hiện tại.
- Parent Mode có dashboard, hồ sơ, video phụ huynh, cài đặt và báo cáo.
- Dashboard phụ huynh có thẻ nổi bật để đi nhanh tới khu Video phụ huynh.
- Cài đặt có công tắc bật/tắt video phụ huynh; nếu bật nhưng từ chưa có video phụ huynh thì app vẫn phát video mẫu.
- Màn Video phụ huynh có khối tải video nổi bật ở đầu màn hình: chọn từ, chọn file video, lưu local-first và báo trạng thái lưu thành công/lỗi.
- Video phụ huynh lưu local-first bằng IndexedDB, không upload cloud.
- Learning events lưu local và dùng để tính progress/dashboard.
- PWA manifest và service worker đơn giản.
```

### 34.5 Vị trí upload video phụ huynh

Luồng hiện tại:

```text
Child Mode
  -> Bấm nút "Phụ huynh"
  -> Parent Mode
  -> Tab "Video"
  -> Chọn từ
  -> Chọn video
  -> Video được lưu local-first trong IndexedDB
  -> App hiện thông báo lưu thành công hoặc lỗi lưu trữ nếu có
```

Quy tắc vẫn giữ nguyên:

```text
- Không hiện upload video trong Child Mode.
- Không upload cloud tự động.
- Video phụ huynh ưu tiên phát trước video mẫu nếu có file local cho từ đó.
```

### 34.6 Chưa có trong bản này

```text
- Backend thật.
- Auth/login thật.
- Cloud sync video phụ huynh.
- AI TTS cloud thật cho giọng đọc đồng nhất trên mọi thiết bị.
- AI phát âm.
- Export PDF thật.
- Cache media hệ thống nâng cao bằng manifest/version/checksum.
```

Các phần trên vẫn phải hỏi người dùng trước khi thêm vì nằm ngoài bản Web/PWA demo đầu tiên.

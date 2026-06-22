# KidEDU Backend Workflow Chuẩn

## 1. Mục tiêu backend

Backend của KidEDU cần hỗ trợ một app can thiệp ngôn ngữ tại nhà cho trẻ chậm nói và giao tiếp kém. Backend không chỉ lưu bài học, mà còn cần theo dõi tiến bộ, quản lý nội dung cá nhân hóa, xử lý media, ghi âm, AI đánh giá phát âm và tạo báo cáo cho phụ huynh.

Lưu ý về scope: trong MVP, KidEDU nên tập trung vào phụ huynh và trẻ. Chuyên gia ngôn ngữ trị liệu không cần là một role đăng nhập riêng; nếu cần tư vấn, phụ huynh có thể mở dashboard hoặc xuất báo cáo để chuyên gia xem trong buổi gặp.

---

## 2. Vai trò người dùng

### 2.1 Parent / Caregiver

Phụ huynh hoặc người chăm sóc trẻ. Đây là role chính của MVP.

Chức năng chính:

- Tạo hồ sơ trẻ
- Chọn mục tiêu học
- Cho trẻ học bài
- Quay/lưu video khẩu hình riêng trên thiết bị
- Bật đồng bộ cloud cho video riêng nếu muốn backup hoặc dùng nhiều thiết bị
- Ghi âm giọng trẻ
- Xem tiến độ
- Nhận gợi ý bài tập tại nhà

### 2.2 Child Profile

Trẻ không nên là một tài khoản đăng nhập riêng trong MVP. Trẻ chỉ là hồ sơ dữ liệu được quản lý bởi Parent / Caregiver.

Chức năng chính:

- Lưu nickname / độ tuổi / mức giao tiếp
- Lưu mục tiêu học
- Lưu tiến độ học
- Liên kết với video phụ huynh local hoặc cloud sync nếu có

### 2.3 Admin / Content Manager

Người quản trị nội dung hệ thống.

Chức năng chính:

- Quản lý danh mục từ vựng
- Quản lý hình ảnh, video mẫu, audio mẫu
- Quản lý nội dung hệ thống; không xem video riêng của gia đình nếu không có quyền hỗ trợ rõ ràng
- Quản lý gói subscription
- Theo dõi lỗi hệ thống

### 2.4 Chuyên gia tư vấn bên ngoài - Không phải app role trong MVP

Trong MVP, chuyên gia không cần tài khoản riêng trong hệ thống. Cách dùng thực tế nên là phụ huynh mở dashboard trên điện thoại/iPad hoặc xuất báo cáo PDF để chuyên gia xem trong buổi tư vấn.

Nguyên tắc sản phẩm:

- Chuyên gia không đăng nhập vào app của gia đình
- Không có màn hình quản lý nhiều trẻ cho chuyên gia trong MVP
- Không có quyền theo dõi từ xa mặc định
- Phụ huynh là người sở hữu dữ liệu và chủ động đưa dashboard/báo cáo cho chuyên gia xem
- Video local-only vẫn chỉ nằm trên thiết bị của phụ huynh

---

## 3. Kiến trúc tổng quan

```text
Mobile/Web App
   |
   |-- Local Device Storage
   |   |-- Local video phụ huynh tự quay
   |   |-- Cache video mẫu để học offline
   |   |-- Local DB: SQLite / WatermelonDB / MMKV
   |
   | REST API / GraphQL
   v
API Gateway / Backend Server
   |
   |-- Auth Service
   |-- User & Child Profile Service
   |-- Learning Content Service
   |-- Media Storage & Sync Service
   |-- Learning Session Service
   |-- Speech Recording Service
   |-- AI Speech Analysis Service
   |-- Progress & Report Service
   |-- Notification Service
   |-- Payment / Subscription Service
   |
Database + Object Storage + Queue + AI Provider
```

Nguyên tắc media của KidEDU:

```text
Video mẫu hệ thống
   -> Lưu ở cloud object storage / CDN
   -> App tải khi cần và cache local để học offline

Video phụ huynh tự quay
   -> Local-first: lưu trên thiết bị trước
   -> Không bắt buộc upload lên server
   -> Cloud sync là tuỳ chọn khi phụ huynh muốn backup / đổi máy / dùng nhiều thiết bị

Ghi âm của trẻ để AI phân tích
   -> Có thể upload tạm thời lên backend nếu phụ huynh đồng ý dùng AI
   -> Không dùng để train AI nếu chưa có consent rõ ràng
```

Đề xuất stack ban đầu:

```text
Frontend: React Native / Expo hoặc Next.js
Backend: Node.js NestJS hoặc Python FastAPI
Database server: PostgreSQL
Local DB client: SQLite / WatermelonDB / MMKV
Cache backend: Redis
Storage cloud: S3 / Cloudflare R2 / Firebase Storage / Supabase Storage
Storage local: App sandbox / document directory của thiết bị
Queue: BullMQ / RabbitMQ / Celery
AI Speech: Whisper / Azure Speech / Google Speech
Auth: Firebase Auth / Supabase Auth / Custom JWT
```

---

## 4. Module backend chính

## 4.0 Scope role cho MVP

Trong MVP, backend chỉ cần xử lý 2 nhóm chính:

```text
Parent / Caregiver
   -> user thật sự đăng nhập và quản lý hồ sơ trẻ

Admin / Content Manager
   -> tài khoản nội bộ để quản lý nội dung mẫu
```

`Child` là hồ sơ dữ liệu, không phải user login. Chuyên gia tư vấn không phải role backend trong MVP; chuyên gia chỉ xem dashboard/báo cáo khi phụ huynh chủ động mở hoặc xuất file.

---

## 4.1 Auth Service

### Mục tiêu

Quản lý đăng ký, đăng nhập, phân quyền và bảo vệ dữ liệu trẻ em.

### Workflow

```text
User đăng ký
   -> Xác thực email / phone
   -> Tạo account
   -> MVP mặc định role Parent
   -> Admin được tạo nội bộ, không qua form đăng ký public
   -> Tạo hoặc liên kết hồ sơ trẻ
   -> Nhận access token + refresh token
```

### API gợi ý

```http
POST /auth/register
POST /auth/login
POST /auth/refresh-token
POST /auth/logout
GET  /auth/me
```

### Lưu ý

- Không cho trẻ tự tạo tài khoản
- Dữ liệu trẻ phải gắn với tài khoản phụ huynh; MVP không cần quyền truy cập riêng cho chuyên gia
- Cần audit log cho các thao tác nhạy cảm

---

## 4.2 Child Profile Service

### Mục tiêu

Lưu hồ sơ phát triển và mục tiêu học của từng trẻ.

### Dữ liệu cần có

```text
ChildProfile
- id
- parent_id
- name / nickname
- birth_year hoặc age_range
- communication_level
- diagnosis_note optional
- speech_goal
- preferred_content
- created_at
```

### Communication level đề xuất

```text
level_0: Chưa có lời nói
level_1: Có âm đơn
level_2: Có từ đơn
level_3: Có cụm 2 từ
level_4: Có câu ngắn
level_5: Giao tiếp chức năng cơ bản
```

### API gợi ý

```http
POST /children
GET  /children
GET  /children/:childId
PATCH /children/:childId
DELETE /children/:childId
```

---

## 4.3 Learning Content Service

### Mục tiêu

Quản lý chủ đề học, từ vựng, bài tập và nội dung media.

### Entity chính

```text
Category
- id
- name
- icon
- color
- order_index

WordItem
- id
- category_id
- text
- phonetic_hint
- difficulty_level
- image_url
- default_video_url
- default_audio_url
- syllable_count
- word_type
- tags

Lesson
- id
- title
- goal_type
- level
- items
- recommended_repeat_count
```

### Goal type đề xuất

```text
IMITATION_SOUND       Bắt chước âm
FIRST_WORD            Từ đầu tiên
VOCABULARY            Từ vựng
REQUESTING            Yêu cầu nhu cầu
CHOICE_MAKING         Chọn lựa
PECS                  Giao tiếp bằng hình
TWO_WORD_PHRASE       Ghép 2 từ
SOCIAL_COMMUNICATION  Giao tiếp xã hội
```

### API gợi ý

```http
GET  /categories
GET  /categories/:categoryId/words
GET  /words/:wordId
GET  /lessons/recommended?childId=:childId
POST /admin/categories
POST /admin/words
PATCH /admin/words/:wordId
```

---

## 4.4 Media Storage & Sync Service

### Mục tiêu

Quản lý media theo mô hình **local-first + cloud sync tuỳ chọn**.

Backend không nên mặc định yêu cầu phụ huynh upload mọi video cá nhân lên cloud. Với KidEDU, video của phụ huynh và trẻ là dữ liệu nhạy cảm, nên thiết kế chuẩn là:

```text
Video mẫu của hệ thống
   -> Cloud storage / CDN

Video phụ huynh tự quay
   -> Lưu local trên thiết bị trước
   -> Chỉ upload cloud nếu phụ huynh bật đồng bộ / backup

Video cache offline
   -> Lưu local trên thiết bị
   -> Có thể xoá và tải lại từ cloud khi cần
```

### 4.4.1 Workflow video mẫu hệ thống

```text
Admin upload video mẫu
   -> Backend tạo media asset
   -> Lưu file vào object storage
   -> Xử lý thumbnail / duration / định dạng
   -> Gắn vào WordItem.default_video_url
   -> App tải video khi trẻ học
   -> App cache local để lần sau phát nhanh và hỗ trợ offline
```

Video mẫu là nội dung chung, nên lưu cloud là đúng vì app có thể cập nhật nội dung mà không cần phát hành lại app.

### 4.4.2 Workflow video phụ huynh local-only

```text
Parent chọn từ "Mẹ"
   -> App mở camera hoặc chọn video từ máy
   -> App nén video ở client nếu cần
   -> App lưu video vào app sandbox trên thiết bị
   -> App lưu metadata vào local DB
   -> Khi trẻ học từ "Mẹ", app ưu tiên video local của phụ huynh
   -> Backend chỉ nhận learning event, không nhận file video
```

Ví dụ local path trên thiết bị:

```text
appData/children/{child_id}/parent_videos/words/{word_id}/{local_video_id}.mp4
```

Local DB trên client lưu:

```text
LocalCustomWordMedia
- local_video_id
- child_id
- word_id
- local_path
- thumbnail_path nullable
- duration_seconds
- file_size
- sync_status: local_only | pending_sync | synced | sync_failed
- cloud_media_id nullable
- created_at
- updated_at
```

Lưu ý: `local_path` chỉ tồn tại trên thiết bị, không nên coi là đường dẫn backend có thể dùng được.

### 4.4.3 Workflow video phụ huynh cloud sync optional

Chỉ chạy khi phụ huynh bật một trong các tính năng:

```text
- Backup video riêng
- Dùng video trên nhiều thiết bị
- Xuất báo cáo để phụ huynh tự đưa cho chuyên gia xem khi cần
- Muốn khôi phục dữ liệu khi đổi máy
```

Lưu ý: việc phụ huynh đưa dashboard cho chuyên gia xem trực tiếp không yêu cầu cloud sync. Video local vẫn có thể được xem ngay trên thiết bị của phụ huynh nếu phụ huynh chủ động mở cho chuyên gia xem.

Workflow:

```text
Parent bật "Đồng bộ an toàn"
   -> App đọc video local
   -> Client yêu cầu upload URL
   -> Backend kiểm tra quyền parent với child_id
   -> Backend tạo presigned URL
   -> Client upload video trực tiếp lên object storage private
   -> Client báo upload hoàn tất
   -> Backend lưu media metadata
   -> Queue xử lý media nếu cần
   -> Backend gắn cloud media với child_id + word_id
   -> Thiết bị khác có thể lấy signed playback URL
```

### 4.4.4 Thứ tự ưu tiên khi phát video trong bài học

```text
1. Local parent video trên thiết bị hiện tại
2. Cloud parent video đã được đồng bộ
3. Video mẫu hệ thống
4. Audio mẫu / text-to-speech fallback nếu thiếu video
```

Điều này giúp KidEDU vừa riêng tư, vừa có khả năng mở rộng.

### 4.4.5 Media processing cho cloud upload

```text
Cloud upload video
   -> Scan virus / validate file
   -> Kiểm tra định dạng
   -> Kiểm tra kích thước và thời lượng
   -> Nén video nếu cần
   -> Tạo thumbnail
   -> Tách audio nếu cần
   -> Lưu trạng thái ready
```

### API gợi ý

```http
GET  /media/system/:mediaId/play-url
POST /media/presign-upload
POST /media/complete-upload
GET  /media/:mediaId
DELETE /media/:mediaId
POST /children/:childId/words/:wordId/cloud-custom-media
DELETE /children/:childId/words/:wordId/cloud-custom-media/:mediaId
```

### Trạng thái media cloud

```text
pending_upload
uploaded
processing
ready
failed
blocked
deleted
```

### Trạng thái sync trên client

```text
local_only      Video chỉ nằm trên thiết bị
pending_sync    Đang chờ upload lên cloud
syncing         Đang upload
synced          Đã đồng bộ cloud
sync_failed     Đồng bộ lỗi, vẫn còn bản local
cloud_deleted   Bản cloud đã xoá, bản local có thể vẫn còn
```

---

## 4.5 Custom Word Video Workflow

Đây là tính năng rất quan trọng của KidEDU vì trẻ thường chú ý tốt hơn với gương mặt quen thuộc của bố mẹ. Workflow chuẩn nên là **local-first**, không phải cloud-first.

### Workflow local-first

```text
Parent chọn từ "Mẹ"
   -> Bấm quay video khẩu hình
   -> App lưu video vào thiết bị
   -> App lưu local metadata: child_id + word_id + local_path
   -> Khi trẻ học từ "Mẹ", app kiểm tra local custom video trước
   -> Nếu có local video, phát local video
   -> App gửi learning event lên backend với media_source = local_parent_video
```

### Workflow cloud sync optional

```text
Parent bật backup / sync
   -> App upload video local lên cloud private
   -> Backend tạo MediaAsset cloud
   -> Backend tạo CustomWordMedia cloud mapping
   -> Khi thiết bị khác mở từ "Mẹ", backend trả cloud_custom_video_url dạng signed URL
   -> App có thể cache video đó về local
```

### Data model backend

Backend chỉ lưu media có trên cloud hoặc metadata cần cho tiến độ. Không nên lưu đường dẫn local tuyệt đối của thiết bị.

```text
MediaAsset
- id
- owner_user_id
- child_id nullable
- storage_provider
- bucket
- storage_path
- media_type: video | audio | image
- mime_type
- file_size
- duration_seconds nullable
- thumbnail_path nullable
- visibility: system_public | private_child
- status
- created_at

CustomWordMedia
- id
- child_id
- word_id
- media_asset_id nullable
- media_source: cloud_parent_video | system_default | local_parent_video_event_only
- created_by
- sync_status: synced | cloud_deleted | event_only
- status
- created_at
```

### Data model local client

```text
LocalCustomWordMedia
- id
- child_id
- word_id
- local_path
- thumbnail_path nullable
- cloud_media_asset_id nullable
- sync_status
- created_at
- updated_at
```

### Learning event khi dùng local video

Vì backend không có file video local, app chỉ gửi event để phục vụ thống kê.

```json
{
  "eventType": "video_played",
  "wordId": "me",
  "payload": {
    "mediaSource": "local_parent_video",
    "localVideoId": "local_vid_001",
    "repeatCount": 3,
    "speed": 1.0
  }
}
```

### API gợi ý

```http
POST /children/:childId/words/:wordId/cloud-custom-media
GET  /children/:childId/words/:wordId/cloud-custom-media
DELETE /children/:childId/cloud-custom-media/:customMediaId
POST /learning-sessions/:sessionId/events
```

Local-only video không nhất thiết cần API riêng. App chỉ cần lưu local DB và gửi learning event khi trẻ học.

---

## 4.6 Learning Session Service

### Mục tiêu

Ghi lại mỗi lần trẻ học để phân tích tiến bộ.

### Workflow

```text
Child bắt đầu bài học
   -> Backend tạo learning session
   -> App phát video / audio / hình ảnh
   -> App gửi event: play, repeat, record, answer, skip
   -> Backend lưu event
   -> Kết thúc bài học
   -> Backend tính điểm phiên học
   -> Cập nhật tiến độ
```

### Event cần lưu

```text
lesson_started
word_viewed
video_played
video_repeated
audio_recorded
answer_selected
answer_correct
answer_wrong
lesson_completed
lesson_abandoned
```

### Data model

```text
LearningSession
- id
- child_id
- lesson_id
- started_at
- ended_at
- duration_seconds
- completion_status
- score

LearningEvent
- id
- session_id
- event_type
- word_id nullable
- payload jsonb
- media_source nullable: system_default | local_parent_video | cloud_parent_video
- created_at
```

### API gợi ý

```http
POST /learning-sessions
POST /learning-sessions/:sessionId/events
POST /learning-sessions/:sessionId/complete
GET  /children/:childId/learning-sessions
```

---

## 4.7 Speech Recording Service

### Mục tiêu

Lưu bản ghi âm của trẻ khi trẻ bắt chước từ, âm hoặc câu.

### Workflow

```text
App yêu cầu record task
   -> Trẻ nghe mẫu
   -> Trẻ ghi âm
   -> App upload audio
   -> Backend lưu recording
   -> Queue gửi sang AI Speech Analysis
   -> Nhận kết quả
   -> Lưu kết quả vào progress
```

### Data model

```text
SpeechRecording
- id
- child_id
- word_id nullable
- lesson_id nullable
- target_text
- audio_media_id
- duration_ms
- status
- created_at
```

### API gợi ý

```http
POST /speech-recordings/presign-upload
POST /speech-recordings/complete-upload
GET  /speech-recordings/:recordingId
GET  /children/:childId/speech-recordings
```

---

## 4.8 AI Speech Analysis Service

### Mục tiêu

Phân tích phát âm của trẻ và đưa ra phản hồi đơn giản cho phụ huynh.

### Workflow AI

```text
SpeechRecording ready
   -> Queue job analysis
   -> AI chuyển audio thành text / phoneme estimate
   -> So sánh với target_text
   -> Tính similarity score
   -> Phát hiện lỗi cơ bản
   -> Lưu kết quả
   -> Gửi kết quả về app
```

### Kết quả AI đề xuất

```text
SpeechAnalysisResult
- id
- recording_id
- target_text
- recognized_text
- confidence_score
- pronunciation_score
- missing_sound
- extra_sound
- feedback_text
- raw_provider_result jsonb
- created_at
```

### Feedback nên đơn giản

```text
- Bé đã nói gần đúng rồi
- Bé cần nói rõ âm đầu hơn
- Bé cần mở miệng rộng hơn
- Bé nên thử nói chậm lại
- Chưa nhận diện được, hãy thử ghi âm lại
```

### Lưu ý quan trọng

AI không nên được trình bày như chẩn đoán y khoa. Chỉ nên ghi:

```text
Kết quả AI chỉ mang tính hỗ trợ luyện tập, không thay thế đánh giá của chuyên gia ngôn ngữ trị liệu.
```

---

## 4.9 PECS / Functional Communication Service

### Mục tiêu

Hỗ trợ giao tiếp chức năng, không chỉ học từ vựng.

### Workflow PECS

```text
Child mở bảng giao tiếp
   -> Chọn hình "nước"
   -> App phát câu "Con muốn uống nước"
   -> Backend lưu communication event
   -> Parent thấy trẻ thường yêu cầu gì
```

### Entity

```text
CommunicationCard
- id
- text
- image_url
- audio_url
- category
- intent_type

CommunicationBoard
- id
- child_id
- name
- card_ids
- layout_config

CommunicationEvent
- id
- child_id
- card_id
- phrase_spoken
- created_at
```

### Intent type

```text
request_food
request_drink
request_help
request_toilet
request_break
emotion
social_greeting
choice
```

### API gợi ý

```http
GET  /communication-cards
GET  /children/:childId/communication-board
PATCH /children/:childId/communication-board
POST /children/:childId/communication-events
```

---

## 4.10 Progress & Report Service

### Mục tiêu

Cho phụ huynh thấy trẻ đang tiến bộ như thế nào. Dashboard này là công cụ chính để phụ huynh tự theo dõi tại nhà và có thể mở trực tiếp cho chuyên gia xem trong buổi tư vấn.

### Chỉ số nên theo dõi

```text
- Số ngày học trong tuần
- Tổng thời lượng học
- Số từ đã xem
- Số từ đã bắt chước
- Số từ AI nhận diện gần đúng
- Số lần yêu cầu bằng PECS
- Chủ đề trẻ phản hồi tốt
- Chủ đề trẻ thường bỏ qua
```

### Progress summary

```text
ChildProgress
- child_id
- known_words_count
- practiced_words_count
- average_pronunciation_score
- communication_events_count
- current_level
- last_active_at
```

### API gợi ý

```http
GET /children/:childId/dashboard
GET /children/:childId/progress/summary
GET /children/:childId/progress/weekly
GET /children/:childId/progress/words
GET /children/:childId/reports/monthly
GET /children/:childId/reports/export-pdf
```

### Parent Dashboard trong MVP

Dashboard là màn hình dành cho phụ huynh, không phải màn hình chuyên gia.

```text
Parent Dashboard
- Tổng số ngày học
- Số buổi học trong tuần
- Tổng thời lượng học
- Từ đã luyện
- Từ bé phản hồi tốt
- Từ cần luyện thêm
- Chủ đề bé thích / tương tác tốt
- Số lần dùng video mẫu hệ thống
- Số lần dùng video phụ huynh local
- Kết quả ghi âm / phát âm nếu phụ huynh bật AI
- Gợi ý bài tập hôm nay
```

Khi cần tư vấn, phụ huynh có thể:

```text
1. Mở dashboard trên điện thoại / iPad cho chuyên gia xem trực tiếp
2. Xuất báo cáo PDF hoặc ảnh tóm tắt
3. Gửi file báo cáo nếu cần trao đổi trước buổi gặp
```

Backend chỉ cần hỗ trợ API dashboard và export report. Không cần tài khoản chuyên gia, phân quyền chuyên gia, specialist dashboard hoặc assignment flow trong MVP.

### API dashboard / export gợi ý

```http
GET  /children/:childId/dashboard
POST /children/:childId/reports/export
GET  /reports/:reportId/download
```

### Báo cáo tháng

```text
Báo cáo tháng 6
- Bé học 18/30 ngày
- Luyện 42 từ
- 15 từ có phản hồi tốt
- Bé thường tương tác với chủ đề Gia đình và Động vật
- Nên tiếp tục luyện âm /m/, /b/, /a/
```

---

## 4.11 Recommendation Service

### Mục tiêu

Gợi ý bài học tiếp theo dựa trên dữ liệu của từng trẻ.

### Logic V1 không cần AI phức tạp

```text
Nếu trẻ bỏ qua từ nhiều lần
   -> giảm độ khó

Nếu trẻ luyện tốt 3 lần liên tiếp
   -> đề xuất từ mới cùng nhóm

Nếu trẻ ít giao tiếp nhu cầu
   -> đề xuất bài PECS: ăn, uống, giúp con

Nếu trẻ chưa có lời nói
   -> ưu tiên âm đơn và bắt chước khẩu hình
```

### API gợi ý

```http
GET /children/:childId/recommendations/today
POST /children/:childId/recommendations/feedback
```

---

## 4.12 Notification Service

### Mục tiêu

Nhắc phụ huynh luyện tập đều đặn nhưng không gây áp lực.

### Notification type

```text
daily_practice_reminder
weekly_progress_summary
new_report_ready
media_processing_done
```

### API gợi ý

```http
GET  /notifications
PATCH /notifications/:notificationId/read
PATCH /notification-settings
```

---

## 4.13 Subscription / Payment Service

### Gói đề xuất

```text
Free
- Học từ mẫu
- 1 hồ sơ trẻ
- Lưu video phụ huynh local trên thiết bị
- Dashboard tiến độ cơ bản

Parent Plus
- Nhiều hồ sơ trẻ
- Cloud sync / backup tuỳ chọn cho video riêng
- Theo dõi tiến độ nâng cao
- AI chấm phát âm giới hạn/tháng
- Export báo cáo PDF để phụ huynh đưa chuyên gia xem

```

### API gợi ý

```http
GET  /subscriptions/current
POST /subscriptions/checkout
POST /subscriptions/webhook
PATCH /subscriptions/cancel
```

---

# 5. Database schema đề xuất

## Bảng chính

```text
users
children
categories
word_items
lessons
lesson_items
media_assets
custom_word_media
cloud_sync_jobs
learning_sessions
learning_events
speech_recordings
speech_analysis_results
communication_cards
communication_boards
communication_events
progress_snapshots
recommendations
notifications
subscriptions
```

## Quan hệ chính

```text
users 1-n children
categories 1-n word_items
lessons n-n word_items through lesson_items
children 1-n custom_word_media khi video đã cloud sync
children 1-n cloud_sync_jobs khi phụ huynh bật đồng bộ
Client local DB 1-n local_custom_word_media cho video local-only
children 1-n learning_sessions
learning_sessions 1-n learning_events
speech_recordings 1-1 speech_analysis_results
children 1-n communication_events
children 1-n progress_snapshots
```

## Local DB phía client không nằm trong database server

```text
local_custom_word_media
local_cached_system_media
local_sync_queue
```

Backend chỉ quản lý cloud metadata và learning events. File local của phụ huynh vẫn nằm trong app sandbox của thiết bị.

---

# 6. API workflow theo từng màn hình app hiện tại

## 6.1 Home screen

Frontend cần gọi:

```http
GET /children/:childId/recommendations/today
GET /categories
GET /children/:childId/progress/summary
```

Backend trả:

```json
{
  "recommendedLessons": [],
  "categories": [],
  "progressSummary": {}
}
```

---

## 6.2 Category / Word list screen

Frontend gọi:

```http
GET /categories/:categoryId/words?childId=:childId
```

Backend trả video mẫu và video cá nhân hóa đã đồng bộ cloud nếu có. App vẫn cần kiểm tra local DB trước khi quyết định video cuối cùng.

```json
{
  "category": {
    "id": "gia-dinh",
    "name": "Gia đình"
  },
  "words": [
    {
      "id": "me",
      "text": "Mẹ",
      "imageUrl": "...",
      "defaultVideoUrl": "...",
      "cloudCustomVideoUrl": "...",
      "hasCloudCustomVideo": true,
      "practiceStatus": "practiced"
    }
  ]
}
```

Logic chọn video ở client:

```text
Nếu local DB có local custom video cho child_id + word_id
   -> phát local video
Ngược lại nếu backend có cloudCustomVideoUrl
   -> phát cloud parent video
Ngược lại
   -> phát defaultVideoUrl của hệ thống
```

---

## 6.3 Learning screen

Khi vào màn học:

```http
POST /learning-sessions
```

Khi bấm phát video:

```http
POST /learning-sessions/:sessionId/events
```

Payload khi phát video mẫu:

```json
{
  "eventType": "video_played",
  "wordId": "me",
  "payload": {
    "mediaSource": "system_default",
    "repeatCount": 3,
    "speed": 1.0
  }
}
```

Payload khi phát video phụ huynh lưu local:

```json
{
  "eventType": "video_played",
  "wordId": "me",
  "payload": {
    "mediaSource": "local_parent_video",
    "localVideoId": "local_vid_001",
    "repeatCount": 3,
    "speed": 1.0
  }
}
```

Payload khi phát video phụ huynh đã đồng bộ cloud:

```json
{
  "eventType": "video_played",
  "wordId": "me",
  "payload": {
    "mediaSource": "cloud_parent_video",
    "mediaAssetId": "media_123",
    "repeatCount": 3,
    "speed": 1.0
  }
}
```

Khi kết thúc bài:

```http
POST /learning-sessions/:sessionId/complete
```

---

## 6.4 Custom video phụ huynh: local-first + sync tuỳ chọn

### Mode A: Local-only cho MVP

```text
Client quay/chọn video
   -> App nén video nếu cần
   -> App lưu vào local app storage
   -> App lưu metadata vào local DB
   -> App dùng video này khi trẻ học từ tương ứng
   -> Backend không nhận file video
   -> Backend chỉ nhận learning events khi video được sử dụng
```

Không bắt buộc có API upload trong mode này.

### Mode B: Cloud sync optional

```text
Parent bật đồng bộ
   -> App lấy video từ local storage
   -> POST /media/presign-upload
   -> Upload file lên object storage private
   -> POST /media/complete-upload
   -> POST /children/:childId/words/:wordId/cloud-custom-media
   -> Backend xử lý video nếu cần
   -> Backend trả cloud media asset
   -> App cập nhật local DB: sync_status = synced
   -> Thiết bị khác có thể dùng signed playback URL
```

API cho mode B:

```http
POST /media/presign-upload
POST /media/complete-upload
POST /children/:childId/words/:wordId/cloud-custom-media
GET  /children/:childId/words/:wordId/cloud-custom-media
DELETE /children/:childId/cloud-custom-media/:customMediaId
```

---

## 6.5 Ghi âm và AI phát âm

```text
Client ghi âm
   -> POST /speech-recordings/presign-upload
   -> Upload audio
   -> POST /speech-recordings/complete-upload
   -> Backend queue AI analysis
   -> GET /speech-recordings/:recordingId
   -> Hiển thị feedback
```

---

# 7. Queue jobs cần có

```text
media.process_video
media.generate_thumbnail
media.extract_audio
media.sync_parent_video_to_cloud
media.cleanup_deleted_cloud_media
speech.analyze_pronunciation
progress.recalculate_child_progress
report.generate_weekly_report
notification.send_daily_reminder
subscription.sync_payment_status
```

---

# 8. Security & privacy cho trẻ em

## Nguyên tắc bắt buộc

```text
- Không public dữ liệu trẻ
- Không lưu thông tin nhạy cảm nếu không cần
- Media upload phải private
- URL media nên dùng signed URL có thời hạn
- Video phụ huynh nên local-first, cloud sync chỉ bật khi có consent
- App cần cho phụ huynh chọn: chỉ lưu trên thiết bị hoặc đồng bộ an toàn
- Có quyền xóa toàn bộ dữ liệu trẻ trên cloud; app cần có nút xóa dữ liệu local trên thiết bị
- Không dùng recording/video của trẻ để train AI nếu chưa có consent rõ ràng
```

## Quyền truy cập

```text
Parent chỉ xem được child của mình
MVP không có role chuyên gia truy cập từ xa; chuyên gia chỉ xem khi phụ huynh mở dashboard hoặc xuất báo cáo
Admin không nên xem media riêng nếu không có lý do hỗ trợ
Backend không đọc được video local-only vì file không rời khỏi thiết bị
Cloud custom video chỉ được cấp signed URL sau khi kiểm tra quyền child_id
```

---

# 9. MVP backend nên làm trước

## Phase 1: Backend cơ bản

```text
- Auth
- Child profile
- Categories
- Word items
- Custom video local-first trên thiết bị
- Optional cloud sync cho video phụ huynh
- Learning session events
- Basic progress summary
```

## Phase 2: Giao tiếp chức năng

```text
- PECS cards
- Communication board
- Communication events
- Daily recommendations
```

## Phase 3: AI phát âm

```text
- Audio recording upload
- Speech analysis queue
- Pronunciation score
- Feedback đơn giản
```

## Phase 4: Báo cáo cho phụ huynh và chế độ tư vấn

```text
- Parent dashboard rõ ràng để đưa chuyên gia xem trực tiếp
- Weekly/monthly report
- Export PDF
- Consultation mode: ẩn thông tin nhạy cảm nếu phụ huynh muốn
```

---

# 10. Cấu trúc thư mục backend gợi ý

## Nếu dùng NestJS

```text
src/
  app.module.ts
  auth/
  users/
  children/
  content/
    categories/
    words/
    lessons/
  media/
  learning/
    sessions/
    events/
  speech/
    recordings/
    analysis/
  communication/
    cards/
    boards/
    events/
  progress/
  recommendations/
  notifications/
  subscriptions/
  common/
    guards/
    decorators/
    filters/
    interceptors/
  database/
    migrations/
    seeds/
```

## Nếu dùng FastAPI

```text
app/
  main.py
  core/
    config.py
    security.py
  modules/
    auth/
    users/
    children/
    content/
    media/
    learning/
    speech/
    communication/
    progress/
    recommendations/
    notifications/
    subscriptions/
  db/
    models.py
    migrations/
    session.py
  workers/
    media_worker.py
    speech_worker.py
```

---

# 11. Backend workflow tổng hợp MVP

```text
1. Parent đăng ký / đăng nhập
2. Parent tạo hồ sơ trẻ
3. Backend đề xuất bài học theo level
4. App tải categories và word items từ backend
5. App tải video mẫu từ cloud và cache local nếu cần
6. Trẻ chọn từ và xem video khẩu hình
7. Nếu phụ huynh đã quay video riêng trên thiết bị, app ưu tiên video local
8. App gửi learning events về backend, kèm media_source
9. Parent có thể bật cloud sync để backup video riêng
10. Nếu cloud sync bật, backend tạo presigned URL và lưu media metadata
11. Trẻ ghi âm bắt chước từ nếu bật bài luyện phát âm
12. Backend gửi audio sang AI analysis nếu phụ huynh đồng ý dùng AI
13. Backend lưu điểm phát âm và feedback
14. Backend cập nhật progress summary
15. Parent xem báo cáo tuần / tháng
16. Khi cần tư vấn, phụ huynh mở dashboard hoặc xuất báo cáo PDF để chuyên gia xem trong buổi gặp
```

---

# 12. Definition of Done cho backend MVP

Backend MVP được coi là hoàn thành khi:

```text
- Có đăng nhập và phân quyền parent
- Tạo được hồ sơ trẻ
- Lấy được danh mục và từ vựng từ database
- Trả được video mẫu hệ thống từ cloud storage/CDN
- App có thể ưu tiên video phụ huynh local nếu local DB có dữ liệu
- Learning event ghi được media_source: system_default | local_parent_video | cloud_parent_video
- Có API optional cloud sync cho video phụ huynh khi cần backup / nhiều thiết bị
- Ghi lại được learning session và events
- Tính được số từ đã học, số ngày học, thời lượng học
- Có API progress summary
- Có parent dashboard để phụ huynh xem hoặc đưa chuyên gia xem trực tiếp
- Có API export báo cáo PDF cơ bản nếu cần chia sẻ ngoài app
- Có cấu trúc sẵn để thêm AI phát âm ở phase sau
```

---

# 13. Ưu tiên triển khai ngay cho demo hiện tại

Với demo `speechtherapyapp.tsx`, backend nên bắt đầu bằng 6 API sau:

```http
POST /auth/login
POST /children
GET  /categories
GET  /categories/:categoryId/words?childId=:childId
POST /learning-sessions
POST /learning-sessions/:sessionId/events
```

Ở giai đoạn demo, video phụ huynh có thể lưu local trên thiết bị nên chưa bắt buộc làm upload cloud.

Sau đó thêm cloud sync optional:

```http
POST /media/presign-upload
POST /media/complete-upload
POST /children/:childId/words/:wordId/cloud-custom-media
GET  /children/:childId/words/:wordId/cloud-custom-media
DELETE /children/:childId/cloud-custom-media/:customMediaId
```

Sau đó thêm progress và AI:

```http
GET  /children/:childId/progress/summary
POST /speech-recordings/complete-upload
GET  /speech-recordings/:recordingId
```

---

# 14. Ghi chú sản phẩm

KidEDU không nên chỉ là app học từ vựng. Backend nên được thiết kế để phục vụ mục tiêu lớn hơn:

```text
Từ học từ đơn
   -> Bắt chước khẩu hình
   -> Ghi âm và phản hồi
   -> Giao tiếp nhu cầu
   -> Ghép câu
   -> Theo dõi tiến bộ
   -> Dashboard/báo cáo để phụ huynh trao đổi với chuyên gia khi cần
```

Nguyên tắc sản phẩm về video:

```text
MVP:
Video mẫu ở cloud, video phụ huynh lưu local.

Production:
Video mẫu ở cloud, video phụ huynh local-first, cloud sync là tuỳ chọn.
```

Đây là hướng giúp KidEDU có giá trị thực tế và có khả năng phát triển thành sản phẩm thương mại lâu dài.

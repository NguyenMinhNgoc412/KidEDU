> Module 05 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 05 — Parent Local Video Metadata

## 5.1 Mục tiêu

Cho phép phụ huynh quay video khẩu hình riêng cho trẻ, nhưng MVP lưu video trên máy khách trước.

Backend chỉ lưu metadata để:

```text
- Biết từ nào có video phụ huynh.
- Biết video nằm trên thiết bị nào.
- Thống kê việc bé học bằng video mẫu hay video phụ huynh.
- Chuẩn bị cho cloud backup sau này nếu phụ huynh bật.
```

---

## 5.2 Phụ thuộc

```text
- Module 01 Backend Foundation
- Module 02 Child Profile
- Module 03 Learning Content Catalog
```

---

## 5.3 Database cần có

### parent_media_metadata

```sql
CREATE TABLE parent_media_metadata (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  word_id UUID NULL REFERENCES word_items(id),
  lesson_id UUID NULL REFERENCES lessons(id),
  device_id UUID NULL REFERENCES device_clients(id),

  media_type TEXT DEFAULT 'video',
  purpose TEXT DEFAULT 'parent_mouth_model',

  client_local_media_id TEXT NOT NULL,
  client_local_ref TEXT NULL,

  original_filename TEXT NULL,
  mime_type TEXT NULL,
  file_size BIGINT NULL,
  duration_seconds INTEGER NULL,

  thumbnail_client_local_ref TEXT NULL,

  sync_status TEXT DEFAULT 'local_only',
  cloud_media_id UUID NULL,

  status TEXT DEFAULT 'active',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP NULL
);
```

---

## 5.4 Lưu ý quan trọng về local path

Backend không nên phụ thuộc vào đường dẫn tuyệt đối trên máy khách.

Không nên lưu kiểu:

```text
/var/mobile/Containers/Data/Application/xxx/video.mp4
C:\Users\...\video.mp4
```

Nên lưu:

```text
client_local_media_id: local-video-001
client_local_ref: child_123/word_me/local-video-001
```

Frontend local database sẽ map:

```text
client_local_media_id -> local file URI thật
```

---

## 5.5 Sync status

```text
local_only
pending_cloud_backup
uploading
synced
failed
deleted
```

Trong MVP mặc định:

```text
local_only
```

---

## 5.6 API cần làm

### POST /children/:childId/parent-media

Tạo metadata cho video phụ huynh.

Request:

```json
{
  "wordId": "word-me",
  "deviceId": "device-id",
  "clientLocalMediaId": "local-video-001",
  "clientLocalRef": "child_123/word_me/local-video-001",
  "mimeType": "video/mp4",
  "fileSize": 2800000,
  "durationSeconds": 4
}
```

Response:

```json
{
  "data": {
    "id": "parent-media-id",
    "childId": "child-id",
    "wordId": "word-me",
    "clientLocalMediaId": "local-video-001",
    "syncStatus": "local_only",
    "status": "active"
  },
  "meta": {},
  "error": null
}
```

---

### GET /children/:childId/parent-media

Lấy danh sách metadata video phụ huynh.

Query optional:

```http
?wordId=<word_id>&deviceId=<device_id>&status=active
```

---

### PATCH /children/:childId/parent-media/:mediaId

Cập nhật metadata.

Request ví dụ:

```json
{
  "durationSeconds": 5,
  "thumbnailClientLocalRef": "child_123/word_me/thumb-local-video-001.jpg"
}
```

---

### DELETE /children/:childId/parent-media/:mediaId

Xóa mềm metadata.

---

## 5.7 Backend workflow

### Phụ huynh quay video

```text
1. Phụ huynh bấm quay video trong frontend.
2. App quay video và lưu vào bộ nhớ app trên thiết bị.
3. App tạo clientLocalMediaId.
4. App lưu local URI thật vào local database.
5. App gọi POST /children/:childId/parent-media.
6. Backend kiểm tra child thuộc parent hiện tại.
7. Backend kiểm tra wordId tồn tại.
8. Backend lưu metadata.
9. Backend trả media metadata.
10. Frontend dùng metadata để biết từ này có video phụ huynh.
```

### Bé học với video phụ huynh

```text
1. Frontend lấy danh sách parent-media của child.
2. Với mỗi word, frontend kiểm tra local database có file thật không.
3. Nếu có file local, hiển thị nút "Video của ba/mẹ".
4. Khi bé bấm xem, frontend phát video local.
5. Frontend gửi learning event với mediaSource = local_parent_video.
```

---

## 5.8 Business rules

```text
- Backend không nhận file video trong MVP.
- Một child có thể có nhiều video cho cùng một word.
- Một video local chỉ chắc chắn phát được trên thiết bị đã quay/lưu.
- Nếu thiết bị khác không có file local, frontend không được cố phát.
- Nếu parent xóa video local, frontend phải gọi DELETE metadata hoặc đánh dấu missing local file.
- Cloud backup là module sau, không bắt buộc.
```

---

## 5.9 Error codes

```text
PARENT_MEDIA_NOT_FOUND
INVALID_MEDIA_TYPE
INVALID_LOCAL_MEDIA_ID
CHILD_NOT_FOUND
WORD_NOT_FOUND
DEVICE_NOT_FOUND
MEDIA_ACCESS_DENIED
```

---

## 5.10 Test checklist

```text
[ ] Tạo metadata video local thành công.
[ ] Không tạo được nếu child không thuộc parent.
[ ] Không tạo được nếu word không tồn tại.
[ ] GET parent-media filter theo wordId đúng.
[ ] DELETE là soft delete.
[ ] Một word có thể có nhiều parent video.
[ ] Backend không yêu cầu upload file.
```

---

## 5.11 Definition of Done

Module này hoàn thành khi:

```text
- Phụ huynh quay video và frontend lưu local được.
- Backend lưu được metadata.
- Learning module biết khi nào bé xem video phụ huynh.
- Không có video riêng tư nào bị upload tự động.
```

---

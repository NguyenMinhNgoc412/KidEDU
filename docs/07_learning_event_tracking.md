> Module 07 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 07 — Learning Event Tracking

## 7.1 Mục tiêu

Ghi lại các hành động nhỏ trong quá trình trẻ học.

Ví dụ:

```text
- Bé mở một từ.
- Bé xem video mẫu.
- Bé xem video phụ huynh.
- Bé bấm chọn đúng.
- Bé bấm chọn sai.
- Bé hoàn thành một từ.
- Phụ huynh đánh dấu bé phản hồi tốt.
```

---

## 7.2 Phụ thuộc

```text
- Module 06 Learning Session
- Module 03 Learning Content Catalog
- Module 05 Parent Local Video Metadata
```

---

## 7.3 Database cần có

### learning_events

```sql
CREATE TABLE learning_events (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  session_id UUID NULL REFERENCES learning_sessions(id),
  device_id UUID NULL REFERENCES device_clients(id),

  client_event_id TEXT NULL,

  event_type TEXT NOT NULL,

  word_id UUID NULL REFERENCES word_items(id),
  lesson_id UUID NULL REFERENCES lessons(id),

  media_source TEXT NULL,
  media_id UUID NULL,
  parent_media_id UUID NULL,

  result TEXT NULL,
  score NUMERIC NULL,

  payload JSONB DEFAULT '{}',

  client_created_at TIMESTAMP NULL,
  server_received_at TIMESTAMP DEFAULT now(),

  created_at TIMESTAMP DEFAULT now()
);
```

---

## 7.4 Event type đề xuất

```text
session_started
session_ended

word_viewed
word_completed
word_skipped

system_video_played
parent_video_played

audio_played
image_viewed

child_tapped_correct
child_tapped_wrong

parent_marked_easy
parent_marked_hard
parent_marked_needs_help

quick_comm_card_tapped
```

---

## 7.5 Media source

```text
system_default
local_parent_video
cloud_parent_video
none
```

Trong MVP thường dùng:

```text
system_default
local_parent_video
none
```

---

## 7.6 Result

```text
success
failed
partial
skipped
unknown
```

---

## 7.7 API cần làm

### POST /children/:childId/events

Ghi một event.

Request:

```json
{
  "sessionId": "session-id",
  "deviceId": "device-id",
  "clientEventId": "event-001",
  "eventType": "parent_video_played",
  "wordId": "word-me",
  "mediaSource": "local_parent_video",
  "parentMediaId": "parent-media-id",
  "result": "success",
  "clientCreatedAt": "2026-06-22T10:01:00.000Z",
  "payload": {
    "playbackSpeed": 0.75,
    "repeatIndex": 2
  }
}
```

Response:

```json
{
  "data": {
    "eventId": "event-id",
    "accepted": true
  },
  "meta": {},
  "error": null
}
```

---

## 7.8 Backend workflow

```text
1. Frontend gửi event.
2. Backend kiểm tra child thuộc parent.
3. Nếu có sessionId, kiểm tra session thuộc child.
4. Validate eventType.
5. Validate wordId nếu event liên quan tới word.
6. Validate parentMediaId nếu mediaSource = local_parent_video.
7. Check clientEventId đã tồn tại chưa.
8. Nếu đã tồn tại, trả accepted = true để chống duplicate.
9. Insert learning_event.
10. Gọi Progress Engine để update child_word_progress.
11. Trả eventId.
```

---

## 7.9 Idempotency rule

Để hỗ trợ offline sync, không được lưu trùng event.

Unique key đề xuất:

```sql
UNIQUE(parent_id, child_id, client_event_id)
```

Chỉ áp dụng khi `client_event_id` không null.

---

## 7.10 Business rules

```text
- Event là log, không sửa sau khi tạo.
- Nếu cần sửa ý nghĩa, tạo event mới.
- Payload chỉ lưu thông tin bổ sung, không lạm dụng để thay thế cột chính.
- Event từ offline có thể gửi muộn.
- server_received_at là thời điểm server nhận, client_created_at là thời điểm app ghi nhận.
```

---

## 7.11 Error codes

```text
INVALID_EVENT_TYPE
EVENT_DUPLICATE
SESSION_NOT_FOUND
WORD_NOT_FOUND
PARENT_MEDIA_NOT_FOUND
INVALID_MEDIA_SOURCE
```

---

## 7.12 Test checklist

```text
[ ] Gửi event word_viewed thành công.
[ ] Gửi event parent_video_played thành công.
[ ] Gửi trùng clientEventId không tạo record trùng.
[ ] Event có sessionId sai bị reject.
[ ] Event có wordId sai bị reject.
[ ] Progress được cập nhật sau event phù hợp.
```

---

## 7.13 Definition of Done

Module này hoàn thành khi:

```text
- Frontend ghi được hành vi học.
- Backend chống duplicate event.
- Event đủ dữ liệu để tạo dashboard tiến độ.
```

---

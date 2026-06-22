> Module 06 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 06 — Learning Session

## 6.1 Mục tiêu

Ghi nhận một phiên học của trẻ.

Một session có thể là:

```text
- Bé học một bài lesson.
- Bé luyện một nhóm từ.
- Bé dùng quick communication.
- Bé xem video mẫu.
```

---

## 6.2 Phụ thuộc

```text
- Module 02 Child Profile
- Module 03 Learning Content Catalog
- Module 04 System Media Manifest
- Module 05 Parent Local Video Metadata
```

---

## 6.3 Database cần có

### learning_sessions

```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  device_id UUID NULL REFERENCES device_clients(id),

  lesson_id UUID NULL REFERENCES lessons(id),

  session_type TEXT DEFAULT 'word_practice',
  status TEXT DEFAULT 'active',

  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NULL,

  duration_seconds INTEGER NULL,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 6.4 Session type

```text
word_practice
lesson_practice
quick_communication
review
free_play
```

---

## 6.5 API cần làm

### POST /children/:childId/sessions/start

Request:

```json
{
  "deviceId": "device-id",
  "lessonId": "lesson-id",
  "sessionType": "lesson_practice",
  "startedAt": "2026-06-22T10:00:00.000Z",
  "clientSessionId": "client-session-001"
}
```

Response:

```json
{
  "data": {
    "sessionId": "session-id",
    "childId": "child-id",
    "status": "active",
    "startedAt": "2026-06-22T10:00:00.000Z"
  },
  "meta": {},
  "error": null
}
```

---

### POST /children/:childId/sessions/:sessionId/end

Request:

```json
{
  "endedAt": "2026-06-22T10:05:00.000Z",
  "durationSeconds": 300
}
```

---

## 6.6 Backend workflow

### Start session

```text
1. Frontend gọi start session khi bé bắt đầu học.
2. Backend kiểm tra child thuộc parent.
3. Nếu có lessonId, kiểm tra lesson tồn tại.
4. Tạo learning_session status active.
5. Trả sessionId.
6. Frontend dùng sessionId cho các learning event.
```

### End session

```text
1. Frontend gọi end session.
2. Backend kiểm tra session thuộc child và parent.
3. Update ended_at, duration_seconds.
4. Đổi status thành completed.
5. Trigger progress recalculation nếu cần.
6. Trả summary ngắn.
```

---

## 6.7 Business rules

```text
- Một child có thể có nhiều session trong ngày.
- Không bắt buộc session phải có lessonId.
- Nếu app crash trước khi end session, backend có thể auto close sau này.
- Duration client gửi chỉ dùng tham khảo, backend có thể tự tính từ started_at/ended_at.
```

---

## 6.8 Error codes

```text
SESSION_NOT_FOUND
SESSION_ALREADY_ENDED
INVALID_SESSION_TYPE
LESSON_NOT_FOUND
CHILD_ACCESS_DENIED
```

---

## 6.9 Test checklist

```text
[ ] Start session thành công.
[ ] End session thành công.
[ ] Không end được session của child khác.
[ ] Start session không cần lessonId vẫn được.
[ ] Duration được lưu đúng.
[ ] Session completed không cho end lần hai.
```

---

## 6.10 Definition of Done

Module này hoàn thành khi:

```text
- Frontend tạo được session học.
- Backend lưu được thời gian học.
- Event tracking có thể gắn vào session.
```

---

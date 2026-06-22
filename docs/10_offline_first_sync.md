> Module 10 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 10 — Offline-first Sync

## 10.1 Mục tiêu

Cho phép app ghi event offline rồi đồng bộ lên backend khi có mạng.

Quan trọng vì trẻ nhỏ cần app phản hồi nhanh, không nên phụ thuộc mạng liên tục.

---

## 10.2 Phụ thuộc

```text
- Module 07 Learning Event Tracking
- Module 08 Progress Engine
```

---

## 10.3 Database cần có

### client_sync_batches

```sql
CREATE TABLE client_sync_batches (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NULL REFERENCES child_profiles(id),
  device_id UUID NULL REFERENCES device_clients(id),

  client_batch_id TEXT NOT NULL,

  total_events INTEGER DEFAULT 0,
  accepted_events INTEGER DEFAULT 0,
  rejected_events INTEGER DEFAULT 0,

  status TEXT DEFAULT 'processed',

  created_at TIMESTAMP DEFAULT now(),

  UNIQUE(parent_id, client_batch_id)
);
```

---

## 10.4 API cần làm

### POST /sync/events

Request:

```json
{
  "deviceId": "device-id",
  "clientBatchId": "batch-001",
  "events": [
    {
      "childId": "child-id",
      "sessionId": "session-id",
      "clientEventId": "event-001",
      "eventType": "word_viewed",
      "wordId": "word-me",
      "clientCreatedAt": "2026-06-22T10:00:00.000Z",
      "payload": {}
    }
  ]
}
```

Response:

```json
{
  "data": {
    "clientBatchId": "batch-001",
    "status": "processed",
    "totalEvents": 1,
    "acceptedEvents": 1,
    "rejectedEvents": 0,
    "results": [
      {
        "clientEventId": "event-001",
        "accepted": true,
        "eventId": "event-id"
      }
    ]
  },
  "meta": {},
  "error": null
}
```

---

## 10.5 Backend workflow

```text
1. Frontend gom event offline thành batch.
2. Frontend gọi POST /sync/events.
3. Backend kiểm tra clientBatchId đã xử lý chưa.
4. Nếu batch đã xử lý, trả kết quả cũ nếu có thể.
5. Nếu batch mới, tạo client_sync_batches.
6. Lặp qua từng event.
7. Validate từng event.
8. Insert event nếu chưa có clientEventId.
9. Update progress cho event được accept.
10. Ghi accepted/rejected count.
11. Trả kết quả chi tiết từng event.
```

---

## 10.6 Conflict rules

```text
- Duplicate clientEventId: accepted = true nhưng không insert lại.
- Event gửi muộn vẫn được nhận nếu child/session hợp lệ.
- Nếu session đã ended, vẫn có thể nhận event offline trong session đó.
- Nếu word bị disabled sau khi event tạo offline, vẫn có thể nhận nếu word tồn tại.
- clientCreatedAt dùng cho timeline học, server_received_at dùng cho audit.
```

---

## 10.7 Business rules

```text
- Sync batch không upload video file.
- Sync batch chỉ gửi event/metadata.
- Không để một batch quá lớn.
- Giới hạn MVP: tối đa 500 events/batch.
- Nếu một event lỗi, không làm fail cả batch.
```

---

## 10.8 Error codes

```text
SYNC_BATCH_TOO_LARGE
INVALID_SYNC_BATCH
SYNC_EVENT_PARTIAL_FAILURE
DEVICE_NOT_FOUND
CLIENT_BATCH_DUPLICATE
```

---

## 10.9 Test checklist

```text
[ ] Sync một batch 10 event thành công.
[ ] Gửi lại cùng batch không tạo event trùng.
[ ] Một event lỗi không làm fail cả batch.
[ ] Duplicate clientEventId không tăng progress lần hai.
[ ] Batch quá lớn bị reject.
```

---

## 10.10 Definition of Done

Module này hoàn thành khi:

```text
- App có thể học offline.
- Event offline sync được lên backend.
- Progress không bị cộng trùng.
```

---

> Module 09 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 09 — Parent Dashboard Data

## 9.1 Mục tiêu

Trả dữ liệu cho Parent Dashboard.

Dashboard không dành cho chuyên gia đăng nhập riêng. Nếu chuyên gia cần xem, phụ huynh mở dashboard cho xem trực tiếp.

Dashboard cần giúp phụ huynh biết:

```text
- Bé học bao nhiêu ngày.
- Bé luyện bao nhiêu từ.
- Từ nào phản hồi tốt.
- Từ nào cần luyện thêm.
- Gần đây bé học gì.
- Nên luyện tiếp từ nào.
```

---

## 9.2 Phụ thuộc

```text
- Module 08 Progress Engine
- Module 06 Learning Session
- Module 07 Learning Event Tracking
```

---

## 9.3 API cần làm

### GET /children/:childId/dashboard/summary

Query optional:

```http
?from=2026-06-01&to=2026-06-22
```

Response:

```json
{
  "data": {
    "child": {
      "id": "child-id",
      "nickname": "Bé Bông"
    },
    "summary": {
      "totalPracticeDays": 12,
      "totalSessions": 28,
      "totalPracticeMinutes": 140,
      "totalWordsSeen": 35,
      "totalWordsPracticing": 20,
      "totalWordsMastered": 5,
      "totalWordsNeedHelp": 4
    },
    "recentActivity": [
      {
        "date": "2026-06-22",
        "sessionCount": 2,
        "practiceMinutes": 12
      }
    ],
    "recommendedNextWords": [
      {
        "wordId": "word-uong-nuoc",
        "textVi": "Uống nước",
        "reason": "Nhu cầu cơ bản nên luyện thêm"
      }
    ]
  },
  "meta": {},
  "error": null
}
```

---

### GET /children/:childId/dashboard/words

Query optional:

```http
?status=needs_help
```

Response:

```json
{
  "data": [
    {
      "wordId": "word-me",
      "textVi": "Mẹ",
      "status": "familiar",
      "practiceCount": 10,
      "successCount": 6,
      "wrongCount": 1,
      "parentVideoPlayCount": 4,
      "lastPracticedAt": "2026-06-22T10:00:00.000Z"
    }
  ],
  "meta": {
    "count": 1
  },
  "error": null
}
```

---

### POST /children/:childId/words/:wordId/mark

Phụ huynh đánh dấu thủ công.

Request:

```json
{
  "mark": "needs_help",
  "note": "Bé chưa chịu nói từ này"
}
```

Backend nên tạo learning event:

```text
parent_marked_needs_help
```

Không nên update progress trực tiếp mà bỏ qua event.

---

## 9.4 Backend workflow

### Dashboard summary

```text
1. Kiểm tra child thuộc parent.
2. Query learning_sessions theo child/date range.
3. Query child_word_progress theo child.
4. Tổng hợp số ngày học, số session, số phút.
5. Đếm word theo status.
6. Query activity gần đây.
7. Tạo danh sách recommendedNextWords.
8. Trả response.
```

### Recommended next words rule MVP

```text
Ưu tiên:
1. Từ thuộc nhu cầu cơ bản.
2. Từ status = needs_help.
3. Từ mới cùng difficulty level.
4. Từ có parent video nhưng bé chưa luyện nhiều.
```

---

## 9.5 Business rules

```text
- Dashboard chỉ là dữ liệu cho phụ huynh.
- Không cần specialist permission.
- Không trả dữ liệu child khác.
- Date range quá dài có thể giới hạn 90 ngày.
- Nếu chưa có dữ liệu học, dashboard trả empty state.
```

---

## 9.6 Error codes

```text
DASHBOARD_NOT_AVAILABLE
INVALID_DATE_RANGE
CHILD_NOT_FOUND
WORD_NOT_FOUND
INVALID_MARK_TYPE
```

---

## 9.7 Test checklist

```text
[ ] Dashboard summary trả đúng khi chưa có event.
[ ] Dashboard summary trả đúng khi có session/event.
[ ] Word list filter theo status đúng.
[ ] Mark needs_help tạo learning event.
[ ] Parent A không xem dashboard child của Parent B.
[ ] Date range invalid bị reject.
```

---

## 9.8 Definition of Done

Module này hoàn thành khi:

```text
- Parent Dashboard có dữ liệu đủ để hiển thị.
- Phụ huynh có thể mở dashboard cho chuyên gia xem.
- Không cần specialist role.
```

---

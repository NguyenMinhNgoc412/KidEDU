> Module 12 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 12 — Report Data Export

## 12.1 Mục tiêu

Cung cấp dữ liệu để phụ huynh xem hoặc xuất báo cáo.

MVP nên để frontend render báo cáo hoặc xuất PDF/ảnh từ màn hình. Backend chỉ trả dữ liệu sạch.

---

## 12.2 Phụ thuộc

```text
- Module 09 Parent Dashboard Data
- Module 08 Progress Engine
- Module 06 Learning Session
```

---

## 12.3 API cần làm

### GET /children/:childId/reports/summary

Query:

```http
?from=2026-06-01&to=2026-06-22
```

Response:

```json
{
  "data": {
    "child": {
      "nickname": "Bé Bông",
      "birthYear": 2021,
      "communicationLevel": "single_words"
    },
    "period": {
      "from": "2026-06-01",
      "to": "2026-06-22"
    },
    "summary": {
      "practiceDays": 12,
      "sessions": 28,
      "practiceMinutes": 140,
      "wordsSeen": 35,
      "wordsMastered": 5,
      "wordsNeedHelp": 4
    },
    "topPracticedWords": [
      {
        "textVi": "Mẹ",
        "practiceCount": 15,
        "status": "familiar"
      }
    ],
    "needsHelpWords": [
      {
        "textVi": "Uống nước",
        "reason": "Phụ huynh đánh dấu cần luyện thêm"
      }
    ],
    "suggestions": [
      "Tiếp tục luyện các từ nhu cầu cơ bản trong bữa ăn.",
      "Ưu tiên dùng video phụ huynh cho các từ bé ít chú ý."
    ]
  },
  "meta": {},
  "error": null
}
```

---

## 12.4 Backend workflow

```text
1. Kiểm tra child thuộc parent.
2. Validate date range.
3. Query dashboard summary.
4. Query top practiced words.
5. Query needs help words.
6. Generate suggestions bằng rule đơn giản.
7. Trả JSON cho frontend.
```

---

## 12.5 Suggestion rules MVP

```text
Nếu totalPracticeDays < 3:
  Gợi ý học ngắn 3-5 phút mỗi ngày.

Nếu wordsNeedHelp > 0:
  Gợi ý luyện lại nhóm từ needs_help.

Nếu parentVideoPlayCount thấp:
  Gợi ý quay video phụ huynh cho các từ quan trọng.

Nếu child có nhiều success_count:
  Gợi ý tăng difficulty level nhẹ.
```

---

## 12.6 Business rules

```text
- Report không cần specialist account.
- Không gửi tự động cho chuyên gia.
- Không chứa video riêng tư.
- Nếu xuất PDF, nên làm ở frontend trong MVP.
```

---

## 12.7 Error codes

```text
REPORT_NOT_AVAILABLE
INVALID_REPORT_DATE_RANGE
REPORT_DATA_EMPTY
```

---

## 12.8 Test checklist

```text
[ ] Report trả đúng khi có dữ liệu.
[ ] Report trả empty state khi chưa học.
[ ] Date range invalid bị reject.
[ ] Suggestions trả hợp lý theo dữ liệu.
[ ] Report không chứa local video path thật.
```

---

## 12.9 Definition of Done

Module này hoàn thành khi:

```text
- Phụ huynh xem được báo cáo tiến độ.
- Phụ huynh có thể đưa màn hình này cho chuyên gia xem.
- Dữ liệu báo cáo không phụ thuộc role chuyên gia.
```

---

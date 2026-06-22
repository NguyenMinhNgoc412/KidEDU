> Module 08 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 08 — Progress Engine

## 8.1 Mục tiêu

Tính tiến độ học của từng trẻ theo từng từ.

Progress Engine không phải API lớn riêng, mà là logic backend chạy khi có learning event.

Nó giúp dashboard biết:

```text
- Bé đã luyện từ nào.
- Từ nào luyện nhiều.
- Từ nào bé phản hồi tốt.
- Từ nào cần luyện thêm.
- Lần cuối luyện là khi nào.
```

---

## 8.2 Phụ thuộc

```text
- Module 07 Learning Event Tracking
- Module 03 Learning Content Catalog
```

---

## 8.3 Database cần có

### child_word_progress

```sql
CREATE TABLE child_word_progress (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  word_id UUID NOT NULL REFERENCES word_items(id),

  exposure_count INTEGER DEFAULT 0,
  practice_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,

  system_video_play_count INTEGER DEFAULT 0,
  parent_video_play_count INTEGER DEFAULT 0,

  last_practiced_at TIMESTAMP NULL,
  first_practiced_at TIMESTAMP NULL,

  status TEXT DEFAULT 'not_started',
  mastery_score NUMERIC DEFAULT 0,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(child_id, word_id)
);
```

---

## 8.4 Progress status

```text
not_started
seen
practicing
familiar
needs_help
mastered
```

---

## 8.5 Event-to-progress mapping

```text
word_viewed:
  exposure_count +1
  status -> seen nếu đang not_started

system_video_played:
  system_video_play_count +1
  exposure_count +1

parent_video_played:
  parent_video_play_count +1
  exposure_count +1

word_completed:
  practice_count +1

child_tapped_correct:
  practice_count +1
  success_count +1

child_tapped_wrong:
  practice_count +1
  wrong_count +1

parent_marked_easy:
  success_count +1
  mastery_score + small boost

parent_marked_hard:
  status -> needs_help

parent_marked_needs_help:
  status -> needs_help
```

---

## 8.6 Mastery score gợi ý

Công thức MVP đơn giản:

```text
mastery_score =
  success_count * 2
  + parent_video_play_count * 0.5
  + system_video_play_count * 0.25
  - wrong_count * 1
```

Sau đó clamp:

```text
minimum = 0
maximum = 100
```

Status gợi ý:

```text
0:
  not_started

1-5:
  seen

6-15:
  practicing

16-30:
  familiar

>30 và wrong_count thấp:
  mastered

Nếu parent_marked_needs_help:
  needs_help
```

---

## 8.7 Backend workflow

```text
1. Learning Event module insert event.
2. Nếu event có word_id, gọi Progress Engine.
3. Progress Engine tìm child_word_progress theo child_id + word_id.
4. Nếu chưa có thì tạo mới.
5. Cập nhật count theo event_type.
6. Tính lại mastery_score.
7. Tính lại status.
8. Update last_practiced_at.
9. Lưu progress.
10. Commit transaction.
```

---

## 8.8 Transaction rule

Nên lưu event và update progress trong cùng transaction:

```text
BEGIN
  insert learning_event
  upsert child_word_progress
COMMIT
```

Nếu progress update fail, event cũng nên rollback để tránh lệch dữ liệu.

---

## 8.9 Business rules

```text
- Progress là dữ liệu tính toán từ event.
- Event là nguồn sự thật.
- Nếu cần rebuild progress, có thể chạy job đọc lại toàn bộ event.
- Không nên cho frontend tự set mastery_score trực tiếp.
- Parent có thể đánh dấu từ dễ/khó thông qua event riêng.
```

---

## 8.10 Error codes

```text
PROGRESS_UPDATE_FAILED
INVALID_PROGRESS_STATUS
PROGRESS_NOT_FOUND
```

---

## 8.11 Test checklist

```text
[ ] word_viewed tạo progress mới nếu chưa có.
[ ] parent_video_played tăng parent_video_play_count.
[ ] child_tapped_correct tăng success_count.
[ ] child_tapped_wrong tăng wrong_count.
[ ] Status chuyển từ not_started sang seen.
[ ] Status có thể chuyển sang needs_help khi parent đánh dấu.
[ ] Duplicate event không tăng progress lần hai.
```

---

## 8.12 Definition of Done

Module này hoàn thành khi:

```text
- Mỗi event học có thể cập nhật progress.
- Dashboard có dữ liệu tiến độ theo từ.
- Có thể rebuild progress từ learning_events nếu cần.
```

---

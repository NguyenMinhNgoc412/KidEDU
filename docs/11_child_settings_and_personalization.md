> Module 11 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 11 — Child Settings & Personalization

## 11.1 Mục tiêu

Lưu cài đặt học riêng cho từng trẻ.

Ví dụ:

```text
- Số lần lặp video.
- Tốc độ phát video.
- Có dùng video phụ huynh không.
- Mức độ khó mặc định.
- Chủ đề ưu tiên.
```

---

## 11.2 Phụ thuộc

```text
- Module 02 Child Profile
- Module 03 Learning Content Catalog
```

---

## 11.3 Database cần có

### child_learning_settings

```sql
CREATE TABLE child_learning_settings (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),

  default_repeat_count INTEGER DEFAULT 3,
  slow_playback_rate NUMERIC DEFAULT 0.75,
  normal_playback_rate NUMERIC DEFAULT 1.0,

  prefer_parent_video BOOLEAN DEFAULT true,
  allow_system_video BOOLEAN DEFAULT true,

  default_difficulty_level INTEGER DEFAULT 1,
  preferred_goal_type TEXT NULL,

  daily_session_limit_minutes INTEGER DEFAULT 15,

  settings_json JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(child_id)
);
```

---

## 11.4 API cần làm

### GET /children/:childId/settings

Response:

```json
{
  "data": {
    "childId": "child-id",
    "defaultRepeatCount": 3,
    "slowPlaybackRate": 0.75,
    "preferParentVideo": true,
    "allowSystemVideo": true,
    "defaultDifficultyLevel": 1,
    "dailySessionLimitMinutes": 15
  },
  "meta": {},
  "error": null
}
```

---

### PATCH /children/:childId/settings

Request:

```json
{
  "defaultRepeatCount": 2,
  "slowPlaybackRate": 0.8,
  "preferParentVideo": true,
  "dailySessionLimitMinutes": 10
}
```

---

## 11.5 Backend workflow

### Tạo settings mặc định

```text
1. Khi tạo child profile, backend tạo settings mặc định.
2. Nếu child đã tồn tại nhưng chưa có settings, GET settings sẽ auto-create.
3. Frontend dùng settings để quyết định flow học.
```

### Update settings

```text
1. Kiểm tra child thuộc parent.
2. Validate field.
3. Update settings.
4. Trả settings mới.
```

---

## 11.6 Validation rules

```text
default_repeat_count:
  min 1, max 5

slow_playback_rate:
  min 0.5, max 1.0

normal_playback_rate:
  min 0.75, max 1.25

daily_session_limit_minutes:
  min 1, max 60

default_difficulty_level:
  min 1, max 5
```

---

## 11.7 Business rules

```text
- Settings thuộc child, không thuộc device.
- Frontend có thể cache settings local.
- Nếu prefer_parent_video = true nhưng không có video local, fallback về system video.
- Không tạo setting quá phức tạp ở MVP.
```

---

## 11.8 Error codes

```text
SETTINGS_NOT_FOUND
INVALID_REPEAT_COUNT
INVALID_PLAYBACK_RATE
INVALID_DAILY_LIMIT
INVALID_DIFFICULTY_LEVEL
```

---

## 11.9 Test checklist

```text
[ ] Tạo child thì có settings mặc định.
[ ] GET settings trả đúng.
[ ] PATCH settings validate repeat count.
[ ] PATCH settings validate playback rate.
[ ] Parent A không sửa được settings child của Parent B.
```

---

## 11.10 Definition of Done

Module này hoàn thành khi:

```text
- Mỗi child có settings học riêng.
- Frontend có thể cá nhân hóa trải nghiệm học.
```

---

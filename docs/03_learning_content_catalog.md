> Module 03 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 03 — Learning Content Catalog

## 3.1 Mục tiêu

Quản lý nội dung học của hệ thống:

```text
- Chủ đề học
- Từ vựng
- Bài học
- Mapping bài học với từ
```

Nội dung này là nội dung chung cho toàn app.

---

## 3.2 Phụ thuộc

```text
- Module 01 Backend Foundation
```

Không phụ thuộc Child Profile vì nội dung hệ thống có thể đọc độc lập.

---

## 3.3 Database cần có

### categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_vi TEXT NOT NULL,
  description_vi TEXT NULL,
  icon_key TEXT NULL,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### word_items

```sql
CREATE TABLE word_items (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),

  slug TEXT UNIQUE NOT NULL,
  text_vi TEXT NOT NULL,
  phonetic_hint TEXT NULL,

  word_type TEXT DEFAULT 'single_word',
  difficulty_level INTEGER DEFAULT 1,
  goal_type TEXT NULL,

  image_key TEXT NULL,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### lessons

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title_vi TEXT NOT NULL,
  description_vi TEXT NULL,
  lesson_type TEXT DEFAULT 'word_practice',
  difficulty_level INTEGER DEFAULT 1,
  estimated_minutes INTEGER DEFAULT 3,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### lesson_items

```sql
CREATE TABLE lesson_items (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  word_id UUID NOT NULL REFERENCES word_items(id),
  step_order INTEGER DEFAULT 0,
  instruction_vi TEXT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## 3.4 Content taxonomy đề xuất

### Chủ đề ban đầu

```text
1. Gia đình
2. Đồ ăn
3. Đồ uống
4. Con vật
5. Đồ chơi
6. Nhu cầu cơ bản
7. Cảm xúc
8. Chào hỏi
```

### Goal type

```text
imitate_sound
first_word
request_need
label_object
social_greeting
emotion_expression
two_word_phrase
```

### Word type

```text
sound
single_word
phrase_2_words
short_sentence
pecs_card
```

---

## 3.5 API cần làm

### GET /categories

Lấy danh sách chủ đề.

Query optional:

```http
?status=active
```

---

### GET /words

Lấy danh sách từ.

Query optional:

```http
?categoryId=<id>&goalType=first_word&difficultyLevel=1
```

---

### GET /words/:wordId

Chi tiết một từ.

Response mẫu:

```json
{
  "data": {
    "id": "word-id",
    "slug": "me",
    "textVi": "Mẹ",
    "phoneticHint": "mờ - e - mẹ",
    "wordType": "single_word",
    "difficultyLevel": 1,
    "goalType": "first_word",
    "category": {
      "id": "category-id",
      "nameVi": "Gia đình"
    },
    "imageKey": "family/mother.png"
  },
  "meta": {},
  "error": null
}
```

---

### GET /lessons

Lấy danh sách bài học.

Query optional:

```http
?lessonType=word_practice&difficultyLevel=1
```

---

### GET /lessons/:lessonId

Chi tiết bài học và danh sách từ trong bài.

Response:

```json
{
  "data": {
    "id": "lesson-id",
    "titleVi": "Từ đầu tiên: Ba Mẹ",
    "lessonType": "word_practice",
    "estimatedMinutes": 3,
    "items": [
      {
        "stepOrder": 1,
        "word": {
          "id": "word-me",
          "textVi": "Mẹ",
          "imageKey": "family/mother.png"
        }
      }
    ]
  },
  "meta": {},
  "error": null
}
```

---

## 3.6 Backend workflow

### Seed nội dung

```text
1. Chuẩn bị file seed categories.json.
2. Chuẩn bị file seed words.json.
3. Chuẩn bị file seed lessons.json.
4. Chạy migration tạo bảng.
5. Chạy seed script.
6. Kiểm tra slug không trùng.
7. Kiểm tra word nào cũng có category.
8. Kiểm tra lesson item nào cũng có word.
```

### Lấy danh sách từ

```text
1. Nhận query filter.
2. Validate categoryId nếu có.
3. Validate goalType nếu có.
4. Query word_items status = active.
5. Join category.
6. Sort theo difficulty_level, sort_order.
7. Trả danh sách.
```

---

## 3.7 Business rules

```text
- Frontend không được tự tạo word trong MVP.
- Nội dung hệ thống do backend seed.
- Slug phải duy nhất.
- Không xóa cứng word nếu đã có learning event.
- Nếu word bị disable thì không trả trong API mặc định.
```

---

## 3.8 Error codes

```text
CATEGORY_NOT_FOUND
WORD_NOT_FOUND
LESSON_NOT_FOUND
INVALID_GOAL_TYPE
INVALID_WORD_TYPE
DUPLICATE_CONTENT_SLUG
```

---

## 3.9 Test checklist

```text
[ ] Seed được categories.
[ ] Seed được words.
[ ] Seed được lessons.
[ ] GET /categories trả đúng sort_order.
[ ] GET /words filter theo category đúng.
[ ] GET /words filter theo goalType đúng.
[ ] GET /lessons/:id trả đủ lesson items.
[ ] Word disabled không hiện ở API mặc định.
```

---

## 3.10 Definition of Done

Module này hoàn thành khi:

```text
- Frontend có thể hiển thị danh mục học.
- Frontend có thể hiển thị từ/hình/bài học.
- Dữ liệu content có thể seed lại an toàn.
```

---

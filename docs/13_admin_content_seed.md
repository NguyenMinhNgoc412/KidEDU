> Module 13 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 13 — Admin Content Seed

## 13.1 Mục tiêu

Tạo công cụ nội bộ để seed nội dung học.

Trong MVP chưa cần admin dashboard riêng. Chỉ cần seed script đủ sạch.

---

## 13.2 Phụ thuộc

```text
- Module 03 Learning Content Catalog
- Module 04 System Media Manifest
```

---

## 13.3 Cấu trúc seed file đề xuất

```text
/seeds
  categories.vi.json
  words.vi.json
  lessons.vi.json
  media-assets.json
```

---

## 13.4 categories.vi.json

```json
[
  {
    "slug": "family",
    "nameVi": "Gia đình",
    "descriptionVi": "Các từ về người thân",
    "iconKey": "icons/family.png",
    "sortOrder": 1
  }
]
```

---

## 13.5 words.vi.json

```json
[
  {
    "slug": "me",
    "categorySlug": "family",
    "textVi": "Mẹ",
    "phoneticHint": "mờ - e - mẹ",
    "wordType": "single_word",
    "difficultyLevel": 1,
    "goalType": "first_word",
    "imageKey": "images/family/mother.png",
    "sortOrder": 1
  }
]
```

---

## 13.6 lessons.vi.json

```json
[
  {
    "slug": "first-words-family",
    "titleVi": "Từ đầu tiên: Gia đình",
    "lessonType": "word_practice",
    "difficultyLevel": 1,
    "estimatedMinutes": 3,
    "items": [
      {
        "wordSlug": "me",
        "stepOrder": 1,
        "instructionVi": "Nhìn hình và nghe từ Mẹ"
      }
    ]
  }
]
```

---

## 13.7 media-assets.json

```json
[
  {
    "ownerType": "system",
    "mediaType": "video",
    "purpose": "mouth_model_video",
    "wordSlug": "me",
    "storageProvider": "cdn",
    "storagePath": "videos/mouth-model/me.mp4",
    "cdnUrl": "https://cdn.kidedu.example/videos/mouth-model/me.mp4",
    "mimeType": "video/mp4",
    "durationSeconds": 4,
    "version": 1
  }
]
```

---

## 13.8 Backend workflow

```text
1. Chạy migration.
2. Load categories seed.
3. Upsert categories theo slug.
4. Load words seed.
5. Map categorySlug -> category_id.
6. Upsert words theo slug.
7. Load lessons seed.
8. Upsert lessons theo slug.
9. Upsert lesson_items theo lesson + word + step_order.
10. Load media-assets.
11. Map wordSlug -> word_id.
12. Upsert media_assets.
13. In summary: created/updated/skipped/error.
```

---

## 13.9 Business rules

```text
- Seed script phải idempotent, chạy nhiều lần không tạo trùng.
- Không xóa dữ liệu production bằng seed script MVP.
- Slug là khóa chính logic.
- Nếu seed lỗi một item, nên báo rõ item nào lỗi.
```

---

## 13.10 Test checklist

```text
[ ] Chạy seed lần đầu tạo dữ liệu.
[ ] Chạy seed lần hai không tạo trùng.
[ ] categorySlug sai báo lỗi rõ.
[ ] wordSlug trong lesson sai báo lỗi rõ.
[ ] media asset map đúng word.
[ ] API content trả dữ liệu sau seed.
```

---

## 13.11 Definition of Done

Module này hoàn thành khi:

```text
- Team có thể cập nhật nội dung học bằng file seed.
- Backend có dữ liệu mẫu ổn định để frontend test.
```

---

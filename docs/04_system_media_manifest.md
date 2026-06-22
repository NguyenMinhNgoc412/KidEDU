> Module 04 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 04 — System Media Manifest

## 4.1 Mục tiêu

Quản lý metadata video/hình/âm thanh mẫu của hệ thống.

Ví dụ:

```text
- Video khẩu hình mẫu cho từ "Mẹ"
- Ảnh minh họa cho từ "Mẹ"
- Audio mẫu nếu có
```

File thật nằm ở cloud storage/CDN. Backend lưu metadata và trả manifest cho frontend.

---

## 4.2 Phụ thuộc

```text
- Module 03 Learning Content Catalog
- Object Storage/CDN
```

---

## 4.3 Storage structure đề xuất

```text
kidedu-system-media/
  images/
    family/
      mother.png
      father.png
  videos/
    mouth-model/
      me.mp4
      ba.mp4
      an.mp4
      uong-nuoc.mp4
  audio/
    words/
      me.mp3
      ba.mp3
```

---

## 4.4 Database cần có

### media_assets

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,

  owner_type TEXT DEFAULT 'system',
  media_type TEXT NOT NULL,
  purpose TEXT NOT NULL,

  word_id UUID NULL REFERENCES word_items(id),
  category_id UUID NULL REFERENCES categories(id),
  lesson_id UUID NULL REFERENCES lessons(id),

  storage_provider TEXT NOT NULL,
  bucket_name TEXT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NULL,
  cdn_url TEXT NULL,

  mime_type TEXT,
  file_size BIGINT NULL,
  duration_seconds INTEGER NULL,

  width INTEGER NULL,
  height INTEGER NULL,

  version INTEGER DEFAULT 1,
  checksum TEXT NULL,
  status TEXT DEFAULT 'active',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 4.5 Media type

```text
image
video
audio
thumbnail
```

---

## 4.6 Purpose

```text
word_image
mouth_model_video
word_audio
category_icon
lesson_cover
```

---

## 4.7 API cần làm

### GET /media/manifest

Frontend gọi để biết media nào cần cache.

Query optional:

```http
?version=1
```

Response:

```json
{
  "data": {
    "version": 1,
    "items": [
      {
        "id": "media-id",
        "mediaType": "video",
        "purpose": "mouth_model_video",
        "wordId": "word-me",
        "url": "https://cdn.kidedu.example/videos/mouth-model/me.mp4",
        "mimeType": "video/mp4",
        "fileSize": 2400000,
        "durationSeconds": 4,
        "checksum": "abc123"
      }
    ]
  },
  "meta": {
    "cacheTtlSeconds": 86400
  },
  "error": null
}
```

---

### GET /words/:wordId/media

Lấy media của một từ.

Response:

```json
{
  "data": {
    "wordId": "word-me",
    "items": [
      {
        "mediaType": "image",
        "purpose": "word_image",
        "url": "https://cdn.kidedu.example/images/family/mother.png"
      },
      {
        "mediaType": "video",
        "purpose": "mouth_model_video",
        "url": "https://cdn.kidedu.example/videos/mouth-model/me.mp4"
      }
    ]
  },
  "meta": {},
  "error": null
}
```

---

## 4.8 Backend workflow

### Tạo manifest

```text
1. Query tất cả media_assets status = active.
2. Join word/category/lesson nếu cần.
3. Build URL ưu tiên cdn_url, nếu không có dùng public_url.
4. Trả version hiện tại.
5. Frontend dùng checksum/version để quyết định tải lại hay không.
```

### Khi cập nhật video mẫu

```text
1. Upload file mới lên storage/CDN.
2. Cập nhật storage_path hoặc cdn_url.
3. Tăng version.
4. Cập nhật checksum.
5. Frontend thấy version mới thì cache lại.
```

---

## 4.9 Business rules

```text
- Video mẫu hệ thống có thể public qua CDN.
- Video phụ huynh không dùng module này.
- Một word có thể có nhiều media.
- Manifest nên nhẹ, không trả quá nhiều field không cần thiết.
- Nếu media thiếu, frontend vẫn phải học được bằng text/image còn lại.
```

---

## 4.10 Error codes

```text
MEDIA_NOT_FOUND
MEDIA_MANIFEST_NOT_FOUND
INVALID_MEDIA_TYPE
INVALID_MEDIA_PURPOSE
WORD_MEDIA_NOT_FOUND
```

---

## 4.11 Test checklist

```text
[ ] GET /media/manifest trả đủ media active.
[ ] Manifest có version.
[ ] Manifest có checksum nếu có.
[ ] GET /words/:wordId/media trả đúng media của từ.
[ ] Media disabled không hiện trong manifest.
[ ] Nếu word chưa có video, API không crash.
```

---

## 4.12 Definition of Done

Module này hoàn thành khi:

```text
- Frontend có thể lấy video mẫu hệ thống.
- Frontend có thể cache video/hình offline.
- Backend kiểm soát được version media.
```

---

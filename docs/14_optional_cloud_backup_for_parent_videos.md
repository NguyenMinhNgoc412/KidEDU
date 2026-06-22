> Module 14 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 14 — Optional Cloud Backup for Parent Videos

## 14.1 Trạng thái

```text
Không làm trong MVP đầu tiên.
Làm sau khi cần backup, đổi thiết bị, hoặc phụ huynh muốn đồng bộ.
```

---

## 14.2 Mục tiêu

Cho phép phụ huynh chủ động bật cloud backup cho video đã quay.

Quy tắc sản phẩm:

```text
- Không upload tự động.
- Phải có lựa chọn rõ ràng từ phụ huynh.
- Bucket private.
- Playback dùng signed URL.
```

---

## 14.3 Phụ thuộc

```text
- Module 05 Parent Local Video Metadata
- Object Storage private bucket
```

---

## 14.4 Database cần có

### cloud_media_assets

```sql
CREATE TABLE cloud_media_assets (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  parent_media_id UUID NOT NULL REFERENCES parent_media_metadata(id),

  storage_provider TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,

  mime_type TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,

  status TEXT DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 14.5 API cần làm sau này

### POST /children/:childId/parent-media/:mediaId/cloud-upload-url

Request:

```json
{
  "mimeType": "video/mp4",
  "fileSize": 2800000
}
```

Response:

```json
{
  "data": {
    "uploadUrl": "signed-upload-url",
    "cloudMediaId": "cloud-media-id",
    "expiresInSeconds": 900
  },
  "meta": {},
  "error": null
}
```

---

### POST /children/:childId/parent-media/:mediaId/cloud-confirm

Request:

```json
{
  "cloudMediaId": "cloud-media-id",
  "status": "uploaded"
}
```

---

### GET /children/:childId/parent-media/:mediaId/playback-url

Response:

```json
{
  "data": {
    "playbackUrl": "signed-playback-url",
    "expiresInSeconds": 900
  },
  "meta": {},
  "error": null
}
```

---

## 14.6 Backend workflow sau này

```text
1. Phụ huynh bật "Đồng bộ video an toàn".
2. Frontend gọi request upload URL.
3. Backend kiểm tra media thuộc child/parent.
4. Backend tạo cloud_media_assets status pending.
5. Backend trả signed upload URL.
6. Frontend upload file video từ local lên storage.
7. Frontend gọi cloud-confirm.
8. Backend xác nhận file tồn tại.
9. Backend update cloud_media_assets status active.
10. Backend update parent_media_metadata sync_status = synced.
```

---

## 14.7 Business rules

```text
- Cloud backup không thay thế local file.
- Local vẫn là nguồn phát nhanh nhất trên thiết bị đang dùng.
- Signed URL phải hết hạn ngắn.
- Không public video phụ huynh.
- Cho phụ huynh xóa cloud copy.
```

---

## 14.8 Error codes

```text
CLOUD_BACKUP_DISABLED
UPLOAD_URL_CREATE_FAILED
CLOUD_MEDIA_NOT_FOUND
CLOUD_MEDIA_ACCESS_DENIED
SIGNED_URL_EXPIRED
```

---

## 14.9 Test checklist sau này

```text
[ ] Request upload URL thành công.
[ ] Parent A không lấy được upload URL media của Parent B.
[ ] Confirm upload đổi status đúng.
[ ] Playback URL có hạn.
[ ] Delete cloud copy không xóa local metadata nếu chưa yêu cầu.
```

---

## 14.10 Definition of Done

Module này hoàn thành khi:

```text
- Phụ huynh có thể backup video nếu chủ động bật.
- Video riêng tư được bảo vệ bằng private bucket và signed URL.
```

---

# KidEDU Backend Common Conventions

> File này là **workflow chi tiết theo từng module backend**.  
> File này **không thay thế** `KidEDU_Backend_Workflow.md`.  
> Workflow tổng vẫn giữ nguyên. File này dùng để triển khai từng module cụ thể trong backend.

---

## 0. Cách dùng file này

Backend KidEDU nên được triển khai theo hướng:

```text
Workflow tổng:
Dùng để nhìn roadmap toàn hệ thống.

Workflow chi tiết từng module:
Dùng để code, test API, kiểm tra database, kiểm tra business logic.
```

Quy tắc hiện tại:

```text
- Phase 1 Login/Auth: để làm sau.
- Bắt đầu triển khai backend từ các module core.
- Trẻ không có tài khoản đăng nhập.
- Phụ huynh là người quản lý chính.
- Không có role chuyên gia trong MVP.
- Video mẫu hệ thống lưu cloud/CDN.
- Video phụ huynh quay: local-first, lưu trên máy khách trước.
- Backend chỉ lưu metadata video phụ huynh.
- Dashboard là dashboard cho phụ huynh.
- Chuyên gia muốn xem thì phụ huynh mở dashboard cho xem trực tiếp.
```

---

## 1. Quy ước chung cho tất cả module

### 1.1 API base path

```http
/api/v1
```

### 1.2 Response format

Response thành công:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Response lỗi:

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Thông báo lỗi dễ hiểu"
  }
}
```

### 1.3 ID format

Nên dùng UUID cho database chính:

```text
parent_id
child_id
category_id
word_id
lesson_id
media_id
session_id
event_id
```

Client có thể gửi thêm ID riêng để chống gửi trùng khi offline:

```text
client_event_id
client_session_id
client_batch_id
client_local_media_id
```

### 1.4 Timestamp

Tất cả bảng nên có:

```sql
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Với bảng log/event, nên có thêm:

```sql
client_created_at TIMESTAMP
server_received_at TIMESTAMP
```

### 1.5 Soft delete

Các dữ liệu quan trọng không nên xóa cứng ngay:

```text
- child profile
- parent video metadata
- learning session
- learning event
```

Dùng:

```sql
deleted_at TIMESTAMP NULL
```

### 1.6 Ownership rule

Mọi dữ liệu của trẻ phải đi theo quan hệ:

```text
parent_id -> child_id -> dữ liệu học
```

Không được query dữ liệu trẻ chỉ bằng `child_id` mà không kiểm tra `parent_id`.

### 1.7 Local-first media rule

Video phụ huynh quay không upload cloud trong MVP.

Backend chỉ lưu metadata như:

```text
- child_id
- word_id
- device_id
- client_local_media_id
- duration
- file_size
- thumbnail_local_ref nếu có
- sync_status
```

Backend **không cần nhận file video thật** trong module MVP.

### 1.8 Không có specialist role trong MVP

Không tạo các bảng này trong MVP:

```text
specialist_users
therapist_users
specialist_child_assignments
therapist_dashboard_permissions
```

Nếu chuyên gia cần xem, phụ huynh mở dashboard trên thiết bị.

---

---

> File này chứa quy ước chung dùng cho tất cả module backend.
> Khi code một module bất kỳ, đọc file này trước rồi mở file module tương ứng.

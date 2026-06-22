> Module 01 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 01 — Backend Foundation

## 1.1 Mục tiêu

Module này tạo nền backend để các module sau chạy được.

Mục tiêu:

```text
- Khởi tạo backend project.
- Kết nối database.
- Chuẩn hóa response format.
- Chuẩn hóa error handling.
- Tạo health check.
- Tạo app config API.
- Tạo context test tạm thời để không cần login.
```

Module này tương ứng với phần foundation trong workflow tổng.

---

## 1.2 Phụ thuộc

```text
Không phụ thuộc module nào trước đó.
```

Cần chuẩn bị:

```text
- Backend framework: NestJS / FastAPI / Express / Django REST
- PostgreSQL
- Migration tool
- Environment config
```

---

## 1.3 Database cần có

### parent_accounts

Dùng tạm cho MVP để gắn dữ liệu vào một phụ huynh mặc định.

```sql
CREATE TABLE parent_accounts (
  id UUID PRIMARY KEY,
  display_name TEXT,
  email TEXT NULL,
  phone TEXT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Ghi chú:

```text
- Chưa cần login thật.
- Có thể tạo sẵn một parent dev mặc định.
- Sau này Auth làm sau sẽ map parent account này với user thật.
```

### device_clients

Lưu thiết bị đang dùng app.

```sql
CREATE TABLE device_clients (
  id UUID PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  device_name TEXT,
  platform TEXT,
  app_version TEXT,
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 1.4 API cần làm

### GET /health

Dùng để kiểm tra server còn sống.

Response:

```json
{
  "data": {
    "status": "ok",
    "service": "kidedu-backend"
  },
  "meta": {},
  "error": null
}
```

---

### GET /app/config

Frontend gọi khi mở app.

Response:

```json
{
  "data": {
    "appName": "KidEDU",
    "apiVersion": "v1",
    "features": {
      "authEnabled": false,
      "parentLocalVideoEnabled": true,
      "cloudVideoBackupEnabled": false,
      "speechAnalysisEnabled": false
    },
    "media": {
      "systemMediaBaseUrl": "https://cdn.kidedu.example"
    }
  },
  "meta": {},
  "error": null
}
```

---

### POST /dev/bootstrap

Chỉ dùng lúc phát triển để tạo dữ liệu test ban đầu.

Request:

```json
{
  "deviceName": "iPad Test",
  "platform": "ios",
  "appVersion": "0.1.0"
}
```

Response:

```json
{
  "data": {
    "parentId": "dev-parent-id",
    "deviceId": "dev-device-id"
  },
  "meta": {},
  "error": null
}
```

---

## 1.5 Backend workflow

```text
1. Frontend mở app.
2. Frontend gọi GET /app/config.
3. Nếu chưa có parentId/deviceId local, frontend gọi POST /dev/bootstrap.
4. Backend tạo parent account dev nếu chưa có.
5. Backend tạo device client.
6. Frontend lưu parentId/deviceId vào local storage.
7. Các API sau gửi parentId/deviceId trong header hoặc body test.
```

Header test gợi ý:

```http
x-dev-parent-id: <parent_id>
x-dev-device-id: <device_id>
```

---

## 1.6 Validation rules

```text
- Không cho bật dev bootstrap ở production.
- deviceName tối đa 100 ký tự.
- platform chỉ nhận: ios, android, web, unknown.
- appVersion có thể null nhưng nên lưu nếu có.
```

---

## 1.7 Error codes

```text
APP_CONFIG_NOT_FOUND
DEV_BOOTSTRAP_DISABLED
INVALID_DEVICE_PLATFORM
DATABASE_CONNECTION_ERROR
```

---

## 1.8 Test checklist

```text
[ ] GET /health trả status ok.
[ ] GET /app/config trả feature flags đúng.
[ ] POST /dev/bootstrap tạo được parent dev.
[ ] POST /dev/bootstrap tạo được device client.
[ ] Production không bật dev bootstrap.
[ ] Response format đồng nhất.
[ ] Error format đồng nhất.
```

---

## 1.9 Definition of Done

Module này hoàn thành khi:

```text
- Backend chạy được.
- Database migrate được.
- Có health check.
- Có app config.
- Có parent/device test để các module sau không cần login.
```

---

> Module 16 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 16 — Auth Integration Later

## 16.1 Trạng thái

```text
Làm sau.
Không làm trước để tránh test MVP phải login nhiều.
```

---

## 16.2 Mục tiêu

Thay test context bằng login thật khi core backend đã ổn định.

---

## 16.3 Phụ thuộc

```text
- Module 01 đến Module 13 nên ổn định trước.
```

---

## 16.4 Auth scope sau này

```text
- Parent login bằng email/phone/social.
- Parent account gắn với auth user.
- Device registration.
- Token-based API protection.
- Tắt dev bootstrap ở production.
```

---

## 16.5 Database update sau này

Có thể thêm:

```sql
ALTER TABLE parent_accounts
ADD COLUMN auth_provider TEXT NULL,
ADD COLUMN auth_user_id TEXT NULL;
```

Có thể thêm bảng:

```sql
CREATE TABLE parent_auth_identities (
  id UUID PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);
```

---

## 16.6 Migration workflow

```text
1. Giữ parent_accounts hiện có.
2. Thêm auth identity.
3. Khi phụ huynh login lần đầu, map auth user vào parent account.
4. Nếu user mới, tạo parent account mới.
5. Thay x-dev-parent-id bằng JWT/session token.
6. Tắt dev endpoints ở production.
7. Chạy security test.
```

---

## 16.7 Business rules

```text
- Không biến child thành user account.
- Không thêm specialist role khi chưa có product need rõ.
- Tất cả dữ liệu child vẫn thuộc parent account.
- Parent có thể đổi thiết bị sau khi login.
```

---

## 16.8 Test checklist sau này

```text
[ ] Login tạo parent account mới.
[ ] Login user cũ map đúng parent account.
[ ] Token hết hạn bị reject.
[ ] Không còn dùng x-dev-parent-id ở production.
[ ] Parent A không xem được dữ liệu Parent B.
```

---

## 16.9 Definition of Done

Module này hoàn thành khi:

```text
- Backend có auth production.
- Dev mode không chạy ở production.
- Dữ liệu MVP cũ vẫn migrate được.
```

---

> Module 02 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 02 — Child Profile

## 2.1 Mục tiêu

Quản lý hồ sơ trẻ.

Child trong KidEDU là **hồ sơ học tập**, không phải tài khoản đăng nhập.

Phụ huynh có thể:

```text
- Tạo hồ sơ trẻ.
- Xem danh sách hồ sơ trẻ.
- Cập nhật thông tin trẻ.
- Xóa mềm hồ sơ trẻ.
```

---

## 2.2 Phụ thuộc

```text
- Module 01 Backend Foundation
- parent_accounts
- device_clients
```

---

## 2.3 Database cần có

### child_profiles

```sql
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES parent_accounts(id),

  nickname TEXT NOT NULL,
  birth_year INTEGER NULL,
  gender TEXT NULL,

  communication_level TEXT DEFAULT 'unknown',
  primary_goal TEXT NULL,

  avatar_key TEXT NULL,
  notes TEXT NULL,

  status TEXT DEFAULT 'active',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP NULL
);
```

---

## 2.4 Field rule

### nickname

```text
Bắt buộc.
Tối đa 50 ký tự.
Không cần lưu tên thật nếu phụ huynh không muốn.
```

### birth_year

```text
Không bắt buộc.
Nếu có thì dùng để tính độ tuổi tương đối.
```

### communication_level

Giá trị đề xuất:

```text
unknown
no_words
single_words
two_word_phrases
short_sentences
```

### primary_goal

Giá trị đề xuất:

```text
imitate_sounds
first_words
request_needs
daily_communication
social_greeting
```

---

## 2.5 API cần làm

### POST /children

Tạo hồ sơ trẻ.

Request:

```json
{
  "nickname": "Bé Bông",
  "birthYear": 2021,
  "gender": "female",
  "communicationLevel": "single_words",
  "primaryGoal": "request_needs"
}
```

Response:

```json
{
  "data": {
    "id": "child-id",
    "nickname": "Bé Bông",
    "birthYear": 2021,
    "communicationLevel": "single_words",
    "primaryGoal": "request_needs",
    "status": "active"
  },
  "meta": {},
  "error": null
}
```

---

### GET /children

Lấy danh sách hồ sơ trẻ của phụ huynh.

Response:

```json
{
  "data": [
    {
      "id": "child-id",
      "nickname": "Bé Bông",
      "birthYear": 2021,
      "communicationLevel": "single_words",
      "primaryGoal": "request_needs"
    }
  ],
  "meta": {
    "count": 1
  },
  "error": null
}
```

---

### GET /children/:childId

Lấy chi tiết hồ sơ trẻ.

---

### PATCH /children/:childId

Cập nhật hồ sơ trẻ.

Request:

```json
{
  "nickname": "Bông",
  "communicationLevel": "two_word_phrases"
}
```

---

### DELETE /children/:childId

Xóa mềm hồ sơ trẻ.

Backend update:

```sql
deleted_at = now()
status = 'deleted'
```

---

## 2.6 Backend workflow

### Tạo hồ sơ trẻ

```text
1. Nhận request POST /children.
2. Lấy parent_id từ context test.
3. Validate nickname.
4. Validate birthYear nếu có.
5. Validate communicationLevel nếu có.
6. Insert child_profiles.
7. Tạo settings mặc định cho trẻ ở Module 10 nếu module đó đã có.
8. Trả child profile về frontend.
```

### Lấy danh sách hồ sơ trẻ

```text
1. Lấy parent_id từ context.
2. Query child_profiles where parent_id = current parent.
3. Bỏ các record deleted_at != null.
4. Sort theo created_at desc.
5. Trả danh sách.
```

### Cập nhật hồ sơ trẻ

```text
1. Nhận childId.
2. Kiểm tra childId thuộc parent hiện tại.
3. Validate field được update.
4. Update updated_at.
5. Trả profile mới.
```

---

## 2.7 Business rules

```text
- Child không có password.
- Child không có email.
- Child không đăng nhập.
- Một phụ huynh có thể có nhiều child profile.
- Không cho parent A xem child của parent B.
- Xóa child là soft delete.
```

---

## 2.8 Error codes

```text
CHILD_NOT_FOUND
CHILD_ACCESS_DENIED
INVALID_CHILD_NICKNAME
INVALID_BIRTH_YEAR
INVALID_COMMUNICATION_LEVEL
INVALID_PRIMARY_GOAL
```

---

## 2.9 Test checklist

```text
[ ] Tạo được child profile.
[ ] Không tạo được nếu nickname trống.
[ ] Không tạo được nếu birthYear không hợp lệ.
[ ] Lấy được danh sách child theo parent.
[ ] Parent A không xem được child của Parent B.
[ ] Update được communicationLevel.
[ ] Delete là soft delete, không xóa cứng.
```

---

## 2.10 Definition of Done

Module này hoàn thành khi:

```text
- Phụ huynh có thể tạo và quản lý hồ sơ trẻ.
- Mọi API child đều kiểm tra ownership.
- Frontend có thể chọn một child active để bắt đầu học.
```

---

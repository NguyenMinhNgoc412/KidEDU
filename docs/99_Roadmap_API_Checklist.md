# KidEDU Backend Roadmap, API Checklist & Dependency Map

> File này gom các phần tổng hợp sau khi đã tách từng module thành file riêng.

---

# 17. Thứ tự triển khai khuyến nghị

## Sprint 1 — Core backend chạy được

```text
1. Module 01 — Backend Foundation
2. Module 02 — Child Profile
3. Module 03 — Learning Content Catalog
4. Module 13 — Admin Content Seed
```

Kết quả mong muốn:

```text
- Backend chạy.
- Có child profile.
- Có danh mục học.
- Có seed data.
- Frontend có thể hiển thị bài học cơ bản.
```

---

## Sprint 2 — Media và video phụ huynh local-first

```text
1. Module 04 — System Media Manifest
2. Module 05 — Parent Local Video Metadata
3. Module 11 — Child Settings
```

Kết quả mong muốn:

```text
- Frontend lấy được video mẫu.
- Frontend biết từ nào có video phụ huynh local.
- App cá nhân hóa số lần lặp/tốc độ phát.
```

---

## Sprint 3 — Tracking và progress

```text
1. Module 06 — Learning Session
2. Module 07 — Learning Event Tracking
3. Module 08 — Progress Engine
```

Kết quả mong muốn:

```text
- Bé học một session.
- App gửi event.
- Backend tính được progress theo từ.
```

---

## Sprint 4 — Dashboard và offline

```text
1. Module 09 — Parent Dashboard Data
2. Module 10 — Offline-first Sync
3. Module 12 — Report Data Export
```

Kết quả mong muốn:

```text
- Phụ huynh xem được tiến độ.
- App học offline rồi sync sau.
- Có dữ liệu báo cáo để phụ huynh đưa chuyên gia xem.
```

---

## Sprint sau MVP

```text
1. Module 14 — Optional Cloud Backup for Parent Videos
2. Module 15 — Speech Recording & AI Analysis
3. Module 16 — Auth Integration Later
```

---

# 18. API checklist tổng

## Foundation

```text
GET    /health
GET    /app/config
POST   /dev/bootstrap
```

## Child

```text
POST   /children
GET    /children
GET    /children/:childId
PATCH  /children/:childId
DELETE /children/:childId
```

## Content

```text
GET    /categories
GET    /words
GET    /words/:wordId
GET    /lessons
GET    /lessons/:lessonId
```

## System media

```text
GET    /media/manifest
GET    /words/:wordId/media
```

## Parent local media

```text
POST   /children/:childId/parent-media
GET    /children/:childId/parent-media
PATCH  /children/:childId/parent-media/:mediaId
DELETE /children/:childId/parent-media/:mediaId
```

## Learning

```text
POST   /children/:childId/sessions/start
POST   /children/:childId/sessions/:sessionId/end
POST   /children/:childId/events
```

## Dashboard

```text
GET    /children/:childId/dashboard/summary
GET    /children/:childId/dashboard/words
POST   /children/:childId/words/:wordId/mark
```

## Sync

```text
POST   /sync/events
```

## Settings

```text
GET    /children/:childId/settings
PATCH  /children/:childId/settings
```

## Report

```text
GET    /children/:childId/reports/summary
```

## Later

```text
POST   /children/:childId/parent-media/:mediaId/cloud-upload-url
POST   /children/:childId/parent-media/:mediaId/cloud-confirm
GET    /children/:childId/parent-media/:mediaId/playback-url

POST   /children/:childId/speech-attempts
PATCH  /children/:childId/speech-attempts/:attemptId/rating
POST   /children/:childId/speech-attempts/:attemptId/ai-analysis
```

---

# 19. Module dependency map

```text
Module 01 Backend Foundation
  ↓
Module 02 Child Profile
  ↓
Module 03 Learning Content Catalog
  ↓
Module 04 System Media Manifest
  ↓
Module 05 Parent Local Video Metadata
  ↓
Module 06 Learning Session
  ↓
Module 07 Learning Event Tracking
  ↓
Module 08 Progress Engine
  ↓
Module 09 Parent Dashboard Data
  ↓
Module 10 Offline-first Sync
  ↓
Module 11 Child Settings
  ↓
Module 12 Report Data Export

Module 13 Admin Content Seed
  supports Module 03 + Module 04

Module 14 Cloud Backup
  depends on Module 05

Module 15 Speech Recording
  depends on Module 07 + Module 08

Module 16 Auth Integration
  replaces dev/test context later
```

---

# 20. Folder structure gợi ý

## NestJS style

```text
src/
  main.ts
  app.module.ts

  common/
    response/
    errors/
    guards/
    middleware/
    utils/

  modules/
    foundation/
    children/
    content/
    media/
    parent-media/
    learning-sessions/
    learning-events/
    progress/
    dashboard/
    sync/
    settings/
    reports/
    admin-seed/

  database/
    migrations/
    seeds/
```

## FastAPI style

```text
app/
  main.py

  core/
    config.py
    errors.py
    response.py

  db/
    session.py
    migrations/
    seeds/

  modules/
    foundation/
    children/
    content/
    media/
    parent_media/
    learning_sessions/
    learning_events/
    progress/
    dashboard/
    sync/
    settings/
    reports/
    admin_seed/
```

---

# 21. Nguyên tắc kiểm tra cuối mỗi module

Mỗi module chỉ được coi là xong khi đạt đủ 5 điểm:

```text
1. Database migration chạy được từ đầu.
2. API trả response format thống nhất.
3. Có validation cho request.
4. Có test case chính.
5. Frontend có thể gọi thử bằng dữ liệu test.
```

---

# 22. Kết luận

Workflow tổng vẫn giữ vai trò roadmap chính.

File này dùng để triển khai backend theo module:

```text
- Làm từng module nhỏ.
- Test xong module nào mới chuyển module tiếp.
- Không cần login trong giai đoạn đầu.
- Không upload video phụ huynh tự động.
- Dashboard chỉ dành cho phụ huynh.
- Chuyên gia xem bằng cách phụ huynh mở dashboard hoặc xuất báo cáo.
```

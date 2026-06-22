# KidEDU Backend Module Workflows — Index

Folder này tách workflow chi tiết backend thành nhiều file nhỏ để dễ đọc, dễ tìm và dễ giao việc.

## Cách dùng

1. Đọc `00_Common_Conventions.md` trước để nắm quy ước chung.
2. Mở file module cần làm.
3. Khi hoàn thành một module, kiểm tra đủ `Test checklist` và `Definition of Done` trong file đó.
4. Dùng `99_Roadmap_API_Checklist.md` để xem thứ tự sprint, API checklist tổng và dependency map.

## Danh sách file

| Module | File | Nội dung |
|---|---|---|
| Common | `00_Common_Conventions.md` | Quy ước chung, response format, ID, timestamp, ownership, local-first media rule |
| 01 | `01_backend_foundation.md` | Backend Foundation |
| 02 | `02_child_profile.md` | Child Profile |
| 03 | `03_learning_content_catalog.md` | Learning Content Catalog |
| 04 | `04_system_media_manifest.md` | System Media Manifest |
| 05 | `05_parent_local_video_metadata.md` | Parent Local Video Metadata |
| 06 | `06_learning_session.md` | Learning Session |
| 07 | `07_learning_event_tracking.md` | Learning Event Tracking |
| 08 | `08_progress_engine.md` | Progress Engine |
| 09 | `09_parent_dashboard_data.md` | Parent Dashboard Data |
| 10 | `10_offline_first_sync.md` | Offline-first Sync |
| 11 | `11_child_settings_and_personalization.md` | Child Settings & Personalization |
| 12 | `12_report_data_export.md` | Report Data Export |
| 13 | `13_admin_content_seed.md` | Admin Content Seed |
| 14 | `14_optional_cloud_backup_for_parent_videos.md` | Optional Cloud Backup for Parent Videos |
| 15 | `15_speech_recording_and_ai_analysis.md` | Speech Recording & AI Analysis |
| 16 | `16_auth_integration_later.md` | Auth Integration Later |
| Appendix | `99_Roadmap_API_Checklist.md` | Sprint order, API checklist tổng, dependency map, folder structure |

## Thứ tự làm khuyến nghị

```text
Sprint 1: 01, 02, 03, 13
Sprint 2: 04, 05, 11
Sprint 3: 06, 07, 08
Sprint 4: 09, 10, 12
Sau MVP: 14, 15, 16
```

## Ghi chú sản phẩm

- Workflow tổng vẫn giữ nguyên trong `KidEDU_Backend_Workflow.md`.
- Bộ file này chỉ là bản tách nhỏ của workflow chi tiết từng module.
- `Auth/Login` vẫn để sau, không bắt buộc trong giai đoạn test core backend.
- Video phụ huynh vẫn theo hướng local-first; backend chỉ lưu metadata trong MVP.

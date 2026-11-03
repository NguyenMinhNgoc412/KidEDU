# Thông tin owner cần bổ sung — Store Release v1.0

Cập nhật: 2026-10-12. Trạng thái: `Pending owner input`.

Danh sách này tổng hợp quyết định còn mở trong [Product Brief](../01-product-brief-sot.md), [PRD](../02-product-requirements-sot.md) và [Technical Architecture](../03-technical-architecture-sot.md). Owner có thể điền cột cuối; sau đó cập nhật quyết định tại file SOT sở hữu và changelog. Điền checklist không tự chuyển SOT sang `Approved`. Không ghi password, token, private key hoặc thông tin nhận dạng trẻ vào file này.

## Quyết định sản phẩm

| ID sở hữu             | Thông tin cần điền                                                                    | Quyết định / evidence của owner |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------- |
| PB-TBD-01             | Domain, store listing, kết quả kiểm tra tên/khả dụng                                  | Chưa điền                       |
| PB-TBD-02             | Số ngày trial; có yêu cầu phương thức thanh toán trước không                          | Chưa điền                       |
| PB-TBD-03             | Giá tháng/năm, currency/market và introductory offer                                  | Chưa điền                       |
| PB-TBD-04             | Số hồ sơ trẻ trong từng gói                                                           | Chưa điền                       |
| PB-TBD-05, TA-TBD-007 | Quota cloud media; retention sau expiry; thông báo trước xóa; encryption/key recovery | Chưa điền                       |
| PB-TBD-06             | Người review chuyên môn; phạm vi và tiêu chí sign-off                                 | Chưa điền                       |
| PRD-TBD-01            | Rule initial plan và ngưỡng tiến/lùi, có reviewer và fixture được duyệt               | Chưa điền                       |
| PRD-TBD-02            | Danh mục target/lesson tối thiểu và coverage activity; nội dung đã ẩn danh/được duyệt | Chưa điền                       |
| PRD-TBD-03            | Giới hạn session theo activity, kèm usability evidence                                | Chưa điền                       |
| PRD-TBD-04            | Format export và SLA deletion                                                         | Chưa điền                       |
| PRD-TBD-05            | Android/iOS đồng thời hay thứ tự phát hành                                            | Chưa điền                       |
| PRD-TBD-06            | Policy grace/billing retry và wording theo từng store                                 | Chưa điền                       |
| PRD-TBD-07            | Cadence/default reminder, có usability evidence                                       | Chưa điền                       |

## Quyết định kỹ thuật và bằng chứng

Các mục dưới cần POC/đo đạc; không chỉ điền một giá trị tùy ý. Xem [Phase 0 proof register](./06-phase-0-proof-register.md).

| ID sở hữu  | Thông tin / proof cần bổ sung                                           | Quyết định / evidence của owner |
| ---------- | ----------------------------------------------------------------------- | ------------------------------- |
| TA-TBD-001 | Expo target và native crypto/IAP Development Build trên iOS/Android     | Chưa điền                       |
| TA-TBD-002 | Budget ceiling, RPO/RTO, backup retention; encrypted dump/restore proof | Chưa điền                       |
| TA-TBD-003 | AES-GCM package và wrapped-key format sau device/security POC           | Chưa điền                       |
| TA-TBD-005 | Activation TTL, grace và revoke latency sau POC                         | Chưa điền                       |
| TA-TBD-006 | Local DB encryption trên cả iOS/Android                                 | Chưa điền                       |
| TA-TBD-008 | Pack granularity/size budget đo trên corpus được duyệt                  | Chưa điền                       |
| TA-TBD-009 | OS/device matrix và download/storage thresholds                         | Chưa điền                       |
| TA-TBD-010 | Integrity/attestation level theo platform và budget                     | Chưa điền                       |
| TA-TBD-011 | SMTP provider/domain, quota và deliverability proof                     | Chưa điền                       |
| TA-TBD-012 | API domain/ingress sau cost/latency POC                                 | Chưa điền                       |

Cần môi trường staging tách biệt cho Supabase Auth/PostgreSQL, Cloud Run, R2 và secret/key management; store sandbox cho Apple/Google; thiết bị thật iOS/Android. Chỉ ghi tên môi trường, người phụ trách và vị trí secret manager, không ghi credential. Các proof P0-01..11 vẫn cần báo cáo đúng môi trường; kết quả unit/web local không thay thế.

## Phần có thể tiếp tục khi chưa có các input trên

- Sửa lỗi, củng cố test/contract và account isolation của các slice local đã có.
- Hoàn thiện tooling validate schema/readiness bằng synthetic fixture; không coi fixture là curriculum production.
- Chuẩn bị test matrix và runbook staging theo baseline đã quy định.
- Giữ giá/trial/quota/TTL chưa chốt ở trạng thái pending; không công bố số liệu giả hoặc bật production service để lấp chỗ trống.

Backend local hiện có identity/family, entitlement read, plan/observation và object-storage adapter; frontend đã có login, account isolation, dashboard và preview. Đây chưa phải signed activation, encrypted lesson delivery, store billing hay complete v2 learning runtime. Các task C06..C09 là slice local; không đồng nhất số task với workstream cùng mã trong work breakdown.

AI Custom Library và PRD-TBD-08..09 thuộc Post-release, không đưa vào danh sách việc chặn Store Release v1.0.

# KidEDU Documentation v2

## 1. Mục đích

`docs-v2` là bộ tài liệu đang được viết lại để đưa KidEDU thành sản phẩm production có thể phát hành lên store. Bộ cũ tại `../docs/` được giữ nguyên làm **legacy baseline** để review, so sánh và đào tạo; không dùng bộ cũ làm authority cho thiết kế mới.

Mục tiêu là **Store Release v1.0**, không phải MVP/prototype. Phase chỉ mô tả thứ tự delivery hoặc nhóm capability, không tự cắt giảm release scope.

## 2. Source of Truth hierarchy

Ba tài liệu gốc phải được đọc theo thứ tự:

1. [01-product-brief-sot.md](./01-product-brief-sot.md) — **Why:** định vị, đối tượng, vấn đề, kết quả, trụ cột, business model và product boundary.
2. [02-product-requirements-sot.md](./02-product-requirements-sot.md) — **What:** functional/non-functional requirements và acceptance criteria của Store Release v1.0.
3. [03-technical-architecture-sot.md](./03-technical-architecture-sot.md) — **How at system level:** architecture invariant, component boundary, data authority, sync, security và operations.

Thứ tự ưu tiên khi mâu thuẫn:

```text
Product Brief
  → PRD
    → Technical Architecture
      → Detailed specifications / ADR / UX / API / schema / test plan
        → Roadmap / task breakdown
          → Code
```

Code hiện tại và tài liệu legacy không được dùng để hợp thức hóa requirement trái với ba SOT v2.

## 3. Trạng thái tài liệu

| Tài liệu                           | Trạng thái  | Ý nghĩa                                                                             |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `01-product-brief-sot.md`          | `In review` | Nội dung đầy đủ vòng review đầu; cần product owner phê duyệt và đóng các `PB-TBD-*` |
| `02-product-requirements-sot.md`   | `In review` | Requirement v1 đã có ID/acceptance; cần review scope và content depth               |
| `03-technical-architecture-sot.md` | `In review` | Reference stack và invariant đã chốt; POC, cost và một số parameter còn `TA-TBD-*`  |
| Tài liệu chi tiết                  | `In review` | First full draft đã tạo; phải được review sau ba SOT gốc theo dependency            |

Trạng thái hợp lệ:

- `Draft`: đang soạn, có thể thiếu cấu trúc lớn;
- `In review`: nội dung đủ để review nhưng chưa được dùng như quyết định đã phê duyệt;
- `Approved`: owner đã duyệt, mọi `TBD` blocking trong phạm vi đã được đóng;
- `Superseded`: có tài liệu/phiên bản mới thay thế và phải trỏ tới bản mới.

## 4. Quy tắc ownership

- Product Brief chỉ sở hữu `why`, định vị, audience, outcome, product principles, business model và boundary.
- PRD chỉ sở hữu hành vi sản phẩm, scope, requirement và acceptance criteria; không chọn framework/provider.
- Technical Architecture chỉ sở hữu cách đáp ứng requirement ở cấp hệ thống; không tự thêm feature.
- Detailed spec phải ghi `Implements:` kèm `PRD-*` và/hoặc `TA-ADR-*` liên quan.
- Một quyết định chỉ có một nơi sở hữu. Tài liệu khác link bằng ID, không copy rồi chỉnh riêng.
- `TBD` phải có ID. Detail spec không được tự điền quyết định product/architecture còn mở.
- Thay đổi một SOT phải có impact analysis đến các tài liệu và code dẫn xuất.

## 5. Cấu trúc tài liệu hiện tại

```text
docs-v2/
├─ README.md
├─ 01-product-brief-sot.md
├─ 02-product-requirements-sot.md
├─ 03-technical-architecture-sot.md
├─ product/
│  ├─ 01-curriculum-learning-plan-spec.md
│  ├─ 02-learning-activity-spec.md
│  ├─ 03-parent-family-media-spec.md
│  ├─ 04-progress-observation-spec.md
│  ├─ 05-subscription-access-spec.md
│  ├─ 06-content-media-production-spec.md
│  └─ 07-ai-custom-library-spec.md
├─ design/
│  ├─ 01-information-architecture-user-flows.md
│  ├─ 02-design-system.md
│  ├─ 03-wireframes.md
│  └─ 04-accessibility-child-safety.md
├─ architecture/
│  ├─ 01-mobile-architecture.md
│  ├─ 02-backend-architecture.md
│  ├─ 03-data-model-and-migrations.md
│  ├─ 04-sync-manifest-pack-protocol.md
│  ├─ 05-media-storage-and-content-security.md
│  ├─ 06-entitlement-activation-security.md
│  ├─ 07-operations-observability-backup.md
│  ├─ 08-threat-model.md
│  ├─ 09-notification-architecture.md
│  ├─ 10-portability-and-evolution.md
│  ├─ 11-initial-platform-deployment.md
│  └─ 12-ai-custom-library-generation.md
├─ contracts/
│  ├─ 01-api-contract.md
│  └─ 02-events-and-content-schemas.md
├─ delivery/
│  ├─ 01-roadmap.md
│  ├─ 02-test-strategy.md
│  ├─ 03-release-checklist.md
│  ├─ 04-task-breakdown.md
│  └─ 05-cost-model.md
├─ decisions/
│  ├─ ADR-0001-server-authoritative-local-runtime.md
│  ├─ ADR-0002-docker-app-server.md
│  ├─ ADR-0003-progressive-lesson-packs.md
│  ├─ ADR-0004-premium-encrypted-cache.md
│  ├─ ADR-0005-reuse-current-ui-foundation.md
│  ├─ ADR-0006-supabase-auth-and-local-notifications.md
│  ├─ ADR-0007-direct-store-billing.md
│  ├─ ADR-0008-generated-media-and-animation.md
│  └─ ADR-0009-paid-ai-custom-library.md
└─ CHANGELOG.md
```

Tất cả file trên là first full draft, không phải file rỗng. Chúng chỉ thành authority trong phạm vi sau khi trạng thái được chuyển `Approved`.

`product/07-ai-custom-library-spec.md`, `architecture/12-ai-custom-library-generation.md` và `ADR-0009` có trạng thái `Deferred — Post-release`: được giữ để không mất thiết kế nhưng không thuộc scope, baseline stack hoặc release gate v1.

## 6. Traceability bắt buộc

Mỗi requirement dùng ID dạng:

- `PB-*`: product intent, outcome, principle, business/risk/TBD;
- `PRD-*`: business rule, functional requirement, NFR/TBD;
- `TA-ADR-*`: quyết định kiến trúc bắt buộc;
- `TA-SLO-*`: target reliability/performance;
- `TA-TBD-*`: quyết định kỹ thuật còn mở.

Header của detailed spec phải có tối thiểu:

```md
| Thuộc tính | Giá trị                      |
| ---------- | ---------------------------- |
| Trạng thái | Draft / In review / Approved |
| Owner      | ...                          |
| Implements | PRD-..., TA-ADR-...          |
| Depends on | link tài liệu                |
| Updated    | YYYY-MM-DD                   |
```

Acceptance test/task phải trỏ ngược requirement ID. Requirement bị xóa không tái sử dụng ID; ghi deprecated/superseded trong changelog.

## 7. Quy trình thay đổi

1. Xác định thay đổi thuộc Product Brief, PRD, Architecture hay detail spec.
2. Ghi lý do, lựa chọn, ảnh hưởng, rủi ro và requirement/decision ID liên quan.
3. Sửa file sở hữu trước; không sửa file con để né SOT.
4. Cập nhật tài liệu dẫn xuất, test và changelog trong cùng change set hoặc ghi migration plan rõ.
5. Review tính nhất quán, privacy/security và release impact.
6. Chỉ chuyển `Approved` khi điều kiện phê duyệt trong tài liệu đã thỏa mãn.

Thay đổi architecture invariant dùng ADR riêng nếu có trade-off đáng kể. ADR mới không được âm thầm sửa product scope; nếu scope đổi, cập nhật Product Brief/PRD trước.

## 8. Research data và quyền riêng tư

`giao-trinh/` hiện chứa DOCX can thiệp thực tế có dữ liệu nhận dạng trẻ và chuyên viên. Thư mục này:

- chỉ là nguồn nghiên cứu local;
- đã được `.gitignore` để tránh commit nhầm;
- không được đóng gói vào app, CI artifact, log hoặc tài liệu phân phối;
- không được copy nguyên văn thành content mặc định;
- phải được ẩn danh nếu tạo research summary có thể commit.

Nếu các file đã từng được commit ở remote khác, `.gitignore` không xóa lịch sử; cần audit history và xử lý riêng.

## 9. So sánh với legacy

| Legacy                             | v2                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------- |
| KidEDU là MVP thẻ từ               | KidEDU là Store Release v1.0 với progression giao tiếp tiếng Việt      |
| Local-first, không backend/login   | Server-authoritative, login + backend + local runtime/cache            |
| `new/practicing/familiar`          | Observation `+`, `+/-`, `-` theo activity/prompt                       |
| Video/ảnh/audio gắn vào card       | Target có readiness riêng theo activity; media là asset có provenance  |
| Chỉ sửa/thêm card local            | V1 dùng curriculum/lesson; AI custom library được lưu cho post-release |
| Sync toàn bộ/local backup          | Delta sync + progressive lesson pack + durable media cache             |
| Chưa subscription                  | Trial-to-paywall + store subscription + server entitlement             |
| Cache là quyền sử dụng             | Premium bytes mã hóa, quyền được xác thực độc lập                      |
| Một business SOT + mobile overview | Product Brief + PRD + system-wide Technical Architecture               |

Legacy được giữ để fresher so sánh, không sửa/xóa/di chuyển trong quá trình rewrite.

## 10. Cách review hiện tại

Review theo thứ tự:

1. chốt Product Brief và `PB-TBD-*` có ảnh hưởng định vị/business;
2. review PRD theo từng capability, đặc biệt learning progression và release gate;
3. review Technical Architecture, proof-of-concept các rủi ro sync/key/lifecycle;
4. tạo detailed specs theo traceability table;
5. mới lập roadmap và task implementation.

Có thể đối chiếu legacy và v2 bằng:

```powershell
git diff --no-index -- docs/01-kidedu-business-sot.md docs-v2/01-product-brief-sot.md
```

Exit code `1` của `git diff --no-index` chỉ có nghĩa hai file khác nhau.

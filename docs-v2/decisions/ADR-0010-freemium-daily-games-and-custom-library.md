# ADR-0010 — Free lâu dài, lượt chơi hằng ngày và custom library v1

Date: 2026-11-05.
Status: Product scope approved by owner; technical design In review, implementation gated by C50 decisions/POC.
References: `PB-BIZ-04..05`, `PRD-GAME-*`, `PRD-REWARD-*`, `PRD-SUB-006`, `PRD-CUSTOM-*`, `TA-ADR-025..026`.
Supersedes: ADR-0009 về post-release/mandatory paid add-on; extends TA-ADR-001/011 để server sở hữu lượt chơi, không chạy learning engine. Không tự cấp ngoại lệ queue cho TA-ADR-018.

## Context

Owner chọn free lâu dài với bộ học cơ bản; paid full + manual/AI authoring trong v1. Cả hai có một phiên ba trò/ngày, reset 00:00, hoàn tất nhận một món từ bốn hộp; group quà theo giới tính. Client-only quota/receipt không bảo vệ được trước reinstall, sửa đồng hồ hoặc nhiều thiết bị.

## Decision

- Server cấp free/basic và paid/full capability riêng; free vẫn cần account/activation, không bypass resolver/key guard. Expiry paid quay về basic, không xóa family data.
- Server giữ unique `(childId, playDay)` và stable session/claim IDs, atomic transition/reservation; mobile chỉ giữ projection, immutable session content và checkpoint/outbox. Không API trong vòng lặp ba trò.
- Owner amendment 2026-11-05: ngày chơi là khoảng nửa mở từ 00:00 đến trước 00:00 hôm sau theo `Asia/Ho_Chi_Minh`, thay mốc 08:00. Reset dùng trusted server time, không dựa timezone hoặc wall clock của thiết bị. Quà chưa được server xác nhận trước reset bị hủy kể cả completion local chưa sync; receipt đã xác nhận giữ nguyên và retry trả receipt cũ. Không gia hạn entitlement store tới midnight.
- Free catalog được owner chốt là năm bộ hiện có, mapping tại `PRD-SUB-006`; trial không có manual/AI authoring. New profile nhập giới tính cùng tên, không suy từ tên hoặc tự backfill hồ sơ cũ. Các thiết bị resume cùng session qua checkpoint version; stale write phải conflict thay vì mất progress.
- Pool chỉ chứa món chưa có; hết loại nào khóa loại đó và hiển thị remaining count (kể cả 0). Hết cả hai vẫn được chơi; bốn hộp có thể dùng chung candidate khi còn dưới bốn món. Không fallback cấp món trùng. AI khoảng năm từ/job theo gợi ý parent; quota/provider gates vẫn giữ.
- Receipt và random candidates bất biến, lựa chọn chưa có theo catalog/group và inventory authoritative. Bốn hộp không có giá/rarity/reroll; không mua lượt, không thêm lượt qua quảng cáo.
- AI custom generation trở thành asynchronous workflow v1, dùng PostgreSQL job/quota ledger và provider adapters, preview/safety + parent approval trước pack publish. Provider/model vẫn candidate. Hạn mức included và add-on fee chưa được chốt; không provision SKU mặc định.
- Ưu tiên job/outbox theo baseline TA-ADR-018; Cloud Tasks vẫn là phương án phải qua ADR dispatcher/POC riêng trước provision. Không biến việc duyệt AI product scope thành duyệt mọi service/queue.
- Owner amendment 2026-11-06: test Gemini AI Studio free chỉ trong developer-only synthetic harness; model mục tiêu phát hành GPT-5.6 Luna vẫn qua quality/privacy review. Không nối Gemini Developer API vào child-facing runtime. Quota/budget/retry/retention/dispatcher theo C50-D03, không tự biến đề xuất thành approved hoặc bật billing. Cost/terms evidence tại delivery/05-cost-model.md.

## Alternatives và trade-offs

Local-only daily flag đơn giản nhưng không bảo đảm quota/cross-device; bị loại. Server kiểm từng thao tác sẽ phá local runtime; bị loại. Reservation trước phiên + sync/claim sau phiên giữ runtime local nhưng cần giải quyết device ownership và late claim. Paid AI vô hạn bị loại vì variable cost; quota và reserve/release phải công bố. Mandatory consumable add-on không được suy từ requirement paid access.

## Migration / rollback / verification

Theo [C50 P1–P10](../delivery/tasks/C50-four-tabs-daily-games-freemium-ai.md): expand-contract/dual-read, giữ receipt và history C49; không tạo observation từ game; disable new starts/jobs khi rollback nhưng giữ data/export/ledger. Gate gồm clock/reset, concurrent devices, late outbox, crash sau claim, free/premium key separation, provider privacy/cost/resilience và native QA. Không có runtime hay provisioning trong thay đổi documentation này.

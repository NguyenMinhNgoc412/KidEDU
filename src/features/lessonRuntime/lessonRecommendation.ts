import type { LessonEvent } from "./sessionEngine";

export interface LessonRecommendation {
  reasonCode:
    | "observe_first"
    | "observe_again"
    | "support_response"
    | "fade_prompt"
    | "vary_context"
    | "transfer_gap";
  title: string;
  reason: string;
}

/** Next-practice guidance only. No mastery thresholds or automatic unlocking. */
export function recommendPractice(
  events: readonly LessonEvent[],
  scope: { childId: string; goalId: string; targetId: string }
): LessonRecommendation {
  const scoped = events
    .filter(
      (event) =>
        event.childId === scope.childId &&
        event.payload.goalId === scope.goalId &&
        event.payload.targetId === scope.targetId &&
        Number.isFinite(Date.parse(event.occurredAt))
    )
    .sort(
      (a, b) =>
        Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || a.eventId.localeCompare(b.eventId)
    );
  const observed = scoped.filter((event) => event.payload.result !== "not_observed");
  if (!observed.length)
    return scoped.length
      ? {
          reasonCode: "observe_again",
          title: "Thử khi có dịp quan sát",
          reason:
            "Chưa có quan sát đủ để đề nghị tăng hoặc giảm độ khó. Bỏ qua không phải thất bại."
        }
      : {
          reasonCode: "observe_first",
          title: "Cùng quan sát lần đầu",
          reason: "Chọn bài phù hợp điều con đang cần; app chưa có dữ liệu cho mục tiêu này."
        };
  const inApp = observed.find((event) => event.payload.context === "in_app");
  const guided = observed.find((event) => event.payload.context === "parent_guided");
  if (inApp?.payload.result === "independent" && guided && guided.payload.result !== "independent")
    return {
      reasonCode: "transfer_gap",
      title: "Ưu tiên thử trong sinh hoạt",
      reason:
        "Quan sát trong bài và với người/đồ vật thật đang khác nhau. Tiếp tục hỗ trợ trong ngữ cảnh thật, chưa suy ra thành thạo."
    };
  switch (observed[0]!.payload.result) {
    case "not_yet":
      return {
        reasonCode: "support_response",
        title: "Thử lại với cơ hội đơn giản hơn",
        reason:
          "Lần quan sát gần nhất con chưa thực hiện. Có thể giảm yêu cầu hoặc chuẩn bị vật quen thuộc hơn; phụ huynh quyết định khi nào thử."
      };
    case "supported":
      return {
        reasonCode: "fade_prompt",
        title: "Luyện lại và thử giảm gợi ý",
        reason:
          "Lần gần nhất con thực hiện khi có hỗ trợ. Giữ mục tiêu, tạo khoảng chờ trước khi dùng mức gợi ý đã cần."
      };
    default:
      return {
        reasonCode: "vary_context",
        title: "Thử với vật hoặc người khác",
        reason:
          "Đã có lần thực hiện độc lập. Một lần chưa chứng minh thành thạo; hãy quan sát thêm ở ngữ cảnh khác khi phù hợp."
      };
  }
}

import type { ActivityV1 } from "@/content/contracts/activity";

/** Presentation of authored content only; never infer a child's response from taps. */
export function lessonGuidance(activity: ActivityV1) {
  switch (activity.type) {
    case "command":
      return {
        label: "Nghe và làm với đồ thật",
        preparation: activity.stimulus.preparation,
        instruction: `Nói một lần: “${activity.stimulus.orderedActions.join(" rồi ")}”.`,
        consequence: "Chờ con thực hiện với đồ thật. Nhắc lại hoặc làm mẫu được ghi là hỗ trợ."
      };
    case "functional_communication":
      return {
        label: "Luyện cùng con",
        preparation: activity.transfer.preparation,
        instruction: activity.stimulus.partnerAction,
        consequence: activity.stimulus.naturalConsequence
      };
    case "parent_transfer":
      return {
        label: "Trong sinh hoạt",
        preparation: activity.stimulus.preparation,
        instruction: activity.stimulus.parentAction,
        consequence: activity.stimulus.realWorldContext
      };
    default:
      return {
        label: "Luyện cùng con",
        preparation: activity.transfer.preparation,
        instruction: activity.parentInstruction,
        consequence: activity.skipRule
      };
  }
}

export const promptLabels: Record<ActivityV1["promptLadder"][number]["level"], string> = {
  independent: "Tạo cơ hội độc lập",
  natural_cue: "Chỉ tạo cơ hội và chờ",
  visual_cue: "Có gợi ý bằng hình hoặc cử chỉ",
  partial_model: "Có gợi ý một phần",
  full_model: "Có nhắc lại hoặc làm mẫu"
};

import { developmentLessonGraph } from "./developmentLesson";
import { prepareDevelopmentLesson } from "./prepareLesson";
import type { ActivityV1 } from "@/content/contracts/activity";
import { mediaSampleLessons, buildMediaSampleGraph } from "./mediaSampleLessons";
import { playSampleLessons } from "./playSampleLessons";
import { buildPlaySampleGraph } from "./buildPlaySampleGraph";

export const learningGoals = {
  social: {
    title: "Giao tiếp cùng người thân",
    purpose: "Chào, gọi, rủ chơi, chia lượt và nói về sở hữu trong tương tác thật."
  },
  model: {
    title: "Làm quen từ và khẩu hình",
    purpose: "Cùng nghe mẫu và quan sát khẩu hình phù hợp."
  },
  recognition: { title: "Nghe hiểu và nhận biết", purpose: "Nghe, tìm và chỉ/chọn hình phù hợp." },
  naming: { title: "Gọi tên và nói theo", purpose: "Cho con cơ hội tự gọi tên trước khi đưa mẫu." },
  cloze: {
    title: "Hoàn thành lời quen thuộc",
    purpose: "Chờ con hoàn thành đoạn lời được dừng có chủ đích."
  },
  sentence: { title: "Kết hợp từ thành câu", purpose: "Dùng cụm/câu để diễn đạt trong ngữ cảnh." },
  yes_no: {
    title: "Trả lời Có và Không",
    purpose: "Giúp con trả lời theo ý muốn hoặc ngữ cảnh thực."
  },
  visual_qa: { title: "Hỏi đáp qua hình", purpose: "Nhìn ngữ cảnh và trả lời câu hỏi phù hợp." },
  request: { title: "Bày tỏ điều con muốn", purpose: "Tạo cơ hội yêu cầu trong sinh hoạt." },
  command: {
    title: "Hiểu và làm theo yêu cầu",
    purpose: "Nghe một lần, rồi thực hiện với đồ vật thật."
  },
  choice: { title: "Lựa chọn điều con thích", purpose: "Giúp con bày tỏ lựa chọn với người thân." },
  refusal: {
    title: "Bày tỏ khi không muốn",
    purpose: "Giúp con từ chối và được người lớn tôn trọng."
  }
} as const;
export type LearningGoal = keyof typeof learningGoals;

/** Synthetic local lessons; these are not a published production curriculum. */
export const sampleLessons = [
  {
    id: "fixture_lesson_request",
    goal: "request",
    title: "Con muốn nước",
    itemId: "item-ly",
    object: "cốc nước",
    response: "nước",
    preparation: "Một cốc nước phù hợp, phụ huynh ở cạnh con.",
    context: "Trong bữa ăn hoặc giờ nghỉ.",
    search: "nuoc"
  },
  {
    id: "fixture_lesson_ball",
    goal: "request",
    title: "Con muốn bóng",
    itemId: "item-bong",
    object: "quả bóng",
    response: "bóng",
    preparation: "Một quả bóng mềm phù hợp, phụ huynh ở cạnh con.",
    context: "Trong giờ chơi bóng cùng gia đình.",
    search: "bong"
  },
  {
    id: "fixture_lesson_bear",
    goal: "request",
    title: "Con muốn gấu",
    itemId: "item-gau",
    object: "gấu bông",
    response: "gấu",
    preparation: "Một gấu bông quen thuộc, phụ huynh ở cạnh con.",
    context: "Trong lúc chơi hoặc chuẩn bị nghỉ.",
    search: "gau"
  },
  {
    id: "fixture_lesson_put_ball",
    goal: "command",
    title: "Cho bóng vào hộp",
    itemId: "item-bong",
    object: "quả bóng và hộp",
    response: "Cho bóng vào hộp",
    preparation: "Một quả bóng mềm và hộp đủ lớn, đặt trong tầm với an toàn.",
    context: "Trong lúc cùng nhau cất đồ chơi.",
    search: "cho bong vao hop"
  },
  {
    id: "fixture_lesson_two_steps",
    goal: "command",
    title: "Bóng vào hộp, gấu cho mẹ",
    itemId: "item-gau",
    object: "quả bóng, hộp và gấu bông",
    response: "Cho bóng vào hộp rồi đưa gấu cho mẹ",
    preparation: "Một quả bóng mềm, hộp và gấu bông; mẹ ở cạnh con.",
    context: "Khi cùng gia đình dọn đồ sau giờ chơi.",
    search: "hai buoc bong gau"
  },
  {
    id: "fixture_lesson_choice",
    goal: "choice",
    title: "Con chọn bóng hay gấu?",
    itemId: "item-bong",
    object: "quả bóng và gấu bông",
    response: "Lựa chọn bóng hoặc gấu",
    preparation: "Một quả bóng và gấu bông quen thuộc, cả hai đều có thể đưa cho con.",
    context: "Khi bắt đầu một lượt chơi cùng người thân.",
    search: "chon bong gau"
  },
  {
    id: "fixture_lesson_refusal",
    goal: "refusal",
    title: "Con chưa muốn chơi",
    itemId: "item-gau",
    object: "gấu bông",
    response: "không / không muốn / cử chỉ từ chối",
    preparation: "Một đồ chơi quen thuộc; người lớn sẵn sàng dừng khi con từ chối.",
    context: "Khi mời con chơi một trò quen thuộc.",
    search: "khong muon choi"
  },
  ...mediaSampleLessons,
  ...playSampleLessons
] as const;
export function findSampleLesson(id: string) {
  return sampleLessons.find((lesson) => lesson.id === id);
}
export function prepareSampleLesson(
  development: boolean,
  id: string,
  resources?: Parameters<typeof prepareDevelopmentLesson>[2]
) {
  const sample = findSampleLesson(id);
  if (!sample) throw new Error("UNKNOWN_LESSON");
  if ("presentation" in sample)
    return prepareDevelopmentLesson(buildPlaySampleGraph(sample), development);
  if ("activityType" in sample)
    return prepareDevelopmentLesson(buildMediaSampleGraph(sample), development, resources);
  // Preserve the original fixture generation so existing water sessions resume unchanged.
  if (id === sampleLessons[0].id)
    return prepareDevelopmentLesson(developmentLessonGraph, development);
  if (sample.goal !== "request") return prepareGuidedLesson(sample, development);
  const graph = JSON.parse(JSON.stringify(developmentLessonGraph)) as typeof developmentLessonGraph;
  graph.lesson.id = sample.id;
  graph.lesson.parentPurpose = `Cùng con tạo cơ hội yêu cầu ${sample.response} trong sinh hoạt.`;
  const target = graph.targets[0]!;
  target.id = `${sample.id}_target`;
  target.canonicalText = sample.response;
  target.normalizedSearchText = sample.search;
  graph.activities.forEach((activity, index) => {
    activity.id = `${sample.id}_${index === 0 ? "request" : "transfer"}`;
    activity.targetIds = [target.id];
    activity.expectedResponse = {
      canonical: sample.response,
      acceptedVariants: [`con muốn ${sample.response}`, "cử chỉ yêu cầu"]
    };
    activity.promptLadder[0]!.parentCue = `Đặt ${sample.object} trong tầm nhìn và chờ con đáp lại.`;
    activity.promptLadder[2]!.parentCue = `Nói mẫu một lần: Con muốn ${sample.response}.`;
    activity.transfer.preparation = sample.preparation;
    if (activity.type === "functional_communication") {
      activity.stimulus = {
        scenario: "request",
        opportunity: `Cùng con nhìn ${sample.object} thật.`,
        partnerAction: "Chờ một cơ hội yêu cầu tự nhiên.",
        naturalConsequence: `Đáp lại và đưa ${sample.object} cho con.`
      };
    } else {
      activity.stimulus = {
        preparation: sample.preparation,
        parentAction: activity.transfer.parentAction,
        realWorldContext: sample.context
      };
    }
  });
  graph.lesson.activitySequence = graph.activities.map((activity) => ({
    id: activity.id,
    version: activity.version,
    type: activity.type
  }));
  graph.lesson.transferActivityRef = graph.lesson.activitySequence[1];
  return prepareDevelopmentLesson(graph, development);
}

type SampleLesson = (typeof sampleLessons)[number];
function prepareGuidedLesson(sample: SampleLesson, development: boolean) {
  const goalId = `fixture_goal_${sample.goal}`;
  const targetId = `${sample.id}_target`;
  const command = sample.goal === "command";
  const twoSteps = sample.id === "fixture_lesson_two_steps";
  const choice = sample.goal === "choice";
  const parentAction = command
    ? `Chuẩn bị đồ vật thật. Nói một lần: “${sample.response}”. Chờ con thực hiện; không làm thay.`
    : choice
      ? "Đưa hai đồ chơi ra để con lựa chọn. Chờ lời nói hoặc cử chỉ và đưa đúng món con chọn."
      : "Mời con chơi một lần, rồi chờ. Nếu con từ chối, đáp lại và dừng; không cố tạo phản ứng từ chối.";
  const independent = command
    ? "Con thực hiện đủ yêu cầu theo đúng thứ tự sau một lần nghe, không cần nhắc lại hoặc làm mẫu."
    : choice
      ? "Con bày tỏ lựa chọn bằng lời hoặc cử chỉ sau cơ hội tự nhiên."
      : "Con bày tỏ không muốn bằng lời hoặc cử chỉ trong tình huống thực sự không muốn.";
  const prompts: ActivityV1["promptLadder"] = [
    { level: "natural_cue", parentCue: parentAction },
    {
      level: "visual_cue",
      parentCue: command
        ? "Nếu cần, chỉ vào đồ vật liên quan; ghi nhận đây là hỗ trợ."
        : "Chỉ vào các lựa chọn hoặc làm cử chỉ gợi ý, không chọn thay con."
    },
    {
      level: "full_model",
      parentCue: command
        ? `Nhắc lại yêu cầu hoặc làm mẫu: “${sample.response}”. Ghi nhận là có hỗ trợ.`
        : choice
          ? "Làm mẫu ngắn cách lựa chọn, rồi để con quyết định."
          : "Làm mẫu: “Không muốn”. Tôn trọng phản hồi thật của con, không ép nhắc lại."
    }
  ];
  const base = {
    ...developmentLessonGraph.activities[0]!,
    goalId,
    targetIds: [targetId],
    parentInstruction: parentAction,
    expectedResponse: {
      canonical: sample.response,
      acceptedVariants: command ? [] : ["cử chỉ phù hợp"]
    },
    promptLadder: prompts,
    observationRubric: {
      independent,
      supported: command
        ? "Con thực hiện sau khi nhắc lại, chỉ đồ vật hoặc làm mẫu."
        : "Con bày tỏ ý muốn sau gợi ý hoặc làm mẫu.",
      notYet:
        "Đã có cơ hội phù hợp nhưng chưa thấy phản hồi mục tiêu. Nếu không có cơ hội, chọn không quan sát được.",
      promptLevels: prompts.map((prompt) => prompt.level)
    },
    transfer: {
      preparation: sample.preparation,
      parentAction: `${parentAction} Lần khác, đổi một đồ vật hoặc người tương tác phù hợp.`,
      waitMs: 3000,
      observationHint: "Ghi riêng phản hồi trong sinh hoạt và mức hỗ trợ thực sự đã dùng."
    }
  };
  const primary = {
    ...base,
    id: `${sample.id}_practice`,
    type: command ? "command" : "functional_communication",
    stimulus: command
      ? {
          preparation: sample.preparation,
          orderedActions: twoSteps ? ["Cho bóng vào hộp", "Đưa gấu cho mẹ"] : ["Cho bóng vào hộp"],
          objects: twoSteps ? ["quả bóng", "hộp", "gấu bông"] : ["quả bóng", "hộp"]
        }
      : {
          scenario: choice ? "choice" : "refusal",
          opportunity: sample.preparation,
          partnerAction: parentAction,
          naturalConsequence: choice
            ? "Đưa món con chọn và cùng chơi. Không có lựa chọn đúng hoặc sai."
            : "Dừng lời mời khi con không muốn. Phản hồi của con được tôn trọng."
        }
  };
  const transfer = {
    ...base,
    id: `${sample.id}_transfer`,
    type: "parent_transfer",
    stimulus: {
      preparation: sample.preparation,
      parentAction: base.transfer.parentAction,
      realWorldContext: sample.context
    }
  };
  const activities = [primary, transfer];
  const refs = activities.map(({ id, type }) => ({ id, type, version: 1 }));
  return prepareDevelopmentLesson(
    {
      lesson: {
        ...developmentLessonGraph.lesson,
        id: sample.id,
        primaryGoalId: goalId,
        parentPurpose: learningGoals[sample.goal].purpose,
        activitySequence: refs,
        transferActivityRef: refs[1]
      },
      activities,
      targets: [
        {
          ...developmentLessonGraph.targets[0]!,
          id: targetId,
          canonicalText: sample.response,
          targetType: command ? "sentence" : "phrase",
          complexity: twoSteps ? 2 : 1,
          normalizedSearchText: sample.search,
          skillDomainId: command ? "fixture_domain_comprehension" : "fixture_domain_communication",
          allowedActivityTypes: [primary.type, "parent_transfer"]
        }
      ]
    },
    development
  );
}

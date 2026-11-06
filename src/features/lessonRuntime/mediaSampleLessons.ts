import { developmentLessonGraph } from "./developmentLesson";

export const mediaSampleLessons = [
  {
    id: "fixture_lesson_model_ba",
    goal: "model",
    activityType: "word_model",
    title: "Cùng nghe và nhìn ba",
    itemId: "item-ba",
    object: "ảnh ba",
    response: "ba",
    preparation: "Người lớn ở cạnh con, chuẩn bị một ảnh ba quen thuộc nếu có.",
    context: "Trong lúc xem ảnh gia đình.",
    search: "ba"
  },
  {
    id: "fixture_lesson_recognition",
    goal: "recognition",
    activityType: "recognition",
    title: "Ba đâu rồi?",
    itemId: "item-ba",
    object: "ảnh ba và mẹ",
    response: "ba",
    preparation: "Cùng nhìn hai hình người thân; có thể dùng ảnh gia đình.",
    context: "Khi xem album gia đình.",
    search: "ba dau"
  },
  {
    id: "fixture_lesson_naming",
    goal: "naming",
    activityType: "naming",
    title: "Con gọi tên ba",
    itemId: "item-ba",
    object: "ảnh ba",
    response: "ba",
    preparation: "Chờ con có cơ hội gọi tên trước khi nghe mẫu.",
    context: "Khi ba có mặt hoặc xem ảnh gia đình.",
    search: "goi ten ba"
  },
  {
    id: "fixture_lesson_cloze",
    goal: "cloze",
    activityType: "cloze_tail",
    title: "Ba và… mẹ",
    itemId: "item-me",
    object: "ảnh gia đình",
    response: "mẹ",
    preparation: "Giới thiệu thứ tự gọi tên ba, mẹ bằng hình/người thật trước khi thử đoạn dừng.",
    context: "Khi cùng gọi tên người thân.",
    search: "ba me vuot duoi"
  },
  {
    id: "fixture_lesson_sentence",
    goal: "sentence",
    activityType: "functional_sentence",
    title: "Ba đang vẫy tay",
    itemId: "item-ba",
    object: "ba đang vẫy tay",
    response: "Ba vẫy tay",
    preparation: "Cùng xem hình ba vẫy tay hoặc nhờ người thân vẫy tay thật.",
    context: "Khi chào người thân.",
    search: "ba vay tay"
  },
  {
    id: "fixture_lesson_yes_no",
    goal: "yes_no",
    activityType: "yes_no",
    title: "Con có muốn chơi bóng không?",
    itemId: "item-bong",
    object: "quả bóng",
    response: "có hoặc không theo ý muốn của con",
    preparation: "Một quả bóng phù hợp; sẵn sàng tôn trọng cả Có lẫn Không.",
    context: "Khi mời con chơi bóng.",
    search: "co khong bong"
  },
  {
    id: "fixture_lesson_visual_qa",
    goal: "visual_qa",
    activityType: "visual_qa",
    title: "Ai đang vẫy tay?",
    itemId: "item-ba",
    object: "ba đang vẫy tay",
    response: "ba",
    preparation: "Cùng xem một hình rõ chủ thể; hỏi rồi chờ trước khi gợi ý.",
    context: "Khi nhìn người thân chào nhau.",
    search: "ai vay tay"
  }
] as const;
type MediaSample = (typeof mediaSampleLessons)[number];
export function buildMediaSampleGraph(sample: MediaSample) {
  const targetId = `${sample.id}_target`;
  const goalId = `fixture_goal_${sample.goal}`;
  const assets = {
    required: [] as { assetId: string; role: string }[],
    optional: [] as { assetId: string; role: string }[]
  };
  const asset = (assetId: string, role: string) => {
    assets.required.push({ assetId, role });
    return assetId;
  };
  let stimulus: unknown;
  switch (sample.activityType) {
    case "word_model":
      stimulus = {
        visualAssetId: asset("practice_image_ba", "semantic_visual"),
        canonicalAudioAssetId: asset("practice_audio_ba", "canonical_audio"),
        variant: "articulation_model",
        mouthVideoAssetId: asset("practice_video_ba", "mouth_video")
      };
      break;
    case "recognition":
      stimulus = {
        instructionAudioAssetId: asset("practice_instruction_ba", "instruction_audio"),
        options: [
          {
            id: "practice_option_ba",
            label: "Ba",
            visualAssetId: asset("practice_image_ba", "semantic_visual")
          },
          {
            id: "practice_option_me",
            label: "Mẹ",
            visualAssetId: asset("practice_image_me", "semantic_visual")
          }
        ],
        correctOptionIds: ["practice_option_ba"],
        responseMode: "choose"
      };
      break;
    case "naming":
      stimulus = {
        visualAssetId: asset("practice_image_ba", "semantic_visual"),
        promptAudioAssetId: asset("practice_prompt_ba", "prompt_audio"),
        expressiveFirst: true
      };
      break;
    case "cloze_tail":
      stimulus = {
        fullSentence: "Ba, mẹ.",
        leadInText: "Ba…",
        completionText: "mẹ",
        leadInAudioAssetId: asset("practice_segment_ba", "segment_audio"),
        fullAudioAssetId: asset("practice_segment_family", "segment_audio"),
        pauseAfterLeadIn: true
      };
      break;
    case "functional_sentence":
      stimulus = {
        contextVisualAssetId: asset("practice_context_ba", "context_visual"),
        sentenceFrame: "Ba {hành động}",
        slotTargetIds: [targetId],
        communicationOpportunity: "Cùng nhìn ba vẫy tay, chờ con mô tả rồi đáp lại/chào ba."
      };
      break;
    case "yes_no":
      stimulus = {
        question: "Con có muốn chơi bóng không?",
        kind: "preference",
        authoredTruth: null,
        contextVisualAssetId: asset("practice_context_ball", "context_visual")
      };
      break;
    case "visual_qa":
      stimulus = {
        question: "Ai đang vẫy tay?",
        questionKind: "identity",
        contextVisualAssetId: asset("practice_context_ba", "context_visual"),
        expectedSentenceLength: 1
      };
      break;
  }
  const base = {
    ...developmentLessonGraph.activities[0]!,
    goalId,
    targetIds: [targetId],
    parentInstruction: sample.preparation,
    expectedResponse: { canonical: sample.response, acceptedVariants: [] },
    promptLadder: [
      { level: "natural_cue", parentCue: "Tạo cơ hội và chờ con phản hồi trước khi gợi ý." },
      { level: "visual_cue", parentCue: "Chỉ vào hình hoặc ngữ cảnh phù hợp nếu con cần hỗ trợ." },
      {
        level: "full_model",
        parentCue: `Nếu cần, làm mẫu một lần theo mục tiêu: ${sample.response}.`
      }
    ],
    observationRubric: {
      independent: "Con phản hồi theo mục tiêu trong cơ hội này, không cần thêm gợi ý.",
      supported:
        "Con phản hồi sau gợi ý hoặc làm mẫu; không quy việc chọn hình thành khả năng nói.",
      notYet:
        "Đã có cơ hội phù hợp nhưng chưa thấy phản hồi mục tiêu. Nếu không quan sát được, bỏ qua lần này.",
      promptLevels: ["natural_cue", "visual_cue", "full_model"]
    },
    transfer: {
      preparation: sample.preparation,
      parentAction: `Thử lại mục tiêu với người hoặc hình/ngữ cảnh thật khác khi phù hợp: ${sample.context}`,
      waitMs: 3000,
      observationHint: "Ghi riêng phản hồi trong sinh hoạt và mức hỗ trợ đã dùng."
    }
  };
  const activities = [
    { ...base, id: `${sample.id}_practice`, type: sample.activityType, stimulus, assets },
    {
      ...base,
      id: `${sample.id}_transfer`,
      type: "parent_transfer",
      assets: { required: [], optional: [] },
      stimulus: {
        preparation: sample.preparation,
        parentAction: base.transfer.parentAction,
        realWorldContext: sample.context
      }
    }
  ];
  const refs = activities.map(({ id, type }) => ({ id, type, version: 1 }));
  return {
    lesson: {
      ...developmentLessonGraph.lesson,
      id: sample.id,
      primaryGoalId: goalId,
      parentPurpose: sample.title,
      activitySequence: refs,
      transferActivityRef: refs[1]
    },
    activities,
    targets: [
      {
        ...developmentLessonGraph.targets[0]!,
        id: targetId,
        canonicalText: sample.response,
        normalizedSearchText: sample.search,
        targetType: sample.goal === "sentence" ? "sentence" : "person",
        skillDomainId: `fixture_domain_${sample.goal}`,
        allowedActivityTypes: [sample.activityType, "parent_transfer"]
      }
    ]
  };
}

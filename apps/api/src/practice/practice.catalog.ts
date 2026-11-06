/** Metadata only. Fixtures are enabled solely for the explicit local environment. */
import { practicePlayLessons } from "./practice-play.catalog";
export const practiceGoals = [
  {
    id: "social",
    title: "Giao tiếp cùng người thân",
    description: "Chào, gọi, rủ chơi, chia lượt và nói về sở hữu trong tương tác thật.",
    prerequisiteIds: []
  },
  {
    id: "model",
    title: "Làm quen từ và khẩu hình",
    description: "Cùng nghe mẫu và quan sát khẩu hình phù hợp.",
    prerequisiteIds: []
  },
  {
    id: "recognition",
    title: "Nghe hiểu và nhận biết",
    description: "Nghe, tìm và chỉ/chọn hình phù hợp.",
    prerequisiteIds: []
  },
  {
    id: "naming",
    title: "Gọi tên và nói theo",
    description: "Cho con cơ hội tự gọi tên trước khi đưa mẫu.",
    prerequisiteIds: []
  },
  {
    id: "cloze",
    title: "Hoàn thành lời quen thuộc",
    description: "Hoàn thành đoạn lời được dừng có chủ đích.",
    prerequisiteIds: []
  },
  {
    id: "sentence",
    title: "Kết hợp từ thành câu",
    description: "Dùng cụm/câu để diễn đạt trong ngữ cảnh.",
    prerequisiteIds: []
  },
  {
    id: "yes_no",
    title: "Trả lời Có và Không",
    description: "Trả lời theo ý muốn hoặc ngữ cảnh thực.",
    prerequisiteIds: []
  },
  {
    id: "visual_qa",
    title: "Hỏi đáp qua hình",
    description: "Nhìn ngữ cảnh và trả lời câu hỏi phù hợp.",
    prerequisiteIds: []
  },
  {
    id: "request",
    title: "Bày tỏ điều con muốn",
    description: "Tạo cơ hội yêu cầu trong sinh hoạt.",
    prerequisiteIds: []
  },
  {
    id: "command",
    title: "Hiểu và làm theo yêu cầu",
    description: "Nghe và thực hiện với đồ vật thật.",
    prerequisiteIds: []
  },
  {
    id: "choice",
    title: "Lựa chọn điều con thích",
    description: "Bày tỏ lựa chọn với người thân.",
    prerequisiteIds: []
  },
  {
    id: "refusal",
    title: "Bày tỏ khi không muốn",
    description: "Từ chối và được người lớn tôn trọng.",
    prerequisiteIds: []
  }
];
const guidedLessons = [
  {
    id: "fixture_lesson_request",
    goalId: "request",
    title: "Con muốn nước",
    preparation: "Một cốc nước phù hợp, phụ huynh ở cạnh con.",
    itemId: "item-ly",
    prerequisiteLessonIds: []
  },
  {
    id: "fixture_lesson_ball",
    goalId: "request",
    title: "Con muốn bóng",
    preparation: "Một quả bóng mềm phù hợp, phụ huynh ở cạnh con.",
    itemId: "item-bong",
    prerequisiteLessonIds: []
  },
  {
    id: "fixture_lesson_bear",
    goalId: "request",
    title: "Con muốn gấu",
    preparation: "Một gấu bông quen thuộc, phụ huynh ở cạnh con.",
    itemId: "item-gau",
    prerequisiteLessonIds: []
  },
  {
    id: "fixture_lesson_put_ball",
    goalId: "command",
    title: "Cho bóng vào hộp",
    preparation: "Một quả bóng mềm và hộp đủ lớn, đặt trong tầm với an toàn.",
    itemId: "item-bong",
    prerequisiteLessonIds: []
  },
  {
    id: "fixture_lesson_two_steps",
    goalId: "command",
    title: "Bóng vào hộp, gấu cho mẹ",
    preparation: "Một quả bóng mềm, hộp và gấu bông; mẹ ở cạnh con.",
    itemId: "item-gau",
    prerequisiteLessonIds: ["fixture_lesson_put_ball"]
  },
  {
    id: "fixture_lesson_choice",
    goalId: "choice",
    title: "Con chọn bóng hay gấu?",
    preparation: "Một quả bóng và gấu bông quen thuộc, cả hai đều có thể đưa cho con.",
    itemId: "item-bong",
    prerequisiteLessonIds: []
  },
  {
    id: "fixture_lesson_refusal",
    goalId: "refusal",
    title: "Con chưa muốn chơi",
    preparation: "Một đồ chơi quen thuộc; sẵn sàng dừng khi con từ chối.",
    itemId: "item-gau",
    prerequisiteLessonIds: []
  }
].map((lesson) => ({
  ...lesson,
  version: 1,
  activityTypes:
    lesson.goalId === "command"
      ? ["command", "parent_transfer"]
      : ["functional_communication", "parent_transfer"]
}));

export const practiceLessons = [
  ...guidedLessons,
  ...[
    {
      id: "fixture_lesson_model_ba",
      goalId: "model",
      title: "Cùng nghe và nhìn ba",
      itemId: "item-ba",
      preparation: "Người lớn ở cạnh con, chuẩn bị một ảnh ba quen thuộc nếu có.",
      activityType: "word_model"
    },
    {
      id: "fixture_lesson_recognition",
      goalId: "recognition",
      title: "Ba đâu rồi?",
      itemId: "item-ba",
      preparation: "Cùng nhìn hai hình người thân; có thể dùng ảnh gia đình.",
      activityType: "recognition"
    },
    {
      id: "fixture_lesson_naming",
      goalId: "naming",
      title: "Con gọi tên ba",
      itemId: "item-ba",
      preparation: "Chờ con có cơ hội tự gọi tên trước khi nghe mẫu.",
      activityType: "naming"
    },
    {
      id: "fixture_lesson_cloze",
      goalId: "cloze",
      title: "Ba và… mẹ",
      itemId: "item-me",
      preparation: "Giới thiệu thứ tự gọi tên ba, mẹ bằng hình/người thật trước khi thử đoạn dừng.",
      activityType: "cloze_tail"
    },
    {
      id: "fixture_lesson_sentence",
      goalId: "sentence",
      title: "Ba đang vẫy tay",
      itemId: "item-ba",
      preparation: "Cùng xem ba vẫy tay hoặc nhờ người thân vẫy tay thật.",
      activityType: "functional_sentence"
    },
    {
      id: "fixture_lesson_yes_no",
      goalId: "yes_no",
      title: "Con có muốn chơi bóng không?",
      itemId: "item-bong",
      preparation: "Một quả bóng phù hợp; tôn trọng cả Có lẫn Không.",
      activityType: "yes_no"
    },
    {
      id: "fixture_lesson_visual_qa",
      goalId: "visual_qa",
      title: "Ai đang vẫy tay?",
      itemId: "item-ba",
      preparation: "Xem một hình rõ chủ thể; hỏi rồi chờ trước khi gợi ý.",
      activityType: "visual_qa"
    }
  ].map(({ activityType, ...lesson }) => ({
    ...lesson,
    version: 1,
    prerequisiteLessonIds: [],
    activityTypes: [activityType, "parent_transfer"]
  }))
];

export function practiceCatalog() {
  // The same OCI image uses NODE_ENV=production locally; APP_ENV is the boundary.
  const local = process.env.APP_ENV === "local";
  return {
    schemaVersion: 1,
    version: local ? "practice_fixture_v1" : "practice_pending_v1",
    source: local ? "development_fixture" : "unavailable",
    goals: practiceGoals,
    lessons: local
      ? [...practiceLessons, ...practicePlayLessons].filter(
          (lesson) =>
            process.env.C50_DAILY_GAMES_CUTOVER !== "1" || lesson.id !== "fixture_play_today_words"
        )
      : []
  };
}

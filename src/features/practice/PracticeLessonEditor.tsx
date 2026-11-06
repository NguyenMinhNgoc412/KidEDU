import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import {
  composePractice,
  setPracticeLessons,
  type PracticeCatalog,
  type PracticeDocument
} from "./practicePlan";

export function PracticeLessonEditor({
  catalog,
  document,
  saving,
  onSave,
  recommendations
}: {
  catalog: PracticeCatalog;
  document: PracticeDocument | null;
  saving: boolean;
  onSave(next: PracticeDocument): Promise<void>;
  recommendations?: Record<string, { title: string; reason: string }>;
}) {
  const lessons = composePractice(catalog, document).lessons;
  const ids = lessons.map((item) => item.id);
  const playIds = catalog.lessons
    .filter((item) => item.id.startsWith("fixture_play_"))
    .map((item) => item.id);
  const disabled = saving || !catalog.learningAllowed;
  function save(next: string[]) {
    void onSave(setPracticeLessons(catalog, document, next));
  }
  function move(index: number, offset: number) {
    const next = [...ids];
    [next[index], next[index + offset]] = [next[index + offset]!, next[index]!];
    save(next);
  }
  return (
    <View style={{ gap: 12 }}>
      <AppText variant="sectionTitle">Chỉnh bài trong phiên</AppText>
      <AppText color="muted">
        Thêm, bớt và sắp thứ tự các bài trước khi bắt đầu. Thay đổi được lưu cho phiên mới; phiên
        đang dở giữ danh sách đã chuẩn bị.
      </AppText>
      <AppText variant="labelStrong">Đã chọn {lessons.length} bài</AppText>
      {catalog.lessons.some((item) => item.id === "fixture_play_today_words") ? (
        <KidButton
          label="Chọn bài 5 từ · 3 trò chơi"
          disabled={disabled}
          onPress={() => save(["fixture_play_today_words"])}
        />
      ) : null}
      {playIds.length ? (
        <>
          <AppText color="muted">
            Có {playIds.length} trò chơi tương tác để thay đổi hoạt động trong phiên.
          </AppText>
          <KidButton
            label="Chọn nhóm trò chơi tương tác"
            disabled={disabled}
            onPress={() => save(playIds)}
          />
        </>
      ) : null}
      <KidButton
        label="Bỏ chọn tất cả"
        variant="plain"
        disabled={disabled || ids.length === 0}
        onPress={() => save([])}
      />
      {lessons.length === 0 ? (
        <AppText>Chưa chọn bài nào. Thêm bài bên dưới để tạo phiên học.</AppText>
      ) : null}
      {lessons.map((lesson, index) => (
        <Card key={lesson.id} variant="subtle">
          <AppText variant="cardTitle">
            {index + 1}. {lesson.title}
          </AppText>
          <AppText>{lesson.preparation}</AppText>
          {recommendations?.[lesson.id] ? (
            <>
              <AppText variant="labelStrong">{recommendations[lesson.id]!.title}</AppText>
              <AppText color="muted">{recommendations[lesson.id]!.reason}</AppText>
            </>
          ) : null}
          <KidButton
            label={`Đưa ${lesson.title} lên`}
            variant="secondary"
            disabled={disabled || index === 0}
            onPress={() => move(index, -1)}
          />
          <KidButton
            label={`Đưa ${lesson.title} xuống`}
            variant="secondary"
            disabled={disabled || index === lessons.length - 1}
            onPress={() => move(index, 1)}
          />
          <KidButton
            label={`Bỏ ${lesson.title} khỏi phiên`}
            variant="plain"
            disabled={disabled}
            onPress={() => save(ids.filter((id) => id !== lesson.id))}
          />
        </Card>
      ))}
      <AppText variant="cardTitle">Thêm bài vào phiên</AppText>
      {catalog.lessons
        .filter((item) => !ids.includes(item.id))
        .map((lesson) => (
          <Card key={lesson.id} variant="form">
            <AppText>{lesson.title}</AppText>
            <KidButton
              label={`Thêm ${lesson.title} vào phiên`}
              disabled={disabled || ids.length >= 30}
              variant="secondary"
              onPress={() => save([...ids, lesson.id])}
            />
          </Card>
        ))}
      <KidButton
        label="Chọn toàn bộ bài mẫu"
        variant="plain"
        disabled={disabled}
        onPress={() => save(catalog.lessons.map((item) => item.id))}
      />
    </View>
  );
}

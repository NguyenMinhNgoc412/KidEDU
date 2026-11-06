import { useRouter } from "expo-router";
import { Check, ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { illustrationAnimations } from "@/data/illustrationAnimations";
import { SemanticIllustration } from "@/features/learning/SemanticIllustration";
import { useParentDashboard } from "@/features/parent/useParentDashboard";
import { useParentGateStore } from "@/features/parent/parentGate";
import { colors } from "@/theme";
import { localFixtureEnabled } from "./fixtureBoundary";
import { learningGoals, sampleLessons, type LearningGoal } from "./lessonCatalog";
import { useLessonSelection } from "./useLessonSelection";

const noMotion = () => {};
export function ParentLessonPicker() {
  const dashboard = useParentDashboard();
  const selection = useLessonSelection(dashboard.selected?.id);
  const [message, setMessage] = useState<string | null>(null);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [deferredSuggestions, setDeferredSuggestions] = useState<string[]>([]);
  const router = useRouter();
  async function choose(id: string) {
    setMessage(null);
    try {
      await selection.select(id);
      setMessage("Đã chọn bài. Các bài đang dở vẫn được giữ lại.");
    } catch {
      setMessage("Chưa lưu được lựa chọn. Vui lòng thử lại.");
    }
  }
  return (
    <Screen>
      <KidButton
        label="Về khu phụ huynh"
        variant="plain"
        icon={<ArrowLeft size={20} color={colors.primary} />}
        onPress={() => router.back()}
      />
      <AppText variant="screenTitle">Chọn bài cùng con</AppText>
      <AppText color="muted">
        {dashboard.selected
          ? `Bài hôm nay dành cho ${dashboard.selected.displayName}.`
          : "Chọn hồ sơ con trong khu phụ huynh trước."}{" "}
        Mỗi bài gồm luyện cùng con và thử trong sinh hoạt.
      </AppText>
      <AppText variant="caption" color="muted">
        Bài trải nghiệm · dữ liệu mẫu. Lựa chọn được lưu riêng cho từng hồ sơ trên thiết bị.
      </AppText>
      {localFixtureEnabled() ? (
        <View accessibilityRole="radiogroup" accessibilityLabel="Mục tiêu muốn luyện">
          <KidButton
            label="Tất cả mục tiêu"
            selected={goal === null}
            variant="plain"
            onPress={() => setGoal(null)}
          />
          {(Object.keys(learningGoals) as LearningGoal[]).map((key) => (
            <KidButton
              key={key}
              label={learningGoals[key].title}
              selected={goal === key}
              variant="plain"
              onPress={() => setGoal(key)}
            />
          ))}
        </View>
      ) : null}
      {localFixtureEnabled() ? (
        sampleLessons
          .filter((lesson) => lesson.id !== "fixture_play_today_words")
          .filter((lesson) => goal === null || lesson.goal === goal)
          .map((lesson) => (
            <Card
              key={lesson.id}
              padding="lg"
              variant={selection.lesson.id === lesson.id ? "subtle" : "surface"}
            >
              <View style={{ alignItems: "center" }}>
                <SemanticIllustration
                  size={136}
                  animation={illustrationAnimations[lesson.itemId]!}
                  paused
                  disabled
                  onComplete={noMotion}
                  onReplay={noMotion}
                  fallback={<AppText>{lesson.object}</AppText>}
                />
              </View>
              <AppText variant="cardTitle">{lesson.title}</AppText>
              <AppText variant="labelStrong">{learningGoals[lesson.goal].title}</AppText>
              <AppText>{learningGoals[lesson.goal].purpose}</AppText>
              <AppText color="muted">{lesson.preparation}</AppText>
              <AppText variant="caption" color="muted">
                {lesson.context} Hai hoạt động ngắn, không chấm điểm.
              </AppText>
              {selection.recommendations[lesson.id] && !deferredSuggestions.includes(lesson.id) ? (
                <>
                  <AppText variant="labelStrong">
                    {selection.recommendations[lesson.id]!.title}
                  </AppText>
                  <AppText color="muted">{selection.recommendations[lesson.id]!.reason}</AppText>
                  <KidButton
                    label={`Để gợi ý cho bài ${lesson.title} lúc khác`}
                    variant="plain"
                    onPress={() => setDeferredSuggestions((previous) => [...previous, lesson.id])}
                  />
                </>
              ) : null}
              <KidButton
                label={selection.lesson.id === lesson.id ? "Đang chọn" : `Chọn bài ${lesson.title}`}
                selected={selection.lesson.id === lesson.id}
                icon={
                  selection.lesson.id === lesson.id ? (
                    <Check size={20} color={colors.onPrimary} />
                  ) : undefined
                }
                disabled={
                  !dashboard.selected ||
                  dashboard.loading ||
                  Boolean(dashboard.error) ||
                  selection.loading ||
                  selection.saving
                }
                onPress={() => void choose(lesson.id)}
              />
            </Card>
          ))
      ) : (
        <Card>
          <AppText>Thư viện bài học đang chờ nội dung được chuẩn bị và kiểm tra.</AppText>
        </Card>
      )}
      {selection.error ? (
        <AppText>Chưa đọc hoặc lưu được lựa chọn bài. Vui lòng mở lại màn hình.</AppText>
      ) : null}
      {selection.historyError ? (
        <AppText>Chưa đọc được quan sát để gợi ý. Bạn vẫn có thể chọn bài phù hợp.</AppText>
      ) : null}
      {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
      {localFixtureEnabled() && dashboard.selected ? (
        <KidButton
          label="Về học với bài đã chọn"
          disabled={selection.loading || selection.saving || Boolean(dashboard.error)}
          onPress={() => {
            useParentGateStore.getState().lock();
            router.replace("/");
          }}
        />
      ) : null}
    </Screen>
  );
}

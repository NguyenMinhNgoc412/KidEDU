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
import { sampleLessons } from "./lessonCatalog";
import { useLessonSelection } from "./useLessonSelection";

const noMotion = () => {};
export function ParentLessonPicker() {
  const dashboard = useParentDashboard();
  const selection = useLessonSelection(dashboard.selected?.id);
  const [message, setMessage] = useState<string | null>(null);
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
        sampleLessons.map((lesson) => (
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
            <AppText color="muted">{lesson.preparation}</AppText>
            <AppText variant="caption" color="muted">
              {lesson.context} Hai hoạt động ngắn, không chấm điểm.
            </AppText>
            <KidButton
              label={
                selection.lesson.id === lesson.id ? "Đang chọn" : `Chọn bài ${lesson.response}`
              }
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

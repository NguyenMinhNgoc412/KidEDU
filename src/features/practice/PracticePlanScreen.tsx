import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Leaf } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { useParentGateStore } from "@/features/parent/parentGate";
import { LocalObservationsCard } from "@/features/lessonRuntime/LocalObservationsCard";
import { ApiRequestError } from "@/api/localClient";
import { colors } from "@/theme";
import { changePracticeGoal, type PracticeDocument } from "./practicePlan";
import { usePractice } from "./usePractice";
import { PracticeLessonEditor } from "./PracticeLessonEditor";
import { PracticeHistory } from "./PracticeHistory";
import { PracticeFamilyMedia } from "./PracticeFamilyMedia";
import { sampleLessons } from "@/features/lessonRuntime/lessonCatalog";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";

export function PracticePlanScreen() {
  const practice = usePractice();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const data = practice.data;
  const document =
    data?.plan.document ??
    (data
      ? {
          schemaVersion: 1 as const,
          curriculumVersion: data.catalog.version,
          goalIds: [] as string[],
          selectedLessonId: null,
          deferredLessonIds: [] as string[]
        }
      : null);
  async function save(next: PracticeDocument) {
    setMessage(null);
    try {
      await practice.save(next);
      setMessage("Đã lưu kế hoạch Cùng luyện trên server.");
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError && error.status === 409
          ? "Kế hoạch đã đổi ở nơi khác. Đã tải lại; bạn kiểm tra rồi chọn lại nhé."
          : "Chưa lưu được kế hoạch. Lựa chọn cũ vẫn được giữ; vui lòng thử lại."
      );
    }
  }
  return (
    <Screen>
      <KidButton
        label="Về cùng luyện"
        variant="plain"
        onPress={() => {
          useParentGateStore.getState().lock();
          router.replace("/practice");
        }}
      />
      <AppText variant="screenTitle">Cùng con luyện điều gì?</AppText>
      <AppText color="muted">
        Chọn điều bạn quan sát và muốn hỗ trợ. Con có thể luyện nhiều mục tiêu với tốc độ khác nhau.
      </AppText>
      {practice.loading ? (
        <AppText>Đang tải kế hoạch…</AppText>
      ) : practice.error ? (
        <Card>
          <AppText>Chưa đọc được kế hoạch.</AppText>
          <KidButton label="Thử tải lại" onPress={practice.refresh} />
        </Card>
      ) : null}
      {!practice.loading && !practice.dashboard.selected ? (
        <AppText>Chọn hoặc tạo hồ sơ trẻ trong khu phụ huynh trước.</AppText>
      ) : null}
      {data ? (
        <PracticeLessonEditor
          catalog={data.catalog}
          document={document}
          saving={practice.saving}
          onSave={save}
          recommendations={practice.recommendations}
        />
      ) : null}
      {data?.catalog.goals.map((goal) => (
        <Card
          key={goal.id}
          padding="lg"
          variant={document?.goalIds.includes(goal.id) ? "subtle" : "surface"}
        >
          <View style={styles.row}>
            <Leaf color={colors.primary} size={22} />
            <AppText variant="cardTitle">{goal.title}</AppText>
          </View>
          <AppText>{goal.description}</AppText>
          <KidButton
            label={
              document?.goalIds.includes(goal.id)
                ? `Tạm bỏ mục tiêu ${goal.title}`
                : `Luyện ${goal.title}`
            }
            selected={document?.goalIds.includes(goal.id)}
            variant="secondary"
            disabled={practice.saving || !data.catalog.learningAllowed}
            onPress={() => void save(changePracticeGoal(data.catalog, document, goal.id))}
          />
        </Card>
      ))}
      {data && !data.catalog.lessons.length ? (
        <Card>
          <AppText>Nội dung đang chờ được chuẩn bị và kiểm tra trước khi mở buổi luyện.</AppText>
        </Card>
      ) : null}
      {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
      {practice.dashboard.selected && localFixtureEnabled() ? (
        <>
          <AppText variant="sectionTitle">Media gia đình</AppText>
          <AppText color="muted">
            Bạn vẫn có thể quản lý media của gia đình khi gói học hết hạn.
          </AppText>
          {sampleLessons
            .filter((sample) => "activityType" in sample)
            .map((sample) => (
              <PracticeFamilyMedia
                key={sample.id}
                childId={practice.dashboard.selected!.id}
                lessonId={sample.id}
              />
            ))}
        </>
      ) : null}
      <AppText variant="sectionTitle">Ghi nhận theo mục tiêu</AppText>
      {practice.dashboard.selected ? (
        <>
          <LocalObservationsCard childId={practice.dashboard.selected.id} />
          <PracticeHistory childId={practice.dashboard.selected.id} />
        </>
      ) : null}
      <AppText variant="caption" color="muted">
        Quan sát gần đây giúp bạn chọn lần luyện tới; không phải đánh giá hay chẩn đoán phát triển.
      </AppText>
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }
});

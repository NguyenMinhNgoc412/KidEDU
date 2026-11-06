import { useRouter } from "expo-router";
import { View } from "react-native";
import { Leaf, ArrowRight } from "lucide-react-native";
import { colors } from "@/theme";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { useParentDashboard } from "@/features/parent/useParentDashboard";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { useLessonSelection } from "@/features/lessonRuntime/useLessonSelection";
import { learningGoals } from "@/features/lessonRuntime/lessonCatalog";

/** Account-bound plan read; no lesson is marked Ready until the pack loader exists. */
export function TodayPlanCard() {
  const dashboard = useParentDashboard();
  const selection = useLessonSelection(dashboard.selected?.id);
  const router = useRouter();
  const items = dashboard.plan?.document?.items ?? [];
  if (localFixtureEnabled() && dashboard.selected && !dashboard.loading && !dashboard.error) {
    return (
      <Card padding="lg" variant="subtle" style={{ gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Leaf size={24} color={colors.primary} />
          <AppText color="primary" variant="labelStrong">
            Bài hôm nay
          </AppText>
        </View>
        <AppText variant="screenTitle">{selection.lesson.title}</AppText>
        <AppText color="muted">
          {learningGoals[selection.lesson.goal].purpose} Sau đó thử trong sinh hoạt hằng ngày.
        </AppText>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <AppText variant="caption" color="primary">
            01 · Luyện cùng con
          </AppText>
          <ArrowRight size={16} color={colors.primary} />
          <AppText variant="caption" color="primary">
            02 · Trong sinh hoạt
          </AppText>
        </View>
        <KidButton
          fullWidth
          size="lg"
          label="Mở bài hôm nay"
          disabled={selection.loading || selection.error}
          onPress={() =>
            router.push({
              pathname: "/lesson-session",
              params: { childId: dashboard.selected!.id }
            })
          }
        />
        <AppText variant="caption" color="muted">
          Bài trải nghiệm · dữ liệu mẫu
        </AppText>
      </Card>
    );
  }
  return (
    <Card padding="lg" variant="surface">
      <AppText color="primary" variant="labelStrong">
        Bài hôm nay
      </AppText>
      <AppText variant="cardTitle">
        {dashboard.loading
          ? "Đang xem kế hoạch học"
          : dashboard.error
            ? "Chưa tải được kế hoạch"
            : !dashboard.selected
              ? "Cần phụ huynh chuẩn bị hồ sơ"
              : items.length
                ? "Bài học đang chờ chuẩn bị"
                : "Cùng phụ huynh chọn mục tiêu"}
      </AppText>
      <AppText color="muted">
        {dashboard.loading
          ? "Đang lấy kế hoạch đã lưu của hồ sơ đang chọn."
          : dashboard.error
            ? "Kiểm tra kết nối rồi thử lại."
            : items.length
              ? `Kế hoạch đã lưu có ${items.length} bài. Bài chỉ mở sau khi nội dung được kiểm tra và sẵn sàng.`
              : "Phụ huynh xem hồ sơ và kế hoạch trước khi bắt đầu luyện cùng con."}
      </AppText>
      <KidButton
        fullWidth
        size="lg"
        label={dashboard.error ? "Tải lại kế hoạch" : "Nhờ phụ huynh chuẩn bị"}
        onPress={dashboard.error ? dashboard.refresh : () => router.push("/parent-gate")}
      />
    </Card>
  );
}

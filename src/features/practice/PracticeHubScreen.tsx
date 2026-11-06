import { HeartHandshake, Check, Leaf, ArrowRight } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme";
import { usePractice } from "./usePractice";
import { PracticeTabBar } from "./PracticeTabBar";

export function PracticeHubScreen() {
  const practice = usePractice();
  const router = useRouter();
  const { refresh } = practice;
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  // Refresh outside activities; route focus also reconciles edits made in Parent Zone.
  useFocusEffect(
    useCallback(() => {
      refreshRef.current();
    }, [])
  );
  const lesson = practice.composition?.lesson;
  const pendingReview = practice.local?.sessions.find(
    (item) =>
      item.course &&
      (item.phase === "observation" ||
        (item.phase === "paused" && item.resumePhase === "observation"))
  );
  const checkpoint = practice.data?.checkpoints.find(
    (item) =>
      item.document.course &&
      item.document.lessonId === lesson?.id &&
      item.document.phase !== "finished"
  );
  const localResume = practice.local?.sessions.some(
    (session) =>
      session.course && session.prepared.lesson.id === lesson?.id && session.phase !== "finished"
  );
  const setup = () =>
    router.push({ pathname: "/parent-gate", params: { destination: "practice" } });
  return (
    <Screen bottomBar={<PracticeTabBar />}>
      <View style={styles.intro}>
        <View style={styles.icon}>
          <HeartHandshake color={colors.primary} size={30} />
        </View>
        <AppText variant="screenTitle">Cùng luyện</AppText>
        <AppText color="muted">Một mục tiêu nhỏ. Một khoảng thời gian bên nhau.</AppText>
      </View>
      <KidButton label="Chỉnh sửa bài trong phiên" variant="secondary" onPress={setup} />
      {pendingReview ? (
        <Card variant="subtle">
          <AppText variant="cardTitle">Phiên đã học xong, còn nhận xét</AppText>
          <AppText>
            Đã nhận xét {pendingReview.course!.reviewIndex}/{pendingReview.course!.lessonIds.length}{" "}
            bài.
          </AppText>
          <KidButton
            label="Tiếp tục nhận xét cuối phiên"
            onPress={() =>
              router.push({
                pathname: "/practice/session",
                params: {
                  childId: pendingReview.childId,
                  lessonId: pendingReview.prepared.lesson.id,
                  mode: "practice"
                }
              })
            }
          />
        </Card>
      ) : null}
      {practice.loading ? (
        <Card>
          <AppText>Đang chuẩn bị góc cùng luyện…</AppText>
        </Card>
      ) : practice.error ? (
        <Card>
          <AppText>Chưa tải được buổi luyện. Kiểm tra kết nối và thử lại.</AppText>
          <KidButton label="Tải lại cùng luyện" onPress={practice.refresh} />
        </Card>
      ) : !practice.dashboard.selected ? (
        <Card>
          <AppText>Cần phụ huynh chuẩn bị hồ sơ cho con.</AppText>
          <KidButton label="Nhờ phụ huynh chuẩn bị" onPress={setup} />
        </Card>
      ) : !practice.data?.catalog.learningAllowed ? (
        <Card>
          <AppText variant="cardTitle">Nhờ phụ huynh mở buổi luyện</AppText>
          <AppText>
            Quyền học cần được kiểm tra trước khi bắt đầu. Dữ liệu gia đình vẫn được giữ.
          </AppText>
          <KidButton label="Nhờ phụ huynh kiểm tra" onPress={() => router.push("/parent-gate")} />
        </Card>
      ) : lesson ? (
        <Card padding="lg" variant="subtle">
          <AppText color="primary" variant="labelStrong">
            BUỔI HÔM NAY
          </AppText>
          <AppText variant="screenTitle">
            Một phiên · {practice.composition?.lessons.length} bài học
          </AppText>
          <AppText>Bắt đầu với: {lesson.title}</AppText>
          <AppText>
            {practice.data.catalog.goals.find((goal) => goal.id === lesson.goalId)?.description}
          </AppText>
          <AppText color="muted">{practice.composition?.reason}</AppText>
          <View style={styles.stages}>
            <AppText variant="caption">Chuẩn bị</AppText>
            <ArrowRight color={colors.primary} size={16} />
            <AppText variant="caption">Cùng thử</AppText>
            <ArrowRight color={colors.primary} size={16} />
            <AppText variant="caption">Nhận xét cuối phiên</AppText>
          </View>
          <KidButton
            label={checkpoint || localResume ? "Tiếp tục buổi luyện" : "Chuẩn bị buổi luyện"}
            size="lg"
            onPress={() =>
              router.push({
                pathname: "/practice/prepare",
                params: { childId: practice.dashboard.selected!.id, lessonId: lesson.id }
              })
            }
          />
        </Card>
      ) : (
        <Card padding="lg" variant="subtle">
          <AppText variant="sectionTitle">Bắt đầu từ điều con cần</AppText>
          <AppText>{practice.composition?.reason}</AppText>
          <KidButton label="Cùng phụ huynh chọn mục tiêu" onPress={setup} />
        </Card>
      )}
      <AppText variant="sectionTitle">Các bài trong phiên</AppText>
      {practice.composition?.lessons.map((item, index) => (
        <Card key={item.id} variant="form">
          <AppText>
            {index + 1}. {item.title}
          </AppText>
        </Card>
      ))}
      <AppText variant="sectionTitle">Mỗi phiên mình sẽ…</AppText>
      {[
        ["Tạo một cơ hội", "Cùng nghe, nhìn, nói hoặc làm theo mục tiêu của con."],
        ["Chờ và hỗ trợ", "Cho con thời gian; dùng gợi ý khi cần."],
        [
          "Nhận xét cuối phiên",
          "Học xong các bài rồi phụ huynh nhận xét riêng từng bài, gồm cả bài đã bỏ qua."
        ]
      ].map(([title, detail]) => (
        <Card key={title} padding="lg" variant="form">
          <View style={styles.row}>
            <Check color={colors.primary} size={22} />
            <AppText variant="cardTitle">{title}</AppText>
          </View>
          <AppText color="muted">{detail}</AppText>
        </Card>
      ))}
      {practice.data?.plan.document?.goalIds.length ? (
        <Card padding="lg">
          <AppText variant="cardTitle">Mục tiêu đang cùng con luyện</AppText>
          {practice.data.catalog.goals
            .filter((goal) => practice.data!.plan.document!.goalIds.includes(goal.id))
            .map((goal) => (
              <View key={goal.id} style={styles.row}>
                <Leaf size={18} color={colors.primary} />
                <AppText>{goal.title}</AppText>
              </View>
            ))}
          <KidButton label="Nhờ phụ huynh xem ghi nhận" variant="plain" onPress={setup} />
        </Card>
      ) : null}
      {practice.data?.catalog.source === "development_fixture" ? (
        <AppText variant="caption" color="muted">
          Buổi trải nghiệm · nội dung mẫu để cùng thử.
        </AppText>
      ) : null}
      {practice.local?.sessions.length ? (
        <KidButton
          label="Cập nhật buổi đã lưu"
          variant="plain"
          disabled={practice.syncing}
          onPress={() => {
            void practice.sync().catch(() => undefined);
          }}
        />
      ) : null}
      {practice.syncMessage ? (
        <AppText accessibilityLiveRegion="polite" variant="caption">
          {practice.syncMessage}
        </AppText>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  intro: { gap: 12, paddingVertical: 16 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  row: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  stages: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }
});

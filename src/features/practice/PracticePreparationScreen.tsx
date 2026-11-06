import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { usePractice } from "./usePractice";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { preparePracticeCourse } from "./preparePracticeCourse";
import { findSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { lessonGuidance } from "@/features/lessonRuntime/lessonGuidance";
import { useLessonRuntimeRepository } from "@/features/lessonRuntime/LessonRuntimeProvider";

export function PracticePreparationScreen() {
  const { childId, lessonId } = useLocalSearchParams<{ childId?: string; lessonId?: string }>();
  const practice = usePractice();
  const { session } = useAuth();
  const router = useRouter();
  const { repository } = useLessonRuntimeRepository();
  const lesson = practice.data?.catalog.lessons.find((lesson) => lesson.id === lessonId);
  const ownChild = practice.dashboard.selected?.id === childId;
  const local = localFixtureEnabled() && practice.data?.catalog.source === "development_fixture";
  const preparation = useQuery({
    queryKey: [
      "practice-preparation",
      session?.accountId,
      childId,
      lessonId,
      practice.composition?.lessons.map((item) => item.id).join(":")
    ],
    enabled: Boolean(local && lesson && ownChild && session && childId && repository),
    queryFn: async () => {
      const saved = await repository!.load(childId!, `practice-course:fixture:${lesson!.id}:1`);
      return (
        saved?.prepared ??
        preparePracticeCourse(
          session!.accountId,
          childId!,
          practice.composition!.lessons.map((item) => item.id),
          repository
        )
      );
    },
    staleTime: 0
  });
  const prepared = preparation.data ?? null;
  const continuingSavedList =
    prepared?.courseLessonIds &&
    JSON.stringify(prepared.courseLessonIds) !==
      JSON.stringify(practice.composition?.lessons.map((item) => item.id));
  return (
    <Screen>
      <KidButton
        label="Về cùng luyện"
        variant="plain"
        onPress={() => router.replace("/practice")}
      />
      <AppText variant="screenTitle">Một chút chuẩn bị</AppText>
      {continuingSavedList ? (
        <Card variant="subtle">
          <AppText>
            Bạn đang tiếp tục phiên đã lưu. Danh sách vừa chỉnh sẽ dùng cho phiên mới sau khi hoàn
            tất phiên này.
          </AppText>
        </Card>
      ) : null}
      <KidButton
        label="Chỉnh sửa bài trong phiên"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: "/parent-gate", params: { destination: "practice" } })
        }
      />
      {practice.loading ? (
        <AppText>Đang đọc buổi luyện…</AppText>
      ) : !lesson || !ownChild || practice.error ? (
        <Card>
          <AppText>Chưa chuẩn bị được buổi luyện cho hồ sơ hiện tại.</AppText>
          <KidButton label="Thử tải lại" onPress={practice.refresh} />
        </Card>
      ) : (
        <>
          <Card padding="lg" variant="subtle">
            <AppText variant="sectionTitle">
              Một phiên ·{" "}
              {prepared?.courseLessonIds?.length ?? practice.composition?.lessons.length} bài học
            </AppText>
            <AppText>
              {practice.data?.catalog.goals.find((goal) => goal.id === lesson.goalId)?.description}
            </AppText>
            <AppText variant="labelStrong">Cần chuẩn bị</AppText>
            <AppText>{lesson.preparation}</AppText>
            <AppText color="muted">Người lớn ở cạnh con. Dừng khi con chưa muốn tham gia.</AppText>
          </Card>
          <AppText variant="sectionTitle">Buổi này mình sẽ làm gì?</AppText>
          {preparation.isFetching ? (
            <AppText>Đang chuẩn bị hình và âm thanh trên thiết bị…</AppText>
          ) : null}
          {preparation.isError ? (
            <Card>
              <AppText>Chưa chuẩn bị đủ media. Bài chưa thể bắt đầu.</AppText>
              <KidButton
                label="Chuẩn bị lại media"
                onPress={() => {
                  void preparation.refetch();
                }}
              />
            </Card>
          ) : null}
          {prepared?.activities
            .filter((activity) => activity.type !== "parent_transfer")
            .map((activity, index) => (
              <Card key={activity.id} padding="lg" variant="form">
                <AppText variant="cardTitle">
                  {index + 1}.{" "}
                  {findSampleLesson(prepared.courseLessonIds?.[index] ?? "")?.title ??
                    lessonGuidance(activity).label}
                </AppText>
                <AppText>{activity.parentInstruction}</AppText>
                <AppText variant="caption" color="muted">
                  {activity.transfer.observationHint}
                </AppText>
              </Card>
            ))}
          <Card padding="lg">
            <AppText variant="cardTitle">Học hết phiên rồi mới nhận xét</AppText>
            <AppText>
              Con học lần lượt các bài trong danh sách. Sau phần học, phụ huynh nhận xét riêng từng
              bài; bài bỏ qua được đánh dấu để bạn biết. Không ngắt giữa các bài để nhận xét.
            </AppText>
          </Card>
          <View>
            <AppText variant="caption" color="muted">
              {local
                ? "Đồ vật và hướng dẫn đã có trên thiết bị. Buổi mẫu cần server kiểm tra quyền trước khi mở."
                : "Buổi chỉ mở khi nội dung và quyền học đã được kiểm tra đầy đủ."}
            </AppText>
          </View>
          <KidButton
            label="Vào buổi cùng luyện"
            size="lg"
            disabled={
              !prepared ||
              preparation.isFetching ||
              preparation.isError ||
              !practice.data?.catalog.learningAllowed
            }
            onPress={() =>
              router.push({
                pathname: "/practice/session",
                params: { childId, lessonId, mode: "practice" }
              })
            }
          />
        </>
      )}
    </Screen>
  );
}

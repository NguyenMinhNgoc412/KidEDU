import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { KidButton } from "@/components/KidButton";
import { Card } from "@/components/Card";
import { learningGoals } from "@/features/lessonRuntime/lessonCatalog";
const goals = Object.entries(learningGoals).map(([id, value]) => ({ id, label: value.title }));

export function PracticeHistory({ childId }: { childId: string }) {
  const { session, accessTokenValid } = useAuth();
  const [goal, setGoal] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const history = useInfiniteQuery({
    queryKey: ["practice-history", session?.accountId, childId],
    enabled: Boolean(session && accessTokenValid),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      createLocalApiClient(
        process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
        session!.accessToken
      ).listObservations(childId, pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined
  });
  const rows = [
    ...new Map(
      (history.data?.pages.flatMap((page) => page.observations) ?? []).map((row) => [row.id, row])
    ).values()
  ].filter(
    (row) =>
      !row.supersededById &&
      (!goal || row.goalId === `fixture_goal_${goal}`) &&
      (!context || row.context === context)
  );
  return (
    <View style={{ gap: 12 }}>
      <AppText variant="cardTitle">Lịch sử đã đồng bộ</AppText>
      <AppText color="muted">
        Lọc các trang đã tải theo mục tiêu và ngữ cảnh. Ghi nhận chưa đồng bộ nằm ở danh sách trên.
      </AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <KidButton
          label="Tất cả mục tiêu"
          variant="plain"
          selected={!goal}
          onPress={() => setGoal(null)}
        />
        {goals.map((item) => (
          <KidButton
            key={item.id}
            label={item.label}
            variant="plain"
            selected={goal === item.id}
            onPress={() => setGoal(item.id)}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { id: null, label: "Mọi ngữ cảnh" },
          { id: "in_app", label: "Trong bài" },
          { id: "parent_guided", label: "Trong sinh hoạt" }
        ].map((item) => (
          <KidButton
            key={item.id ?? "all"}
            label={item.label}
            selected={context === item.id}
            variant="secondary"
            onPress={() => setContext(item.id)}
          />
        ))}
      </View>
      {history.isError ? (
        <KidButton
          label="Tải lại lịch sử"
          onPress={() => {
            void history.refetch();
          }}
        />
      ) : null}
      {history.isPending ? (
        <AppText>Đang đọc lịch sử…</AppText>
      ) : !rows.length ? (
        <AppText>Chưa có ghi nhận phù hợp trong các trang đã tải.</AppText>
      ) : null}
      {rows.map((row) => (
        <Card key={row.id} variant="form">
          <AppText variant="labelStrong">
            {goals.find((item) => row.goalId === `fixture_goal_${item.id}`)?.label ??
              "Mục tiêu đã lưu"}
          </AppText>
          <AppText>
            {
              {
                independent: "Con thực hiện độc lập",
                supported: "Con thực hiện khi có hỗ trợ",
                not_yet: "Con chưa thực hiện",
                not_observed: "Chưa có dịp quan sát"
              }[row.result]
            }
          </AppText>
          <AppText variant="caption">
            {row.context === "parent_guided" ? "Trong sinh hoạt / với đồ thật" : "Trong bài"} ·{" "}
            {new Date(row.occurredAt).toLocaleString("vi-VN")} · Mức gợi ý:{" "}
            {row.promptLevel ?? "không ghi"}
          </AppText>
        </Card>
      ))}
      {history.hasNextPage ? (
        <KidButton
          label="Xem ghi nhận trước đó"
          disabled={history.isFetchingNextPage}
          onPress={() => {
            void history.fetchNextPage();
          }}
        />
      ) : null}
    </View>
  );
}

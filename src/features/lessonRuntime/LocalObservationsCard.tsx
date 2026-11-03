import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createLocalApiClient } from "@/api/localClient";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { useAuth } from "@/features/auth/AuthProvider";
import { localFixtureEnabled } from "./fixtureBoundary";
import { flushOutbox } from "./flushOutbox";
import { useLessonRuntimeRepository } from "./LessonRuntimeProvider";

const labels = {
  independent: "Độc lập (+)",
  supported: "Có hỗ trợ (+/-)",
  not_yet: "Chưa thực hiện (-)",
  not_observed: "Không quan sát được"
};
const syncLabels = { synced: "Đã đồng bộ", pending: "Chờ đồng bộ", rejected: "Cần kiểm tra" };
export function LocalObservationsCard({ childId }: { childId: string }) {
  const { repository } = useLessonRuntimeRepository();
  const { session, accessTokenValid } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const history = useQuery({
    queryKey: ["lesson-runtime-history", session?.accountId, childId],
    enabled: localFixtureEnabled() && Boolean(repository),
    queryFn: () => repository!.history(childId)
  });
  if (!localFixtureEnabled()) return null;
  async function sync() {
    if (!repository || !session || !accessTokenValid || busy) return;
    setBusy(true);
    try {
      const client = createLocalApiClient(
        process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
        session.accessToken
      );
      // Revalidate selected-child ownership outside all learning activities.
      const children = await client.listChildren();
      if (!children.some((child) => child.id === childId)) throw new Error("CHILD_NOT_OWNED");
      const result = await flushOutbox(repository, childId, client);
      setMessage(
        result.rejected
          ? "Một số quan sát cần kiểm tra; dữ liệu vẫn được giữ."
          : result.remaining
            ? "Còn quan sát chờ gửi."
            : "Quan sát đã được đồng bộ."
      );
      await history.refetch();
    } catch {
      setMessage("Chưa gửi được. Quan sát vẫn được giữ trên thiết bị.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card padding="lg">
      <AppText variant="cardTitle">Quan sát đã lưu</AppText>
      <AppText color="muted" variant="caption">
        Những lần cùng con giao tiếp trong bài trải nghiệm. Chỉ để theo dõi và hiểu con hơn.
      </AppText>
      {history.isPending ? (
        <AppText>Đang đọc quan sát…</AppText>
      ) : history.isError ? (
        <AppText>Chưa đọc được quan sát đã lưu.</AppText>
      ) : !history.data?.length ? (
        <AppText>Chưa có quan sát bài thử.</AppText>
      ) : (
        history.data.map(({ event, syncState }) => (
          <AppText key={event.eventId}>
            {labels[event.payload.result]} ·{" "}
            {event.payload.context === "parent_guided" ? "Trong sinh hoạt" : "Trong bài"} ·{" "}
            {syncLabels[syncState]}
          </AppText>
        ))
      )}
      {message ? <AppText>{message}</AppText> : null}
      <KidButton
        label="Đồng bộ quan sát trên thiết bị"
        variant="plain"
        disabled={
          busy || !accessTokenValid || !history.data?.some((item) => item.syncState === "pending")
        }
        onPress={() => void sync()}
      />
    </Card>
  );
}

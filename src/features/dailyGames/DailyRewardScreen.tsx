import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Gift, Puzzle, Sticker } from "lucide-react-native";
import type { components } from "@/api/generated";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { GameControl } from "@/components/GameControl";
import { useAuth } from "@/features/auth/AuthProvider";
import { colors, radii } from "@/theme";
import { useDailyGameHub } from "./useDailyGameHub";
import { useDailyReward } from "./useDailyReward";
import { LocalDailyRewardArt, localRewardName } from "./LocalDailyRewardArt";
import { GameScreenHeader } from "./GameScreenHeader";
import { useGameNavigationLock } from "./useGameNavigationLock";
import { useRewardReturn } from "./useRewardReturn";

export function DailyRewardScreen() {
  const hub = useDailyGameHub();
  const { session, accessTokenValid } = useAuth();
  // Remount all presentation state when the identity or selected child changes.
  return (
    <RewardSession
      key={`${session?.accountId}:${hub.childId}:${hub.status?.sessionId}`}
      childId={hub.childId}
      sessionId={hub.status?.sessionId ?? undefined}
      accountId={session?.accountId}
      accessToken={accessTokenValid ? session?.accessToken : undefined}
      remaining={hub.inventory?.remaining}
      profileRequired={hub.inventory?.profileRequired}
      loading={hub.loading}
    />
  );
}

function RewardSession({
  childId,
  sessionId,
  accountId,
  accessToken,
  remaining,
  profileRequired,
  loading
}: {
  childId?: string;
  sessionId?: string;
  accountId?: string;
  accessToken?: string;
  remaining?: components["schemas"]["DailyRewardInventory"]["remaining"];
  profileRequired?: boolean;
  loading: boolean;
}) {
  const router = useRouter();
  useGameNavigationLock();
  const { state, pendingBox, busy, error, storageError, available, recover, claim, choose } =
    useDailyReward({ childId, sessionId, accountId, accessToken });
  useRewardReturn(state?.state === "claimed" ? state.receipt?.id : undefined);
  const giftName = state?.receipt
    ? localRewardName(state.receipt.catalogId, state.receipt.catalogVersion, state.receipt.itemId)
    : null;
  return (
    <Screen maxWidth={720} contentStyle={{ gap: 8, paddingTop: 4 }}>
      <GameScreenHeader title="Quà của con" onBack={() => router.replace("/games")} />
      <Card style={{ flex: 1, justifyContent: "center" }}>
        {state?.state === "claimed" ? (
          <>
            {giftName && state?.receipt ? (
              <View style={{ alignItems: "center" }}>
                <LocalDailyRewardArt itemId={state.receipt.itemId} size={192} />
              </View>
            ) : (
              <Gift size={144} color={colors.primary} />
            )}
            <AppText variant="cardTitle">Quà đã vào bộ sưu tập!</AppText>
            {giftName ? <AppText>{giftName}</AppText> : null}
          </>
        ) : state?.state === "expired" ? (
          <>
            <AppText variant="cardTitle">Hẹn con ở lượt chơi mới</AppText>
            <AppText>Quà chưa nhận của hôm trước đã khép lại.</AppText>
          </>
        ) : error || storageError ? (
          <>
            <AppText>Chưa mở được quà. Mình thử lại nhé.</AppText>
            <KidButton label="Thử lại" disabled={busy} onPress={recover} />
          </>
        ) : !state ? (
          <AppText>
            {loading || available ? "Đang mở góc quà…" : "Cùng chơi đủ ba trò để mở góc quà nhé."}
          </AppText>
        ) : state.state === "incomplete" ? (
          <AppText>Cùng chơi đủ ba trò trước nhé.</AppText>
        ) : state.state === "boxes" ? (
          <>
            <AppText variant="cardTitle">Con chọn một hộp nhé</AppText>
            <View style={styles.boxes}>
              {[0, 1, 2, 3].map((box) => (
                <GameControl
                  key={box}
                  style={styles.box}
                  accessibilityLabel={`Hộp quà ${box + 1}`}
                  accessibilityState={{ selected: pendingBox === box }}
                  disabled={busy || pendingBox !== null}
                  onPress={() => claim(box)}
                >
                  <Gift size={80} color={colors.primary} />
                  <AppText>{box + 1}</AppText>
                </GameControl>
              ))}
            </View>
            {pendingBox !== null ? (
              <KidButton
                label={busy ? "Đang mở quà…" : "Mở hộp đã chọn"}
                disabled={busy}
                onPress={() => claim(pendingBox)}
              />
            ) : null}
          </>
        ) : profileRequired ? (
          <>
            <AppText>Nhờ phụ huynh hoàn tất hồ sơ để nhận quà nhé.</AppText>
            <KidButton
              label="Nhờ phụ huynh"
              onPress={() => router.push("/parent-gate?destination=profiles")}
            />
          </>
        ) : (
          <>
            <AppText variant="cardTitle">Con thích quà nào?</AppText>
            <GameControl
              style={styles.kind}
              accessibilityLabel={`Sticker${remaining ? ` · còn ${remaining.sticker}` : ""}`}
              disabled={busy || !remaining || remaining.sticker === 0}
              onPress={() => choose("sticker")}
            >
              <Sticker size={80} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="cardTitle">Sticker</AppText>
                <AppText>{remaining ? `Còn ${remaining.sticker}` : "Đang cập nhật…"}</AppText>
              </View>
            </GameControl>
            <GameControl
              style={styles.kind}
              accessibilityLabel={`Mảnh ghép${remaining ? ` · còn ${remaining.puzzle_piece}` : ""}`}
              disabled={busy || !remaining || remaining.puzzle_piece === 0}
              onPress={() => choose("puzzle_piece")}
            >
              <Puzzle size={80} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="cardTitle">Mảnh ghép</AppText>
                <AppText>{remaining ? `Còn ${remaining.puzzle_piece}` : "Đang cập nhật…"}</AppText>
              </View>
            </GameControl>
            {remaining?.sticker === 0 && remaining.puzzle_piece === 0 ? (
              <AppText>Con đã có đủ quà trong bộ này rồi!</AppText>
            ) : null}
          </>
        )}
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  boxes: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  box: {
    width: "44%",
    aspectRatio: 1,
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt
  },
  kind: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    padding: 16,
    minHeight: 144,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border
  }
});

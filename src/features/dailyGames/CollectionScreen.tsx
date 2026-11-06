import { useCallback, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { ChildTabBar } from "@/components/ChildTabBar";
import { useLegacyCollection } from "./useLegacyCollection";
import { StickerAlbum } from "@/features/practice/StickerAlbum";
import { useDailyGameHub } from "./useDailyGameHub";
import { RewardArt } from "@/features/practice/RewardArt";
import { rewardName } from "@/features/practice/rewardCatalog";
import { LocalDailyPuzzle, localRewardName } from "./LocalDailyRewardArt";

export function CollectionScreen() {
  const hub = useDailyGameHub();
  const tablet = useWindowDimensions().width >= 700;
  const legacy = useLegacyCollection(hub.childId);
  const [kind, setKind] = useState<"sticker" | "puzzle_piece">("sticker");
  const localStickers =
    hub.inventory?.items.filter(
      (item) =>
        item.catalogId === "local_daily_rewards" &&
        item.catalogVersion === 1 &&
        /^local_sticker_(animals|heroes|princesses)_[1-6]$/.test(item.itemId)
    ) ?? [];
  const hasItems = Boolean(hub.inventory?.items.length || legacy.stickers.length);
  const localPieces =
    hub.inventory?.items
      .filter(
        (item) =>
          item.catalogId === "local_daily_rewards" &&
          item.catalogVersion === 1 &&
          /^local_piece_(garden|space)_[0-5]$/.test(item.itemId)
      )
      .map((item) => item.itemId) ?? [];
  const unknown =
    hub.inventory?.items.filter(
      (item) => !localRewardName(item.catalogId, item.catalogVersion, item.itemId)
    ).length ?? 0;
  const refresh = useRef(() => {
    legacy.refresh();
    hub.refresh();
  });
  refresh.current = () => {
    legacy.refresh();
    hub.refresh();
  };
  useFocusEffect(
    useCallback(() => {
      refresh.current();
    }, [])
  );
  return (
    <Screen bottomBar={<ChildTabBar active="collection" />}>
      <AppText variant="screenTitle">Bộ sưu tập của con</AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <KidButton
          label="Sticker"
          selected={kind === "sticker"}
          variant={kind === "sticker" ? "primary" : "plain"}
          onPress={() => setKind("sticker")}
        />
        <KidButton
          label="Tranh ghép"
          selected={kind === "puzzle_piece"}
          variant={kind === "puzzle_piece" ? "primary" : "plain"}
          onPress={() => setKind("puzzle_piece")}
        />
      </View>
      {hub.inventoryLoading ? <AppText>Đang mở bộ sưu tập…</AppText> : null}
      {hub.inventoryError || legacy.error ? (
        <Card>
          <AppText>Chưa cập nhật được bộ sưu tập. Quà đã lưu trên máy vẫn được giữ.</AppText>
          <KidButton label="Thử lại" onPress={() => refresh.current()} />
        </Card>
      ) : null}
      {kind === "sticker" && localStickers.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {localStickers.map((item) => (
            <Card
              key={item.id}
              style={{
                width: localStickers.length === 1 ? "100%" : tablet ? "31%" : "47%",
                alignItems: "center",
                justifyContent: "center"
              }}
              accessible
              accessibilityLabel={`Sticker ${rewardName(item.itemId.replace(/^local_/, ""))}`}
            >
              <RewardArt
                itemId={item.itemId.replace(/^local_/, "")}
                size={localStickers.length === 1 ? 192 : 112}
              />
              <AppText>{rewardName(item.itemId.replace(/^local_/, ""))}</AppText>
            </Card>
          ))}
        </View>
      ) : null}
      {!hasItems && !hub.inventoryLoading && !hub.inventoryError && !legacy.error ? (
        <Card>
          <AppText variant="cardTitle">Góc quà đang chờ con</AppText>
          <AppText>Những món quà nhận được sẽ xuất hiện ở đây.</AppText>
        </Card>
      ) : null}
      {hub.inventory?.remaining ? (
        <AppText>
          {kind === "sticker"
            ? `Còn ${hub.inventory.remaining.sticker} sticker`
            : `Còn ${hub.inventory.remaining.puzzle_piece} mảnh ghép`}{" "}
          để sưu tập.
        </AppText>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {kind === "puzzle_piece"
          ? (["garden", "space"] as const)
              .filter((puzzle) => localPieces.some((id) => id.startsWith(`local_piece_${puzzle}_`)))
              .map((puzzle) => (
                <Card key={puzzle} style={{ width: tablet ? "48%" : "100%" }}>
                  <LocalDailyPuzzle puzzle={puzzle} owned={localPieces} />
                </Card>
              ))
          : null}
      </View>
      {unknown ? (
        <AppText color="muted">{unknown} món quà đã lưu chưa tải được hình.</AppText>
      ) : null}
      <StickerAlbum collected={legacy.stickers} ownedOnly kind={kind} />
    </Screen>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from "react-native";
import { AppText } from "@/components/AppText";
import { KidButton } from "@/components/KidButton";
import { GameControl } from "@/components/GameControl";
import type { DailyGameCheckpointV1, DailyGamePlanV1 } from "@/content/contracts/dailyGame";
import type { PlayPiece, PlayPresentation } from "@/content/contracts/playPresentation";
import { WordMatchingBoard } from "@/features/practice/WordMatchingBoard";
import { WordSprite, Leaf } from "@/features/practice/WordGameArt";
import { orderRecognitionOptions } from "@/features/practice/activityMedia";
import { colors, radii } from "@/theme";
import { dailyGamePhase, type DailyGameAction } from "./sessionEngine";
import { memoryCardSize } from "./boardLayout";
import { ListenChoices } from "./ListenChoices";

export function DailyGameStage({
  plan,
  checkpoint,
  targets,
  paused,
  onAction,
  onListen,
  availableHeight
}: {
  plan: DailyGamePlanV1;
  checkpoint: DailyGameCheckpointV1;
  targets: Readonly<Record<string, PlayPiece>>;
  paused: boolean;
  onAction(action: DailyGameAction): void;
  onListen?(): void;
  availableHeight?: number;
}) {
  const phase = dailyGamePhase(plan, checkpoint);
  const window = useWindowDimensions();
  const [measuredWidth, setBoardWidth] = useState(0);
  const boardWidth = measuredWidth || Math.min(window.width - 60, 840);
  const height = availableHeight ?? window.height - 180;
  const boardHeight = Math.max(140, height - 100 * window.fontScale);
  const memoryLayout = memoryCardSize(boardWidth, boardHeight);
  const memoryTileWidth = memoryLayout.size;
  const verticalShadow = height >= 380;
  const shadowSize = Math.max(
    56,
    Math.floor(
      Math.min(
        180,
        (boardWidth - (verticalShadow ? 16 : 32)) / (verticalShadow ? 2 : 3),
        (height - 110 * window.fontScale) / (verticalShadow ? 3 : 2)
      )
    )
  );
  const listenColumns = height < 380 ? 3 : boardWidth < 500 ? 1 : 2;
  const listenSize = Math.max(
    56,
    Math.floor(
      Math.min(
        280,
        (boardWidth - (listenColumns - 1) * 8) / listenColumns,
        (boardHeight - (Math.ceil(3 / listenColumns) - 1) * 8) / Math.ceil(3 / listenColumns)
      )
    )
  );
  const listenWidth = listenColumns === 1 ? boardWidth : listenSize;
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const opened = checkpoint.memoryOpenCardIds.join("|");
  const [screenReader, setScreenReader] = useState(false);
  useEffect(() => {
    let alive = true;
    void Promise.resolve(AccessibilityInfo.isScreenReaderEnabled()).then((enabled) => {
      if (alive) setScreenReader(Boolean(enabled));
    });
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (paused || phase !== "memory" || !opened.includes("|")) return;
    const cardIds = opened.split("|");
    const timer = setTimeout(
      () => onActionRef.current({ type: "close_unmatched", cardIds }),
      screenReader ? 2400 : 600
    );
    return () => clearTimeout(timer);
  }, [opened, paused, phase, screenReader]);
  const measure = (event: { nativeEvent: { layout: { width: number } } }) =>
    setBoardWidth(event.nativeEvent.layout.width);
  const deck = useMemo(
    () =>
      orderRecognitionOptions(
        plan.memoryTargetIds.flatMap((targetId) =>
          ["a", "b"].map((side) => ({ id: `${targetId}:${side}`, targetId }))
        ),
        plan.contentVersion
      ),
    [plan]
  );
  if (phase === "shadow") {
    const round = plan.shadowScreens[checkpoint.shadowScreenIndex]!;
    const pieces = round.targetIds.map((id) => targets[id]!);
    const game: PlayPresentation = {
      schemaVersion: 1,
      kind: "pair",
      instruction: "Kéo hình vào bóng giống hình.",
      pieces,
      places: pieces.map((piece) => ({ ...piece, id: `slot_${piece.id}` })),
      matches: Object.fromEntries(pieces.map((piece) => [piece.id, `slot_${piece.id}`])),
      sequence: [],
      dialogue: []
    };
    return (
      <View style={styles.section} onLayout={measure}>
        <AppText variant="cardTitle">Tìm bóng của hình</AppText>
        <AppText color="muted">
          Màn {checkpoint.shadowScreenIndex + 1}/{plan.shadowScreens.length}
        </AppText>
        <WordMatchingBoard
          key={round.id}
          game={game}
          paused={paused}
          saving={false}
          tileSize={shadowSize}
          verticalColumns={verticalShadow}
          seed={`${plan.contentVersion}:${round.id}`}
          placed={checkpoint.placedTargetIds}
          onInput={(input) => {
            if (input.type === "place")
              onAction({
                type: "place_shadow",
                roundId: round.id,
                targetId: input.id,
                slotTargetId: input.place.replace(/^slot_/, "")
              });
          }}
        />
      </View>
    );
  }
  if (phase === "listen") {
    const round = plan.listenRounds[checkpoint.listenRoundIndex]!;
    const options = orderRecognitionOptions(
      round.optionTargetIds.map((id) => targets[id]!),
      round.id
    );
    return (
      <View style={styles.section} onLayout={measure}>
        <AppText variant="cardTitle">Nghe rồi chọn hình</AppText>
        <AppText color="muted">
          Lượt {checkpoint.listenRoundIndex + 1}/{plan.listenRounds.length}
        </AppText>
        {onListen ? (
          <KidButton label="Nghe lại" onPress={onListen} disabled={paused} />
        ) : (
          <AppText>Người lớn đọc: {targets[round.targetId]!.label}</AppText>
        )}
        <ListenChoices
          key={round.id}
          options={options}
          targetId={round.targetId}
          width={listenWidth}
          size={listenSize}
          disabled={paused}
          onChoose={(targetId) => onAction({ type: "choose_listen", roundId: round.id, targetId })}
        />
      </View>
    );
  }
  if (phase === "memory")
    return (
      <View style={styles.section} onLayout={measure}>
        <AppText variant="cardTitle">Lật thẻ tìm đôi</AppText>
        <AppText color="muted">Đã tìm {checkpoint.memoryMatchedTargetIds.length}/5 cặp</AppText>
        <View
          style={[
            styles.grid,
            {
              alignSelf: "center",
              width: memoryLayout.columns * memoryTileWidth + (memoryLayout.columns - 1) * 8
            }
          ]}
        >
          {deck.map((card, index) => {
            const matched = checkpoint.memoryMatchedTargetIds.includes(card.targetId);
            const visible = matched || checkpoint.memoryOpenCardIds.includes(card.id);
            const piece = targets[card.targetId]!;
            return (
              <GameControl
                key={card.id}
                preserveAppearance
                testID={`daily-card-${card.id}`}
                style={[
                  styles.tile,
                  { width: memoryTileWidth, height: memoryTileWidth, minHeight: 56 }
                ]}
                disabled={paused || matched || checkpoint.memoryOpenCardIds.length === 2}
                completed={matched}
                accessibilityState={{ selected: matched }}
                accessibilityLabel={
                  matched ? `Đã ghép ${piece.label}` : visible ? piece.label : `Thẻ úp ${index + 1}`
                }
                onPress={() => onAction({ type: "open_memory", cardId: card.id })}
              >
                {visible ? (
                  <WordSprite piece={piece} size={memoryTileWidth - 16} paused />
                ) : (
                  <Leaf size={memoryTileWidth * 0.48} color={colors.primary} />
                )}
                {matched ? (
                  <View style={styles.check}>
                    <AppText>✓</AppText>
                  </View>
                ) : null}
              </GameControl>
            );
          })}
        </View>
      </View>
    );
  return <AppText variant="cardTitle">Mình đã hoàn thành cả ba trò!</AppText>;
}
const styles = StyleSheet.create({
  section: { gap: 10 },
  check: { position: "absolute", top: 2, right: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  tile: {
    width: 80,
    minHeight: 88,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border
  }
});

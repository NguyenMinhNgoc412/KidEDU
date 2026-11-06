import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, View, StyleSheet } from "react-native";
import {
  Box,
  DoorOpen,
  Heart,
  House,
  Leaf,
  TreePine,
  UserRound,
  Waves,
  HelpCircle,
  ArrowRight,
  Check,
  MessageCircle
} from "lucide-react-native";
import type { PlayPiece, PlayPresentation } from "@/content/contracts/playPresentation";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { GameControl } from "@/components/GameControl";
import { colors, gameSizes, radii, spacing } from "@/theme";
import {
  initialPlayState,
  updatePlay,
  isPlaySolved,
  type PlayAction,
  type PlayState
} from "./playState";
import { useGameAutoAdvance } from "./useGameAutoAdvance";
import { orderRecognitionOptions } from "./activityMedia";
import { WordSprite } from "./WordGameArt";
import { DragPiece } from "./DragPiece";
import { useDropTargets } from "./useDropTargets";

export function Picture({ piece, small = false }: { piece: PlayPiece; small?: boolean }) {
  const size = small ? gameSizes.stickerImage : gameSizes.sprite;
  if (piece.picture.startsWith("item-")) return <WordSprite piece={piece} size={size} paused />;
  const icons = {
    "icon:box": Box,
    "icon:home": House,
    "icon:tree": TreePine,
    "icon:water": Waves,
    "icon:seed": Leaf,
    "icon:child": UserRound,
    "icon:heart": Heart,
    "icon:door": DoorOpen
  };
  const Icon = icons[piece.picture as keyof typeof icons] ?? Box;
  return (
    <View style={styles.picture}>
      <Icon size={small ? 32 : 48} color={colors.primary} />
    </View>
  );
}
export function PlayActivityStage({
  game,
  paused,
  seed,
  showModel,
  onSolved
}: {
  game: PlayPresentation;
  paused: boolean;
  seed: string;
  showModel: boolean;
  onSolved?: (state: PlayState) => void;
}) {
  const [state, setState] = useState(initialPlayState);
  const [hint, setHint] = useState(false);
  const [assistSource, setAssistSource] = useState<string | null>(null);
  const snapshot = useRef(state);
  snapshot.current = state;
  useEffect(() => {
    setState(initialPlayState());
    setHint(false);
    setAssistSource(null);
  }, [game, seed]);
  const pieces = useMemo(() => orderRecognitionOptions(game.pieces, seed), [game.pieces, seed]);
  function act(action: PlayAction) {
    if (paused) return false;
    const next = updatePlay(game, snapshot.current, action);
    if (next === snapshot.current) return false;
    snapshot.current = next;
    setState(next);
    return true;
  }
  const { targets, drop, assist } = useDropTargets(paused, (id, target) => {
    let accepted = false;
    if (game.kind === "pair" || game.kind === "sort")
      accepted = act({ type: "place", id, place: target });
    else if (game.kind === "sequence" || game.kind === "sentence") {
      if (
        target === `step_${snapshot.current.order.length}` &&
        game.sequence[snapshot.current.order.length] === id
      )
        accepted = act({ type: "append", id });
    } else if (game.kind === "turns") {
      if (id === "turn_ball" && target === game.pieces[(snapshot.current.turn + 1) % 2]!.id)
        accepted = act({ type: "turn" });
    } else if (game.kind === "scene") {
      const index = Number(id.replace("reply_", ""));
      if (target === "reply" && !snapshot.current.reply && /^reply_\d+$/.test(id))
        accepted = act({ type: "reply", index });
    }
    setHint(!accepted);
    if (accepted) {
      setAssistSource(null);
      AccessibilityInfo.announceForAccessibility("Đã vào đúng chỗ.");
    } else AccessibilityInfo.announceForAccessibility("Mình thử lại nhé.");
    return accepted;
  });
  useGameAutoAdvance(!!onSolved && isPlaySolved(game, state), paused, () => onSolved?.(state));
  useGameAutoAdvance(
    game.kind === "scene" && !!state.reply && state.scene < game.dialogue.length - 1,
    paused,
    () => act({ type: "scene_next" }),
    1400
  );
  function source(id: string, label: string, children: React.ReactNode) {
    return (
      <DragPiece
        key={id}
        id={id}
        label={label}
        testID={`play-drag-${id}`}
        disabled={paused}
        onDrop={drop}
        onAssist={() => {
          setAssistSource(id);
          AccessibilityInfo.announceForAccessibility(`Đã chọn ${label}. Kích hoạt ô đích.`);
        }}
      >
        <View style={styles.source}>{children}</View>
      </DragPiece>
    );
  }
  function zone(id: string, label: string, children: React.ReactNode, filled = false) {
    return (
      <View
        key={id}
        collapsable={false}
        ref={(view) => {
          targets.current[id] = view;
        }}
        testID={`play-place-${id}`}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Ô ${label}`}
        accessibilityState={{ disabled: paused, selected: filled }}
        accessibilityActions={[{ name: "activate", label: "Đặt hình bằng trình đọc màn hình" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "activate" && assistSource) assist(assistSource, id);
        }}
        style={[styles.zone, filled && styles.filled]}
      >
        {children}
      </View>
    );
  }
  const model = game.sequence.length
    ? game.sequence.map((id) => game.pieces.find((piece) => piece.id === id)!.label).join(" → ")
    : Object.entries(game.matches)
        .map(
          ([from, to]) =>
            `${game.pieces.find((piece) => piece.id === from)!.label} → ${game.places.find((place) => place.id === to)!.label}`
        )
        .join(" · ");
  return (
    <View style={styles.board} testID="play-drag-board">
      {game.kind === "pair" || game.kind === "sort" ? (
        <>
          <View style={styles.grid}>
            {game.places.map((place) => {
              const assigned = Object.entries(state.placed).filter(
                ([, target]) => target === place.id
              );
              return zone(
                place.id,
                place.label,
                <>
                  <Picture piece={place} />
                  {assigned.length ? (
                    <View style={styles.assigned}>
                      {assigned.map(([id]) => (
                        <View key={id} testID={`play-attached-${id}`}>
                          <Picture piece={game.pieces.find((piece) => piece.id === id)!} small />
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {assigned.length ? <Check size={18} color={colors.primary} /> : null}
                </>,
                assigned.length > 0
              );
            })}
          </View>
          <View style={styles.tray}>
            {pieces.map((piece) =>
              state.placed[piece.id] ? (
                <View key={piece.id} style={styles.source}>
                  <Check size={24} color={colors.primary} />
                </View>
              ) : (
                source(piece.id, piece.label, <Picture piece={piece} />)
              )
            )}
          </View>
        </>
      ) : null}
      {game.kind === "sequence" || game.kind === "sentence" ? (
        <>
          <View style={styles.grid}>
            {game.sequence.map((id, index) =>
              zone(
                `step_${index}`,
                `Vị trí ${index + 1}`,
                state.order[index] ? (
                  <View testID={`play-attached-${id}`}>
                    <Picture piece={game.pieces.find((piece) => piece.id === id)!} />
                  </View>
                ) : (
                  <>
                    <AppText color="muted">{index + 1}</AppText>
                    <ArrowRight size={32} color={colors.primary} />
                  </>
                ),
                !!state.order[index]
              )
            )}
          </View>
          <View style={styles.tray}>
            {pieces.map((piece) =>
              state.order.includes(piece.id) ? (
                <View key={piece.id} style={styles.source}>
                  <Check size={24} color={colors.primary} />
                </View>
              ) : (
                source(
                  piece.id,
                  piece.label,
                  <>
                    <Picture piece={piece} />
                    {game.kind === "sentence" ? (
                      <AppText variant="caption">{piece.label}</AppText>
                    ) : null}
                  </>
                )
              )
            )}
          </View>
        </>
      ) : null}
      {game.kind === "hunt" ? (
        <View style={styles.grid}>
          {pieces.map((piece, index) => (
            <GameControl
              key={piece.id}
              style={styles.zone}
              accessibilityLabel={
                state.revealed.includes(piece.id) ? `Hình ${piece.label}` : `Mở ô ${index + 1}`
              }
              disabled={paused}
              onPress={() => act({ type: "reveal", id: piece.id })}
            >
              {state.revealed.includes(piece.id) ? (
                <Picture piece={piece} />
              ) : (
                <HelpCircle size={48} color={colors.primary} />
              )}
            </GameControl>
          ))}
        </View>
      ) : null}
      {game.kind === "scene" ? (
        <>
          <AppText align="center">{game.dialogue[state.scene]!.line}</AppText>
          {zone(
            "reply",
            "Lời đáp",
            state.reply ? (
              <View testID="play-attached-reply">
                <Check size={40} color={colors.primary} />
              </View>
            ) : (
              <MessageCircle size={48} color={colors.primary} />
            ),
            !!state.reply
          )}
          {!state.reply ? (
            <View style={styles.tray}>
              {game.dialogue[state.scene]!.choices.map((choice, index) =>
                source(
                  `reply_${index}`,
                  choice.label,
                  <>
                    <Picture piece={game.pieces[index % game.pieces.length]!} />
                    <AppText variant="caption" align="center">
                      {choice.label}
                    </AppText>
                  </>
                )
              )}
            </View>
          ) : (
            <>
              <AppText align="center">{state.reply}</AppText>
            </>
          )}
        </>
      ) : null}
      {game.kind === "turns" ? (
        <View style={styles.grid}>
          {game.pieces.map((piece, index) =>
            zone(
              piece.id,
              piece.label,
              <>
                <Picture piece={piece} />
                {state.turn % 2 === index
                  ? source(
                      "turn_ball",
                      "Bóng",
                      <WordSprite
                        piece={{ id: "ball", label: "Bóng", picture: "item-bong" }}
                        paused
                        size={gameSizes.stickerImage}
                      />
                    )
                  : null}
              </>,
              state.turn % 2 === index
            )
          )}
        </View>
      ) : null}
      {hint ? (
        <View accessibilityLabel="Thử lại" style={styles.hint}>
          <ArrowRight size={24} color={colors.primary} />
        </View>
      ) : null}
      {showModel && model ? (
        <Card variant="subtle">
          <AppText variant="labelStrong">Mẫu để phụ huynh hỗ trợ</AppText>
          <AppText>{model}</AppText>
        </Card>
      ) : null}
      <KidButton
        label="Sắp lại để chơi"
        variant="plain"
        disabled={paused}
        onPress={() => act({ type: "reset" })}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  board: { width: "100%", gap: spacing[16] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[8], justifyContent: "center" },
  tray: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing[8]
  },
  zone: {
    minWidth: gameSizes.slot,
    minHeight: gameSizes.slot,
    borderRadius: radii.lg,
    padding: spacing[8],
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.primarySoft,
    backgroundColor: colors.surfaceAlt
  },
  filled: { borderColor: colors.primary, borderStyle: "solid" },
  source: {
    width: gameSizes.source,
    minHeight: gameSizes.source,
    alignItems: "center",
    justifyContent: "center"
  },
  assigned: { flexDirection: "row", flexWrap: "wrap", gap: spacing[4], maxWidth: gameSizes.slot },
  picture: {
    width: gameSizes.sprite,
    height: gameSizes.sprite,
    alignItems: "center",
    justifyContent: "center"
  },
  next: {
    alignSelf: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    width: gameSizes.primaryControl,
    height: gameSizes.primaryControl,
    alignItems: "center",
    justifyContent: "center"
  },
  hint: { alignItems: "center" }
});

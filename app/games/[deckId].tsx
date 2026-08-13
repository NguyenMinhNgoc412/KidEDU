import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  Animated,
  AppState,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions
} from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { bundledCelebrationSoundModule } from "@/data/defaultMediaRegistry";
import { useDeckDetailQuery } from "@/data/queries";
import type { LearningItem } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { useDisplayMediaUri } from "@/features/media/useDisplayMediaUri";
import {
  createMemoryCards,
  createMemoryLevels,
  createPuzzleRounds,
  getPuzzleTemplate,
  isPuzzleDropInsideTarget
} from "@/features/review/miniGames";
import { useMiniGameSession } from "@/features/review/useMiniGameSession";
import { colors, radii, spacing } from "@/theme";

type GameMode = "menu" | "puzzle" | "memory";

interface Point {
  x: number;
  y: number;
}

// Expo resolves bundled bitmap assets through `require` at build time.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const kidEduLogo = require("../../assets/icon.png");
const puzzleBoardBorderWidth = 2;

export default function GamesScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const query = useDeckDetailQuery(deckId);
  const [mode, setMode] = useState<GameMode>("menu");
  const items = query.data?.items ?? [];
  const canPlayPuzzle = createPuzzleRounds(items).length > 0;
  const canPlayMemory = createMemoryLevels(items).length > 0;

  if (query.isLoading) {
    return (
      <Screen>
        <StateMessage title="Đang chuẩn bị trò chơi" />
      </Screen>
    );
  }

  if (!query.data) {
    return (
      <Screen>
        <StateMessage title="Không tìm thấy bộ học" />
      </Screen>
    );
  }

  if (mode === "puzzle") {
    return <PuzzleGame deckId={deckId} items={items} onBack={() => setMode("menu")} />;
  }

  if (mode === "memory") {
    return <MemoryGame deckId={deckId} items={items} onBack={() => setMode("menu")} />;
  }

  return (
    <Screen>
      <View style={styles.stack}>
        <AppText align="center" variant="screenTitle">
          Trò chơi
        </AppText>
        <AppText align="center" color="muted" variant="body">
          Chọn một trò chơi với hình trong bộ {query.data.title}.
        </AppText>
        <KidButton
          disabled={!canPlayPuzzle}
          label="Ghép hình"
          onPress={() => setMode("puzzle")}
          size="lg"
        />
        {!canPlayPuzzle ? (
          <AppText align="center" color="muted" variant="label">
            Cần ít nhất một hình minh họa để ghép hình.
          </AppText>
        ) : null}
        <KidButton
          disabled={!canPlayMemory}
          label="Lật thẻ"
          onPress={() => setMode("memory")}
          size="lg"
          variant="secondary"
        />
        {!canPlayMemory ? (
          <AppText align="center" color="muted" variant="label">
            Cần ít nhất hai hình minh họa để lật thẻ.
          </AppText>
        ) : null}
        <KidButton label="Học bộ tiếp" onPress={() => router.replace("/decks")} variant="plain" />
      </View>
    </Screen>
  );
}

function PuzzleGame({
  deckId,
  items,
  onBack
}: {
  deckId: string;
  items: LearningItem[];
  onBack: () => void;
}) {
  const router = useRouter();
  const [previousItemIds, setPreviousItemIds] = useState<string[]>([]);
  const [roundKey, setRoundKey] = useState(0);
  const rounds = useMemo(
    () => createPuzzleRounds(items, previousItemIds),
    [items, previousItemIds, roundKey]
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const { complete: completeSession, restart: restartSession } = useMiniGameSession(
    "puzzle_game",
    deckId
  );
  const round = rounds[roundIndex];
  const item = round?.item;

  const completeRound = useCallback(() => {
    setRoundComplete(true);
    if (roundIndex + 1 === rounds.length) {
      completeSession();
    }
  }, [completeSession, roundIndex, rounds.length]);

  const restart = useCallback(() => {
    setPreviousItemIds(rounds.map(({ item: previousItem }) => previousItem.id));
    setRoundKey((current) => current + 1);
    setRoundIndex(0);
    setRoundComplete(false);
    restartSession();
  }, [restartSession, rounds]);

  if (rounds.length === 0) {
    return (
      <Screen>
        <StateMessage
          title="Chưa đủ ảnh để ghép hình"
          message="Bộ học cần ít nhất một hình minh họa hợp lệ."
        />
        <KidButton label="Quay lại" onPress={onBack} variant="plain" />
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen>
        <View style={styles.completedPanel}>
          <AppText align="center" color="primary" variant="sectionTitle">
            Đang chuẩn bị hình ghép
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <PuzzleRound
      key={`${roundKey}:${item.id}`}
      current={roundIndex + 1}
      item={item}
      pieceCount={round.pieceCount}
      onBack={onBack}
      onComplete={completeRound}
      onContinue={() => {
        setRoundIndex((current) => current + 1);
        setRoundComplete(false);
      }}
      onRestart={restart}
      onStudy={() => router.replace("/decks")}
      roundComplete={roundComplete}
      total={rounds.length}
    />
  );
}

function PuzzleRound({
  current,
  item,
  pieceCount,
  onBack,
  onComplete,
  onContinue,
  onRestart,
  onStudy,
  roundComplete,
  total
}: {
  current: number;
  item: LearningItem;
  pieceCount: 2 | 3 | 4;
  onBack: () => void;
  onComplete: () => void;
  onContinue: () => void;
  onRestart: () => void;
  onStudy: () => void;
  roundComplete: boolean;
  total: number;
}) {
  const { height, width } = useWindowDimensions();
  const illustration = resolveLearningItemMedia(item).byRole.illustration;
  const template = getPuzzleTemplate(pieceCount, illustration?.puzzleTemplateKey);
  const boardSize = Math.max(144, Math.min(width - spacing[48], (height - 320) / 2, 300));
  const boardContentSize = boardSize - puzzleBoardBorderWidth * 2;
  const pieceWidth = boardContentSize / template.columns;
  const pieceHeight = boardContentSize / template.rows;
  const uri = useDisplayMediaUri(illustration?.asset.uri ?? null);
  const boardRef = useRef<View | null>(null);
  const boardOrigin = useRef<Point | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const isComplete = placed.length === template.pieceCount;

  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((x, y) => {
      boardOrigin.current = {
        x: x + puzzleBoardBorderWidth,
        y: y + puzzleBoardBorderWidth
      };
    });
  }, []);

  useEffect(() => {
    if (isComplete && !roundComplete) {
      onComplete();
    }
  }, [isComplete, onComplete, roundComplete]);

  if (!uri) {
    return (
      <Screen>
        <StateMessage title="Đang chuẩn bị hình ghép" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.stack}>
        <View style={styles.gameHeader}>
          <KidButton label="Quay lại" onPress={onBack} variant="plain" />
          <AppText color="muted" variant="labelStrong">
            Màn {current}/{total}
          </AppText>
        </View>
        <AppText align="center" variant="sectionTitle">
          Ghép hình
        </AppText>
        <AppText align="center" color="muted" variant="label">
          Kéo từng mảnh vào khung. Đặt chưa đúng thì mảnh sẽ quay lại.
        </AppText>

        <Animated.View
          ref={boardRef}
          onLayout={measureBoard}
          style={[
            styles.puzzleBoard,
            { height: boardSize, width: boardSize },
            isComplete ? styles.puzzleRaised : null
          ]}
        >
          {Array.from({ length: template.pieceCount }, (_, pieceIndex) => (
            <View
              key={pieceIndex}
              style={[styles.puzzleSlot, { height: pieceHeight, width: pieceWidth }]}
            >
              {placed.includes(pieceIndex) ? (
                <CroppedIllustration
                  pieceHeight={pieceHeight}
                  pieceIndex={pieceIndex}
                  pieceWidth={pieceWidth}
                  template={template}
                  uri={uri}
                />
              ) : null}
            </View>
          ))}
        </Animated.View>

        {!isComplete ? (
          <View style={[styles.pieceTray, { width: boardSize }]}>
            {Array.from(
              { length: template.pieceCount },
              (_, index) => template.pieceCount - 1 - index
            ).map((pieceIndex) =>
              placed.includes(pieceIndex) ? (
                <View key={pieceIndex} style={{ height: pieceHeight, width: pieceWidth }} />
              ) : (
                <DraggablePuzzlePiece
                  key={pieceIndex}
                  boardOrigin={boardOrigin}
                  measureBoard={measureBoard}
                  onPlaced={() => setPlaced((currentPlaced) => [...currentPlaced, pieceIndex])}
                  pieceIndex={pieceIndex}
                  pieceHeight={pieceHeight}
                  pieceWidth={pieceWidth}
                  template={template}
                  uri={uri}
                />
              )
            )}
          </View>
        ) : (
          <View style={styles.puzzleActions}>
            <AppText align="center" color="primary" variant="sectionTitle">
              Hoàn thành!
            </AppText>
            <KidButton
              label={current < total ? "Tiếp tục" : "Chơi lại"}
              onPress={current < total ? onContinue : onRestart}
            />
            <KidButton label="Học tiếp" onPress={onStudy} variant="plain" />
          </View>
        )}
      </View>
    </Screen>
  );
}

function DraggablePuzzlePiece({
  boardOrigin,
  measureBoard,
  onPlaced,
  pieceIndex,
  pieceHeight,
  pieceWidth,
  template,
  uri
}: {
  boardOrigin: MutableRefObject<Point | null>;
  measureBoard: () => void;
  onPlaced: () => void;
  pieceIndex: number;
  pieceHeight: number;
  pieceWidth: number;
  template: ReturnType<typeof getPuzzleTemplate>;
  uri: string;
}) {
  const translation = useRef(new Animated.ValueXY()).current;
  const reset = useCallback(() => {
    Animated.spring(translation, {
      friction: 7,
      tension: 70,
      toValue: { x: 0, y: 0 },
      useNativeDriver: true
    }).start();
  }, [translation]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          measureBoard();
          translation.stopAnimation();
          translation.extractOffset();
        },
        onPanResponderMove: Animated.event([null, { dx: translation.x, dy: translation.y }], {
          useNativeDriver: false
        }),
        onPanResponderRelease: (_, gesture) => {
          translation.flattenOffset();
          if (!boardOrigin.current) {
            reset();
            return;
          }

          const isInsideTarget = isPuzzleDropInsideTarget(
            { x: gesture.moveX, y: gesture.moveY },
            boardOrigin.current,
            pieceIndex,
            pieceWidth,
            pieceHeight,
            template
          );

          if (isInsideTarget) {
            onPlaced();
          } else {
            reset();
          }
        },
        onPanResponderTerminate: reset,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true
      }),
    [
      boardOrigin,
      measureBoard,
      onPlaced,
      pieceHeight,
      pieceIndex,
      pieceWidth,
      reset,
      template,
      translation
    ]
  );

  return (
    <Animated.View
      accessibilityHint="Kéo mảnh này vào vùng phù hợp trong khung"
      accessibilityLabel="Mảnh ghép"
      style={[
        styles.draggablePiece,
        {
          height: pieceHeight,
          transform: translation.getTranslateTransform(),
          width: pieceWidth
        }
      ]}
      {...responder.panHandlers}
    >
      <CroppedIllustration
        pieceHeight={pieceHeight}
        pieceIndex={pieceIndex}
        pieceWidth={pieceWidth}
        template={template}
        uri={uri}
      />
    </Animated.View>
  );
}

function CroppedIllustration({
  pieceIndex,
  pieceHeight,
  pieceWidth,
  template,
  uri
}: {
  pieceIndex: number;
  pieceHeight: number;
  pieceWidth: number;
  template: ReturnType<typeof getPuzzleTemplate>;
  uri: string;
}) {
  const column = pieceIndex % template.columns;
  const row = Math.floor(pieceIndex / template.columns);

  return (
    <View style={[styles.cropFrame, { height: pieceHeight, width: pieceWidth }]}>
      <Image
        contentFit="fill"
        source={{ uri }}
        style={{
          height: pieceHeight * template.rows,
          left: -column * pieceWidth,
          position: "absolute",
          top: -row * pieceHeight,
          width: pieceWidth * template.columns
        }}
      />
    </View>
  );
}

function MemoryGame({
  deckId,
  items,
  onBack
}: {
  deckId: string;
  items: LearningItem[];
  onBack: () => void;
}) {
  const router = useRouter();
  const levels = useMemo(() => createMemoryLevels(items), [items]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [roundKey, setRoundKey] = useState(0);
  const pairCount = levels[levelIndex] ?? 2;
  const cards = useMemo(() => createMemoryCards(items, pairCount), [items, pairCount, roundKey]);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [completionState, setCompletionState] = useState<"playing" | "finished">("playing");
  const [celebrationPhase, setCelebrationPhase] = useState<
    "pair" | "last_pair" | "completion" | null
  >(null);
  const mismatchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationStartedRef = useRef(false);
  const { complete: completeSession, restart: restartSession } = useMiniGameSession(
    "memory_game",
    deckId
  );
  const celebrationPlayer = useAudioPlayer(bundledCelebrationSoundModule, { updateInterval: 500 });
  const celebrationStatus = useAudioPlayerStatus(celebrationPlayer);
  const complete = completionState === "finished";

  const playCelebration = useCallback((phase: Exclude<typeof celebrationPhase, null>) => {
    celebrationStartedRef.current = false;
    setCelebrationPhase(phase);
    celebrationPlayer.volume = 0.35;
    celebrationPlayer.pause();
    void celebrationPlayer
      .seekTo(0)
      .catch(() => undefined)
      .finally(() => celebrationPlayer.play());
  }, [celebrationPlayer]);

  const cancelPendingInteraction = useCallback(() => {
    if (mismatchTimeout.current) {
      clearTimeout(mismatchTimeout.current);
      mismatchTimeout.current = null;
    }
    celebrationStartedRef.current = false;
    celebrationPlayer.pause();
    setCelebrationPhase(null);
    setOpenIds([]);
    setIsResolving(false);
  }, [celebrationPlayer]);

  const resetLevel = useCallback(
    (nextLevelIndex: number, startNewSession = false) => {
      cancelPendingInteraction();
      void celebrationPlayer.seekTo(0).catch(() => undefined);
      setLevelIndex(nextLevelIndex);
      setRoundKey((current) => current + 1);
      setOpenIds([]);
      setMatchedIds([]);
      setIsResolving(false);
      setCompletionState("playing");
      if (startNewSession) {
        restartSession();
      }
    },
    [cancelPendingInteraction, celebrationPlayer, restartSession]
  );

  useEffect(() => {
    return () => {
      cancelPendingInteraction();
    };
  }, [cancelPendingInteraction]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        cancelPendingInteraction();
      }
    });

    return () => subscription.remove();
  }, [cancelPendingInteraction]);

  useEffect(() => {
    if (!celebrationPhase) {
      return;
    }

    if (celebrationStatus.playing) {
      celebrationStartedRef.current = true;
    }

    if (!celebrationStatus.didJustFinish || !celebrationStartedRef.current) {
      return;
    }

    celebrationStartedRef.current = false;
    if (celebrationPhase === "last_pair") {
      playCelebration("completion");
      return;
    }

    setCelebrationPhase(null);
    setIsResolving(false);
    if (celebrationPhase === "completion") {
      completeSession();
      setCompletionState("finished");
    }
  }, [celebrationPhase, celebrationStatus.didJustFinish, celebrationStatus.playing, completeSession, playCelebration]);

  function flipCard(cardId: string) {
    if (
      isResolving ||
      complete ||
      openIds.includes(cardId) ||
      matchedIds.includes(cardId) ||
      openIds.length === 2
    ) {
      return;
    }

    const nextOpen = [...openIds, cardId];
    setOpenIds(nextOpen);
    if (nextOpen.length !== 2) {
      return;
    }

    const first = cards.find((card) => card.id === nextOpen[0]);
    const second = cards.find((card) => card.id === nextOpen[1]);
    if (first?.item.id === second?.item.id) {
      const isLastPair = matchedIds.length + nextOpen.length === cards.length;
      setIsResolving(true);
      setMatchedIds((current) => [...current, ...nextOpen]);
      setOpenIds([]);
      playCelebration(isLastPair ? "last_pair" : "pair");
      return;
    }

    setIsResolving(true);
    mismatchTimeout.current = setTimeout(() => {
      setOpenIds([]);
      setIsResolving(false);
      mismatchTimeout.current = null;
    }, 700);
  }

  if (levels.length === 0) {
    return (
      <Screen>
        <StateMessage
          title="Chưa đủ ảnh để lật thẻ"
          message="Bộ học cần ít nhất hai hình minh họa hợp lệ."
        />
        <KidButton label="Quay lại" onPress={onBack} variant="plain" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.gameHeader}>
          <KidButton label="Quay lại" onPress={onBack} variant="plain" />
          <AppText variant="sectionTitle">Lật thẻ {pairCount} cặp</AppText>
        </View>
        <View style={styles.memoryGrid}>
          {cards.map((card) => (
            <MemoryCard
              key={card.id}
              item={card.item}
              isFaceUp={openIds.includes(card.id) || matchedIds.includes(card.id)}
              isMatched={matchedIds.includes(card.id)}
              onPress={() => flipCard(card.id)}
            />
          ))}
        </View>
        {complete ? (
          <Card style={styles.successCard} variant="subtle">
            <AppText align="center" color="primary" variant="sectionTitle">
              Con giỏi lắm!
            </AppText>
            <KidButton
              label={levelIndex + 1 < levels.length ? "Tiếp tục" : "Chơi lại"}
              onPress={() =>
                levelIndex + 1 < levels.length ? resetLevel(levelIndex + 1) : resetLevel(0, true)
              }
            />
            <KidButton label="Học tiếp" onPress={() => router.replace("/decks")} variant="plain" />
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

function MemoryCard({
  isFaceUp,
  isMatched,
  item,
  onPress
}: {
  isFaceUp: boolean;
  isMatched: boolean;
  item: LearningItem;
  onPress: () => void;
}) {
  const illustration = resolveLearningItemMedia(item).byRole.illustration;
  const uri = useDisplayMediaUri(illustration?.asset.uri ?? null);

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isMatched) {
      scale.setValue(1);
      opacity.setValue(1);
      setHidden(false);
      return;
    }

    Animated.parallel([
      Animated.timing(scale, { duration: 220, toValue: 0.65, useNativeDriver: true }),
      Animated.timing(opacity, { duration: 220, toValue: 0, useNativeDriver: true })
    ]).start(({ finished }) => {
      if (finished) {
        setHidden(true);
      }
    });
  }, [isMatched, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.memoryCardWrapper,
        hidden ? styles.memoryCardHidden : null,
        { opacity, transform: [{ scale }] }
      ]}
    >
      <Pressable
        accessibilityLabel={isFaceUp ? `Thẻ ${item.title}` : "Thẻ đang úp"}
        accessibilityRole="button"
        disabled={isFaceUp}
        onPress={onPress}
        style={({ pressed }) => [
          styles.memoryCard,
          isFaceUp ? styles.memoryCardOpen : null,
          pressed ? styles.pressed : null
        ]}
      >
        {isFaceUp && uri ? (
          <Image contentFit="cover" source={{ uri }} style={styles.memoryImage} />
        ) : (
          <Image contentFit="contain" source={kidEduLogo} style={styles.memoryLogo} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing[16]
  },
  completedPanel: {
    gap: spacing[18],
    justifyContent: "center",
    minHeight: 360
  },
  gameHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  puzzleBoard: {
    alignSelf: "center",
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    borderWidth: puzzleBoardBorderWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden"
  },
  puzzleRaised: {
    shadowColor: colors.primary,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    transform: [{ scale: 1.04 }]
  },
  puzzleSlot: {
    alignItems: "center",
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden"
  },
  pieceTray: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap"
  },
  puzzleActions: {
    gap: spacing[12]
  },
  draggablePiece: {
    borderColor: colors.surfaceLowest,
    borderRadius: radii.md,
    borderWidth: 3,
    elevation: 4,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    zIndex: 10
  },
  cropFrame: {
    overflow: "hidden"
  },
  pieceNumber: {
    alignItems: "center",
    backgroundColor: colors.mediaOverlayStrong,
    borderRadius: radii.full,
    height: 32,
    justifyContent: "center",
    left: spacing[8],
    position: "absolute",
    top: spacing[8],
    width: 32
  },
  memoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
    justifyContent: "center"
  },
  memoryCardWrapper: {
    height: 96,
    width: 96
  },
  memoryCardHidden: {
    display: "none"
  },
  memoryCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.primary,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 96,
    justifyContent: "center",
    overflow: "hidden",
    width: 96
  },
  memoryCardOpen: {
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.coral
  },
  memoryImage: {
    height: "100%",
    width: "100%"
  },
  memoryLogo: {
    height: 116,
    width: 116
  },
  successCard: {
    gap: spacing[12],
    padding: spacing[16]
  },
  pressed: {
    opacity: 0.82
  }
});

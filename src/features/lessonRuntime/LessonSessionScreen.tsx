import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Check, Leaf, Pause, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { GameControl } from "@/components/GameControl";
import { Screen } from "@/components/Screen";
import { illustrationAnimations } from "@/data/illustrationAnimations";
import { SemanticIllustration } from "@/features/learning/SemanticIllustration";
import { useParentGateStore } from "@/features/parent/parentGate";
import { useParentHold } from "@/features/parent/useParentHold";
import { colors, gameSizes, radii } from "@/theme";
import { useLessonSession } from "./useLessonSession";
import { localFixtureEnabled } from "./fixtureBoundary";
import {
  hasAssistance,
  sessionActivity,
  sessionActivityIndex,
  type ObservationResult
} from "./sessionEngine";
import { findSampleLesson, learningGoals, sampleLessons } from "./lessonCatalog";
import { lessonGuidance, promptLabels } from "./lessonGuidance";
import { GuidedActivityStage } from "@/features/practice/GuidedActivityStage";
import { MediaActivityStage } from "@/features/practice/MediaActivityStage";
import { PlayActivityStage } from "@/features/practice/PlayActivityStage";
import { GameRewardPanel } from "@/features/practice/GameRewardPanel";
import { TodayWordGames } from "@/features/practice/TodayWordGames";
import { emptyWordGameProgress } from "@/content/contracts/wordGameProgress";
import { wordGameSteps } from "@/features/practice/wordGameSteps";

const outcomes: { value: ObservationResult; title: string; detail: string }[] = [
  {
    value: "independent",
    title: "Con tự thực hiện",
    detail: "Sau cơ hội tự nhiên, không cần lời gợi ý."
  },
  {
    value: "supported",
    title: "Con thực hiện khi có hỗ trợ",
    detail: "Sau lời gợi ý hoặc một lần làm mẫu."
  },
  {
    value: "not_yet",
    title: "Con chưa thực hiện",
    detail: "Đã có cơ hội, con chưa đáp lại lần này."
  },
  {
    value: "not_observed",
    title: "Chưa có dịp quan sát",
    detail: "Để một lúc khác, khi con sẵn sàng."
  }
];
const completeIllustration = () => {};

export function LessonSessionScreen() {
  const { childId, lessonId, mode } = useLocalSearchParams<{
    childId?: string;
    lessonId?: string;
    mode?: string;
  }>();
  const practiceMode = mode === "practice";
  const runtime = useLessonSession(
    typeof childId === "string" ? childId : undefined,
    practiceMode && typeof lessonId === "string" ? lessonId : undefined
  );
  const parentUnlocked = useParentGateStore((state) => state.isUnlocked);
  const [handoffAuthorized, setHandoffAuthorized] = useState(false);
  const [result, setResult] = useState<ObservationResult | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [artworkError, setArtworkError] = useState(false);
  const [dismissedGameGuides, setDismissedGameGuides] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const hold = useParentHold(() => {
    useParentGateStore.getState().unlock();
    setHandoffAuthorized(true);
  });
  useEffect(() => {
    if (!runtime.session?.course || runtime.session.course.reviewIndex === 0)
      setHandoffAuthorized(false);
    setResult(null);
    setMediaError(false);
    setArtworkError(false);
  }, [runtime.session?.index, runtime.session?.course?.reviewIndex]);
  const router = useRouter();
  if (!localFixtureEnabled()) return <Redirect href="/" />;
  const session = runtime.session;
  const unitIndex = session ? sessionActivityIndex(session) : 0;
  const lesson =
    findSampleLesson(session?.course?.lessonIds[unitIndex] ?? session?.prepared.lesson.id ?? "") ??
    sampleLessons[0];
  const activity = session ? sessionActivity(session) : undefined;
  const phase = session?.phase;
  const active = phase === "presenting" || phase === "waiting";
  const interactiveGame = active && !!activity?.presentation;
  const childGame = active && !!activity?.presentation?.wordGames;
  const authorized = parentUnlocked && handoffAuthorized;
  const transfer = activity?.type === "parent_transfer";
  const guidance = activity ? lessonGuidance(activity) : null;
  const home = async () => {
    if (await runtime.leave()) router.replace(practiceMode ? "/practice" : "/");
  };
  const footer =
    phase === "overview"
      ? {
          label: "Bắt đầu cùng con",
          action: () => runtime.apply({ type: "start" }),
          disabled: false
        }
      : phase === "paused"
        ? {
            label: "Tiếp tục bài đã lưu",
            action: () => {
              setArtworkError(false);
              return runtime.apply({ type: "resume" });
            },
            disabled: false
          }
        : phase === "presenting"
          ? {
              label: activity?.presentation?.wordGames
                ? "Hoàn tất bài · Tiếp tục phiên"
                : transfer
                  ? "Bắt đầu quan sát"
                  : "Đã tạo cơ hội, chờ con",
              action: () =>
                runtime.apply({
                  type: activity?.presentation?.wordGames ? "finish_games" : "begin_wait"
                }),
              disabled:
                mediaError ||
                (!!activity?.presentation?.wordGames &&
                  ((session?.gameRounds?.[activity.id] ?? 0) < wordGameSteps.length ||
                    !session?.gameStickers?.[activity.id]))
            }
          : phase === "waiting"
            ? {
                label:
                  session!.waitRemainingMs > 0
                    ? "Dành một chút thời gian cho con…"
                    : session?.course
                      ? session.index === session.course.lessonIds.length - 1
                        ? "Học xong · Nhận xét cuối phiên"
                        : "Sang bài tiếp theo"
                      : "Mời phụ huynh ghi nhận",
                action: () => runtime.apply({ type: "observe" }),
                disabled: session!.waitRemainingMs > 0
              }
            : phase === "observation" && authorized
              ? {
                  label:
                    session?.course &&
                    session.course.reviewIndex === session.course.lessonIds.length - 1
                      ? "Lưu nhận xét · Hoàn tất phiên"
                      : session?.course
                        ? "Lưu nhận xét · Bài tiếp theo"
                        : "Lưu và tiếp tục",
                  action: () => (result ? runtime.observe(result) : Promise.resolve()),
                  disabled: !result
                }
              : phase === "finished"
                ? {
                    label: practiceMode ? "Về cùng luyện" : "Về bài hôm nay",
                    action: home,
                    disabled: false
                  }
                : null;
  return (
    <Screen
      bottomBar={
        footer && !interactiveGame ? (
          <SafeAreaView edges={["bottom"]} style={styles.footer}>
            <View style={styles.footerInner}>
              {childGame ? (
                <GameControl
                  accessibilityRole="button"
                  accessibilityLabel={footer.label}
                  disabled={runtime.busy || footer.disabled}
                  onPress={() => void footer.action()}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radii.full,
                      width: gameSizes.primaryControl,
                      height: gameSizes.primaryControl,
                      alignSelf: "center"
                    }
                  ]}
                >
                  <ArrowRight size={32} color={colors.onPrimary} />
                </GameControl>
              ) : (
                <KidButton
                  fullWidth
                  size="lg"
                  label={footer.label}
                  disabled={runtime.busy || footer.disabled}
                  onPress={() => void footer.action()}
                />
              )}
            </View>
          </SafeAreaView>
        ) : undefined
      }
    >
      <View style={styles.topbar}>
        <Pressable
          onPress={() => void home()}
          disabled={runtime.busy}
          accessibilityState={{ disabled: runtime.busy }}
          accessibilityRole="button"
          accessibilityLabel={
            practiceMode ? "Về cùng luyện, giữ buổi đã lưu" : "Về học, giữ bài đã lưu"
          }
          style={styles.iconButton}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.heading}>
          <AppText variant="labelStrong" align="center">
            {practiceMode ? "Buổi cùng luyện" : "Bài hôm nay"}
          </AppText>
          {!childGame ? (
            <AppText variant="caption" color="muted" align="center">
              Cùng con, từng bước nhỏ
            </AppText>
          ) : null}
        </View>
        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tạm dừng bài"
            onPress={() => void runtime.apply({ type: "pause" })}
            disabled={runtime.busy}
            style={styles.iconButton}
          >
            <Pause size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>
      {session?.course && !childGame ? (
        <Card variant="subtle">
          <AppText variant="labelStrong">
            {phase === "observation" ||
            (phase === "paused" && session.resumePhase === "observation")
              ? `Phụ huynh nhận xét · ${session.course.reviewIndex + 1}/${session.course.lessonIds.length}`
              : phase === "finished"
                ? `Đã nhận xét ${session.course.reviewIndex}/${session.course.lessonIds.length} bài`
                : `Phần học · Bài ${session.index + 1}/${session.course.lessonIds.length}`}
          </AppText>
          <AppText variant="caption">
            Học các bài liên tiếp → Phụ huynh nhận xét từng bài cuối phiên
          </AppText>
        </Card>
      ) : session && !childGame ? (
        <View style={styles.steps}>
          {session.prepared.activities.map((step, index) => (
            <View key={step.id} style={styles.step}>
              <View style={[styles.stepLine, index <= session.index && styles.stepCurrent]} />
              <AppText variant="caption" color={index === session.index ? "primary" : "muted"}>
                {index + 1}. {lessonGuidance(step).label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {runtime.error ? (
        <Card>
          <AppText>{runtime.error}</AppText>
        </Card>
      ) : null}
      {!session && !runtime.error ? (
        <AppText align="center">Đang chuẩn bị bài cho con…</AppText>
      ) : null}
      {phase === "overview" || active ? (
        <>
          <View style={styles.hero}>
            {!childGame ? (
              <>
                <AppText color="primary" variant="labelStrong">
                  {phase === "overview"
                    ? "GIAO TIẾP MỖI NGÀY"
                    : transfer
                      ? "MANG VÀO ĐỜI SỐNG"
                      : activity?.presentation?.wordGames
                        ? "HỌC TỪ QUA TRÒ CHƠI"
                        : "CÙNG NHÌN · CÙNG CHỜ"}
                </AppText>
                <AppText variant="screenTitle" align="center">
                  {active && activity?.type === "cloze_tail"
                    ? "Cùng hoàn thành lời quen"
                    : active && activity?.type === "functional_sentence"
                      ? "Con kể về hình"
                      : transfer && lesson.id === sampleLessons[0].id
                        ? "Một ngụm nước, một lời yêu cầu"
                        : lesson.title}
                </AppText>
              </>
            ) : null}
            {session?.pendingReward && phase !== "overview" ? (
              <GameRewardPanel
                key={`${session.id}:${session.pendingReward.key}`}
                pending={session.pendingReward}
                receipt={session.rewardReceipts?.[session.pendingReward.key]}
                inventory={[
                  ...runtime.collection,
                  ...Object.values(session.rewardReceipts ?? {}).map((item) => item.itemId)
                ]}
                paused={!active || !!runtime.error}
                saving={runtime.busy}
                onChoose={(kind) =>
                  void runtime.apply({
                    type: "choose_reward",
                    key: session.pendingReward!.key,
                    kind
                  })
                }
                onOpen={() =>
                  void runtime.apply({ type: "open_reward", key: session.pendingReward!.key })
                }
                onAdvance={() =>
                  void runtime.apply({ type: "advance_reward", key: session.pendingReward!.key })
                }
              />
            ) : activity?.presentation?.wordGames && phase !== "overview" && session ? (
              <TodayWordGames
                key={activity.id}
                game={activity.presentation}
                paused={!active || !!runtime.error}
                saving={runtime.busy}
                progress={session.gameProgress?.[activity.id] ?? emptyWordGameProgress()}
                onInput={(input) => void runtime.apply({ type: "game_input", input })}
                onArtworkError={() => setArtworkError(true)}
                seed={`${session.id}:${activity.id}`}
                completed={session.gameRounds?.[activity.id] ?? 0}
                guideDismissed={dismissedGameGuides.includes(
                  `${session.id}:${activity.id}:${session.gameRounds?.[activity.id] ?? 0}`
                )}
                onDismissGuide={() =>
                  setDismissedGameGuides((previous) => [
                    ...previous,
                    `${session.id}:${activity.id}:${session.gameRounds?.[activity.id] ?? 0}`
                  ])
                }
                sticker={session.gameStickers?.[activity.id]}
                collection={runtime.collection}
                onClaimGift={(sticker) => void runtime.apply({ type: "claim_game_gift", sticker })}
                onCompleteRound={(round) =>
                  void runtime.apply({
                    type: "begin_round_reward",
                    activityId: activity.id,
                    round,
                    inventory: runtime.collection
                  })
                }
                onBeginLessonReward={() =>
                  void runtime.apply({
                    type: "begin_lesson_reward",
                    activityId: activity.id,
                    inventory: runtime.collection
                  })
                }
                onFinish={() => void runtime.apply({ type: "finish_games" })}
              />
            ) : activity?.presentation && phase !== "overview" && session ? (
              <PlayActivityStage
                key={`${activity.id}:${session.repeats}`}
                game={activity.presentation}
                paused={!active || runtime.busy || !!runtime.error}
                seed={`${session.id}:${activity.id}:${session.repeats}`}
                showModel={activity.promptLadder[session.promptLevel]?.level === "full_model"}
                onSolved={(state) =>
                  void runtime.apply({
                    type: "begin_play_reward",
                    activityId: activity.id,
                    state,
                    inventory: runtime.collection
                  })
                }
              />
            ) : activity &&
              phase !== "overview" &&
              session?.prepared.media &&
              activity.assets.required.length > 0 &&
              activity.type !== "parent_transfer" ? (
              <MediaActivityStage
                activity={activity}
                media={session.prepared.media}
                childId={session.childId}
                seed={`${session.id}:${unitIndex}`}
                promptLevel={session.promptLevel}
                repeats={session.repeats}
                presenting={phase === "presenting"}
                paused={!active || runtime.busy}
                onSampleEnd={() => {
                  void runtime.apply({ type: "begin_wait" });
                }}
                onError={() => setMediaError(true)}
              />
            ) : practiceMode && activity && phase !== "overview" ? (
              <GuidedActivityStage activity={activity} paused={!active || runtime.busy} />
            ) : (
              <View style={styles.picture}>
                <SemanticIllustration
                  key={`${session?.index}-${phase === "presenting"}`}
                  size={Math.min(240, width - 100)}
                  animation={illustrationAnimations[lesson.itemId]!}
                  paused={phase !== "presenting"}
                  disabled={phase !== "presenting"}
                  onComplete={completeIllustration}
                  onReplay={completeIllustration}
                  fallback={<AppText variant="screenTitle">{lesson.object}</AppText>}
                />
              </View>
            )}
            {!childGame ? (
              <AppText align="center" color="muted">
                {phase === "overview"
                  ? learningGoals[lesson.goal].purpose
                  : activity?.presentation?.wordGames
                    ? "Chơi lần lượt các trò, nhận sticker rồi khám phá phần quà!"
                    : activity?.presentation
                      ? "Cùng chơi và chờ phản hồi ngôn ngữ/giao tiếp của con; thử với người và đồ thật khi phù hợp."
                      : phase === "waiting"
                        ? "Chờ phản hồi của con theo hướng dẫn bài học."
                        : `Cùng con dùng ${lesson.object} thật, ngay bên cạnh bạn.`}
              </AppText>
            ) : null}
          </View>
          {mediaError ? (
            <Card>
              <AppText>
                Chưa phát được mẫu. Có thể để hoạt động này lúc khác và chuẩn bị lại media.
              </AppText>
            </Card>
          ) : null}
          {!activity?.presentation || phase === "overview" ? (
            <Card padding="lg" variant="subtle">
              <View style={styles.row}>
                <Users color={colors.primary} size={22} />
                <AppText variant="cardTitle">
                  {phase === "overview"
                    ? "Chuẩn bị cùng phụ huynh"
                    : phase === "waiting"
                      ? "Cho con thời gian"
                      : "Bạn đồng hành cùng con"}
                </AppText>
              </View>
              {phase === "overview" ? (
                <>
                  <AppText variant="labelStrong">{learningGoals[lesson.goal].title}</AppText>
                  <AppText>{session!.prepared.lesson.parentPurpose}</AppText>
                  <AppText>{session!.prepared.activities[0]!.transfer.preparation}</AppText>
                  <AppText color="muted">
                    Cùng luyện rồi thử trong sinh hoạt. Có thể dừng hoặc để lúc khác khi con chưa
                    sẵn sàng.
                  </AppText>
                </>
              ) : phase === "waiting" ? (
                <AppText>{activity!.promptLadder[session!.promptLevel]!.parentCue}</AppText>
              ) : guidance ? (
                <>
                  <AppText>{guidance.instruction}</AppText>
                  <AppText color="muted">{guidance.consequence}</AppText>
                </>
              ) : null}
            </Card>
          ) : null}
          {phase === "overview" ? (
            <AppText variant="caption" color="muted" align="center">
              Bài trải nghiệm · dữ liệu mẫu, có lưu quan sát trên thiết bị.
            </AppText>
          ) : null}
          {phase === "waiting" && !interactiveGame ? (
            <View style={styles.row}>
              <View style={styles.flex}>
                <KidButton
                  label="Thêm gợi ý"
                  variant="secondary"
                  disabled={
                    runtime.busy ||
                    session!.waitRemainingMs > 0 ||
                    session!.promptLevel >= activity!.promptLadder.length - 1
                  }
                  onPress={() => void runtime.apply({ type: "prompt" })}
                />
              </View>
              <View style={styles.flex}>
                <KidButton
                  label="Thử lại"
                  variant="secondary"
                  disabled={runtime.busy || session!.repeats >= activity!.repetitionLimit}
                  onPress={() => void runtime.apply({ type: "replay" })}
                />
              </View>
            </View>
          ) : null}
          {active && !interactiveGame ? (
            <KidButton
              label="Để lúc khác"
              variant="plain"
              disabled={runtime.busy}
              onPress={() => void runtime.apply({ type: "defer" })}
            />
          ) : null}
        </>
      ) : null}
      {phase === "paused" ? (
        <Card padding="lg" style={styles.center}>
          <Leaf size={44} color={colors.primary} />
          <AppText variant="screenTitle" align="center">
            Nghỉ một chút nhé
          </AppText>
          <AppText align="center" color="muted">
            Bài và quan sát đã được giữ lại. Tiếp tục khi cả bạn và con sẵn sàng.
          </AppText>
          {artworkError ? (
            <>
              <AppText align="center">
                Một số hình đang dùng bản tĩnh. Có thể thử tải lại hình để tiếp tục.
              </AppText>
              <KidButton
                label="Thử tải lại hình"
                disabled={runtime.busy}
                onPress={() => {
                  setArtworkError(false);
                  void runtime.apply({ type: "resume" });
                }}
              />
            </>
          ) : null}
          {activity?.presentation &&
          (session?.resumePhase === "presenting" || session?.resumePhase === "waiting") ? (
            <>
              <AppText align="center" color="muted">
                {session?.gameRounds?.[activity.id] === wordGameSteps.length &&
                !session?.gameStickers?.[activity.id]
                  ? "Chưa chọn hộp quà. Nếu bỏ bài này, con chưa nhận sticker của lượt này."
                  : "Để bài này lúc khác; phụ huynh sẽ ghi nhận là chưa quan sát ở cuối phiên."}
              </AppText>
              <KidButton
                label="Để bài này lúc khác"
                variant="plain"
                disabled={runtime.busy}
                onPress={() => void runtime.apply({ type: "defer" })}
              />
            </>
          ) : null}
        </Card>
      ) : null}
      {phase === "observation" && !authorized ? (
        <Card padding="lg" style={styles.center}>
          <Users size={44} color={colors.primary} />
          <AppText variant="sectionTitle" align="center">
            Một chút dành cho phụ huynh
          </AppText>
          <AppText align="center" color="muted">
            {session?.course
              ? "Đã kết thúc phần học. Phụ huynh nhận xét từng bài trong phiên; không có điểm số cho con."
              : "Ghi lại điều bạn vừa quan sát. Không có điểm số hay câu trả lời đúng, sai cho con."}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nhấn giữ để ghi nhận"
            accessibilityHint="Giữ khoảng hai giây. Với trình đọc màn hình, chạm hai lần và giữ."
            onPressIn={hold.begin}
            onPressOut={hold.end}
            style={styles.hold}
          >
            <AppText color="onPrimary" variant="button" align="center">
              {hold.holding ? "Tiếp tục giữ…" : "Nhấn giữ để ghi nhận"}
            </AppText>
          </Pressable>
        </Card>
      ) : null}
      {phase === "observation" && authorized && activity ? (
        <>
          <AppText variant="screenTitle">
            {session?.course
              ? `Nhận xét bài ${session.course.reviewIndex + 1}/${session.course.lessonIds.length}`
              : "Bạn vừa thấy điều gì?"}
          </AppText>
          {session?.course ? (
            <Card variant="subtle">
              <AppText variant="cardTitle">{lesson.title}</AppText>
              <AppText>
                {session.deferred ? "Bài đã bỏ qua" : `Đã học · Đã thử lại ${session.repeats} lần`}
              </AppText>
              <AppText>{activity.parentInstruction}</AppText>
            </Card>
          ) : null}
          <AppText color="muted">
            Ghi nhận lần này để hiểu con hơn, không so sánh con với ai.
          </AppText>
          {!session!.deferred ? (
            <Card padding="lg" variant="subtle">
              <AppText variant="labelStrong">Mức gợi ý đã dùng</AppText>
              {activity.promptLadder.map((prompt, index) => (
                <KidButton
                  key={prompt.level}
                  icon={
                    session!.promptLevel === index ? (
                      <Check size={20} color={colors.primary} />
                    ) : undefined
                  }
                  label={promptLabels[prompt.level]}
                  variant="plain"
                  selected={session!.promptLevel === index}
                  disabled={runtime.busy || index < session!.promptLevel}
                  onPress={() => {
                    setResult(null);
                    void runtime.apply({ type: "confirm_prompt", level: index });
                  }}
                />
              ))}
            </Card>
          ) : null}
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Quan sát của phụ huynh"
            style={styles.options}
          >
            {outcomes
              .filter((option) => !session!.deferred || option.value === "not_observed")
              .map((option) => {
                const disabled =
                  runtime.busy ||
                  (option.value === "independent" &&
                    hasAssistance(activity, session!.promptLevel)) ||
                  (option.value === "supported" && !hasAssistance(activity, session!.promptLevel));
                const selected = result === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityLabel={option.title}
                    accessibilityState={{ checked: selected, disabled }}
                    disabled={disabled}
                    onPress={() => setResult(option.value)}
                    style={[
                      styles.option,
                      selected && styles.selected,
                      disabled && styles.disabled
                    ]}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <Check size={15} color={colors.onPrimary} /> : null}
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="labelStrong">{option.title}</AppText>
                      <AppText variant="caption" color="muted">
                        {option.value === "independent"
                          ? activity.observationRubric.independent
                          : option.value === "supported"
                            ? activity.observationRubric.supported
                            : option.value === "not_yet"
                              ? activity.observationRubric.notYet
                              : option.detail}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
          </View>
        </>
      ) : null}
      {phase === "finished" ? (
        <>
          <Card padding="lg" style={styles.center}>
            <View style={styles.success}>
              <Check size={38} color={colors.primary} />
            </View>
            <AppText variant="screenTitle" align="center">
              {session?.course
                ? "Đã hoàn tất phiên học và nhận xét"
                : "Một bước nhỏ đã được ghi lại"}
            </AppText>
            <AppText align="center" color="muted">
              Quan sát đã lưu trên thiết bị. Cùng con nghỉ và thử lại trong sinh hoạt khi phù hợp.
            </AppText>
          </Card>
          <Card padding="lg" variant="subtle">
            <AppText variant="cardTitle">Mang theo vào ngày hôm nay</AppText>
            <AppText>{session!.prepared.activities.at(-1)!.transfer.parentAction}</AppText>
          </Card>
          {runtime.syncMessage ? (
            <AppText accessibilityLiveRegion="polite">{runtime.syncMessage}</AppText>
          ) : null}
          <KidButton
            label="Đồng bộ quan sát"
            variant="secondary"
            disabled={runtime.busy}
            onPress={() => void runtime.sync()}
          />
        </>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  topbar: { flexDirection: "row", alignItems: "center" },
  heading: { flex: 1 },
  iconButton: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  steps: { flexDirection: "row", gap: 12, marginBottom: 8 },
  step: { flex: 1, gap: 6 },
  stepLine: { height: 5, borderRadius: 4, backgroundColor: colors.border },
  stepCurrent: { backgroundColor: colors.primary },
  hero: { alignItems: "center", gap: 12, paddingVertical: 16 },
  picture: { padding: 12, backgroundColor: colors.surfaceLowest, borderRadius: 40 },
  row: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  flex: { flex: 1 },
  center: { alignItems: "center", gap: 20, paddingVertical: 32 },
  footer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft
  },
  footerInner: { width: "100%", maxWidth: 460, alignSelf: "center", padding: 18 },
  hold: {
    minHeight: 64,
    width: "100%",
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    padding: 18,
    justifyContent: "center"
  },
  options: { gap: 12 },
  option: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLowest,
    padding: 18,
    minHeight: 84
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  disabled: { opacity: 0.45 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  radioSelected: { backgroundColor: colors.primary },
  success: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  }
});

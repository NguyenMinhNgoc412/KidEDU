import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Leaf, Pause, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { illustrationAnimations } from "@/data/illustrationAnimations";
import { SemanticIllustration } from "@/features/learning/SemanticIllustration";
import { useParentGateStore } from "@/features/parent/parentGate";
import { useParentHold } from "@/features/parent/useParentHold";
import { colors, radii } from "@/theme";
import { useLessonSession } from "./useLessonSession";
import { localFixtureEnabled } from "./fixtureBoundary";
import type { ObservationResult } from "./sessionEngine";
import { findSampleLesson, sampleLessons } from "./lessonCatalog";

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
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const runtime = useLessonSession(typeof childId === "string" ? childId : undefined);
  const parentUnlocked = useParentGateStore((state) => state.isUnlocked);
  const [handoffAuthorized, setHandoffAuthorized] = useState(false);
  const [result, setResult] = useState<ObservationResult | null>(null);
  const { width } = useWindowDimensions();
  const hold = useParentHold(() => {
    useParentGateStore.getState().unlock();
    setHandoffAuthorized(true);
  });
  useEffect(() => {
    setHandoffAuthorized(false);
    setResult(null);
  }, [runtime.session?.index]);
  const router = useRouter();
  if (!localFixtureEnabled()) return <Redirect href="/" />;
  const session = runtime.session;
  const lesson = findSampleLesson(session?.prepared.lesson.id ?? "") ?? sampleLessons[0];
  const activity = session?.prepared.activities[session.index];
  const phase = session?.phase;
  const active = phase === "presenting" || phase === "waiting";
  const authorized = parentUnlocked && handoffAuthorized;
  const transfer = activity?.type === "parent_transfer";
  const home = () => router.replace("/");
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
            action: () => runtime.apply({ type: "resume" }),
            disabled: false
          }
        : phase === "presenting"
          ? {
              label: transfer ? "Bắt đầu quan sát" : "Đã tạo cơ hội, chờ con",
              action: () => runtime.apply({ type: "begin_wait" }),
              disabled: false
            }
          : phase === "waiting"
            ? {
                label:
                  session!.waitRemainingMs > 0
                    ? "Dành một chút thời gian cho con…"
                    : "Mời phụ huynh ghi nhận",
                action: () => runtime.apply({ type: "observe" }),
                disabled: session!.waitRemainingMs > 0
              }
            : phase === "observation" && authorized
              ? {
                  label: "Lưu và tiếp tục",
                  action: () => (result ? runtime.observe(result) : Promise.resolve()),
                  disabled: !result
                }
              : phase === "finished"
                ? { label: "Về bài hôm nay", action: home, disabled: false }
                : null;
  return (
    <Screen
      bottomBar={
        footer ? (
          <SafeAreaView edges={["bottom"]} style={styles.footer}>
            <View style={styles.footerInner}>
              <KidButton
                fullWidth
                size="lg"
                label={footer.label}
                disabled={runtime.busy || footer.disabled}
                onPress={() => void footer.action()}
              />
            </View>
          </SafeAreaView>
        ) : undefined
      }
    >
      <View style={styles.topbar}>
        <Pressable
          onPress={home}
          disabled={runtime.busy}
          accessibilityState={{ disabled: runtime.busy }}
          accessibilityRole="button"
          accessibilityLabel="Về học, giữ bài đã lưu"
          style={styles.iconButton}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.heading}>
          <AppText variant="labelStrong" align="center">
            Bài hôm nay
          </AppText>
          <AppText variant="caption" color="muted" align="center">
            Cùng con, từng bước nhỏ
          </AppText>
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
      {session ? (
        <View style={styles.steps}>
          {session.prepared.activities.map((step, index) => (
            <View key={step.id} style={styles.step}>
              <View style={[styles.stepLine, index <= session.index && styles.stepCurrent]} />
              <AppText variant="caption" color={index === session.index ? "primary" : "muted"}>
                {index + 1}.{" "}
                {step.type === "parent_transfer" ? "Trong sinh hoạt" : "Luyện cùng con"}
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
            <AppText color="primary" variant="labelStrong">
              {phase === "overview"
                ? "GIAO TIẾP MỖI NGÀY"
                : transfer
                  ? "MANG VÀO ĐỜI SỐNG"
                  : "CÙNG NHÌN · CÙNG CHỜ"}
            </AppText>
            <AppText variant="screenTitle" align="center">
              {transfer && lesson.id === sampleLessons[0].id
                ? "Một ngụm nước, một lời yêu cầu"
                : lesson.title}
            </AppText>
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
            <AppText align="center" color="muted">
              {phase === "overview"
                ? "Tạo một cơ hội nhỏ để con bày tỏ điều mình muốn."
                : phase === "waiting"
                  ? "Chờ con đáp lại. Một cử chỉ cũng là giao tiếp."
                  : `Cùng con dùng ${lesson.object} thật, ngay bên cạnh bạn.`}
            </AppText>
          </View>
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
                <AppText>{session!.prepared.activities[0]!.transfer.preparation}</AppText>
                <AppText color="muted">
                  Hai hoạt động ngắn: cùng luyện, rồi thử trong sinh hoạt. Không cần con nói thật
                  hoàn hảo.
                </AppText>
              </>
            ) : phase === "waiting" ? (
              <AppText>{activity!.promptLadder[session!.promptLevel]!.parentCue}</AppText>
            ) : activity?.type === "functional_communication" ? (
              <>
                <AppText>{activity.stimulus.partnerAction}</AppText>
                <AppText color="muted">{activity.stimulus.naturalConsequence}</AppText>
              </>
            ) : activity?.type === "parent_transfer" ? (
              <>
                <AppText>{activity.stimulus.parentAction}</AppText>
                <AppText color="muted">{activity.stimulus.realWorldContext}</AppText>
              </>
            ) : null}
          </Card>
          {phase === "overview" ? (
            <AppText variant="caption" color="muted" align="center">
              Bài trải nghiệm · dữ liệu mẫu, có lưu quan sát trên thiết bị.
            </AppText>
          ) : null}
          {phase === "waiting" ? (
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
          {active ? (
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
        </Card>
      ) : null}
      {phase === "observation" && !authorized ? (
        <Card padding="lg" style={styles.center}>
          <Users size={44} color={colors.primary} />
          <AppText variant="sectionTitle" align="center">
            Một chút dành cho phụ huynh
          </AppText>
          <AppText align="center" color="muted">
            Ghi lại điều bạn vừa quan sát. Không có điểm số hay câu trả lời đúng, sai cho con.
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
          <AppText variant="screenTitle">Bạn vừa thấy điều gì?</AppText>
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
                  label={
                    index === 0
                      ? "Chỉ tạo cơ hội và chờ"
                      : index === 1
                        ? "Có gợi ý ngắn"
                        : "Có nói mẫu"
                  }
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
                  (option.value === "independent" && session!.promptLevel > 0) ||
                  (option.value === "supported" && session!.promptLevel === 0);
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
                        {option.detail}
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
              Một bước nhỏ đã được ghi lại
            </AppText>
            <AppText align="center" color="muted">
              Quan sát đã lưu trên thiết bị. Cùng con nghỉ và thử lại trong sinh hoạt khi phù hợp.
            </AppText>
          </Card>
          <Card padding="lg" variant="subtle">
            <AppText variant="cardTitle">Mang theo vào ngày hôm nay</AppText>
            <AppText>
              {lesson.context} Chờ một ánh nhìn, cử chỉ hay lời yêu cầu của con. Đáp lại bằng điều
              con đang cần.
            </AppText>
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

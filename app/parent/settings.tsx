import { useRouter } from "expo-router";
import { Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useLearningSettingsQuery, useUpdateLearningSettingsMutation } from "@/data/queries";
import {
  getLoopModeForCount,
  getSpeedPresetForPlaybackSpeed,
  loopCountsByMode,
  playbackSpeedsByPreset
} from "@/data/learningSettings";
import type { LearningSettings, LoopMode, SpeedPreset } from "@/data/types";
import { colors, radii, spacing } from "@/theme";

export default function ParentSettingsScreen() {
  const router = useRouter();
  const settingsQuery = useLearningSettingsQuery();
  const updateMutation = useUpdateLearningSettingsMutation();
  const [draft, setDraft] = useState<LearningSettings | null>(null);
  const isDirty = Boolean(
    draft && settingsQuery.data && !areSettingsEqual(draft, settingsQuery.data)
  );

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft((current) => {
        if (!current || areSettingsEqual(current, settingsQuery.data)) {
          return settingsQuery.data;
        }

        return current;
      });
    }
  }, [settingsQuery.data]);

  function updateDraft(partial: Partial<LearningSettings>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function updateSpeedPreset(speedPreset: SpeedPreset) {
    updateDraft({
      speedPreset,
      playbackSpeed: playbackSpeedsByPreset[speedPreset]
    });
  }

  function updateLoopMode(loopMode: LoopMode) {
    updateDraft({
      loopMode,
      loopCount: loopCountsByMode[loopMode]
    });
  }

  function save() {
    if (!draft) {
      return;
    }

    void updateMutation
      .mutateAsync(draft)
      .then((nextSettings) => {
        setDraft(nextSettings);
        router.back();
      })
      .catch(() => undefined);
  }

  if (settingsQuery.isLoading || !draft) {
    return (
      <Screen>
        <StateMessage title="Đang tải cài đặt" />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        title="Cài đặt học"
        action={
          <KidButton
            disabled={updateMutation.isPending}
            label={isDirty ? "Lưu" : "Xong"}
            onPress={isDirty ? save : () => router.back()}
            variant={isDirty ? "primary" : "plain"}
          />
        }
      />
      <View style={styles.panel}>
        <AppText variant="fieldLabel">Tốc độ học</AppText>
        <View style={styles.choiceWrap}>
          {speedChoices.map((choice) => (
            <KidButton
              key={choice.value}
              label={choice.label}
              onPress={() => updateSpeedPreset(choice.value)}
              variant={
                getSpeedPresetForPlaybackSpeed(draft.playbackSpeed) === choice.value
                  ? "primary"
                  : "plain"
              }
            />
          ))}
        </View>

        <AppText variant="fieldLabel">Số vòng lặp</AppText>
        <View style={styles.choiceWrap}>
          {loopChoices.map((choice) => (
            <KidButton
              key={choice.value}
              label={choice.label}
              onPress={() => updateLoopMode(choice.value)}
              variant={getLoopModeForCount(draft.loopCount) === choice.value ? "primary" : "plain"}
            />
          ))}
        </View>

        <AppText variant="fieldLabel">Âm thanh</AppText>
        <View style={styles.choiceWrap}>
          <KidButton
            label={draft.reinforcementEnabled ? "Khen: bật" : "Khen: tắt"}
            onPress={() => updateDraft({ reinforcementEnabled: !draft.reinforcementEnabled })}
            variant={draft.reinforcementEnabled ? "primary" : "plain"}
          />
          <KidButton
            label={draft.sfxEnabled ? "Minh họa: bật" : "Minh họa: tắt"}
            onPress={() => updateDraft({ sfxEnabled: !draft.sfxEnabled })}
            variant={draft.sfxEnabled ? "primary" : "plain"}
          />
        </View>

        {updateMutation.isError ? (
          <AppText color="danger" variant="meta">
            Chưa lưu được cài đặt. Thử lại giúp mình nhé.
          </AppText>
        ) : null}

        <KidButton
          disabled={updateMutation.isPending || !isDirty}
          icon={<Save color={colors.onPrimary} size={22} />}
          label={updateMutation.isPending ? "Đang lưu" : isDirty ? "Lưu cài đặt" : "Đã lưu"}
          onPress={save}
        />
      </View>
    </Screen>
  );
}

function areSettingsEqual(left: LearningSettings, right: LearningSettings): boolean {
  return (
    left.speedPreset === right.speedPreset &&
    left.playbackSpeed === right.playbackSpeed &&
    left.loopMode === right.loopMode &&
    left.loopCount === right.loopCount &&
    left.reinforcementEnabled === right.reinforcementEnabled &&
    left.sfxEnabled === right.sfxEnabled
  );
}

const speedChoices: Array<{ label: string; value: SpeedPreset }> = [
  { label: "Chậm", value: "slow" },
  { label: "Bình thường", value: "normal" },
  { label: "Nhanh", value: "fast" }
];

const loopChoices: Array<{ label: string; value: LoopMode }> = [
  { label: "1 vòng", value: "once" },
  { label: "3 vòng", value: "three_times" },
  { label: "Lặp liên tục", value: "continuous" }
];

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[14],
    padding: spacing[18]
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8]
  }
});

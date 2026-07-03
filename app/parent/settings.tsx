import { useRouter } from "expo-router";
import { Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useLearningSettingsQuery, useUpdateLearningSettingsMutation } from "@/data/queries";
import type { LearningSettings, LoopMode, SpeedPreset } from "@/data/types";
import { colors, radii } from "@/theme";

export default function ParentSettingsScreen() {
  const router = useRouter();
  const settingsQuery = useLearningSettingsQuery();
  const updateMutation = useUpdateLearningSettingsMutation();
  const [draft, setDraft] = useState<LearningSettings | null>(null);
  const isDirty = draft && settingsQuery.data ? !areSettingsEqual(draft, settingsQuery.data) : false;

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  function updateDraft(partial: Partial<LearningSettings>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function save() {
    if (!draft) {
      return;
    }

    void updateMutation
      .mutateAsync(draft)
      .then(() => router.back())
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
        <Text style={styles.label}>Tốc độ học</Text>
        <View style={styles.choiceWrap}>
          {speedChoices.map((choice) => (
            <KidButton
              key={choice.value}
              label={choice.label}
              onPress={() => updateDraft({ speedPreset: choice.value })}
              variant={draft.speedPreset === choice.value ? "primary" : "plain"}
            />
          ))}
        </View>

        <Text style={styles.label}>Số vòng lặp</Text>
        <View style={styles.choiceWrap}>
          {loopChoices.map((choice) => (
            <KidButton
              key={choice.value}
              label={choice.label}
              onPress={() => updateDraft({ loopMode: choice.value })}
              variant={draft.loopMode === choice.value ? "primary" : "plain"}
            />
          ))}
        </View>

        <Text style={styles.label}>Âm thanh</Text>
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

        {updateMutation.isError ? <Text style={styles.error}>Chưa lưu được cài đặt. Thử lại giúp mình nhé.</Text> : null}

        <KidButton
          disabled={updateMutation.isPending || !isDirty}
          icon={<Save color="#FFFFFF" size={22} />}
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
    left.loopMode === right.loopMode &&
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
    gap: 14,
    padding: 18
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800"
  }
});

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
import { colors } from "@/theme";

export default function ParentSettingsScreen() {
  const router = useRouter();
  const settingsQuery = useLearningSettingsQuery();
  const updateMutation = useUpdateLearningSettingsMutation();
  const [draft, setDraft] = useState<LearningSettings | null>(null);

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

    updateMutation.mutate(draft, {
      onSuccess: () => router.back()
    });
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
      <SectionHeader title="Cài đặt học" action={<KidButton label="Xong" onPress={() => router.back()} variant="plain" />} />
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

        <KidButton disabled={updateMutation.isPending} icon={<Save color="#FFFFFF" size={22} />} label="Lưu cài đặt" onPress={save} />
      </View>
    </Screen>
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14
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
  }
});

import { Image } from "expo-image";
import { useMemo, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import type { ActivityV1 } from "@/content/contracts/activity";
import type { LearningItemMedia } from "@/data/types";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { PracticeActivityPlayer } from "./PracticeActivityPlayer";
import { useDisplayMedia } from "@/features/media/useDisplayMediaUri";
import { useMediaAccountId } from "@/features/media/MediaAccountBoundary";
import { colors } from "@/theme";
import {
  activityAssetsReady,
  activityMediaSlots,
  orderRecognitionOptions,
  type LocalActivityAsset,
  type LocalActivityAssets
} from "./activityMedia";

function playerMedia(
  id: string | null,
  asset: LocalActivityAsset | undefined,
  role: LearningItemMedia["role"]
): LearningItemMedia | undefined {
  if (!id || !asset) return undefined;
  return {
    id,
    learningItemId: id,
    mediaAssetId: id,
    role,
    priority: 0,
    isActive: true,
    asset: {
      id,
      type: asset.type,
      source: "custom",
      uri: asset.uri,
      thumbnailAssetId: null,
      thumbnailUri: null,
      durationMs: null,
      sizeBytes: null,
      mimeType: asset.mimeType,
      status: "active"
    }
  };
}
function OptionPicture({ asset, label }: { asset?: LocalActivityAsset; label: string }) {
  const source = useDisplayMedia(asset?.uri ?? null);
  return source.status === "ready" && source.uri ? (
    <Image
      source={{ uri: source.uri }}
      style={styles.optionPicture}
      contentFit="contain"
      accessibilityLabel={label}
    />
  ) : (
    <AppText>{label}</AppText>
  );
}
export function MediaActivityStage({
  activity,
  media,
  childId,
  seed,
  promptLevel,
  repeats,
  presenting,
  paused,
  onSampleEnd,
  onError
}: {
  activity: ActivityV1;
  media: LocalActivityAssets;
  childId: string;
  seed: string;
  promptLevel: number;
  repeats: number;
  presenting: boolean;
  paused: boolean;
  onSampleEnd(): void;
  onError(): void;
}) {
  const accountId = useMediaAccountId();
  const [selection, setSelection] = useState<string | null>(null);
  const model = activity.promptLadder[promptLevel]?.level === "full_model";
  const slots = activityMediaSlots(activity, model);
  const options = useMemo(
    () =>
      activity.type === "recognition"
        ? orderRecognitionOptions(activity.stimulus.options, `${seed}:${repeats}`)
        : [],
    [activity, seed, repeats]
  );
  useEffect(() => setSelection(null), [activity.id, repeats]);
  if (!accountId || !activityAssetsReady(activity, media, accountId, childId))
    return (
      <Card>
        <AppText>Media chưa sẵn sàng. Nhờ phụ huynh chuẩn bị lại hoặc để lúc khác.</AppText>
      </Card>
    );
  return (
    <View style={styles.stage}>
      {activity.type === "cloze_tail" ? (
        <>
          <AppText variant="learningTitle" align="center">
            {model ? activity.stimulus.fullSentence : activity.stimulus.leadInText}
          </AppText>
          <AppText align="center" color="muted">
            Chờ con hoàn thành phần còn lại.
          </AppText>
        </>
      ) : null}
      {activity.type === "functional_sentence" ? (
        <AppText variant="cardTitle" align="center">
          {model ? activity.stimulus.sentenceFrame : activity.stimulus.communicationOpportunity}
        </AppText>
      ) : null}
      {activity.type === "yes_no" || activity.type === "visual_qa" ? (
        <AppText variant="sectionTitle" align="center">
          {activity.stimulus.question}
        </AppText>
      ) : null}
      {activity.type === "naming" && !model ? (
        <AppText align="center" color="muted">
          Cho con cơ hội tự gọi tên. Chưa phát mẫu.
        </AppText>
      ) : null}
      <PracticeActivityPlayer
        illustration={playerMedia(
          slots.visual,
          slots.visual ? media[slots.visual] : undefined,
          "illustration"
        )}
        pronunciationAudio={playerMedia(
          slots.audio,
          slots.audio ? media[slots.audio] : undefined,
          "pronunciation_audio"
        )}
        mouthVideo={playerMedia(
          slots.video,
          slots.video ? media[slots.video] : undefined,
          "mouth_video"
        )}
        paused={paused}
        autoPlayKey={slots.audio || slots.video ? `${seed}:${repeats}:${promptLevel}` : null}
        onAutoPlaySampleEnd={(result) => {
          if (result === "unavailable") onError();
          else if (presenting && (slots.audio || slots.video)) onSampleEnd();
        }}
      />
      {activity.type === "recognition" ? (
        <View style={styles.options}>
          {options.map((option) => (
            <Card
              key={option.id}
              padding="sm"
              variant={selection === option.id ? "subtle" : "form"}
              style={styles.option}
            >
              <OptionPicture asset={media[option.visualAssetId]} label={option.label} />
              <KidButton
                label={option.label}
                selected={selection === option.id}
                disabled={paused}
                variant="secondary"
                onPress={() => setSelection(option.id)}
              />
            </Card>
          ))}
        </View>
      ) : null}
      {activity.type === "yes_no" ? (
        <View style={styles.options}>
          {["Có", "Không"].map((label) => (
            <View key={label} style={styles.option}>
              <KidButton
                label={label}
                variant="secondary"
                selected={selection === label}
                disabled={paused}
                onPress={() => setSelection(label)}
              />
            </View>
          ))}
        </View>
      ) : null}
      {selection ? (
        <AppText align="center" color="primary">
          {activity.type === "yes_no"
            ? "Cảm ơn con đã cho biết."
            : "Con đã chọn. Cùng người lớn quan sát nhé."}
        </AppText>
      ) : null}
      {model && activity.type === "visual_qa" ? (
        <Card variant="subtle">
          <AppText>Gợi ý: {activity.expectedResponse.canonical}</AppText>
        </Card>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  stage: { width: "100%", gap: 16 },
  options: { flexDirection: "row", gap: 12, flexWrap: "wrap", justifyContent: "center" },
  option: { flex: 1, minWidth: 112, gap: 12, alignItems: "center" },
  optionPicture: {
    width: 108,
    height: 108,
    borderRadius: 20,
    backgroundColor: colors.surfaceLowest
  }
});

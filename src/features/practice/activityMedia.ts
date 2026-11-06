import { z } from "zod";
import type { ActivityV1 } from "@/content/contracts/activity";
import { mediaUriAllowedForAccount } from "@/features/media/accountMediaScope";

export const localActivityAssetSchema = z.strictObject({
  uri: z
    .string()
    .max(2000)
    .regex(/^(file:\/\/|web-media:\/\/|bundle:\/\/default\/)/),
  type: z.enum(["image", "audio", "video"]),
  mimeType: z.string().max(80),
  accountId: z.uuid(),
  childId: z.uuid(),
  role: z.enum([
    "semantic_visual",
    "canonical_audio",
    "mouth_video",
    "instruction_audio",
    "prompt_audio",
    "context_visual",
    "segment_audio",
    "motion"
  ])
});
export type LocalActivityAsset = z.infer<typeof localActivityAssetSchema>;
export type LocalActivityAssets = Record<string, LocalActivityAsset>;

export function activityAssetsReady(
  activity: ActivityV1,
  assets: LocalActivityAssets,
  accountId: string,
  childId: string
) {
  return activity.assets.required.every((ref) => {
    const asset = assets[ref.assetId];
    if (
      !asset ||
      asset.accountId !== accountId ||
      asset.childId !== childId ||
      asset.role !== ref.role ||
      !localActivityAssetSchema.safeParse(asset).success ||
      !mediaUriAllowedForAccount(asset.uri, accountId)
    )
      return false;
    if (ref.role === "mouth_video")
      return asset.type === "video" && asset.mimeType.startsWith("video/");
    if (ref.role.endsWith("audio"))
      return asset.type === "audio" && asset.mimeType.startsWith("audio/");
    return asset.type === "image" && asset.mimeType.startsWith("image/");
  });
}

/** A stable per-attempt seed changes positions without scoring the selected option. */
export function orderRecognitionOptions<T extends { id: string }>(
  options: readonly T[],
  seed: string
): T[] {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  const ordered = [...options];
  for (let index = ordered.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const pick = state % (index + 1);
    [ordered[index], ordered[pick]] = [ordered[pick]!, ordered[index]!];
  }
  return ordered;
}

export function activityMediaSlots(activity: ActivityV1, hasPrompt: boolean) {
  switch (activity.type) {
    case "word_model":
      return {
        visual: activity.stimulus.visualAssetId,
        audio: activity.stimulus.canonicalAudioAssetId,
        video: activity.stimulus.mouthVideoAssetId
      };
    case "recognition":
      return { visual: null, audio: activity.stimulus.instructionAudioAssetId, video: null };
    case "naming":
      return {
        visual: activity.stimulus.visualAssetId,
        audio: hasPrompt ? activity.stimulus.promptAudioAssetId : null,
        video: null
      };
    case "cloze_tail":
      return {
        visual: null,
        audio: hasPrompt
          ? activity.stimulus.fullAudioAssetId
          : activity.stimulus.leadInAudioAssetId,
        video: null
      };
    case "functional_sentence":
      return { visual: activity.stimulus.contextVisualAssetId, audio: null, video: null };
    case "yes_no":
      return { visual: activity.stimulus.contextVisualAssetId, audio: null, video: null };
    case "visual_qa":
      return { visual: activity.stimulus.contextVisualAssetId, audio: null, video: null };
    default:
      return { visual: null, audio: null, video: null };
  }
}

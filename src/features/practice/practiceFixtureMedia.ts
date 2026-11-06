/* eslint-disable @typescript-eslint/no-require-imports -- Static Expo fixture assets, never production packs. */
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import {
  saveWebMediaBlob,
  assignWebMediaToAccount,
  getWebMediaObjectUrl,
  deleteWebMediaUris
} from "@/features/media/webMediaStore";
import { accountMediaDirectory } from "@/features/media/accountMediaScope";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import {
  type LocalActivityAsset,
  type LocalActivityAssets,
  activityAssetsReady
} from "./activityMedia";
import type { ActivityV1 } from "@/content/contracts/activity";

const ba = require("../../../assets/default-media/item-ba/illustration-v2.jpg") as number;
const me = require("../../../assets/default-media/item-me/illustration-v2.jpg") as number;
const ball = require("../../../assets/default-media/item-bong/illustration-v1.jpg") as number;
const voice = require("../../../assets/practice-fixtures/ba-v1.wav") as number;
const familyVoice = require("../../../assets/practice-fixtures/ba-me-v1.wav") as number;
const video = require("../../../assets/default-media/item-ba/mouth-video-v1.mp4") as number;
const definitions: Record<
  string,
  {
    module: number;
    role: LocalActivityAsset["role"];
    type: LocalActivityAsset["type"];
    mimeType: string;
  }
> = {
  practice_image_ba: { module: ba, role: "semantic_visual", type: "image", mimeType: "image/jpeg" },
  practice_image_me: { module: me, role: "semantic_visual", type: "image", mimeType: "image/jpeg" },
  practice_context_ba: {
    module: ba,
    role: "context_visual",
    type: "image",
    mimeType: "image/jpeg"
  },
  practice_context_ball: {
    module: ball,
    role: "context_visual",
    type: "image",
    mimeType: "image/jpeg"
  },
  practice_audio_ba: {
    module: voice,
    role: "canonical_audio",
    type: "audio",
    mimeType: "audio/wav"
  },
  practice_instruction_ba: {
    module: voice,
    role: "instruction_audio",
    type: "audio",
    mimeType: "audio/wav"
  },
  practice_prompt_ba: { module: voice, role: "prompt_audio", type: "audio", mimeType: "audio/wav" },
  practice_segment_ba: {
    module: voice,
    role: "segment_audio",
    type: "audio",
    mimeType: "audio/wav"
  },
  practice_segment_family: {
    module: familyVoice,
    role: "segment_audio",
    type: "audio",
    mimeType: "audio/wav"
  },
  practice_video_ba: { module: video, role: "mouth_video", type: "video", mimeType: "video/mp4" }
};
const cache = new Map<string, Promise<string>>();
async function materialize(module: number, mimeType: string, accountId: string, childId: string) {
  const key = `${accountId}:${childId}:${module}`;
  if (cache.has(key)) return cache.get(key)!;
  const pending = (async () => {
    const asset = Asset.fromModule(module);
    await asset.downloadAsync();
    const source = asset.localUri ?? asset.uri;
    if (Platform.OS === "web") {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(source, { signal: controller.signal });
        if (!response.ok) throw new Error("FIXTURE_MEDIA_UNAVAILABLE");
        const staged = await saveWebMediaBlob(await response.blob(), mimeType);
        try {
          return await assignWebMediaToAccount(staged, accountId);
        } finally {
          await deleteWebMediaUris([staged]);
        }
      } finally {
        clearTimeout(timeout);
      }
    }
    const root = FileSystem.documentDirectory;
    if (!root) throw new Error("STORAGE_UNAVAILABLE");
    const directory = `${accountMediaDirectory(`${root}practice/`, accountId)}${childId}/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const file = `${directory}${asset.hash ?? module}.${asset.type}`;
    if (!(await FileSystem.getInfoAsync(file)).exists)
      await FileSystem.copyAsync({ from: source, to: file });
    return file;
  })();
  cache.set(key, pending);
  try {
    return await pending;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}
export async function prepareFixtureMedia(
  activities: readonly ActivityV1[],
  accountId: string,
  childId: string
): Promise<LocalActivityAssets> {
  if (!localFixtureEnabled()) throw new Error("FIXTURE_NOT_ALLOWED");
  const entries = await Promise.all(
    [
      ...new Map(
        activities.flatMap((activity) => activity.assets.required).map((ref) => [ref.assetId, ref])
      ).values()
    ].map(async (ref) => {
      const definition = definitions[ref.assetId];
      if (!definition || definition.role !== ref.role) throw new Error("ACTIVITY_NOT_PREPARED");
      const uri = await materialize(definition.module, definition.mimeType, accountId, childId);
      return [
        ref.assetId,
        {
          uri,
          type: definition.type,
          mimeType: definition.mimeType,
          accountId,
          childId,
          role: ref.role
        }
      ] as const;
    })
  );
  return Object.fromEntries(entries);
}
export async function verifyLocalActivityMedia(
  activities: readonly ActivityV1[],
  media: LocalActivityAssets,
  accountId: string,
  childId: string
) {
  if (!activities.every((activity) => activityAssetsReady(activity, media, accountId, childId)))
    return false;
  for (const asset of Object.values(media)) {
    if (asset.uri.startsWith("web-media://")) {
      const url = await getWebMediaObjectUrl(asset.uri);
      if (!url) return false;
      URL.revokeObjectURL(url);
    } else if (
      asset.uri.startsWith("file://") &&
      !(await FileSystem.getInfoAsync(asset.uri)).exists
    )
      return false;
  }
  return true;
}

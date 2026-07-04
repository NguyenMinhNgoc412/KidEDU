import type {
  Category,
  LoopMode,
  MediaRole,
  MediaType,
  SpeedPreset
} from "./types";
import { normalizeLoopMode, normalizeSpeedPreset } from "./learningSettings";

export interface SeedLearningItem {
  id: string;
  title: string;
  categoryId: string;
  mediaRoles: MediaRole[];
}

export interface SeedDeck {
  id: string;
  title: string;
  description: string;
  itemIds: string[];
}

export const defaultChildId = "child-default";

export const seedCategories: Category[] = [
  { id: "cat-family", name: "Gia đình", sortOrder: 1, isDefault: true },
  { id: "cat-needs", name: "Nhu cầu", sortOrder: 2, isDefault: true },
  { id: "cat-objects", name: "Đồ vật", sortOrder: 3, isDefault: true },
  { id: "cat-animals", name: "Con vật", sortOrder: 4, isDefault: true },
  { id: "cat-actions", name: "Hành động", sortOrder: 5, isDefault: true }
];

const seedCoreRoles: MediaRole[] = ["illustration", "mouth_video", "pronunciation_audio"];

export const seedLearningItems: SeedLearningItem[] = [
  { id: "item-ba", title: "ba", categoryId: "cat-family", mediaRoles: seedCoreRoles },
  { id: "item-me", title: "mẹ", categoryId: "cat-family", mediaRoles: seedCoreRoles },
  { id: "item-ong", title: "ông", categoryId: "cat-family", mediaRoles: seedCoreRoles },
  { id: "item-ba-noi", title: "bà", categoryId: "cat-family", mediaRoles: seedCoreRoles },
  { id: "item-an", title: "ăn", categoryId: "cat-needs", mediaRoles: seedCoreRoles },
  { id: "item-uong", title: "uống", categoryId: "cat-needs", mediaRoles: seedCoreRoles },
  { id: "item-ngu", title: "ngủ", categoryId: "cat-needs", mediaRoles: seedCoreRoles },
  { id: "item-dau", title: "đau", categoryId: "cat-needs", mediaRoles: seedCoreRoles },
  { id: "item-be", title: "bế", categoryId: "cat-needs", mediaRoles: seedCoreRoles },
  { id: "item-nua", title: "nữa", categoryId: "cat-needs", mediaRoles: seedCoreRoles },
  { id: "item-khong", title: "không", categoryId: "cat-needs", mediaRoles: seedCoreRoles },
  { id: "item-bong", title: "bóng", categoryId: "cat-objects", mediaRoles: seedCoreRoles },
  { id: "item-xe", title: "xe", categoryId: "cat-objects", mediaRoles: seedCoreRoles },
  { id: "item-ly", title: "ly", categoryId: "cat-objects", mediaRoles: seedCoreRoles },
  { id: "item-sua", title: "sữa", categoryId: "cat-objects", mediaRoles: seedCoreRoles },
  { id: "item-banh", title: "bánh", categoryId: "cat-objects", mediaRoles: seedCoreRoles },
  { id: "item-gau", title: "gấu", categoryId: "cat-objects", mediaRoles: seedCoreRoles },
  { id: "item-meo", title: "mèo", categoryId: "cat-animals", mediaRoles: seedCoreRoles },
  { id: "item-cho", title: "chó", categoryId: "cat-animals", mediaRoles: seedCoreRoles },
  { id: "item-ca", title: "cá", categoryId: "cat-animals", mediaRoles: seedCoreRoles },
  { id: "item-ga", title: "gà", categoryId: "cat-animals", mediaRoles: seedCoreRoles },
  { id: "item-chim", title: "chim", categoryId: "cat-animals", mediaRoles: seedCoreRoles },
  { id: "item-di", title: "đi", categoryId: "cat-actions", mediaRoles: seedCoreRoles },
  { id: "item-ngoi", title: "ngồi", categoryId: "cat-actions", mediaRoles: seedCoreRoles },
  { id: "item-dung", title: "đứng", categoryId: "cat-actions", mediaRoles: seedCoreRoles },
  { id: "item-lay", title: "lấy", categoryId: "cat-actions", mediaRoles: seedCoreRoles },
  { id: "item-dua", title: "đưa", categoryId: "cat-actions", mediaRoles: seedCoreRoles },
  { id: "item-mo", title: "mở", categoryId: "cat-actions", mediaRoles: seedCoreRoles },
  { id: "item-dong", title: "đóng", categoryId: "cat-actions", mediaRoles: seedCoreRoles }
];

export const seedDecks: SeedDeck[] = [
  {
    id: "deck-family",
    title: "Gia đình",
    description: "ba, mẹ, ông, bà",
    itemIds: ["item-ba", "item-me", "item-ong", "item-ba-noi"]
  },
  {
    id: "deck-needs",
    title: "Nhu cầu cơ bản",
    description: "ăn, uống, ngủ, đau, bế, nữa, không",
    itemIds: ["item-an", "item-uong", "item-ngu", "item-dau", "item-be", "item-nua", "item-khong"]
  },
  {
    id: "deck-objects",
    title: "Đồ vật quen thuộc",
    description: "bóng, xe, ly, sữa, bánh, gấu",
    itemIds: ["item-bong", "item-xe", "item-ly", "item-sua", "item-banh", "item-gau"]
  },
  {
    id: "deck-animals",
    title: "Con vật",
    description: "mèo, chó, cá, gà, chim",
    itemIds: ["item-meo", "item-cho", "item-ca", "item-ga", "item-chim"]
  },
  {
    id: "deck-actions",
    title: "Hành động",
    description: "đi, ngồi, đứng, lấy, đưa, mở, đóng",
    itemIds: ["item-di", "item-ngoi", "item-dung", "item-lay", "item-dua", "item-mo", "item-dong"]
  }
];

export const learningSettingKeys = {
  speedPreset: "learning.speedPreset",
  playbackSpeed: "learning.playbackSpeed",
  loopMode: "learning.loopMode",
  loopCount: "learning.loopCount",
  reinforcementEnabled: "learning.reinforcementEnabled",
  sfxEnabled: "learning.sfxEnabled"
} as const;

export function mediaTypeForRole(role: MediaRole): MediaType {
  if (role === "mouth_video") {
    return "video";
  }

  if (role === "pronunciation_audio" || role === "sfx") {
    return "audio";
  }

  return "image";
}

export function isSpeedPreset(value: string | null): value is SpeedPreset {
  return normalizeSpeedPreset(value) === value;
}

export function isLoopMode(value: string | null): value is LoopMode {
  return normalizeLoopMode(value) === value;
}

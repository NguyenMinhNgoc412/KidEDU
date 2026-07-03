import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import { useKidEduRepository } from "@/data/KidEduDataProvider";
import { queryKeys } from "@/data/queries";
import type { MediaRole } from "@/data/types";

import { cleanupMediaFiles, saveImagePickerAssetToAppStorage, saveRecordedAudioToAppStorage } from "./mediaImportService";

interface SavePickedMediaInput {
  role: MediaRole;
  asset: ImagePickerAsset;
}

export function useSavePickedMediaMutation(learningItemId: string) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, asset }: SavePickedMediaInput) => {
      const savedMedia = await saveImagePickerAssetToAppStorage(asset, role);

      try {
        const replacedUris = await repository.upsertCustomMediaForItem({
          learningItemId,
          role,
          ...savedMedia
        });
        await cleanupMediaFiles(replacedUris);
      } catch (error) {
        await cleanupMediaFiles([savedMedia.uri, savedMedia.thumbnailUri]);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateLearningContent(queryClient, learningItemId);
    }
  });
}

export function useDeleteCustomMediaMutation(learningItemId: string) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: MediaRole) => {
      const deletedUris = await repository.deleteCustomMediaForItem({ learningItemId, role });
      await cleanupMediaFiles(deletedUris);
    },
    onSuccess: async () => {
      await invalidateLearningContent(queryClient, learningItemId);
    }
  });
}

export function useSaveRecordedAudioMutation(learningItemId: string) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { uri: string; durationMs?: number | null; mimeType?: string | null }) => {
      const savedMedia = await saveRecordedAudioToAppStorage(input);

      try {
        const replacedUris = await repository.upsertCustomMediaForItem({
          learningItemId,
          role: "pronunciation_audio",
          ...savedMedia
        });
        await cleanupMediaFiles(replacedUris);
      } catch (error) {
        await cleanupMediaFiles([savedMedia.uri]);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateLearningContent(queryClient, learningItemId);
    }
  });
}

async function invalidateLearningContent(
  queryClient: ReturnType<typeof useQueryClient>,
  learningItemId: string
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: queryKeys.learningItems });
  await queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems });
  await queryClient.invalidateQueries({ queryKey: queryKeys.learningItem(learningItemId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.decks });
  await queryClient.invalidateQueries({ queryKey: queryKeys.childDecks });
  await queryClient.invalidateQueries({ queryKey: queryKeys.deckDetails });
}

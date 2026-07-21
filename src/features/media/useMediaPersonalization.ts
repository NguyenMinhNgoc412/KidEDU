import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useKidEduRepository } from "@/data/KidEduDataProvider";
import { queryKeys } from "@/data/queries";
import type { MediaRole } from "@/data/types";

import {
  cleanupMediaFiles,
  commitStagedMediaToAppStorage,
  discardStagedMedia,
  type StagedMediaImport
} from "./mediaImportService";

export function useSaveStagedMediaMutation(learningItemId: string) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staged: StagedMediaImport) => {
      let savedMedia: Awaited<ReturnType<typeof commitStagedMediaToAppStorage>> | null = null;

      try {
        savedMedia = await commitStagedMediaToAppStorage(staged);
        const replacedUris = await repository.upsertCustomMediaForItem({
          learningItemId,
          role: staged.role,
          ...savedMedia
        });
        await cleanupMediaFiles(replacedUris);

        if (savedMedia.uri !== staged.uri) {
          await discardStagedMedia(staged);
        }
      } catch (error) {
        await cleanupMediaFiles([savedMedia?.uri, savedMedia?.thumbnailUri]);
        await discardStagedMedia(staged);
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

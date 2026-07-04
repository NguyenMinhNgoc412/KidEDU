import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { completeLearningSettings } from "./learningSettings";
import { useKidEduRepository } from "./KidEduDataProvider";
import type {
  CreateDeckInput,
  CreateLearningItemInput,
  LearningItem,
  LearningSettings,
  UpdateProgressParentMarkInput,
  UpdateDeckInput,
  UpdateLearningItemInput
} from "./types";

export const queryKeys = {
  categories: ["categories"] as const,
  learningItems: ["learningItems"] as const,
  childLearningItems: ["learningItems", "child"] as const,
  learningItem: (itemId: string) => ["learningItem", itemId] as const,
  decks: ["decks"] as const,
  childDecks: ["decks", "child"] as const,
  deckDetails: ["deckDetail"] as const,
  deckDetail: (deckId: string) => ["deckDetail", deckId] as const,
  settings: ["settings"] as const,
  progress: ["progress"] as const
};

export function useCategoriesQuery() {
  const repository = useKidEduRepository();
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => repository.listCategories(),
    staleTime: 1000 * 60 * 10
  });
}

export function useLearningItemsQuery(options?: { childOnly?: boolean }) {
  const repository = useKidEduRepository();
  return useQuery({
    queryKey: options?.childOnly ? queryKeys.childLearningItems : queryKeys.learningItems,
    queryFn: () =>
      repository.listLearningItems({ includeArchived: false, childOnly: options?.childOnly }),
    staleTime: 1000 * 30
  });
}

export function useLearningItemQuery(itemId: string) {
  const repository = useKidEduRepository();
  return useQuery({
    queryKey: queryKeys.learningItem(itemId),
    queryFn: () => repository.getLearningItem(itemId),
    staleTime: 1000 * 30
  });
}

export function useDecksQuery(options?: { childOnly?: boolean }) {
  const repository = useKidEduRepository();
  return useQuery({
    queryKey: options?.childOnly ? queryKeys.childDecks : queryKeys.decks,
    queryFn: () => repository.listDecks({ includeArchived: false, childOnly: options?.childOnly }),
    staleTime: 1000 * 30
  });
}

export function useDeckDetailQuery(deckId: string) {
  const repository = useKidEduRepository();
  return useQuery({
    queryKey: queryKeys.deckDetail(deckId),
    queryFn: () => repository.getDeckDetail(deckId),
    staleTime: 1000 * 15
  });
}

export function useLearningSettingsQuery() {
  const repository = useKidEduRepository();
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => repository.getLearningSettings(),
    staleTime: 0
  });
}

export function useProgressSummaryQuery() {
  const repository = useKidEduRepository();
  return useQuery({
    queryKey: queryKeys.progress,
    queryFn: () => repository.listProgressSummary(),
    staleTime: 1000 * 10
  });
}

export function useCreateLearningItemMutation() {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLearningItemInput) => {
      const itemId = await repository.createLearningItem(input);
      const item = await repository.getLearningItem(itemId);

      return { itemId, item };
    },
    onSuccess: ({ itemId, item }) => {
      if (!item) {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.learningItems }),
          queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems })
        ]);
        return;
      }

      queryClient.setQueryData(queryKeys.learningItem(itemId), item);
      addLearningItemToQueryCache(queryClient, queryKeys.learningItems, item);
      addLearningItemToQueryCache(queryClient, queryKeys.childLearningItems, item);

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.learningItems }),
        queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems })
      ]).then(() =>
        Promise.all([
          queryClient.refetchQueries({ queryKey: queryKeys.learningItems, type: "active" }),
          queryClient.refetchQueries({ queryKey: queryKeys.childLearningItems, type: "active" })
        ])
      );
    }
  });
}

export function useUpdateLearningItemMutation(itemId: string) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLearningItemInput) => repository.updateLearningItem(itemId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItem(itemId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childDecks });
    }
  });
}

export function useArchiveLearningItemMutation() {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => repository.archiveLearningItem(itemId),
    onSuccess: async (_data, itemId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItem(itemId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childDecks });
    }
  });
}

export function useCreateDeckMutation() {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeckInput) => repository.createDeck(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childDecks });
      await queryClient.refetchQueries({ queryKey: queryKeys.decks, type: "all" });
      await queryClient.refetchQueries({ queryKey: queryKeys.childDecks, type: "all" });
    }
  });
}

export function useUpdateDeckMutation(deckId: string) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDeckInput) => repository.updateDeck(deckId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childDecks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.deckDetail(deckId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.decks, type: "all" });
      await queryClient.refetchQueries({ queryKey: queryKeys.childDecks, type: "all" });
    }
  });
}

export function useArchiveDeckMutation() {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deckId: string) => repository.archiveDeck(deckId),
    onSuccess: async (_data, deckId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childDecks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.deckDetail(deckId) });
    }
  });
}

export function useUpdateLearningSettingsMutation() {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: LearningSettings) => {
      const nextSettings = completeLearningSettings(settings);
      await repository.updateLearningSettings(nextSettings);
      return nextSettings;
    },
    onSuccess: async (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      await queryClient.refetchQueries({ queryKey: queryKeys.settings, type: "active" });
    }
  });
}

export function useUpdateProgressParentMarkMutation() {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProgressParentMarkInput) =>
      repository.updateProgressParentMark(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.learningItem(input.learningItemId)
      });
    }
  });
}

function addLearningItemToQueryCache(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: typeof queryKeys.learningItems | typeof queryKeys.childLearningItems,
  item: LearningItem
): void {
  queryClient.setQueryData<LearningItem[]>(queryKey, (current) => {
    if (!current) {
      return [item];
    }

    return [item, ...current.filter((cachedItem) => cachedItem.id !== item.id)];
  });
}

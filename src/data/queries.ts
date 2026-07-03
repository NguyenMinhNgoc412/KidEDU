import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useKidEduRepository } from "./KidEduDataProvider";
import type {
  CreateDeckInput,
  CreateLearningItemInput,
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
    queryFn: () => repository.listLearningItems({ includeArchived: false, childOnly: options?.childOnly }),
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
    staleTime: 1000 * 60
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
    mutationFn: (input: CreateLearningItemInput) => repository.createLearningItem(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems });
      await queryClient.refetchQueries({ queryKey: queryKeys.learningItems, type: "active" });
      await queryClient.refetchQueries({ queryKey: queryKeys.childLearningItems, type: "active" });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.decks, type: "active" });
      await queryClient.refetchQueries({ queryKey: queryKeys.childDecks, type: "active" });
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
    mutationFn: (settings: LearningSettings) => repository.updateLearningSettings(settings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    }
  });
}

export function useUpdateProgressParentMarkMutation() {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProgressParentMarkInput) => repository.updateProgressParentMark(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.childLearningItems });
      await queryClient.invalidateQueries({ queryKey: queryKeys.learningItem(input.learningItemId) });
    }
  });
}

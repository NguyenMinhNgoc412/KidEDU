import { create } from "zustand";

interface Selection {
  accountId: string | null;
  childId: string | null;
  select(accountId: string, childId: string): void;
  clear(): void;
}

export const useSelectedChildStore = create<Selection>((set) => ({
  accountId: null,
  childId: null,
  select: (accountId, childId) => set({ accountId, childId }),
  clear: () => set({ accountId: null, childId: null })
}));

import { create } from "zustand";

export interface ParentGateChallenge {
  left: number;
  right: number;
  prompt: string;
  answer: number;
}

interface ParentGateState {
  isUnlocked: boolean;
  unlock(): void;
  lock(): void;
}

export const useParentGateStore = create<ParentGateState>((set) => ({
  isUnlocked: false,
  unlock: () => set({ isUnlocked: true }),
  lock: () => set({ isUnlocked: false })
}));

export const parentGateHoldDurationMs = 1500;

export function createParentGateChallenge(nowMs: number = Date.now()): ParentGateChallenge {
  const left = 2 + (nowMs % 5);
  const right = 3 + (Math.floor(nowMs / 10) % 6);

  return {
    left,
    right,
    prompt: `${left} + ${right} = ?`,
    answer: left + right
  };
}

export function isParentGateAnswerCorrect(input: string, challenge: ParentGateChallenge): boolean {
  const value = input.trim();
  return /^\d+$/.test(value) && Number(value) === challenge.answer;
}

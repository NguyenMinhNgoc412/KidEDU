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

export function createParentGateChallenge(nowMs?: number): ParentGateChallenge {
  if (nowMs === undefined) {
    return {
      left: 3,
      right: 5,
      prompt: "3 + 5 = ?",
      answer: 8
    };
  }

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
  return Number.parseInt(input.trim(), 10) === challenge.answer;
}

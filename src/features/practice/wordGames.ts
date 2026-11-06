import type { PlayPiece } from "@/content/contracts/playPresentation";
import { orderRecognitionOptions } from "./activityMedia";

export interface MemoryCard {
  id: string;
  wordId: string;
  piece: PlayPiece;
}
export interface MemoryState {
  open: string[];
  matched: string[];
  feedback: string;
}
export function memoryDeck(words: PlayPiece[], seed: string): MemoryCard[] {
  return orderRecognitionOptions(
    words.flatMap((piece) => [
      { id: `${piece.id}_a`, wordId: piece.id, piece },
      { id: `${piece.id}_b`, wordId: piece.id, piece }
    ]),
    seed
  );
}
export function flipMemory(deck: MemoryCard[], state: MemoryState, id: string): MemoryState {
  const card = deck.find((card) => card.id === id);
  if (
    !card ||
    state.open.length === 2 ||
    state.open.includes(id) ||
    state.matched.includes(card.wordId)
  )
    return state;
  const open = [...state.open, id];
  if (open.length < 2) return { ...state, open, feedback: "Tìm thêm một hình giống nhé!" };
  const same = deck.find((card) => card.id === open[0])!.wordId === card.wordId;
  return {
    open: same ? [] : open,
    matched: same ? [...state.matched, card.wordId] : state.matched,
    feedback: same
      ? `Đúng cặp ${card.piece.label.toLowerCase()} rồi!`
      : "Hai hình khác nhau. Mình thử lại nhé!"
  };
}
export function closeMemoryMismatch(state: MemoryState): MemoryState {
  return state.open.length === 2 ? { ...state, open: [] } : state;
}
export const stickerPictures = [
  "item-bong",
  "item-gau",
  "item-xe",
  "item-banh",
  "item-sua"
] as const;
export type StickerPicture = (typeof stickerPictures)[number];
export const stickerNames: Record<StickerPicture, string> = {
  "item-bong": "Bóng",
  "item-gau": "Gấu",
  "item-xe": "Xe",
  "item-banh": "Bánh",
  "item-sua": "Sữa"
};
export function giftChoices(seed: string) {
  return orderRecognitionOptions(
    stickerPictures.map((id) => ({ id })),
    `${seed}:gifts`
  )
    .slice(0, 3)
    .map(({ id }) => id);
}

import type { PlayPresentation } from "@/content/contracts/playPresentation";
export interface PlayState {
  selected: string | null;
  placed: Record<string, string>;
  order: string[];
  revealed: string[];
  scene: number;
  reply: string | null;
  turn: number;
}
export const initialPlayState = (): PlayState => ({
  selected: null,
  placed: {},
  order: [],
  revealed: [],
  scene: 0,
  reply: null,
  turn: 0
});
/** Completion of authored interaction only; parent observation remains separate. */
export function isPlaySolved(game: PlayPresentation, state: PlayState): boolean {
  switch (game.kind) {
    case "pair":
    case "sort":
      return game.pieces.every((piece) => state.placed[piece.id] === game.matches[piece.id]);
    case "sequence":
    case "sentence":
      return (
        state.order.length === game.sequence.length &&
        game.sequence.every((id, index) => state.order[index] === id)
      );
    case "hunt":
      return game.pieces.every((piece) => state.revealed.includes(piece.id));
    case "scene":
      return (
        state.scene === game.dialogue.length - 1 &&
        game.dialogue[state.scene]!.choices.some((choice) => choice.reply === state.reply)
      );
    case "turns":
      return state.turn >= game.pieces.length;
  }
}
export type PlayAction =
  | { type: "select"; id: string }
  | { type: "place"; id: string; place: string }
  | { type: "append"; id: string }
  | { type: "undo" }
  | { type: "reveal"; id: string }
  | { type: "reply"; index: number }
  | { type: "scene_next" }
  | { type: "turn" }
  | { type: "reset" };
/** Interaction state only; no outcome, score, mastery or observation is inferred here. */
export function updatePlay(
  game: PlayPresentation,
  state: PlayState,
  action: PlayAction
): PlayState {
  if (action.type === "reset") return initialPlayState();
  if ("id" in action && !game.pieces.some((piece) => piece.id === action.id)) return state;
  switch (action.type) {
    case "select":
      return { ...state, selected: action.id };
    case "place": {
      if (!game.places.some((place) => place.id === action.place)) return state;
      if (game.matches[action.id] !== action.place || state.placed[action.id]) return state;
      const placed = { ...state.placed };
      if (game.kind === "pair")
        for (const [id, place] of Object.entries(placed))
          if (place === action.place) delete placed[id];
      placed[action.id] = action.place;
      return { ...state, selected: null, placed };
    }
    case "append":
      return state.order.includes(action.id) || game.sequence[state.order.length] !== action.id
        ? state
        : { ...state, order: [...state.order, action.id] };
    case "undo":
      return { ...state, order: state.order.slice(0, -1) };
    case "reveal":
      return state.revealed.includes(action.id)
        ? { ...state, selected: action.id }
        : { ...state, revealed: [...state.revealed, action.id] };
    case "reply": {
      const reply = game.dialogue[state.scene]?.choices[action.index]?.reply;
      return reply ? { ...state, reply } : state;
    }
    case "scene_next":
      return state.reply
        ? { ...state, scene: (state.scene + 1) % game.dialogue.length, reply: null }
        : state;
    case "turn":
      return { ...state, turn: state.turn + 1 };
  }
}

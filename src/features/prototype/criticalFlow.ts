export type PrototypeStep =
  | "today"
  | "overview"
  | "activity"
  | "handoff"
  | "observation"
  | "promptLevel"
  | "transfer"
  | "finished";
export type ObservationChoice = "independent" | "supported" | "not_yet" | "not_observed";
export type PromptLevel = "full_model" | "partial_model" | "visual_cue" | "natural_cue";
export type PrototypeState = {
  step: PrototypeStep;
  observation: ObservationChoice | null;
  promptLevel: PromptLevel | null;
  promptShown: boolean;
};
export type PrototypeAction =
  | { type: "OPEN_LESSON" }
  | { type: "START" }
  | { type: "SHOW_PROMPT" }
  | { type: "HANDOFF" }
  | { type: "PARENT_READY" }
  | { type: "OBSERVE"; choice: ObservationChoice }
  | { type: "SET_PROMPT_LEVEL"; level: PromptLevel }
  | { type: "FINISH" }
  | { type: "RESET" };

export const initialPrototypeState: PrototypeState = {
  step: "today",
  observation: null,
  promptLevel: null,
  promptShown: false
};

export function criticalFlowReducer(
  state: PrototypeState,
  action: PrototypeAction
): PrototypeState {
  switch (action.type) {
    case "OPEN_LESSON":
      return state.step === "today" ? { ...state, step: "overview" } : state;
    case "START":
      return state.step === "overview" ? { ...state, step: "activity" } : state;
    case "SHOW_PROMPT":
      return state.step === "activity" ? { ...state, promptShown: true } : state;
    case "HANDOFF":
      return state.step === "activity" ? { ...state, step: "handoff" } : state;
    case "PARENT_READY":
      return state.step === "handoff" ? { ...state, step: "observation" } : state;
    case "OBSERVE":
      return state.step === "observation"
        ? {
            ...state,
            step: action.choice === "supported" ? "promptLevel" : "transfer",
            observation: action.choice
          }
        : state;
    case "SET_PROMPT_LEVEL":
      return state.step === "promptLevel"
        ? { ...state, step: "transfer", promptLevel: action.level }
        : state;
    case "FINISH":
      return state.step === "transfer" ? { ...state, step: "finished" } : state;
    case "RESET":
      return initialPrototypeState;
  }
}

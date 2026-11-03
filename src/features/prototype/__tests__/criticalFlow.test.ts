import { criticalFlowReducer, initialPrototypeState } from "../criticalFlow";

describe("P0-11 critical flow", () => {
  it("moves from Today through parent observation and transfer", () => {
    let state = initialPrototypeState;
    state = criticalFlowReducer(state, { type: "OPEN_LESSON" });
    state = criticalFlowReducer(state, { type: "START" });
    state = criticalFlowReducer(state, { type: "SHOW_PROMPT" });
    expect(state.promptShown).toBe(true);
    state = criticalFlowReducer(state, { type: "HANDOFF" });
    state = criticalFlowReducer(state, { type: "PARENT_READY" });
    state = criticalFlowReducer(state, { type: "OBSERVE", choice: "supported" });
    expect(state).toMatchObject({ step: "promptLevel", observation: "supported" });
    state = criticalFlowReducer(state, { type: "SET_PROMPT_LEVEL", level: "natural_cue" });
    expect(state).toMatchObject({ step: "transfer", promptLevel: "natural_cue" });
    expect(criticalFlowReducer(state, { type: "FINISH" }).step).toBe("finished");
  });

  it("does not expose observation before parent handoff", () => {
    const state = criticalFlowReducer(initialPrototypeState, {
      type: "OBSERVE",
      choice: "not_yet"
    });
    expect(state).toBe(initialPrototypeState);
  });

  it("resets all prototype state", () => {
    const state = criticalFlowReducer(
      { step: "finished", observation: "independent", promptLevel: null, promptShown: true },
      { type: "RESET" }
    );
    expect(state).toEqual(initialPrototypeState);
  });
});

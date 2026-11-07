import { act, fireEvent, render } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, AppState, type AppStateStatus } from "react-native";
import { ListenChoices } from "../ListenChoices";
import { previewTargets } from "../localPreviewPlan";
let mockReinforcement = true;
jest.mock("@/data/queries", () => ({
  useLearningSettingsQuery: () => ({ data: { reinforcementEnabled: mockReinforcement } })
}));
jest.mock("@/features/practice/WordGameArt", () => {
  const { View } = jest.requireActual("react-native");
  return { WordSprite: View, Check: View, Star: View, RotateCcw: View };
});
const options = Object.values(previewTargets).slice(0, 3);
const previousState = AppState.currentState;
beforeEach(() => {
  jest.useFakeTimers();
  AppState.currentState = "active";
  mockReinforcement = true;
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  AppState.currentState = previousState;
});
it("shows success immediately, commits one authored action and blocks double taps", async () => {
  const onChoose = jest.fn();
  const screen = await render(
    <ListenChoices
      options={options}
      targetId={options[0]!.id}
      width={200}
      size={160}
      disabled={false}
      onChoose={onChoose}
    />
  );
  const button = screen.getByRole("button", { name: `Chọn ${options[0]!.label}` });
  await fireEvent.press(button);
  expect(screen.getByText("Đúng rồi!")).toBeTruthy();
  expect(onChoose).toHaveBeenCalledWith(options[0]!.id);
  await fireEvent.press(button);
  expect(onChoose).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
});
it("shows a gentle retry on the chosen image and then allows another choice", async () => {
  const onChoose = jest.fn();
  const screen = await render(
    <ListenChoices
      options={options}
      targetId={options[0]!.id}
      width={200}
      size={160}
      disabled={false}
      onChoose={onChoose}
    />
  );
  await fireEvent.press(screen.getByRole("button", { name: `Chọn ${options[1]!.label}` }));
  expect(screen.getByText("Mình thử lại nhé")).toBeTruthy();
  expect(onChoose).toHaveBeenCalledWith(options[1]!.id);
  await act(async () => jest.advanceTimersByTime(900));
  expect(screen.queryByText("Mình thử lại nhé")).toBeNull();
  expect(screen.getByRole("button", { name: `Chọn ${options[0]!.label}` })).toBeEnabled();
});
it.each(["reduced", "sensory"])(
  "keeps static feedback when %s motion is disabled",
  async (reason) => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(reason === "reduced");
    mockReinforcement = reason !== "sensory";
    const timing = jest.spyOn(Animated, "timing");
    const screen = await render(
      <ListenChoices
        options={options}
        targetId={options[0]!.id}
        width={200}
        size={160}
        disabled={false}
        onChoose={jest.fn()}
      />
    );
    await fireEvent.press(screen.getByRole("button", { name: `Chọn ${options[0]!.label}` }));
    expect(screen.getByText("Đúng rồi!")).toBeTruthy();
    expect(timing).not.toHaveBeenCalled();
  }
);
it("clears feedback on background and never replays it on foreground", async () => {
  let listener!: (value: AppStateStatus) => void;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_event, callback) => {
    listener = callback;
    return { remove: jest.fn() };
  });
  const screen = await render(
    <ListenChoices
      options={options}
      targetId={options[0]!.id}
      width={200}
      size={160}
      disabled={false}
      onChoose={jest.fn()}
    />
  );
  await fireEvent.press(screen.getByRole("button", { name: `Chọn ${options[1]!.label}` }));
  await act(async () => {
    listener("background");
    jest.advanceTimersByTime(2000);
    listener("active");
  });
  expect(screen.queryByText("Mình thử lại nhé")).toBeNull();
});

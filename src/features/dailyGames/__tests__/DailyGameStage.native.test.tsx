import { useState } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { DailyGameStage } from "../DailyGameStage";
import { localPreviewPlan as plan, previewTargets } from "../localPreviewPlan";
import { advanceDailyGame, initialDailyGameCheckpoint } from "../sessionEngine";
jest.mock("@/data/queries", () => ({
  useLearningSettingsQuery: () => ({ data: { reinforcementEnabled: false } })
}));

// Full interaction path includes more than forty native accessibility/press events.
jest.setTimeout(30000);

jest.mock("@/features/practice/WordGameArt", () => {
  const { View } = jest.requireActual("react-native");
  return {
    WordSprite: View,
    Star: View,
    WordMatchingArt: View,
    WordSilhouette: View,
    Check: View,
    RotateCcw: View,
    Leaf: View
  };
});

function Harness({ paused = false }: { paused?: boolean }) {
  const [checkpoint, setCheckpoint] = useState(() => initialDailyGameCheckpoint(plan));
  return (
    <DailyGameStage
      plan={plan}
      checkpoint={checkpoint}
      targets={previewTargets}
      paused={paused}
      onAction={(action) =>
        setCheckpoint((previous) => advanceDailyGame(plan, previous, action).checkpoint)
      }
    />
  );
}

it("plays both shadow screens, five choices and five pairs through the real C50 engine", async () => {
  const screen = await render(<Harness />);
  for (const round of plan.shadowScreens) {
    for (const id of round.targetIds) {
      // Screen-reader activation exercises the same target acceptance as drag/drop.
      await fireEvent(screen.getByTestId(`drag-${id}`), "accessibilityAction", {
        nativeEvent: { actionName: "activate" }
      });
      await fireEvent(screen.getByTestId(`hole-${id}`), "accessibilityAction", {
        nativeEvent: { actionName: "activate" }
      });
    }
  }
  expect(screen.getByText("Nghe rồi chọn hình")).toBeTruthy();
  for (const round of plan.listenRounds) {
    const wrong = round.optionTargetIds.find((id) => id !== round.targetId)!;
    await fireEvent.press(
      screen.getByRole("button", { name: `Chọn ${previewTargets[wrong]!.label}` })
    );
    expect(
      screen.getByText(`Người lớn đọc: ${previewTargets[round.targetId]!.label}`)
    ).toBeTruthy();
    expect(screen.getByText("Mình thử lại nhé")).toBeTruthy();
    await waitFor(
      () =>
        expect(
          screen.getByRole("button", { name: `Chọn ${previewTargets[round.targetId]!.label}` })
        ).toBeEnabled(),
      { timeout: 2000 }
    );
    await fireEvent.press(
      screen.getByRole("button", { name: `Chọn ${previewTargets[round.targetId]!.label}` })
    );
  }
  expect(screen.getByText("Lật thẻ tìm đôi")).toBeTruthy();
  const [first, second] = plan.memoryTargetIds;
  await fireEvent.press(screen.getByTestId(`daily-card-${first}:a`));
  await fireEvent.press(screen.getByTestId(`daily-card-${second}:a`));
  expect(screen.getByTestId(`daily-card-${first}:b`)).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Úp hai thẻ, thử tiếp" })).toBeNull();
  await waitFor(() => expect(screen.getByTestId(`daily-card-${first}:b`)).toBeEnabled(), {
    timeout: 3000
  });
  for (const id of plan.memoryTargetIds) {
    await fireEvent.press(screen.getByTestId(`daily-card-${id}:a`));
    await fireEvent.press(screen.getByTestId(`daily-card-${id}:b`));
  }
  expect(screen.getByText("Mình đã hoàn thành cả ba trò!")).toBeTruthy();
});

it("does not move a shadow while paused", async () => {
  const screen = await render(<Harness paused />);
  const id = plan.shadowScreens[0]!.targetIds[0]!;
  await fireEvent(screen.getByTestId(`drag-${id}`), "accessibilityAction", {
    nativeEvent: { actionName: "activate" }
  });
  await fireEvent(screen.getByTestId(`hole-${id}`), "accessibilityAction", {
    nativeEvent: { actionName: "activate" }
  });
  expect(screen.getByTestId(`drag-${id}`)).toBeTruthy();
  expect(screen.getByText("Màn 1/2")).toBeTruthy();
});

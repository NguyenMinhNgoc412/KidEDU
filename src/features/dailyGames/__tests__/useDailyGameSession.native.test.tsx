import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AppState, Pressable, Text, type AppStateStatus } from "react-native";
import { useDailyGameSession } from "../useDailyGameSession";
import { localPreviewPlan as plan } from "../localPreviewPlan";
import { initialDailyGameCheckpoint } from "../sessionEngine";

const initial = {
  localRevision: 1,
  session: { id: "session", plan, checkpoint: initialDailyGameCheckpoint(plan), completedAt: null }
};
const mockCoordinator = {
  prepare: jest.fn(),
  apply: jest.fn(),
  pauseAndSync: jest.fn(),
  close: jest.fn(),
  continuePrepared: jest.fn()
};
const mockRuntime = {
  repository: { accountId: "account" },
  createSession: jest.fn(() => mockCoordinator)
};
jest.mock("../DailyGameRuntimeProvider", () => ({
  useDailyGameRepository: () => ({ runtime: mockRuntime, error: false })
}));
jest.mock("../../lessonRuntime/fixtureBoundary", () => ({ localFixtureEnabled: () => true }));
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return { useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]) };
});

function Harness() {
  const game = useDailyGameSession({ childId: "child", accountId: "account", token: "synthetic" });
  return (
    <>
      <Text testID="mode">{game.mode}</Text>
      <Text testID="revision">{game.state?.localRevision}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chọn hình"
        disabled={game.committing || game.mode !== "playing"}
        onPress={() =>
          game.apply({ type: "choose_listen", roundId: "listen_0", targetId: "target_bong" })
        }
      />
    </>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));
  mockCoordinator.prepare.mockResolvedValue({ state: initial, playable: true });
  mockCoordinator.pauseAndSync.mockResolvedValue({ outcome: "synced", state: initial });
  mockCoordinator.close.mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());
it("disables input while the checkpoint commits, then presents the acknowledged local frame", async () => {
  let resolve!: (value: unknown) => void;
  mockCoordinator.apply.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const screen = await render(<Harness />);
  const button = screen.getByRole("button", { name: "Chọn hình" });
  expect(button).toBeEnabled();
  await fireEvent.press(button);
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(mockCoordinator.apply).toHaveBeenCalledTimes(1);
  await act(async () =>
    resolve({
      state: { ...initial, localRevision: 2 },
      feedback: "correct",
      requiresBoundary: false
    })
  );
  expect(button).toBeEnabled();
  expect(screen.getByTestId("revision").props.children).toBe(2);
});
it("pauses immediately on background and discards the late committed frame", async () => {
  let listener!: (state: AppStateStatus) => void;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_event, callback) => {
    listener = callback;
    return { remove: jest.fn() };
  });
  let resolve!: (value: unknown) => void;
  mockCoordinator.apply.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const screen = await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Chọn hình" }));
  await act(async () => listener("background"));
  expect(screen.getByTestId("mode").props.children).toBe("paused");
  expect(mockCoordinator.pauseAndSync).toHaveBeenCalled();
  await act(async () =>
    resolve({
      state: { ...initial, localRevision: 2 },
      feedback: "correct",
      requiresBoundary: false
    })
  );
  expect(screen.getByTestId("revision").props.children).toBe(1);
  expect(screen.getByRole("button", { name: "Chọn hình" })).toBeDisabled();
});

it("automatically syncs completion once and only finishes after the server acknowledgment", async () => {
  const completed = {
    ...initial,
    session: {
      ...initial.session,
      checkpoint: {
        ...initial.session.checkpoint,
        shadowScreenIndex: plan.shadowScreens.length,
        listenRoundIndex: plan.listenRounds.length,
        memoryMatchedTargetIds: plan.memoryTargetIds
      },
      completedAt: "2026-11-06T12:00:00Z"
    }
  };
  mockCoordinator.apply.mockResolvedValue({
    state: completed,
    feedback: "correct",
    requiresBoundary: true
  });
  mockCoordinator.pauseAndSync.mockResolvedValue({ outcome: "synced", state: completed });
  const screen = await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Chọn hình" }));
  await waitFor(() => expect(screen.getByTestId("mode").props.children).toBe("done"));
  expect(mockCoordinator.pauseAndSync).toHaveBeenCalledTimes(1);
});

it("keeps a completed game read-only when automatic sync cannot reach the server", async () => {
  const completed = {
    ...initial,
    session: {
      ...initial.session,
      checkpoint: {
        ...initial.session.checkpoint,
        shadowScreenIndex: plan.shadowScreens.length,
        listenRoundIndex: plan.listenRounds.length,
        memoryMatchedTargetIds: plan.memoryTargetIds
      }
    }
  };
  mockCoordinator.apply.mockResolvedValue({
    state: completed,
    feedback: "correct",
    requiresBoundary: true
  });
  mockCoordinator.pauseAndSync.mockResolvedValue({ outcome: "retry", state: completed });
  const screen = await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Chọn hình" }));
  await waitFor(() => expect(screen.getByTestId("mode").props.children).toBe("sync_error"));
  expect(screen.getByRole("button", { name: "Chọn hình" })).toBeDisabled();
  expect(mockCoordinator.pauseAndSync).toHaveBeenCalledTimes(1);
});

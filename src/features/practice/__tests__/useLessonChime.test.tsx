import { renderHook } from "@testing-library/react-native";
const mockPlayer = { play: jest.fn(), pause: jest.fn(), volume: 1, loop: false };
let mockSettings = { data: { sfxEnabled: true } };
jest.mock("expo-audio", () => ({ useAudioPlayer: () => mockPlayer }));
jest.mock("@/data/queries", () => ({ useLearningSettingsQuery: () => mockSettings }));
jest.mock("../../../../assets/practice-fixtures/lesson-complete-v1.wav", () => 1);
jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: { currentState: "active", addEventListener: () => ({ remove: jest.fn() }) }
}));
import { useLessonChime } from "../useLessonChime";
beforeEach(async () => {
  jest.clearAllMocks();
  mockSettings = { data: { sfxEnabled: true } };
});
test("plays once on new completion, stops on pause and does not replay after resume", async () => {
  const view = await renderHook(
    ({ ready, paused }: { ready: boolean; paused: boolean }) => useLessonChime(ready, paused),
    {
      initialProps: { ready: false, paused: false }
    }
  );
  await view.rerender({ ready: true, paused: false });
  expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  await view.rerender({ ready: true, paused: true });
  expect(mockPlayer.pause).toHaveBeenCalled();
  await view.rerender({ ready: true, paused: false });
  expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  await view.unmount();
});
test("muted settings and restored revealed boxes remain quiet", async () => {
  mockSettings = { data: { sfxEnabled: false } };
  const view = await renderHook(({ ready }: { ready: boolean }) => useLessonChime(ready, false), {
    initialProps: { ready: false }
  });
  await view.rerender({ ready: true });
  expect(mockPlayer.play).not.toHaveBeenCalled();
  await view.unmount();
  mockSettings = { data: { sfxEnabled: true } };
  const restored = await renderHook(() => useLessonChime(true, false));
  expect(mockPlayer.play).not.toHaveBeenCalled();
  await restored.unmount();
});

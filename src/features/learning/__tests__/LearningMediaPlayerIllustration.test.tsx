import type * as ReactTypes from "react";
import { act, render } from "@testing-library/react-native";
import type { LearningItemMedia } from "@/data/types";

jest.mock("react-native-web/dist/exports/View", () => ({ __esModule: true, default: "View" }));
jest.mock("react-native-web/dist/exports/Pressable", () => ({ __esModule: true, default: "View" }));

const mockAudio = {
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(async () => undefined),
  setPlaybackRate: jest.fn()
};
jest.mock("lucide-react-native", () => ({ Play: () => null, Volume2: () => null }));
jest.mock("@/components/AppText", () => ({
  AppText: (props: { children?: ReactTypes.ReactNode }) =>
    jest.requireActual<typeof ReactTypes>("react").createElement("Text", null, props.children)
}));
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => mockAudio,
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0, didJustFinish: false })
}));
jest.mock("expo-video", () => ({ useVideoPlayer: jest.fn(), VideoView: () => null }));
jest.mock("expo", () => ({ useEventListener: jest.fn() }));
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void) =>
    jest.requireActual<typeof ReactTypes>("react").useEffect(effect, [effect])
}));
jest.mock("expo-image", () => ({
  Image: (props: { onLoad?: () => void; style?: object }) => {
    const React = jest.requireActual<typeof ReactTypes>("react");
    React.useEffect(() => {
      props.onLoad?.();
    }, []);
    return React.createElement("View", { testID: "sprite-image", style: props.style });
  }
}));
jest.mock("react-native-web/dist/exports/AccessibilityInfo", () => ({
  __esModule: true,
  default: {
    isReduceMotionEnabled: async () => false,
    addEventListener: () => ({ remove: jest.fn() })
  }
}));
jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: { currentState: "active", addEventListener: () => ({ remove: jest.fn() }) }
}));
jest.mock("@/features/media/useDisplayMediaUri", () => ({
  useDisplayMedia: (uri: string | null) => ({ uri, status: uri ? "ready" : "unavailable" })
}));
jest.mock("@/components/MediaPlaceholder", () => ({
  MediaPlaceholder: () => {
    const React = jest.requireActual<typeof ReactTypes>("react");
    return React.createElement("View", { testID: "media-placeholder" });
  }
}));

import { LearningMediaPlayer } from "../LearningMediaPlayer";

const media = (
  role: LearningItemMedia["role"],
  source: "default" | "custom" = "default"
): LearningItemMedia => ({
  id: role,
  learningItemId: "item-ca",
  mediaAssetId: role,
  role,
  priority: 10,
  isActive: true,
  asset: {
    id: role,
    type: role === "illustration" ? "image" : "audio",
    source,
    uri:
      role === "illustration" ? "bundle://default/item-ca-illustration-v1" : "file:///sample.mp3",
    thumbnailAssetId: null,
    thumbnailUri: null,
    durationMs: null,
    sizeBytes: null,
    mimeType: null,
    status: "active"
  }
});
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

test("learning screen advances illustration frames before starting canonical audio", async () => {
  const view = await render(
    <LearningMediaPlayer
      learningItemId="item-ca"
      autoPlayKey="ca:1"
      illustration={media("illustration")}
      pronunciationAudio={media("pronunciation_audio")}
    />
  );
  expect(view.getByTestId("sprite-image", { includeHiddenElements: true })).toBeTruthy();
  expect(mockAudio.play).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(375));
  expect(view.getByTestId("sprite-image", { includeHiddenElements: true }).props.style.left).toBe(
    -156
  );
  await act(async () => jest.advanceTimersByTime(2625));
  expect(mockAudio.play).toHaveBeenCalledTimes(1);
  await view.unmount();
});

test("mẹ and bà show illustration even when an older seed has no illustration mapping", async () => {
  for (const learningItemId of ["item-me", "item-ba-noi"]) {
    const completed = jest.fn();
    const view = await render(
      <LearningMediaPlayer
        learningItemId={learningItemId}
        autoPlayKey={learningItemId}
        onAutoPlaySampleEnd={completed}
      />
    );
    expect(view.getByTestId("sprite-image", { includeHiddenElements: true })).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(3000));
    expect(completed).toHaveBeenCalledTimes(1);
    await view.unmount();
  }
});

test("family custom illustration keeps its own renderer", async () => {
  const view = await render(
    <LearningMediaPlayer learningItemId="item-ca" illustration={media("illustration", "custom")} />
  );
  expect(view.queryByTestId("sprite-image", { includeHiddenElements: true })).toBeNull();
  await view.unmount();
});

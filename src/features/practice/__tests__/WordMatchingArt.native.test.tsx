import { View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { WordMatchingArt, WordSilhouette } from "../WordGameArt";
import { localDailyTargets } from "@/features/dailyGames/localPreparationBoundary";
import { wordSilhouetteContours } from "../wordSilhouetteContours";
jest.mock("react-native-svg", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: View,
    Defs: View,
    ClipPath: View,
    G: View,
    Path: (props: object) => React.createElement(View, { ...props, testID: "contour" }),
    Image: (props: object) => React.createElement(View, { ...props, testID: "matching-raster" })
  };
});
it.each(Object.values(localDailyTargets))(
  "uses the same static contour for $label and its shadow",
  async (piece) => {
    const screen = await render(
      <View>
        <WordMatchingArt piece={piece} size={140} />
        <WordMatchingArt piece={piece} size={140} shadow />
      </View>
    );
    const paths = screen.getAllByTestId("contour");
    expect(paths).toHaveLength(2);
    expect(paths[0]!.props.d).toBe(wordSilhouetteContours[piece.picture]);
    expect(paths[1]!.props.d).toBe(paths[0]!.props.d);
    const raster = screen.getByTestId("matching-raster");
    expect(raster.props.x ?? 0).toBe(0);
    expect(raster.props.y ?? 0).toBe(0);
    expect(raster.props.height).toBe(200);
  }
);
it("covers every current target with a distinct contour and never substitutes a bun for unknown art", async () => {
  const paths = Object.values(localDailyTargets).map(
    (piece) => wordSilhouetteContours[piece.picture]
  );
  expect(paths.every(Boolean)).toBe(true);
  expect(new Set(paths).size).toBe(paths.length);
  const screen = await render(<WordSilhouette picture="unknown-picture" />);
  expect(screen.queryByTestId("contour")).toBeNull();
});

it.each([true, false])(
  "preserves artwork readiness and static fallback (loaded=%s)",
  async (loaded) => {
    jest.useFakeTimers();
    try {
      const failed = jest.fn();
      const piece = localDailyTargets.target_bong!;
      const screen = await render(
        <View>
          <WordMatchingArt piece={piece} size={140} onArtworkError={failed} />
          <WordMatchingArt piece={piece} size={140} shadow onArtworkError={failed} />
        </View>
      );
      if (loaded) await fireEvent(screen.getByTestId("matching-raster"), "load");
      await act(async () => jest.advanceTimersByTime(9000));
      expect(failed).toHaveBeenCalledTimes(loaded ? 0 : 1);
      expect(Boolean(screen.queryByTestId("matching-raster"))).toBe(loaded);
      await screen.unmount();
    } finally {
      jest.useRealTimers();
    }
  }
);

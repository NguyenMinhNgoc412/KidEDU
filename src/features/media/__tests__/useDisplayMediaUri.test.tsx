import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { MediaAccountContext } from "../MediaAccountBoundary";

import { useDisplayMedia, useDisplayMediaUri } from "../useDisplayMediaUri";

const mockGetCachedBundledDefaultMediaUri = jest.fn<string | null, [string]>();
const mockResolveBundledDefaultMediaUri = jest.fn<Promise<string | null>, [string]>();

jest.mock("@/data/defaultMediaRegistry", () => ({
  isBundledDefaultMediaUri: (uri: string) => uri.startsWith("bundle://")
}));

jest.mock("@/features/media/bundledMediaAssetResolver", () => ({
  getCachedBundledDefaultMediaUri: (uri: string) => mockGetCachedBundledDefaultMediaUri(uri),
  resolveBundledDefaultMediaUri: (uri: string) => mockResolveBundledDefaultMediaUri(uri)
}));

jest.mock("@/features/media/webMediaStore", () => ({
  getWebMediaObjectUrl: jest.fn(),
  isWebMediaUri: () => false
}));

describe("useDisplayMediaUri", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("account switch rejects a previously ready account-scoped URI immediately", async () => {
    const first = "10000000-0000-4000-8000-000000000010";
    let activeAccount = first;
    const uri = `file:///documents/media/accounts/${first}/images/photo.jpg`;
    function wrapper({ children }: { children: ReactNode }) {
      return (
        <MediaAccountContext.Provider value={activeAccount}>
          {children}
        </MediaAccountContext.Provider>
      );
    }
    const view = await renderHook(() => useDisplayMedia(uri), { wrapper });
    expect(view.result.current).toEqual({ status: "ready", uri });
    activeAccount = "20000000-0000-4000-8000-000000000010";
    await view.rerender(undefined);
    expect(view.result.current).toEqual({ status: "unavailable", uri: null });
    await view.unmount();
  });

  it("keeps a preloaded bundled URI stable instead of clearing it during the effect", async () => {
    mockGetCachedBundledDefaultMediaUri.mockReturnValue("file:///cached-video.mp4");

    const { result } = await renderHook(() => useDisplayMediaUri("bundle://video"));

    expect(result.current).toBe("file:///cached-video.mp4");
    await waitFor(() => expect(mockGetCachedBundledDefaultMediaUri).toHaveBeenCalled());
    expect(result.current).toBe("file:///cached-video.mp4");
    expect(mockResolveBundledDefaultMediaUri).not.toHaveBeenCalled();
  });

  it("resolves a bundled URI when it has not been preloaded", async () => {
    mockGetCachedBundledDefaultMediaUri.mockReturnValue(null);
    mockResolveBundledDefaultMediaUri.mockResolvedValue("file:///resolved-video.mp4");

    const { result } = await renderHook(() => useDisplayMediaUri("bundle://video"));

    await waitFor(() => expect(result.current).toBe("file:///resolved-video.mp4"));
    expect(mockResolveBundledDefaultMediaUri).toHaveBeenCalledWith("bundle://video");
  });

  it("reports whether asynchronous media is still resolving or unavailable", async () => {
    mockGetCachedBundledDefaultMediaUri.mockReturnValue(null);
    let finishResolution!: (uri: string | null) => void;
    mockResolveBundledDefaultMediaUri.mockReturnValue(
      new Promise((resolve) => {
        finishResolution = resolve;
      })
    );

    const { result } = await renderHook(() => useDisplayMedia("bundle://missing"));

    expect(result.current).toEqual({ status: "resolving", uri: null });

    finishResolution(null);
    await waitFor(() => expect(result.current).toEqual({ status: "unavailable", uri: null }));
  });
});

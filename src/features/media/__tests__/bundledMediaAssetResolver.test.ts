interface MockAsset {
  localUri: string | null;
  uri: string;
  downloadAsync(): Promise<MockAsset>;
}

const mockFromModule = jest.fn<MockAsset, [unknown]>();

jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: (module: unknown) => mockFromModule(module)
  }
}));

jest.mock("@/data/defaultMediaRegistry", () => ({
  buildBundledFileMap: () =>
    new Map([
      ["success", { module: 1 }],
      ["hanging", { module: 2 }],
      ["rejected", { module: 3 }],
      ["retry-wins", { module: 4 }]
    ]),
  bundledDefaultMedia: [],
  getBundledDefaultMediaKey: (uri: string) =>
    uri.startsWith("bundle://") ? uri.slice("bundle://".length) : null,
  isBundledDefaultMediaUri: (uri: string) => uri.startsWith("bundle://")
}));

import {
  bundledMediaResolveTimeoutMs,
  getCachedBundledDefaultMediaUri,
  resolveBundledDefaultMediaUri
} from "../bundledMediaAssetResolver";

describe("bundledMediaAssetResolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFromModule.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("caches a resolved bundled URI for synchronous reuse on the next card", async () => {
    const asset = makeAsset("file:///cache/mouth-video-v1.mp4");
    mockFromModule.mockReturnValue(asset);

    await expect(resolveBundledDefaultMediaUri("bundle://success")).resolves.toBe(
      "file:///cache/mouth-video-v1.mp4"
    );
    expect(getCachedBundledDefaultMediaUri("bundle://success")).toBe(
      "file:///cache/mouth-video-v1.mp4"
    );

    await expect(resolveBundledDefaultMediaUri("bundle://success")).resolves.toBe(
      "file:///cache/mouth-video-v1.mp4"
    );
    expect(mockFromModule).toHaveBeenCalledTimes(1);
    expect(asset.downloadAsync).toHaveBeenCalledTimes(1);
  });

  it("times out shared work, allows a retry, and still caches a late native result", async () => {
    jest.useFakeTimers();
    const firstDownload = createDeferred<MockAsset>();
    const retryDownload = createDeferred<MockAsset>();
    const firstAsset = makePendingAsset(firstDownload.promise);
    const retryAsset = makePendingAsset(retryDownload.promise);
    mockFromModule.mockReturnValueOnce(firstAsset).mockReturnValueOnce(retryAsset);

    const firstResolution = resolveBundledDefaultMediaUri("bundle://hanging");
    const concurrentResolution = resolveBundledDefaultMediaUri("bundle://hanging");

    expect(mockFromModule).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(bundledMediaResolveTimeoutMs);
    await expect(Promise.all([firstResolution, concurrentResolution])).resolves.toEqual([
      null,
      null
    ]);

    const retryResolution = resolveBundledDefaultMediaUri("bundle://hanging");
    expect(mockFromModule).toHaveBeenCalledTimes(2);

    firstAsset.localUri = "file:///cache/late-video.mp4";
    firstDownload.resolve(firstAsset);
    await flushMicrotasks();
    expect(getCachedBundledDefaultMediaUri("bundle://hanging")).toBe(
      "file:///cache/late-video.mp4"
    );

    retryAsset.localUri = "file:///cache/retry-video.mp4";
    retryDownload.resolve(retryAsset);
    await expect(retryResolution).resolves.toBe("file:///cache/retry-video.mp4");
  });

  it("turns a native rejection into a retryable null result", async () => {
    const rejectedAsset = makePendingAsset(Promise.reject(new Error("download failed")));
    const recoveredAsset = makeAsset("file:///cache/recovered-video.mp4");
    mockFromModule.mockReturnValueOnce(rejectedAsset).mockReturnValueOnce(recoveredAsset);

    await expect(resolveBundledDefaultMediaUri("bundle://rejected")).resolves.toBeNull();
    await expect(resolveBundledDefaultMediaUri("bundle://rejected")).resolves.toBe(
      "file:///cache/recovered-video.mp4"
    );
    expect(mockFromModule).toHaveBeenCalledTimes(2);
  });

  it("does not let an older late resolution overwrite a successful retry", async () => {
    jest.useFakeTimers();
    const oldDownload = createDeferred<MockAsset>();
    const retryDownload = createDeferred<MockAsset>();
    const oldAsset = makePendingAsset(oldDownload.promise);
    const retryAsset = makePendingAsset(retryDownload.promise);
    mockFromModule.mockReturnValueOnce(oldAsset).mockReturnValueOnce(retryAsset);

    const oldResolution = resolveBundledDefaultMediaUri("bundle://retry-wins");
    jest.advanceTimersByTime(bundledMediaResolveTimeoutMs);
    await expect(oldResolution).resolves.toBeNull();

    const retryResolution = resolveBundledDefaultMediaUri("bundle://retry-wins");
    retryAsset.localUri = "file:///cache/current-video.mp4";
    retryDownload.resolve(retryAsset);
    await expect(retryResolution).resolves.toBe("file:///cache/current-video.mp4");

    oldAsset.localUri = "file:///cache/stale-video.mp4";
    oldDownload.resolve(oldAsset);
    await flushMicrotasks();
    expect(getCachedBundledDefaultMediaUri("bundle://retry-wins")).toBe(
      "file:///cache/current-video.mp4"
    );
  });
});

function makeAsset(localUriAfterDownload: string): MockAsset {
  const asset: MockAsset = {
    localUri: null,
    uri: `http://localhost${localUriAfterDownload.slice("file://".length)}`,
    downloadAsync: jest.fn(async () => {
      asset.localUri = localUriAfterDownload;
      return asset;
    })
  };
  return asset;
}

function makePendingAsset(download: Promise<MockAsset>): MockAsset {
  return {
    localUri: null,
    uri: "http://localhost/pending-video.mp4",
    downloadAsync: jest.fn(() => download)
  };
}

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve(value: T): void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve: resolvePromise
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

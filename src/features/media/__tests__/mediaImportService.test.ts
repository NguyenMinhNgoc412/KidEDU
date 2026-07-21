jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  documentDirectory: "file:///documents/",
  copyAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  getInfoAsync: jest.fn(async () => ({ exists: false })),
  makeDirectoryAsync: jest.fn(async () => undefined)
}));

jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  manipulateAsync: jest.fn(async (uri: string) => ({ uri }))
}));

jest.mock("expo-video-thumbnails", () => ({
  getThumbnailAsync: jest.fn(async () => ({ uri: "file:///cache/thumbnail.jpg" }))
}));

jest.mock("react-native", () => ({
  Platform: { OS: "android" }
}));

jest.mock("react-native-web/dist/exports/Platform", () => ({
  __esModule: true,
  default: { OS: "android" }
}));

import * as FileSystem from "expo-file-system/legacy";
import type { ImagePickerAsset } from "expo-image-picker";
import type {
  commitStagedMediaToAppStorage,
  cleanupMediaFiles,
  discardStagedMedia,
  getMediaTypeForRole,
  stageRecordedAudioForPreview,
  validatePickedMediaAsset
} from "../mediaImportService";

interface MediaImportServiceModule {
  commitStagedMediaToAppStorage: typeof commitStagedMediaToAppStorage;
  cleanupMediaFiles: typeof cleanupMediaFiles;
  discardStagedMedia: typeof discardStagedMedia;
  getMediaTypeForRole: typeof getMediaTypeForRole;
  stageRecordedAudioForPreview: typeof stageRecordedAudioForPreview;
  validatePickedMediaAsset: typeof validatePickedMediaAsset;
}

let mediaImportService: MediaImportServiceModule;

function makeAsset(overrides: Partial<ImagePickerAsset>): ImagePickerAsset {
  return {
    height: 720,
    type: "image",
    uri: "file:///tmp/media.jpg",
    width: 960,
    ...overrides
  };
}

describe("mediaImportService", () => {
  beforeAll(() => {
    // Load after native module mocks are registered.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mediaImportService = require("../mediaImportService") as MediaImportServiceModule;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps illustration gifs as animated images", () => {
    expect(
      mediaImportService.getMediaTypeForRole("illustration", makeAsset({ mimeType: "image/gif" }))
    ).toBe("animated_image");
  });

  it("rejects base64 payloads", () => {
    expect(() =>
      mediaImportService.validatePickedMediaAsset(makeAsset({ base64: "abc" }), "illustration")
    ).toThrow("base64");
  });

  it("rejects overlong mouth videos", () => {
    const video = makeAsset({
      duration: 16_000,
      mimeType: "video/mp4",
      type: "video",
      uri: "file:///tmp/mouth.mp4"
    });

    expect(() => mediaImportService.validatePickedMediaAsset(video, "mouth_video")).toThrow(
      "15 giây"
    );
  });

  it("rejects videos for illustration role", () => {
    const video = makeAsset({
      mimeType: "video/mp4",
      type: "video",
      uri: "file:///tmp/mouth.mp4"
    });

    expect(() => mediaImportService.validatePickedMediaAsset(video, "illustration")).toThrow(
      "ảnh minh họa"
    );
  });

  it("stages a recording for preview before copying it to durable storage", async () => {
    const staged = await mediaImportService.stageRecordedAudioForPreview({
      durationMs: 1_800,
      mimeType: "audio/m4a",
      uri: "file:///recordings/new.m4a"
    });

    expect(staged.role).toBe("pronunciation_audio");
    expect(staged.uri).toMatch(/^file:\/\/\/cache\/kidedu\/imports\//);
    expect(FileSystem.copyAsync).toHaveBeenNthCalledWith(1, {
      from: "file:///recordings/new.m4a",
      to: staged.uri
    });
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith("file:///recordings/new.m4a", {
      idempotent: true
    });

    const saved = await mediaImportService.commitStagedMediaToAppStorage(staged);

    expect(saved.uri).toMatch(/^file:\/\/\/documents\/media\/audio\/custom\//);
    expect(FileSystem.copyAsync).toHaveBeenNthCalledWith(2, {
      from: staged.uri,
      to: saved.uri
    });

    await mediaImportService.discardStagedMedia(staged);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(staged.uri, { idempotent: true });
  });

  it("bounds bulk file cleanup to four concurrent deletes", async () => {
    const deleteAsync = jest.mocked(FileSystem.deleteAsync);
    const firstBatch = Array.from({ length: 4 }, () => createDeferred<void>());
    const finalDelete = createDeferred<void>();
    const finalDeleteStarted = createDeferred<void>();

    firstBatch.forEach((deferred) => deleteAsync.mockImplementationOnce(() => deferred.promise));
    deleteAsync.mockImplementationOnce(() => {
      finalDeleteStarted.resolve(undefined);
      return finalDelete.promise;
    });

    const cleanupPromise = mediaImportService.cleanupMediaFiles(
      Array.from({ length: 5 }, (_, index) => `file:///media/custom-${index}.mp4`)
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(deleteAsync).toHaveBeenCalledTimes(4);

    firstBatch.forEach((deferred) => deferred.resolve(undefined));
    await finalDeleteStarted.promise;
    expect(deleteAsync).toHaveBeenCalledTimes(5);

    finalDelete.resolve(undefined);
    await cleanupPromise;
  });
});

function createDeferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

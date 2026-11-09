import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { prepareWordArtwork, wordArtworkSource } from "../prepareWordArtwork";

jest.mock("expo-asset", () => ({ Asset: { fromModule: jest.fn() } }));
jest.mock("expo-image", () => ({ Image: { prefetch: jest.fn() } }));
const fromModule = jest.mocked(Asset.fromModule);
const prefetch = jest.mocked(Image.prefetch);
beforeEach(() => {
  jest.clearAllMocks();
  fromModule.mockReturnValue({
    localUri: "file:///bundled.png",
    downloadAsync: async () => ({ localUri: "file:///bundled.png" })
  } as unknown as Asset);
  prefetch.mockResolvedValue(true);
});
it("prepares a repeated picture once and gives both renderers the local cached URI", async () => {
  await prepareWordArtwork(["item-bong", "item-bong"]);
  expect(fromModule).toHaveBeenCalledTimes(1);
  expect(prefetch).toHaveBeenCalledWith("file:///bundled.png", "memory-disk");
  expect(wordArtworkSource("item-bong")).toEqual({ uri: "file:///bundled.png" });
});
it("rejects failed warmup and allows a subsequent retry", async () => {
  prefetch.mockResolvedValueOnce(false);
  await expect(prepareWordArtwork(["item-gau"])).rejects.toThrow("VISUAL_UNAVAILABLE");
  await expect(prepareWordArtwork(["item-gau"])).resolves.toBeUndefined();
});
it("rejects unknown art instead of admitting an empty activity", async () => {
  await expect(prepareWordArtwork(["unknown"])).rejects.toThrow("VISUAL_UNAVAILABLE");
});

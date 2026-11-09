import type { Asset } from "expo-asset";
import { cacheBundledArtwork } from "../cacheBundledArtwork.web";

afterEach(() => jest.restoreAllMocks());
it("shares one local blob across concurrent SVG/image preparations", async () => {
  const fetcher = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    blob: async () => new Blob(["public fixture"])
  } as Response);
  jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:public-fixture");
  const asset = { uri: "/public-fixture.png" } as Asset;
  expect(await Promise.all([cacheBundledArtwork(asset), cacheBundledArtwork(asset)])).toEqual([
    "blob:public-fixture",
    "blob:public-fixture"
  ]);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("evicts failed fetches so retry can recover", async () => {
  const fetcher = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce({ ok: false } as Response)
    .mockResolvedValueOnce({ ok: true, blob: async () => new Blob() } as Response);
  jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:retry-fixture");
  const asset = { uri: "/retry-fixture.png" } as Asset;
  await expect(cacheBundledArtwork(asset)).rejects.toThrow("VISUAL_UNAVAILABLE");
  await expect(cacheBundledArtwork(asset)).resolves.toBe("blob:retry-fixture");
  expect(fetcher).toHaveBeenCalledTimes(2);
});

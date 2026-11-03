import { R2ObjectStorageAdapter } from "../src/storage/r2-object-storage.adapter";

describe("R2 object storage boundary", () => {
  const adapter = new R2ObjectStorageAdapter();

  it("rejects invalid keys before reading credentials", async () => {
    await expect(adapter.head("../family/jane.jpg")).rejects.toThrow("Invalid logical object key");
    await expect(adapter.delete("family//media")).rejects.toThrow("Invalid logical object key");
  });

  it("fails closed without provider configuration", async () => {
    await expect(adapter.head("family/abc")).rejects.toThrow("R2 storage configuration missing");
  });

  it("caps the lifetime of transfer authorization", async () => {
    await expect(adapter.authorizeDownload("family/abc", 901)).rejects.toThrow(
      "Invalid signed URL lifetime"
    );
    await expect(adapter.authorizeUpload("family/abc", "image/jpeg", 0)).rejects.toThrow(
      "Invalid signed URL lifetime"
    );
  });

  it("signs scoped upload and download URLs for the configured private bucket", async () => {
    const previous = {
      APP_ENV: process.env.APP_ENV,
      R2_ENDPOINT: process.env.R2_ENDPOINT,
      R2_BUCKET: process.env.R2_BUCKET,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY
    };
    try {
      Object.assign(process.env, {
        APP_ENV: "local",
        R2_ENDPOINT: "http://127.0.0.1:9000",
        R2_BUCKET: "private-fixture",
        R2_ACCESS_KEY_ID: "local-test-key",
        R2_SECRET_ACCESS_KEY: "local-test-secret"
      });
      const storage = new R2ObjectStorageAdapter();
      const put = new URL(await storage.authorizeUpload("family/opaque-id", "image/jpeg", 60));
      const get = new URL(await storage.authorizeDownload("family/opaque-id", 60));
      expect(put.pathname).toBe("/private-fixture/family/opaque-id");
      expect(get.pathname).toBe(put.pathname);
      expect(put.searchParams.get("X-Amz-Expires")).toBe("60");
      expect(get.searchParams.get("X-Amz-Expires")).toBe("60");
      expect(put.searchParams.has("X-Amz-Signature")).toBe(true);
      expect(get.searchParams.has("X-Amz-Signature")).toBe(true);
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

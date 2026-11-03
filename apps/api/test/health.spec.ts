import request from "supertest";

import { createApp } from "../src/main";

describe("health endpoints", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(["live", "startup", "ready"])("GET /health/%s", async (kind) => {
    const response = await request(app.getHttpServer()).get(`/health/${kind}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toMatch(/^req-/);
  });

  it("rejects incomplete production configuration at startup", async () => {
    const previous = process.env.APP_ENV;
    const previousConsentVersion = process.env.CHILD_PROFILE_CONSENT_VERSION;
    process.env.APP_ENV = "production";
    delete process.env.CHILD_PROFILE_CONSENT_VERSION;
    try {
      await expect(createApp()).rejects.toThrow(/^Missing runtime configuration:/);
    } finally {
      if (previous === undefined) delete process.env.APP_ENV;
      else process.env.APP_ENV = previous;
      if (previousConsentVersion === undefined) delete process.env.CHILD_PROFILE_CONSENT_VERSION;
      else process.env.CHILD_PROFILE_CONSENT_VERSION = previousConsentVersion;
    }
  });
});

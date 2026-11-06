const { test } = require("node:test");
const assert = require("node:assert/strict");
const { runSyntheticSmoke, draftSchema } = require("./ai-custom-smoke.cjs");
const valid = { words: ["bàn", "ghế", "cốc", "bát", "thìa"] };
const settings = {
  apiKey: "synthetic-not-a-real-key",
  model: "gemini-test-model",
  freeTierConfirmed: true
};

test("requires explicit free-tier setup and rejects endpoint injection", async () => {
  let called = false;
  const fetchImpl = async () => {
    called = true;
    throw new Error("unexpected");
  };
  await assert.rejects(runSyntheticSmoke({ ...settings, freeTierConfirmed: false, fetchImpl }));
  await assert.rejects(runSyntheticSmoke({ ...settings, apiKey: "", fetchImpl }));
  await assert.rejects(runSyntheticSmoke({ ...settings, model: "../../secret", fetchImpl }));
  assert.equal(called, false);
});
test("sends only the fixed synthetic prompt and returns an unpublished draft", async () => {
  const result = await runSyntheticSmoke({
    ...settings,
    fetchImpl: async (url, init) => {
      assert.equal(new URL(url).hostname, "generativelanguage.googleapis.com");
      assert.equal(url.includes(settings.apiKey), false);
      assert.equal(init.body.includes(settings.apiKey), false);
      assert.equal(init.headers["x-goog-api-key"], settings.apiKey);
      assert.equal(JSON.parse(init.body).generationConfig.maxOutputTokens, 512);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(valid) }] } }
          ]
        })
      };
    }
  });
  assert.equal(result.status, "draft_requires_human_review");
  assert.deepEqual(result.draft, valid);
});
test("rate limiting does not retry or leak provider error body", async () => {
  let requests = 0;
  await assert.rejects(
    runSyntheticSmoke({
      ...settings,
      fetchImpl: async () => {
        requests++;
        return {
          ok: false,
          status: 429,
          json: async () => {
            throw new Error(settings.apiKey);
          }
        };
      }
    }),
    /HTTP 429; stopped without retry/
  );
  assert.equal(requests, 1);
});
test("rejects incomplete, malformed and duplicate-word drafts", async () => {
  assert.equal(draftSchema.safeParse({ words: Array(5).fill("bàn") }).success, false);
  assert.equal(draftSchema.safeParse({ ...valid, childName: "Synthetic" }).success, false);
  await assert.rejects(
    runSyntheticSmoke({
      ...settings,
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({
          candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{}" }] } }]
        })
      })
    }),
    /failed draft validation/
  );
});

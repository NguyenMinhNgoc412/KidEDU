const assert = require("node:assert/strict");

function localOrigin(input) {
  const url = new URL(input);
  assert.equal(url.protocol, "http:", "This smoke test is for the local fixture only");
  assert.match(
    url.hostname,
    /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/,
    "This smoke test must use a local address"
  );
  assert.equal(url.username + url.password, "");
  return url.origin;
}

async function run() {
  const base = localOrigin(process.env.KIDEDU_API_ORIGIN ?? "http://localhost:3000");
  const identity = localOrigin(process.env.KIDEDU_IDENTITY_ORIGIN ?? "http://localhost:3011");
  const login = await globalThis.fetch(`${identity}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "fullaccess@local.kidedu.test", password: "FullAccess123!" }),
    signal: globalThis.AbortSignal.timeout(10000)
  });
  assert.equal(login.status, 200, "Local identity is unavailable");
  const { accessToken } = await login.json();
  assert.equal(typeof accessToken, "string");
  const headers = { Authorization: `Bearer ${accessToken}` };
  const childrenResponse = await globalThis.fetch(`${base}/v1/children`, {
    headers,
    signal: globalThis.AbortSignal.timeout(10000)
  });
  assert.equal(childrenResponse.status, 200);
  const children = await childrenResponse.json();
  assert.ok(
    Array.isArray(children) && children.length,
    "Create a synthetic child in the local Parent Zone first"
  );
  const path = `${base}/v1/children/${children[0].id}/daily-game`;
  for (const suffix of ["", "/inventory"]) {
    const response = await globalThis.fetch(path + suffix, {
      headers,
      signal: globalThis.AbortSignal.timeout(10000)
    });
    assert.equal(
      response.status,
      200,
      `Daily-game ${suffix || "status"} returned HTTP ${response.status}; rebuild the local API and apply migrations`
    );
    const result = await response.json();
    assert.equal(result.schemaVersion, 1);
    if (!suffix) {
      assert.ok(["available", "resumable", "completed"].includes(result.state));
      assert.equal(typeof result.contentReady, "boolean");
      assert.ok(Number.isFinite(Date.parse(result.resetAt)));
    } else assert.ok(Array.isArray(result.items));
  }
  console.log(
    "Local daily-game status/inventory: HTTP 200, contracts valid; no session started or reward granted"
  );
}

run().catch((error) => {
  // Never print request/response objects or the fixture credential/token.
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : "Local daily-game smoke failed to connect"
  );
  process.exitCode = 1;
});

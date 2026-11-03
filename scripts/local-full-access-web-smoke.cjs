const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { openParentGate } = require("./parent-gate-web.cjs");

const webOrigin = process.env.KIDEDU_WEB_ORIGIN ?? "http://localhost:19006";
const apiOrigin = process.env.KIDEDU_API_ORIGIN ?? "http://localhost:3000";
const identityOrigin = process.env.KIDEDU_IDENTITY_ORIGIN ?? "http://localhost:3011";

async function login(email, password) {
  const response = await globalThis.fetch(`${identityOrigin}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  assert.equal(response.status, 200);
  const { accessToken } = await response.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [me, subscription] = await Promise.all([
    globalThis.fetch(`${apiOrigin}/v1/me`, { headers }).then((result) => result.json()),
    globalThis.fetch(`${apiOrigin}/v1/subscription`, { headers }).then((result) => result.json())
  ]);
  return { me, subscription };
}

async function run() {
  const full = await login("fullaccess@local.kidedu.test", "FullAccess123!");
  const ordinary = await login("parent@local.kidedu.test", "LocalTest123!");
  assert.notEqual(full.me.id, ordinary.me.id);
  assert.equal(full.subscription.state, "active");
  assert.equal(full.subscription.learningAllowed, true);
  assert(full.subscription.allowedCapabilities.includes("learning.plan.full"));
  assert.equal(ordinary.subscription.learningAllowed, false);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${webOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
    await page.getByLabel("Mật khẩu").fill("FullAccess123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByText("Luyện thêm", { exact: true }).waitFor();
    assert.equal(await page.getByText("Nội dung học đang khóa", { exact: true }).count(), 0);
    await page.getByRole("tab", { name: "Phụ huynh" }).click();
    await openParentGate(page);
    await page.getByText("GÓI HỌC", { exact: true }).waitFor();
    await page.getByText("Gói đang hoạt động").waitFor();
    assert.deepEqual(errors, []);
    console.log("Full-access local account → learning UI → active subscription dashboard passed");
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

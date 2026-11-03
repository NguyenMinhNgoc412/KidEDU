const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { openParentGate } = require("./parent-gate-web.cjs");

const webOrigin = process.env.KIDEDU_WEB_ORIGIN ?? "http://localhost:19006";

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${webOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (process.env.KIDEDU_LOGIN_SCREENSHOT) {
      await page.getByText("Chào mừng phụ huynh").waitFor();
      await page.screenshot({ path: process.env.KIDEDU_LOGIN_SCREENSHOT, fullPage: true });
    }
    await page.getByRole("textbox", { name: "Email" }).fill("parent@local.kidedu.test");
    await page.getByLabel("Mật khẩu").fill("wrong-password");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByText("Email hoặc mật khẩu không đúng.").waitFor();
    await page.getByLabel("Mật khẩu").fill("LocalTest123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByText("Hôm nay mình học gì?").waitFor();
    await page.getByText("Nội dung học đang khóa").waitFor();
    assert.equal(await page.getByText("Luyện thêm", { exact: true }).count(), 0);
    if (process.env.KIDEDU_CHILD_SCREENSHOT) {
      await page.screenshot({ path: process.env.KIDEDU_CHILD_SCREENSHOT, fullPage: true });
    }
    await page.getByRole("tab", { name: "Phụ huynh" }).click();
    await openParentGate(page);
    await page.getByText("HỒ SƠ ĐANG XEM").first().waitFor();
    await page.getByText("KẾ HOẠCH HỌC").waitFor();
    await page.getByText("QUAN SÁT GẦN ĐÂY").waitFor();
    await page.getByText("GÓI HỌC", { exact: true }).waitFor();
    if (process.env.KIDEDU_PARENT_SCREENSHOT) {
      await page.screenshot({ path: process.env.KIDEDU_PARENT_SCREENSHOT, fullPage: true });
    }
    await page.getByRole("button", { name: "Xem bản mẫu" }).click();
    await page.getByText("Mẫu luồng v2 · dữ liệu giả").waitFor();
    await page.getByRole("button", { name: "Rời mẫu luồng" }).click();
    await page.getByText("HỒ SƠ ĐANG XEM").last().waitFor();
    await page.getByRole("button", { name: "Dữ liệu server (local)" }).click();
    await page.getByRole("button", { name: "Tải dữ liệu", exact: true }).click();
    await page.getByText("Đã kết nối.", { exact: false }).waitFor();
    await page.getByText("Quyền học hiện tại").waitFor();
    await page.getByRole("button", { name: "Xem Local Test Child" }).click();
    await page.getByText("Đã tải dữ liệu của Local Test Child.").waitFor();
    await page.getByText("Kế hoạch học", { exact: true }).waitFor();
    await page.getByText("Quan sát đã đồng bộ").waitFor();
    if (process.env.KIDEDU_SCREENSHOT) {
      await page.screenshot({ path: process.env.KIDEDU_SCREENSHOT, fullPage: true });
    }
    assert.equal(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth
      ),
      false
    );
    assert.deepEqual(errors, []);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Đăng xuất tài khoản" }).click();
    await page.getByText("Chào mừng phụ huynh").waitFor();
    await page.goto(`${webOrigin}/parent/local-api`, { waitUntil: "domcontentloaded" });
    await page.getByText("Chào mừng phụ huynh").waitFor();
    assert.deepEqual(errors, []);
    console.log("Login rejection → login → Parent Gate → API → logout/route guard passed");
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

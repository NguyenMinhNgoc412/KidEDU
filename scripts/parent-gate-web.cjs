async function openParentGate(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('[aria-label="Nhấn giữ để mở khu phụ huynh"]');
    return button?.checkVisibility() || /^\/parent(?:\/|$)/.test(globalThis.location.pathname);
  });
  const button = page.getByRole("button", { name: "Nhấn giữ để mở khu phụ huynh", exact: true });
  if (!(await button.isVisible())) return; // Guarded local fullaccess has no hold challenge.
  await button.click({ delay: 1700 });
}
module.exports = { openParentGate };

async function openParentGate(page) {
  const button = page.getByRole("button", { name: "Nhấn giữ để mở khu phụ huynh", exact: true });
  await button.waitFor();
  await button.click({ delay: 1700 });
}
module.exports = { openParentGate };

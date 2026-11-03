const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const directory = path.join(root, "content-candidates/illustrations-v2");
const read = (name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
const write = (name, data) =>
  fs.writeFileSync(path.join(directory, name), JSON.stringify(data, null, 2) + "\n");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const escapeHtml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const descriptions = {
  ba: "Ba vẫy tay chào.",
  me: "Mẹ vẫy tay chào.",
  ong: "Ông vẫy tay chào.",
  "ba-noi": "Bà vẫy tay chào.",
  an: "Bé đưa thìa cơm lên miệng và ăn.",
  uong: "Bé nâng ly, uống nước rồi hạ ly.",
  ngu: "Bé ngủ yên, thở nhẹ.",
  dau: "Bé ôm má và thể hiện cảm giác đau nhẹ.",
  be: "Mẹ nâng và bế bé trong vòng tay.",
  nua: "Bé đưa bát rỗng ra xin thêm.",
  khong: "Bé giơ lòng bàn tay và lắc đầu từ chối.",
  bong: "Quả bóng lăn một đoạn rồi dừng.",
  xe: "Xe lăn bánh một đoạn rồi dừng.",
  ly: "Bàn tay nhấc ly lên rồi đặt xuống.",
  sua: "Sữa trắng được rót vào ly.",
  banh: "Bàn tay nhấc chiếc bánh rồi đặt lại.",
  gau: "Gấu bông được ôm nhẹ rồi thả lỏng.",
  meo: "Mèo chớp mắt và ve vẩy đuôi.",
  cho: "Chó ngồi và vẫy đuôi.",
  ca: "Cá quẫy đuôi và vây để bơi.",
  ga: "Gà cúi đầu mổ rồi ngẩng lên.",
  chim: "Chim mở và khép đôi cánh trên cành.",
  di: "Bé bước đi, tay và chân luân phiên.",
  ngoi: "Bé hạ người ngồi xuống ghế.",
  dung: "Bé từ tư thế ngồi đứng dậy.",
  lay: "Bé lấy khối đồ chơi từ dưới sàn.",
  dua: "Bé đưa khối đồ chơi cho người đối diện.",
  mo: "Bé mở nắp hộp, kết thúc khi hộp mở.",
  dong: "Bé đóng nắp hộp, kết thúc khi hộp đóng."
};
const categories = {
  "cat-family": "Gia đình",
  "cat-needs": "Nhu cầu",
  "cat-objects": "Đồ vật",
  "cat-animals": "Con vật",
  "cat-actions": "Hành động"
};
const seed = fs
  .readFileSync(path.join(root, "src/data/seedData.ts"), "utf8")
  .split("export const seedLearningItems")[1]
  .split("export const seedDecks")[0];
const words = [...seed.matchAll(/\{ id: "([^"]+)", title: "([^"]+)", categoryId: "([^"]+)"/g)].map(
  (match) => ({ id: match[1], key: match[1].slice(5), title: match[2], categoryId: match[3] })
);
assert.equal(words.length, 29, "Expected the complete 29-word seed library");
const initialPrompts = read("prompts.json").prompts.filter((p) =>
  ["ca-v2-sheet.png", "chim-v2-sheet.png", "uong-v2-sheet.png"].includes(p.target)
);
const batch = read("generation-plan.json").specs;
const prompts = [
  ...initialPrompts,
  ...batch.map((spec) => ({
    target: spec.target,
    reference: spec.reference,
    referenceRole: spec.intent === "style" ? "style" : "edit-target",
    prompt: spec.prompt
  }))
];
assert.equal(new Set(prompts.map((p) => p.target)).size, words.length);
const assets = words.map((word) => {
  const file = `${word.key}-v2-sheet.png`;
  const prompt = prompts.find((p) => p.target === file);
  assert.ok(prompt, `Missing prompt for ${word.title}`);
  const assetPath = path.join(directory, file);
  const bytes = fs.readFileSync(assetPath);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `Not PNG: ${file}`);
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20);
  assert.equal(width, height * 2, `Expected 2:1 eight-frame atlas: ${file}`);
  return {
    ...word,
    category: categories[word.categoryId],
    description: descriptions[word.key],
    file,
    sha256: sha256(assetPath),
    width,
    height,
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDurationMs: 375,
    reference: prompt.reference,
    referenceSha256: sha256(path.join(root, prompt.reference)),
    referenceRole: prompt.referenceRole ?? "edit-target",
    reviewStatus: "pending",
    staticFallbackFrame: ["ngoi", "dung", "lay", "dua", "mo", "dong"].includes(word.key) ? 7 : 0
  };
});
write("prompts.json", {
  tool: "built-in image_gen",
  transparent_background: false,
  createdAt: "2026-10-30",
  prompts
});
write("manifest.json", {
  version: 2,
  createdAt: "2026-10-30",
  tool: "built-in image_gen",
  model: null,
  status: "candidate",
  reviewer: null,
  reviewedAt: null,
  rightsReview: "pending",
  appIntegration: "local-sample-runtime-C23",
  expectedWordCount: words.length,
  assets
});
const cards = assets
  .map(
    (a) =>
      `<article data-item-id="${a.id}" data-title="${escapeHtml(a.title)}" data-category="${a.categoryId}" data-sprite="${a.file}" data-rest-frame="${a.staticFallbackFrame}"><div class="sprite" role="img" aria-label="${escapeHtml(a.description)}"></div><div class="details"><span class="category">${a.category}</span><h2>${escapeHtml(a.title)}</h2><p>${escapeHtml(a.description)}</p><button type="button" aria-label="Xem chuyển động: ${escapeHtml(a.title)}" aria-pressed="false">Xem chuyển động</button><span class="status" aria-live="polite">Ảnh tĩnh · sẵn sàng xem</span></div></article>`
  )
  .join("\n");
const options = Object.entries(categories)
  .map(([id, label]) => `<option value="${id}">${label}</option>`)
  .join("");
fs.writeFileSync(
  path.join(directory, "review.html"),
  `<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>KidEDU · 29 hình chuyển động</title><link rel="stylesheet" href="review.css"></head><body><main><div class="brand">KidEDU · Gentle Growth</div><h1>29 từ mẫu, 29 hình chuyển động</h1><p class="intro">Mỗi từ có một chuyển động minh hoạ ngắn, chạy một lượt khoảng 3 giây rồi dừng. Chọn từng hình để xem; không có âm thanh.</p><div class="filters"><label>Tìm từ<input id="search" type="search" placeholder="Ví dụ: uống, chim, mở…" autocomplete="off"></label><label>Nhóm từ<select id="category"><option value="all">Tất cả nhóm</option>${options}</select></label></div><label class="setting"><input id="static-mode" type="checkbox"> Giảm chuyển động · chỉ xem ảnh tĩnh</label><p id="result-count" aria-live="polite">29/29 từ mẫu</p><div class="grid">${cards}</div><p id="empty" hidden>Không có từ phù hợp. Hãy thử tìm từ khác.</p><p class="notice">Bộ frame đã nối vào màn học mẫu để kiểm tra theo yêu cầu của phụ huynh. Duyệt nội dung cho bản phát hành vẫn cần hoàn tất. Chuyển động dừng trước lượt nghe/nói và khi rời màn hình học.</p></main><script src="review.js"></script></body></html>`
);
console.log(
  `Built complete review: ${assets.length} words, ${assets.length * 8} frames; hashes and prompts recorded`
);

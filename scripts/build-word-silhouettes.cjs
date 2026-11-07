// Convert the existing transparent sprite's first-frame alpha to SVG geometry.
// No raster assets are modified. Run with Node; no image-processing dependency.
const fs = require("node:fs");
const { Buffer } = require("node:buffer");
const path = require("node:path");
const zlib = require("node:zlib");
const root = path.resolve(__dirname, "..");
function decode(file) {
  const data = fs.readFileSync(file);
  const width = data.readUInt32BE(16),
    height = data.readUInt32BE(20);
  if (data[24] !== 8 || data[25] !== 6 || data[28] !== 0)
    throw new Error("Expected noninterlaced RGBA8 PNG");
  const chunks = [];
  for (let p = 8; p < data.length;) {
    const length = data.readUInt32BE(p);
    if (data.toString("ascii", p + 4, p + 8) === "IDAT")
      chunks.push(data.subarray(p + 8, p + 8 + length));
    p += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks)),
    stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const b = y ? pixels[(y - 1) * stride + x] : 0;
      const c = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      else if (filter === 2) predictor = b;
      else if (filter === 3) predictor = Math.floor((a + b) / 2);
      else if (filter === 4) {
        const base = a + b - c,
          pa = Math.abs(base - a),
          pb = Math.abs(base - b),
          pc = Math.abs(base - c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error("Unknown PNG filter");
      pixels[y * stride + x] = (raw[p++] + predictor) & 255;
    }
  }
  return { pixels, width, height };
}
function trace(file) {
  const { pixels, width, height } = decode(file);
  const n = 160,
    mask = new Uint8Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const px = Math.floor(((x + 0.5) * width) / (2 * n)),
        py = Math.floor(((y + 0.5) * height) / (2 * n));
      mask[y * n + x] = pixels[(py * width + px) * 4 + 3] >= 96 ? 1 : 0;
    }
  // Keep only the object, excluding disconnected speckles/drop shadows.
  const visited = new Uint8Array(n * n);
  let largest = [];
  const neighbors = (i) =>
    [
      i % n ? i - 1 : -1,
      i % n < n - 1 ? i + 1 : -1,
      i >= n ? i - n : -1,
      i < n * (n - 1) ? i + n : -1
    ].filter((i) => i >= 0);
  for (let i = 0; i < mask.length; i++)
    if (mask[i] && !visited[i]) {
      const region = [i];
      visited[i] = 1;
      for (let j = 0; j < region.length; j++)
        for (const next of neighbors(region[j]))
          if (mask[next] && !visited[next]) {
            visited[next] = 1;
            region.push(next);
          }
      if (region.length > largest.length) largest = region;
    }
  mask.fill(0);
  largest.forEach((i) => {
    mask[i] = 1;
  });
  // Fill internal holes; a shadow describes the external outline, not glass highlights.
  const outside = new Uint8Array(n * n),
    queue = [];
  for (let i = 0; i < mask.length; i++)
    if ((i < n || i >= n * (n - 1) || i % n === 0 || i % n === n - 1) && !mask[i]) {
      outside[i] = 1;
      queue.push(i);
    }
  for (let j = 0; j < queue.length; j++)
    for (const next of neighbors(queue[j]))
      if (!mask[next] && !outside[next]) {
        outside[next] = 1;
        queue.push(next);
      }
  for (let i = 0; i < mask.length; i++) if (!outside[i]) mask[i] = 1;
  const edges = new Map();
  const add = (x, y, xx, yy) => edges.set(`${x},${y}`, [xx, yy]);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (mask[y * n + x]) {
        if (!y || !mask[(y - 1) * n + x]) add(x, y, x + 1, y);
        if (x === n - 1 || !mask[y * n + x + 1]) add(x + 1, y, x + 1, y + 1);
        if (y === n - 1 || !mask[(y + 1) * n + x]) add(x + 1, y + 1, x, y + 1);
        if (!x || !mask[y * n + x - 1]) add(x, y + 1, x, y);
      }
  const start = edges.keys().next().value,
    points = [start.split(",").map(Number)];
  let key = start;
  do {
    const next = edges.get(key);
    if (!next) throw new Error("Broken contour");
    points.push(next);
    key = next.join(",");
  } while (key !== start && points.length <= edges.size + 1);
  if (key !== start) throw new Error("Unclosed contour");
  const simplified = points.filter((point, i) => {
    if (!i || i === points.length - 1) return true;
    const before = points[i - 1],
      after = points[i + 1];
    return (
      (point[0] - before[0]) * (after[1] - point[1]) !==
      (point[1] - before[1]) * (after[0] - point[0])
    );
  });
  return (
    simplified.map((p, i) => `${i ? "L" : "M"}${p.map((v) => (v * 100) / n).join(" ")}`).join("") +
    "Z"
  );
}
const result = {};
for (const [id, file] of Object.entries({
  bong: "ball",
  gau: "bear",
  xe: "car",
  banh: "cake",
  sua: "milk"
}))
  result[`item-${id}`] = trace(path.join(root, `assets/word-game-art/${file}-v1.png`));
const output = path.join(root, "src/features/practice/wordSilhouettes.generated.json");
const generated = JSON.stringify(result, null, 2) + "\n";
if (process.argv.includes("--check")) {
  require("node:assert/strict").equal(
    fs.readFileSync(output, "utf8").replaceAll("\r\n", "\n"),
    generated
  );
  console.log("Five checked-in contours match the source sprite alpha.");
} else {
  fs.writeFileSync(output, generated);
  console.log("Traced five sprite first-frame outlines; source rasters unchanged.");
}

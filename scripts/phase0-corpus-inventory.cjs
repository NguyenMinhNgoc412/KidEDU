const fs = require("node:fs");
const path = require("node:path");

// Only inspect the public default-media tree. Research and family media are excluded.
const root = path.resolve(__dirname, "../assets/default-media");
const extensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp3",
  ".m4a",
  ".wav",
  ".mp4",
  ".json"
]);
const files = [];

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      files.push({
        path: path.relative(root, absolute).replaceAll("\\", "/"),
        bytes: fs.statSync(absolute).size,
        type: path.extname(entry.name).toLowerCase()
      });
    }
  }
}

visit(root);
files.sort((a, b) => a.path.localeCompare(b.path));
const byType = {};
for (const file of files) {
  const total = byType[file.type] ?? { count: 0, bytes: 0 };
  total.count += 1;
  total.bytes += file.bytes;
  byType[file.type] = total;
}
process.stdout.write(
  `${JSON.stringify({ root: "assets/default-media", count: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0), byType, files }, null, 2)}\n`
);

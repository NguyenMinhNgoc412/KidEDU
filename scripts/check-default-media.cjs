const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const defaultMediaRoot = path.join(projectRoot, "assets", "default-media");
const registryPath = path.join(projectRoot, "src", "data", "defaultMediaRegistry.ts");
const requireVideo = process.argv.includes("--require-video");
const supportedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".m4a",
  ".mp3",
  ".mp4",
  ".png",
  ".wav",
  ".webp"
]);

const registry = loadTypeScriptRegistry(registryPath);
const definitions = registry.bundledDefaultMedia;
const errors = registry.validateBundledDefaultMediaDefinitions(definitions);
const registeredFiles = new Set();
let totalBytes = 0;
let videoCount = 0;

if (registry.bundledCelebrationSoundModule) {
  const soundPath = path.join(defaultMediaRoot, "sounds", "kidedu-congratulations.mp3");
  if (fs.existsSync(soundPath)) {
    registeredFiles.add("sounds/kidedu-congratulations.mp3");
    totalBytes += fs.statSync(soundPath).size;
  }
}

for (const definition of definitions) {
  if (definition.role === "mouth_video") {
    videoCount += 1;
  }

  for (const [fileRole, file] of [
    ["asset", definition.asset],
    ["thumbnail", definition.thumbnail]
  ]) {
    if (!file) {
      continue;
    }

    if (typeof file.module !== "string" || /^https?:\/\//i.test(file.module)) {
      errors.push(
        `Default media ${definition.itemId}:${definition.role} ${fileRole} did not resolve to a local file`
      );
      continue;
    }

    const absolutePath = path.resolve(file.module);
    if (!isPathInside(defaultMediaRoot, absolutePath)) {
      errors.push(`Bundled file is outside assets/default-media: ${absolutePath}`);
      continue;
    }

    if (!fs.existsSync(absolutePath)) {
      errors.push(`Bundled file does not exist: ${absolutePath}`);
      continue;
    }

    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      errors.push(`Bundled media path is not a file: ${absolutePath}`);
      continue;
    }

    registeredFiles.add(normalizeRelativePath(absolutePath));
    totalBytes += stats.size;

    if (fileRole === "asset" && definition.sizeBytes && definition.sizeBytes !== stats.size) {
      errors.push(
        `Default media ${definition.itemId}:${definition.role} sizeBytes is ${definition.sizeBytes}, actual file is ${stats.size}`
      );
    }
  }
}

for (const relativePath of listMediaFiles(defaultMediaRoot)) {
  if (!registeredFiles.has(relativePath)) {
    errors.push(`Media file is not registered in defaultMediaRegistry: ${relativePath}`);
  }
}

if (requireVideo && videoCount === 0) {
  errors.push("Production default media check requires at least one bundled mouth video");
}

if (errors.length > 0) {
  console.error("Bundled default media check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Bundled default media OK: ${videoCount} video(s), ${registeredFiles.size} file(s), ${formatBytes(totalBytes)}`
  );
}

function loadTypeScriptRegistry(filePath) {
  const originalExtensions = new Map();
  for (const extension of supportedExtensions) {
    originalExtensions.set(extension, require.extensions[extension]);
    require.extensions[extension] = (module, filename) => {
      module.exports = filename;
    };
  }

  try {
    const source = fs.readFileSync(filePath, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020
      },
      fileName: filePath
    });
    const registryModule = new Module(filePath, module);
    registryModule.filename = filePath;
    registryModule.paths = Module._nodeModulePaths(path.dirname(filePath));
    registryModule._compile(compiled.outputText, filePath);
    return registryModule.exports;
  } finally {
    for (const [extension, handler] of originalExtensions) {
      if (handler) {
        require.extensions[extension] = handler;
      } else {
        delete require.extensions[extension];
      }
    }
  }
}

function listMediaFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMediaFiles(absolutePath));
      continue;
    }

    if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(normalizeRelativePath(absolutePath));
    }
  }
  return files;
}

function normalizeRelativePath(absolutePath) {
  return path.relative(defaultMediaRoot, absolutePath).split(path.sep).join("/");
}

function isPathInside(parent, target) {
  const relative = path.relative(parent, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

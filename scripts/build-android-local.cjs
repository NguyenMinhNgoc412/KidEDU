const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const production = process.argv.includes("--production");
const checkOnly = process.argv.includes("--check");
if (production) {
  for (const name of [
    "KIDEDU_ANDROID_KEYSTORE",
    "KIDEDU_ANDROID_STORE_PASSWORD",
    "KIDEDU_ANDROID_KEY_ALIAS",
    "KIDEDU_ANDROID_KEY_PASSWORD"
  ]) {
    if (!process.env[name]) throw new Error(`Missing signing configuration: ${name}`);
  }
  if (!fs.existsSync(path.resolve(process.env.KIDEDU_ANDROID_KEYSTORE)))
    throw new Error("Signing keystore not found");
  process.env.KIDEDU_ANDROID_KEYSTORE = path.resolve(process.env.KIDEDU_ANDROID_KEYSTORE);
}
if (checkOnly) {
  console.log("Local Android build configuration checked; no build executed");
  process.exit(0);
}
function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
run("pnpm", ["exec", "expo", "prebuild", "--platform", "android", "--no-install"], root);
const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const args = production
  ? [":app:bundleRelease", "--init-script", path.join(__dirname, "android-release.gradle")]
  : [":app:assembleDebug"];
run(gradle, args, path.join(root, "android"));

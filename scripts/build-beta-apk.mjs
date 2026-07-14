#!/usr/bin/env node
/**
 * Build APK bêta (Gradle release) et copie vers website/public/downloads/.
 * Usage : npm run android:apk:beta
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const androidDir = resolve(root, "android");
const outputDir = resolve(root, "website/public/downloads");
const outputApk = resolve(outputDir, "proday-beta.apk");

const androidHome =
  process.env.ANDROID_HOME?.trim() ||
  process.env.ANDROID_SDK_ROOT?.trim() ||
  resolve(process.env.HOME ?? "", "Library/Android/sdk");

const localProperties = resolve(androidDir, "local.properties");
if (!existsSync(localProperties) && existsSync(androidHome)) {
  writeFileSync(localProperties, `sdk.dir=${androidHome}\n`, "utf8");
}

const gradleApkCandidates = [
  resolve(androidDir, "app/build/outputs/apk/release/app-release.apk"),
  resolve(androidDir, "app/build/outputs/apk/release/app-release-unsigned.apk"),
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: root,
    env: {
      ...process.env,
      EXPO_PUBLIC_APP_ENV: "production",
      EXPO_PUBLIC_V3_SHELL: "1",
    },
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n📱 ProDay — build APK bêta\n");

run(resolve(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew"), [
  "assembleRelease",
  "--no-daemon",
], { cwd: androidDir });

const builtApk = gradleApkCandidates.find((path) => existsSync(path));
if (!builtApk) {
  console.error("❌ APK introuvable après assembleRelease.");
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(builtApk, outputApk);

const sizeMb = (statSync(outputApk).size / (1024 * 1024)).toFixed(1);
console.log(`\n✅ APK copié → website/public/downloads/proday-beta.apk (${sizeMb} Mo)`);
console.log("   Déployez le site : cd website && npm run netlify:deploy\n");

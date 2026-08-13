#!/usr/bin/env node
/**
 * Build APK bêta (Gradle release) et copie vers website/public/downloads/.
 * Usage : npm run android:apk:beta
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const androidDir = resolve(root, "android");
const outputDir = resolve(root, "website/public/downloads");
const outputApk = resolve(outputDir, "proday-beta.apk");

/** Charge KEY=VALUE depuis un fichier .env (sans override des vars déjà définies). */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const raw of readFileSync(filePath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || !String(process.env[key] ?? "").trim()) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(root, ".env"));
loadEnvFile(resolve(root, ".env.eas-preview"));
loadEnvFile(resolve(root, ".env.local"));

const androidHome =
  process.env.ANDROID_HOME?.trim() ||
  process.env.ANDROID_SDK_ROOT?.trim() ||
  resolve(process.env.HOME ?? "", "Library/Android/sdk");

/** JDK 17 requis pour CMake/NDK (JDK 24+ casse configureCMakeRelWithDebInfo). */
const jdk17Home = "/opt/homebrew/opt/openjdk@17";
const jdk17Java = resolve(jdk17Home, "bin/java");
const envJavaHome = process.env.JAVA_HOME?.trim();
const javaHome = existsSync(jdk17Java)
  ? jdk17Home
  : envJavaHome || undefined;

if (envJavaHome && envJavaHome !== javaHome) {
  console.log(`⚠️  JAVA_HOME système ignoré (${envJavaHome}) → forcé JDK 17`);
}

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
      ...(javaHome ? { JAVA_HOME: javaHome } : {}),
      ...(javaHome
        ? { PATH: `${resolve(javaHome, "bin")}:${process.env.PATH ?? ""}` }
        : {}),
      ANDROID_HOME: process.env.ANDROID_HOME || androidHome,
      ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || androidHome,
      EXPO_PUBLIC_APP_ENV: "production",
      EXPO_PUBLIC_V3_SHELL: "1",
    },
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n📱 ProDay — build APK bêta (v1.0.7 / versionCode 8)\n");
if (javaHome) console.log(`JAVA_HOME=${javaHome}`);
console.log(`ANDROID_HOME=${androidHome}\n`);

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
console.log("   Déployez le site : cd website && npm run netlify:deploy");
console.log("   Ou publiez Storage : npm run android:apk:publish\n");

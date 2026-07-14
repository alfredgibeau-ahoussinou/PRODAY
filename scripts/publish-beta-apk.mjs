#!/usr/bin/env node
/**
 * Publie l'APK bêta sur Firebase Storage et affiche l'URL publique.
 * Usage : npm run android:apk:publish
 */
import { createReadStream, existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const LOCAL_APK = resolve(root, "website/public/downloads/proday-beta.apk");
const STORAGE_PATH = "beta/proday-beta.apk";

function findServiceAccount() {
  const firebaseDir = resolve(root, "firebase");
  const found = readdirSync(firebaseDir).find(
    (f) => f.includes("adminsdk") && f.endsWith(".json"),
  );
  if (!found) throw new Error("Clé Admin SDK introuvable dans firebase/");
  return resolve(firebaseDir, found);
}

function loadBucket() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return "";
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=(.*)$/);
    if (m) return m[1].trim();
  }
  return "";
}

async function main() {
  if (!existsSync(LOCAL_APK)) {
    console.error("❌ APK introuvable. Lancez d'abord : npm run android:apk:beta");
    process.exit(1);
  }

  const bucketName = loadBucket();
  if (!bucketName) {
    console.error("❌ EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET absent du .env");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(findServiceAccount(), "utf8"));
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName,
    });
  }

  const bucket = getStorage().bucket();
  const file = bucket.file(STORAGE_PATH);

  console.log(`\n📤 Upload → gs://${bucketName}/${STORAGE_PATH}\n`);

  await new Promise((resolvePromise, reject) => {
    createReadStream(LOCAL_APK)
      .pipe(
        file.createWriteStream({
          metadata: {
            contentType: "application/vnd.android.package-archive",
            cacheControl: "public, max-age=3600",
          },
          resumable: true,
        }),
      )
      .on("error", reject)
      .on("finish", resolvePromise);
  });

  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${STORAGE_PATH}`;
  console.log(`✅ APK publié : ${publicUrl}\n`);
  console.log(
    "Ajoutez dans Netlify (ou netlify.toml) :\n" +
      `NEXT_PUBLIC_BETA_APK_URL=${publicUrl}\n`,
  );
}

main().catch((err) => {
  console.error("❌", err.message ?? err);
  process.exit(1);
});

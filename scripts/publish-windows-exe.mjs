#!/usr/bin/env node
/**
 * Publie l'exécutable Windows (.exe) sur Firebase Storage.
 * Usage : node scripts/publish-windows-exe.mjs
 */
import { createReadStream, existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const LOCAL_ZIP = resolve(root, "desktop/dist/ProDay-Windows-PC.zip");
const STORAGE_PATH = "beta/ProDay-Windows-PC.zip";

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
  if (!existsSync(LOCAL_ZIP)) {
    console.error("❌ Fichier ZIP introuvable.");
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

  console.log(`\n📤 Upload Windows PC ZIP (contenant l'app ProDay.exe) → gs://${bucketName}/${STORAGE_PATH}\n`);

  await new Promise((res, rej) => {
    createReadStream(LOCAL_ZIP)
      .pipe(
        file.createWriteStream({
          metadata: {
            contentType: "application/zip",
            metadata: {
              version: "1.0.0",
              uploadedAt: new Date().toISOString(),
            },
          },
        }),
      )
      .on("error", rej)
      .on("finish", res);
  });

  await file.makePublic().catch(() => {});

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${STORAGE_PATH}`;
  console.log("✅ Fichier Windows publié avec succès !");
  console.log(`   URL directe : ${publicUrl}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

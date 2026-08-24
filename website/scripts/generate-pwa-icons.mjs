/**
 * Génère favicon + icônes PWA à partir du lockup officiel ProDay (P + PRODAY + tagline).
 * Usage : node scripts/generate-pwa-icons.mjs
 *
 * Source : assets/branding/proday-lockup-official-source.png (ou proday-app-icon.png).
 * Fallback symbole seul si lockup absent.
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const repoRoot = resolve(root, "..");
const iconsDir = resolve(root, "public/icons");

const LOCKUP_SOURCE = resolve(repoRoot, "assets/branding/proday-lockup-official-source.png");
const LOCKUP_APP_ICON = resolve(repoRoot, "assets/branding/proday-app-icon.png");
const MARK_FALLBACK = resolve(root, "public/branding/logo-proday-mark.png");

const lockupPath = [LOCKUP_SOURCE, LOCKUP_APP_ICON].find((p) => existsSync(p)) ?? null;

mkdirSync(iconsDir, { recursive: true });

function pngBuffersToIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + count * 16;
  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

/** Icône carrée depuis le lockup officiel (store / favicon). */
async function makeIconFromLockup(size) {
  return sharp(lockupPath)
    .resize(size, size, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .png()
    .toBuffer();
}

/** Fallback : symbole seul sur fond noir arrondi. */
async function makeAppIconFromMark(markWhite, size, radiusRatio = 0.22) {
  const padR = Math.round(size * 0.18);
  const maxSide = size - padR * 2;
  const mark = await sharp(markWhite)
    .resize({ width: maxSide, height: maxSide, fit: "inside" })
    .toBuffer();
  const mm = await sharp(mark).metadata();
  const left = Math.round((size - mm.width) / 2);
  const top = Math.round((size - mm.height) / 2);
  const r = Math.round(size * radiusRatio);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#000000"/></svg>`,
  );
  return sharp(svg)
    .composite([{ input: mark, left, top }])
    .png()
    .toBuffer();
}

async function makeIcon(size, markWhite) {
  if (lockupPath) return makeIconFromLockup(size);
  if (!markWhite) {
    console.error("Manquant:", MARK_FALLBACK);
    console.error("Lancez d’abord: node scripts/generate-official-brand.mjs");
    process.exit(1);
  }
  return makeAppIconFromMark(markWhite, size);
}

const markWhite = existsSync(MARK_FALLBACK)
  ? await sharp(MARK_FALLBACK).png().toBuffer()
  : null;

if (lockupPath) {
  console.log("Source lockup:", lockupPath.replace(repoRoot + "/", ""));
} else {
  console.warn("Lockup absent — fallback symbole seul");
}

for (const size of [96, 128, 192, 256, 384, 512]) {
  await sharp(await makeIcon(size, markWhite)).toFile(
    resolve(iconsDir, `icon-${size}.png`),
  );
}
await sharp(await makeIcon(512, markWhite)).toFile(
  resolve(iconsDir, "icon-512-maskable.png"),
);
await sharp(await makeIcon(192, markWhite)).toFile(resolve(root, "src/app/icon.png"));
await sharp(await makeIcon(180, markWhite)).toFile(
  resolve(root, "src/app/apple-icon.png"),
);

const ico = pngBuffersToIco([
  await makeIcon(16, markWhite),
  await makeIcon(32, markWhite),
  await makeIcon(48, markWhite),
]);
writeFileSync(resolve(root, "src/app/favicon.ico"), ico);
writeFileSync(resolve(root, "public/favicon.ico"), ico);

console.log("OK — lockup officiel ProDay (favicon + PWA)");

/**
 * Génère favicon + icônes PWA à partir du symbole officiel ProDay.
 * Usage : node scripts/generate-pwa-icons.mjs
 * Préférer : node scripts/generate-official-brand.mjs (régénère aussi le mark).
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const markPath = resolve(root, "public/branding/logo-proday-mark.png");
const iconsDir = resolve(root, "public/icons");

if (!existsSync(markPath)) {
  console.error("Manquant:", markPath);
  console.error("Lancez d’abord: node scripts/generate-official-brand.mjs");
  process.exit(1);
}

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

async function makeAppIcon(markWhite, size, radiusRatio = 0.22) {
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

const markWhite = await sharp(markPath).png().toBuffer();

for (const size of [96, 128, 192, 256, 384, 512]) {
  await sharp(await makeAppIcon(markWhite, size)).toFile(
    resolve(iconsDir, `icon-${size}.png`),
  );
}
await sharp(await makeAppIcon(markWhite, 512)).toFile(
  resolve(iconsDir, "icon-512-maskable.png"),
);
await sharp(await makeAppIcon(markWhite, 192)).toFile(resolve(root, "src/app/icon.png"));
await sharp(await makeAppIcon(markWhite, 180, 0.2)).toFile(
  resolve(root, "src/app/apple-icon.png"),
);

const ico = pngBuffersToIco([
  await makeAppIcon(markWhite, 16, 0.25),
  await makeAppIcon(markWhite, 32, 0.22),
  await makeAppIcon(markWhite, 48, 0.22),
]);
writeFileSync(resolve(root, "src/app/favicon.ico"), ico);
writeFileSync(resolve(root, "public/favicon.ico"), ico);

console.log("OK — symbole ProDay (favicon + PWA)");

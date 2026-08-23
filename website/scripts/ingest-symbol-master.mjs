/**
 * Ingestion du symbole officiel HD (blanc sur fond noir) → assets website.
 *
 * Usage: node scripts/ingest-symbol-master.mjs [chemin-master]
 * Défaut: public/branding/logo-proday-symbol-master.png
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "public/branding");
const iconsDir = resolve(root, "public/icons");
const texturesDir = resolve(root, "public/textures");

const masterArg = process.argv[2];
const MASTER = masterArg
  ? resolve(process.cwd(), masterArg)
  : resolve(outDir, "logo-proday-symbol-master.png");

/** Accents pôle — planche brand (alignés app prodayBrand). */
const POLE_HEX = {
  joueur: "#FFFFFF",
  coach: "#E8B923",
  club: "#2563EB",
  president: "#E8B923",
  parent: "#84CC16",
  supporter: "#8B5CF6",
  sponsor: "#EF4444",
  admin: "#A3A3A3",
  evenements: "#F97316",
};

/** Détourage fond noir → symbole blanc transparent. */
async function extractWhiteMark(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const o = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const alpha =
      lum <= 18 ? 0 : lum >= 240 ? 255 : Math.round(((lum - 18) / (240 - 18)) * 255);
    o[i] = 255;
    o[i + 1] = 255;
    o[i + 2] = 255;
    o[i + 3] = alpha;
  }

  return sharp(o, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
}

async function recolor(buf, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    o[i] = r;
    o[i + 1] = g;
    o[i + 2] = b;
    o[i + 3] = data[i + 3];
  }
  return sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

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

async function makeSoccerLogoBadge(markWhite) {
  const size = 1024;
  const disc = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <radialGradient id="g" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stop-color="#f4f4f5"/>
          <stop offset="55%" stop-color="#e4e4e7"/>
          <stop offset="100%" stop-color="#a1a1aa"/>
        </radialGradient>
      </defs>
      <circle cx="512" cy="512" r="500" fill="url(#g)"/>
      <circle cx="512" cy="512" r="468" fill="#0a0a0a"/>
    </svg>`,
  );
  const mark = await sharp(markWhite)
    .resize({ width: 520, height: 520, fit: "inside" })
    .toBuffer();
  const mm = await sharp(mark).metadata();
  const left = Math.round((size - mm.width) / 2);
  const top = Math.round((size - mm.height) / 2);
  return sharp(disc)
    .composite([{ input: mark, left, top }])
    .png()
    .toBuffer();
}

/** Lockup OG paddé : symbole + wordmark SVG. */
async function makeOfficialLockup(markWhite) {
  const mm = await sharp(markWhite).metadata();
  const markH = 92;
  const markBuf = await sharp(markWhite)
    .resize({ height: markH, fit: "inside" })
    .toBuffer();
  const mb = await sharp(markBuf).metadata();
  const padX = 48;
  const padY = 40;
  const gap = 20;
  const textW = 420;
  const canvasW = padX + mb.width + gap + textW + padX;
  const canvasH = padY + markH + padY;
  const textY = padY + Math.round(markH * 0.62);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}">
      <rect width="100%" height="100%" fill="#000000"/>
      <text x="${padX + mb.width + gap}" y="${textY}"
        font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="72"
        fill="#FFFFFF" letter-spacing="4">PRODAY</text>
    </svg>`,
  );
  return sharp(svg)
    .composite([{ input: markBuf, left: padX, top: padY + Math.round((markH - mb.height) / 2) }])
    .png()
    .toBuffer();
}

async function writePng(name, buf) {
  const path = resolve(outDir, name);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(path);
  const m = await sharp(buf).metadata();
  console.log("✓", name, `${m.width}×${m.height}`);
  return m;
}

async function main() {
  if (!existsSync(MASTER)) {
    console.error("Master introuvable:", MASTER);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  mkdirSync(iconsDir, { recursive: true });
  mkdirSync(texturesDir, { recursive: true });

  console.log("Source:", MASTER);
  const markWhite = await extractWhiteMark(MASTER);
  const meta = await writePng("logo-proday-mark.png", markWhite);

  const markBlack = await recolor(markWhite, "#000000");
  await writePng("logo-proday-mark-black.png", markBlack);

  // Masters publics (aliases stables)
  await writePng("proday-symbol-white.png", markWhite);
  await writePng("proday-symbol-black.png", markBlack);

  const markGold = await recolor(markWhite, "#E8B923");
  await writePng("logo-proday-mark-gold.png", markGold);
  await writePng("logo-proday-mark-blue.png", markGold);

  const official = await makeOfficialLockup(markWhite);
  const officialMeta = await writePng("logo-proday-official.png", official);
  await sharp(official).webp({ quality: 92 }).toFile(resolve(outDir, "logo-proday-official.webp"));
  console.log("✓ logo-proday-official.webp");

  // Dimensions pour brandingAssets.ts
  console.log("\n--- ratios ---");
  console.log("PRODAY_MARK_ASPECT:", meta.width / meta.height);
  console.log("PRODAY_OFFICIAL_LOGO_ASPECT:", officialMeta.width / officialMeta.height);

  for (const [name, hex] of Object.entries(POLE_HEX)) {
    const tinted = await recolor(markWhite, hex);
    await writePng(`logo-proday-mark-${name}.png`, tinted);
  }

  const pictoAliases = {
    "logo-man-picto.png": "joueur",
    "logo-homme-picto.png": "joueur",
    "logo-amateur-picto.png": "joueur",
    "logo-pro-picto.png": "club",
    "logo-supporter-picto.png": "supporter",
    "logo-sponsor-picto.png": "sponsor",
    "logo-sante-picto.png": "parent",
    "logo-woman-picto.png": "joueur",
  };
  for (const [file, pole] of Object.entries(pictoAliases)) {
    await writePng(file, await recolor(markWhite, POLE_HEX[pole]));
  }

  for (const size of [96, 128, 192, 256, 384, 512]) {
    await sharp(await makeAppIcon(markWhite, size)).toFile(resolve(iconsDir, `icon-${size}.png`));
  }
  await sharp(await makeAppIcon(markWhite, 512)).toFile(resolve(iconsDir, "icon-512-maskable.png"));
  await sharp(await makeAppIcon(markWhite, 192)).toFile(resolve(root, "src/app/icon.png"));
  await sharp(await makeAppIcon(markWhite, 180, 0.2)).toFile(resolve(root, "src/app/apple-icon.png"));

  const ico = pngBuffersToIco([
    await makeAppIcon(markWhite, 16, 0.25),
    await makeAppIcon(markWhite, 32, 0.22),
    await makeAppIcon(markWhite, 48, 0.22),
  ]);
  writeFileSync(resolve(root, "src/app/favicon.ico"), ico);
  writeFileSync(resolve(root, "public/favicon.ico"), ico);
  console.log("✓ favicon + PWA icons");

  await sharp(await makeSoccerLogoBadge(markWhite)).toFile(
    resolve(texturesDir, "soccer_logo_badge.png"),
  );
  console.log("✓ textures/soccer_logo_badge.png");

  console.log("\nOK — symbole officiel HD ingéré");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

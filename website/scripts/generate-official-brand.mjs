/**
 * Synchronise l’identité officielle ProDay sur le site depuis assets/branding/
 * (symbole + lockup masters — pas la planche entière).
 *
 * Usage: node scripts/generate-official-brand.mjs
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const repoRoot = resolve(root, "..");
const masterDir = resolve(repoRoot, "assets/branding");
const outDir = resolve(root, "public/branding");
const iconsDir = resolve(root, "public/icons");
const texturesDir = resolve(root, "public/textures");

const MASTER_SYMBOL = resolve(masterDir, "proday-symbol-white.png");
const MASTER_LOCKUP = resolve(masterDir, "proday-logo-master-white.png");
const MASTER_OFFICIAL = resolve(masterDir, "logo-proday-official.png");
const MASTER_SYMBOL_BLACK = resolve(masterDir, "proday-symbol-black.png");
const MASTER_LOCKUP_BLACK = resolve(masterDir, "proday-logo-master-black.png");

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

/** Badge circulaire 3D (ex-ancien logo coureur). */
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

async function writePng(name, buf) {
  const path = resolve(outDir, name);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(path);
  const m = await sharp(buf).metadata();
  console.log("✓", name, `${m.width}×${m.height}`);
}

async function main() {
  for (const p of [MASTER_SYMBOL, MASTER_LOCKUP]) {
    if (!existsSync(p)) {
      console.error("Master manquant:", p);
      process.exit(1);
    }
  }

  mkdirSync(outDir, { recursive: true });
  mkdirSync(iconsDir, { recursive: true });
  mkdirSync(texturesDir, { recursive: true });

  const markWhite = await sharp(MASTER_SYMBOL).png().toBuffer();
  const lockupWhite = await sharp(MASTER_LOCKUP).png().toBuffer();
  const markBlack = existsSync(MASTER_SYMBOL_BLACK)
    ? await sharp(MASTER_SYMBOL_BLACK).png().toBuffer()
    : await recolor(markWhite, "#000000");
  const lockupBlack = existsSync(MASTER_LOCKUP_BLACK)
    ? await sharp(MASTER_LOCKUP_BLACK).png().toBuffer()
    : await recolor(lockupWhite, "#000000");
  const markGold = await recolor(markWhite, "#E8B923");

  // Masters publics (chemins stables)
  copyFileSync(MASTER_SYMBOL, resolve(outDir, "proday-symbol-white.png"));
  copyFileSync(MASTER_LOCKUP, resolve(outDir, "proday-logo-master-white.png"));
  if (existsSync(MASTER_SYMBOL_BLACK)) {
    copyFileSync(MASTER_SYMBOL_BLACK, resolve(outDir, "proday-symbol-black.png"));
  }
  if (existsSync(MASTER_LOCKUP_BLACK)) {
    copyFileSync(MASTER_LOCKUP_BLACK, resolve(outDir, "proday-logo-master-black.png"));
  }
  console.log("✓ masters copiés depuis assets/branding");

  // Lockup officiel paddé (OG / emails) — sinon lockup transparent
  if (existsSync(MASTER_OFFICIAL)) {
    copyFileSync(MASTER_OFFICIAL, resolve(outDir, "logo-proday-official.png"));
    console.log("✓ logo-proday-official.png (master paddé)");
  } else {
    await writePng("logo-proday-official.png", lockupWhite);
  }

  // Aliases binaires identiques aux masters (pas de ré-encodage)
  const copies = [
    ["logo-proday-lockup-white.png", MASTER_LOCKUP],
    ["logo-proday-lockup-black.png", MASTER_LOCKUP_BLACK],
    ["logo-proday-mark.png", MASTER_SYMBOL],
    ["logo-proday-mark-black.png", MASTER_SYMBOL_BLACK],
    ["logo-mark-white.png", MASTER_SYMBOL],
    ["logo-dark.png", MASTER_LOCKUP],
    ["logo-light.png", MASTER_LOCKUP_BLACK],
    ["logo-transparent-hero.png", MASTER_LOCKUP],
    ["logo-white.png", MASTER_LOCKUP],
    // Anciens logos woman → lockup officiel (plus de pictogramme coureuse)
    ["logo-woman-light.png", MASTER_LOCKUP_BLACK],
    ["logo-woman-white.png", MASTER_LOCKUP],
  ];
  for (const [name, src] of copies) {
    if (!existsSync(src)) {
      console.warn("skip copy (manquant):", name, src);
      continue;
    }
    copyFileSync(src, resolve(outDir, name));
    console.log("✓", name, "(copy master)");
  }

  await writePng("logo-proday-mark-gold.png", markGold);
  // Alias legacy (anciens chemins bleu master)
  await writePng("logo-proday-mark-blue.png", markGold);

  await sharp(lockupWhite).webp({ quality: 92 }).toFile(resolve(outDir, "logo-proday-official.webp"));
  console.log("✓ logo-proday-official.webp");

  for (const [name, hex] of Object.entries(POLE_HEX)) {
    if (name === "evenements") continue;
    const tinted = await recolor(markWhite, hex);
    await writePng(`logo-proday-mark-${name}.png`, tinted);
  }
  await writePng("logo-proday-mark-evenements.png", await recolor(markWhite, POLE_HEX.evenements));

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
    const tinted = await recolor(markWhite, POLE_HEX[pole]);
    await writePng(file, tinted);
  }

  for (const size of [96, 128, 192, 256, 384, 512]) {
    const buf = await makeAppIcon(markWhite, size);
    await sharp(buf).toFile(resolve(iconsDir, `icon-${size}.png`));
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

  const badge = await makeSoccerLogoBadge(markWhite);
  await sharp(badge).toFile(resolve(texturesDir, "soccer_logo_badge.png"));
  console.log("✓ textures/soccer_logo_badge.png (symbole officiel)");

  console.log("OK — identité officielle ProDay synchronisée (symbole + lockup)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

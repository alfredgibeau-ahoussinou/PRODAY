/**
 * Génère les assets identité officielle ProDay (symbole + lockup + favicons + pôles)
 * depuis le master brand (symbole P + wordmark PRODAY).
 *
 * Usage: node scripts/generate-official-brand.mjs [chemin-master.png]
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "public/branding");
const iconsDir = resolve(root, "public/icons");

const DEFAULT_MASTER =
  "/Users/gibeau--ahoussinou/.cursor/projects/Users-gibeau-ahoussinou-PRODAY/assets/image-d7399531-61dd-4a6b-8360-cb24accce56c.png";

const POLE_HEX = {
  joueur: "#1E3AFF",
  coach: "#22C55E",
  club: "#7C3AED",
  president: "#FBBF24",
  parent: "#F97316",
  supporter: "#06B6D4",
  sponsor: "#EF4444",
  admin: "#A3A3A3",
};

function clampCrop(c, w, h) {
  const left = Math.max(0, Math.floor(c.left));
  const top = Math.max(0, Math.floor(c.top));
  const width = Math.min(Math.floor(c.width), w - left);
  const height = Math.min(Math.floor(c.height), h - top);
  if (width < 1 || height < 1) throw new Error(`Bad crop ${JSON.stringify({ left, top, width, height })}`);
  return { left, top, width, height };
}

async function whiteOnTransparent(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * ch];
    const g = data[i * ch + 1];
    const b = data[i * ch + 2];
    const lum = (r + g + b) / 3;
    const a = Math.max(0, Math.min(255, Math.round((lum - 40) * 1.35)));
    out[i * 4] = 255;
    out[i * 4 + 1] = 255;
    out[i * 4 + 2] = 255;
    out[i * 4 + 3] = a;
  }
  return { raw: out, width: w, height: h };
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

async function main() {
  const master = process.argv[2] || DEFAULT_MASTER;
  if (!existsSync(master)) {
    console.error("Master manquant:", master);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  mkdirSync(iconsDir, { recursive: true });

  const { raw, width: w, height: h } = await whiteOnTransparent(master);

  // Bbox mesurée sur le master officiel (symbole + wordmark)
  const pad = 16;
  const fullCrop = clampCrop(
    { left: 195 - pad, top: 143 - pad, width: 830 - 195 + pad * 2, height: 516 - 143 + pad * 2 },
    w,
    h,
  );
  const markCrop = clampCrop(
    { left: 195 - pad, top: 143 - pad, width: 830 - 195 + pad * 2, height: 401 - 143 + pad },
    w,
    h,
  );

  // sharp: ne pas chaîner .trim() après .extract() sur raw (bug extract_area)
  const lockupRaw = await sharp(raw, { raw: { width: w, height: h, channels: 4 } })
    .extract(fullCrop)
    .png()
    .toBuffer();
  const lockupWhite = await sharp(lockupRaw).trim({ threshold: 8 }).png().toBuffer();

  const markRaw = await sharp(raw, { raw: { width: w, height: h, channels: 4 } })
    .extract(markCrop)
    .png()
    .toBuffer();
  const markWhite = await sharp(markRaw).trim({ threshold: 8 }).png().toBuffer();

  const markBlack = await recolor(markWhite, "#000000");
  const lockupBlack = await recolor(lockupWhite, "#000000");
  const markBlue = await recolor(markWhite, "#1E3AFF");

  const assets = [
    ["logo-proday-official.png", lockupWhite],
    ["logo-proday-lockup-white.png", lockupWhite],
    ["logo-proday-lockup-black.png", lockupBlack],
    ["logo-proday-mark.png", markWhite],
    ["logo-proday-mark-black.png", markBlack],
    ["logo-proday-mark-blue.png", markBlue],
    ["logo-mark-white.png", markWhite],
    ["logo-dark.png", lockupWhite],
    ["logo-light.png", lockupBlack],
    ["logo-transparent-hero.png", lockupWhite],
    ["logo-white.png", lockupWhite],
  ];

  for (const [name, buf] of assets) {
    await sharp(buf).png({ compressionLevel: 9 }).toFile(resolve(outDir, name));
    const m = await sharp(buf).metadata();
    console.log("✓", name, `${m.width}×${m.height}`);
  }

  await sharp(lockupWhite).webp({ quality: 92 }).toFile(resolve(outDir, "logo-proday-official.webp"));

  for (const [name, hex] of Object.entries(POLE_HEX)) {
    const tinted = await recolor(markWhite, hex);
    const file = `logo-proday-mark-${name}.png`;
    await sharp(tinted).png({ compressionLevel: 9 }).toFile(resolve(outDir, file));
    console.log("✓", file, hex);
  }

  // Alias pictos legacy → symbole pôle (évite les anciens logos coureur)
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
    await sharp(tinted).png({ compressionLevel: 9 }).toFile(resolve(outDir, file));
    console.log("✓ alias", file, "→", pole);
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

  console.log("OK — identité officielle ProDay (symbole + lockup + favicons)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

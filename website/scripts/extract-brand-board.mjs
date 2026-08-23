/**
 * Extrait symbole + lockups depuis la planche brand ProDay (1024×682).
 * Écrit les masters dans assets/branding/ puis lance generate-official-brand.
 */
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

const boardCandidates = [
  resolve(
    repoRoot,
    "../.cursor/projects/Users-gibeau-ahoussinou-PRODAY/assets/image-49511d70-2301-424a-a062-b9e650cf49eb.png",
  ),
  "/Users/gibeau--ahoussinou/.cursor/projects/Users-gibeau-ahoussinou-PRODAY/assets/image-49511d70-2301-424a-a062-b9e650cf49eb.png",
];

function resolveBoard() {
  for (const p of boardCandidates) {
    if (existsSync(p)) return p;
  }
  throw new Error("Planche brand introuvable");
}

const masterDir = resolve(repoRoot, "assets/branding");

/** Crops calibrés planche 1024×682 — nouveau P + ballon + frappe. */
const CROPS = {
  symbolWhite: { left: 48, top: 48, width: 72, height: 72 },
  lockupNav: { left: 545, top: 52, width: 175, height: 38 },
  lockupOfficial: { left: 545, top: 52, width: 210, height: 72 },
};

async function cropAndTrim(src, region, padding = 8) {
  const buf = await sharp(src).extract(region).trim({ threshold: 10 }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  if (!meta.width || !meta.height) throw new Error("Crop vide");
  return sharp(buf)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function writeMaster(name, buf) {
  const path = resolve(masterDir, name);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(path);
  const m = await sharp(buf).metadata();
  console.log("✓", name, `${m.width}×${m.height}`);
  return m;
}

async function recolorToBlack(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > 20) {
      o[i] = 0;
      o[i + 1] = 0;
      o[i + 2] = 0;
      o[i + 3] = a;
    } else {
      o[i + 3] = 0;
    }
  }
  return sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function makeOfficialPadded(lockupBuf) {
  const meta = await sharp(lockupBuf).metadata();
  const pad = Math.round(Math.max(meta.width ?? 0, meta.height ?? 0) * 0.14);
  return sharp(lockupBuf)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function main() {
  const board = resolveBoard();
  console.log("Planche:", board);
  mkdirSync(masterDir, { recursive: true });

  const symbolWhite = await cropAndTrim(board, CROPS.symbolWhite, 10);
  const lockupNav = await cropAndTrim(board, CROPS.lockupNav, 8);
  const lockupOfficial = await cropAndTrim(board, CROPS.lockupOfficial, 8);

  await writeMaster("proday-symbol-white.png", symbolWhite);
  await writeMaster("proday-logo-master-white.png", lockupNav);

  const official = await makeOfficialPadded(lockupOfficial);
  await writeMaster("logo-proday-official.png", official);

  await writeMaster("proday-symbol-black.png", await recolorToBlack(symbolWhite));
  await writeMaster("proday-logo-master-black.png", await recolorToBlack(lockupNav));

  console.log("OK — masters extraits → assets/branding/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

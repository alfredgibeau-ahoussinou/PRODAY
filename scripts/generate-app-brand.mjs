/**
 * Extrait l’identité officielle PRODAY (planche brand) vers assets/branding/.
 *
 * Usage: node scripts/generate-app-brand.mjs [chemin-planche.png]
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from '../website/node_modules/sharp/lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(repoRoot, 'assets/branding');

const DEFAULT_BOARD = resolve(
  process.env.HOME,
  '.cursor/projects/Users-gibeau-ahoussinou-PRODAY/assets/image-49511d70-2301-424a-a062-b9e650cf49eb.png',
);

/** Hex planche brand — source unique pour génération assets pôle. */
export const POLE_HEX = {
  player: '#FFFFFF',
  coach: '#C5A059',
  club: '#00ADEF',
  parent: '#8CC63F',
  sponsor: '#92278F',
  events: '#F7941D',
  president: '#C5A059',
  supporter: '#06B6D4',
  admin: '#A3A3A3',
};

const CROP = {
  symbol: { left: 748, top: 72, width: 92, height: 60 },
  primary: { left: 38, top: 62, width: 225, height: 265 },
  horizontal: { left: 278, top: 68, width: 395, height: 125 },
};

async function trimPng(input, region) {
  return sharp(input).extract(region).trim({ threshold: 14 }).png().toBuffer();
}

async function recolor(buf, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) {
      o[i] = o[i + 1] = o[i + 2] = o[i + 3] = 0;
      continue;
    }
    o[i] = r;
    o[i + 1] = g;
    o[i + 2] = b;
    o[i + 3] = a;
  }
  return sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function invertToBlack(whiteBuf) {
  return recolor(whiteBuf, '#000000');
}

async function padOfficial(lockupBuf, size = 1024, padRatio = 0.14) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const resized = await sharp(lockupBuf)
    .resize({ width: inner, height: inner, fit: 'inside' })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#000000"/></svg>`,
  );
  return sharp(bg)
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function makeAppIcon(symbolWhite, size, bgHex = '#000000', radiusRatio = 0.22) {
  const padR = Math.round(size * 0.2);
  const maxSide = size - padR * 2;
  const mark = await sharp(symbolWhite)
    .resize({ width: maxSide, height: maxSide, fit: 'inside' })
    .toBuffer();
  const mm = await sharp(mark).metadata();
  const left = Math.round((size - mm.width) / 2);
  const top = Math.round((size - mm.height) / 2);
  const r = Math.round(size * radiusRatio);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${bgHex}"/></svg>`,
  );
  return sharp(svg).composite([{ input: mark, left, top }]).png().toBuffer();
}

async function makeSplash(lockupWhite, w = 1284, h = 2778) {
  const targetW = Math.round(w * 0.52);
  const resized = await sharp(lockupWhite)
    .resize({ width: targetW, fit: 'inside' })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((w - meta.width) / 2);
  const top = Math.round((h - meta.height) / 2);
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000000"/></svg>`,
  );
  return sharp(bg).composite([{ input: resized, left, top }]).png().toBuffer();
}

async function write(name, buf) {
  const path = resolve(outDir, name);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(path);
  const m = await sharp(buf).metadata();
  console.log('✓', name, `${m.width}×${m.height}`);
  return { path, width: m.width, height: m.height };
}

async function main() {
  const board = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_BOARD;
  mkdirSync(outDir, { recursive: true });

  const symbolRaw = await trimPng(board, CROP.symbol);
  const primaryRaw = await trimPng(board, CROP.primary);
  const horizontalRaw = await trimPng(board, CROP.horizontal);

  const symbolWhite = symbolRaw;
  const symbolBlack = await invertToBlack(symbolWhite);
  const lockupWhite = primaryRaw;
  const lockupBlack = await invertToBlack(primaryRaw);
  const lockupHorizWhite = horizontalRaw;
  const lockupHorizBlack = await invertToBlack(horizontalRaw);

  const symMeta = await write('proday-symbol-white.png', symbolWhite);
  await write('proday-symbol-black.png', symbolBlack);
  await write('proday-symbol-mark.png', symbolWhite);
  await write('proday-logo-master-white.png', lockupWhite);
  await write('proday-logo-master-black.png', lockupBlack);
  await write('proday-lockup-horizontal-white.png', lockupHorizWhite);
  await write('proday-lockup-horizontal-black.png', lockupHorizBlack);

  const official = await padOfficial(lockupWhite);
  await write('logo-proday-official.png', official);

  for (const [pole, hex] of Object.entries(POLE_HEX)) {
    const tinted =
      hex === '#FFFFFF' ? symbolWhite : hex === '#000000' ? symbolBlack : await recolor(symbolWhite, hex);
    await write(`proday-symbol-pole-${pole}.png`, tinted);
  }

  await write('proday-app-icon.png', await makeAppIcon(symbolWhite, 1024, '#000000'));
  await write('proday-adaptive-foreground.png', await makeAppIcon(symbolWhite, 432, '#000000', 0));
  await write(
    'proday-notification-icon.png',
    await sharp(symbolWhite).resize(96, 96, { fit: 'inside' }).png().toBuffer(),
  );
  await write('proday-splash.png', await makeSplash(lockupWhite));

  // Compat aliases — symbole master unique
  await write('logo-mark-transparent.png', symbolWhite);
  for (const alias of [
    'logo-auth-dark.png',
    'logo-transparent-dark.png',
    'logo-transparent-hero.png',
    'logo-dark.png',
    'logo-light.png',
  ]) {
    await write(alias, alias.includes('light') || alias.includes('transparent-dark') ? lockupBlack : lockupWhite);
  }

  const aspect = { symbol: symMeta.width / symMeta.height };
  writeFileSync(
    resolve(outDir, '.generated-meta.json'),
    JSON.stringify({ board, aspect, poleHex: POLE_HEX, generatedAt: new Date().toISOString() }, null, 2),
  );

  console.log('OK — assets branding app générés depuis planche');
  console.log('PRODAY_SYMBOL_ASPECT =', aspect.symbol.toFixed(4));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

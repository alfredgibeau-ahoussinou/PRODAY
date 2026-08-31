/**
 * Génère l’identité officielle PRODAY pour l’app Expo depuis un lockup ou un symbole HD.
 *
 * Usage:
 *   node scripts/generate-app-brand.mjs --lockup [chemin-lockup.png]
 *   node scripts/generate-app-brand.mjs [chemin-symbole-hd.png]
 *   node scripts/generate-app-brand.mjs --board [chemin-planche.png]  (legacy lockups)
 *
 * Règle icône vs lockup :
 * - Store / home / favicon → lockup officiel fourni (P + PRODAY + tagline sur charcoal)
 * - Adaptive Android / notification / symbole UI → marque P+ballon seule (safe zone / lisibilité)
 * - Splash → même lockup centré sur #000
 * - UI in-app → symbole transparent / ProDayLogo composé (jamais le PNG carré baked)
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from '../website/node_modules/sharp/lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(repoRoot, 'assets/branding');

const DEFAULT_SYMBOL = resolve(outDir, 'proday-symbol-master-source.png');
const DEFAULT_LOCKUP = resolve(outDir, 'proday-lockup-official-source.png');

/** Accents pôle — alignés src/theme/prodayBrand.ts */
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

const LEGACY_BOARD_CROP = {
  primary: { left: 38, top: 62, width: 225, height: 265 },
  horizontal: { left: 278, top: 68, width: 395, height: 125 },
};

const ANDROID_LAUNCHER = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const ANDROID_FOREGROUND = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const ANDROID_SPLASH_LOGO = {
  mdpi: 288,
  hdpi: 432,
  xhdpi: 576,
  xxhdpi: 864,
  xxxhdpi: 1152,
};

function parseArgs(argv) {
  const args = { symbol: null, board: null, lockup: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--board' && argv[i + 1]) {
      args.board = resolve(argv[++i]);
    } else if (argv[i] === '--lockup' && argv[i + 1]) {
      args.lockup = resolve(argv[++i]);
    } else if (!argv[i].startsWith('-')) {
      args.symbol = resolve(argv[i]);
    }
  }
  if (!args.lockup && !args.symbol) {
    if (existsSync(DEFAULT_LOCKUP)) args.lockup = DEFAULT_LOCKUP;
    else args.symbol = DEFAULT_SYMBOL;
  }
  return args;
}

/** Extrait symbole blanc transparent depuis fond sombre (JPEG/PNG HD). */
async function extractWhiteSymbolFromBlack(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (lum > 28) {
      const a = Math.min(255, Math.round(((lum - 28) / (255 - 28)) * 255));
      o[i] = 255;
      o[i + 1] = 255;
      o[i + 2] = 255;
      o[i + 3] = a;
    } else {
      o[i] = o[i + 1] = o[i + 2] = o[i + 3] = 0;
    }
  }
  return sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } })
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

async function trimPng(input, region) {
  return sharp(input).extract(region).trim({ threshold: 14 }).png().toBuffer();
}

/**
 * Détecte la marque P+ballon dans la moitié haute d’un lockup (ignore wordmark/tagline).
 * Seuil lumineux élevé pour ignorer le highlight du squircle charcoal.
 */
async function detectMarkCrop(lockupPath) {
  const { data, info } = await sharp(lockupPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const yMax = Math.floor(h * 0.72);
  const xMinBound = Math.floor(w * 0.15);
  const xMaxBound = Math.floor(w * 0.85);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = Math.floor(h * 0.15); y < yMax; y += 1) {
    for (let x = xMinBound; x < xMaxBound; x += 1) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;
      // Blanc / gris clair (marque) — pas le rim charcoal (~100–140).
      const nearNeutral = Math.abs(r - g) < 40 && Math.abs(g - b) < 40;
      if (lum > 170 && nearNeutral) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) {
    throw new Error('Impossible de détecter la marque P dans le lockup');
  }
  const padX = Math.round((maxX - minX + 1) * 0.08);
  const padY = Math.round((maxY - minY + 1) * 0.08);
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  const right = Math.min(w - 1, maxX + padX);
  const bottom = Math.min(yMax - 1, maxY + padY);
  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

async function padSymbol(symbolWhite, size = 1024, padRatio = 0.18, bgHex = '#000000') {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const resized = await sharp(symbolWhite)
    .resize({ width: inner, height: inner, fit: 'inside' })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bgHex}"/></svg>`,
  );
  return sharp(bg).composite([{ input: resized, left, top }]).png().toBuffer();
}

/** Icône store depuis le lockup officiel (carré 1024 — iOS/Android appliquent le masque). */
async function makeAppIconFromLockup(lockupPng, size = 1024) {
  return sharp(lockupPng)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}

/** Fallback icône : marque seule sur fond noir (si pas de lockup). */
async function makeAppIconFromSymbol(symbolWhite, size, bgHex = '#000000') {
  return padSymbol(symbolWhite, size, 0.18, bgHex);
}

/** Adaptive foreground : marque centrée, padding safe zone, fond transparent. */
async function makeAdaptiveForeground(symbolWhite, size = 432) {
  const pad = Math.round(size * 0.2);
  const inner = size - pad * 2;
  const resized = await sharp(symbolWhite)
    .resize({ width: inner, height: inner, fit: 'inside' })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function makeSplashFromLockup(lockupPng, w = 1284, h = 2778) {
  const targetW = Math.round(w * 0.68);
  const resized = await sharp(lockupPng)
    .resize({ width: targetW, fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((w - meta.width) / 2);
  const top = Math.round((h - meta.height) / 2);
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000000"/></svg>`,
  );
  return sharp(bg).composite([{ input: resized, left, top }]).png().toBuffer();
}

async function makeSplashFromSymbol(symbolWhite, w = 1284, h = 2778) {
  const targetW = Math.round(w * 0.38);
  const resized = await sharp(symbolWhite)
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

async function makeNotificationIcon(symbolWhite, size = 96) {
  const resized = await sharp(symbolWhite)
    .resize({ width: size, height: size, fit: 'inside' })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function write(name, buf) {
  const path = resolve(outDir, name);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(path);
  const m = await sharp(buf).metadata();
  console.log('✓', name, `${m.width}×${m.height}`);
  return { path, width: m.width, height: m.height };
}

async function writeNativeIcons(appIconBuf, adaptiveFgBuf, splashLogoBuf, lockupSplashBuf, notifBuf) {
  const iosIcon = resolve(repoRoot, 'ios/ProDay/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png');
  if (existsSync(dirname(iosIcon))) {
    await sharp(appIconBuf).png({ compressionLevel: 9 }).toFile(iosIcon);
    console.log('✓ ios App-Icon-1024x1024@1x.png');
  }

  const splashSet = resolve(repoRoot, 'ios/ProDay/Images.xcassets/SplashScreenLegacy.imageset');
  if (existsSync(splashSet)) {
    const iosSplash = await sharp(lockupSplashBuf || splashLogoBuf)
      .resize(1024, 961, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    for (const name of ['image.png', 'image@2x.png', 'image@3x.png']) {
      await sharp(iosSplash).toFile(resolve(splashSet, name));
    }
    console.log('✓ ios SplashScreenLegacy images');
  }

  for (const [density, size] of Object.entries(ANDROID_LAUNCHER)) {
    const dir = resolve(repoRoot, `android/app/src/main/res/mipmap-${density}`);
    if (!existsSync(dir)) continue;
    const launcher = await sharp(appIconBuf).resize(size, size).webp({ quality: 90 }).toBuffer();
    await sharp(launcher).toFile(resolve(dir, 'ic_launcher.webp'));
    await sharp(launcher).toFile(resolve(dir, 'ic_launcher_round.webp'));
  }

  for (const [density, size] of Object.entries(ANDROID_FOREGROUND)) {
    const dir = resolve(repoRoot, `android/app/src/main/res/mipmap-${density}`);
    if (!existsSync(dir)) continue;
    await sharp(adaptiveFgBuf)
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(resolve(dir, 'ic_launcher_foreground.webp'));
  }
  console.log('✓ android mipmap launchers + foregrounds');

  for (const [density, size] of Object.entries(ANDROID_SPLASH_LOGO)) {
    const dir = resolve(repoRoot, `android/app/src/main/res/drawable-${density}`);
    if (!existsSync(dir)) continue;
    // Android 12 splash icon = marque seule (cercle) — pas le lockup texte.
    await sharp(splashLogoBuf)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(resolve(dir, 'splashscreen_logo.png'));
  }
  console.log('✓ android splashscreen_logo (mark)');

  // Android system / FCM notification icons (monochrome white → drawable-*).
  const ANDROID_NOTIF = {
    mdpi: 24,
    hdpi: 36,
    xhdpi: 48,
    xxhdpi: 72,
    xxxhdpi: 96,
  };
  for (const [density, size] of Object.entries(ANDROID_NOTIF)) {
    const dir = resolve(repoRoot, `android/app/src/main/res/drawable-${density}`);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    await sharp(notifBuf)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(resolve(dir, 'notification_icon.png'));
  }
  console.log('✓ android notification_icon (drawable-*)');
}

async function main() {
  const { symbol: symbolArg, board, lockup: lockupArg } = parseArgs(process.argv);
  mkdirSync(outDir, { recursive: true });

  let lockupPath = lockupArg;
  let symbolPath = symbolArg;
  let lockupPng = null;
  let markCrop = null;

  if (lockupPath) {
    if (!existsSync(lockupPath)) {
      console.error('Lockup introuvable:', lockupPath);
      process.exit(1);
    }
    const lockupDest = resolve(outDir, 'proday-lockup-official-source.png');
    lockupPng = await sharp(lockupPath).png().toBuffer();
    await sharp(lockupPng).toFile(lockupDest);
    console.log('✓ proday-lockup-official-source.png');

    markCrop = await detectMarkCrop(lockupDest);
    console.log('✓ mark crop', markCrop);

    const markCropBuf = await sharp(lockupDest).extract(markCrop).png().toBuffer();
    const sourceDest = resolve(outDir, 'proday-symbol-master-source.png');
    await sharp(markCropBuf).toFile(sourceDest);
    console.log('✓ proday-symbol-master-source.png (extrait du lockup)');
    symbolPath = sourceDest;
  }

  if (!symbolPath || !existsSync(symbolPath)) {
    console.error('Symbole source introuvable:', symbolPath);
    process.exit(1);
  }

  if (!lockupPath) {
    const sourceDest = resolve(outDir, 'proday-symbol-master-source.png');
    if (resolve(symbolPath) !== sourceDest) {
      copyFileSync(symbolPath, sourceDest);
      console.log('✓ proday-symbol-master-source.png (copié)');
    }
  }

  const symbolWhite = await extractWhiteSymbolFromBlack(symbolPath);
  const symbolBlack = await invertToBlack(symbolWhite);

  const symMeta = await write('proday-symbol-white.png', symbolWhite);
  await write('proday-symbol-black.png', symbolBlack);
  await write('proday-symbol-mark.png', symbolWhite);

  let lockupWhite = symbolWhite;
  let lockupBlack = symbolBlack;
  let lockupHorizWhite = symbolWhite;
  let lockupHorizBlack = symbolBlack;

  if (lockupPng) {
    lockupWhite = lockupPng;
    lockupBlack = lockupPng; // lockup sombre : badge utilisable aussi sur fond clair
    lockupHorizWhite = symbolWhite;
    lockupHorizBlack = symbolBlack;
    console.log('✓ lockups master = lockup officiel (carré)');
  } else if (board && existsSync(board)) {
    lockupWhite = await trimPng(board, LEGACY_BOARD_CROP.primary);
    lockupBlack = await invertToBlack(lockupWhite);
    lockupHorizWhite = await trimPng(board, LEGACY_BOARD_CROP.horizontal);
    lockupHorizBlack = await invertToBlack(lockupHorizWhite);
    console.log('✓ lockups extraits depuis planche legacy');
  }

  await write('proday-logo-master-white.png', lockupWhite);
  await write('proday-logo-master-black.png', lockupBlack);
  await write('proday-lockup-horizontal-white.png', lockupHorizWhite);
  await write('proday-lockup-horizontal-black.png', lockupHorizBlack);

  const official = lockupPng
    ? lockupPng
    : await padSymbol(symbolWhite);
  await write('logo-proday-official.png', official);

  for (const [pole, hex] of Object.entries(POLE_HEX)) {
    const tinted =
      hex === '#FFFFFF' ? symbolWhite : hex === '#000000' ? symbolBlack : await recolor(symbolWhite, hex);
    await write(`proday-symbol-pole-${pole}.png`, tinted);
  }

  // Home / store : lockup officiel (ce que l’utilisateur a fourni comme « logo de l’app »).
  // Adaptive + notif + splash Android 12 : marque seule (le cercle clipperait le texte).
  const appIcon = lockupPng
    ? await makeAppIconFromLockup(lockupPng, 1024)
    : await makeAppIconFromSymbol(symbolWhite, 1024, '#000000');
  const adaptiveFg = await makeAdaptiveForeground(symbolWhite, 432);
  const notif = await makeNotificationIcon(symbolWhite, 96);
  const splash = lockupPng
    ? await makeSplashFromLockup(lockupPng)
    : await makeSplashFromSymbol(symbolWhite);
  const androidSplashMark = await makeAdaptiveForeground(symbolWhite, 1152);

  await write('proday-app-icon.png', appIcon);
  await write('proday-adaptive-foreground.png', adaptiveFg);
  await write('proday-notification-icon.png', notif);
  await write('proday-splash.png', splash);

  // Compat aliases — mark transparent pour UI ; lockup opaque seulement pour official/master.
  await write('logo-mark-transparent.png', symbolWhite);
  await write('logo-transparent-dark.png', symbolBlack);
  await write('logo-transparent-hero.png', symbolWhite);
  await write('logo-auth-dark.png', symbolWhite);
  // light/dark legacy noms : lockup officiel (badge) — UI doit préférer ProDaySymbol.
  await write('logo-dark.png', lockupWhite);
  await write('logo-light.png', lockupBlack);

  await writeNativeIcons(appIcon, adaptiveFg, androidSplashMark, splash, notif);

  const aspect = { symbol: symMeta.width / symMeta.height };
  writeFileSync(
    resolve(outDir, '.generated-meta.json'),
    JSON.stringify(
      {
        symbolSource: resolve(outDir, 'proday-symbol-master-source.png'),
        lockupSource: lockupPath ? resolve(outDir, 'proday-lockup-official-source.png') : null,
        markCrop,
        board: board ?? null,
        aspect,
        poleHex: POLE_HEX,
        policy: {
          appIcon: lockupPng
            ? 'full official lockup (P + PRODAY + tagline) — source PNG as store/home icon'
            : 'mark-only (P+ballon) on #000',
          splash: lockupPng ? 'full lockup centered on #000' : 'mark on #000',
          adaptive: 'mark centered with ~20% safe padding, transparent fg, bg #000',
          notification: 'mark white transparent',
          inApp: 'ProDaySymbol / ProDayLogo composed — never baked charcoal square as Image',
        },
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log('OK — assets branding app générés');
  console.log('PRODAY_SYMBOL_ASPECT =', aspect.symbol.toFixed(6));
  console.log('→ mettre à jour src/theme/prodayBrand.ts si le ratio a changé');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

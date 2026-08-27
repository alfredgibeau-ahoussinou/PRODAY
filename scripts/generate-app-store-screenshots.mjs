#!/usr/bin/env node
/**
 * Génère les captures App Store (iPhone / iPad portrait, Mac landscape).
 *
 * iPhone 6,5" (défaut) : 1284 × 2778 px — assets/marketing/app-store/ios-6.5/
 * iPhone legacy         : 1242 × 2688 px — même dossier (--legacy)
 * iPad 13"              : 2064 × 2752 px — assets/marketing/app-store/ipad-13/ (--ipad)
 * iPad 12,9" legacy     : 2048 × 2732 px — même dossier (--ipad --legacy)
 * Mac (Retina)          : 2880 × 1800 px — assets/marketing/app-store/mac/ (--mac)
 * Mac 2560              : 2560 × 1600 px — même dossier (--mac --legacy)
 *
 * Usage :
 *   node scripts/generate-app-store-screenshots.mjs
 *   node scripts/generate-app-store-screenshots.mjs --legacy
 *   node scripts/generate-app-store-screenshots.mjs --ipad
 *   node scripts/generate-app-store-screenshots.mjs --mac
 *   npm run marketing:app-store-ios
 *   npm run marketing:app-store-ipad
 *   npm run marketing:app-store-mac
 *
 * Écrans pôles : captures simulateur v1.0.8 (website/public/images/app/).
 * Objectif 08–10 : texte + branding uniquement (pas d’UI app).
 * Mac : compositions marketing (fenêtre Mac + UI mobile/web) — ProDay n’est pas une app Mac native.
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from '../website/node_modules/sharp/lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const appScreens = resolve(repoRoot, 'website/public/images/app');

const MAC = process.argv.includes('--mac');
const IPAD = process.argv.includes('--ipad');
const LEGACY = process.argv.includes('--legacy');

if (MAC && IPAD) {
  console.error('Utiliser --mac ou --ipad, pas les deux.');
  process.exit(1);
}

/** @type {{ id: string, device: string, outDir: string, W: number, H: number, baseW: number, frame: 'phone'|'tablet'|'mac' }} */
const PRESET = MAC
  ? {
      id: LEGACY ? 'mac-2560' : 'mac-2880',
      device: LEGACY
        ? 'Mac 2560 × 1600 (App Store Connect)'
        : 'Mac 2880 × 1800 Retina (App Store Connect)',
      outDir: resolve(repoRoot, 'assets/marketing/app-store/mac'),
      W: LEGACY ? 2560 : 2880,
      H: LEGACY ? 1600 : 1800,
      baseW: 2880,
      frame: 'mac',
    }
  : IPAD
    ? {
        id: LEGACY ? 'ipad-12.9' : 'ipad-13',
        device: LEGACY
          ? 'iPad 12,9" legacy (App Store Connect)'
          : 'iPad 13" (App Store Connect)',
        outDir: resolve(repoRoot, 'assets/marketing/app-store/ipad-13'),
        W: LEGACY ? 2048 : 2064,
        H: LEGACY ? 2732 : 2752,
        baseW: 2064,
        frame: 'tablet',
      }
    : {
        id: LEGACY ? 'ios-6.5-legacy' : 'ios-6.5',
        device: 'iPhone 6,5" (App Store Connect)',
        outDir: resolve(repoRoot, 'assets/marketing/app-store/ios-6.5'),
        W: LEGACY ? 1242 : 1284,
        H: LEGACY ? 2688 : 2778,
        baseW: 1284,
        frame: 'phone',
      };

const { outDir, W, H, baseW, frame: FRAME } = PRESET;

const LOCKUP = resolve(repoRoot, 'assets/branding/proday-lockup-official-source.png');
const SYMBOL = resolve(repoRoot, 'assets/branding/proday-symbol-white.png');

/** Accents alignés assets/branding/README.md (six portes + Président). */
const ACCENT = {
  joueur: '#FFFFFF',
  coach: '#C5A059',
  club: '#10B981',
  president: '#C5A059',
  parent: '#8CC63F',
  supporter: '#06B6D4',
  sponsor: '#D946EF',
};

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scale(n) {
  return Math.round(n * (W / baseW));
}

/** iPhone frame proportions (bezel + dynamic island). Coords relative to iPhone baseW=1284. */
function phoneLayout() {
  const phoneW = scale(920);
  const phoneH = scale(1880);
  const left = Math.round((W - phoneW) / 2);
  const top = scale(720);
  const bezel = scale(14);
  const radius = scale(72);
  const screenRadius = scale(58);
  const screenW = phoneW - bezel * 2;
  const screenH = phoneH - bezel * 2 - scale(8);
  return { phoneW, phoneH, left, top, bezel, radius, screenRadius, screenW, screenH };
}

/**
 * Cadre iPad Pro 13" (bezels fins, coins arrondis, caméra frontale discrète).
 * Coords relatives à baseW=2064.
 */
function tabletLayout() {
  // Cadre large type iPad Pro ; hauteur bornée pour laisser branding + pied.
  const tabletW = scale(1580);
  const tabletH = scale(1980);
  const left = Math.round((W - tabletW) / 2);
  const top = scale(560);
  const bezel = scale(26);
  const radius = scale(52);
  const screenRadius = scale(34);
  const screenW = tabletW - bezel * 2;
  const screenH = tabletH - bezel * 2;
  return {
    tabletW,
    tabletH,
    left,
    top,
    bezel,
    radius,
    screenRadius,
    screenW,
    screenH,
  };
}

/**
 * Fenêtre Mac (barre de titre + feux de circulation).
 * Coords relatives à baseW=2880 (landscape 2880×1800).
 * Contenu : UI mobile/web dans une fenêtre desktop (marketing, pas app Mac native).
 */
function macLayout() {
  const winW = scale(1680);
  const titleBarH = scale(52);
  const winH = scale(1180);
  const left = Math.round((W - winW) / 2);
  const top = scale(380);
  const radius = scale(18);
  const screenRadius = scale(10);
  const contentPad = scale(6);
  const screenW = winW - contentPad * 2;
  const screenH = winH - titleBarH - contentPad;
  return {
    winW,
    winH,
    titleBarH,
    left,
    top,
    radius,
    screenRadius,
    contentPad,
    screenW,
    screenH,
  };
}

function backgroundSvg(accent) {
  const glow = accent === '#FFFFFF' ? '#C5A059' : accent;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <radialGradient id="g" cx="50%" cy="14%" r="72%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.24"/>
          <stop offset="55%" stop-color="#0A0A0A" stop-opacity="1"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="#000"/>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>`,
  );
}

function frameMetrics() {
  if (FRAME === 'mac') {
    return {
      yHead: scale(168),
      ySub: scale(220),
      yBody: scale(268),
      headSize: scale(48),
      subSize: scale(32),
      bodySize: scale(26),
      objHead: scale(56),
      objSub: scale(38),
      objBody: scale(34),
      objLineH: scale(50),
      footerTag: scale(24),
      brandSize: scale(34),
      symbolW: scale(88),
      lockupW: scale(780),
      headlineH: scale(340),
      footerH: scale(120),
    };
  }
  if (FRAME === 'tablet') {
    return {
      yHead: scale(200),
      ySub: scale(270),
      yBody: scale(330),
      headSize: scale(56),
      subSize: scale(38),
      bodySize: scale(28),
      objHead: scale(52),
      objSub: scale(36),
      objBody: scale(32),
      objLineH: scale(48),
      footerTag: scale(26),
      brandSize: scale(36),
      symbolW: scale(96),
      lockupW: scale(720),
      headlineH: scale(520),
      footerH: scale(160),
    };
  }
  return {
    yHead: scale(228),
    ySub: scale(298),
    yBody: scale(362),
    headSize: scale(64),
    subSize: scale(44),
    bodySize: scale(30),
    objHead: scale(58),
    objSub: scale(40),
    objBody: scale(34),
    objLineH: scale(52),
    footerTag: scale(28),
    brandSize: scale(40),
    symbolW: scale(112),
    lockupW: scale(640),
    headlineH: scale(520),
    footerH: scale(160),
  };
}

function headlineSvg({ headline, subheadline, body, accent }) {
  const m = frameMetrics();
  const subColor = accent === '#FFFFFF' ? '#C5A059' : accent;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${m.headlineH}">
      <style>
        .h { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FFFFFF; }
        .s { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 700; }
        .b { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 500; fill: rgba(255,255,255,0.72); }
      </style>
      <text x="${W / 2}" y="${m.yHead}" text-anchor="middle" class="h" font-size="${m.headSize}">${esc(headline)}</text>
      ${subheadline ? `<text x="${W / 2}" y="${m.ySub}" text-anchor="middle" class="s" font-size="${m.subSize}" fill="${subColor}">${esc(subheadline)}</text>` : ''}
      ${body ? `<text x="${W / 2}" y="${m.yBody}" text-anchor="middle" class="b" font-size="${m.bodySize}">${esc(body)}</text>` : ''}
    </svg>`,
  );
}

/** Bloc texte objectif (multi-lignes) — remplace le cadre appareil / screenshot app. */
function objectifCopySvg({ headline, subheadline, bodyLines = [], accent }) {
  const m = frameMetrics();
  const subColor = accent === '#FFFFFF' ? '#C5A059' : accent;
  const yHead = scale(40);
  const ySub = scale(FRAME === 'mac' ? 100 : 110);
  const yBody0 = scale(FRAME === 'mac' ? 180 : 200);
  const bodyTexts = bodyLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${yBody0 + i * m.objLineH}" text-anchor="middle" class="b" font-size="${m.objBody}">${esc(line)}</text>`,
    )
    .join('\n');
  const h = yBody0 + Math.max(bodyLines.length, 1) * m.objLineH + scale(40);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}">
      <style>
        .h { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FFFFFF; }
        .s { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 700; }
        .b { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 500; fill: rgba(255,255,255,0.78); }
      </style>
      <text x="${W / 2}" y="${yHead}" text-anchor="middle" class="h" font-size="${m.objHead}">${esc(headline)}</text>
      ${subheadline ? `<text x="${W / 2}" y="${ySub}" text-anchor="middle" class="s" font-size="${m.objSub}" fill="${subColor}">${esc(subheadline)}</text>` : ''}
      ${bodyTexts}
    </svg>`,
  );
}

/** Corps du téléphone (sans remplissage opaque sur la zone écran). */
function phoneBodySvg() {
  const { phoneW, phoneH, radius } = phoneLayout();
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${phoneW}" height="${phoneH}">
      <rect x="0" y="0" width="${phoneW}" height="${phoneH}" rx="${radius}" fill="#1A1A1A"/>
    </svg>`,
  );
}

/** Contour + Dynamic Island par-dessus l'écran. */
function phoneOverlaySvg(accent) {
  const { phoneW, phoneH, radius, bezel } = phoneLayout();
  const islandW = scale(180);
  const islandH = scale(36);
  const islandX = (phoneW - islandW) / 2;
  const islandY = bezel + scale(18);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${phoneW}" height="${phoneH}">
      <rect x="0" y="0" width="${phoneW}" height="${phoneH}" rx="${radius}" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="2"/>
      <rect x="${islandX}" y="${islandY}" width="${islandW}" height="${islandH}" rx="${islandH / 2}" fill="#000"/>
    </svg>`,
  );
}

/** Corps tablette iPad. */
function tabletBodySvg() {
  const { tabletW, tabletH, radius } = tabletLayout();
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tabletW}" height="${tabletH}">
      <rect x="0" y="0" width="${tabletW}" height="${tabletH}" rx="${radius}" fill="#1A1A1A"/>
    </svg>`,
  );
}

/** Contour + caméra frontale discrète (pas de Dynamic Island). */
function tabletOverlaySvg(accent) {
  const { tabletW, tabletH, radius, bezel } = tabletLayout();
  const camR = scale(8);
  const camX = tabletW / 2;
  const camY = bezel / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tabletW}" height="${tabletH}">
      <rect x="0" y="0" width="${tabletW}" height="${tabletH}" rx="${radius}" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="2.5"/>
      <circle cx="${camX}" cy="${camY}" r="${camR}" fill="#0A0A0A"/>
      <circle cx="${camX}" cy="${camY}" r="${Math.max(2, camR - 3)}" fill="#2A2A2A"/>
    </svg>`,
  );
}

/** Corps fenêtre Mac (chrome sombre + barre de titre). */
function macWindowBodySvg(accent) {
  const { winW, winH, titleBarH, radius } = macLayout();
  const lightR = scale(9);
  const lightY = titleBarH / 2;
  const lightGap = scale(28);
  const light0 = scale(28);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${winW}" height="${winH}">
      <defs>
        <linearGradient id="tb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2A2A2A"/>
          <stop offset="100%" stop-color="#1C1C1C"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${winW}" height="${winH}" rx="${radius}" fill="#111111"/>
      <path d="M0,${radius} Q0,0 ${radius},0 H${winW - radius} Q${winW},0 ${winW},${radius} V${titleBarH} H0 Z" fill="url(#tb)"/>
      <line x1="0" y1="${titleBarH}" x2="${winW}" y2="${titleBarH}" stroke="${accent}" stroke-opacity="0.28" stroke-width="1"/>
      <circle cx="${light0}" cy="${lightY}" r="${lightR}" fill="#FF5F57"/>
      <circle cx="${light0 + lightGap}" cy="${lightY}" r="${lightR}" fill="#FEBC2E"/>
      <circle cx="${light0 + lightGap * 2}" cy="${lightY}" r="${lightR}" fill="#28C840"/>
      <text x="${winW / 2}" y="${lightY + scale(6)}" text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
        font-weight="600" font-size="${scale(20)}" fill="rgba(255,255,255,0.55)">PRODAY</text>
    </svg>`,
  );
}

/** Contour fenêtre Mac. */
function macWindowOverlaySvg(accent) {
  const { winW, winH, radius } = macLayout();
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${winW}" height="${winH}">
      <rect x="0" y="0" width="${winW}" height="${winH}" rx="${radius}" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
    </svg>`,
  );
}

function footerSvg() {
  const m = frameMetrics();
  const tagY = scale(FRAME === 'mac' ? 32 : 40);
  const urlY = scale(FRAME === 'mac' ? 72 : 90);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${m.footerH}">
      <style>
        .t { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 600; fill: rgba(255,255,255,0.55); letter-spacing: 0.08em; }
        .u { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 500; fill: #C5A059; }
      </style>
      <text x="${W / 2}" y="${tagY}" text-anchor="middle" class="t" font-size="${m.footerTag}">CONNECTER. PROGRESSER. RÉVÉLER.</text>
      <text x="${W / 2}" y="${urlY}" text-anchor="middle" class="u" font-size="${scale(FRAME === 'mac' ? 22 : 24)}">proday75.fr</text>
    </svg>`,
  );
}

function brandWordmarkSvg() {
  const m = frameMetrics();
  const y = scale(FRAME === 'mac' ? 44 : 52);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${scale(FRAME === 'mac' ? 60 : 72)}">
      <text x="${W / 2}" y="${y}" text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
        font-weight="800" font-size="${m.brandSize}" fill="#FFFFFF" letter-spacing="0.22em">PRODAY</text>
    </svg>`,
  );
}

/** Symbole P + wordmark PRODAY (sans badge carré store). */
async function brandingStripLayers() {
  const m = frameMetrics();
  const symbol = await sharp(SYMBOL).resize({ width: m.symbolW, fit: 'inside' }).png().toBuffer();
  const symbolMeta = await sharp(symbol).metadata();
  const wordmark = brandWordmarkSvg();
  const stripH = symbolMeta.height + scale(FRAME === 'mac' ? 56 : 72);
  const symbolTop = scale(FRAME === 'mac' ? 16 : 24);
  return {
    layers: [
      {
        input: symbol,
        left: Math.round((W - symbolMeta.width) / 2),
        top: symbolTop,
      },
      { input: wordmark, top: symbolTop + symbolMeta.height - scale(8), left: 0 },
    ],
    stripH: symbolTop + stripH,
  };
}

async function fitScreenImage(imagePath, screenW, screenH) {
  return sharp(imagePath)
    .resize(screenW, screenH, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();
}

/** Contient l’UI portrait dans la zone landscape sans crop (letterbox). */
async function fitScreenImageContain(imagePath, screenW, screenH) {
  return sharp(imagePath)
    .resize(screenW, screenH, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .png()
    .toBuffer();
}

/**
 * Shot « objectif » : texte + branding (symbole / lockup).
 * Pas de cadre appareil, pas de screenshot app.
 */
async function composeHero({ headline, subheadline, body, bodyLines, accent }) {
  const m = frameMetrics();
  const lines =
    Array.isArray(bodyLines) && bodyLines.length > 0
      ? bodyLines
      : body
        ? [body]
        : [];

  const branding = await brandingStripLayers();
  const copySvg = objectifCopySvg({
    headline,
    subheadline,
    bodyLines: lines,
    accent,
  });
  const copyMeta = await sharp(copySvg).metadata();
  const copyTop = branding.stripH + scale(FRAME === 'mac' ? 24 : 36);

  const lockup = await sharp(LOCKUP).resize({ width: m.lockupW, fit: 'inside' }).png().toBuffer();
  const lockMeta = await sharp(lockup).metadata();
  const footerH = m.footerH;
  const lockTop = Math.min(
    H - footerH - lockMeta.height - scale(FRAME === 'mac' ? 32 : 48),
    Math.max(copyTop + copyMeta.height + scale(FRAME === 'mac' ? 48 : 80), Math.round(H * (FRAME === 'mac' ? 0.48 : 0.52))),
  );

  const layers = [
    { input: backgroundSvg(accent), top: 0, left: 0 },
    ...branding.layers,
    { input: copySvg, top: copyTop, left: 0 },
    {
      input: lockup,
      left: Math.round((W - lockMeta.width) / 2),
      top: lockTop,
    },
    { input: footerSvg(), top: H - footerH, left: 0 },
  ];

  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function composePhoneShot({ headline, subheadline, body, accent, screenPath }) {
  const { left, top, bezel, screenW, screenH, screenRadius } = phoneLayout();
  const screenX = left + bezel;
  const screenY = top + bezel;
  const m = frameMetrics();

  const screenBuf = await fitScreenImage(screenPath, screenW, screenH);

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screenW}" height="${screenH}">
      <rect width="${screenW}" height="${screenH}" rx="${screenRadius}" fill="#fff"/>
    </svg>`,
  );
  const roundedScreen = await sharp(screenBuf)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const branding = await brandingStripLayers();

  const layers = [
    { input: backgroundSvg(accent), top: 0, left: 0 },
    ...branding.layers.map((layer) => ({ ...layer })),
    { input: headlineSvg({ headline, subheadline, body, accent }), top: 0, left: 0 },
    { input: await sharp(phoneBodySvg()).png().toBuffer(), top, left },
    { input: roundedScreen, top: screenY, left: screenX },
    { input: await sharp(phoneOverlaySvg(accent)).png().toBuffer(), top, left },
    { input: footerSvg(), top: H - m.footerH, left: 0 },
  ];

  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function composeTabletShot({ headline, subheadline, body, accent, screenPath }) {
  const { left, top, bezel, screenW, screenH, screenRadius } = tabletLayout();
  const screenX = left + bezel;
  const screenY = top + bezel;
  const m = frameMetrics();

  const screenBuf = await fitScreenImage(screenPath, screenW, screenH);

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screenW}" height="${screenH}">
      <rect width="${screenW}" height="${screenH}" rx="${screenRadius}" fill="#fff"/>
    </svg>`,
  );
  const roundedScreen = await sharp(screenBuf)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const branding = await brandingStripLayers();

  const layers = [
    { input: backgroundSvg(accent), top: 0, left: 0 },
    ...branding.layers.map((layer) => ({ ...layer })),
    { input: headlineSvg({ headline, subheadline, body, accent }), top: 0, left: 0 },
    { input: await sharp(tabletBodySvg()).png().toBuffer(), top, left },
    { input: roundedScreen, top: screenY, left: screenX },
    { input: await sharp(tabletOverlaySvg(accent)).png().toBuffer(), top, left },
    { input: footerSvg(), top: H - m.footerH, left: 0 },
  ];

  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Shot Mac : fenêtre desktop + UI (simulateur iOS / web) — composition marketing.
 * ProDay n’est pas une app Mac native ; la fenêtre illustre un usage desktop large.
 */
async function composeMacShot({ headline, subheadline, body, accent, screenPath }) {
  const { left, top, titleBarH, contentPad, screenW, screenH, screenRadius } = macLayout();
  const screenX = left + contentPad;
  const screenY = top + titleBarH;
  const m = frameMetrics();

  const screenBuf = await fitScreenImageContain(screenPath, screenW, screenH);

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screenW}" height="${screenH}">
      <rect width="${screenW}" height="${screenH}" rx="${screenRadius}" fill="#fff"/>
    </svg>`,
  );
  const roundedScreen = await sharp(screenBuf)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const branding = await brandingStripLayers();

  const layers = [
    { input: backgroundSvg(accent), top: 0, left: 0 },
    ...branding.layers.map((layer) => ({ ...layer })),
    { input: headlineSvg({ headline, subheadline, body, accent }), top: 0, left: 0 },
    { input: await sharp(macWindowBodySvg(accent)).png().toBuffer(), top, left },
    { input: roundedScreen, top: screenY, left: screenX },
    { input: await sharp(macWindowOverlaySvg(accent)).png().toBuffer(), top, left },
    { input: footerSvg(), top: H - m.footerH, left: 0 },
  ];

  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * 7 pôles publics + 3 objectif (pourquoi ProDay) — pas d’Admin.
 * kind: 'phone'|'tablet'|'mac' (pôles, UI app) | 'hero' (objectif : texte + lockup, sans appareil).
 * @type {Array<{file:string, pole:string, headline:string, subheadline:string, body?:string, bodyLines?:string[], accent:string, kind?:'phone'|'hero', screen?:string, sourceLabel:string, recommended?:number, note?:string}>}
 */
const SHOTS = [
  {
    file: '01-pole-joueur.png',
    pole: 'Joueur',
    headline: 'Pôle Joueur',
    subheadline: 'Profil, stats et carrière en ligne',
    accent: ACCENT.joueur,
    screen: resolve(appScreens, 'player/player-profil.jpg'),
    sourceLabel: 'website/public/images/app/player/player-profil.jpg',
    recommended: 1,
  },
  {
    file: '02-pole-coach.png',
    pole: 'Coach',
    headline: 'Pôle Coach',
    subheadline: 'Pilotez votre staff et vos séances',
    accent: ACCENT.coach,
    screen: resolve(appScreens, 'coach/coach-profil.jpg'),
    sourceLabel: 'website/public/images/app/coach/coach-profil.jpg',
    recommended: 2,
  },
  {
    file: '03-pole-club.png',
    pole: 'Club',
    headline: 'Pôle Club',
    subheadline: 'Équipes, licenciés et recrutement',
    accent: ACCENT.club,
    screen: resolve(appScreens, 'club/club-equipes.jpg'),
    sourceLabel: 'website/public/images/app/club/club-equipes.jpg',
    recommended: 3,
  },
  {
    file: '04-pole-president.png',
    pole: 'Président',
    headline: 'Pôle Président',
    subheadline: 'Le club en un coup d’œil',
    accent: ACCENT.president,
    screen: resolve(appScreens, 'executive/executive-cockpit.jpg'),
    sourceLabel: 'website/public/images/app/executive/executive-cockpit.jpg',
  },
  {
    file: '05-pole-parent.png',
    pole: 'Parent',
    headline: 'Pôle Parent',
    subheadline: 'Accompagnez sans étouffer',
    accent: ACCENT.parent,
    screen: resolve(appScreens, 'parent/parent-menu.jpg'),
    sourceLabel: 'website/public/images/app/parent/parent-menu.jpg',
  },
  {
    file: '06-pole-supporter.png',
    pole: 'Supporter',
    headline: 'Pôle Supporter',
    subheadline: 'Suivez matchs, scores et favoris',
    accent: ACCENT.supporter,
    screen: resolve(appScreens, 'supporter/supporter-accueil.jpg'),
    sourceLabel: 'website/public/images/app/supporter/supporter-accueil.jpg',
  },
  {
    file: '07-pole-sponsor.png',
    pole: 'Sponsor',
    headline: 'Pôle Sponsor',
    subheadline: 'Visibilité clubs et marques',
    accent: ACCENT.sponsor,
    screen: resolve(appScreens, 'sponsor/sponsor-prospects.jpg'),
    sourceLabel: 'website/public/images/app/sponsor/sponsor-prospects.jpg',
  },
  // —— Objectif / pourquoi ProDay (texte + branding, sans UI app) ——
  {
    file: '08-objectif-infrastructure.png',
    pole: 'Objectif',
    kind: 'hero',
    headline: 'Pas un outil de plus.',
    subheadline: 'L’infrastructure de votre football.',
    bodyLines: [
      'Pas huit produits.',
      'Une infrastructure pour relier',
      'joueurs, clubs et staffs.',
    ],
    accent: ACCENT.coach,
    sourceLabel: 'assets/branding/proday-lockup-official-source.png',
    note: 'Hero texte + lockup · promesse infrastructure (sans UI)',
  },
  {
    file: '09-objectif-centralisation.png',
    pole: 'Centralisation',
    kind: 'hero',
    headline: 'Tout au même endroit.',
    subheadline: 'Ce que la centralisation change.',
    bodyLines: [
      'Plus de WhatsApp.',
      'Plus de tableurs.',
      'Plus de docs éparpillés.',
    ],
    accent: ACCENT.club,
    sourceLabel: 'assets/branding/proday-lockup-official-source.png',
    note: 'Hero texte + lockup · centralisation (sans UI)',
  },
  {
    file: '10-objectif-portes.png',
    pole: 'Portes',
    kind: 'hero',
    headline: 'Six portes d’entrée.',
    subheadline: 'Un seul écosystème.',
    bodyLines: [
      'Joueur · Coach · Club',
      'Parent · Supporter · Sponsor',
      'Vous entrez par votre rôle.',
      'La donnée reste partagée.',
    ],
    accent: '#C5A059',
    sourceLabel: 'assets/branding/proday-lockup-official-source.png',
    note: 'Hero texte + lockup · portes d’entrée (sans UI)',
  },
];

function removeStaleOutputs(expectedFiles) {
  const keep = new Set(expectedFiles);
  for (const name of readdirSync(outDir)) {
    if (!name.endsWith('.png') || keep.has(name)) continue;
    unlinkSync(resolve(outDir, name));
    console.log(`✗ retiré ${name}`);
  }
}

async function writeShot(shot) {
  const outPath = resolve(outDir, shot.file);
  const kind =
    shot.kind === 'hero'
      ? 'hero'
      : FRAME === 'mac'
        ? 'mac'
        : FRAME === 'tablet'
          ? 'tablet'
          : 'phone';
  if (kind !== 'hero' && !existsSync(shot.screen)) {
    throw new Error(`Asset manquant : ${shot.screen}`);
  }
  if (kind === 'hero' && !existsSync(LOCKUP)) {
    throw new Error(`Lockup manquant : ${LOCKUP}`);
  }
  const buf =
    kind === 'hero'
      ? await composeHero({
          headline: shot.headline,
          subheadline: shot.subheadline,
          body: shot.body,
          bodyLines: shot.bodyLines,
          accent: shot.accent,
        })
      : FRAME === 'mac'
        ? await composeMacShot({
            headline: shot.headline,
            subheadline: shot.subheadline,
            body: shot.body,
            accent: shot.accent,
            screenPath: shot.screen,
          })
        : FRAME === 'tablet'
          ? await composeTabletShot({
              headline: shot.headline,
              subheadline: shot.subheadline,
              body: shot.body,
              accent: shot.accent,
              screenPath: shot.screen,
            })
          : await composePhoneShot({
              headline: shot.headline,
              subheadline: shot.subheadline,
              body: shot.body,
              accent: shot.accent,
              screenPath: shot.screen,
            });
  await sharp(buf).png({ compressionLevel: 9 }).toFile(outPath);
  const meta = await sharp(buf).metadata();
  console.log(`✓ ${shot.file}  ${meta.width}×${meta.height}  (${shot.pole})`);
  const bodyJoined =
    Array.isArray(shot.bodyLines) && shot.bodyLines.length > 0
      ? shot.bodyLines.join(' ')
      : (shot.body ?? null);
  return {
    file: shot.file,
    pole: shot.pole,
    kind,
    width: meta.width,
    height: meta.height,
    recommended: shot.recommended ?? null,
    source: shot.sourceLabel,
    note: shot.note ?? null,
    headline: shot.headline,
    subheadline: shot.subheadline,
    body: bodyJoined,
    bodyLines: shot.bodyLines ?? null,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  removeStaleOutputs(SHOTS.map((s) => s.file));
  const poleCount = SHOTS.filter((s) => !String(s.file).includes('objectif')).length;
  const objectifCount = SHOTS.length - poleCount;
  const label = MAC ? 'Mac' : IPAD ? 'iPad 13"' : 'iOS 6,5"';
  console.log(
    `→ Captures App Store ${label} (${W}×${H}) — ${poleCount} pôles + ${objectifCount} objectif…`,
  );
  const results = [];
  for (const shot of SHOTS) {
    results.push(await writeShot(shot));
  }

  const strategy = MAC
    ? '7 pôles (fenêtre Mac + UI mobile/web) + 3 objectif texte/branding sans UI — pas d’Admin · marketing (pas app Mac native)'
    : IPAD
      ? '7 pôles (tablette + UI) + 3 objectif texte/branding sans UI — pas d’Admin'
      : '7 pôles (téléphone + UI) + 3 objectif texte/branding sans UI — pas d’Admin';

  const manifest = {
    generatedAt: new Date().toISOString(),
    appVersion: '1.0.8',
    preset: PRESET.id,
    dimensions: `${W}×${H}`,
    portrait: !MAC,
    landscape: MAC,
    device: PRESET.device,
    strategy,
    honesty: MAC
      ? 'ProDay n’est pas une app Mac native (Expo / React Native). Les captures 01–07 sont des compositions marketing : UI simulateur iOS dans une fenêtre Mac stylisée (usage desktop large / web).'
      : null,
    screenSources:
      'pôles: website/public/images/app/ (simulateur v1.0.8) · objectif: branding only',
    branding: [
      'assets/branding/proday-symbol-white.png + wordmark PRODAY',
      'assets/branding/proday-lockup-official-source.png (hero 08–10)',
    ],
    poles: results.map((r) => r.pole),
    files: results,
    recommendedFirst: results
      .filter((r) => r.recommended)
      .sort((a, b) => a.recommended - b.recommended)
      .map((r) => r.file),
  };
  writeFileSync(resolve(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n✓ ${results.length} captures → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

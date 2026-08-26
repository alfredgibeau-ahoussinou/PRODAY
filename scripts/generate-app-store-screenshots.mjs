#!/usr/bin/env node
/**
 * Génère les captures App Store iOS iPhone 6,5" (portrait).
 *
 * Dimensions par défaut : 1284 × 2778 px (14 Pro Max / 13 Pro Max / 12 Pro Max).
 * Option legacy : 1242 × 2688 px (--legacy).
 *
 * Usage :
 *   node scripts/generate-app-store-screenshots.mjs
 *   node scripts/generate-app-store-screenshots.mjs --legacy
 *   npm run marketing:app-store-ios
 *
 * Sortie : assets/marketing/app-store/ios-6.5/*.png
 *
 * Écrans : captures réelles simulateur v1.0.8 (website/public/images/app/).
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from '../website/node_modules/sharp/lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(repoRoot, 'assets/marketing/app-store/ios-6.5');
const appScreens = resolve(repoRoot, 'website/public/images/app');

const LEGACY = process.argv.includes('--legacy');
const W = LEGACY ? 1242 : 1284;
const H = LEGACY ? 2688 : 2778;

const LOCKUP = resolve(repoRoot, 'assets/branding/proday-lockup-official-source.png');
const SYMBOL = resolve(repoRoot, 'assets/branding/proday-symbol-white.png');

/** Accents alignés assets/branding/README.md */
const ACCENT = {
  master: '#C5A059',
  joueur: '#FFFFFF',
  coach: '#C5A059',
  club: '#10B981',
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
  return Math.round(n * (W / 1284));
}

/** iPhone frame proportions (bezel + dynamic island). */
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

function headlineSvg({ headline, subheadline, body, accent }) {
  const yHead = scale(228);
  const ySub = scale(298);
  const yBody = scale(362);
  const headSize = scale(64);
  const subSize = scale(44);
  const bodySize = scale(30);
  const subColor = accent === '#FFFFFF' ? '#C5A059' : accent;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${scale(560)}">
      <style>
        .h { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FFFFFF; }
        .s { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 700; }
        .b { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 500; fill: rgba(255,255,255,0.72); }
      </style>
      <text x="${W / 2}" y="${yHead}" text-anchor="middle" class="h" font-size="${headSize}">${esc(headline)}</text>
      ${subheadline ? `<text x="${W / 2}" y="${ySub}" text-anchor="middle" class="s" font-size="${subSize}" fill="${subColor}">${esc(subheadline)}</text>` : ''}
      ${body ? `<text x="${W / 2}" y="${yBody}" text-anchor="middle" class="b" font-size="${bodySize}">${esc(body)}</text>` : ''}
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

function footerSvg() {
  const tagY = scale(40);
  const urlY = scale(90);
  const size = scale(28);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${scale(160)}">
      <style>
        .t { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 600; fill: rgba(255,255,255,0.55); letter-spacing: 0.08em; }
        .u { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 500; fill: #C5A059; }
      </style>
      <text x="${W / 2}" y="${tagY}" text-anchor="middle" class="t" font-size="${size}">CONNECTER. PROGRESSER. RÉVÉLER.</text>
      <text x="${W / 2}" y="${urlY}" text-anchor="middle" class="u" font-size="${scale(24)}">proday75.fr</text>
    </svg>`,
  );
}

function brandWordmarkSvg() {
  const size = scale(40);
  const y = scale(52);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${scale(72)}">
      <text x="${W / 2}" y="${y}" text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
        font-weight="800" font-size="${size}" fill="#FFFFFF" letter-spacing="0.22em">PRODAY</text>
    </svg>`,
  );
}

/** Symbole P + wordmark PRODAY (sans badge carré store). */
async function brandingStripLayers() {
  const symbolW = scale(112);
  const symbol = await sharp(SYMBOL).resize({ width: symbolW, fit: 'inside' }).png().toBuffer();
  const symbolMeta = await sharp(symbol).metadata();
  const wordmark = brandWordmarkSvg();
  const stripH = symbolMeta.height + scale(72);
  const symbolTop = scale(28);
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

async function composeHero({ headline, subheadline, body, accent }) {
  const layers = [{ input: backgroundSvg(accent), top: 0, left: 0 }];
  layers.push({ input: headlineSvg({ headline, subheadline, body, accent }), top: 0, left: 0 });

  const lockupW = scale(820);
  const lockup = await sharp(LOCKUP).resize({ width: lockupW, fit: 'inside' }).png().toBuffer();
  const meta = await sharp(lockup).metadata();
  layers.push({
    input: lockup,
    left: Math.round((W - meta.width) / 2),
    top: Math.round(H * 0.4 - meta.height / 2),
  });

  layers.push({ input: footerSvg(), top: H - scale(160), left: 0 });
  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function composePhoneShot({ headline, subheadline, body, accent, screenPath }) {
  const { left, top, bezel, screenW, screenH, screenRadius } = phoneLayout();
  const screenX = left + bezel;
  const screenY = top + bezel;

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
    { input: footerSvg(), top: H - scale(160), left: 0 },
  ];

  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** @type {Array<{file:string, hero?:boolean, headline:string, subheadline?:string, body?:string, accent:string, screen?:string, sourceLabel?:string, recommended?:number}>} */
const SHOTS = [
  {
    file: '01-hero-brand.png',
    hero: true,
    headline: 'PRODAY',
    subheadline: 'CONNECTER. PROGRESSER. RÉVÉLER.',
    body: 'L\'écosystème foot amateur & semi-pro',
    accent: ACCENT.master,
    sourceLabel: 'assets/branding/proday-lockup-official-source.png',
    recommended: 1,
  },
  {
    file: '02-joueur-profil-carriere.png',
    headline: 'Profil & carrière',
    subheadline: 'Score, stats, CV en ligne',
    body: 'Pôle Joueur · Pro Day Man & Woman',
    accent: ACCENT.joueur,
    screen: resolve(appScreens, 'player/player-profil.jpg'),
    sourceLabel: 'website/public/images/app/player/player-profil.jpg',
    recommended: 2,
  },
  {
    file: '03-joueur-mercato.png',
    headline: 'Mercato ciblé',
    subheadline: 'Annonces par poste & niveau',
    body: 'Candidatures · suivi recruteurs',
    accent: ACCENT.joueur,
    screen: resolve(appScreens, 'player/player-menu.jpg'),
    sourceLabel: 'website/public/images/app/player/player-menu.jpg',
    recommended: 3,
  },
  {
    file: '04-joueur-arena.png',
    headline: 'Arena & tournois',
    subheadline: 'Inscriptions · palmarès local',
    body: 'Organisez et participez',
    accent: ACCENT.joueur,
    screen: resolve(appScreens, 'player/player-matchs.jpg'),
    sourceLabel: 'website/public/images/app/player/player-matchs.jpg',
  },
  {
    file: '05-joueur-pulse-activites.png',
    headline: 'Journal d\'activités',
    subheadline: 'Séances · matchs · highlights',
    body: 'Analyse IA sur vos séances',
    accent: ACCENT.joueur,
    screen: resolve(appScreens, 'player/player-saison.jpg'),
    sourceLabel: 'website/public/images/app/player/player-saison.jpg',
  },
  {
    file: '06-coach-profil-staff.png',
    headline: 'Espace Coach',
    subheadline: 'Staff · séances · coaching',
    body: 'Vérification diplômes · messagerie',
    accent: ACCENT.coach,
    screen: resolve(appScreens, 'coach/coach-profil.jpg'),
    sourceLabel: 'website/public/images/app/coach/coach-profil.jpg',
  },
  {
    file: '07-club-recrutement.png',
    headline: 'Espace Club',
    subheadline: 'Recrutement · convocations',
    body: 'Mercato club · matchs amicaux',
    accent: ACCENT.club,
    screen: resolve(appScreens, 'club/club-equipes.jpg'),
    sourceLabel: 'website/public/images/app/club/club-equipes.jpg',
  },
  {
    file: '08-matchs-amicaux.png',
    headline: 'Matchs amicaux',
    subheadline: 'RSVP · Live Stats',
    body: 'Organisation simplifiée',
    accent: ACCENT.joueur,
    screen: resolve(appScreens, 'club/club-matchs.jpg'),
    sourceLabel: 'website/public/images/app/club/club-matchs.jpg',
  },
  {
    file: '09-communaute-reels.png',
    headline: 'Communauté & Reels',
    subheadline: 'Fil · highlights · visibilité',
    body: 'Question de la semaine',
    accent: ACCENT.joueur,
    screen: resolve(appScreens, 'player/player-accueil.jpg'),
    sourceLabel: 'website/public/images/app/player/player-accueil.jpg',
  },
  {
    file: '10-partenaires-sponsors.png',
    headline: 'Partenaires & sponsors',
    subheadline: 'Visibilité clubs & marques',
    body: 'Espace National Pro',
    accent: ACCENT.sponsor,
    screen: resolve(appScreens, 'sponsor/sponsor-accueil.jpg'),
    sourceLabel: 'website/public/images/app/sponsor/sponsor-accueil.jpg',
  },
];

async function writeShot(shot) {
  const outPath = resolve(outDir, shot.file);
  let buf;
  if (shot.hero) {
    buf = await composeHero(shot);
  } else {
    if (!existsSync(shot.screen)) {
      throw new Error(`Asset manquant : ${shot.screen}`);
    }
    buf = await composePhoneShot({
      headline: shot.headline,
      subheadline: shot.subheadline,
      body: shot.body,
      accent: shot.accent,
      screenPath: shot.screen,
    });
  }
  await sharp(buf).png({ compressionLevel: 9 }).toFile(outPath);
  const meta = await sharp(buf).metadata();
  console.log(`✓ ${shot.file}  ${meta.width}×${meta.height}`);
  return {
    file: shot.file,
    width: meta.width,
    height: meta.height,
    recommended: shot.recommended,
    source: shot.sourceLabel ?? null,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`→ Captures App Store iOS 6,5" (${W}×${H})…`);
  const results = [];
  for (const shot of SHOTS) {
    results.push(await writeShot(shot));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    appVersion: '1.0.8',
    dimensions: `${W}×${H}`,
    portrait: true,
    device: 'iPhone 6,5" (App Store Connect)',
    screenSources: 'website/public/images/app/ (captures simulateur réelles)',
    branding: [
      'assets/branding/proday-symbol-white.png + wordmark PRODAY',
      'assets/branding/proday-lockup-official-source.png (hero)',
    ],
    files: results,
    recommendedFirst: results.filter((r) => r.recommended).sort((a, b) => a.recommended - b.recommended).map((r) => r.file),
  };
  writeFileSync(resolve(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n✓ ${results.length} captures → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

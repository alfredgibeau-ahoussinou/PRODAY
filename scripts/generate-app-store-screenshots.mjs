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
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from '../website/node_modules/sharp/lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(repoRoot, 'assets/marketing/app-store/ios-6.5');

const LEGACY = process.argv.includes('--legacy');
const W = LEGACY ? 1242 : 1284;
const H = LEGACY ? 2688 : 2778;

const LOGO = resolve(repoRoot, 'assets/branding/logo-proday-official.png');
const LOCKUP = resolve(repoRoot, 'assets/branding/proday-lockup-official-source.png');

/** Accents alignés assets/branding/README.md */
const ACCENT = {
  master: '#C5A059',
  joueur: '#FFFFFF',
  coach: '#C5A059',
  club: '#10B981',
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
  const top = scale(680);
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
        <radialGradient id="g" cx="50%" cy="18%" r="75%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.22"/>
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
  const yHead = scale(120);
  const ySub = scale(210);
  const yBody = scale(290);
  const headSize = scale(72);
  const subSize = scale(52);
  const bodySize = scale(34);
  const subColor = accent === '#FFFFFF' ? '#C5A059' : accent;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${scale(520)}">
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

function phoneFrameSvg(accent) {
  const { phoneW, phoneH, radius, bezel, screenRadius } = phoneLayout();
  const innerW = phoneW - bezel * 2;
  const innerH = phoneH - bezel * 2;
  const islandW = scale(180);
  const islandH = scale(36);
  const islandX = (phoneW - islandW) / 2;
  const islandY = bezel + scale(18);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${phoneW}" height="${phoneH}">
      <rect x="0" y="0" width="${phoneW}" height="${phoneH}" rx="${radius}" fill="#1A1A1A"/>
      <rect x="${bezel}" y="${bezel}" width="${innerW}" height="${innerH}" rx="${screenRadius}" fill="#050505"/>
      <rect x="${islandX}" y="${islandY}" width="${islandW}" height="${islandH}" rx="${islandH / 2}" fill="#000"/>
      <rect x="0" y="0" width="${phoneW}" height="${phoneH}" rx="${radius}" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
    </svg>`,
  );
}

function footerSvg() {
  const tagY = H - scale(120);
  const urlY = H - scale(70);
  const size = scale(28);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${scale(160)}">
      <style>
        .t { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 600; fill: rgba(255,255,255,0.55); letter-spacing: 0.08em; }
        .u { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 500; fill: #C5A059; }
      </style>
      <text x="${W / 2}" y="${tagY - (H - scale(160))}" text-anchor="middle" class="t" font-size="${size}">CONNECTER. PROGRESSER. RÉVÉLER.</text>
      <text x="${W / 2}" y="${urlY - (H - scale(160))}" text-anchor="middle" class="u" font-size="${scale(24)}">proday75.fr</text>
    </svg>`,
  );
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

  const lockupSrc = existsSync(LOCKUP) ? LOCKUP : LOGO;
  const lockupW = scale(780);
  const lockup = await sharp(lockupSrc).resize({ width: lockupW, fit: 'inside' }).png().toBuffer();
  const meta = await sharp(lockup).metadata();
  layers.push({
    input: lockup,
    left: Math.round((W - meta.width) / 2),
    top: Math.round(H * 0.38 - meta.height / 2),
  });

  layers.push({ input: footerSvg(), top: H - scale(160), left: 0 });
  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function composePhoneShot({ headline, subheadline, body, accent, screenPath, screenCrop }) {
  const { left, top, bezel, screenW, screenH, screenRadius } = phoneLayout();
  const screenX = left + bezel;
  const screenY = top + bezel;

  let screenBuf;
  if (screenCrop) {
    screenBuf = await sharp(screenPath)
      .extract(screenCrop)
      .resize(screenW, screenH, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer();
  } else {
    screenBuf = await fitScreenImage(screenPath, screenW, screenH);
  }

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screenW}" height="${screenH}">
      <rect width="${screenW}" height="${screenH}" rx="${screenRadius}" fill="#fff"/>
    </svg>`,
  );
  const roundedScreen = await sharp(screenBuf)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const frame = await sharp(phoneFrameSvg(accent)).png().toBuffer();

  const layers = [
    { input: backgroundSvg(accent), top: 0, left: 0 },
    { input: headlineSvg({ headline, subheadline, body, accent }), top: 0, left: 0 },
    { input: roundedScreen, top: screenY, left: screenX },
    { input: frame, top, left },
    { input: footerSvg(), top: H - scale(160), left: 0 },
  ];

  return sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const gen = resolve(repoRoot, 'assets/generated/classic');
const mock = resolve(repoRoot, 'assets/mockups');

/** @type {Array<{file:string, hero?:boolean, headline:string, subheadline?:string, body?:string, accent:string, screen?:string, crop?:{left:number,top:number,width:number,height:number}, recommended?:number}>} */
const SHOTS = [
  {
    file: '01-hero-brand.png',
    hero: true,
    headline: 'PRODAY',
    subheadline: 'CONNECTER. PROGRESSER. RÉVÉLER.',
    body: 'L\'écosystème foot amateur & semi-pro',
    accent: ACCENT.master,
    recommended: 1,
  },
  {
    file: '02-joueur-profil-carriere.png',
    headline: 'Profil & carrière',
    subheadline: 'Score, stats, CV en ligne',
    body: 'Pôle Joueur · Pro Day Man & Woman',
    accent: ACCENT.joueur,
    screen: resolve(gen, 'classic-profile.jpg'),
    recommended: 2,
  },
  {
    file: '03-joueur-mercato.png',
    headline: 'Mercato ciblé',
    subheadline: 'Annonces par poste & niveau',
    body: 'Candidatures · suivi recruteurs',
    accent: ACCENT.joueur,
    screen: resolve(gen, 'classic-mercato.jpg'),
    recommended: 3,
  },
  {
    file: '04-joueur-arena.png',
    headline: 'Arena & tournois',
    subheadline: 'Inscriptions · palmarès local',
    body: 'Organisez et participez',
    accent: ACCENT.joueur,
    screen: resolve(gen, 'classic-arena.jpg'),
  },
  {
    file: '05-joueur-pulse-activites.png',
    headline: 'Journal d\'activités',
    subheadline: 'Séances · matchs · highlights',
    body: 'Analyse IA sur vos séances',
    accent: ACCENT.joueur,
    screen: resolve(gen, 'classic-exp-pulse.jpg'),
  },
  {
    file: '06-coach-profil-staff.png',
    headline: 'Espace Coach',
    subheadline: 'Staff · séances · coaching',
    body: 'Vérification diplômes · messagerie',
    accent: ACCENT.coach,
    screen: resolve(gen, 'classic-staff.jpg'),
  },
  {
    file: '07-club-recrutement.png',
    headline: 'Espace Club',
    subheadline: 'Recrutement · convocations',
    body: 'Mercato club · matchs amicaux',
    accent: ACCENT.club,
    screen: resolve(mock, 'maquette-proday-ecrans-principaux.png'),
    crop: { left: 980, top: 0, width: 520, height: 1024 },
  },
  {
    file: '08-matchs-amicaux.png',
    headline: 'Matchs amicaux',
    subheadline: 'RSVP · Live Stats',
    body: 'Organisation simplifiée',
    accent: ACCENT.joueur,
    screen: resolve(gen, 'classic-match.jpg'),
  },
  {
    file: '09-communaute-reels.png',
    headline: 'Communauté & Reels',
    subheadline: 'Fil · highlights · visibilité',
    body: 'Question de la semaine',
    accent: ACCENT.joueur,
    screen: resolve(gen, 'classic-exp-discover.jpg'),
  },
  {
    file: '10-partenaires-sponsors.png',
    headline: 'Partenaires & sponsors',
    subheadline: 'Visibilité clubs & marques',
    body: 'Espace National Pro',
    accent: ACCENT.master,
    screen: resolve(gen, 'classic-exp-sponsors.jpg'),
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
      screenCrop: shot.crop,
    });
  }
  await sharp(buf).png({ compressionLevel: 9 }).toFile(outPath);
  const meta = await sharp(buf).metadata();
  console.log(`✓ ${shot.file}  ${meta.width}×${meta.height}`);
  return { file: shot.file, width: meta.width, height: meta.height, recommended: shot.recommended };
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
    dimensions: `${W}×${H}`,
    portrait: true,
    device: 'iPhone 6,5" (App Store Connect)',
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

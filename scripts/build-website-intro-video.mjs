#!/usr/bin/env node
/**
 * Vidéo de présentation ProDay (16:9) pour le site — modal « Voir la vidéo ».
 *
 * Compose : clips hero + foot (fondus, étalonnage), textes incrustés
 * (PNG via build-intro-overlays.py), carte logo finale et musique.
 *
 * Sortie : website/public/videos/proday-intro.mp4
 * Usage  : npm run intro:build:website
 *
 * Médias : Mixkit / assets locaux (usage commercial).
 * Dépendance overlays : Pillow (`python3 -m venv .venv-intro && .venv-intro/bin/pip install Pillow`).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TMP = join(ROOT, 'assets/intro/.website-build');
const OUT = join(ROOT, 'website/public/videos/proday-intro.mp4');

const W = 1920;
const H = 1080;
const FPS = 30;
const CLIP_DUR = 4.0;
const XFADE = 0.65;
const CARD_DUR = 3.8;

/** Scènes honnêtes — produit actuel, sans métriques fictives ni « visio gratuite ». */
const SCENES = [
  {
    file: 'website/public/videos/hero-stadium.mp4',
    title: 'CONNECTER',
    subtitle: 'Ton profil, tes matchs, ton club — au même endroit',
  },
  {
    file: 'website/public/videos/hero-match.mp4',
    title: 'PÔLE JOUEUR',
    subtitle: 'Amateur → Centre → Pro · un seul espace',
  },
  {
    file: 'assets/intro/clips/match-two-teams.mp4',
    title: '7 PÔLES · COVOITURAGE',
    subtitle: 'Joueur, club, staff, santé, événements, fans, partenaires',
  },
];

const N = SCENES.length;

function resolvePython() {
  const candidates = [
    join(ROOT, '.venv-intro/bin/python3'),
    join(ROOT, '.venv-intro/bin/python'),
    'python3',
  ];
  for (const bin of candidates) {
    const probe = spawnSync(bin, ['-c', 'from PIL import Image'], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    if (probe.status === 0) return bin;
  }
  console.error(
    '✗ Pillow introuvable. Installez-le :\n' +
      '  python3 -m venv .venv-intro && .venv-intro/bin/pip install Pillow',
  );
  process.exit(1);
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (res.status !== 0) {
    console.error(`✗ Échec : ${cmd}`);
    process.exit(res.status ?? 1);
  }
}

function main() {
  if (!existsSync(join(ROOT, 'ffmpeg')) && spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
    console.error('✗ ffmpeg introuvable (brew install ffmpeg)');
    process.exit(1);
  }

  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  mkdirSync(dirname(OUT), { recursive: true });

  const python = resolvePython();
  const cfg = {
    width: W,
    height: H,
    logo: join(ROOT, 'assets/branding/logo-proday-official.png'),
    tagline: 'CONNECTER. PROGRESSER. RÉVÉLER.',
    endcardSubtitle: 'Bêta iOS · 11 août 2026 à 18 h',
    titleFontSize: 88,
    bodyFontSize: 36,
    minTitleFontSize: 52,
    endcardFontSize: 36,
    endcardSubtitleFontSize: 28,
    logoWidthRatio: 0.32,
    logoYOffset: 28,
    captionBlockYRatio: 0.58,
    backdropTopRatio: 0.48,
    sideMargin: 96,
    fonts: {
      title: '/System/Library/Fonts/Supplemental/Arial Black.ttf',
      body: '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    },
    captions: SCENES.map(({ title, subtitle }) => ({ title, subtitle })),
  };

  console.log('→ Génération des overlays (textes + carte logo)…');
  run(python, [join(ROOT, 'scripts/build-intro-overlays.py'), TMP, JSON.stringify(cfg)]);

  const inputs = [];
  SCENES.forEach((s) => {
    // Loop court si le clip est plus court que CLIP_DUR (ex. player-dribbling).
    inputs.push('-stream_loop', '-1', '-i', join(ROOT, s.file));
  });
  SCENES.forEach((_, i) =>
    inputs.push(
      '-loop',
      '1',
      '-framerate',
      String(FPS),
      '-t',
      String(CLIP_DUR),
      '-i',
      join(TMP, `caption${i}.png`),
    ),
  );
  inputs.push('-loop', '1', '-framerate', String(FPS), '-t', String(CARD_DUR), '-i', join(TMP, 'endcard.png'));
  inputs.push('-stream_loop', '-1', '-i', join(ROOT, 'assets/intro/music/sports-highlights.mp3'));

  const capBase = N;
  const cardIdx = N * 2;
  const musicIdx = cardIdx + 1;

  const parts = [];

  SCENES.forEach((_, i) => {
    parts.push(
      `[${i}:v]trim=duration=${CLIP_DUR},setpts=PTS-STARTPTS,fps=${FPS},` +
        `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},` +
        `eq=contrast=1.08:saturation=1.12:brightness=-0.02,` +
        `colorbalance=bs=0.05:bm=0.03,vignette=PI/5,format=yuv420p,setsar=1[vbg${i}]`,
    );
    parts.push(
      `[${capBase + i}:v]fps=${FPS},format=rgba,` +
        `fade=t=in:st=0.2:d=0.4:alpha=1,fade=t=out:st=${(CLIP_DUR - 0.45).toFixed(2)}:d=0.35:alpha=1,` +
        `setpts=PTS-STARTPTS[cap${i}]`,
    );
    parts.push(`[vbg${i}][cap${i}]overlay=0:0,format=yuv420p,setsar=1[v${i}]`);
  });

  parts.push(`[${cardIdx}:v]fps=${FPS},scale=${W}:${H},format=yuv420p,setsar=1[card]`);

  let prev = 'v0';
  let acc = CLIP_DUR;
  for (let i = 1; i < N; i += 1) {
    const off = (acc - XFADE).toFixed(3);
    parts.push(`[${prev}][v${i}]xfade=transition=fade:duration=${XFADE}:offset=${off}[x${i}]`);
    prev = `x${i}`;
    acc = acc + CLIP_DUR - XFADE;
  }
  const cardOff = (acc - XFADE).toFixed(3);
  parts.push(`[${prev}][card]xfade=transition=fadewhite:duration=${XFADE}:offset=${cardOff}[vout]`);

  const TOTAL = acc + CARD_DUR - XFADE;
  parts.push(
    `[${musicIdx}:a]atrim=0:${TOTAL.toFixed(3)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=0.9,afade=t=out:st=${(TOTAL - 1.0).toFixed(3)}:d=1.0,volume=0.75[aout]`,
  );

  console.log(`→ Rendu vidéo (${TOTAL.toFixed(2)}s, ${W}x${H}@${FPS})…`);
  run('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex',
    parts.join(';'),
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    '-r',
    String(FPS),
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'medium',
    '-crf',
    '21',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    OUT,
  ]);

  rmSync(TMP, { recursive: true, force: true });
  console.log(`✓ Vidéo site : ${OUT} (${TOTAL.toFixed(2)}s)`);
}

main();

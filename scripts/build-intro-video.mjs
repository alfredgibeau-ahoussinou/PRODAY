#!/usr/bin/env node
/**
 * Rendu de l'intro ProDay (vidéo unique, verticale 1080x1920).
 *
 * Compose : montage de clips foot (fondus enchaînés, étalonnage, léger zoom),
 * textes incrustés (PNG générés par build-intro-overlays.py), carte logo finale
 * et musique synchronisée.
 *
 * Sortie : assets/intro/proday-intro.mp4
 * Usage  : node scripts/build-intro-video.mjs
 *
 * Médias : Mixkit (licence Mixkit Free — usage commercial, sans attribution).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLIPS = join(ROOT, 'assets/intro/clips');
const OUT = join(ROOT, 'assets/intro/proday-intro.mp4');
const TMP = join(ROOT, 'assets/intro/.build');

const W = 1080;
const H = 1920;
const FPS = 30;
const CLIP_DUR = 3.5;
const XFADE = 0.7;
const CARD_DUR = 4.2;

const CFG = {
  width: W,
  height: H,
  logo: join(ROOT, 'assets/branding/logo-proday-official.png'),
  tagline: 'CONNECTER. PROGRESSER. RÉVÉLER.',
  endcardSubtitle: 'Bienvenue dans cette nouvelle expérience',
  fonts: {
    title: '/System/Library/Fonts/Supplemental/Arial Black.ttf',
    body: '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  },
  captions: [
    { title: 'CONNECTER', subtitle: 'Ton équipe, tes matchs, ta communauté' },
    { title: 'PROGRESSER', subtitle: 'Pôle Joueur · Amateur → Pro' },
    { title: 'RÉVÉLER', subtitle: '7 pôles · covoiturage · carrière' },
  ],
};

const CLIP_SEQUENCE = [
  { file: 'match-two-teams.mp4', start: 0.5 },
  { file: 'player-dribbling.mp4', start: 0.0 },
  { file: 'goal-play.mp4', start: 3.6 },
];

const N = CLIP_SEQUENCE.length;

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
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  console.log('→ Génération des overlays (textes + carte logo)…');
  run(resolvePython(), [join(ROOT, 'scripts/build-intro-overlays.py'), TMP, JSON.stringify(CFG)]);

  // Inputs.
  const inputs = [];
  CLIP_SEQUENCE.forEach((c) => inputs.push('-i', join(CLIPS, c.file)));
  CFG.captions.forEach((_, i) =>
    inputs.push('-loop', '1', '-framerate', String(FPS), '-t', String(CLIP_DUR), '-i', join(TMP, `caption${i}.png`)),
  );
  inputs.push('-loop', '1', '-framerate', String(FPS), '-t', String(CARD_DUR), '-i', join(TMP, 'endcard.png'));
  inputs.push('-i', join(ROOT, 'assets/intro/music/sports-highlights.mp3'));

  const capBase = N;
  const cardIdx = N * 2;
  const musicIdx = cardIdx + 1;

  const bigW = Math.round(W * 1.12);
  const bigH = Math.round(H * 1.12);
  const zf = Math.round(CLIP_DUR * FPS);
  const cardZf = Math.round(CARD_DUR * FPS);

  const parts = [];

  CLIP_SEQUENCE.forEach((c, i) => {
    parts.push(
      `[${i}:v]trim=start=${c.start}:duration=${CLIP_DUR},setpts=PTS-STARTPTS,` +
        `scale=-2:${bigH},crop=${bigW}:${bigH},` +
        `zoompan=z='min(1.0+0.10*on/${zf}\\,1.10)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS},` +
        `eq=contrast=1.07:saturation=1.14:brightness=-0.015:gamma=0.98,` +
        `colorbalance=rs=-0.02:bs=0.06:rm=-0.02:bm=0.04,` +
        `vignette=PI/4.5,format=yuv420p,setsar=1[vbg${i}]`,
    );
    parts.push(
      `[${capBase + i}:v]fps=${FPS},format=rgba,` +
        `fade=t=in:st=0.25:d=0.4:alpha=1,fade=t=out:st=${(CLIP_DUR - 0.45).toFixed(2)}:d=0.35:alpha=1,` +
        `setpts=PTS-STARTPTS[cap${i}]`,
    );
    parts.push(`[vbg${i}][cap${i}]overlay=0:0,format=yuv420p,setsar=1[v${i}]`);
  });

  parts.push(
    `[${cardIdx}:v]fps=${FPS},scale=${W}:${H},` +
      `zoompan=z='min(1.0+0.05*on/${cardZf}\\,1.05)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS},` +
      `format=yuv420p,setsar=1[card]`,
  );

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
      `afade=t=in:st=0:d=1.0,afade=t=out:st=${(TOTAL - 1.0).toFixed(3)}:d=1.0,volume=0.92[aout]`,
  );

  const filter = parts.join(';');

  console.log(`→ Rendu vidéo (${TOTAL.toFixed(2)}s, ${W}x${H}@${FPS})…`);
  run('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex',
    filter,
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
    '20',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    OUT,
  ]);

  rmSync(TMP, { recursive: true, force: true });
  console.log(`✓ Intro générée : ${OUT}`);
}

main();

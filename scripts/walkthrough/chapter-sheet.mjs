#!/usr/bin/env node
/**
 * Planches de contrôle : une image par chapitre de chaque vidéo, annotée
 * (numéro, identifiant d'étape, horodatage) et assemblée en grille.
 *
 *   node scripts/walkthrough/chapter-sheet.mjs [dossier-exports] [dossier-shots]
 *
 * Sert de preuve de revue : on voit, chapitre par chapitre, ce que le spectateur
 * voit réellement — légendes, écran atteint, fond flou des segments paysage.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const FFMPEG = process.env.PRODAY_FFMPEG ?? '/tmp/proday-rec/node_modules/ffmpeg-static/ffmpeg';
const OUT = process.argv[2] ?? path.resolve('walkthrough-exports');
const SHOTS = process.argv[3] ?? '/tmp/proday-shots';
const DEST = process.env.PRODAY_SHEETS ?? '/tmp/proday-sheets';
fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

/** Vidéo → dossier de capture correspondant. */
const SOURCES = {
  'ProDay-Club-Desktop.mp4': 'club-desktop',
  'ProDay-Club-Mobile.mp4': 'club-mobile',
  'ProDay-Coach-Desktop.mp4': 'coach-desktop',
  'ProDay-Coach-Mobile.mp4': 'coach-mobile',
  'ProDay-Player-Desktop.mp4': 'player-desktop',
  'ProDay-Player-Mobile.mp4': 'player-mobile',
  'ProDay-Parent-Desktop.mp4': 'parent-desktop',
  'ProDay-Parent-Mobile.mp4': 'parent-mobile',
};

// ffmpeg-static est livré sans configuration fontconfig : drawtext exige un
// fichier de police explicite, sinon les tuiles ne sont jamais écrites.
const FONT = process.env.PRODAY_FONT ?? '/System/Library/Fonts/Supplemental/Arial.ttf';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const run = (args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', ...args]);

for (const [video, dir] of Object.entries(SOURCES)) {
  const mp4 = path.join(OUT, video);
  const manifest = path.join(SHOTS, dir, 'steps.json');
  if (!fs.existsSync(mp4) || !fs.existsSync(manifest)) {
    console.log(`[skip] ${video} (fichier ou manifeste absent)`);
    continue;
  }
  const steps = JSON.parse(fs.readFileSync(manifest, 'utf8')).steps;
  const mobile = /Mobile/.test(video);
  const TW = mobile ? 216 : 640;
  const TH = mobile ? 468 : 360;
  const COLS = mobile ? 4 : 2;
  const tmp = path.join(DEST, dir);
  fs.mkdirSync(tmp, { recursive: true });

  const tiles = [];
  let lastGood = null;
  steps.forEach((s, i) => {
    const next = steps[i + 1]?.t0 ?? s.t0 + 8;
    const file = path.join(tmp, `c${String(i).padStart(2, '0')}.jpg`);
    // On échantillonne la FIN du chapitre : c'est l'écran stabilisé que la
    // narration décrit (le début montre encore la transition, voire l'étape
    // précédente). Le dernier chapitre peut dépasser la fin du fichier : on
    // recule alors jusqu'à obtenir une image au lieu d'une tuile vide.
    for (const back of [0, 3, 6, 9, 12]) {
      const t = Math.max(0, next - 1.8 - back);
      run(['-ss', String(t), '-i', mp4, '-frames:v', '1', '-vf', `scale=${TW}:${TH}:force_original_aspect_ratio=decrease,pad=${TW}:${TH}:(ow-iw)/2:(oh-ih)/2:color=0x101418`, '-q:v', '3', '-y', file]);
      if (fs.existsSync(file)) break;
    }
    if (!fs.existsSync(file) && lastGood) fs.copyFileSync(lastGood, file);
    lastGood = fs.existsSync(file) ? file : lastGood;
    const label = `${i + 1}. ${s.id} ${mmss(s.t0)}`.replace(/[':\\]/g, ' ');
    const labelled = path.join(tmp, `l${String(i).padStart(2, '0')}.jpg`);
    run([
      '-i', file,
      '-vf', `drawtext=fontfile='${FONT}':text='${label}':x=8:y=8:fontsize=${mobile ? 16 : 22}:fontcolor=white:box=1:boxcolor=black@0.72:boxborderw=6`,
      '-q:v', '3', '-y', labelled,
    ]);
    tiles.push(labelled);
  });

  // Grille : `COLS` colonnes, autant de lignes que nécessaire.
  const rows = Math.ceil(tiles.length / COLS);
  const inputs = tiles.flatMap((t) => ['-i', t]);
  const layout = tiles
    .map((_, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      return `${col * TW}_${row * TH}`;
    })
    .join('|');
  const sheet = path.join(DEST, `${video.replace(/\.mp4$/, '')}-chapitres.jpg`);
  run([
    ...inputs,
    '-filter_complex', `xstack=inputs=${tiles.length}:layout=${layout}:fill=0x101418`,
    '-q:v', '3', '-y', sheet,
  ]);
  console.log(`[planche] ${sheet} — ${tiles.length} chapitres (${COLS}×${rows})`);
}

console.log(`\nPlanches dans ${DEST}`);

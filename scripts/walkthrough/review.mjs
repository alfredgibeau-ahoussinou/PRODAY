#!/usr/bin/env node
/**
 * Revue finale des exports : propriétés des flux, chapitres, durée, puis
 * feuille de contrôle 2 × 2 par vidéo (milieu de quatre chapitres répartis).
 *
 *   node scripts/walkthrough/review.mjs [dossier-de-sortie]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const FFMPEG = process.env.PRODAY_FFMPEG ?? '/tmp/proday-rec/node_modules/ffmpeg-static/ffmpeg';
const OUT = process.argv[2] ?? path.resolve('walkthrough-exports');
const SHOTS = process.env.PRODAY_SHOTS ?? '/tmp/proday-shots';
const REVIEW = process.env.PRODAY_REVIEW ?? '/tmp/proday-review';

// Les sous-titres externes accompagnent chaque vidéo : `captions.srt` est produit
// par l'assembleur dans le dossier de capture, on le copie à côté du MP4 livré
// (les fiches annoncent « sous-titres incrustés + captions.srt fourni »).
const SRT_SOURCES = {
  'ProDay-Club-Desktop.mp4': 'club-desktop',
  'ProDay-Club-Mobile.mp4': 'club-mobile',
  'ProDay-Coach-Desktop.mp4': 'coach-desktop',
  'ProDay-Coach-Mobile.mp4': 'coach-mobile',
  'ProDay-Player-Desktop.mp4': 'player-desktop',
  'ProDay-Player-Mobile.mp4': 'player-mobile',
  'ProDay-Parent-Desktop.mp4': 'parent-desktop',
  'ProDay-Parent-Mobile.mp4': 'parent-mobile',
};
for (const [video, dir] of Object.entries(SRT_SOURCES)) {
  const src = path.join(SHOTS, dir, 'captions.srt');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUT, video.replace(/\.mp4$/, '.srt')));
  }
}
fs.rmSync(REVIEW, { recursive: true, force: true });
fs.mkdirSync(REVIEW, { recursive: true });

const probe = (file) => {
  let stderr = '';
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? '');
  }
  const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const seconds = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
  const video = stderr.match(/Stream #0:0.*?(\d{3,4}x\d{3,4})/);
  const audio = /Stream #0:\d+.*Audio: aac/.test(stderr);
  const subs = /Stream #0:\d+.*Data:/.test(stderr);
  const chapters = [...stderr.matchAll(/Chapter #0:(\d+): start ([\d.]+), end ([\d.]+)/g)].map((m) => ({
    start: Number(m[2]),
    end: Number(m[3]),
  }));
  return { seconds, res: video ? video[1] : '—', audio, subs, chapters: chapters.filter((c) => c.end > c.start) };
};

const files = fs
  .readdirSync(OUT)
  .filter((f) => f.endsWith('.mp4'))
  .sort();

console.log('| Fichier | Résolution | Durée | Chapitres | Audio | Sous-titres | Taille |');
console.log('|---|---|---|---|---|---|---|');
const rows = [];
for (const f of files) {
  const p = path.join(OUT, f);
  const info = probe(p);
  rows.push({ f, ...info, size: (fs.statSync(p).size / 1e6).toFixed(1) });
  const mm = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  console.log(
    `| ${f} | ${info.res} | ${mm(info.seconds)} | ${info.chapters.length} | ${info.audio ? 'AAC' : '—'} | ${info.subs ? 'oui' : '—'} | ${rows[rows.length - 1].size} Mo |`,
  );
}

// Feuille de contrôle : 4 images réparties sur les chapitres.
for (const r of rows) {
  const n = r.chapters.length;
  if (!n) continue;
  const picks = [0.15, 0.4, 0.65, 0.9].map((k) => {
    const c = r.chapters[Math.min(n - 1, Math.floor(k * n))];
    return c.start + Math.min(6, (c.end - c.start) / 2);
  });
  const shots = picks.map((t, i) => {
    const dest = path.join(REVIEW, `${r.f.replace(/\.mp4$/, '')}-${i}.jpg`);
    execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', path.join(OUT, r.f), '-frames:v', '1', '-y', dest]);
    return dest;
  });
  const sheet = path.join(REVIEW, `${r.f.replace(/\.mp4$/, '')}-sheet.jpg`);
  execFileSync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error',
    '-i', shots[0], '-i', shots[1], '-i', shots[2], '-i', shots[3],
    '-filter_complex',
    '[0:v]scale=760:-1[a];[1:v]scale=760:-1[b];[2:v]scale=760:-1[c];[3:v]scale=760:-1[d];[a][b]hstack[top];[c][d]hstack[bot];[top][bot]vstack',
    '-y', sheet,
  ]);
  console.log(`[feuille] ${sheet}`);
}
console.log(`\n${rows.length} vidéos vérifiées · feuilles dans ${REVIEW}`);

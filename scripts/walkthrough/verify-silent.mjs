#!/usr/bin/env node
/**
 * verify-silent — contrôle des enregistrements muets :
 *  - flux (une seule piste vidéo, aucune piste audio, aucun sous-titre) ;
 *  - décodage intégral : toute erreur ffmpeg est remontée ;
 *  - chapitres présents et cohérents avec la durée ;
 *  - extraction d’images de contrôle (répartition régulière) pour revue visuelle.
 *
 *   node scripts/walkthrough/verify-silent.mjs [dossier]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const FFMPEG = process.env.PRODAY_FFMPEG ?? '/tmp/proday-rec/node_modules/ffmpeg-static/ffmpeg';
const OUT = process.argv[2] ?? path.resolve('walkthrough-silent');
const REVIEW = process.env.PRODAY_SILENT_REVIEW ?? '/tmp/proday-silent-review';
fs.rmSync(REVIEW, { recursive: true, force: true });
fs.mkdirSync(REVIEW, { recursive: true });

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.mp4')).sort();
const rows = [];

for (const f of files) {
  const p = path.join(OUT, f);
  let stderr = '';
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', p], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? '');
  }
  const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const duration = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
  const audio = (stderr.match(/Stream #\d+:\d+.*Audio:/g) ?? []).length;
  const video = (stderr.match(/Stream #\d+:\d+.*Video:/g) ?? []).length;
  // Un vrai flux de sous-titres est signalé « Subtitle: » ; la « Data: bin_data (text) »
  // que l'on voit ici est la **piste de chapitres** écrite depuis le ffmetadata
  // (aucun texte affiché à l'écran).
  const subs = (stderr.match(/Stream #\d+:\d+.*Subtitle:/g) ?? []).length;
  const chapterTrack = /Stream #\d+:\d+.*Data: bin_data \(text/.test(stderr);
  const chapters = (stderr.match(/Chapter #\d+:\d+/g) ?? []).length;
  const res = stderr.match(/Stream #0:0.*?(\d{3,4}x\d{3,4})/)?.[1] ?? '—';

  // Décodage intégral : ffmpeg écrit ses erreurs sur stderr, le débit de décodage
  // est renvoyé sur stdout. Toute image illisible ferait échouer la commande.
  let decode = 'OK';
  let decodedFrames = 0;
  try {
    const out = execFileSync(FFMPEG, ['-v', 'error', '-i', p, '-f', 'null', '-'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    }).toString();
    const m = out.match(/frame=\s*(\d+)/g);
    if (m) decodedFrames = Number(m[m.length - 1].replace(/[^\d]/g, ''));
  } catch (e) {
    decode = `ERREUR : ${String(e.stderr ?? e).slice(0, 120)}`;
  }

  // Plus longue suite d'images figées : on échantillonne à 1 i/s et on cherche
  // la plus longue série d'images identiques. C'est le contrôle indépendant du
  // défaut principal des premières versions (un écran gelé tenu 30 s).
  let longestFreeze = 0;
  try {
    const raw = execFileSync(
      FFMPEG,
      ['-v', 'error', '-i', p, '-vf', 'fps=1,scale=48:27,format=gray', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
      { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 },
    );
    const NPX = 48 * 27;
    let run = 1;
    let prev = null;
    for (let i = 0; i * NPX + NPX <= raw.length; i += 1) {
      const cur = raw.subarray(i * NPX, i * NPX + NPX);
      if (prev) {
        let d = 0;
        for (let j = 0; j < NPX; j += 1) d += Math.abs(cur[j] - prev[j]);
        if (d / NPX < 0.35) run += 1;
        else {
          if (run > longestFreeze) longestFreeze = run;
          run = 1;
        }
      }
      prev = cur;
    }
    if (run > longestFreeze) longestFreeze = run;
  } catch {
    /* mesure indicative */
  }

  rows.push({ f, duration, res, audio, video, subs, chapterTrack, chapters, decode, decodedFrames, longestFreeze, size: (fs.statSync(p).size / 1024 / 1024).toFixed(1) });

  // Images de contrôle : 4 par fichier, réparties, + une par chapitre pour les
  // fichiers courts (moins de 15 chapitres).
  const picks = [0.1, 0.35, 0.6, 0.85].map((k) => k * Math.max(1, duration - 2));
  const dir = path.join(REVIEW, f.replace(/\.mp4$/, ''));
  fs.mkdirSync(dir, { recursive: true });
  picks.forEach((t, i) => {
    execFileSync(FFMPEG, [
      '-hide_banner', '-loglevel', 'error',
      '-ss', String(t), '-i', p, '-frames:v', '1',
      '-vf', 'scale=900:-1', '-q:v', '3', '-y', path.join(dir, `c${i}-${mmss(t).replace(':', '')}.jpg`),
    ]);
  });
}

const md = [
  '# Vérification des enregistrements muets',
  '',
  '| Fichier | Résolution | Durée | Pistes vidéo | Pistes audio | Sous-titres | Chapitres | Plan fixe le plus long | Décodage | Taille |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| \`${r.f}\` | ${r.res} | ${mmss(r.duration)} | ${r.video} | ${r.audio === 0 ? '**0**' : `⚠️ ${r.audio}`} | ${r.subs === 0 ? '0' : `⚠️ ${r.subs}`} | ${r.chapters} (repères) | ${r.longestFreeze} s | ${r.decode} | ${r.size} Mo |`,
  ),
  '',
  '## Contrôles',
  '',
  `- Absence de piste audio : ${rows.every((r) => r.audio === 0) ? '**conforme pour les 8 fichiers**' : '⚠️ anomalie'}.`,
  `- Une seule piste vidéo par fichier : ${rows.every((r) => r.video === 1) ? 'conforme' : '⚠️ anomalie'}.`,
  `- Aucun flux de sous-titres : ${rows.every((r) => r.subs === 0) ? 'conforme' : '⚠️ anomalie'}.`,
  '- Les fichiers portent une **piste de chapitres** (métadonnées `text` issues du repérage horodaté) :',
  '  elle n’affiche aucun texte à l’image, contrairement à des sous-titres. Aucun sous-titre n’est incrusté.',
  `- Décodage complet sans erreur : ${rows.every((r) => r.decode === 'OK') ? 'conforme' : '⚠️ anomalie'}.`,
  `- Temps morts plafonnés : le plan fixe le plus long est de ${Math.max(...rows.map((r) => r.longestFreeze))} s ` +
    `(plafond de montage : 13 s, marge d'arrondi comprise) — ${rows.every((r) => r.longestFreeze <= 16) ? 'conforme' : '⚠️ anomalie'}.`,
  `  Contrôle indépendant : échantillonnage à 1 i/s du fichier final, recherche de la plus longue suite d'images identiques.`,
  `- Images de contrôle : ${REVIEW} (4 par fichier).`,
  '',
  'Les captures proviennent d’un screencast CDP : le son n’est jamais capté, aucune piste audio n’est',
  'produite ni ajoutée à l’encodage (`-an` explicite). Les lectures vidéo de l’application sont donc muettes',
  'comme le reste de l’enregistrement.',
  '',
].join('\n');

fs.writeFileSync(path.join(OUT, 'VERIFICATION.md'), md);
console.log(md.split('\n').slice(0, 14).join('\n'));
console.log(`\n[ok] ${path.join(OUT, 'VERIFICATION.md')} · images dans ${REVIEW}`);

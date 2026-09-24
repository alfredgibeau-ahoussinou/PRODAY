/**
 * assemble-silent — produit un MP4 **muet** (aucune piste audio, aucun sous-titre,
 * aucun habillage) à partir d'une capture `frames.log` + `steps.json`.
 *
 *   node assemble-silent.mjs /tmp/proday-shots/club-desktop \
 *        walkthrough-silent/ProDay-Club-Desktop-Silent.mp4 \
 *        "Pôle Club — version Desktop (muette)" --width 1920
 *
 * Ce que fait la chaîne, dans l'ordre :
 *  1. La capture d'écran n'est pas une vidéo : c'est une suite d'images envoyées
 *     quand l'écran change. On la transforme en segments « un écran, une durée ».
 *  2. Chaque segment est représenté par sa **dernière** image : une image prise
 *     pendant une transition (menu qui s'ouvre, liste qui se remplit) n'est donc
 *     jamais celle qu'on tient plusieurs secondes à l'écran.
 *  2 bis. Quand la capture a produit des **images suréchantillonnées** (`hi.log`, prises
 *     en densité 2 en desktop et 3 en mobile, voir record.mjs), c'est elles qui
 *     représentent le segment : le flux CDP est plafonné à la résolution CSS, ces
 *     images-là sont rendues à la densité demandée puis réduites en Lanczos.
 *  3. Les écrans de chargement et les images vides sont écartés : on prolonge
 *     l'écran précédent au lieu de filmer un logo d'attente.
 *  4. Les temps morts sont plafonnés (`--hold-cap`) : un écran inchangé n'est
 *     jamais tenu 30 s parce que l'application a gelé. Les pauses de lecture
 *     voulues (8–15 s) sont conservées.
 *  5. Les repères de chapitre sont recalculés sur la durée finale.
 *
 * Différences avec assemble.mjs (version commentée) : pas de synthèse vocale,
 * pas de piste audio, pas de sous-titres incrustés. Les segments hors format
 * (rotation paysage du mobile) sont mis à l'échelle entière puis centrés sur
 * fond noir : rien n'est rogné, aucun effet n'est ajouté.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const req = createRequire('/tmp/proday-rec/package.json');
let FFMPEG = process.env.FFMPEG_BIN ?? null;
if (!FFMPEG) {
  try {
    FFMPEG = req('ffmpeg-static');
  } catch {
    FFMPEG = 'ffmpeg';
  }
}

const [, , outDir, outputArg, titleArg = 'Visite guidée ProDay (muette)', ...rest] = process.argv;
if (!outDir || !outputArg) {
  console.error('Usage: node assemble-silent.mjs <outDir> <output.mp4> "<titre>" [--width 1920] [--fps 30] [--hold-cap 13] [--no-trim]');
  process.exit(1);
}
const hasFlag = (name) => rest.includes(name);
const getOpt = (name, def) => {
  const i = rest.indexOf(name);
  return i >= 0 ? Number(rest[i + 1]) : def;
};
const TARGET_WIDTH = getOpt('--width', 1920);
const FPS = getOpt('--fps', 30);
/** Durée maximale pendant laquelle un écran inchangé reste affiché. */
const HOLD_CAP = getOpt('--hold-cap', 13);
const TRIM = !hasFlag('--no-trim');
/** Analyse seule : chiffre les coupes sans encoder. */
const DRY_RUN = hasFlag('--dry-run');
/** Seuil de changement d'écran (écart moyen sur une vignette 96×54 en niveaux de gris).
 *  Volontairement bas : mieux vaut découper un écran qui s'anime en plusieurs
 *  segments courts que fusionner deux écrans différents en un seul tenu longtemps. */
const CHANGE_THRESH = 1.5;
/**
 * Image entièrement noire (montage/remontage de la page). Volontairement très
 * strict : les écrans légitimes de ProDay sont sombres (moyenne ~7 sur 255) et
 * un seuil plus large écarterait de vraies pages, par exemple l'écran
 * « Sélectionnez votre univers » qui est presque noir.
 */
const isBlank = (_mean, sd) => sd < 1.0;

const steps = JSON.parse(fs.readFileSync(path.join(outDir, 'steps.json'), 'utf8'));
const MOBILE = Boolean(steps.cfg?.mobile);
const CANVAS = MOBILE
  ? { w: 1080, h: 2340 }
  : { w: TARGET_WIDTH, h: Math.round((TARGET_WIDTH * 9) / 16 / 2) * 2 };

const outputPath = path.resolve(outputArg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const run = (args, opts = {}) =>
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString();
const runQuiet = (args, cwd) => {
  try {
    return run(args, { cwd });
  } catch (e) {
    const err = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? e);
    console.error(`\n[cmd échouée] ffmpeg ${args.join(' ')}\n${err.split('\n').slice(-14).join('\n')}`);
    process.exit(1);
  }
};
const probe = (file) => {
  let stderr = '';
  try {
    run(['-hide_banner', '-i', file]);
  } catch (e) {
    stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? '');
  }
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  return {
    duration: m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0,
    audioStreams: (stderr.match(/Stream #\d+:\d+.*Audio:/g) ?? []).length,
    videoStreams: (stderr.match(/Stream #\d+:\d+.*Video:/g) ?? []).length,
    chapters: (stderr.match(/Chapter #\d+:\d+/g) ?? []).length,
  };
};

// ---------- 1. Images horodatées (dernière session du journal) ----------
const logLines = fs
  .readFileSync(path.join(outDir, 'frames.log'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const sessions = [];
let cur = [];
for (const l of logLines) {
  if (l.i === 0 && cur.length) sessions.push(cur), (cur = []);
  cur.push(l);
}
if (cur.length) sessions.push(cur);
const framesDir = path.join(outDir, 'frames');
const frames = sessions[sessions.length - 1]
  .map((f) => ({ ...f, file: f.file ?? path.join(framesDir, `f${String(f.i).padStart(6, '0')}.jpg`) }))
  .filter((f) => fs.existsSync(f.file));
if (frames.length < 10) throw new Error(`Trop peu de frames dans ${outDir}`);

const t0 = frames[0].ts;
const timed = frames.map((f) => ({ ...f, t: f.ts - t0 }));
const stepDuration = steps.steps[steps.steps.length - 1].t0;
const TOTAL = Math.max(timed[timed.length - 1].t + 1.0, stepDuration + 1.2);
console.log(`[info] ${timed.length} images · capture ${timed[timed.length - 1].t.toFixed(1)}s · cible ${TOTAL.toFixed(1)}s`);

// ---------- 2. Analyse des images (une passe ffmpeg, vignettes 48×27) ----------
const analysisDir = path.join(outDir, 'analysis-seq');
fs.rmSync(analysisDir, { recursive: true, force: true });
fs.mkdirSync(analysisDir, { recursive: true });
timed.forEach((f, i) => {
  const to = path.join(analysisDir, `f${String(i).padStart(6, '0')}.jpg`);
  try {
    fs.linkSync(f.file, to);
  } catch {
    fs.copyFileSync(f.file, to);
  }
});
// Vignette d'analyse : 96×54. Assez fine pour qu'un changement de texte entre
// deux écrans de même disposition soit vu, assez petite pour rester rapide.
const TW = 96;
const TH = 54;
const gray = execFileSync(
  FFMPEG,
  ['-v', 'error', '-i', path.join(analysisDir, 'f%06d.jpg'), '-vf', `scale=${TW}:${TH},format=gray`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
  { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 512 * 1024 * 1024 },
);
const NPX = TW * TH;
const stats = [];
for (let i = 0; i < timed.length; i += 1) {
  const off = i * NPX;
  if (off + NPX > gray.length) break;
  let s = 0;
  for (let j = 0; j < NPX; j += 1) s += gray[off + j];
  const mean = s / NPX;
  let v = 0;
  for (let j = 0; j < NPX; j += 1) v += (gray[off + j] - mean) ** 2;
  stats.push({ mean, sd: Math.sqrt(v / NPX), blank: isBlank(mean, Math.sqrt(v / NPX)), sig: gray.subarray(off, off + NPX) });
}
if (stats.length !== timed.length) throw new Error(`Analyse incomplète : ${stats.length}/${timed.length} images`);

/** Écart moyen entre deux vignettes (0 = identiques). */
const mad = (a, b) => {
  let s = 0;
  for (let j = 0; j < NPX; j += 1) s += Math.abs(a[j] - b[j]);
  return s / NPX;
};

// ---------- 3. Segments « un écran, une durée » ----------
// Un segment démarre sur une image qui diffère du dernier écran retenu.
const segs = [];
let lastSig = null;
let lastFile = null;
let segStart = 0;
for (let i = 0; i < timed.length; i += 1) {
  const st = stats[i];
  const f = timed[i];
  if (st.blank) {
    // Image entièrement noire : on ne la filme pas. Le temps écoulé est absorbé
    // par le segment courant (puis plafonné plus bas).
    continue;
  }
  const changed = lastSig === null || mad(st.sig, lastSig) > CHANGE_THRESH;
  if (changed && lastFile) segs.push({ start: segStart, end: f.t, file: lastFile, hires: false });
  if (changed) {
    segStart = f.t;
    lastSig = st.sig;
  }
  lastFile = f.file;
}
if (lastFile)
  segs.push({
    start: segStart,
    end: Math.max(TOTAL, timed[timed.length - 1].t),
    file: lastFile,
    hires: false,
  });

// ---------- 3 bis. Prologue : la connexion n'est pas filmée ----------
// Les scénarios déclarent deux étapes techniques (`start` à 0 s et `login`) avant
// le premier écran réel. Sur les pôles dont la connexion se fait dans le format
// filmé, ces 15 à 20 premières secondes montrent la sélection d'univers, la porte
// « Espace » et le formulaire de connexion : rien de tout cela n'a sa place dans
// une visite de l'application. Le montage démarre donc sur le segment qui contient
// le premier écran réel (et non au milieu de celui-ci).
const SYNTHETIC_STEPS = new Set(['start', 'login']);
let prologueCut = 0;
if (TRIM && !hasFlag('--keep-prologue')) {
  const i0 = steps.steps.findIndex((s) => !SYNTHETIC_STEPS.has(s.id));
  if (i0 > 0) {
    const cutAt = steps.steps[i0].t0;
    const idx = segs.findIndex((s) => cutAt < s.end);
    if (idx > 0) {
      prologueCut = segs[idx].start;
      segs.splice(0, idx);
    }
  }
}

// ---------- 3 ter. Images suréchantillonnées ----------
// Une image nette n'est retenue que si elle est **strictement à l'intérieur** du
// segment : une image prise juste après le changement appartiendrait à l'écran
// suivant et le montage afficherait le mauvais écran. On garde la plus tardive,
// c'est-à-dire la plus proche de l'état stable tenu à l'image.
/** Dimensions réelles d'un JPEG : sert à refuser une image nette d'un autre format. */
const dimsCache = new Map();
const dimsOf = (file) => {
  if (dimsCache.has(file)) return dimsCache.get(file);
  let out = null;
  try {
    const b = fs.readFileSync(file);
    for (let i = 2; i < b.length - 8; ) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        out = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        break;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch {
    out = null;
  }
  dimsCache.set(file, out);
  return out;
};
/** Même cadrage ? Un écran mobile tourné en paysage ne peut pas représenter un écran portrait. */
const sameFraming = (a, b) => {
  const x = dimsOf(a);
  const y = dimsOf(b);
  if (!x || !y) return false;
  return Math.abs(x.w / x.h - y.w / y.h) < 0.03;
};

const hiLogPath = path.join(outDir, 'hi.log');
const hiShots = fs.existsSync(hiLogPath)
  ? fs
      .readFileSync(hiLogPath, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l))
      // `hi.log` horodate sur l'horloge du navigateur (celle de `frames.log`), alors
      // que les segments sont exprimés depuis la première image : on ramène les deux
      // sur la même origine.
      .map((h) => ({ ...h, ts: h.ts - t0 }))
      .filter((h) => h.file && fs.existsSync(h.file))
  : [];
let hiresSegments = 0;
let hiresRejected = 0;
for (const s of segs) {
  const candidates = hiShots.filter((h) => h.ts >= s.start && h.ts <= s.end);
  // Les images nettes prises pendant une bascule portrait ↔ paysage appartiennent
  // au format d'après la bascule : les retenir ici afficherait un écran pour un autre.
  const inside = candidates.filter((h) => sameFraming(h.file, s.file));
  hiresRejected += candidates.length - inside.length;
  if (!inside.length) continue;
  s.file = inside.reduce((a, b) => (b.ts > a.ts ? b : a)).file;
  s.hires = true;
  hiresSegments += 1;
}
if (hiShots.length)
  console.log(
    `[info] ${hiresSegments}/${segs.length} écrans représentés par une image suréchantillonnée ` +
      `(${hiShots.length} images nettes disponibles` +
      `${hiresRejected ? `, ${hiresRejected} écartées pour cause de cadrage différent` : ''})`,
  );
if (hasFlag('--debug-segments')) {
  const heldCovered = segs.filter((s) => s.hires && s.end - s.start > 1).length;
  const held = segs.filter((s) => s.end - s.start > 1).length;
  const totalSec = segs.reduce((a, s) => a + (s.end - s.start), 0);
  const coveredSec = segs.reduce((a, s) => a + (s.hires ? s.end - s.start : 0), 0);
  console.log(
    `[debug] écrans tenus plus d'une seconde : ${heldCovered}/${held} suréchantillonnés · ` +
      `${((coveredSec / totalSec) * 100).toFixed(0)} % de la durée de capture représentée par une image nette ` +
      `(${coveredSec.toFixed(0)}s sur ${totalSec.toFixed(0)}s)`,
  );
  for (const s of segs)
    console.log(
      `[debug]   ${s.start.toFixed(2)}→${s.end.toFixed(2)} (${(s.end - s.start).toFixed(2)}s) ${s.hires ? 'NETTE' : 'flux'} ${path.basename(s.file)}`,
    );
}

// Le représentant d'un segment est sa DERNIÈRE image : elle est par construction
// stable (sinon un nouveau segment aurait commencé).
const outSegs = [];
let outT = 0;
let trimmedSeconds = 0;
let blankDropped = 0;
for (const s of segs) {
  let raw = s.end - s.start;
  if (raw <= 0) continue;
  const capped = TRIM ? Math.min(raw, HOLD_CAP) : raw;
  if (TRIM && raw > HOLD_CAP + 0.5) trimmedSeconds += raw - capped;
  outSegs.push({ file: s.file, origStart: s.start, origLen: raw, outStart: outT, outLen: capped });
  outT += capped;
}
// Compte les images vides écartées (indicatif, pour le rapport).
for (const st of stats) if (st.blank) blankDropped += 1;

const OUTPUT_LEN = outT;
if (OUTPUT_LEN < 1) throw new Error('Durée finale nulle.');
console.log(
  `[info] ${segs.length} écrans · prologue de connexion retiré : ${prologueCut.toFixed(1)}s · ` +
    `${(TOTAL - prologueCut - OUTPUT_LEN).toFixed(0)}s de temps mort retirés` +
    (TRIM ? '' : ' (traitements désactivés)'),
);

/** Temps d'origine → temps final (les paliers comprimés le sont aussi). */
const mapTime = (t) => {
  if (!outSegs.length) return 0;
  if (t <= outSegs[0].origStart) return 0;
  for (const s of outSegs) {
    if (t < s.origStart) continue;
    if (t < s.origStart + s.origLen) return s.outStart + Math.min(t - s.origStart, s.outLen);
  }
  const last = outSegs[outSegs.length - 1];
  return last.outStart + last.outLen;
};

if (DRY_RUN) {
  const blanks = stats.filter((s) => s.blank).length;
  console.log(
    `[dry-run] ${path.basename(outDir)} · capture ${TOTAL.toFixed(0)}s → ${OUTPUT_LEN.toFixed(0)}s ` +
      `(${segs.length} écrans · ${blanks} images de chargement écartées · ${(TOTAL - OUTPUT_LEN).toFixed(0)}s retirés)`,
  );
  process.exit(0);
}

// ---------- 4. Séquence à fps fixe (liens durs, horodatage recalculé) ----------
const seqDir = path.join(outDir, 'frames_silent');
fs.rmSync(seqDir, { recursive: true, force: true });
fs.mkdirSync(seqDir, { recursive: true });
let segPtr = 0;
let held = 0;
for (let tick = 0; tick < Math.ceil(OUTPUT_LEN * FPS); tick += 1) {
  const t = tick / FPS;
  while (segPtr < outSegs.length - 1 && t >= outSegs[segPtr].outStart + outSegs[segPtr].outLen) segPtr += 1;
  const name = `f${String(tick).padStart(6, '0')}.jpg`;
  try {
    fs.linkSync(outSegs[segPtr].file, path.join(seqDir, name));
  } catch {
    fs.copyFileSync(outSegs[segPtr].file, path.join(seqDir, name));
  }
  held += 1;
}

// ---------- 5. Vidéo seule, image entière centrée ----------
// Réglages choisis au banc de mesure (quality-lab.mjs / ab-test.mjs) : sur des
// écrans fixes, crf15 + preset slow + paramètres x264 orientés texte donnent
// ~+4 dB de PSNR et une erreur structurelle divisée par ~6 par rapport à
// crf20/veryfast, en particulier sur les bords de texte et les aplats colorés.
const { w: CW, h: CH } = CANVAS;
const filter = `scale=${CW}:${CH}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${CW}:${CH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p`;
const silentBase = path.join(outDir, 'silent-only.mp4');
runQuiet([
  '-y', '-framerate', String(FPS), '-i', path.join(seqDir, 'f%06d.jpg'),
  '-vf', filter,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
  '-x264-params', 'psy-rd=0.6:aq-mode=3:deblock=-1,-1',
  '-pix_fmt', 'yuv420p',
  '-an', '-movflags', '+faststart',
  silentBase,
]);
console.log(`[info] vidéo muette intermédiaire : ${probe(silentBase).duration.toFixed(1)}s @ ${CW}×${CH}`);

// ---------- 6. Chapitres (repères de navigation, pas d'incrustation) ----------
const metaPath = path.join(outDir, 'chapters-silent.ffmeta');
// Les temps d'étape sont reportés sur la durée finale ; les chapitres restent
// contigus et couvrent toute la vidéo.
// Les étapes techniques (`start`, `login`) ne deviennent pas des chapitres : elles
// n'ont plus de contenu propre une fois le prologue retiré.
const kept = steps.steps
  .filter((s) => !(SYNTHETIC_STEPS.has(s.id) && prologueCut > 0))
  .map((s) => ({ label: s.label, start: mapTime(s.t0), end: OUTPUT_LEN }));
kept.forEach((c, i) => {
  c.start = Math.max(0, Math.min(c.start, OUTPUT_LEN - 0.2));
  c.end = i + 1 < kept.length ? c.start : OUTPUT_LEN;
});
for (let i = 0; i < kept.length; i += 1) {
  if (i + 1 < kept.length) kept[i].end = kept[i + 1].start;
  if (kept[i].end <= kept[i].start) kept[i].end = Math.min(OUTPUT_LEN, kept[i].start + 0.2);
}
let meta = ';FFMETADATA1\n';
meta += `title=${titleArg}\n`;
kept.forEach((c) => {
  meta += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(c.start * 1000)}\nEND=${Math.round(c.end * 1000)}\ntitle=${c.label.replace(/\n/g, ' ')}\n`;
});
fs.writeFileSync(metaPath, meta);

// ---------- 7. Remux final : vidéo copiée, chapitres, aucune piste audio ----------
runQuiet([
  '-y', '-i', silentBase, '-i', metaPath,
  '-map', '0:v', '-map_metadata', '1',
  '-c', 'copy', '-an',
  '-movflags', '+faststart',
  '-metadata', `title=${titleArg}`,
  outputPath,
]);

// ---------- 8. Journal des coupes (pour le rapport de couverture) ----------
fs.writeFileSync(
  path.join(outDir, 'trim-report.json'),
  JSON.stringify(
    {
      capturedSeconds: Number(TOTAL.toFixed(1)),
      finalSeconds: Number(OUTPUT_LEN.toFixed(1)),
      removedSeconds: Number((TOTAL - OUTPUT_LEN).toFixed(1)),
      screens: outSegs.length,
      hiresShots: hiShots.length,
      hiresSegments,
      blankFramesDropped: blankDropped,
      holdCap: HOLD_CAP,
      trimmed: TRIM,
      prologueCutSeconds: Number(prologueCut.toFixed(1)),
      steps: kept.map((c) => ({ label: c.label, start: Number(c.start.toFixed(2)), end: Number(c.end.toFixed(2)) })),
    },
    null,
    2,
  ),
);

const info = probe(outputPath);
const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;
console.log(
  `[ok] ${path.basename(outputPath)} — ${mmss(info.duration)} (capture ${mmss(TOTAL)}) · ${CW}×${CH} · ${info.chapters} chapitres · ${size} Mo · pistes audio : ${info.audioStreams}`,
);
if (info.audioStreams !== 0) {
  console.error('[ERREUR] le fichier contient une piste audio.');
  process.exit(1);
}
if (info.videoStreams !== 1) {
  console.error(`[ERREUR] ${info.videoStreams} pistes vidéo (une seule attendue).`);
  process.exit(1);
}
fs.rmSync(silentBase, { force: true });
fs.rmSync(analysisDir, { recursive: true, force: true });

/**
 * Assembleur ProDay — transforme une capture (frames + steps.json) en MP4 commenté.
 *
 *   node assemble.mjs /tmp/proday-shots/club-desktop \
 *        walkthrough-exports/ProDay-Club-Desktop.mp4 \
 *        "Pôle Club — version Desktop" [--width 1920] [--dsf 1]
 *
 * Produit :
 *  - le MP4 final (H.264 + AAC, sous-titres FR incrustés, chapitres intégrés)
 *  - captions.srt (sous-titres externes)
 *  - README.md (liste des chapitres horodatée + transcript + limitations)
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import { createRequire } from 'module';

// Le ffmpeg Homebrew de cette machine est compilé sans libass/drawtext : on privilégie
// un ffmpeg statique avec sous-titres (ffmpeg-static), sinon repli sur le PATH.
const req = createRequire('/tmp/proday-rec/package.json');
let FFMPEG = process.env.FFMPEG_BIN ?? null;
let FFPROBE = process.env.FFPROBE_BIN ?? null;
if (!FFMPEG) {
  try {
    FFMPEG = req('ffmpeg-static');
  } catch {
    FFMPEG = 'ffmpeg';
  }
}
// ffprobe-static est instable sur cette machine : on lit la durée via ffmpeg -i.
FFPROBE = 'ffmpeg';
console.log(`[info] ffmpeg = ${FFMPEG}`);

const [, , outDir, outputArg, titleArg = 'Visite guidée ProDay', ...rest] = process.argv;
if (!outDir || !outputArg) {
  console.error('Usage: node assemble.mjs <outDir> <output.mp4> "<titre>" [--width 1920]');
  process.exit(1);
}
const getOpt = (name, def) => {
  const i = rest.indexOf(name);
  return i >= 0 ? Number(rest[i + 1]) : def;
};
const TARGET_WIDTH = getOpt('--width', 1920);
const FPS = getOpt('--fps', 30);
const VOICE = 'Thomas (Français (France))';
const RATE = 178;

const outputPath = path.resolve(outputArg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString();

const runQuiet = (cmd, args, opts = {}) => {
  try {
    return run(cmd, args, opts);
  } catch (e) {
    const err = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? e);
    console.error(`\n[cmd échouée] ${cmd} ${args.join(' ')}\n${err.split('\n').slice(-14).join('\n')}`);
    process.exit(1);
  }
};

// ---------- 1. Lecture de la capture ----------
const steps = JSON.parse(fs.readFileSync(path.join(outDir, 'steps.json'), 'utf8'));
let diagnostics = { failedSteps: [], notes: [] };
try {
  diagnostics = JSON.parse(fs.readFileSync(path.join(outDir, 'diagnostics.json'), 'utf8'));
} catch {
  /* capture antérieure sans diagnostics */
}
// Canvas de sortie : portrait 1080×2340 pour le mobile, TARGET_WIDTH×9/16 pour le desktop.
// Les frames de tailles différentes (rotation paysage en cours de capture) sont
// normalisées sur ce canvas par recadrage flou, donc une seule passe d'encodage.
const MOBILE = Boolean(steps.cfg.mobile);
// --docs-only : régénère uniquement les fiches Markdown (chapitres, transcript,
// limites) à partir des captures existantes, sans ré-encoder les vidéos.
const DOCS_ONLY = process.argv.includes('--docs-only');
const CANVAS = MOBILE
  ? { w: 1080, h: 2340 }
  : { w: TARGET_WIDTH, h: Math.round(((TARGET_WIDTH * 9) / 16 / 2)) * 2 };
const logLines = fs
  .readFileSync(path.join(outDir, 'frames.log'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));

// Plusieurs sessions peuvent cohabiter dans frames.log : on garde la dernière (i repart à 0).
const sessions = [];
let cur = [];
for (const l of logLines) {
  if (l.i === 0 && cur.length) sessions.push(cur), (cur = []);
  cur.push(l);
}
if (cur.length) sessions.push(cur);
// Le journal peut ne contenir que l'index de la frame : on reconstruit le chemin.
const framesDir = path.join(outDir, 'frames');
const frames = sessions[sessions.length - 1]
  .map((f) => ({ ...f, file: f.file ?? path.join(framesDir, `f${String(f.i).padStart(6, '0')}.jpg`) }))
  .filter((f) => fs.existsSync(f.file));
if (frames.length < 10) throw new Error(`Trop peu de frames dans ${outDir}`);

const t0 = frames[0].ts;
const timed = frames.map((f) => ({ ...f, t: f.ts - t0 }));
const capturedDuration = timed[timed.length - 1].t;
const stepDuration = steps.steps[steps.steps.length - 1].t0;
const TOTAL = Math.max(capturedDuration + 1.0, stepDuration + 1.2);
console.log(
  `[info] ${timed.length} frames · capture ${capturedDuration.toFixed(1)}s · scénario ${stepDuration.toFixed(1)}s · cible ${TOTAL.toFixed(1)}s`,
);

// ---------- 2. Vidéo muette — séquence à fps fixe construite par liens durs ----------
// (la directive `duration` du démultiplexeur concat n'est pas fiable avec des images ;
//  on matérialise donc l'horodatage réel en répétant chaque frame sur les ticks 1/FPS.)
const seqDir = path.join(outDir, 'frames_fps');
fs.rmSync(seqDir, { recursive: true, force: true });
fs.mkdirSync(seqDir, { recursive: true });
const totalTicks = Math.ceil(TOTAL * FPS);
let cursor = 0;
for (let tick = 0; tick < totalTicks; tick += 1) {
  const t = tick / FPS;
  while (cursor < timed.length - 1 && timed[cursor + 1].t <= t) cursor += 1;
  const name = `f${String(tick).padStart(6, '0')}.jpg`;
  try {
    fs.linkSync(timed[cursor].file, path.join(seqDir, name));
  } catch {
    fs.copyFileSync(timed[cursor].file, path.join(seqDir, name));
  }
}
console.log(`[info] ${totalTicks} ticks @ ${FPS}fps préparés (${timed.length} frames sources)`);

const silentPath = path.join(outDir, 'silent.mp4');
const { w: CW, h: CH } = CANVAS;
const frameFilter = MOBILE
  ? // Mobile : fond flou + contenu centré → les segments en paysage restent lisibles.
    `[0:v]split=2[bg][fg];[bg]scale=${Math.round(CW / 4)}:${Math.round(CH / 4)}:force_original_aspect_ratio=increase,crop=${Math.round(CW / 4)}:${Math.round(CH / 4)},gblur=sigma=10,scale=${CW}:${CH}[bgb];[fg]scale=${CW}:${CH}:force_original_aspect_ratio=decrease[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p`
  : `scale=${CW}:${CH}:force_original_aspect_ratio=decrease,pad=${CW}:${CH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p`;
if (!DOCS_ONLY) {
  runQuiet(FFMPEG, [
    '-y', '-framerate', String(FPS), '-i', path.join(seqDir, 'f%06d.jpg'),
    ...(MOBILE ? ['-filter_complex', frameFilter] : ['-vf', frameFilter]),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-an', silentPath,
  ]);
}

const probeDur = (file) => {
  let stderr = '';
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? '');
  }
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) throw new Error(`Durée introuvable pour ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
};
let videoDur = DOCS_ONLY ? 0 : probeDur(silentPath);
if (!DOCS_ONLY) console.log(`[info] vidéo muette : ${videoDur.toFixed(1)}s @ ${CANVAS.w}×${CANVAS.h}`);

// ---------- 3. Narration française (TTS) par étape ----------
const NARRATION = {
  login: (cfg, pole) =>
    `Connexion au pôle ${pole} avec un compte de démonstration isolé. Le mot de passe reste masqué à l'écran.`,
  end: (cfg, pole) => `Fin de la visite guidée du pôle ${pole}.`,
};
const pole = steps.cfg.pole ?? 'Club';

const ttsDir = path.join(outDir, 'tts');
fs.rmSync(ttsDir, { recursive: true, force: true });
fs.mkdirSync(ttsDir, { recursive: true });

// Cache persistant des narrations. `say` peut se bloquer indéfiniment quand le
// sous-système audio macOS est occupé (c'est arrivé en pleine série d'encodages) :
// on ne synthétise donc chaque texte qu'une fois, avec délai maximal + tentatives.
const CACHE_DIR = process.env.PRODAY_TTS_CACHE ?? '/tmp/proday-shots/tts-cache';
fs.mkdirSync(CACHE_DIR, { recursive: true });
const cacheKey = (text) => crypto.createHash('sha1').update(`${VOICE}|${RATE}|${text}`).digest('hex').slice(0, 16);

const tryRun = (cmd, args, opts = {}) => {
  try {
    execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000, ...opts });
    return { ok: true };
  } catch (e) {
    return { ok: false, err: String(e.message ?? e).slice(0, 120) };
  }
};

/** Renvoie un WAV de narration pour `text`, en le synthétisant au besoin. */
const ttsWav = (text, index) => {
  const cached = path.join(CACHE_DIR, `${cacheKey(text)}.wav`);
  if (fs.existsSync(cached) && fs.statSync(cached).size > 2000) return cached;
  const aiff = path.join(ttsDir, `n${index}.aiff`);
  const raw = path.join(ttsDir, `n${index}.raw.wav`);
  let lastErr = 'inconnu';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const said = tryRun('say', ['-v', VOICE, '-r', String(RATE), '-o', aiff, text]);
    const conv = said.ok
      ? tryRun(FFMPEG, ['-y', '-i', aiff, '-ar', '44100', '-ac', '2', raw])
      : { ok: false, err: said.err };
    if (conv.ok && fs.existsSync(raw) && fs.statSync(raw).size > 2000) {
      fs.copyFileSync(raw, cached);
      return cached;
    }
    lastErr = conv.err ?? 'audio vide';
    console.log(`\n[tts] tentative ${attempt} échouée pour « ${text.slice(0, 34)}… » : ${lastErr}`);
  }
  throw new Error(`Narration impossible pour « ${text.slice(0, 40)}… » (${lastErr})`);
};

const narrationOf = (step) => {
  // La connexion est déjà ouverte quand la vidéo commence (mot de passe hors champ).
  if (step.id === 'login' && /session de démonstration/.test(step.label)) return step.label;
  if (NARRATION[step.id]) return NARRATION[step.id](steps.cfg, pole);
  return step.label;
};

const fitWav = (text, index, windowSec) => {
  const wav = ttsWav(text, index);
  let dur = probeDur(wav);
  const maxDur = Math.max(1.2, windowSec - 0.25);
  if (dur > maxDur) {
    // Chapitre plus court que la narration : on accélère la voix (jusqu'à ×1,6)
    // plutôt que de la tronquer, sans jamais dépasser la durée du chapitre.
    const paced = path.join(ttsDir, `n${index}-paced.wav`);
    const tempo = Math.min(1.6, dur / maxDur);
    runQuiet(FFMPEG, ['-y', '-i', wav, '-filter:a', `atempo=${tempo.toFixed(3)}`, paced]);
    dur = probeDur(paced);
    if (dur > windowSec - 0.1) {
      const cut = path.join(ttsDir, `n${index}-cut.wav`);
      runQuiet(FFMPEG, ['-y', '-i', paced, '-t', (windowSec - 0.15).toFixed(2), cut]);
      return { file: cut, dur: probeDur(cut) };
    }
    return { file: paced, dur };
  }
  return { file: wav, dur };
};

const narrations = [];
for (let i = 0; i < steps.steps.length; i += 1) {
  const s = steps.steps[i];
  const nextStart = steps.steps[i + 1]?.t0 ?? s.t1 ?? s.t0 + 6;
  const windowSec = Math.max(2, nextStart - s.t0);
  const { file, dur } = DOCS_ONLY
    ? { file: null, dur: windowSec }
    : fitWav(narrationOf(s), i, windowSec);
  narrations.push({ ...s, text: narrationOf(s), file, dur, windowSec });
  if (!DOCS_ONLY) {
    process.stdout.write(`\r[narration] ${i + 1}/${steps.steps.length} — ${s.id} (${dur.toFixed(1)}s / ${windowSec.toFixed(1)}s)`);
  }
}
if (!DOCS_ONLY) console.log('');

// ---------- 4. Piste audio complète (silence + voix calées) ----------
const audioPath = path.join(outDir, 'narration.m4a');
if (!DOCS_ONLY) {
const inputs = ['-f', 'lavfi', '-t', String(TOTAL), '-i', 'anullsrc=r=44100:cl=stereo'];
const chains = [];
narrations.forEach((n, i) => {
  inputs.push('-i', n.file);
  const ms = Math.round(n.t0 * 1000);
  chains.push(`[${i + 1}:a]adelay=${ms}|${ms}[d${i}]`);
});
const mixInputs = ['[0:a]', ...narrations.map((_, i) => `[d${i}]`)].join('');
const filter =
  chains.join(';') +
  `;${mixInputs}amix=inputs=${narrations.length + 1}:duration=first:normalize=0[mix]`;
runQuiet(FFMPEG, [
  '-y', ...inputs,
  '-filter_complex', filter,
  '-map', '[mix]', '-t', String(TOTAL),
  '-c:a', 'aac', '-b:a', '160k', audioPath,
]);
}

// ---------- 5. Sous-titres FR (mêmes textes que la narration) ----------
// Le rendu incrusté passe par un ASS avec PlayResX/PlayResY explicites : sans cela
// libass suppose un canvas de 288 px de haut et multiplie la taille de police par
// (hauteur vidéo / 288), ce qui donnait des légendes démesurées sur le portrait.
const srtTime = (s) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const mm = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${sec},${mm}`;
};
const assTime = (s) => {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000);
  const m = String(Math.floor((cs % 360000) / 6000)).padStart(2, '0');
  const sec = String(Math.floor((cs % 6000) / 100)).padStart(2, '0');
  const cc = String(cs % 100).padStart(2, '0');
  return `${h}:${m}:${sec}.${cc}`;
};
const assEscape = (t) => t.replace(/\n/g, '\\N').replace(/[{}]/g, (c) => (c === '{' ? '(' : ')'));
const cues = narrations.map((n, i) => {
  const end = narrations[i + 1]?.t0 ?? TOTAL;
  return { t0: n.t0, t1: Math.min(end, Math.max(end, n.t0 + 1.5)), text: n.text };
});

// Sous-titres externes (SRT) conservés pour la transcription et l'accessibilité.
const srtPath = path.join(outDir, 'captions.srt');
let srt = '';
cues.forEach((c, i) => {
  srt += `${i + 1}\n${srtTime(c.t0)} --> ${srtTime(c.t1)}\n${c.text}\n\n`;
});
fs.writeFileSync(srtPath, srt);

// Piste incrustée (ASS) : taille fixée en pixels réels du canvas.
const capFont = MOBILE ? 54 : 50;
const capMarginV = MOBILE ? 260 : 70;
const capMarginL = MOBILE ? 64 : 120;
const assPath = path.join(outDir, 'captions.ass');
const ass = [
  '[Script Info]',
  'ScriptType: v4.00+',
  `PlayResX: ${CANVAS.w}`,
  `PlayResY: ${CANVAS.h}`,
  'WrapStyle: 0',
  'ScaledBorderAndShadow: yes',
  '',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  `Style: Caption,Helvetica,${capFont},&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,1,0,2,${capMarginL},${capMarginL},${capMarginV},1`,
  '',
  '[Events]',
  'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ...cues.map(
    (c) => `Dialogue: 0,${assTime(c.t0)},${assTime(c.t1)},Caption,,0,0,0,,${assEscape(c.text)}`,
  ),
  '',
].join('\n');
fs.writeFileSync(assPath, ass);

// ---------- 6. Chapitres (ffmetadata) ----------
const metaPath = path.join(outDir, 'chapters.ffmeta');
let meta = ';FFMETADATA1\n';
meta += `title=${titleArg}\n`;
narrations.forEach((n, i) => {
  const end = narrations[i + 1]?.t0 ?? TOTAL;
  meta += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(n.t0 * 1000)}\nEND=${Math.round(end * 1000)}\ntitle=${n.text.replace(/\n/g, ' ')}\n`;
});
fs.writeFileSync(metaPath, meta);

// ---------- 7. Encodage final (sous-titres incrustés + audio + chapitres) ----------
// Le style est défini dans captions.ass (PlayRes explicite) : plus de force_style.
// libass attend un chemin simple : on encode depuis outDir.
const subtitleFilter = `subtitles=filename=captions.ass`;
if (!DOCS_ONLY) runQuiet(FFMPEG, [
  '-y', '-i', silentPath, '-i', audioPath, '-i', metaPath,
  '-vf', subtitleFilter,
  '-map', '0:v', '-map', '1:a', '-map_metadata', '2',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '160k',
  '-movflags', '+faststart',
  '-metadata', `title=${titleArg}`,
  outputPath,
], { cwd: outDir });

if (DOCS_ONLY) {
  videoDur = fs.existsSync(outputPath) ? probeDur(outputPath) : TOTAL;
} else {
  videoDur = probeDur(outputPath);
}

// ---------- 8. README (chapitres horodatés + transcript) ----------
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const cfg = steps.cfg;

// « Écran affiché » : l'instantané d'accessibilité est pris au *début* de l'étape,
// donc l'écran visible pendant le chapitre i est celui observé à l'étape i+1.
// Le texte brut est une concaténation de l'arbre d'accessibilité : on en extrait
// le premier fragment signifiant pour documenter la navigation réelle.
const NAV_NOISE = /^(Accueil|Calendrier|Ma Carte|Menu|Équipe|Équipes|Carrière|Passeport & CV|Forme & Récup|Tactique|Profil|Enfant|Guide|Stats|Boutique|MON CLUB|Réglages|Tout|Créer|Aide|Matchs|Vestiaire|Club|Coach|Joueur|Parent|Staff|ACCUEIL|CALENDRIER|MENU|ÉQUIPE|M[AE] CARTE|Coach Pro|Club Pro|Profil joueur|Coach Marc Coach Démo|Se déconnecter|Se deconnecter|\?|\d+)$/i;
const cleanObserved = (raw) => {
  if (!raw) return '—';
  const parts = String(raw)
    .split('|')
    .map((p) => p.replace(/^[?—\-\s]+/, '').trim())
    .filter(Boolean);
  const good = parts.find((p) => p.length > 3 && p.length <= 80 && !NAV_NOISE.test(p));
  const pick = good ?? parts.find((p) => p.length > 1) ?? '';
  return pick ? pick.replace(/\s+/g, ' ').slice(0, 80) : '—';
};
const observedFor = (i) => cleanObserved(steps.steps[i + 1]?.observed ?? steps.steps[i]?.observed);
const anyObserved = steps.steps.some((s) => s.observed);
const readme = [
  `# ${titleArg}`,
  '',
  `- Pôle : **${pole}**`,
  `- Version de l'application : **ProDay ${steps.appVersion ?? '1.0.10'}** (build web Expo/Metro)`,
  `- Interface : **${cfg.mobile ? 'mobile (portrait)' : 'desktop (paysage)'}** — viewport ${cfg.mobile ? '390 × 844 px (DSF 3, simulation iPhone)' : '1920 × 1080 px'}`,
  `- Rendu : **simulation navigateur** (Chrome headless piloté par CDP) — pas d'appareil physique`,
  `- Compte : \`${cfg.email}\` (compte de démonstration, club FC ProDay Démo)`,
  `- Durée : ${mmss(videoDur)} · ${steps.steps.length} chapitres · narration FR + sous-titres incrustés`,
  '',
  '## Chapitres',
  '',
  '| # | Temps | Chapitre | Contenu expliqué | Écran affiché (extrait d\'accessibilité) |',
  '|---|-------|----------|------------------|------------------------------------------|',
  ...narrations.map(
    (n, i) =>
      `| ${i + 1} | ${mmss(n.t0)} | ${n.id} | ${n.text.replace(/\|/g, '\\|')} | ${observedFor(i).replace(/\|/g, '\\|')} |`,
  ),
  '',
  '## Limites et écarts',
  '',
  `- **Rendu** : simulation de navigateur (Chrome piloté par CDP), pas d'appareil physique. La mise en page mobile est celle du site web responsive, pas d'un build natif.`,
  ...(anyObserved
    ? [
        '- La colonne « écran affiché » provient de l\'arbre d\'accessibilité (texte concaténé autour de l\'étape) : elle atteste qu\'une navigation réelle a eu lieu sans être un titre officiel.',
      ]
    : [
        '- Cette capture a été réalisée avant l\'ajout de l\'instantané d\'accessibilité par étape : la colonne « écran affiché » reste vide, les chapitres et le transcript font foi.',
      ]),
  `- Données : club de démonstration ${'`FC ProDay Démo`'} uniquement (aucun membre réel, aucun paiement réel, aucune donnée de production).`,
  ...diagnostics.notes.map((n) => `- ${n}`),
  '',
  ...(diagnostics.failedSteps.length
    ? [
        '## Étapes sans cible (documenté, non omis)',
        '',
        ...diagnostics.failedSteps.map((f) => {
          // Le libellé fait foi depuis le manifeste (les diagnostics gardent celui
          // du scénario au moment de la capture, qui peut avoir été corrigé depuis).
          const label = steps.steps.find((s) => s.id === f.step)?.label ?? f.label;
          return `- **${f.step}** — ${label}\n  - Cibles tentées : ${(f.actions ?? []).map((a) => a.text ?? a.label ?? a.type).join(', ')}\n  - Écran au moment de l'échec : ${String(f.bodyText ?? '').slice(0, 160)}`;
        }),
        '',
      ]
    : []),
  '',
  '## Transcript (narration)',
  '',
  ...narrations.map((n, i) => `**${mmss(n.t0)} — ${n.id}**\n\n${n.text}\n`),
  '',
  '## Vérification',
  '',
  `- Fichier : \`${path.basename(outputPath)}\``,
  `- Flux vidéo : H.264, ${CANVAS.w} × ${CANVAS.h} px, ${FPS} fps`,
  '- Flux audio : AAC 160 kbps (voix FR)',
  `- Sous-titres : incrustés + \`captions.srt\` fourni`,
  `- Chapitres : intégrés dans le conteneur + table ci-dessus`,
  '',
].join('\n');
// Une fiche par vidéo : « ProDay-Club-Mobile.md » à côté du MP4.
fs.writeFileSync(`${outputPath.replace(/\.mp4$/i, '')}.md`, readme);

console.log(`[ok] ${outputPath} — ${mmss(videoDur)}`);

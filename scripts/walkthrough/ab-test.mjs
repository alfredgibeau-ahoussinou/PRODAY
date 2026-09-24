/**
 * ab-test — comparaison de bout en bout de deux réglages d'encodage sur une vraie
 * capture : la séquence 30 i/s est reconstruite exactement comme dans
 * assemble-silent.mjs (duplication des frames capturées), puis encodée avec
 * l'ancien et le nouveau jeu de réglages. On mesure SSIM/PSNR de chacun contre la
 * séquence source sans perte.
 *
 *   node ab-test.mjs <dossier-capture> [--fps 30] [--width 1920]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';

const [, , outDirArg, ...rest] = process.argv;
if (!outDirArg) {
  console.error('Usage: node ab-test.mjs <dossier-capture> [--fps 30] [--width 1920]');
  process.exit(1);
}
const getOpt = (n, d) => {
  const i = rest.indexOf(n);
  return i >= 0 ? Number(rest[i + 1]) : d;
};
const FPS = getOpt('--fps', 30);
const outDir = path.resolve(outDirArg);

const spawn = (bin, args) => spawnSync(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
const run = (args) => {
  const r = spawn('ffmpeg', args);
  if (r.status !== 0) {
    console.error(`[cmd échouée] ffmpeg ${args.join(' ')}\n${r.stderr?.toString('utf8').split('\n').slice(-12).join('\n')}`);
    process.exit(1);
  }
  return r;
};

const steps = JSON.parse(fs.readFileSync(path.join(outDir, 'steps.json'), 'utf8'));
const TARGET_WIDTH = getOpt('--width', 1920);
const CW = steps.cfg?.mobile ? 1080 : TARGET_WIDTH;
const CH = steps.cfg?.mobile ? 2340 : Math.round(((TARGET_WIDTH * 9) / 16 / 2) * 2);

// --- Séquence source identique à celle de l'assemblage ---
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
const t0 = frames[0].ts;
const timed = frames.map((f) => ({ ...f, t: f.ts - t0 }));
const stepDuration = steps.steps[steps.steps.length - 1].t0;
const TOTAL = Math.max(timed[timed.length - 1].t + 1.0, stepDuration + 1.2);

const work = path.join(outDir, 'ab-test');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const seqDir = path.join(work, 'seq');
fs.mkdirSync(seqDir);
let cursor = 0;
for (let tick = 0; tick < Math.ceil(TOTAL * FPS); tick += 1) {
  const t = tick / FPS;
  while (cursor < timed.length - 1 && timed[cursor + 1].t <= t) cursor += 1;
  const name = `f${String(tick).padStart(6, '0')}.jpg`;
  try {
    fs.linkSync(timed[cursor].file, path.join(seqDir, name));
  } catch {
    fs.copyFileSync(timed[cursor].file, path.join(seqDir, name));
  }
}
const nTicks = Math.ceil(TOTAL * FPS);
console.log(`[info] ${frames.length} frames capturées → ${nTicks} images @${FPS} i/s (${TOTAL.toFixed(1)}s) · ${CW}×${CH}`);

const filter = `scale=${CW}:${CH}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${CW}:${CH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p`;
const ref = path.join(work, 'ref.mkv');
run(['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(seqDir, 'f%06d.jpg'), '-vf', filter, '-c:v', 'ffv1', '-pix_fmt', 'yuv420p', ref]);

const variants = [
  ['AVANT  crf20 veryfast', ['-preset', 'veryfast', '-crf', '20']],
  ['APRÈS  crf15 slow +psi', ['-preset', 'slow', '-crf', '15', '-x264-params', 'psy-rd=0.6:aq-mode=3:deblock=-1,-1']],
];

const score = (a, b, which) => {
  const r = spawn('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-lavfi', which, '-f', 'null', '-']);
  const txt = (r.stderr?.toString('utf8') ?? '') + (r.stdout?.toString('utf8') ?? '');
  const m = which === 'ssim' ? txt.match(/All:([\d.]+)/) : txt.match(/average:([\d.]+)/);
  return m ? Number(m[1]) : NaN;
};

console.log('\n# réglage                  | SSIM    | PSNR   | débit   | taille');
for (const [name, enc] of variants) {
  const out = path.join(work, `${name.split(' ')[0]}.mp4`);
  run(['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(seqDir, 'f%06d.jpg'), '-vf', filter, '-c:v', 'libx264', ...enc, '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', out]);
  const ssim = score(ref, out, 'ssim');
  const psnr = score(ref, out, 'psnr');
  const bytes = fs.statSync(out).size;
  const kbps = Math.round((bytes * 8) / TOTAL / 1000);
  console.log(
    `${name.padEnd(25)} | ${ssim.toFixed(5)} | ${psnr.toFixed(2).padStart(6)} | ${String(kbps).padStart(5)} kb/s | ${(bytes / 1048576).toFixed(2)} Mo`,
  );
}
console.log(`\n[ok] fichiers de travail : ${work}`);

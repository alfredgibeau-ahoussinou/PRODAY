/**
 * quality-lab — mesure objective de la qualité d'encodage.
 *
 *   node quality-lab.mjs <dossier-capture> [--frames 600] [--fps 30]
 *
 * Pour une tranche de frames source (JPEG 1:1), on encode avec plusieurs jeux
 * de réglages puis on calcule SSIM / PSNR de chaque variante contre la source.
 * Sert à choisir crf/preset/scaler sur des chiffres, pas à l'œil.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';

const [, , outDirArg, ...rest] = process.argv;
if (!outDirArg) {
  console.error('Usage: node quality-lab.mjs <dossier-capture> [--frames N] [--fps N]');
  process.exit(1);
}
const getOpt = (n, d) => {
  const i = rest.indexOf(n);
  return i >= 0 ? Number(rest[i + 1]) : d;
};
const NFRAMES = getOpt('--frames', 600);
const FPS = getOpt('--fps', 30);
const outDir = path.resolve(outDirArg);

const run = (args) => execFileSync('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
/** Exécute ffmpeg et renvoie toujours stderr (les rapports ssim/psnr y sont écrits). */
const runErr = (args) => {
  const r = spawnSync('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  return { out: r.stdout?.toString('utf8') ?? '', err: r.stderr?.toString('utf8') ?? String(r.error ?? '') };
};

const all = fs
  .readdirSync(path.join(outDir, 'frames'))
  .filter((f) => f.endsWith('.jpg'))
  .sort();
if (all.length < 30) throw new Error(`Trop peu de frames dans ${outDir}`);
const slice = all.slice(0, Math.min(NFRAMES, all.length));

const work = path.join(outDir, 'quality-lab');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });

// Séquence source, renommée en numérotation continue et copiée (liens durs).
const seq = path.join(work, 'src');
fs.mkdirSync(seq, { recursive: true });
slice.forEach((f, i) => {
  const to = path.join(seq, `f${String(i).padStart(6, '0')}.jpg`);
  fs.linkSync(path.join(outDir, 'frames', f), to);
});

// Référence sans perte (ce que l'encodeur reçoit réellement).
const ref = path.join(work, 'ref.mp4');
run(['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(seq, 'f%06d.jpg'), '-c:v', 'ffv1', '-pix_fmt', 'yuv420p', ref]);

const variants = [
  ['actuel  crf20 veryfast', ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20']],
  ['crf18 medium', ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18']],
  ['crf16 slow', ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16']],
  ['crf14 slow', ['-c:v', 'libx264', '-preset', 'slow', '-crf', '14']],
  ['crf16 slow +psi', ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-x264-params', 'psy-rd=0.6:aq-mode=3:deblock=-1,-1']],
  ['crf15 slow +psi', ['-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-x264-params', 'psy-rd=0.6:aq-mode=3:deblock=-1,-1']],
  ['crf16 slow +psi +still', ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'stillimage', '-x264-params', 'psy-rd=0.6:aq-mode=3:deblock=-1,-1']],
  ['crf18 slow +psi', ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-x264-params', 'psy-rd=0.6:aq-mode=3:deblock=-1,-1']],
];

const score = (a, b, which) => {
  const r = runErr(['-hide_banner', '-i', a, '-i', b, '-lavfi', which, '-f', 'null', '-']);
  const m = which === 'ssim' ? r.err.match(/All:([\d.]+)/) : r.err.match(/average:([\d.]+)/);
  return m ? Number(m[1]) : NaN;
};

const srcInfo = runErr(['-hide_banner', '-i', ref]);
const mDim = srcInfo.err.match(/(\d{3,5})x(\d{3,5})/);
console.log(`[info] ${slice.length} frames source ${mDim ? `${mDim[1]}x${mDim[2]}` : '?'} · ${outDir}`);
console.log('# variante                        | SSIM   | PSNR   | kbit/s | Mo');
for (const [name, enc] of variants) {
  const out = path.join(work, `v-${name.replace(/[^a-z0-9]+/gi, '_')}.mp4`);
  run(['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(seq, 'f%06d.jpg'), ...enc, '-an', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  const ssim = score(ref, out, 'ssim');
  const psnr = score(ref, out, 'psnr');
  const bytes = fs.statSync(out).size;
  const dur = slice.length / FPS;
  const kbps = Math.round((bytes * 8) / dur / 1000);
  console.log(
    `${name.padEnd(32)} | ${ssim.toFixed(5)} | ${psnr.toFixed(2).padStart(6)} | ${String(kbps).padStart(6)} | ${(bytes / 1048576).toFixed(2)}`,
  );
}
console.log(`[ok] répertoire de travail : ${work}`);

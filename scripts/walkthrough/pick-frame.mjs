/**
 * pick-frame — copie la frame correspondant à un instant de la visite.
 * Usage : node pick-frame.mjs <outDir> <secondes> <dest.jpg>
 */
import fs from 'fs';
import path from 'path';

const [, , outDir, secArg, dest] = process.argv;
const sec = Number(secArg);
let steps = { steps: [] };
try {
  steps = JSON.parse(fs.readFileSync(path.join(outDir, 'steps.json'), 'utf8'));
} catch {
  /* capture en cours : steps.json n'existe pas encore */
}
const log = fs
  .readFileSync(path.join(outDir, 'frames.log'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const t0 = log[0].ts;
const timed = log
  .map((f) => ({
    file: f.file ?? path.join(outDir, 'frames', `f${String(f.i).padStart(6, '0')}.jpg`),
    t: f.ts - t0,
  }))
  .filter((f) => fs.existsSync(f.file));
if (!timed.length) throw new Error(`Aucune frame exploitable dans ${outDir}`);
let pick = timed[0];
for (const f of timed) if (f.t <= sec) pick = f;
fs.copyFileSync(pick.file, dest);
const step = [...steps.steps].reverse().find((s) => s.t0 <= sec);
console.log(`t=${sec}s → frame ${path.basename(pick.file)} (t=${pick.t.toFixed(1)}s) · étape=${step?.id}`);

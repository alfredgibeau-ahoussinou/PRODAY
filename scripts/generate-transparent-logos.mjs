/**
 * Régénère les logos transparents ProDay (ISNet + couleurs originales).
 * Prérequis : pip3 install rembg pillow numpy onnxruntime
 *
 *   node scripts/generate-transparent-logos.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const branding = resolve(root, 'assets/branding');

const py = `
import io
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
from rembg import remove, new_session

root = Path(${JSON.stringify(branding)})
session = new_session("isnet-general-use")

def alpha_from(src):
    with open(root / src, "rb") as f:
        raw = remove(f.read(), session=session, alpha_matting=False)
    return Image.open(io.BytesIO(raw)).convert("RGBA")

def composite(src, alpha_img, dst):
    base = Image.open(root / src).convert("RGBA")
    alpha = alpha_img.resize(base.size, Image.Resampling.LANCZOS)
    a = np.array(alpha.split()[3], dtype=np.float32) / 255.0
    a = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.3))) / 255.0
    out = np.array(base, dtype=np.float32)
    out[..., 3] = a * 255
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    arr = np.array(im)
    ys, xs = np.where(arr[..., 3] > 24)
    pad = 8
    im = im.crop((max(0, xs.min()-pad), max(0, ys.min()-pad), min(im.width, xs.max()+pad+1), min(im.height, ys.max()+pad+1)))
    w = 1024
    s = w / im.width
    im = im.resize((w, max(1, int(im.height * s))), Image.Resampling.LANCZOS)
    im.save(root / dst, "PNG", optimize=True)
    return im

a_light = alpha_from("logo-light.png")
a_dark = alpha_from("logo-dark.png")
hero = composite("logo-light.png", a_light, "logo-transparent-hero.png")
composite("logo-dark.png", a_dark, "logo-transparent-dark.png")
w, h = hero.size
mark = hero.crop((int(w*0.06), 0, int(w*0.94), int(h * 0.455)))
arr = np.array(mark)
ys, xs = np.where(arr[..., 3] > 24)
pad = 10
mark = mark.crop((max(0, xs.min()-pad), max(0, ys.min()-pad), min(mark.width, xs.max()+pad), min(mark.height, ys.max()+pad)))
s = 640 / mark.width
mark = mark.resize((640, max(1, int(mark.height * s))), Image.Resampling.LANCZOS)
mark.save(root / "logo-mark-transparent.png", "PNG")
print("OK")
`;

for (const src of ['logo-light.png', 'logo-dark.png']) {
  if (!existsSync(resolve(branding, src))) {
    console.error('Manquant:', src);
    process.exit(1);
  }
}

const r = spawnSync('python3', ['-c', py], { stdio: 'inherit' });
process.exit(r.status ?? 1);

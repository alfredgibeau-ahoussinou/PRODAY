#!/usr/bin/env node
/**
 * Picto Pro Day for Women — détourage mark + teinte rose (qualité haute résolution).
 * Le libellé est rendu en natif via WomanLogo.tsx (texte net).
 *
 *   node scripts/generate-woman-logos.mjs
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const branding = resolve(__dirname, '../assets/branding');

const py = `
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import colorsys

root = Path(${JSON.stringify(branding)})

def rgb_to_hsv_arr(rgb):
    h, s, v = [], [], []
    flat = rgb.reshape(-1, 3) / 255.0
    out = np.zeros_like(flat)
    for i, (r, g, b) in enumerate(flat):
        hi, si, vi = colorsys.rgb_to_hsv(float(r), float(g), float(b))
        out[i] = (hi, si, vi)
    return out.reshape(rgb.shape[:2] + (3,))

def hsv_to_rgb_arr(hsv):
    flat = hsv.reshape(-1, 3)
    out = np.zeros((flat.shape[0], 3))
    for i, (h, s, v) in enumerate(flat):
        r, g, b = colorsys.hsv_to_rgb(float(h), float(s), float(v))
        out[i] = (r, g, b)
    return (out.reshape(hsv.shape[:2] + (3,)) * 255).astype(np.uint8)

def recolor_pink(im):
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3]
    hsv = rgb_to_hsv_arr(rgb)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    # Bleus/cyans du logo → roses (teinte ~0.92–0.98 → ~0.94 rose)
    is_brand = (a > 12) & (s > 0.12) & (((h > 0.45) & (h < 0.72)) | ((h > 0.55) & (v > 0.35)))
    h_new = np.where(is_brand, np.clip(h * 0.55 + 0.92, 0, 1), h)
    s_new = np.where(is_brand, np.clip(s * 1.05, 0, 1), s)

    rgb_out = hsv_to_rgb_arr(np.stack([h_new, s_new, v], axis=-1))
    arr[..., :3] = rgb_out
    return Image.fromarray(arr.astype(np.uint8))

def crop_visible(im, pad=8):
    data = np.array(im)
    ys, xs = np.where(data[..., 3] > 18)
    if len(xs) == 0:
        return im
    return im.crop((max(0, xs.min() - pad), max(0, ys.min() - pad),
                    min(im.width, xs.max() + pad + 1), min(im.height, ys.max() + pad + 1)))

mark = Image.open(root / "logo-mark-transparent.png").convert("RGBA")
mark = recolor_pink(mark)
mark = crop_visible(mark, pad=10)
# Upscale 2× pour écrans retina
w, h = mark.size
mark = mark.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
mark = mark.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=2))
mark.save(root / "logo-woman-picto.png", "PNG", optimize=True)
mark.save(root / "logo-woman-mark-transparent.png", "PNG", optimize=True)
print("OK logo-woman-picto.png")
`;

if (!existsSync(resolve(branding, 'logo-mark-transparent.png'))) {
  console.error('Manquant: logo-mark-transparent.png — lancez npm run branding:logos');
  process.exit(1);
}

const r = spawnSync('python3', ['-c', py], { stdio: 'inherit' });
process.exit(r.status ?? 1);

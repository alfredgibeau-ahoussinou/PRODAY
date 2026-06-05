#!/usr/bin/env node
/**
 * Pictos Pro Day Man (anthracite) et Pro Day Pro (bleu vif) — teinte mark distincte de Woman.
 * Libellés rendus en natif via ManLogo.tsx / ProLogo.tsx.
 *
 *   node scripts/generate-universe-logos.mjs
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const branding = resolve(__dirname, '../assets/branding');

const py = `
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import colorsys

root = Path(${JSON.stringify(branding)})

def rgb_to_hsv_arr(rgb):
    flat = rgb.reshape(-1, 3) / 255.0
    out = np.zeros_like(flat)
    for i, (r, g, b) in enumerate(flat):
        out[i] = colorsys.rgb_to_hsv(float(r), float(g), float(b))
    return out.reshape(rgb.shape[:2] + (3,))

def hsv_to_rgb_arr(hsv):
    flat = hsv.reshape(-1, 3)
    out = np.zeros((flat.shape[0], 3))
    for i, (h, s, v) in enumerate(flat):
        r, g, b = colorsys.hsv_to_rgb(float(h), float(s), float(v))
        out[i] = (r, g, b)
    return (out.reshape(hsv.shape[:2] + (3,)) * 255).astype(np.uint8)

def crop_visible(im, pad=8):
    data = np.array(im)
    ys, xs = np.where(data[..., 3] > 18)
    if len(xs) == 0:
        return im
    return im.crop((max(0, xs.min() - pad), max(0, ys.min() - pad),
                    min(im.width, xs.max() + pad + 1), min(im.height, ys.max() + pad + 1)))

def is_brand_pixel(a, h, s, v):
    return (a > 12) & (s > 0.12) & (((h > 0.45) & (h < 0.72)) | ((h > 0.55) & (v > 0.35)))

def recolor_man(im):
    """P anthracite — très distinct du bleu classique ProDay."""
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3]
    hsv = rgb_to_hsv_arr(rgb)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    brand = is_brand_pixel(a, h, s, v)
    h_new = np.where(brand, 0.06, h)
    s_new = np.where(brand, np.clip(s * 0.06, 0, 0.12), s)
    v_new = np.where(brand, np.clip(v * 0.16, 0.04, 0.26), v)
    rgb_out = hsv_to_rgb_arr(np.stack([h_new, s_new, v_new], axis=-1))
    arr[..., :3] = rgb_out
    out = Image.fromarray(arr.astype(np.uint8))
    return ImageEnhance.Contrast(out).enhance(1.18)

def recolor_pro(im):
    """P bleu pro vif — distinct Woman rose et Man anthracite."""
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3]
    hsv = rgb_to_hsv_arr(rgb)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    brand = is_brand_pixel(a, h, s, v)
    h_new = np.where(brand, 0.585, h)
    s_new = np.where(brand, np.clip(s * 1.22, 0.62, 1.0), s)
    v_new = np.where(brand, np.clip(v * 1.05, 0.52, 1.0), v)
    rgb_out = hsv_to_rgb_arr(np.stack([h_new, s_new, v_new], axis=-1))
    arr[..., :3] = rgb_out
    out = Image.fromarray(arr.astype(np.uint8))
    return ImageEnhance.Contrast(out).enhance(1.12)

def save_picto(im, name):
    im = crop_visible(im, pad=10)
    w, h = im.size
    im = im.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=85, threshold=2))
    im.save(root / name, "PNG", optimize=True)
    print("OK", name)

mark = Image.open(root / "logo-mark-transparent.png").convert("RGBA")

man = recolor_man(mark.copy())
save_picto(man, "logo-man-picto.png")
save_picto(man.copy(), "logo-man-mark-transparent.png")
# Compat chemins legacy
save_picto(man.copy(), "logo-homme-picto.png")
save_picto(man.copy(), "logo-homme-mark-transparent.png")

pro = recolor_pro(mark.copy())
save_picto(pro, "logo-pro-picto.png")
save_picto(pro.copy(), "logo-pro-mark-transparent.png")
`;

if (!existsSync(resolve(branding, 'logo-mark-transparent.png'))) {
  console.error('Manquant: logo-mark-transparent.png — lancez npm run branding:logos');
  process.exit(1);
}

const r = spawnSync('python3', ['-c', py], { stdio: 'inherit' });
process.exit(r.status ?? 1);

/**
 * Régénère les logos transparents ProDay (ISNet + couleurs originales).
 * Prérequis : pip3 install rembg pillow numpy onnxruntime
 *
 *   node scripts/generate-transparent-logos.mjs
 */

import { existsSync } from 'fs';
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
        raw = remove(f.read(), session=session, alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=20,
            alpha_matting_erode_size=10)
    return Image.open(io.BytesIO(raw)).convert("RGBA")

def alpha_from_white_bg(src):
    """Fond blanc uni — rembg confond le coureur blanc avec l'arrière-plan."""
    rgb = np.array(Image.open(root / src).convert("RGB"), dtype=np.float32)
    d = np.linalg.norm(rgb - 255.0, axis=-1)
    a = np.clip((d - 10.0) * 5.5, 0, 255)
    a = np.array(
        Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.55))
    )
    return Image.fromarray(a.astype(np.uint8), mode="L")

def soften_alpha(im, blur=0.4):
    arr = np.array(im, dtype=np.float32)
    a = arr[..., 3] / 255.0
    a = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))) / 255.0
    arr[..., 3] = np.clip(a * 255, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def strip_matte(im, threshold=40):
    arr = np.array(im, dtype=np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    dark = (lum < threshold) & (a > 8)
    a = np.where(dark, a * 0.02, a)
    arr[..., 3] = np.clip(a, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def is_blue_pixel(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (b >= r * 0.72) & (b > 42) & (b > g * 0.92)

def fill_black_silhouettes(im, lum_max=110):
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    blue = is_blue_pixel(rgb)
    cutout = (a > 20) & (~blue) & (lum < lum_max)
    target = np.array([252.0, 252.0, 255.0], dtype=np.float32)
    rgb = np.where(cutout[..., None], target, rgb)
    arr[..., :3] = np.clip(rgb, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def defringe_halos(im):
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    pale = (rgb[..., 0] > 218) & (rgb[..., 1] > 218) & (rgb[..., 2] > 218)
    fringe = (a > 2) & (a < 175) & (pale | (lum > 205))
    a = np.where(fringe, 0, a)
    arr[..., 3] = np.clip(a, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def fill_large_interior_holes(rgb_im, bg=(0.0, 3.0, 22.0), tol=36, min_area=520):
    from collections import deque
    arr = np.array(rgb_im.convert("RGB"), dtype=np.uint8)
    h, w = arr.shape[:2]
    bg_arr = np.array(bg, dtype=np.float32)
    dist = np.linalg.norm(arr.astype(np.float32) - bg_arr, axis=-1)
    is_bg = dist < tol
    exterior = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x]:
                exterior[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not exterior[y, x]:
                exterior[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and is_bg[ny, nx] and not exterior[ny, nx]:
                exterior[ny, nx] = True
                q.append((ny, nx))
    interior = is_bg & ~exterior
    seen = np.zeros((h, w), dtype=bool)
    for y in range(h):
        for x in range(w):
            if not interior[y, x] or seen[y, x]:
                continue
            comp = []
            dq = deque([(y, x)])
            seen[y, x] = True
            while dq:
                cy, cx = dq.popleft()
                comp.append((cy, cx))
                for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and interior[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        dq.append((ny, nx))
            if len(comp) >= min_area:
                for cy, cx in comp:
                    arr[cy, cx] = (252, 252, 255)
    return Image.fromarray(arr)

def polish_auth_dark(im):
    im = fill_black_silhouettes(im)
    im = defringe_halos(im)
    return soften_alpha(im, blur=0.2)

def auth_dark_rgb_base():
    return fill_large_interior_holes(Image.open(root / "logo-dark.png"))

def crop_visible(im, pad=12, alpha_min=20):
    arr = np.array(im)
    ys, xs = np.where(arr[..., 3] > alpha_min)
    if len(xs) == 0:
        return im
    return im.crop((max(0, xs.min()-pad), max(0, ys.min()-pad),
                    min(im.width, xs.max()+pad+1), min(im.height, ys.max()+pad+1)))

def save_sized(im, dst, width=1024):
    s = width / im.width
    out = im.resize((width, max(1, int(im.height * s))), Image.Resampling.LANCZOS)
    out.save(root / dst, "PNG", optimize=True)
    return out

def composite(src, alpha_mask, dst, extra=None, strip=False):
    base = Image.open(root / src).convert("RGBA")
    if alpha_mask.mode != "L":
        alpha_mask = alpha_mask.split()[3]
    alpha_mask = alpha_mask.resize(base.size, Image.Resampling.LANCZOS)
    a = np.array(alpha_mask, dtype=np.float32) / 255.0
    a = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.35))) / 255.0
    out = np.array(base, dtype=np.float32)
    out[..., 3] = a * 255
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    if strip:
        im = strip_matte(im)
    if extra:
        im = extra(im)
    im = soften_alpha(crop_visible(im))
    return save_sized(im, dst)

a_light = alpha_from_white_bg("logo-light.png")
a_dark = alpha_from("logo-dark.png")

hero = composite("logo-light.png", a_light, "logo-transparent-hero.png")
composite("logo-dark.png", a_dark, "logo-transparent-dark.png", strip=True)

def composite_rgb_base(rgb_base, alpha_rgba, dst, extra=None, strip=False):
    base = rgb_base.convert("RGBA")
    alpha_mask = alpha_rgba.split()[3].resize(base.size, Image.Resampling.LANCZOS)
    a = np.array(alpha_mask, dtype=np.float32) / 255.0
    a = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.35))) / 255.0
    out = np.array(base, dtype=np.float32)
    out[..., 3] = a * 255
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    if strip:
        im = strip_matte(im)
    if extra:
        im = extra(im)
    im = soften_alpha(crop_visible(im))
    return save_sized(im, dst)

composite_rgb_base(auth_dark_rgb_base(), a_dark, "logo-auth-dark.png", polish_auth_dark)

w, h = hero.size
mark = hero.crop((int(w*0.06), 0, int(w*0.94), int(h * 0.455)))
mark = crop_visible(mark, pad=14)
s = 640 / mark.width
mark = mark.resize((640, max(1, int(mark.height * s))), Image.Resampling.LANCZOS)
mark.save(root / "logo-mark-transparent.png", "PNG", optimize=True)
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

/**
 * Génère logo-white.png : fond transparent, picto P en couleur, typo entièrement blanche.
 * Usage : node scripts/generate-white-logo.mjs
 */
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "../assets/branding/logo-dark.png");
const out = resolve(root, "public/branding/logo-white.png");

if (!existsSync(src)) {
  console.error("Manquant:", src);
  process.exit(1);
}

const py = `
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

src = Path(${JSON.stringify(src)})
out = Path(${JSON.stringify(out)})
WHITE = np.array([255.0, 255.0, 255.0], dtype=np.float32)
BG = np.array([0.0, 3.0, 22.0], dtype=np.float32)

im = Image.open(src).convert("RGBA")
arr = np.array(im, dtype=np.float32)
rgb = arr[..., :3]
h, w = arr.shape[:2]

# Fond navy → transparent
dist_bg = np.linalg.norm(rgb - BG, axis=-1)
alpha = np.clip((dist_bg - 8.0) * 8.0, 0, 255)
alpha = np.array(
    Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.45))
).astype(np.float32)

# Bandeau typographique (ProDay + tagline) — tout en blanc
text_y0 = int(h * 0.54)
text_mask = np.zeros((h, w), dtype=bool)
text_mask[text_y0:, :] = True
visible = alpha > 24
whiten = text_mask & visible
rgb = np.where(whiten[..., None], WHITE, rgb)

# Coureur (trous sombres dans le P) → blanc
icon_mask = ~text_mask
lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
runner = icon_mask & visible & (lum < 42)
rgb = np.where(runner[..., None], WHITE, rgb)

arr[..., :3] = np.clip(rgb, 0, 255)
arr[..., 3] = alpha
result = Image.fromarray(arr.astype(np.uint8))

# Recadrage
ys, xs = np.where(arr[..., 3] > 20)
pad = 14
result = result.crop((
    max(0, xs.min() - pad),
    max(0, ys.min() - pad),
    min(w, xs.max() + pad + 1),
    min(h, ys.max() + pad + 1),
))

# Export 1024px de large
target_w = 1024
s = target_w / result.width
result = result.resize((target_w, max(1, int(result.height * s))), Image.Resampling.LANCZOS)
out.parent.mkdir(parents=True, exist_ok=True)
result.save(out, "PNG", optimize=True)
print("OK", out)
`;

const r = spawnSync("python3", ["-c", py], { stdio: "inherit" });
process.exit(r.status ?? 1);

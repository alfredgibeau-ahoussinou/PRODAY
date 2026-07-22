/**
 * Génère favicon + icônes PWA à partir du logo officiel ProDay.
 * Usage : node scripts/generate-pwa-icons.mjs
 */
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const logoPath = resolve(root, "public/branding/logo-proday-official.png");
const iconsDir = resolve(root, "public/icons");

if (!existsSync(logoPath)) {
  console.error("Manquant:", logoPath);
  process.exit(1);
}

mkdirSync(iconsDir, { recursive: true });

const py = `
from pathlib import Path
from PIL import Image

root = Path(${JSON.stringify(root)})
logo = Image.open(root / "public/branding/logo-proday-official.png").convert("RGBA")
# Zone du picto P (haut du logo officiel) — lisible en favicon 16–32 px
mark = logo.crop((0, 0, logo.width, int(logo.height * 0.62)))
BG = (255, 255, 255, 255)

def fit(src, size, padding_ratio=0.08):
    canvas = Image.new("RGBA", (size, size), BG)
    pad = int(size * padding_ratio)
    max_w = size - 2 * pad
    max_h = size - 2 * pad
    ratio = min(max_w / src.width, max_h / src.height)
    w, h = max(1, int(src.width * ratio)), max(1, int(src.height * ratio))
    resized = src.resize((w, h), Image.Resampling.LANCZOS)
    x, y = (size - w) // 2, (size - h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

def make_icon(size, padding_ratio=0.08, maskable=False, full=False):
    src = logo if full else mark
    pad = 0.18 if maskable else padding_ratio
    return fit(src, size, pad)

# Favicon Next (app/icon.png) + apple + PWA
out = [
    (32, root / "src/app/icon.png", False, False),
    (180, root / "src/app/apple-icon.png", False, False),
    (96, root / "public/icons/icon-96.png", False, False),
    (128, root / "public/icons/icon-128.png", False, False),
    (192, root / "public/icons/icon-192.png", False, False),
    (256, root / "public/icons/icon-256.png", False, False),
    (384, root / "public/icons/icon-384.png", False, False),
    (512, root / "public/icons/icon-512.png", False, False),
    (512, root / "public/icons/icon-512-maskable.png", True, False),
]
for size, path, maskable, full in out:
    make_icon(size, maskable=maskable, full=full).convert("RGB").save(path, "PNG", optimize=True)

ico_sizes = [16, 32, 48]
ico_images = [make_icon(s, padding_ratio=0.06).convert("RGBA") for s in ico_sizes]
ico_images[0].save(
    root / "src/app/favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[1:],
)
print("OK — favicon + icônes générés depuis logo-proday-official.png")
`;

const r = spawnSync("python3", ["-c", py], { stdio: "inherit" });
process.exit(r.status ?? 1);

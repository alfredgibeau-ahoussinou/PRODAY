/**
 * Génère favicon + icônes PWA à partir du logo blanc officiel.
 * Usage : node scripts/generate-pwa-icons.mjs
 */
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const logoPath = resolve(root, "public/branding/logo-white.png");
const appDir = resolve(root, "src/app");
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
logo = Image.open(root / "public/branding/logo-white.png").convert("RGBA")
BG = (3, 3, 3, 255)

def make_icon(size, padding_ratio=0.1, maskable=False):
    pad = 0.22 if maskable else padding_ratio
    canvas = Image.new("RGBA", (size, size), BG)
    max_w = int(size * (1 - 2 * pad))
    max_h = int(size * (1 - 2 * pad))
    ratio = min(max_w / logo.width, max_h / logo.height)
    w, h = int(logo.width * ratio), int(logo.height * ratio)
    resized = logo.resize((w, h), Image.Resampling.LANCZOS)
    x, y = (size - w) // 2, (size - h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

out = [
    (32, root / "src/app/icon.png"),
    (180, root / "src/app/apple-icon.png"),
    (192, root / "public/icons/icon-192.png"),
    (512, root / "public/icons/icon-512.png"),
    (512, root / "public/icons/icon-512-maskable.png", True),
]
for item in out:
    maskable = item[2] if len(item) > 2 else False
    make_icon(item[0], maskable=maskable).convert("RGB").save(item[1], "PNG", optimize=True)

ico_sizes = [16, 32, 48]
ico_images = [make_icon(s, padding_ratio=0.08).convert("RGBA") for s in ico_sizes]
ico_images[0].save(
    root / "src/app/favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[1:],
)
print("OK")
`;

const r = spawnSync("python3", ["-c", py], { stdio: "inherit" });
process.exit(r.status ?? 1);

/**
 * Génère favicon + icônes PWA à partir du picto P du logo officiel ProDay.
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

# Picto P uniquement (hors wordmark / tagline) — bbox mesurée sur le logo officiel
# (192,182)-(831,686) + marge
mark = logo.crop((160, 150, 860, 700))
BG = (255, 255, 255, 255)

def make_icon(size, padding_ratio=0.12, maskable=False):
    pad = 0.2 if maskable else padding_ratio
    canvas = Image.new("RGBA", (size, size), BG)
    max_side = int(size * (1 - 2 * pad))
    ratio = min(max_side / mark.width, max_side / mark.height)
    w = max(1, int(mark.width * ratio))
    h = max(1, int(mark.height * ratio))
    resized = mark.resize((w, h), Image.Resampling.LANCZOS)
    x, y = (size - w) // 2, (size - h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

# Next.js sert app/icon.png en favicon — privilégier une haute résolution
outputs = [
    (192, root / "src/app/icon.png", 0.1, False),
    (180, root / "src/app/apple-icon.png", 0.1, False),
    (96, root / "public/icons/icon-96.png", 0.1, False),
    (128, root / "public/icons/icon-128.png", 0.1, False),
    (192, root / "public/icons/icon-192.png", 0.1, False),
    (256, root / "public/icons/icon-256.png", 0.1, False),
    (384, root / "public/icons/icon-384.png", 0.1, False),
    (512, root / "public/icons/icon-512.png", 0.1, False),
    (512, root / "public/icons/icon-512-maskable.png", 0.18, True),
]
for size, path, pad, maskable in outputs:
    make_icon(size, padding_ratio=pad, maskable=maskable).convert("RGB").save(
        path, "PNG", optimize=True
    )

ico_sizes = [16, 32, 48]
ico_images = [make_icon(s, padding_ratio=0.08).convert("RGBA") for s in ico_sizes]
ico_images[0].save(
    root / "src/app/favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[1:],
)
print("OK — picto P ProDay centré (favicon + PWA)")
`;

const r = spawnSync("python3", ["-c", py], { stdio: "inherit" });
process.exit(r.status ?? 1);

#!/usr/bin/env python3
"""Génère les overlays PNG de l'intro ProDay (textes + carte logo).

Usage : python3 build-intro-overlays.py <output_dir> <config_json>
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont, ImageFilter


def add_text_backdrop(img, top_ratio=0.52):
    """Voile sombre en bas pour faire ressortir le texte."""
    W, H = img.size
    backdrop = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(backdrop)
    top = int(H * top_ratio)
    for y in range(top, H):
        t = (y - top) / max(1, H - top)
        alpha = int(180 * (t**1.4))
        d.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    img.alpha_composite(backdrop)


def load_font(path, size):
    return ImageFont.truetype(path, size)


def text_size(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1], box[1]


def draw_shadowed_text(img, pos, text, font, fill, shadow_alpha=150, blur=7, dy=4):
    """Texte avec ombre douce (meilleure lisibilité sur vidéo)."""
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.text((pos[0], pos[1] + dy), text, font=font, fill=(0, 0, 0, shadow_alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(shadow)
    d = ImageDraw.Draw(img)
    d.text(pos, text, font=font, fill=fill)


def rounded_bar(img, x, y, w, h, color):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x + w, y + h], radius=h / 2, fill=color)


def draw_shadowed_text_centered(img, draw, y, text, font, fill, max_width, shadow_alpha=150, blur=7, dy=4):
    """Texte centré horizontalement, avec retour à la ligne si nécessaire."""
    W = img.size[0]
    words = text.split()
    lines = []
    current = words[0] if words else ""
    for word in words[1:]:
        trial = f"{current} {word}"
        tw, _, _ = text_size(draw, trial, font)
        if tw <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)

    line_heights = []
    for line in lines:
        _, lh, loff = text_size(draw, line, font)
        line_heights.append((lh, loff))

    line_gap = 10
    total_h = sum(lh for lh, _ in line_heights) + line_gap * max(0, len(lines) - 1)
    cursor_y = y

    for i, line in enumerate(lines):
        tw, lh, loff = text_size(draw, line, font)
        x = (W - tw) // 2
        pos_y = cursor_y - loff
        draw_shadowed_text(img, (x, pos_y), line, font, fill, shadow_alpha=shadow_alpha, blur=blur, dy=dy)
        cursor_y += lh + line_gap

    return y + total_h


def make_caption(cfg, out_path, title, subtitle):
    W, H = cfg["width"], cfg["height"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    add_text_backdrop(img)
    draw = ImageDraw.Draw(img)

    title_font = load_font(cfg["fonts"]["title"], 92)
    sub_font = load_font(cfg["fonts"]["body"], 38)

    # Zone de texte centrée avec marges latérales confortables.
    side_margin = 72
    max_text_w = W - side_margin * 2

    tw, t_h, t_off = text_size(draw, title, title_font)
    # Réduire le titre si trop large.
    title_size = 92
    while tw > max_text_w and title_size > 64:
        title_size -= 4
        title_font = load_font(cfg["fonts"]["title"], title_size)
        tw, t_h, t_off = text_size(draw, title, title_font)

    block_y = int(H * 0.62)
    bar_w = 64
    bar_x = (W - bar_w) // 2
    rounded_bar(img, bar_x, block_y, bar_w, 8, (46, 99, 255, 255))

    title_y = block_y + 36
    title_x = (W - tw) // 2
    draw_shadowed_text(img, (title_x, title_y - t_off), title, title_font, (255, 255, 255, 255))

    sub_y = title_y + t_h + 28
    draw_shadowed_text_centered(
        img,
        draw,
        sub_y,
        subtitle,
        sub_font,
        (255, 255, 255, 242),
        max_text_w,
        shadow_alpha=140,
        blur=6,
        dy=3,
    )

    img.save(out_path)


def make_endcard(cfg, out_path):
    W, H = cfg["width"], cfg["height"]
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))

    # Logo (fond blanc d'origine -> fusion parfaite sur carte blanche).
    logo = Image.open(cfg["logo"]).convert("RGBA")
    lw = int(W * 0.72)
    lh = int(lw * logo.height / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    lx = (W - lw) // 2
    ly = H // 2 - lh // 2 - 40
    img.alpha_composite(logo, (lx, ly))

    draw = ImageDraw.Draw(img)
    logo_bottom = ly + lh

    # Trait d'accent bleu.
    bar_w = 64
    rounded_bar(img, (W - bar_w) // 2, logo_bottom + 26, bar_w, 6, (46, 99, 255, 255))

    # Accroche.
    tag = cfg["tagline"]
    tag_font = load_font(cfg["fonts"]["body"], 40)
    tw, th, toff = text_size(draw, tag, tag_font)
    draw.text(((W - tw) // 2, logo_bottom + 52 - toff), tag, font=tag_font, fill=(10, 26, 58, 255))

    img.convert("RGB").save(out_path)


def main():
    out_dir = sys.argv[1]
    cfg = json.loads(sys.argv[2])
    for i, cap in enumerate(cfg["captions"]):
        make_caption(cfg, f"{out_dir}/caption{i}.png", cap["title"], cap["subtitle"])
    make_endcard(cfg, f"{out_dir}/endcard.png")
    print(f"✓ Overlays générés dans {out_dir}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Génère les overlays PNG de l'intro ProDay (textes + carte logo).
Design cinématographique, dynamique, ultra-pro avec halo lumineux doré.
"""
import json
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter


def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def text_size(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1], box[1]


def draw_ambient_glow(img, center_x, center_y, radius, color, alpha=50):
    W, H = img.size
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        fill=(color[0], color[1], color[2], alpha)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 2))
    img.alpha_composite(glow)


def draw_shadowed_text(img, pos, text, font, fill, shadow_alpha=180, blur=8, dy=4):
    """Texte avec ombre douce et nette."""
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


def draw_shadowed_text_centered(img, draw, y, text, font, fill, max_width, shadow_alpha=160, blur=8, dy=4):
    """Texte centré horizontalement avec retour à la ligne."""
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

    line_gap = 12
    total_h = sum(lh for lh, _ in line_heights) + line_gap * max(0, len(lines) - 1)
    cursor_y = y

    for i, line in enumerate(lines):
        tw, lh, loff = text_size(draw, line, font)
        x = (W - tw) // 2
        pos_y = cursor_y - loff
        draw_shadowed_text(img, (x, pos_y), line, font, fill, shadow_alpha=shadow_alpha, blur=blur, dy=dy)
        cursor_y += lh + line_gap

    return y + total_h


def make_caption(cfg, out_path, badge, title, subtitle):
    """Crée une carte de texte flottante moderne et ultra-lisible sans masquer la vidéo."""
    W, H = cfg["width"], cfg["height"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    title_font = load_font(cfg["fonts"]["title"], 68)
    badge_font = load_font(cfg["fonts"]["body"], 24)
    sub_font = load_font(cfg["fonts"]["body"], 32)

    # Position du bloc bas (1300px)
    block_y = int(H * 0.66)
    card_w = W - 140
    card_x = 70

    # Fond capsule verre fumé moderne
    glass = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glass)
    card_h = 280
    gdraw.rounded_rectangle(
        [card_x, block_y, card_x + card_w, block_y + card_h],
        radius=28,
        fill=(10, 14, 22, 210),
        outline=(197, 160, 89, 140),
        width=2
    )
    glass = glass.filter(ImageFilter.GaussianBlur(1))
    img.alpha_composite(glass)

    draw = ImageDraw.Draw(img)

    # Badge or / néon
    if badge:
        bw, bh, _ = text_size(draw, badge, badge_font)
        badge_w = bw + 32
        badge_h = bh + 16
        bx = (W - badge_w) // 2
        by = block_y + 28
        draw.rounded_rectangle([bx, by, bx + badge_w, by + badge_h], radius=999, fill=(197, 160, 89, 45), outline=(197, 160, 89, 180), width=1)
        draw.text((bx + 16, by + 6), badge, font=badge_font, fill=(230, 200, 140, 255))
        content_y = by + badge_h + 16
    else:
        content_y = block_y + 35

    # Titre imposant
    draw_shadowed_text_centered(img, draw, content_y, title, title_font, (255, 255, 255, 255), card_w - 40, shadow_alpha=180, blur=6, dy=3)

    # Sous-titre doré
    draw_shadowed_text_centered(img, draw, content_y + 80, subtitle, sub_font, (197, 160, 89, 255), card_w - 40, shadow_alpha=140, blur=4, dy=2)

    img.save(out_path)


def make_endcard(cfg, out_path):
    """Carte de fin prestigieuse avec halo doré et logo officiel."""
    W, H = cfg["width"], cfg["height"]
    img = Image.new("RGBA", (W, H), (8, 11, 18, 255))

    # Halos dorés d'ambiance
    draw_ambient_glow(img, W // 2, H // 2 - 120, 360, (197, 160, 89), 55)
    draw_ambient_glow(img, W // 2, H // 2 + 250, 420, (56, 189, 248), 25)

    # Logo ProDay Officiel
    logo = Image.open(cfg["logo"]).convert("RGBA")
    lw = int(W * 0.72)
    lh = int(lw * logo.height / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    lx = (W - lw) // 2
    ly = H // 2 - lh // 2 - 140
    img.alpha_composite(logo, (lx, ly))

    draw = ImageDraw.Draw(img)
    logo_bottom = ly + lh

    # Barre dorée centrale
    bar_w = 80
    rounded_bar(img, (W - bar_w) // 2, logo_bottom + 35, bar_w, 6, (197, 160, 89, 255))

    # Message principal : Bienvenue dans cette nouvelle expérience
    welcome_text = "BIENVENUE DANS CETTE\nNOUVELLE EXPÉRIENCE"
    welcome_font = load_font(cfg["fonts"]["title"], 48)
    draw_shadowed_text_centered(
        img,
        draw,
        logo_bottom + 75,
        welcome_text,
        welcome_font,
        (255, 255, 255, 255),
        W - 120,
        shadow_alpha=200,
        blur=10,
        dy=5,
    )

    # Badge signature en bas
    tag_w = 640
    tag_h = 60
    tag_x = (W - tag_w) // 2
    tag_y = logo_bottom + 260
    draw.rounded_rectangle([tag_x, tag_y, tag_x + tag_w, tag_y + tag_h], radius=999, fill=(197, 160, 89, 35), outline=(197, 160, 89, 180), width=1)
    
    sub_font = load_font(cfg["fonts"]["body"], 22)
    sub_text = "CONNECTER · PROGRESSER · RÉVÉLER"
    tw, th, _ = text_size(draw, sub_text, sub_font)
    draw.text(((W - tw) // 2, tag_y + (tag_h - th) // 2 - 2), sub_text, font=sub_font, fill=(230, 200, 140, 255))

    img.convert("RGB").save(out_path)


def main():
    out_dir = sys.argv[1]
    cfg = json.loads(sys.argv[2])
    for i, cap in enumerate(cfg["captions"]):
        badge = cap.get("badge", "PRODAY")
        make_caption(cfg, f"{out_dir}/caption{i}.png", badge, cap["title"], cap["subtitle"])
    make_endcard(cfg, f"{out_dir}/endcard.png")
    print(f"✓ Nouveaux overlays générés dans {out_dir}")


if __name__ == "__main__":
    main()

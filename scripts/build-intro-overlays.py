#!/usr/bin/env python3
"""Génère les overlays PNG de l'intro ProDay (textes + carte logo).
Design cinématographique, dynamique, ultra-pro avec halo lumineux doré.
Garantit 0 superposition de texte et un positionnement dynamique parfait.
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
    return box[2] - box[0], box[3] - box[1]


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


def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = words[0] if words else ""
    for word in words[1:]:
        trial = f"{current} {word}"
        tw, _ = text_size(draw, trial, font)
        if tw <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_shadowed_text_centered(img, draw, y, text, font, fill, max_width, line_spacing=14, shadow_alpha=160, blur=8, dy=4):
    """Texte centré horizontalement avec calcul exact de hauteur et sans aucun chevauchement."""
    W = img.size[0]
    lines = wrap_text(draw, text, font, max_width)
    cursor_y = y

    for line in lines:
        tw, th = text_size(draw, line, font)
        x = (W - tw) // 2
        draw_shadowed_text(img, (x, cursor_y), line, font, fill, shadow_alpha=shadow_alpha, blur=blur, dy=dy)
        line_height = max(th, getattr(font, "size", 30))
        cursor_y += line_height + line_spacing

    return cursor_y


def make_caption(cfg, out_path, badge, title, subtitle):
    """Crée une carte de texte flottante moderne et ultra-lisible sans masquer la vidéo et sans superposition."""
    W, H = cfg["width"], cfg["height"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dummy_draw = ImageDraw.Draw(img)

    title_font = load_font(cfg["fonts"]["title"], 54)
    badge_font = load_font(cfg["fonts"]["body"], 22)
    sub_font = load_font(cfg["fonts"]["body"], 28)

    card_w = W - 120
    card_x = 60
    max_text_w = card_w - 60

    # Pré-calcul précis des hauteurs pour adapter la carte
    title_lines = wrap_text(dummy_draw, title, title_font, max_text_w)
    sub_lines = wrap_text(dummy_draw, subtitle, sub_font, max_text_w)

    title_h = sum(max(text_size(dummy_draw, l, title_font)[1], 54) + 12 for l in title_lines)
    sub_h = sum(max(text_size(dummy_draw, l, sub_font)[1], 28) + 10 for l in sub_lines)
    badge_h = 44 if badge else 0

    total_content_h = badge_h + (16 if badge else 0) + title_h + 16 + sub_h
    card_h = total_content_h + 60
    block_y = H - card_h - 140

    # Fond capsule verre fumé moderne
    glass = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glass)
    gdraw.rounded_rectangle(
        [card_x, block_y, card_x + card_w, block_y + card_h],
        radius=26,
        fill=(10, 14, 22, 220),
        outline=(197, 160, 89, 150),
        width=2
    )
    glass = glass.filter(ImageFilter.GaussianBlur(1))
    img.alpha_composite(glass)

    draw = ImageDraw.Draw(img)
    cursor_y = block_y + 28

    # Badge or / néon
    if badge:
        bw, bh = text_size(draw, badge, badge_font)
        badge_w = bw + 28
        badge_h = bh + 14
        bx = (W - badge_w) // 2
        draw.rounded_rectangle([bx, cursor_y, bx + badge_w, cursor_y + badge_h], radius=999, fill=(197, 160, 89, 45), outline=(197, 160, 89, 180), width=1)
        draw.text((bx + 14, cursor_y + 6), badge, font=badge_font, fill=(230, 200, 140, 255))
        cursor_y += badge_h + 18

    # Titre imposant (rendu ligne par ligne)
    cursor_y = draw_shadowed_text_centered(img, draw, cursor_y, title, title_font, (255, 255, 255, 255), max_text_w, line_spacing=12, shadow_alpha=180, blur=6, dy=3)

    # Espace clair
    cursor_y += 8

    # Sous-titre doré
    draw_shadowed_text_centered(img, draw, cursor_y, subtitle, sub_font, (197, 160, 89, 255), max_text_w, line_spacing=10, shadow_alpha=140, blur=4, dy=2)

    img.save(out_path)


def make_endcard(cfg, out_path):
    """Carte de fin de prestige avec logo officiel, disposition aérée et aucun chevauchement."""
    W, H = cfg["width"], cfg["height"]
    img = Image.new("RGBA", (W, H), (8, 11, 18, 255))

    # Halos dorés d'ambiance
    draw_ambient_glow(img, W // 2, H // 2 - 180, 360, (197, 160, 89), 55)
    draw_ambient_glow(img, W // 2, H // 2 + 250, 420, (56, 189, 248), 25)

    # Logo ProDay Officiel
    logo = Image.open(cfg["logo"]).convert("RGBA")
    lw = int(W * 0.70)
    lh = int(lw * logo.height / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    lx = (W - lw) // 2
    ly = H // 2 - lh // 2 - 180
    img.alpha_composite(logo, (lx, ly))

    draw = ImageDraw.Draw(img)
    logo_bottom = ly + lh

    # Barre dorée centrale
    bar_w = 80
    rounded_bar(img, (W - bar_w) // 2, logo_bottom + 36, bar_w, 6, (197, 160, 89, 255))

    cursor_y = logo_bottom + 80

    # Message principal : Bienvenue dans cette nouvelle expérience
    welcome_text = "BIENVENUE DANS CETTE\nNOUVELLE EXPÉRIENCE"
    welcome_font = load_font(cfg["fonts"]["title"], 44)
    cursor_y = draw_shadowed_text_centered(
        img,
        draw,
        cursor_y,
        welcome_text,
        welcome_font,
        (255, 255, 255, 255),
        W - 140,
        line_spacing=18,
        shadow_alpha=200,
        blur=10,
        dy=5,
    )

    # Espace respirant
    cursor_y += 36

    # Badge signature en bas
    sub_font = load_font(cfg["fonts"]["body"], 22)
    sub_text = "CONNECTER · PROGRESSER · RÉVÉLER"
    tw, th = text_size(draw, sub_text, sub_font)
    
    tag_w = tw + 48
    tag_h = 56
    tag_x = (W - tag_w) // 2
    draw.rounded_rectangle([tag_x, cursor_y, tag_x + tag_w, cursor_y + tag_h], radius=999, fill=(197, 160, 89, 35), outline=(197, 160, 89, 180), width=1)
    draw.text((tag_x + 24, cursor_y + (tag_h - th) // 2), sub_text, font=sub_font, fill=(230, 200, 140, 255))

    img.convert("RGB").save(out_path)


def main():
    out_dir = sys.argv[1]
    cfg = json.loads(sys.argv[2])
    for i, cap in enumerate(cfg["captions"]):
        badge = cap.get("badge", "PRODAY")
        make_caption(cfg, f"{out_dir}/caption{i}.png", badge, cap["title"], cap["subtitle"])
    make_endcard(cfg, f"{out_dir}/endcard.png")
    print(f"✓ Nouveaux overlays générés sans superposition dans {out_dir}")


if __name__ == "__main__":
    main()

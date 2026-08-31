#!/usr/bin/env python3
"""
Génère une vidéo d'intro ProDay courte, épurée et moderne (~6.8s) :
- Fond noir luxueux avec nuances de couleurs et halos d'ambiance
- Textes explicatifs clairs sur les fonctionnalités réelles
- Révélation finale du logo officiel ProDay avec "Bienvenue dans cette nouvelle expérience"
- Musique dynamique synchronisée
"""

import os
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "intro", ".build_clean")
OUT_VIDEO = os.path.join(ROOT, "assets", "intro", "proday-intro.mp4")
MUSIC = os.path.join(ROOT, "assets", "intro", "music", "talent-in-the-air.mp3")
LOGO_OFFICIAL = os.path.join(ROOT, "assets", "branding", "logo-proday-official.png")

os.makedirs(OUT_DIR, exist_ok=True)

W = 1080
H = 1920
FPS = 30

# Couleurs de la charte ProDay
COLOR_BLACK = (8, 11, 17, 255)
COLOR_GOLD = (197, 160, 89, 255)
COLOR_GOLD_LIGHT = (230, 200, 140, 255)
COLOR_WHITE = (255, 255, 255, 255)
COLOR_MUTED = (160, 170, 190, 255)
COLOR_BLUE = (56, 189, 248, 255)
COLOR_EMERALD = (52, 211, 153, 255)
COLOR_AMBER = (251, 191, 36, 255)

FONT_TITLE = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def text_size(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]

def draw_ambient_glow(img, center_x, center_y, radius, color, alpha=45):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        fill=(color[0], color[1], color[2], alpha)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 2))
    img.alpha_composite(glow)

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
    lines = wrap_text(draw, text, font, max_width)
    cursor_y = y
    for line in lines:
        tw, th = text_size(draw, line, font)
        x = (W - tw) // 2
        
        # Ombre
        shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.text((x, cursor_y + dy), line, font=font, fill=(0, 0, 0, shadow_alpha))
        shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
        img.alpha_composite(shadow)
        
        # Texte
        draw.text((x, cursor_y), line, font=font, fill=fill)
        line_height = max(th, getattr(font, "size", 30))
        cursor_y += line_height + line_spacing
    return cursor_y

# ==========================================
# SCÈNE 1 : PRÉSENTATION DE L'APPLICATION
# ==========================================
def render_scene_1(out_path):
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw_ambient_glow(img, W // 2, 450, 450, COLOR_GOLD, 40)
    draw_ambient_glow(img, W // 2, 1250, 500, COLOR_BLUE, 30)

    draw = ImageDraw.Draw(img)

    # Badge ProDay
    badge = "⚡ PRODAY FOOTBALL"
    b_font = load_font(FONT_BOLD, 24)
    bw, bh = text_size(draw, badge, b_font)
    bx = (W - (bw + 36)) // 2
    by = 380
    draw.rounded_rectangle([bx, by, bx + bw + 36, by + bh + 16], radius=999, fill=(197, 160, 89, 40), outline=COLOR_GOLD, width=1)
    draw.text((bx + 18, by + 8), badge, font=b_font, fill=COLOR_GOLD_LIGHT)

    # Titre
    title = "L'APPLICATION TOUT-EN-UN\nDU FOOTBALL"
    t_font = load_font(FONT_TITLE, 52)
    next_y = draw_shadowed_text_centered(img, draw, by + 90, title, t_font, COLOR_WHITE, W - 140, line_spacing=18)

    # 3 Piliers explicatifs dans des cartes sleek
    card_y = next_y + 80
    card_w = W - 160
    card_x = 80
    items = [
        ("⚽ PÔLE JOUEUR", "CV Vidéo, stats de matchs & détections recruteurs", COLOR_BLUE),
        ("📋 PÔLE COACH & IA", "Séances intelligentes Blood Bath & gestion tactique", COLOR_EMERALD),
        ("🛡️ PÔLE CLUB", "Organisation de tournois, licences & sponsoring", COLOR_GOLD),
    ]

    for title_item, desc_item, color in items:
        draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + 140], radius=20, fill=(16, 22, 34, 230), outline=(color[0], color[1], color[2], 100), width=1)
        draw.text((card_x + 30, card_y + 26), title_item, font=load_font(FONT_BOLD, 28), fill=color)
        draw.text((card_x + 30, card_y + 78), desc_item, font=load_font(FONT_REGULAR, 21), fill=COLOR_MUTED)
        card_y += 165

    img.convert("RGB").save(out_path)
    print(f"✓ Scène 1 rendue : {out_path}")

# ==========================================
# SCÈNE 2 : PROMESSE & VALEUR
# ==========================================
def render_scene_2(out_path):
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw_ambient_glow(img, W // 2, 450, 450, COLOR_EMERALD, 40)
    draw_ambient_glow(img, W // 2, 1300, 500, COLOR_GOLD, 35)

    draw = ImageDraw.Draw(img)

    # Badge
    badge = "🚀 NOUVELLE GÉNÉRATION"
    b_font = load_font(FONT_BOLD, 24)
    bw, bh = text_size(draw, badge, b_font)
    bx = (W - (bw + 36)) // 2
    by = 380
    draw.rounded_rectangle([bx, by, bx + bw + 36, by + bh + 16], radius=999, fill=(52, 211, 153, 35), outline=COLOR_EMERALD, width=1)
    draw.text((bx + 18, by + 8), badge, font=b_font, fill=COLOR_EMERALD)

    # Titre
    title = "CONNECTER · PROGRESSER\nRÉVÉLER"
    t_font = load_font(FONT_TITLE, 52)
    next_y = draw_shadowed_text_centered(img, draw, by + 90, title, t_font, COLOR_GOLD, W - 140, line_spacing=18)

    # Cartes explicatives
    card_y = next_y + 80
    card_w = W - 160
    card_x = 80
    items = [
        ("🔥 SÉANCES IA BLOOD BATH", "Générateur de séances intensives 100% sur-mesure", (248, 113, 113, 255)),
        ("📊 SUIVI DES PERFORMANCES", "Notes de match MVP, historique et progression", COLOR_BLUE),
        ("🤝 SPONSORS & VISIBILITÉ", "Mise en relation directe clubs et partenaires locaux", COLOR_AMBER),
    ]

    for title_item, desc_item, color in items:
        draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + 140], radius=20, fill=(16, 24, 30, 230), outline=(color[0], color[1], color[2], 100), width=1)
        draw.text((card_x + 30, card_y + 26), title_item, font=load_font(FONT_BOLD, 28), fill=color)
        draw.text((card_x + 30, card_y + 78), desc_item, font=load_font(FONT_REGULAR, 21), fill=COLOR_MUTED)
        card_y += 165

    img.convert("RGB").save(out_path)
    print(f"✓ Scène 2 rendue : {out_path}")

# ==========================================
# SCÈNE 3 : CARTE FIN AVEC LOGO PRODAY OFFICIEL
# ==========================================
def render_scene_3(out_path):
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw_ambient_glow(img, W // 2, H // 2 - 160, 420, COLOR_GOLD, 60)
    draw_ambient_glow(img, W // 2, H // 2 + 300, 480, COLOR_BLUE, 30)

    # Logo ProDay Officiel
    if os.path.exists(LOGO_OFFICIAL):
        logo = Image.open(LOGO_OFFICIAL).convert("RGBA")
        lw = int(W * 0.72)
        lh = int(lw * logo.height / logo.width)
        logo = logo.resize((lw, lh), Image.LANCZOS)
        lx = (W - lw) // 2
        ly = H // 2 - lh // 2 - 160
        img.alpha_composite(logo, (lx, ly))
        logo_bottom = ly + lh
    else:
        logo_bottom = H // 2 - 50

    draw = ImageDraw.Draw(img)

    # Barre dorée centrale
    bar_w = 80
    draw.rounded_rectangle([(W - bar_w) // 2, logo_bottom + 36, (W + bar_w) // 2, logo_bottom + 42], radius=3, fill=COLOR_GOLD)

    # Message officiel : Bienvenue dans cette nouvelle expérience
    welcome_text = "BIENVENUE DANS CETTE\nNOUVELLE EXPÉRIENCE"
    w_font = load_font(FONT_TITLE, 46)
    cursor_y = draw_shadowed_text_centered(
        img,
        draw,
        logo_bottom + 85,
        welcome_text,
        w_font,
        COLOR_WHITE,
        W - 140,
        line_spacing=18,
        shadow_alpha=200,
        blur=10,
        dy=5,
    )

    # Badge signature
    cursor_y += 40
    sub_font = load_font(FONT_BOLD, 22)
    sub_text = "L'APPLICATION OFFICIELLE DU FOOTBALL"
    tw, th = text_size(draw, sub_text, sub_font)
    
    tag_w = tw + 48
    tag_h = 56
    tag_x = (W - tag_w) // 2
    draw.rounded_rectangle([tag_x, cursor_y, tag_x + tag_w, cursor_y + tag_h], radius=999, fill=(197, 160, 89, 40), outline=COLOR_GOLD, width=1)
    draw.text((tag_x + 24, cursor_y + (tag_h - th) // 2), sub_text, font=sub_font, fill=COLOR_GOLD_LIGHT)

    img.convert("RGB").save(out_path)
    print(f"✓ Scène 3 rendue : {out_path}")

def build_video():
    scene1_png = os.path.join(OUT_DIR, "scene1.png")
    scene2_png = os.path.join(OUT_DIR, "scene2.png")
    scene3_png = os.path.join(OUT_DIR, "scene3.png")

    render_scene_1(scene1_png)
    render_scene_2(scene2_png)
    render_scene_3(scene3_png)

    # Durées courtes et dynamiques
    DUR_1 = 2.0
    DUR_2 = 2.0
    DUR_3 = 2.8
    XFADE = 0.4
    TOTAL_DUR = DUR_1 + DUR_2 + DUR_3 - 2 * XFADE  # 6.0s

    off1 = DUR_1 - XFADE  # 1.6s
    off2 = off1 + DUR_2 - XFADE  # 3.2s

    # Filtre FFmpeg avec transitions fluides et zoom subtil
    filter_complex = (
        f"[0:v]fps={FPS},scale={W}:{H},zoompan=z='min(1.0+0.03*on/({int(DUR_1*FPS)})\\,1.03)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},format=yuv420p[v0];"
        f"[1:v]fps={FPS},scale={W}:{H},zoompan=z='min(1.0+0.03*on/({int(DUR_2*FPS)})\\,1.03)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},format=yuv420p[v1];"
        f"[2:v]fps={FPS},scale={W}:{H},zoompan=z='min(1.0+0.04*on/({int(DUR_3*FPS)})\\,1.04)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},format=yuv420p[v2];"
        f"[v0][v1]xfade=transition=fade:duration={XFADE}:offset={off1:.2f}[x1];"
        f"[x1][v2]xfade=transition=fade:duration={XFADE}:offset={off2:.2f}[vout];"
        f"[3:a]atrim=0:{TOTAL_DUR:.2f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.4,afade=t=out:st={TOTAL_DUR - 0.8:.2f}:d=0.8,volume=0.92[aout]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", str(FPS), "-t", str(DUR_1), "-i", scene1_png,
        "-loop", "1", "-framerate", str(FPS), "-t", str(DUR_2), "-i", scene2_png,
        "-loop", "1", "-framerate", str(FPS), "-t", str(DUR_3), "-i", scene3_png,
        "-i", MUSIC,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-profile:v", "high",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        OUT_VIDEO
    ]

    print(f"→ Encodage de la vidéo d'intro ProDay ({TOTAL_DUR:.1f}s, fond noir & nuances)…")
    subprocess.run(cmd, check=True)
    print(f"✓ Vidéo générée avec succès : {OUT_VIDEO}")

if __name__ == "__main__":
    build_video()

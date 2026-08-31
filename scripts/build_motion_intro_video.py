#!/usr/bin/env python3
"""
Générateur de vidéo d'intro ProDay Motion Graphics 60 FPS
- Parfaitement CENTRÉ horizontalement et verticalement sur l'écran 1080x1920
- Contenu riche, clair et explicatif
- Direction artistique éditoriale du site officiel ProDay
- Rendu 60 FPS fluide sans aucun tremblement
"""

import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_VIDEO = os.path.join(ROOT, "assets", "intro", "proday-intro.mp4")
MUSIC = os.path.join(ROOT, "assets", "intro", "music", "talent-in-the-air.mp3")
LOGO_OFFICIAL = os.path.join(ROOT, "assets", "branding", "logo-proday-official.png")

W = 1080
H = 1920
FPS = 60

# Palette officielle ProDay
C_BG = (7, 16, 12)            # #07100c
C_GOLD = (245, 208, 74)       # #F5D04A
C_GOLD_MUTED = (197, 160, 89) # #C5A059
C_WHITE = (255, 255, 255)
C_TEXT_LIGHT = (235, 240, 245)
C_MUTED = (155, 170, 185)
C_LINE = (35, 55, 45)
C_BLUE = (56, 189, 248)
C_EMERALD = (52, 211, 153)
C_AMBER = (251, 191, 36)

FONT_TITLE = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_MONO = "/System/Library/Fonts/Supplemental/Courier New Bold.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def text_size(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]

def ease_out_cubic(t):
    return 1 - (1 - t) ** 3

# Polices
font_kicker = load_font(FONT_MONO, 22)
font_h1 = load_font(FONT_TITLE, 48)
font_lead = load_font(FONT_REGULAR, 22)
font_card_title = load_font(FONT_BOLD, 26)
font_card_desc = load_font(FONT_REGULAR, 19)
font_tag = load_font(FONT_MONO, 21)

# Logo
if os.path.exists(LOGO_OFFICIAL):
    raw_logo = Image.open(LOGO_OFFICIAL).convert("RGBA")
    lw = int(W * 0.68)
    lh = int(lw * raw_logo.height / raw_logo.width)
    logo_img = raw_logo.resize((lw, lh), Image.LANCZOS)
else:
    logo_img = None

def create_base_canvas(progress_total):
    """Fond noir profond avec de douces respirations dorées et émeraude centrées."""
    img = Image.new("RGBA", (W, H), (*C_BG, 255))
    pulse = math.sin(progress_total * math.pi * 2) * 0.12 + 0.88

    # Halo or centré
    glow1 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d1 = ImageDraw.Draw(glow1)
    r1 = int(450 * pulse)
    d1.ellipse([W//2 - r1, H//2 - 100 - r1, W//2 + r1, H//2 - 100 + r1], fill=(*C_GOLD_MUTED, int(35 * pulse)))
    glow1 = glow1.filter(ImageFilter.GaussianBlur(160))
    img.alpha_composite(glow1)

    # Halo émeraude bas
    glow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(glow2)
    r2 = int(480 * pulse)
    d2.ellipse([W//2 - r2, H//2 + 400 - r2, W//2 + r2, H//2 + 400 + r2], fill=(20, 80, 50, int(30 * pulse)))
    glow2 = glow2.filter(ImageFilter.GaussianBlur(180))
    img.alpha_composite(glow2)

    return img

def render_frame_scene1(t_sec, dur=3.2):
    """Scène 1 : Des portes d'entrée. Un seul football (Parfaitement centré)."""
    norm_t = min(1.0, max(0.0, t_sec / dur))
    alpha_fade = min(1.0, t_sec / 0.4) if t_sec < 0.4 else (1.0 if t_sec < (dur - 0.4) else (dur - t_sec) / 0.4)
    alpha_int = int(255 * alpha_fade)

    img = create_base_canvas(norm_t * 0.33)
    draw = ImageDraw.Draw(img)

    # Calcul du bloc total pour centrage vertical absolu
    # Kicker (30) + Titre (120) + Lead (35) + 3 Cartes (3 * 145 = 435) + Espaces (180) = ~800px
    total_block_h = 820
    start_y = (H - total_block_h) // 2

    e_head = ease_out_cubic(min(1.0, t_sec / 0.7))
    head_y_offset = int((1.0 - e_head) * 25)

    # 1. Kicker
    kicker = "MÊME ÉCOSYSTÈME · PRODAY"
    kw, kh = text_size(draw, kicker, font_kicker)
    ky = start_y - head_y_offset
    draw.text(((W - kw) // 2, ky), kicker, font=font_kicker, fill=(*C_GOLD, alpha_int))

    # 2. Titre centré
    t1 = "Des portes d'entrée."
    t2 = "Un seul football."
    tw1, th1 = text_size(draw, t1, font_h1)
    tw2, th2 = text_size(draw, t2, font_h1)
    ty1 = ky + kh + 22
    ty2 = ty1 + th1 + 8
    draw.text(((W - tw1) // 2, ty1), t1, font=font_h1, fill=(*C_WHITE, alpha_int))
    draw.text(((W - tw2) // 2, ty2), t2, font=font_h1, fill=(*C_GOLD, alpha_int))

    # Lead text centré
    lead = "L'infrastructure qui relie joueurs, coachs, clubs et familles."
    lw, lh = text_size(draw, lead, font_lead)
    ly = ty2 + th2 + 18
    draw.text(((W - lw) // 2, ly), lead, font=font_lead, fill=(*C_TEXT_LIGHT, int(210 * alpha_fade)))

    # 3. Cartes centrées avec informations riches
    cards = [
        ("⚽ PÔLE JOUEUR", "CV en ligne, vidéos highlights, statistiques réelles & détections pro", C_BLUE, 0.25),
        ("📋 PÔLE COACH & STAFF", "Séances d'entraînement IA Blood Bath, tableau tactique & effectif", C_EMERALD, 0.45),
        ("🛡️ PÔLE CLUB & FAMILLE", "Organisation de tournois, convocations RSVP, licences & covoiturage", C_GOLD, 0.65),
    ]

    base_card_y = ly + lh + 45
    card_w = W - 140
    card_x = 70
    card_h = 135
    gap = 20

    for idx, (ctitle, cdesc, col, delay) in enumerate(cards):
        if t_sec > delay:
            card_prog = ease_out_cubic(min(1.0, (t_sec - delay) / 0.55))
            c_alpha = int(alpha_int * card_prog)
            c_offset = int((1.0 - card_prog) * 25)
            cy = base_card_y + idx * (card_h + gap) + c_offset

            # Carte centrée
            draw.rounded_rectangle([card_x, cy, card_x + card_w, cy + card_h], radius=18, fill=(16, 24, 20, int(240 * alpha_fade)), outline=(*col, int(130 * alpha_fade)), width=1)
            
            # Titre carte centré
            ctw, _ = text_size(draw, ctitle, font_card_title)
            draw.text(((W - ctw) // 2, cy + 24), ctitle, font=font_card_title, fill=(*col, c_alpha))
            
            # Desc carte centrée
            cdw, _ = text_size(draw, cdesc, font_card_desc)
            if cdw <= card_w - 40:
                draw.text(((W - cdw) // 2, cy + 76), cdesc, font=font_card_desc, fill=(*C_MUTED, c_alpha))
            else:
                # Si trop long, couper en deux lignes centrées
                words = cdesc.split(" · ")
                if len(words) == 2:
                    w1, w2 = words[0], words[1]
                    tw_1, _ = text_size(draw, w1, font_card_desc)
                    tw_2, _ = text_size(draw, w2, font_card_desc)
                    draw.text(((W - tw_1) // 2, cy + 64), w1, font=font_card_desc, fill=(*C_MUTED, c_alpha))
                    draw.text(((W - tw_2) // 2, cy + 94), w2, font=font_card_desc, fill=(*C_MUTED, c_alpha))
                else:
                    draw.text((card_x + 24, cy + 76), cdesc, font=font_card_desc, fill=(*C_MUTED, c_alpha))

    return img.convert("RGB")

def render_frame_scene2(t_sec, dur=3.2):
    """Scène 2 : Pas un outil de plus. L'infrastructure du foot (Parfaitement centré)."""
    norm_t = min(1.0, max(0.0, t_sec / dur))
    alpha_fade = min(1.0, t_sec / 0.4) if t_sec < 0.4 else (1.0 if t_sec < (dur - 0.4) else (dur - t_sec) / 0.4)
    alpha_int = int(255 * alpha_fade)

    img = create_base_canvas(0.33 + norm_t * 0.33)
    draw = ImageDraw.Draw(img)

    total_block_h = 820
    start_y = (H - total_block_h) // 2

    e_head = ease_out_cubic(min(1.0, t_sec / 0.7))
    head_y_offset = int((1.0 - e_head) * 25)

    # 1. Kicker
    kicker = "TECHNOLOGIE & INNOVATION · PRODAY"
    kw, kh = text_size(draw, kicker, font_kicker)
    ky = start_y - head_y_offset
    draw.text(((W - kw) // 2, ky), kicker, font=font_kicker, fill=(*C_GOLD, alpha_int))

    # 2. Titre centré
    t1 = "Pas un outil de plus."
    t2 = "L'infrastructure du football."
    tw1, th1 = text_size(draw, t1, font_h1)
    tw2, th2 = text_size(draw, t2, font_h1)
    ty1 = ky + kh + 22
    ty2 = ty1 + th1 + 8
    draw.text(((W - tw1) // 2, ty1), t1, font=font_h1, fill=(*C_GOLD, alpha_int))
    draw.text(((W - tw2) // 2, ty2), t2, font=font_h1, fill=(*C_WHITE, alpha_int))

    # Lead
    lead = "Toutes vos données reliées pour que chacun se concentre sur le jeu."
    lw, lh = text_size(draw, lead, font_lead)
    ly = ty2 + th2 + 18
    draw.text(((W - lw) // 2, ly), lead, font=font_lead, fill=(*C_TEXT_LIGHT, int(210 * alpha_fade)))

    # 3. Cartes centrées
    cards = [
        ("🧠 INTELLIGENCE ARTIFICIELLE", "Générateur de séances 100% sur-mesure & aide tactique bienveillante", (248, 113, 113), 0.25),
        ("📊 SUIVI DE MATCHS & FORME", "Notes de match équitables, historique de carrière et forme physique", C_BLUE, 0.45),
        ("🤝 SPONSORS & VISIBILITÉ", "Mécénat de proximité, visibilité locale et déduction fiscale simplifiée", C_AMBER, 0.65),
    ]

    base_card_y = ly + lh + 45
    card_w = W - 140
    card_x = 70
    card_h = 135
    gap = 20

    for idx, (ctitle, cdesc, col, delay) in enumerate(cards):
        if t_sec > delay:
            card_prog = ease_out_cubic(min(1.0, (t_sec - delay) / 0.55))
            c_alpha = int(alpha_int * card_prog)
            c_offset = int((1.0 - card_prog) * 25)
            cy = base_card_y + idx * (card_h + gap) + c_offset

            draw.rounded_rectangle([card_x, cy, card_x + card_w, cy + card_h], radius=18, fill=(16, 24, 20, int(240 * alpha_fade)), outline=(*col, int(130 * alpha_fade)), width=1)
            
            ctw, _ = text_size(draw, ctitle, font_card_title)
            draw.text(((W - ctw) // 2, cy + 24), ctitle, font=font_card_title, fill=(*col, c_alpha))
            
            cdw, _ = text_size(draw, cdesc, font_card_desc)
            if cdw <= card_w - 40:
                draw.text(((W - cdw) // 2, cy + 76), cdesc, font=font_card_desc, fill=(*C_MUTED, c_alpha))
            else:
                words = cdesc.split(" · ")
                if len(words) == 2:
                    w1, w2 = words[0], words[1]
                    tw_1, _ = text_size(draw, w1, font_card_desc)
                    tw_2, _ = text_size(draw, w2, font_card_desc)
                    draw.text(((W - tw_1) // 2, cy + 64), w1, font=font_card_desc, fill=(*C_MUTED, c_alpha))
                    draw.text(((W - tw_2) // 2, cy + 94), w2, font=font_card_desc, fill=(*C_MUTED, c_alpha))
                else:
                    draw.text((card_x + 24, cy + 76), cdesc, font=font_card_desc, fill=(*C_MUTED, c_alpha))

    return img.convert("RGB")

def render_frame_scene3(t_sec, dur=3.5):
    """Scène 3 : Carte de fin officielle ProDay (Parfaitement centrée verticalement et horizontalement)."""
    norm_t = min(1.0, max(0.0, t_sec / dur))
    alpha_fade = min(1.0, t_sec / 0.5) if t_sec < 0.5 else (1.0 if t_sec < (dur - 0.5) else (dur - t_sec) / 0.5)
    alpha_int = int(255 * alpha_fade)

    img = Image.new("RGBA", (W, H), (*C_BG, 255))

    # Halo doré d'ambiance parfaitement centré
    halo_scale = 1.0 + ease_out_cubic(min(1.0, t_sec / 1.8)) * 0.12
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = int(440 * halo_scale)
    gd.ellipse([W//2 - gr, H//2 - gr, W//2 + gr, H//2 + gr], fill=(*C_GOLD_MUTED, int(60 * alpha_fade)))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img.alpha_composite(glow)

    # Calcul de la hauteur totale pour le centrage vertical
    # Logo (~180) + Espace + Titre (~120) + Sous-titre (~30) + Badge (~60) = ~600px
    total_end_h = 640
    start_end_y = (H - total_end_h) // 2

    # 1. Logo Officiel ProDay
    if logo_img:
        logo_scale = 0.97 + ease_out_cubic(min(1.0, t_sec / 1.2)) * 0.03
        cur_lw = int(logo_img.width * logo_scale)
        cur_lh = int(logo_img.height * logo_scale)
        scaled_logo = logo_img.resize((cur_lw, cur_lh), Image.LANCZOS)
        lx = (W - cur_lw) // 2
        ly = start_end_y
        img.alpha_composite(scaled_logo, (lx, ly))
        logo_bottom = ly + cur_lh
    else:
        logo_bottom = start_end_y + 100

    draw = ImageDraw.Draw(img)

    # 2. Barre dorée fine centrée
    bar_prog = ease_out_cubic(min(1.0, max(0.0, (t_sec - 0.2) / 0.7)))
    bar_w = int(88 * bar_prog)
    if bar_w > 0:
        draw.line([(W - bar_w) // 2, logo_bottom + 36, (W + bar_w) // 2, logo_bottom + 36], fill=(*C_GOLD, alpha_int), width=2)

    # 3. Message principal centré
    if t_sec > 0.35:
        text_prog = ease_out_cubic(min(1.0, (t_sec - 0.35) / 0.7))
        t_alpha = int(alpha_int * text_prog)
        t_offset = int((1.0 - text_prog) * 20)

        t1 = "Bienvenue dans cette"
        t2 = "nouvelle expérience."
        tw1, th1 = text_size(draw, t1, font_h1)
        tw2, th2 = text_size(draw, t2, font_h1)
        ty1 = logo_bottom + 75 + t_offset
        ty2 = ty1 + th1 + 10

        draw.text(((W - tw1) // 2, ty1), t1, font=font_h1, fill=(*C_WHITE, t_alpha))
        draw.text(((W - tw2) // 2, ty2), t2, font=font_h1, fill=(*C_GOLD, t_alpha))

        # Sous-titre centré
        sub1 = "L'infrastructure de votre football."
        sw1, sh1 = text_size(draw, sub1, font_lead)
        sy1 = ty2 + th2 + 22
        draw.text(((W - sw1) // 2, sy1), sub1, font=font_lead, fill=(*C_TEXT_LIGHT, int(200 * text_prog)))

        # Kicker signature en bas centré
        if t_sec > 0.65:
            tag_prog = ease_out_cubic(min(1.0, (t_sec - 0.65) / 0.6))
            sub_text = "CONNECTER · PROGRESSER · RÉVÉLER"
            tw, th = text_size(draw, sub_text, font_tag)
            draw.text(((W - tw) // 2, sy1 + sh1 + 45), sub_text, font=font_tag, fill=(*C_GOLD, int(alpha_int * tag_prog)))

    return img.convert("RGB")

def build_smooth_video():
    DUR_1 = 3.2
    DUR_2 = 3.2
    DUR_3 = 3.5
    TOTAL_DUR = DUR_1 + DUR_2 + DUR_3  # 9.9s

    total_frames = int(TOTAL_DUR * FPS)
    frames_1 = int(DUR_1 * FPS)
    frames_2 = int(DUR_2 * FPS)
    frames_3 = total_frames - frames_1 - frames_2

    print(f"→ Rendu de {total_frames} frames en 60 FPS (Parfaitement Centré & Riche en Info)…")

    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", MUSIC,
        "-filter_complex", f"[1:a]atrim=0:{TOTAL_DUR:.2f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.4,afade=t=out:st={TOTAL_DUR - 1.0:.2f}:d=1.0,volume=0.92[aout]",
        "-map", "0:v",
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

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    for f in range(frames_1):
        t_sec = f / FPS
        frame = render_frame_scene1(t_sec, DUR_1)
        proc.stdin.write(frame.tobytes())

    for f in range(frames_2):
        t_sec = f / FPS
        frame = render_frame_scene2(t_sec, DUR_2)
        proc.stdin.write(frame.tobytes())

    for f in range(frames_3):
        t_sec = f / FPS
        frame = render_frame_scene3(t_sec, DUR_3)
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    proc.wait()

    if proc.returncode == 0:
        print(f"✓ Vidéo Motion 60 FPS parfaitement centrée générée : {OUT_VIDEO}")
    else:
        raise RuntimeError(f"Erreur FFmpeg code : {proc.returncode}")

if __name__ == "__main__":
    build_smooth_video()

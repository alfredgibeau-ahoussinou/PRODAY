#!/usr/bin/env python3
"""
Génère les visuels promotionnels pour Stories Instagram (format 1080x1920, 9:16)
utilisant le logo officiel PRODAY, les couleurs réelles de la charte et les vraies fonctionnalités de l'application.
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "marketing", "instagram_stories")
os.makedirs(OUT_DIR, exist_ok=True)

# Dimensions Instagram Story (9:16)
W = 1080
H = 1920

# Couleurs officielles ProDay
COLOR_BLACK = (8, 11, 17, 255)       # #080B11
COLOR_CARD_BG = (16, 22, 34, 255)    # #101622
COLOR_CARD_BORDER = (40, 50, 75, 255) # #28324B
COLOR_GOLD = (197, 160, 89, 255)     # #C5A059 (Or Master)
COLOR_GOLD_LIGHT = (230, 200, 140, 255)
COLOR_WHITE = (255, 255, 255, 255)
COLOR_MUTED = (160, 170, 190, 255)
COLOR_EMERALD = (52, 211, 153, 255)  # Coach
COLOR_BLUE = (56, 189, 248, 255)     # Joueur / Club
COLOR_AMBER = (251, 191, 36, 255)    # Sponsor
COLOR_PURPLE = (168, 85, 247, 255)   # Parent
COLOR_RED = (248, 113, 113, 255)     # Blood Bath / Supporter

# Polices système Mac
FONT_TITLE = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_gradient_background(draw, top_color, bottom_color):
    for y in range(H):
        ratio = y / H
        r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

def draw_ambient_glow(img, center_x, center_y, radius, color, alpha=40):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        fill=(color[0], color[1], color[2], alpha)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 2))
    img.alpha_composite(glow)

def add_official_logo(img, y=100, width=420):
    logo_path = os.path.join(ROOT, "assets", "branding", "logo-proday-official.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(ROOT, "assets", "branding", "proday-logo-master-white.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        ratio = width / logo.width
        h = int(logo.height * ratio)
        logo = logo.resize((width, h), Image.LANCZOS)
        x = (W - width) // 2
        img.alpha_composite(logo, (x, y))
        return y + h
    return y + 100

def draw_rounded_card(draw, x, y, w, h, radius=24, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, outline_width=2):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=fill, outline=outline, width=outline_width)

def draw_badge(draw, x, y, text, font, bg_color, text_color, px=16, py=8, radius=999):
    box = font.getbbox(text)
    tw = box[2] - box[0]
    th = box[3] - box[1]
    w = tw + px * 2
    h = th + py * 2
    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=bg_color)
    draw.text((x + px, y + py - box[1]), text, font=font, fill=text_color)
    return w, h

def draw_footer_cta(draw, text="TÉLÉCHARGER L'APPLICATION SUR PRODAY75.FR", subtext="DISPONIBLE SUR IOS & ANDROID"):
    y = H - 200
    font_btn = load_font(FONT_BOLD, 30)
    font_sub = load_font(FONT_REGULAR, 22)
    
    # Bouton CTA Gold
    btn_w = 860
    btn_h = 84
    btn_x = (W - btn_w) // 2
    draw.rounded_rectangle([btn_x, y, btn_x + btn_w, y + btn_h], radius=42, fill=COLOR_GOLD)
    
    bbox = font_btn.getbbox(text)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y + 24), text, font=font_btn, fill=(10, 10, 10, 255))
    
    bbox_sub = font_sub.getbbox(subtext)
    tw_sub = bbox_sub[2] - bbox_sub[0]
    draw.text(((W - tw_sub) // 2, y + btn_h + 16), subtext, font=font_sub, fill=COLOR_MUTED)

# ==========================================
# STORY 1: LANCEMENT PRODAY & NOUVELLE EXPÉRIENCE
# ==========================================
def generate_story_1():
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw, (12, 16, 26), (6, 8, 13))
    draw_ambient_glow(img, W // 2, 400, 350, COLOR_GOLD, 45)
    draw_ambient_glow(img, W // 2, 1100, 400, COLOR_BLUE, 30)

    # Logo
    logo_bottom = add_official_logo(img, y=120, width=460)

    # Slogan
    font_tag = load_font(FONT_BOLD, 26)
    tag = "CONNECTER · PROGRESSER · RÉVÉLER"
    bbox = font_tag.getbbox(tag)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, logo_bottom + 20), tag, font=font_tag, fill=COLOR_GOLD)

    # Titre Hero
    font_hero = load_font(FONT_TITLE, 52)
    font_subhero = load_font(FONT_BOLD, 30)
    title_y = logo_bottom + 80
    t1 = "BIENVENUE DANS CETTE"
    t2 = "NOUVELLE EXPÉRIENCE"
    draw.text(((W - (font_hero.getbbox(t1)[2] - font_hero.getbbox(t1)[0])) // 2, title_y), t1, font=font_hero, fill=COLOR_WHITE)
    draw.text(((W - (font_hero.getbbox(t2)[2] - font_hero.getbbox(t2)[0])) // 2, title_y + 64), t2, font=font_hero, fill=COLOR_GOLD)

    # Grille des 6 Univers ProDay (Réels)
    grid_y = title_y + 170
    card_w = 420
    card_h = 160
    gap = 20
    poles = [
        ("⚽ PÔLE JOUEUR", "CV Vidéo & Stats Match", COLOR_BLUE),
        ("📋 PÔLE COACH", "Séances IA & Tactique", COLOR_EMERALD),
        ("🛡️ PÔLE CLUB", "Gestion & Tournois", (96, 165, 250, 255)),
        ("🤝 PÔLE SPONSOR", "Partenariats & Visibilité", COLOR_AMBER),
        ("👨‍👩‍👧 PÔLE FAMILLE", "Covoiturage & Sécurité", COLOR_PURPLE),
        ("🏆 PÔLE SUPPORTER", "Scores Live & Votes MVP", COLOR_RED),
    ]

    for i, (title, desc, color) in enumerate(poles):
        col = i % 2
        row = i // 2
        cx = 100 + col * (card_w + gap)
        cy = grid_y + row * (card_h + gap)
        
        draw_rounded_card(draw, cx, cy, card_w, card_h, radius=18, fill=(18, 24, 38, 240), outline=(color[0], color[1], color[2], 120), outline_width=2)
        
        # Titre pôle
        font_p = load_font(FONT_BOLD, 26)
        draw.text((cx + 20, cy + 28), title, font=font_p, fill=color)
        
        # Desc
        font_d = load_font(FONT_REGULAR, 20)
        draw.text((cx + 20, cy + 80), desc, font=font_d, fill=COLOR_MUTED)

    draw_footer_cta(draw, "REJOINDRE L'EXPÉRIENCE PRODAY", "DISPONIBLE SUR WEB & MOBILE")
    img.save(os.path.join(OUT_DIR, "01_proday_lancement_app.png"))
    print("✓ Story 1 générée : 01_proday_lancement_app.png")

# ==========================================
# STORY 2: PÔLE JOUEUR (STATS & CARRIÈRE)
# ==========================================
def generate_story_2():
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw, (8, 18, 32), (6, 9, 15))
    draw_ambient_glow(img, W // 2, 600, 400, COLOR_BLUE, 50)

    logo_bottom = add_official_logo(img, y=100, width=380)

    # Header Pôle Joueur
    draw_badge(draw, (W - 240) // 2, logo_bottom + 15, "PÔLE JOUEUR", load_font(FONT_BOLD, 22), (20, 45, 80, 255), COLOR_BLUE, px=20, py=8)
    
    font_title = load_font(FONT_TITLE, 46)
    t = "BOOSTE TA CARRIÈRE"
    draw.text(((W - (font_title.getbbox(t)[2] - font_title.getbbox(t)[0])) // 2, logo_bottom + 75), t, font=font_title, fill=COLOR_WHITE)

    # Carte Joueur Interactive Réelle (ProDay Player Card)
    card_w = 880
    card_h = 880
    card_x = (W - card_w) // 2
    card_y = logo_bottom + 160
    draw_rounded_card(draw, card_x, card_y, card_w, card_h, radius=24, fill=(15, 23, 42, 245), outline=(56, 189, 248, 140), outline_width=2)

    # Header Carte
    font_card_title = load_font(FONT_BOLD, 36)
    draw.text((card_x + 40, card_y + 40), "PRODAY PLAYER CARD", font=font_card_title, fill=COLOR_WHITE)
    draw_badge(draw, card_x + card_w - 180, card_y + 35, "OVR 88", load_font(FONT_BOLD, 26), COLOR_GOLD, (10, 10, 10, 255), px=16, py=6)

    # Fiche Stats Réelles
    stats = [
        ("VITESSE (PAC)", "92", COLOR_BLUE),
        ("TIRS (SHO)", "86", COLOR_GOLD),
        ("PASSES (PAS)", "89", COLOR_BLUE),
        ("DRIBBLES (DRI)", "91", COLOR_GOLD),
        ("DÉFENSE (DEF)", "78", COLOR_BLUE),
        ("PHYSIQUE (PHY)", "85", COLOR_GOLD),
    ]

    stat_grid_y = card_y + 120
    for idx, (label, val, col) in enumerate(stats):
        r = idx // 2
        c = idx % 2
        sx = card_x + 40 + c * 400
        sy = stat_grid_y + r * 105
        
        draw.rounded_rectangle([sx, sy, sx + 380, sy + 85], radius=14, fill=(24, 34, 58, 255))
        draw.text((sx + 20, sy + 28), label, font=load_font(FONT_BOLD, 20), fill=COLOR_MUTED)
        draw.text((sx + 300, sy + 20), val, font=load_font(FONT_TITLE, 34), fill=col)

    # Feature List
    feat_y = card_y + 480
    draw.line([(card_x + 40, feat_y), (card_x + card_w - 40, feat_y)], fill=(45, 60, 90, 255), width=2)
    
    features = [
        "📹 CV Sportif Digital & Vidéos Highlights",
        "📊 Suivi des Matchs & Notes MVP",
        "🎯 Visibilité Détections & Recruteurs",
        "🧠 Assistant IA d'Entraînement Individuel"
    ]
    
    for k, f in enumerate(features):
        fy = feat_y + 30 + k * 80
        draw.text((card_x + 40, fy), f, font=load_font(FONT_BOLD, 25), fill=COLOR_WHITE)

    draw_footer_cta(draw, "CRÉER MA CARTE JOUEUR PRODAY", "REJOINS LES RECRUTEURS ET LES CLUBS")
    img.save(os.path.join(OUT_DIR, "02_pole_joueur_carriere.png"))
    print("✓ Story 2 générée : 02_pole_joueur_carriere.png")

# ==========================================
# STORY 3: PÔLE COACH (ENTRAÎNEMENT IA & BLOOD BATH)
# ==========================================
def generate_story_3():
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw, (8, 26, 20), (5, 12, 10))
    draw_ambient_glow(img, W // 2, 600, 400, COLOR_EMERALD, 45)

    logo_bottom = add_official_logo(img, y=100, width=380)

    draw_badge(draw, (W - 240) // 2, logo_bottom + 15, "PÔLE COACH", load_font(FONT_BOLD, 22), (15, 60, 40, 255), COLOR_EMERALD, px=20, py=8)

    font_title = load_font(FONT_TITLE, 44)
    t = "ENTRAÎNEMENT IA & TACTIQUE"
    draw.text(((W - (font_title.getbbox(t)[2] - font_title.getbbox(t)[0])) // 2, logo_bottom + 75), t, font=font_title, fill=COLOR_WHITE)

    # Carte Séance IA Réelle
    card_w = 880
    card_h = 920
    card_x = (W - card_w) // 2
    card_y = logo_bottom + 155
    draw_rounded_card(draw, card_x, card_y, card_w, card_h, radius=24, fill=(13, 26, 22, 250), outline=(52, 211, 153, 160), outline_width=2)

    # Tag Blood Bath Réel
    draw.rounded_rectangle([card_x + 30, card_y + 30, card_x + card_w - 30, card_y + 90], radius=12, fill=(239, 68, 68, 35), outline=COLOR_RED, width=1)
    draw.text((card_x + 50, card_y + 44), "🔥 SESSION HAUTE INTENSITÉ : BLOOD BATH", font=load_font(FONT_TITLE, 24), fill=COLOR_RED)

    # Phases Réelles générées par l'IA
    phases = [
        ("1. Activation Explosive", "10 min", "Gammes athlétiques & vitesse", COLOR_GOLD),
        ("2. Navettes VO2 Max (15s/15s)", "25 min", "Effort lactique & changements de rythme", COLOR_RED),
        ("3. Circuit Duels & Puissance", "20 min", "1v1 sous fort impact, pressing immédiat", COLOR_BLUE),
        ("4. Match Haute Intensité 5v5", "25 min", "Pressing tout terrain sans temps mort", COLOR_EMERALD),
        ("5. Retour au Calme & Récup", "10 min", "Décharge lactique & étirements", COLOR_MUTED),
    ]

    py = card_y + 115
    for title, dur, desc, col in phases:
        draw.rounded_rectangle([card_x + 30, py, card_x + card_w - 30, py + 120], radius=14, fill=(18, 38, 30, 240))
        draw.text((card_x + 50, py + 20), title, font=load_font(FONT_BOLD, 24), fill=COLOR_WHITE)
        draw_badge(draw, card_x + card_w - 170, py + 15, dur, load_font(FONT_BOLD, 18), (30, 60, 45, 255), col, px=12, py=4)
        draw.text((card_x + 50, py + 65), desc, font=load_font(FONT_REGULAR, 20), fill=COLOR_MUTED)
        py += 140

    # Bouton Appliquer
    draw.rounded_rectangle([card_x + 30, py + 10, card_x + card_w - 30, py + 80], radius=14, fill=COLOR_EMERALD)
    t_btn = "⚡ APPLIQUER AU PLAN DE SÉANCE"
    draw.text((card_x + 180, py + 30), t_btn, font=load_font(FONT_BOLD, 26), fill=(10, 25, 18, 255))

    draw_footer_cta(draw, "CONÇOIS TES SÉANCES SUR PRODAY", "MOTEUR IA GEMINI FLASH & MISTRAL")
    img.save(os.path.join(OUT_DIR, "03_pole_coach_ia_bloodbath.png"))
    print("✓ Story 3 générée : 03_pole_coach_ia_bloodbath.png")

# ==========================================
# STORY 4: PÔLE CLUB (ADMINISTRATION & TOURNOIS)
# ==========================================
def generate_story_4():
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw, (10, 20, 36), (6, 10, 18))
    draw_ambient_glow(img, W // 2, 600, 400, (56, 189, 248, 255), 45)

    logo_bottom = add_official_logo(img, y=100, width=380)

    draw_badge(draw, (W - 240) // 2, logo_bottom + 15, "PÔLE CLUB", load_font(FONT_BOLD, 22), (20, 45, 80, 255), (96, 165, 250, 255), px=20, py=8)

    font_title = load_font(FONT_TITLE, 44)
    t = "PILOTAGE CLUB DE A À Z"
    draw.text(((W - (font_title.getbbox(t)[2] - font_title.getbbox(t)[0])) // 2, logo_bottom + 75), t, font=font_title, fill=COLOR_WHITE)

    # Carte Dashboard Club
    card_w = 880
    card_h = 880
    card_x = (W - card_w) // 2
    card_y = logo_bottom + 155
    draw_rounded_card(draw, card_x, card_y, card_w, card_h, radius=24, fill=(16, 26, 44, 250), outline=(96, 165, 250, 160), outline_width=2)

    # Sections Outils Club
    tools = [
        ("🏆 Organisation de Tournois", "Génération automatique des poules & calendrier de matchs", (96, 165, 250, 255)),
        ("⚙️ Automatisations & Alertes", "Rappels match J-1, relance convocations & alerte météo", COLOR_EMERALD),
        ("📄 Contrôle des Licences", "Vérification des certificats médicaux & adhésions", COLOR_GOLD),
        ("🚗 Covoiturage & Déplacements", "Gestion simplifiée des trajets pour parents et coachs", COLOR_PURPLE),
    ]

    ty = card_y + 40
    for title, desc, col in tools:
        draw.rounded_rectangle([card_x + 30, ty, card_x + card_w - 30, ty + 175], radius=18, fill=(22, 36, 60, 240), outline=(col[0], col[1], col[2], 80), width=1)
        draw.text((card_x + 50, ty + 30), title, font=load_font(FONT_BOLD, 28), fill=col)
        draw.text((card_x + 50, ty + 85), desc, font=load_font(FONT_REGULAR, 21), fill=COLOR_WHITE)
        ty += 205

    draw_footer_cta(draw, "DIGITALISEZ VOTRE CLUB AVEC PRODAY", "DÈS 3€ / ADHÉRENT OU ESSAI GRATUIT")
    img.save(os.path.join(OUT_DIR, "04_pole_club_gestion.png"))
    print("✓ Story 4 générée : 04_pole_club_gestion.png")

# ==========================================
# STORY 5: PÔLE SPONSOR (PACKAGES DE VISIBILITÉ)
# ==========================================
def generate_story_5():
    img = Image.new("RGBA", (W, H), COLOR_BLACK)
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw, (28, 22, 10), (12, 10, 6))
    draw_ambient_glow(img, W // 2, 600, 400, COLOR_GOLD, 50)

    logo_bottom = add_official_logo(img, y=100, width=380)

    draw_badge(draw, (W - 260) // 2, logo_bottom + 15, "PÔLE SPONSOR", load_font(FONT_BOLD, 22), (60, 45, 15, 255), COLOR_GOLD, px=20, py=8)

    font_title = load_font(FONT_TITLE, 44)
    t = "SPONSORING FOOTBALL LOCAL"
    draw.text(((W - (font_title.getbbox(t)[2] - font_title.getbbox(t)[0])) // 2, logo_bottom + 75), t, font=font_title, fill=COLOR_WHITE)

    # Carte Packages Sponsoring
    card_w = 880
    card_h = 880
    card_x = (W - card_w) // 2
    card_y = logo_bottom + 155
    draw_rounded_card(draw, card_x, card_y, card_w, card_h, radius=24, fill=(24, 20, 14, 250), outline=(197, 160, 89, 160), outline_width=2)

    packages = [
        ("⭐ SPONSOR TITRE / MAILLOT", "2 500 € / an", "Logo principal face avant des maillots + visibilité match day", COLOR_GOLD),
        ("👕 SPONSOR ÉQUIPEMENT", "1 200 € / an", "Logo manches/dos vestes + bannières stade", (96, 165, 250, 255)),
        ("🤝 PARTENAIRE LOCAL", "500 € / an", "Présence tournois, page web vitrine et réseaux", COLOR_EMERALD),
    ]

    py = card_y + 40
    for title, price, desc, col in packages:
        draw.rounded_rectangle([card_x + 30, py, card_x + card_w - 30, py + 220], radius=18, fill=(36, 30, 20, 240), outline=(col[0], col[1], col[2], 100), width=1)
        draw.text((card_x + 50, py + 30), title, font=load_font(FONT_BOLD, 26), fill=col)
        draw_badge(draw, card_x + card_w - 240, py + 25, price, load_font(FONT_BOLD, 22), (60, 48, 25, 255), COLOR_WHITE, px=14, py=6)
        draw.text((card_x + 50, py + 95), desc, font=load_font(FONT_REGULAR, 21), fill=COLOR_MUTED)
        draw.text((card_x + 50, py + 155), "✓ Éligible déduction fiscale & mécénat", font=load_font(FONT_BOLD, 18), fill=COLOR_GOLD)
        py += 255

    draw_footer_cta(draw, "DEVENIR SPONSOR OFFICIEL", "BOOSTEZ VOTRE NOTORIÉTÉ LOCALE")
    img.save(os.path.join(OUT_DIR, "05_pole_sponsor_partenariats.png"))
    print("✓ Story 5 générée : 05_pole_sponsor_partenariats.png")

def main():
    print(f"→ Génération des Stories Instagram dans {OUT_DIR}…")
    generate_story_1()
    generate_story_2()
    generate_story_3()
    generate_story_4()
    generate_story_5()
    print("✓ Toutes les 5 stories Instagram promotionnelles ont été générées avec succès !")

if __name__ == "__main__":
    main()

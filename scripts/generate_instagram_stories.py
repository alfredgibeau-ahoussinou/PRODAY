#!/usr/bin/env python3
"""
Générateur de visuels Stories Instagram (1080x1920, 9:16) pour ProDay
Direction artistique alignée sur le site web officiel :
- Typographie éditoriale sobre et prestigieuse (Kickers monospace, grands titres épurés)
- Lignes de fonctionnalités numérotées '01 · ...' avec séparateurs fins
- Logo officiel ProDay, palette #07100c et touches d'or #F5D04A
- Ton bienveillant et honnête valorisant chaque rôle du football
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "marketing", "instagram_stories")
os.makedirs(OUT_DIR, exist_ok=True)

W = 1080
H = 1920

# Couleurs officielles
C_BG = (7, 16, 12, 255)         # #07100c
C_GOLD = (245, 208, 74, 255)    # #F5D04A
C_GOLD_MUTED = (197, 160, 89, 255)
C_WHITE = (255, 255, 255, 255)
C_TEXT_LIGHT = (235, 240, 245, 255)
C_MUTED = (150, 165, 175, 255)
C_LINE = (35, 55, 45, 255)
C_BLUE = (56, 189, 248, 255)
C_EMERALD = (52, 211, 153, 255)
C_AMBER = (251, 191, 36, 255)
C_PURPLE = (168, 85, 247, 255)

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

def draw_ambient_glow(img, center_x, center_y, radius, color, alpha=45):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        fill=(color[0], color[1], color[2], alpha)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 2))
    img.alpha_composite(glow)

def add_official_logo(img, y=120, width=400):
    logo_path = os.path.join(ROOT, "assets", "branding", "logo-proday-official.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        ratio = width / logo.width
        h = int(logo.height * ratio)
        logo = logo.resize((width, h), Image.LANCZOS)
        x = (W - width) // 2
        img.alpha_composite(logo, (x, y))
        return y + h
    return y + 100

def draw_footer_cta(draw, text="DÉCOUVRIR SUR PRODAY75.FR", subtext="DISPONIBLE SUR WEB & MOBILE"):
    y = H - 200
    font_btn = load_font(FONT_BOLD, 26)
    font_sub = load_font(FONT_REGULAR, 20)

    btn_w = 820
    btn_h = 76
    btn_x = (W - btn_w) // 2
    draw.rounded_rectangle([btn_x, y, btn_x + btn_w, y + btn_h], radius=38, fill=C_GOLD)

    bw, bh = text_size(draw, text, font_btn)
    draw.text(((W - bw) // 2, y + (btn_h - bh) // 2 - 2), text, font=font_btn, fill=(7, 16, 12, 255))

    sw, sh = text_size(draw, subtext, font_sub)
    draw.text(((W - sw) // 2, y + btn_h + 16), subtext, font=font_sub, fill=C_MUTED)

# ==========================================
# STORY 1: LANCEMENT & INFRASTRUCTURE
# ==========================================
def generate_story_1():
    img = Image.new("RGBA", (W, H), C_BG)
    draw_ambient_glow(img, W // 2, 450, 420, C_GOLD_MUTED, 40)
    draw_ambient_glow(img, W // 2, 1300, 450, C_EMERALD, 30)

    logo_bottom = add_official_logo(img, y=130, width=420)
    draw = ImageDraw.Draw(img)

    # Kicker
    kicker = "MÊME ÉCOSYSTÈME · FOOTBALL"
    f_kicker = load_font(FONT_MONO, 20)
    kw, kh = text_size(draw, kicker, f_kicker)
    draw.text(((W - kw) // 2, logo_bottom + 30), kicker, font=f_kicker, fill=C_GOLD)

    # Titre
    f_title = load_font(FONT_TITLE, 48)
    t1 = "Des portes d'entrée."
    t2 = "Un seul football."
    tw1, th1 = text_size(draw, t1, f_title)
    tw2, th2 = text_size(draw, t2, f_title)
    ty1 = logo_bottom + 75
    ty2 = ty1 + th1 + 10
    draw.text(((W - tw1) // 2, ty1), t1, font=f_title, fill=C_WHITE)
    draw.text(((W - tw2) // 2, ty2), t2, font=f_title, fill=C_GOLD)

    # Lead
    f_lead = load_font(FONT_REGULAR, 22)
    lead = "L'infrastructure qui relie clubs, joueurs et familles."
    lw, lh = text_size(draw, lead, f_lead)
    draw.text(((W - lw) // 2, ty2 + th2 + 18), lead, font=f_lead, fill=C_TEXT_LIGHT)

    # Lignes éditoriales
    rows = [
        ("01", "PÔLE JOUEUR", "CV en ligne, galerie vidéo, statistiques et détections"),
        ("02", "PÔLE COACH", "Séances d'entraînement IA Blood Bath & tableau tactique"),
        ("03", "PÔLE CLUB", "Organisation de tournois, licences & gestion d'effectifs"),
        ("04", "PÔLE FAMILLE", "Espace jeunes sécurisé, contrôle tuteur & covoiturage"),
        ("05", "PÔLE SPONSOR", "Mécénat de proximité et visibilité pour les commerces"),
    ]

    base_y = ty2 + th2 + 75
    row_w = W - 140
    row_x = 70
    row_h = 135

    f_num = load_font(FONT_BOLD, 22)
    f_rtitle = load_font(FONT_BOLD, 26)
    f_rdesc = load_font(FONT_REGULAR, 20)

    for idx, (num, rtitle, rdesc) in enumerate(rows):
        ry = base_y + idx * row_h
        draw.line([(row_x, ry), (row_x + row_w, ry)], fill=C_LINE, width=1)
        draw.text((row_x + 10, ry + 24), num, font=f_num, fill=C_GOLD)
        draw.text((row_x + 65, ry + 22), rtitle, font=f_rtitle, fill=C_WHITE)
        draw.text((row_x + 65, ry + 64), rdesc, font=f_rdesc, fill=C_MUTED)

    draw_footer_cta(draw, "REJOINDRE L'ÉCOSYSTÈME PRODAY", "CRÉATION DE COMPTE GRATUITE & SANS ENGAGEMENT")
    img.save(os.path.join(OUT_DIR, "01_proday_lancement_app.png"))
    print("✓ Story 1 générée : 01_proday_lancement_app.png")

# ==========================================
# STORY 2: PÔLE JOUEUR
# ==========================================
def generate_story_2():
    img = Image.new("RGBA", (W, H), C_BG)
    draw_ambient_glow(img, W // 2, 450, 420, C_BLUE, 40)

    logo_bottom = add_official_logo(img, y=130, width=380)
    draw = ImageDraw.Draw(img)

    f_kicker = load_font(FONT_MONO, 20)
    kicker = "PÔLE JOUEUR · AMATEURS & PROS"
    kw, _ = text_size(draw, kicker, f_kicker)
    draw.text(((W - kw) // 2, logo_bottom + 30), kicker, font=f_kicker, fill=C_BLUE)

    f_title = load_font(FONT_TITLE, 46)
    t1 = "Booste ta visibilité."
    t2 = "Sans note artificielle."
    tw1, th1 = text_size(draw, t1, f_title)
    tw2, th2 = text_size(draw, t2, f_title)
    ty1 = logo_bottom + 75
    ty2 = ty1 + th1 + 10
    draw.text(((W - tw1) // 2, ty1), t1, font=f_title, fill=C_WHITE)
    draw.text(((W - tw2) // 2, ty2), t2, font=f_title, fill=C_BLUE)

    f_lead = load_font(FONT_REGULAR, 22)
    lead = "Votre parcours sportif authentique, partagé avec bienveillance."
    lw, _ = text_size(draw, lead, f_lead)
    draw.text(((W - lw) // 2, ty2 + th2 + 18), lead, font=f_lead, fill=C_TEXT_LIGHT)

    rows = [
        ("01", "CV SPORTIF EN LIGNE", "Renseignez vos clubs passés, postes, pieds forts et palmarès"),
        ("02", "GALERIE VIDÉO HIGHLIGHTS", "Publiez vos actions clés et moments forts visibles par les recruteurs"),
        ("03", "STATISTIQUES DE MATCH RÉELLES", "Suivi précis de vos temps de jeu, buts, passes et forme physique"),
        ("04", "DÉTECTIONS & MERCATO", "Accédez aux opportunités de détections et annonces de clubs"),
    ]

    base_y = ty2 + th2 + 80
    row_w = W - 140
    row_x = 70
    row_h = 160

    f_num = load_font(FONT_BOLD, 22)
    f_rtitle = load_font(FONT_BOLD, 26)
    f_rdesc = load_font(FONT_REGULAR, 20)

    for idx, (num, rtitle, rdesc) in enumerate(rows):
        ry = base_y + idx * row_h
        draw.line([(row_x, ry), (row_x + row_w, ry)], fill=C_LINE, width=1)
        draw.text((row_x + 10, ry + 26), num, font=f_num, fill=C_BLUE)
        draw.text((row_x + 65, ry + 24), rtitle, font=f_rtitle, fill=C_WHITE)
        draw.text((row_x + 65, ry + 68), rdesc, font=f_rdesc, fill=C_MUTED)

    draw_footer_cta(draw, "CRÉER MON PROFIL JOUEUR", "DISPONIBLE SUR IOS & ANDROID")
    img.save(os.path.join(OUT_DIR, "02_pole_joueur_carriere.png"))
    print("✓ Story 2 générée : 02_pole_joueur_carriere.png")

# ==========================================
# STORY 3: PÔLE COACH & IA
# ==========================================
def generate_story_3():
    img = Image.new("RGBA", (W, H), C_BG)
    draw_ambient_glow(img, W // 2, 450, 420, C_EMERALD, 40)

    logo_bottom = add_official_logo(img, y=130, width=380)
    draw = ImageDraw.Draw(img)

    f_kicker = load_font(FONT_MONO, 20)
    kicker = "PÔLE COACH & STAFF · INTELLIGENCE ARTIFICIELLE"
    kw, _ = text_size(draw, kicker, f_kicker)
    draw.text(((W - kw) // 2, logo_bottom + 30), kicker, font=f_kicker, fill=C_EMERALD)

    f_title = load_font(FONT_TITLE, 46)
    t1 = "Conçois tes séances."
    t2 = "Avec l'aide de l'IA."
    tw1, th1 = text_size(draw, t1, f_title)
    tw2, th2 = text_size(draw, t2, f_title)
    ty1 = logo_bottom + 75
    ty2 = ty1 + th1 + 10
    draw.text(((W - tw1) // 2, ty1), t1, font=f_title, fill=C_WHITE)
    draw.text(((W - tw2) // 2, ty2), t2, font=f_title, fill=C_EMERALD)

    f_lead = load_font(FONT_REGULAR, 22)
    lead = "Gain de temps sur la préparation pour vous concentrer sur vos joueurs."
    lw, _ = text_size(draw, lead, f_lead)
    draw.text(((W - lw) // 2, ty2 + th2 + 18), lead, font=f_lead, fill=C_TEXT_LIGHT)

    rows = [
        ("01", "GÉNÉRATEUR DE SÉANCES IA", "Créez des entraînements complets (Blood Bath, tactique, cardio)"),
        ("02", "TABLEAU TACTIQUE INTERACTIF", "Positionnez vos joueurs, animez vos systèmes et partagez les consignes"),
        ("03", "ANALYSE DE FORME DE L'EFFECTIF", "Suivez la charge physique et la disponibilité de votre groupe"),
        ("04", "FEUILLES DE MATCH & CONVOCATIONS", "Envoyez les convocations avec confirmation RSVP automatique"),
    ]

    base_y = ty2 + th2 + 80
    row_w = W - 140
    row_x = 70
    row_h = 160

    f_num = load_font(FONT_BOLD, 22)
    f_rtitle = load_font(FONT_BOLD, 26)
    f_rdesc = load_font(FONT_REGULAR, 20)

    for idx, (num, rtitle, rdesc) in enumerate(rows):
        ry = base_y + idx * row_h
        draw.line([(row_x, ry), (row_x + row_w, ry)], fill=C_LINE, width=1)
        draw.text((row_x + 10, ry + 26), num, font=f_num, fill=C_EMERALD)
        draw.text((row_x + 65, ry + 24), rtitle, font=f_rtitle, fill=C_WHITE)
        draw.text((row_x + 65, ry + 68), rdesc, font=f_rdesc, fill=C_MUTED)

    draw_footer_cta(draw, "TESTER LE PÔLE COACH IA", "ACCÈS GRATUIT POUR LES ÉDUCATEURS")
    img.save(os.path.join(OUT_DIR, "03_pole_coach_ia_bloodbath.png"))
    print("✓ Story 3 générée : 03_pole_coach_ia_bloodbath.png")

# ==========================================
# STORY 4: PÔLE CLUB
# ==========================================
def generate_story_4():
    img = Image.new("RGBA", (W, H), C_BG)
    draw_ambient_glow(img, W // 2, 450, 420, C_GOLD_MUTED, 40)

    logo_bottom = add_official_logo(img, y=130, width=380)
    draw = ImageDraw.Draw(img)

    f_kicker = load_font(FONT_MONO, 20)
    kicker = "PÔLE CLUB · DIRIGEANTS & ASSOCIATIONS"
    kw, _ = text_size(draw, kicker, f_kicker)
    draw.text(((W - kw) // 2, logo_bottom + 30), kicker, font=f_kicker, fill=C_GOLD)

    f_title = load_font(FONT_TITLE, 46)
    t1 = "Pilotez votre club."
    t2 = "En toute sérénité."
    tw1, th1 = text_size(draw, t1, f_title)
    tw2, th2 = text_size(draw, t2, f_title)
    ty1 = logo_bottom + 75
    ty2 = ty1 + th1 + 10
    draw.text(((W - tw1) // 2, ty1), t1, font=f_title, fill=C_WHITE)
    draw.text(((W - tw2) // 2, ty2), t2, font=f_title, fill=C_GOLD)

    f_lead = load_font(FONT_REGULAR, 22)
    lead = "À partir de 3 € / adhérent. Sans engagement."
    lw, _ = text_size(draw, lead, f_lead)
    draw.text(((W - lw) // 2, ty2 + th2 + 18), lead, font=f_lead, fill=C_TEXT_LIGHT)

    rows = [
        ("01", "GESTION DE TOUTES VOS ÉQUIPES", "Centralisez effectifs, éducateurs, plannings et terrains"),
        ("02", "ORGANISATEUR DE TOURNOIS", "Génération automatique des poules, matchs et palmarès en direct"),
        ("03", "CONTRÔLE DES LICENCES & ADHÉSIONS", "Suivi des certificats médicaux et documents administratifs"),
        ("04", "COVOITURAGE & SÉCURITÉ FAMILLE", "Trajets organisés simplement pour parents et éducateurs"),
    ]

    base_y = ty2 + th2 + 80
    row_w = W - 140
    row_x = 70
    row_h = 160

    f_num = load_font(FONT_BOLD, 22)
    f_rtitle = load_font(FONT_BOLD, 26)
    f_rdesc = load_font(FONT_REGULAR, 20)

    for idx, (num, rtitle, rdesc) in enumerate(rows):
        ry = base_y + idx * row_h
        draw.line([(row_x, ry), (row_x + row_w, ry)], fill=C_LINE, width=1)
        draw.text((row_x + 10, ry + 26), num, font=f_num, fill=C_GOLD)
        draw.text((row_x + 65, ry + 24), rtitle, font=f_rtitle, fill=C_WHITE)
        draw.text((row_x + 65, ry + 68), rdesc, font=f_rdesc, fill=C_MUTED)

    draw_footer_cta(draw, "DIGITALISER MON CLUB SUR PRODAY", "DEMANDE DE DÉMO & ESSAI GRATUIT")
    img.save(os.path.join(OUT_DIR, "04_pole_club_gestion.png"))
    print("✓ Story 4 générée : 04_pole_club_gestion.png")

# ==========================================
# STORY 5: PÔLE SPONSOR
# ==========================================
def generate_story_5():
    img = Image.new("RGBA", (W, H), C_BG)
    draw_ambient_glow(img, W // 2, 450, 420, C_AMBER, 40)

    logo_bottom = add_official_logo(img, y=130, width=380)
    draw = ImageDraw.Draw(img)

    f_kicker = load_font(FONT_MONO, 20)
    kicker = "PÔLE SPONSOR · COMMERCES & ENTREPRISES"
    kw, _ = text_size(draw, kicker, f_kicker)
    draw.text(((W - kw) // 2, logo_bottom + 30), kicker, font=f_kicker, fill=C_AMBER)

    f_title = load_font(FONT_TITLE, 46)
    t1 = "Soutenez le foot local."
    t2 = "Gagnez en visibilité."
    tw1, th1 = text_size(draw, t1, f_title)
    tw2, th2 = text_size(draw, t2, f_title)
    ty1 = logo_bottom + 75
    ty2 = ty1 + th1 + 10
    draw.text(((W - tw1) // 2, ty1), t1, font=f_title, fill=C_WHITE)
    draw.text(((W - tw2) // 2, ty2), t2, font=f_title, fill=C_AMBER)

    f_lead = load_font(FONT_REGULAR, 22)
    lead = "Mécénat de proximité avec déduction fiscale & visibilité mesurée."
    lw, _ = text_size(draw, lead, f_lead)
    draw.text(((W - lw) // 2, ty2 + th2 + 18), lead, font=f_lead, fill=C_TEXT_LIGHT)

    rows = [
        ("01", "PACK PARTENAIRE LOCAL", "Dès 49 € / mois · Présence sur les matchs et la communauté club"),
        ("02", "PACK ÉQUIPEMENT & MAILLOTS", "Logo officiel sur les tenues de match et bannières événements"),
        ("03", "SPONSOR TITRE MAILLOT", "Emplacement premium face avant et communication privilégiée"),
        ("04", "DÉDUCTION FISCALE SIMPLIFIÉE", "Reçus fiscaux générés automatiquement pour votre entreprise"),
    ]

    base_y = ty2 + th2 + 80
    row_w = W - 140
    row_x = 70
    row_h = 160

    f_num = load_font(FONT_BOLD, 22)
    f_rtitle = load_font(FONT_BOLD, 26)
    f_rdesc = load_font(FONT_REGULAR, 20)

    for idx, (num, rtitle, rdesc) in enumerate(rows):
        ry = base_y + idx * row_h
        draw.line([(row_x, ry), (row_x + row_w, ry)], fill=C_LINE, width=1)
        draw.text((row_x + 10, ry + 26), num, font=f_num, fill=C_AMBER)
        draw.text((row_x + 65, ry + 24), rtitle, font=f_rtitle, fill=C_WHITE)
        draw.text((row_x + 65, ry + 68), rdesc, font=f_rdesc, fill=C_MUTED)

    draw_footer_cta(draw, "DEVENIR PARTENAIRE OFFICIEL", "DÉCOUVREZ LES CLUBS DE VOTRE VILLE")
    img.save(os.path.join(OUT_DIR, "05_pole_sponsor_partenariats.png"))
    print("✓ Story 5 générée : 05_pole_sponsor_partenariats.png")

def main():
    print(f"→ Génération des Stories Instagram (Style Éditorial Website) dans {OUT_DIR}…")
    generate_story_1()
    generate_story_2()
    generate_story_3()
    generate_story_4()
    generate_story_5()
    print("✓ Toutes les 5 stories Instagram éditoriales ont été générées avec succès !")

if __name__ == "__main__":
    main()

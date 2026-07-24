#!/usr/bin/env python3
"""Génère docs/internal/ProDay-Acces-Fondateurs.pdf (cheatsheet fondateurs non-dev)."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "internal" / "ProDay-Acces-Fondateurs.pdf"

INK = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#475569")
ACCENT = colors.HexColor("#0E7490")
WARN_BG = colors.HexColor("#FEF3C7")
WARN_BORDER = colors.HexColor("#D97706")
ROW_ALT = colors.HexColor("#F8FAFC")
HEADER_BG = colors.HexColor("#ECFEFF")
LINE = colors.HexColor("#CBD5E1")


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleFR",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=INK,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "SubFR",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "badge": ParagraphStyle(
            "BadgeFR",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#92400E"),
            alignment=TA_CENTER,
            spaceBefore=6,
            spaceAfter=10,
        ),
        "h1": ParagraphStyle(
            "H1FR",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=ACCENT,
            spaceBefore=12,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "BodyFR",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "SmallFR",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=MUTED,
            alignment=TA_LEFT,
        ),
        "cell": ParagraphStyle(
            "CellFR",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=INK,
        ),
        "cell_b": ParagraphStyle(
            "CellBFR",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=INK,
        ),
        "footer": ParagraphStyle(
            "FooterFR",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "pin": ParagraphStyle(
            "PinFR",
            parent=base["Normal"],
            fontName="Courier-Bold",
            fontSize=18,
            leading=22,
            textColor=ACCENT,
            alignment=TA_CENTER,
            spaceBefore=4,
            spaceAfter=4,
        ),
        "step": ParagraphStyle(
            "StepFR",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=INK,
            spaceAfter=3,
        ),
    }


def kv_table(rows: list[tuple[str, str]], s: dict) -> Table:
    data = [[Paragraph(k, s["cell_b"]), Paragraph(v, s["cell"])] for k, v in rows]
    t = Table(data, colWidths=[5.2 * cm, 12.0 * cm])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
    ]
    for i in range(1, len(data)):
        if i % 2 == 1:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), ROW_ALT))
    t.setStyle(TableStyle(style_cmds))
    return t


def warn_box(text: str, s: dict) -> Table:
    inner = Paragraph(text, s["body"])
    t = Table([[inner]], colWidths=[17.2 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WARN_BG),
                ("BOX", (0, 0), (-1, -1), 1, WARN_BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def add_page_bits(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(1.8 * cm, A4[1] - 1.4 * cm, A4[0] - 1.8 * cm, A4[1] - 1.4 * cm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.8 * cm, A4[1] - 1.15 * cm, "ProDay — Accès fondateurs (confidentiel)")
    canvas.drawRightString(A4[0] - 1.8 * cm, A4[1] - 1.15 * cm, "Ne pas diffuser")
    canvas.line(1.8 * cm, 1.3 * cm, A4[0] - 1.8 * cm, 1.3 * cm)
    canvas.drawCentredString(A4[0] / 2, 0.85 * cm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    s = styles()
    today = date.today().strftime("%d/%m/%Y")

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=2.0 * cm,
        bottomMargin=1.8 * cm,
        title="ProDay — Accès fondateurs (confidentiel)",
        author="ProDay",
    )

    story = []
    story.append(Paragraph("ProDay — Accès fondateurs", s["title"]))
    story.append(Paragraph(f"Aide-mémoire partenaires · {today}", s["subtitle"]))
    story.append(Paragraph("CONFIDENTIEL — réservé aux 4 associés fondateurs", s["badge"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))

    story.append(
        warn_box(
            "<b>Confidentiel :</b> à partager uniquement entre les 4 associés "
            "(Alfred, Ben, Arthurus, Yohan). "
            "Ne donnez jamais le minicode, le mot de passe mail ni le mot de passe admin app "
            "à des personnes extérieures.",
            s,
        )
    )

    story.append(Paragraph("1. Destinataires (4 collaborateurs)", s["h1"]))
    collab = [
        [Paragraph("#", s["cell_b"]), Paragraph("Nom", s["cell_b"]), Paragraph("Rôle", s["cell_b"])],
        [
            Paragraph("1", s["cell"]),
            Paragraph("Alfred Gibeau-Ahoussinou", s["cell"]),
            Paragraph("Associé fondateur", s["cell"]),
        ],
        [Paragraph("2", s["cell"]), Paragraph("Ben", s["cell"]), Paragraph("Associé fondateur", s["cell"])],
        [Paragraph("3", s["cell"]), Paragraph("Arthurus", s["cell"]), Paragraph("Associé fondateur", s["cell"])],
        [Paragraph("4", s["cell"]), Paragraph("Yohan", s["cell"]), Paragraph("Associé fondateur", s["cell"])],
    ]
    ct = Table(collab, colWidths=[1.2 * cm, 7.5 * cm, 8.5 * cm])
    ct.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("BACKGROUND", (0, 1), (-1, 1), ROW_ALT),
                ("BACKGROUND", (0, 3), (-1, 3), ROW_ALT),
            ]
        )
    )
    story.append(ct)

    story.append(Paragraph("2. Site", s["h1"]))
    story.append(
        kv_table(
            [
                ("Site", '<link href="https://proday75.fr">https://proday75.fr</link>'),
                ("Admin bêta", '<link href="https://proday75.fr/admin">https://proday75.fr/admin</link>'),
                ("Hub bêta (optionnel)", '<link href="https://proday75.fr/beta">https://proday75.fr/beta</link>'),
                (
                    "Pôle Sponsor (optionnel)",
                    '<link href="https://proday75.fr/sponsor">https://proday75.fr/sponsor</link>',
                ),
            ],
            s,
        )
    )
    story.append(
        Paragraph(
            "Le lien <b>Admin bêta</b> se trouve aussi en bas de page du site (pied de page).",
            s["small"],
        )
    )

    story.append(Paragraph("3. Minicode admin", s["h1"]))
    story.append(Paragraph("739482", s["pin"]))
    story.append(
        Paragraph(
            "Vérifié le 24/07/2026. Ne communiquez ce code à personne en dehors des 4 associés.",
            s["small"],
        )
    )

    story.append(Paragraph("4. Utiliser l’admin en 3 étapes", s["h1"]))
    steps = [
        "Ouvrez <link href='https://proday75.fr/admin'>https://proday75.fr/admin</link> et saisissez le minicode.",
        "Dans la liste d’attente, validez les personnes qui doivent rejoindre la bêta.",
        "C’est tout — la personne reçoit ensuite son accès par e-mail.",
    ]
    story.append(
        ListFlowable(
            [
                ListItem(Paragraph(step, s["step"]), leftIndent=8, bulletColor=ACCENT)
                for step in steps
            ],
            bulletType="1",
            start="1",
            leftIndent=18,
        )
    )

    story.append(Paragraph("5. Boîte mail ProDay (accès partagé)", s["h1"]))
    story.append(
        Paragraph(
            "Pour lire et répondre aux messages reçus par ProDay (contact, candidatures, etc.) :",
            s["body"],
        )
    )
    story.append(
        kv_table(
            [
                ("Adresse principale (Gmail)", "proday.admin@gmail.com"),
                ("Adresse contact affichée", "contact@proday.app"),
                ("Mot de passe boîte mail ProDay", "<b>Proday2026@</b>"),
            ],
            s,
        )
    )
    story.append(
        Paragraph(
            "Ouvrez Gmail avec <b>proday.admin@gmail.com</b> et le mot de passe ci-dessus. "
            "Les messages envoyés à <b>contact@proday.app</b> arrivent aussi de ce côté.",
            s["small"],
        )
    )
    story.append(
        Paragraph(
            "<b>Important :</b> ce mot de passe est réservé aux 4 fondateurs. Ne le communiquez à personne d’extérieur.",
            s["small"],
        )
    )

    story.append(Paragraph("6. Compte admin app (simulateur / prod)", s["h1"]))
    story.append(
        Paragraph(
            "Pour ouvrir l’<b>application ProDay en mode admin</b> (TestFlight, téléphone ou simulateur) :",
            s["body"],
        )
    )
    story.append(
        kv_table(
            [
                ("E-mail", "proday.admin@gmail.com"),
                ("Mot de passe", "<b>Alfred2005@</b>"),
                (
                    "Usage",
                    "Connexion dans l’app → espace Admin (pilotage, utilisateurs, modération…)",
                ),
            ],
            s,
        )
    )
    story.append(
        Paragraph(
            "Lancez l’app ProDay → écran Connexion → saisissez l’e-mail et le mot de passe ci-dessus. "
            "Vous arrivez dans la console admin.",
            s["small"],
        )
    )
    story.append(
        Paragraph(
            "<b>Attention :</b> ce mot de passe est <b>différent</b> du mot de passe Gmail "
            "(<b>Proday2026@</b>). Même adresse e-mail, deux usages : boîte mail vs compte Firebase de l’app.",
            s["small"],
        )
    )
    story.append(
        Paragraph(
            "<b>Important :</b> réservé aux 4 fondateurs. Ne le communiquez à personne d’extérieur.",
            s["small"],
        )
    )

    story.append(Paragraph("7. E-mails de contact (rappel)", s["h1"]))
    story.append(
        kv_table(
            [
                ("Contact", "contact@proday.app"),
                ("Admin / suivi", "proday.admin@gmail.com"),
            ],
            s,
        )
    )

    story.append(Paragraph("8. Rappels", s["h1"]))
    reminders = [
        "Document réservé aux <b>4 fondateurs</b> (Alfred, Ben, Arthurus, Yohan) — ne pas le transmettre hors de ce cercle.",
        "<b>Ne donnez pas le minicode</b>, le <b>mot de passe mail</b> ni le <b>mot de passe admin app</b> "
        "à des tiers (candidats, partenaires, prestataires…).",
        "En cas de doute : demander à Alfred avant de partager quoi que ce soit.",
    ]
    story.append(
        ListFlowable(
            [ListItem(Paragraph(r, s["body"]), leftIndent=8, bulletColor=ACCENT) for r in reminders],
            bulletType="bullet",
            start="•",
            leftIndent=12,
        )
    )

    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=6))
    story.append(
        Paragraph(
            "Fin du document · ProDay 2026 · Accès fondateurs · Ne pas diffuser hors cercle des 4",
            s["footer"],
        )
    )

    doc.build(story, onFirstPage=add_page_bits, onLaterPages=add_page_bits)
    print(f"PDF écrit : {OUT}")


if __name__ == "__main__":
    build()

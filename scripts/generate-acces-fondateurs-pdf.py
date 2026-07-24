#!/usr/bin/env python3
"""Génère docs/internal/ProDay-Acces-Fondateurs.pdf (confidentiel fondateurs)."""

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
    KeepTogether,
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
            fontSize=16,
            leading=20,
            textColor=ACCENT,
            alignment=TA_CENTER,
            spaceBefore=4,
            spaceAfter=4,
        ),
    }


def kv_table(rows: list[tuple[str, str]], s: dict) -> Table:
    data = [
        [Paragraph(k, s["cell_b"]), Paragraph(v, s["cell"])]
        for k, v in rows
    ]
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
    canvas.drawCentredString(
        A4[0] / 2,
        0.85 * cm,
        f"Page {doc.page} · Régénérer : python3 scripts/generate-acces-fondateurs-pdf.py",
    )
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
    story.append(Paragraph("ProDay — Accès fondateurs (confidentiel)", s["title"]))
    story.append(Paragraph(f"Document opérationnel · {today}", s["subtitle"]))
    story.append(Paragraph("CONFIDENTIEL — réservé aux 4 associés fondateurs", s["badge"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))

    story.append(
        warn_box(
            "<b>Attention :</b> ce PDF contient le minicode admin. "
            "Aucune clé API complète (Brevo, Cal, Stripe, comptes de service) n’y figure. "
            "Les secrets complets restent dans Netlify / Firebase — demander à Alfred.",
            s,
        )
    )

    story.append(Paragraph("1. Destinataires (4 collaborateurs)", s["h1"]))
    collab = [
        [Paragraph("#", s["cell_b"]), Paragraph("Nom", s["cell_b"]), Paragraph("Rôle", s["cell_b"])],
        [Paragraph("1", s["cell"]), Paragraph("_À compléter_", s["cell"]), Paragraph("Associé fondateur", s["cell"])],
        [Paragraph("2", s["cell"]), Paragraph("_À compléter_", s["cell"]), Paragraph("Associé fondateur", s["cell"])],
        [Paragraph("3", s["cell"]), Paragraph("_À compléter_", s["cell"]), Paragraph("Associé fondateur", s["cell"])],
        [
            Paragraph("4", s["cell"]),
            Paragraph("Alfred Gibeau-Ahoussinou", s["cell"]),
            Paragraph("Associé · développeur du groupe", s["cell"]),
        ],
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

    story.append(Paragraph("2. Site & espaces opérationnels", s["h1"]))
    story.append(
        kv_table(
            [
                ("Site vitrine", '<link href="https://proday75.fr">https://proday75.fr</link>'),
                ("Admin bêta", '<link href="https://proday75.fr/admin">https://proday75.fr/admin</link>'),
                ("Pôle Sponsor", '<link href="https://proday75.fr/sponsor">https://proday75.fr/sponsor</link>'),
                ("Hub bêta", '<link href="https://proday75.fr/beta">https://proday75.fr/beta</link>'),
                (
                    "Inscription bêta",
                    '<link href="https://proday75.fr/beta/inscription">https://proday75.fr/beta/inscription</link>',
                ),
            ],
            s,
        )
    )

    story.append(Paragraph("Minicode admin bêta (BETA_ADMIN_PIN · Netlify proday75)", s["body"]))
    story.append(Paragraph("739482", s["pin"]))
    story.append(
        Paragraph(
            "Vérifié le 24/07/2026 via <font face='Courier'>netlify env:list</font>. "
            "À faire tourner après tout départ ou fuite suspectée.",
            s["small"],
        )
    )

    story.append(Paragraph("3. GitHub", s["h1"]))
    story.append(
        kv_table(
            [
                (
                    "Dépôt privé",
                    '<link href="https://github.com/alfredgibeau-ahoussinou/PRODAY">'
                    "alfredgibeau-ahoussinou/PRODAY</link>",
                ),
                (
                    "Docs publiques",
                    '<link href="https://github.com/alfredgibeau-ahoussinou/PRODAY-docs">'
                    "alfredgibeau-ahoussinou/PRODAY-docs</link>",
                ),
            ],
            s,
        )
    )

    story.append(Paragraph("4. Firebase", s["h1"]))
    story.append(
        kv_table(
            [
                ("Projet", "proday-155b0"),
                (
                    "Console",
                    '<link href="https://console.firebase.google.com/project/proday-155b0">'
                    "console.firebase.google.com/project/proday-155b0</link>",
                ),
                ("Région Functions", "europe-west1"),
                ("Secrets", "Firebase functions:config / secrets — demander à Alfred"),
            ],
            s,
        )
    )

    story.append(Paragraph("5. Netlify", s["h1"]))
    story.append(
        kv_table(
            [
                ("Projet", "proday75"),
                ("Domaine", '<link href="https://proday75.fr">https://proday75.fr</link>'),
                ("Console", '<link href="https://app.netlify.com/">app.netlify.com</link> (site proday75)'),
                ("Secrets", "Environment variables Netlify — demander à Alfred"),
            ],
            s,
        )
    )

    story.append(Paragraph("6. E-mails", s["h1"]))
    story.append(
        kv_table(
            [
                ("Expéditeur Brevo", "proday.admin@gmail.com"),
                ("Contact produit / légal", "contact@proday.app"),
                ("Partenaires", "partenaires@proday.app"),
                ("Clé API Brevo", "Secret Firebase email.brevo_api_key — demander à Alfred"),
            ],
            s,
        )
    )

    story.append(Paragraph("7. Cal.com (visio Santé)", s["h1"]))
    story.append(
        kv_table(
            [
                ("Clé API", "Stockée dans Firebase config cal.api_key — ne pas coller ici"),
                ("Username org (docs)", "proday-sante"),
                ("Username Alfred", "alfred-gibeau-ahoussinou-crbca7"),
                ("Console", '<link href="https://app.cal.com/">https://app.cal.com/</link>'),
            ],
            s,
        )
    )

    story.append(Paragraph("8. Application mobile (Expo / EAS)", s["h1"]))
    story.append(
        kv_table(
            [
                ("Nom / slug", "ProDay · proday"),
                ("Bundle / package", "com.proday.app"),
                ("EAS projectId", "db5a18a4-8b0a-4c96-a109-eedbb10a69b9"),
                ("Compte admin app", "proday.admin@gmail.com (mot de passe hors Git)"),
            ],
            s,
        )
    )

    story.append(Paragraph("9. Rappels de sécurité", s["h1"]))
    reminders = [
        "Document réservé aux <b>4 fondateurs</b> uniquement — ne jamais partager hors de ce cercle.",
        "Faire <b>tourner le minicode</b> (BETA_ADMIN_PIN) périodiquement et après tout départ.",
        "Ne jamais committer de clés API (Brevo, Cal, Stripe, service accounts) dans Git.",
        "Le PDF est gitignoré (<font face='Courier'>docs/**/*.pdf</font>) ; source Markdown : "
        "<font face='Courier'>docs/internal/ProDay-Acces-Fondateurs.md</font>.",
        "En cas de doute sur un accès : contacter Alfred avant toute diffusion.",
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
            "Fin du document · ProDay 2026 · Accès fondateurs · Ne pas imprimer hors cercle des 4",
            s["footer"],
        )
    )

    doc.build(story, onFirstPage=add_page_bits, onLaterPages=add_page_bits)
    print(f"PDF écrit : {OUT}")


if __name__ == "__main__":
    build()

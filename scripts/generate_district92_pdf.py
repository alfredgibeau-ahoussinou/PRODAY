#!/usr/bin/env python3
"""
Générateur de présentation PDF ProDay pour le District 92 (Hauts-de-Seine).
Conçoit un document PDF multipage de qualité professionnelle, sans entêtes/pieds de page navigateurs, 
avec mockups iPhone réalistes et vocabulaire commercial adapté.
"""

import os
import base64
import subprocess
import sys

WORKSPACE = "/Users/gibeau--ahoussinou/PRODAY"
SCRATCH_DIR = os.path.join(WORKSPACE, "scratch")
HTML_PATH = os.path.join(SCRATCH_DIR, "presentation_district92.html")
PDF_PATH = os.path.join(WORKSPACE, "ProDay_Presentation_District92.pdf")

os.makedirs(SCRATCH_DIR, exist_ok=True)

def get_base64_image(rel_path):
    abs_path = os.path.join(WORKSPACE, rel_path)
    if os.path.exists(abs_path):
        with open(abs_path, 'rb') as f:
            data = base64.b64encode(f.read()).decode('utf-8')
            ext = os.path.splitext(abs_path)[1].lower()
            mime = 'image/png' if ext == '.png' else ('image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/svg+xml')
            return f"data:{mime};base64,{data}"
    return ""

logo_official = get_base64_image("assets/branding/logo-proday-official.png")
logo_horizontal_white = get_base64_image("assets/branding/proday-lockup-horizontal-white.png")
crest_watermark = get_base64_image("assets/branding/crest-watermark.png")
symbol_club = get_base64_image("assets/branding/proday-symbol-pole-club.png")
symbol_coach = get_base64_image("assets/branding/proday-symbol-pole-coach.png")
symbol_player = get_base64_image("assets/branding/proday-symbol-pole-player.png")

html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>ProDay — Présentation District 92</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 0mm;
    }}
    
    @media print {{
      body {{
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }}
      .pdf-page {{
        page-break-after: always;
        page-break-inside: avoid;
      }}
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #090A0F;
      color: #E2E8F0;
      line-height: 1.45;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
    }}

    /* Container A4 Strict */
    .pdf-page {{
      width: 210mm;
      height: 297mm;
      padding: 16mm 16mm 14mm 16mm;
      position: relative;
      background-color: #090A0F;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}

    /* Structure En-tête / Pied de page */
    .header-bar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid #1E293B;
      margin-bottom: 16px;
    }}

    .header-bar img {{
      height: 26px;
      width: auto;
    }}

    .header-badge {{
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      border: 1px solid #334155;
      color: #38BDF8;
      font-weight: 800;
      font-size: 10px;
      padding: 4px 12px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }}

    .footer-bar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748B;
      border-top: 1px solid #1E293B;
      padding-top: 10px;
      margin-top: auto;
    }}

    /* Couverture */
    .cover-page {{
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: radial-gradient(circle at 50% 20%, #1E1B4B 0%, #090A0F 75%);
      padding: 24px;
      border-radius: 20px;
      border: 1px solid #1E293B;
    }}

    .cover-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .cover-top img {{
      height: 42px;
    }}

    .district-pill {{
      background: #0284C7;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }}

    .cover-main {{
      margin: 30px 0;
    }}

    .cover-tag {{
      display: inline-block;
      color: #38BDF8;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }}

    .cover-title {{
      font-size: 36px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 16px;
    }}

    .cover-subtitle {{
      font-size: 16px;
      color: #94A3B8;
      max-width: 580px;
      line-height: 1.45;
      font-weight: 400;
    }}

    .cover-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 28px;
    }}

    .cover-card {{
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid #1E293B;
      border-radius: 14px;
      padding: 16px;
    }}

    .cover-card-icon {{
      font-size: 24px;
      margin-bottom: 10px;
    }}

    .cover-card-title {{
      font-size: 14px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 4px;
    }}

    .cover-card-desc {{
      font-size: 11px;
      color: #94A3B8;
      line-height: 1.35;
    }}

    .cover-footer {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 16px;
    }}

    .cover-meta-title {{
      font-size: 9px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}

    .cover-meta-val {{
      font-size: 12px;
      font-weight: 700;
      color: #F8FAFC;
    }}

    /* Contenu & Layout Fonctionnalité */
    .page-body {{
      flex: 1;
      display: flex;
      flex-direction: column;
    }}

    .feature-layout {{
      display: grid;
      grid-template-columns: 1fr 230px;
      gap: 20px;
      align-items: start;
      margin-top: 4px;
    }}

    .feature-info {{
      display: flex;
      flex-direction: column;
      gap: 12px;
    }}

    .page-tag {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 800;
      color: #38BDF8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}

    .page-title {{
      font-size: 22px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.2;
      letter-spacing: -0.4px;
    }}

    .page-subtitle {{
      font-size: 12px;
      color: #CBD5E1;
      font-weight: 500;
      line-height: 1.45;
    }}

    .box-benefit {{
      background: rgba(2, 132, 199, 0.1);
      border-left: 4px solid #0284C7;
      border-radius: 0 10px 10px 0;
      padding: 10px 14px;
      margin: 2px 0;
    }}

    .box-benefit-title {{
      font-size: 10px;
      font-weight: 800;
      color: #38BDF8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }}

    .box-benefit-text {{
      font-size: 11px;
      color: #F1F5F9;
      line-height: 1.4;
    }}

    .features-list {{
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
    }}

    .feature-item {{
      background: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }}

    .feature-bullet {{
      width: 20px;
      height: 20px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.15);
      color: #38BDF8;
      font-size: 11px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }}

    .feature-item-title {{
      font-size: 12px;
      font-weight: 800;
      color: #F8FAFC;
    }}

    .feature-item-desc {{
      font-size: 11px;
      color: #94A3B8;
      line-height: 1.35;
    }}

    /* Mockups iPhone UI */
    .mockup-container {{
      width: 230px;
      background: #1E293B;
      border-radius: 30px;
      padding: 7px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      border: 1px solid #334155;
      margin: 0 auto;
    }}

    .mockup-screen {{
      background: #0A0A0A;
      border-radius: 24px;
      overflow: hidden;
      min-height: 480px;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, sans-serif;
    }}

    .mockup-notch {{
      height: 22px;
      background: #0A0A0A;
      display: flex;
      align-items: center;
      justify-content: center;
    }}

    .mockup-notch-pill {{
      width: 54px;
      height: 12px;
      background: #000000;
      border-radius: 10px;
    }}

    .mockup-body {{
      padding: 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .mockup-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2px;
    }}

    .mockup-title {{
      font-size: 14px;
      font-weight: 900;
      color: #FFFFFF;
    }}

    .mockup-sub {{
      font-size: 9px;
      color: #94A3B8;
    }}

    .mockup-card {{
      background: #17171C;
      border: 1px solid #262630;
      border-radius: 12px;
      padding: 10px;
    }}

    .mockup-card-accent {{
      background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%);
      border: 1px solid #312E81;
      border-radius: 12px;
      padding: 10px;
      color: #FFF;
    }}

    .mockup-pill {{
      display: inline-block;
      font-size: 8px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 8px;
      background: #0284C7;
      color: #FFF;
      text-transform: uppercase;
    }}

    .mockup-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }}

    .mockup-stat-num {{
      font-size: 16px;
      font-weight: 900;
      color: #FFF;
    }}

    .mockup-stat-lbl {{
      font-size: 8px;
      color: #94A3B8;
      text-transform: uppercase;
    }}

    .mockup-list-item {{
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 0;
      border-bottom: 1px solid #22222E;
    }}

    .mockup-avatar {{
      width: 22px;
      height: 22px;
      border-radius: 11px;
      background: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 800;
      color: #FFF;
    }}

    .mockup-row-title {{
      font-size: 10px;
      font-weight: 700;
      color: #FFF;
    }}

    .mockup-row-sub {{
      font-size: 8px;
      color: #94A3B8;
    }}

    .mockup-dock {{
      height: 32px;
      background: #121217;
      border-top: 1px solid #22222E;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 10px;
    }}

    .mockup-dock-icon {{
      width: 12px;
      height: 12px;
      border-radius: 3px;
      background: #334155;
    }}

    .mockup-dock-icon.active {{
      background: #0284C7;
    }}

    /* Cartes synthétiques pour grille */
    .overview-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 8px;
    }}

    .overview-card {{
      background: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 12px;
      padding: 14px;
    }}

    .overview-card-title {{
      font-size: 13px;
      font-weight: 800;
      color: #38BDF8;
      margin-bottom: 6px;
    }}

    .overview-card-body {{
      font-size: 11px;
      color: #CBD5E1;
      line-height: 1.45;
    }}

    .badge-pole {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }}
    .badge-club {{ background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid #10B981; }}
    .badge-coach {{ background: rgba(59, 130, 246, 0.15); color: #3B82F6; border: 1px solid #3B82F6; }}
    .badge-joueur {{ background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid #F59E0B; }}

  </style>
</head>
<body>

  <!-- ==================== PAGE 1 : COUVERTURE ==================== -->
  <div class="pdf-page">
    <div class="cover-page">
      <div class="cover-top">
        <img src="{logo_horizontal_white or logo_official}" alt="ProDay Logo" />
        <div class="district-pill">PARTENAIRE DISTRICT 92</div>
      </div>
      
      <div class="cover-main">
        <div class="cover-tag">DOSSIER OFFICIEL DE PRÉSENTATION</div>
        <h1 class="cover-title">L’Infrastructure Numérique du Football dans les Hauts-de-Seine</h1>
        <p class="cover-subtitle">
          Présentation fonctionnelle et commerciale de l’écosystème ProDay pour le District 92 et l’ensemble de ses clubs affiliés.
        </p>

        <div class="cover-grid">
          <div class="cover-card">
            <div class="cover-card-icon">🏛️</div>
            <div class="cover-card-title">Pôle Club</div>
            <div class="cover-card-desc">Gouvernance, organigramme, cotisations et pilotage administratif unifié.</div>
          </div>
          <div class="cover-card">
            <div class="cover-card-icon">📋</div>
            <div class="cover-card-title">Pôle Coach</div>
            <div class="cover-card-desc">Gestion des séances, convocations match, tactique et suivi d’effectif.</div>
          </div>
          <div class="cover-card">
            <div class="cover-card-icon">⚽</div>
            <div class="cover-card-title">Pôle Joueur</div>
            <div class="cover-card-desc">Forme physique, carte OVR, progression, covoiturage et opportunités.</div>
          </div>
        </div>
      </div>

      <div class="cover-footer">
        <div>
          <div class="cover-meta-title">DOCUMENTÉ POUR</div>
          <div class="cover-meta-val">District des Hauts-de-Seine de Football (92)</div>
        </div>
        <div style="text-align: right;">
          <div class="cover-meta-title">DATE & VERSION</div>
          <div class="cover-meta-val">Septembre 2026 · Version 1.0.9</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 2 : VISION & ENJEUX DISTRICT 92 ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="header-badge">VISION & R.O.I. DISTRICT 92</div>
    </div>

    <div class="page-body">
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 22px; font-weight: 900; color: #FFF; margin-bottom: 6px;">Pourquoi ProDay est une Révolution pour le District 92</h2>
        <p style="font-size: 12px; color: #94A3B8; line-height: 1.55;">
          Le football amateur dans les Hauts-de-Seine rassemble plus de 90 clubs et des dizaines de milliers de licenciés. Pourtant, la gestion quotidienne repose encore trop souvent sur du bricolage (groupes WhatsApp saturés, fichiers Excel dispersés, organisation des trajets au dernier moment). ProDay apporte une plateforme professionnelle clé en main.
        </p>
      </div>

      <div class="overview-grid">
        <div class="overview-card">
          <div class="overview-card-title" style="color: #EF4444;">❌ Le Constat Actuel du Terrain</div>
          <div class="overview-card-body">
            • <strong>Convocations perdues :</strong> Relances téléphoniques incessantes et retards le week-end.<br/>
            • <strong>Logistique lourde :</strong> Galère des déplacements à l'extérieur pour les parents et les clubs.<br/>
            • <strong>Rupture de communication :</strong> Manque d'information entre dirigeants, coachs et familles.<br/>
            • <strong>Sécurité des mineurs :</strong> Flux d'informations non sécurisés sans contrôle parental.
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-card-title" style="color: #10B981;">✅ La Réponse ProDay</div>
          <div class="overview-card-body">
            • <strong>Centralisation 100 % sécurisée :</strong> Une seule app pour tous les acteurs du club.<br/>
            • <strong>Covoiturage intégré :</strong> Transport géolocalisé pour les matchs et entraînements.<br/>
            • <strong>Gains de temps massifs :</strong> Automatisation des tâches administratives et des convocations.<br/>
            • <strong>Valorisation des talents :</strong> Visibilité et suivi athlétique des jeunes du 92.
          </div>
        </div>
      </div>

      <div style="margin-top: 18px; background: rgba(2, 132, 199, 0.1); border: 1px solid #0284C7; border-radius: 14px; padding: 16px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #38BDF8; margin-bottom: 4px;">💡 La Valeur Ajoutée Commerciale pour les Clubs du District 92</h3>
        <p style="font-size: 11px; color: #E2E8F0; line-height: 1.5;">
          Pour les responsables commerciaux du District, ProDay représente un argument de modernisation majeur : offrir aux clubs affiliés un outil moderne qui améliore la rétention des licenciés, sécurise les données des mineurs et renforce l'image de marque du football dans le 92.
        </p>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Dossier Commercial</span>
      <span>Page 2 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 3 : PÔLE CLUB (COCKPIT & ÉQUIPES) ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="badge-pole badge-club">🏛️ PÔLE CLUB — GOUVERNANCE</div>
    </div>

    <div class="page-body">
      <div class="feature-layout">
        <div class="feature-info">
          <div class="page-tag">PAGE 1 & 2 · DIRECTION DU CLUB</div>
          <h2 class="page-title">Cockpit Exécutif & Organigramme des Équipes</h2>
          <p class="page-subtitle">
            Le Pôle Club offre au président et aux directeurs sportifs une vue synthétique et en temps réel sur la santé administrative et sportive de l'association.
          </p>

          <div class="box-benefit">
            <div class="box-benefit-title">🎯 Bénéfice Commercial Dirigeant</div>
            <div class="box-benefit-text">
              Fini les incertitudes du week-end. Le président sait exactement quelles équipes jouent, qui est convoqué et quelles tâches urgentes doivent être réglées.
            </div>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-bullet">1</div>
              <div>
                <div class="feature-item-title">Accueil & Cockpit Exécutif (ClubHomeScreen)</div>
                <div class="feature-item-desc">Vue d'ensemble du nombre de licenciés, des équipes engagées, des alertes de cotisations non réglées et de l'assistant Copilote IA Club.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet">2</div>
              <div>
                <div class="feature-item-title">Gestion des Équipes & Structure (ClubTeamsScreen)</div>
                <div class="feature-item-desc">Configuration des catégories d'âge (U9 à Séniors), attribution des maillots et affectation des entraîneurs à chaque groupe.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup Phone UI -->
        <div class="mockup-container">
          <div class="mockup-screen">
            <div class="mockup-notch"><div class="mockup-notch-pill"></div></div>
            <div class="mockup-body">
              <div class="mockup-header">
                <div>
                  <div class="mockup-title">FC Nanterre 92</div>
                  <div class="mockup-sub">Pôle Club · Cockpit Dirigeant</div>
                </div>
                <div class="mockup-pill">ACTIF</div>
              </div>

              <div class="mockup-card-accent">
                <div style="font-size: 9px; font-weight: 800; color: #38BDF8; margin-bottom: 4px;">MATCH PHARE DU WEEK-END</div>
                <div style="font-size: 11px; font-weight: 900;">Séniors R1 vs AC Boulogne</div>
                <div style="font-size: 8px; color: #94A3B8; margin-top: 2px;">Dimanche 15h00 · Stade Gabriel Péri</div>
                <div style="margin-top: 6px; font-size: 8px; color: #10B981; font-weight: 700;">14 / 16 Convocations confirmées</div>
              </div>

              <div class="mockup-grid">
                <div class="mockup-card">
                  <div class="mockup-stat-num">342</div>
                  <div class="mockup-stat-lbl">Licenciés</div>
                </div>
                <div class="mockup-card">
                  <div class="mockup-stat-num">14</div>
                  <div class="mockup-stat-lbl">Équipes</div>
                </div>
              </div>

              <div class="mockup-card">
                <div style="font-size: 8px; font-weight: 800; color: #F59E0B; margin-bottom: 4px;">⚠️ ACTIONS PRIORITAIRES</div>
                <div class="mockup-list-item">
                  <div class="mockup-avatar" style="background: #F59E0B;">!</div>
                  <div>
                    <div class="mockup-row-title">2 équipes sans coach</div>
                    <div class="mockup-row-sub">U13B et U15C à attribuer</div>
                  </div>
                </div>
                <div class="mockup-list-item" style="border: none;">
                  <div class="mockup-avatar" style="background: #10B981;">✓</div>
                  <div>
                    <div class="mockup-row-title">Cotisations U17</div>
                    <div class="mockup-row-sub">85 % validées</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mockup-dock">
              <div class="mockup-dock-icon active"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Pôle Club</span>
      <span>Page 3 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 4 : PÔLE CLUB (LICENCIÉS, MATCHS, RECRUTEMENT) ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="badge-pole badge-club">🏛️ PÔLE CLUB — ADMINISTRATION</div>
    </div>

    <div class="page-body">
      <div class="feature-layout">
        <div class="feature-info">
          <div class="page-tag">PAGE 3 À 6 · GESTION OPÉRATIONNELLE</div>
          <h2 class="page-title">Licenciés, Matchs & Planning Général</h2>
          <p class="page-subtitle">
            Simplification intégrale des tâches administratives : contrôle des adhésions, centralisation des matchs du club et attribution des créneaux de terrains.
          </p>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-bullet">3</div>
              <div>
                <div class="feature-item-title">Annuaire des Licenciés (ClubPlayersScreen)</div>
                <div class="feature-item-desc">Gestion des fiches joueurs, validation des inscriptions et suivi des passeports sportifs.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet">4</div>
              <div>
                <div class="feature-item-title">Centralisateur des Matchs (ClubMatchesScreen)</div>
                <div class="feature-item-desc">Vue globale de toutes les rencontres du week-end (domicile / extérieur) avec résultats en direct.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet">5</div>
              <div>
                <div class="feature-item-title">Planning des Terrains & Entraînements (ClubTrainingsScreen)</div>
                <div class="feature-item-desc">Répartition intelligente des créneaux de terrain pour éviter les conflits d'utilisation.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup Phone UI -->
        <div class="mockup-container">
          <div class="mockup-screen">
            <div class="mockup-notch"><div class="mockup-notch-pill"></div></div>
            <div class="mockup-body">
              <div class="mockup-header">
                <div>
                  <div class="mockup-title">Annuaire Licenciés</div>
                  <div class="mockup-sub">342 Joueurs inscrits</div>
                </div>
                <div class="mockup-pill" style="background: #10B981;">FILTRÉ</div>
              </div>

              <div class="mockup-card">
                <div class="mockup-list-item">
                  <div class="mockup-avatar">YD</div>
                  <div>
                    <div class="mockup-row-title">Yanis Diallo (U17 R1)</div>
                    <div class="mockup-row-sub">Attaquant · Cotisation OK</div>
                  </div>
                </div>
                <div class="mockup-list-item">
                  <div class="mockup-avatar">MB</div>
                  <div>
                    <div class="mockup-row-title">Mathieu Benali (U15)</div>
                    <div class="mockup-row-sub">Milieu · Dossier médical OK</div>
                  </div>
                </div>
                <div class="mockup-list-item" style="border: none;">
                  <div class="mockup-avatar">LC</div>
                  <div>
                    <div class="mockup-row-title">Lucas Camara (Séniors)</div>
                    <div class="mockup-row-sub">Défenseur · Licence validée</div>
                  </div>
                </div>
              </div>

              <div class="mockup-card-accent">
                <div style="font-size: 9px; font-weight: 800; color: #38BDF8;">PLANNING TERRAIN 1</div>
                <div style="font-size: 10px; font-weight: 700; margin-top: 2px;">18h00 - 19h30 : U15 R2</div>
                <div style="font-size: 10px; font-weight: 700;">19h30 - 21h00 : Séniors R1</div>
              </div>
            </div>
            <div class="mockup-dock">
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon active"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Pôle Club</span>
      <span>Page 4 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 5 : PÔLE COACH (COCKPIT & ENTRAÎNEMENT) ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="badge-pole badge-coach">📋 PÔLE COACH — TERRAIN</div>
    </div>

    <div class="page-body">
      <div class="feature-layout">
        <div class="feature-info">
          <div class="page-tag">PAGE 11 & 12 · QUOTIDIEN DE L’ÉDUCATEUR</div>
          <h2 class="page-title">Cockpit Coach & Hub Entraînements</h2>
          <p class="page-subtitle">
            Le Pôle Coach est conçu pour libérer l'éducateur des contraintes administratives afin qu'il se concentre à 100 % sur la pédagogie et le terrain.
          </p>

          <div class="box-benefit">
            <div class="box-benefit-title">🎯 Bénéfice Commercial Coach</div>
            <div class="box-benefit-text">
              Météo des présences automatisée : l'entraîneur sait avant d'arriver au stade combien de joueurs seront présents à la séance.
            </div>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-bullet">1</div>
              <div>
                <div class="feature-item-title">Cockpit du Coach (CoachPortalScreen)</div>
                <div class="feature-item-desc">Tableau de bord quotidien : prochaine séance, alertes de santé des joueurs et statistiques de présence.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet">2</div>
              <div>
                <div class="feature-item-title">Hub Entraînements (CoachTrainingEventHub)</div>
                <div class="feature-item-desc">Préparation des fiches de séances, bibliothèque d'exercices tactiques et émargement digital sur le terrain.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup Phone UI -->
        <div class="mockup-container">
          <div class="mockup-screen">
            <div class="mockup-notch"><div class="mockup-notch-pill"></div></div>
            <div class="mockup-body">
              <div class="mockup-header">
                <div>
                  <div class="mockup-title">Cockpit Coach</div>
                  <div class="mockup-sub">Coach Marc · U17 R1</div>
                </div>
                <div class="mockup-pill" style="background: #3B82F6;">SÉANCE DU SOIR</div>
              </div>

              <div class="mockup-card-accent">
                <div style="font-size: 9px; font-weight: 800; color: #93C5FD;">SÉANCE 19H00 · TERRAIN 2</div>
                <div style="font-size: 12px; font-weight: 900;">Conservation & Transition</div>
                <div style="font-size: 8px; color: #94A3B8; margin-top: 4px;">18 Présents · 2 Absents justifiés</div>
              </div>

              <div class="mockup-card">
                <div style="font-size: 8px; font-weight: 800; color: #38BDF8; margin-bottom: 4px;">EXERCICES DU SOIR</div>
                <div class="mockup-list-item">
                  <div class="mockup-avatar" style="background: #3B82F6;">1</div>
                  <div>
                    <div class="mockup-row-title">Toros 5v2 sous pression</div>
                    <div class="mockup-row-sub">15 min · Échauffement technique</div>
                  </div>
                </div>
                <div class="mockup-list-item" style="border: none;">
                  <div class="mockup-avatar" style="background: #3B82F6;">2</div>
                  <div>
                    <div class="mockup-row-title">Jeu réduit 7v7 + appuis</div>
                    <div class="mockup-row-sub">30 min · Recherche du 3e homme</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mockup-dock">
              <div class="mockup-dock-icon active"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Pôle Coach</span>
      <span>Page 5 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 6 : PÔLE COACH (MATCH CENTER & IA) ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="badge-pole badge-coach">📋 PÔLE COACH — JOUR DE MATCH</div>
    </div>

    <div class="page-body">
      <div class="feature-layout">
        <div class="feature-info">
          <div class="page-tag">PAGE 13 & 16 · GESTION DE MATCH</div>
          <h2 class="page-title">Match Center & Copilote Tactique IA</h2>
          <p class="page-subtitle">
            Le Match Center accompagne le coach pendant toute la journée de compétition : de la feuille de convocation à la saisie live du banc de touche.
          </p>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-bullet">3</div>
              <div>
                <div class="feature-item-title">Match Center & Composition (CoachMatchEventHub)</div>
                <div class="feature-item-desc">Tableau noir interactif pour la composition du 11 de départ et saisie live des buts, cartons et remplacements.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet">4</div>
              <div>
                <div class="feature-item-title">Analyse Vidéo & Copilote IA (SmartTacticsPortalScreen)</div>
                <div class="feature-item-desc">Conseils d'ajustements tactiques générés par IA et découpage des séquences vidéo de match.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup Phone UI -->
        <div class="mockup-container">
          <div class="mockup-screen">
            <div class="mockup-notch"><div class="mockup-notch-pill"></div></div>
            <div class="mockup-body">
              <div class="mockup-header">
                <div>
                  <div class="mockup-title">Match Center Live</div>
                  <div class="mockup-sub">U17 R1 · Dimanche 15h</div>
                </div>
                <div class="mockup-pill" style="background: #EF4444;">EN DIRECT</div>
              </div>

              <div class="mockup-card-accent" style="text-align: center;">
                <div style="font-size: 9px; color: #94A3B8;">CHAMPIONNAT R1</div>
                <div style="font-size: 18px; font-weight: 900; margin: 2px 0;">FC Nanterre 2 - 1 ACBB</div>
                <div style="font-size: 8px; color: #10B981;">68' · But Y. Diallo (54')</div>
              </div>

              <div class="mockup-card">
                <div style="font-size: 8px; font-weight: 800; color: #38BDF8; margin-bottom: 4px;">COMPOSITION 4-3-3</div>
                <div class="mockup-list-item">
                  <div class="mockup-avatar" style="background: #10B981;">GK</div>
                  <div class="mockup-row-title">1. Thomas V.</div>
                </div>
                <div class="mockup-list-item">
                  <div class="mockup-avatar" style="background: #3B82F6;">DEF</div>
                  <div class="mockup-row-title">4. Lucas C. (C)</div>
                </div>
                <div class="mockup-list-item" style="border: none;">
                  <div class="mockup-avatar" style="background: #EF4444;">ATT</div>
                  <div class="mockup-row-title">9. Yanis D. ⚽</div>
                </div>
              </div>
            </div>
            <div class="mockup-dock">
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon active"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Pôle Coach</span>
      <span>Page 6 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 7 : PÔLE JOUEUR (DASHBOARD & CARTE OVR) ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="badge-pole badge-joueur">⚽ PÔLE JOUEUR — ATHLÈTE</div>
    </div>

    <div class="page-body">
      <div class="feature-layout">
        <div class="feature-info">
          <div class="page-tag">PAGE 17 & 19 · EXPÉRIENCE JOUEUR</div>
          <h2 class="page-title">Dashboard & Carte Statistiques OVR</h2>
          <p class="page-subtitle">
            Le Pôle Joueur transforme l'expérience sportive en valorisant les performances de l'athlète grâce à une carte de statistiques dynamique et une gamification engageante.
          </p>

          <div class="box-benefit">
            <div class="box-benefit-title">🎯 Bénéfice Commercial Rétention</div>
            <div class="box-benefit-text">
              Les jeunes joueurs adorent suivre leur progression OVR. Cela augmente l'engagement et l'assiduité aux entraînements du club.
            </div>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-bullet">1</div>
              <div>
                <div class="feature-item-title">Dashboard & Carte OVR (HomeScreen)</div>
                <div class="feature-item-desc">Affichage de la carte joueur (Note Globale OVR, XP), du prochain match et des raccourcis de la communauté.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet">2</div>
              <div>
                <div class="feature-item-title">CV Sportif Digital (PlayerCvEditorScreen)</div>
                <div class="feature-item-desc">Passeport numérique du joueur regroupant ses statistiques de carrière, ses clubs passés et ses faits d'armes.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup Phone UI -->
        <div class="mockup-container">
          <div class="mockup-screen">
            <div class="mockup-notch"><div class="mockup-notch-pill"></div></div>
            <div class="mockup-body">
              <div class="mockup-header">
                <div>
                  <div class="mockup-title">Yanis Diallo</div>
                  <div class="mockup-sub">U17 R1 · FC Nanterre</div>
                </div>
                <div class="mockup-pill" style="background: #F59E0B;">NIVEAU 12</div>
              </div>

              <!-- Fut Card Style -->
              <div class="mockup-card-accent" style="background: linear-gradient(135deg, #78350F 0%, #451A03 100%); border-color: #F59E0B; text-align: center;">
                <div style="font-size: 26px; font-weight: 900; color: #FDE047;">84 <span style="font-size: 13px;">OVR</span></div>
                <div style="font-size: 10px; font-weight: 800; color: #FFF; text-transform: uppercase;">ATTAQUANT DE POINTE</div>
                <div class="mockup-grid" style="margin-top: 6px;">
                  <div style="font-size: 8px; color: #FEF08A;">VIT 88</div>
                  <div style="font-size: 8px; color: #FEF08A;">TIR 85</div>
                  <div style="font-size: 8px; color: #FEF08A;">PAS 78</div>
                  <div style="font-size: 8px; color: #FEF08A;">DRI 82</div>
                </div>
              </div>

              <div class="mockup-card">
                <div style="font-size: 8px; font-weight: 800; color: #F59E0B; margin-bottom: 4px;">STATS DE SAISON</div>
                <div class="mockup-grid">
                  <div>
                    <div class="mockup-stat-num" style="color: #F59E0B;">14</div>
                    <div class="mockup-stat-lbl">Buts</div>
                  </div>
                  <div>
                    <div class="mockup-stat-num" style="color: #F59E0B;">6</div>
                    <div class="mockup-stat-lbl">Passes D.</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mockup-dock">
              <div class="mockup-dock-icon active"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Pôle Joueur</span>
      <span>Page 7 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 8 : PÔLE JOUEUR (CHECK-IN FORME & SAISON) ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="badge-pole badge-joueur">⚽ PÔLE JOUEUR — FORME & SANTÉ</div>
    </div>

    <div class="page-body">
      <div class="feature-layout">
        <div class="feature-info">
          <div class="page-tag">PAGE 18 · PRÉPARATION ATHLÉTIQUE</div>
          <h2 class="page-title">Check-in de Forme Quotidien & Saison</h2>
          <p class="page-subtitle">
            Responsabilisation du jeune athlète dans sa préparation et son hygiène de vie grâce à un suivi simple et quotidien de ses constantes de forme.
          </p>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-bullet">3</div>
              <div>
                <div class="feature-item-title">Check-in de Forme (PlayerSaisonScreen)</div>
                <div class="feature-item-desc">Évaluation quotidienne des 5 piliers : Sommeil, Énergie, Douleurs musculaires, Hydratation et Étirements.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet">4</div>
              <div>
                <div class="feature-item-title">Routines de Récupération</div>
                <div class="feature-item-desc">Conseils automatisés et quêtes quotidiennes rapportant de l'XP pour stimuler les bonnes habitudes.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup Phone UI -->
        <div class="mockup-container">
          <div class="mockup-screen">
            <div class="mockup-notch"><div class="mockup-notch-pill"></div></div>
            <div class="mockup-body">
              <div class="mockup-header">
                <div>
                  <div class="mockup-title">Check-in Forme</div>
                  <div class="mockup-sub">Lundi 7 Septembre</div>
                </div>
                <div class="mockup-pill" style="background: #10B981;">FORME 85%</div>
              </div>

              <div class="mockup-card">
                <div class="mockup-list-item">
                  <div class="mockup-avatar" style="background: #6366F1;">🌙</div>
                  <div style="flex: 1;">
                    <div class="mockup-row-title">Sommeil : 8h30</div>
                    <div class="mockup-row-sub">Récupération optimale</div>
                  </div>
                </div>
                <div class="mockup-list-item">
                  <div class="mockup-avatar" style="background: #F59E0B;">⚡</div>
                  <div style="flex: 1;">
                    <div class="mockup-row-title">Énergie : 4/5</div>
                    <div class="mockup-row-sub">Bonne dynamique</div>
                  </div>
                </div>
                <div class="mockup-list-item" style="border: none;">
                  <div class="mockup-avatar" style="background: #10B981;">💧</div>
                  <div style="flex: 1;">
                    <div class="mockup-row-title">Hydratation : 2.5L</div>
                    <div class="mockup-row-sub">Objectif atteint</div>
                  </div>
                </div>
              </div>

              <div class="mockup-card-accent" style="background: rgba(16, 185, 129, 0.15); border-color: #10B981;">
                <div style="font-size: 8px; font-weight: 800; color: #10B981;">CONSEIL RÉCUPÉRATION</div>
                <div style="font-size: 9px; color: #FFF; margin-top: 2px;">Pense à faire 10 min d'étirements des ischio-jambiers ce soir.</div>
              </div>
            </div>
            <div class="mockup-dock">
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon active"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Pôle Joueur</span>
      <span>Page 8 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 9 : SERVICES TRANSVERSAUX (COVOITURAGE & SANTÉ) ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="header-badge">SERVICES EXCLUSIFS PRODAY</div>
    </div>

    <div class="page-body">
      <div class="feature-layout">
        <div class="feature-info">
          <div class="page-tag">SERVICES TRANSVERSAUX</div>
          <h2 class="page-title">Covoiturage Terrain & Pôle Santé Pro</h2>
          <p class="page-subtitle">
            Deux fonctionnalités exclusives absentes des autres applications sportives pour résoudre la logistique et préserver la santé des licenciés.
          </p>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-bullet" style="background: rgba(2, 132, 199, 0.2); color: #0284C7;">🚗</div>
              <div>
                <div class="feature-item-title">Covoiturage « Aller au match ensemble » (CarpoolScreen)</div>
                <div class="feature-item-desc">Mise en relation directe entre parents et conducteurs, directement liée à la carte du match avec suivi géolocalisé en direct pendant le trajet.</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-bullet" style="background: rgba(239, 68, 68, 0.2); color: #EF4444;">🏥</div>
              <div>
                <div class="feature-item-title">Pôle Santé & Téléconsultation HD (Santé Pro)</div>
                <div class="feature-item-desc">Annuaire vérifié de praticiens du sport (kinés, ostéos, médecins) et consultation vidéo HD sécurisée.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup Phone UI -->
        <div class="mockup-container">
          <div class="mockup-screen">
            <div class="mockup-notch"><div class="mockup-notch-pill"></div></div>
            <div class="mockup-body">
              <div class="mockup-header">
                <div>
                  <div class="mockup-title">Covoiturage Match</div>
                  <div class="mockup-sub">ACBB vs FC Nanterre</div>
                </div>
                <div class="mockup-pill" style="background: #0284C7;">3 PLACES</div>
              </div>

              <div class="mockup-card-accent" style="background: linear-gradient(135deg, #0369A1 0%, #0F172A 100%);">
                <div style="font-size: 8px; color: #7DD3FC;">CONDUCTEUR CONFIRMÉ</div>
                <div style="font-size: 11px; font-weight: 900;">Marc V. (Parent U17)</div>
                <div style="font-size: 8px; color: #E0F2FE; margin-top: 2px;">Départ : 13h45 de Nanterre RER</div>
              </div>

              <div class="mockup-card">
                <div style="font-size: 8px; font-weight: 800; color: #EF4444; margin-bottom: 4px;">SANTÉ & PRATICIENS</div>
                <div class="mockup-list-item" style="border: none;">
                  <div class="mockup-avatar" style="background: #EF4444;">Dr</div>
                  <div>
                    <div class="mockup-row-title">Dr. Martin (Kiné du sport)</div>
                    <div class="mockup-row-sub">Téléconsultation dispo demain</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mockup-dock">
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon"></div>
              <div class="mockup-dock-icon active"></div>
              <div class="mockup-dock-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Services Transversaux</span>
      <span>Page 9 sur 10</span>
    </div>
  </div>

  <!-- ==================== PAGE 10 : SYNTHÈSE & DÉPLOIEMENT DISTRICT 92 ==================== -->
  <div class="pdf-page">
    <div class="header-bar">
      <img src="{logo_horizontal_white}" alt="ProDay" />
      <div class="header-badge">ACCOMPAGNEMENT DISTRICT 92</div>
    </div>

    <div class="page-body">
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 22px; font-weight: 900; color: #FFF; margin-bottom: 6px;">Plan de Déploiement pour les Clubs du District 92</h2>
        <p style="font-size: 12px; color: #94A3B8; line-height: 1.55;">
          ProDay propose un accompagnement sur-mesure pour réussir la transition numérique des clubs des Hauts-de-Seine sans contrainte technique pour les bénévoles.
        </p>
      </div>

      <div class="features-list" style="gap: 10px;">
        <div class="feature-item" style="padding: 12px;">
          <div class="feature-bullet" style="background: #10B981; color: #FFF;">1</div>
          <div>
            <div class="feature-item-title" style="font-size: 12px;">Webinaires & Formations Dédiées</div>
            <div class="feature-item-desc" style="font-size: 11px;">Sessions de présentation en visioconférence pour les secrétaires et directeurs sportifs du 92 afin de prendre en main l'outil en moins de 30 minutes.</div>
          </div>
        </div>

        <div class="feature-item" style="padding: 12px;">
          <div class="feature-bullet" style="background: #3B82F6; color: #FFF;">2</div>
          <div>
            <div class="feature-item-title" style="font-size: 12px;">Kits de Communication Clé en Main</div>
            <div class="feature-item-desc" style="font-size: 11px;">Affiches pour les buvettes, visuels pour réseaux sociaux et guides d'installation pour les parents et licenciés.</div>
          </div>
        </div>

        <div class="feature-item" style="padding: 12px;">
          <div class="feature-bullet" style="background: #F59E0B; color: #FFF;">3</div>
          <div>
            <div class="feature-item-title" style="font-size: 12px;">Support Technique Prioritaire</div>
            <div class="feature-item-desc" style="font-size: 11px;">Assistance réactive 7j/7 pour accompagner les dirigeants lors des rendez-vous clés du week-end.</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 24px; background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%); border: 1px solid #312E81; border-radius: 16px; padding: 20px; text-align: center;">
        <h3 style="font-size: 16px; font-weight: 900; color: #FFF; margin-bottom: 4px;">Prêt à Moderniser le Football dans le District 92 ?</h3>
        <p style="font-size: 11px; color: #94A3B8; margin-bottom: 14px;">
          Contactez l'équipe ProDay pour planifier une démonstration personnalisée ou lancer la phase pilote.
        </p>
        <div style="display: inline-block; background: #0284C7; color: #FFF; font-weight: 800; font-size: 11px; padding: 8px 20px; border-radius: 20px;">
          proday75.fr · contact@proday75.fr
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>ProDay × District 92 — Partenariat Officiel</span>
      <span>Page 10 sur 10</span>
    </div>
  </div>

</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML révisé avec succès : {HTML_PATH}")

# Command pour imprimer le PDF via Chrome sans header/footer
cmd = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    f"--user-data-dir=/tmp/chrome_pdf_user_data_{os.getpid()}",
    f"--print-to-pdf={PDF_PATH}",
    "--no-pdf-header-footer",
    HTML_PATH
]

print("Génération du fichier PDF final...")
result = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(PDF_PATH) and os.path.getsize(PDF_PATH) > 0:
    print(f"✅ PDF final créé avec succès : {PDF_PATH}")
    print(f"Taille du fichier : {os.path.getsize(PDF_PATH)} octets")
else:
    print("❌ Erreur lors de la création du PDF :", result.stderr)
    sys.exit(1)

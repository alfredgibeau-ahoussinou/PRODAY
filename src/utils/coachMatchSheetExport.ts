import { Platform, Share } from 'react-native';
import type { TeamEvent, EventLineupSlot } from '../models/TeamEvent';
import type { User } from '../models/User';
import type { MatchTalkBrief, SetPieceTakers, TacticalPhaseInstructions } from '../models/MatchTalkBrief';

export interface MatchSheetLineupInput {
  starterUids: string[];
  subUids: string[];
}

export interface ResolvedPlayer {
  uid: string;
  name: string;
  number: number;
  position: string;
  isCaptain?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMatchDate(date: Date | string | undefined): { dateStr: string; timeStr: string } {
  if (!date) return { dateStr: 'Date à définir', timeStr: '--:--' };
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return { dateStr: 'Date à définir', timeStr: '--:--' };

  const dateStr = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}h${minutes}`;

  return { dateStr: capitalizedDate, timeStr };
}

function resolvePlayer(
  uid: string,
  membersMap: Map<string, User>,
  slotsMap: Map<string, EventLineupSlot>,
  defaultIndex: number,
  isStarter: boolean,
): ResolvedPlayer {
  const member = membersMap.get(uid);
  const slot = slotsMap.get(uid);

  const name = member?.display_name || slot?.display_name || `Joueur ${defaultIndex + 1}`;
  const defaultNumber = isStarter ? defaultIndex + 1 : 12 + defaultIndex;
  const number = member?.profile?.jersey_number ?? defaultNumber;
  const position = slot?.position_label || member?.profile?.position || (isStarter ? 'Titulaire' : 'Remplaçant');

  return { uid, name, number, position };
}

/**
 * Détermine les équipes Domicile et Extérieur à partir de l'événement et de la causerie.
 */
function resolveMatchTeams(
  event: TeamEvent,
  talkBrief?: MatchTalkBrief,
): { homeTeam: string; awayTeam: string; isHome: boolean } {
  const clubName = event.club_name || 'ProDay FC';
  const liveState = event.live_state;

  if (liveState?.home_label && liveState?.opponent_name) {
    return {
      homeTeam: liveState.home_label,
      awayTeam: liveState.opponent_name,
      isHome: true,
    };
  }

  // Vérifier le titre de l'événement (ex: "PSG vs OM" ou "Club A - Club B")
  if (event.title.includes(' vs ') || event.title.includes(' VS ')) {
    const parts = event.title.split(/ vs /i);
    return {
      homeTeam: parts[0].trim(),
      awayTeam: parts[1]?.trim() || 'Adversaire',
      isHome: true,
    };
  }
  if (event.title.includes(' - ')) {
    const parts = event.title.split(' - ');
    return {
      homeTeam: parts[0].trim(),
      awayTeam: parts[1]?.trim() || 'Adversaire',
      isHome: true,
    };
  }

  const opponent = talkBrief?.opponent_notes?.trim() || liveState?.opponent_name || 'Adversaire';
  return {
    homeTeam: clubName,
    awayTeam: opponent,
    isHome: true,
  };
}

/**
 * Déduit la compétition à partir des informations de l'événement.
 */
function resolveCompetitionLabel(event: TeamEvent): string {
  if (event.competition_fixture_id) return 'Championnat Officiel';
  if (event.tournament_id) return 'Tournoi Officiel';
  if (event.friendly_match_id || event.event_type === 'friendly') return 'Match Amical';
  if (event.categories && event.categories.length > 0) {
    return `Compétition ${event.categories.join(' / ')}`;
  }
  return 'Rencontre Officielle';
}

export interface MatchSheetExportOptions {
  isDraft?: boolean;
  draftWarning?: string;
}

/**
 * Génère le document HTML A4 soigné et professionnel pour l'impression ou l'export PDF.
 */
export function generateMatchSheetHtml(
  event: TeamEvent,
  lineup: MatchSheetLineupInput,
  members: User[],
  talkBrief?: MatchTalkBrief,
  coachProfile?: User,
  options?: MatchSheetExportOptions,
): string {
  const membersMap = new Map(members.map((m) => [m.uid, m]));
  const slotsMap = new Map((event.lineup?.slots || []).map((s) => [s.uid, s]));

  const starters: ResolvedPlayer[] = lineup.starterUids.map((uid, idx) =>
    resolvePlayer(uid, membersMap, slotsMap, idx, true),
  );

  const subs: ResolvedPlayer[] = lineup.subUids.map((uid, idx) =>
    resolvePlayer(uid, membersMap, slotsMap, idx, false),
  );

  const { dateStr, timeStr } = formatMatchDate(event.starts_at);
  const { homeTeam, awayTeam } = resolveMatchTeams(event, talkBrief);
  const competition = resolveCompetitionLabel(event);
  const venue = event.location_label || event.location || (event.city ? `Stade de ${event.city}` : 'Terrain principal');
  const formation = talkBrief?.formation || event.lineup?.formation || '4-3-3';

  // 3 Objectifs prioritaires de la causerie
  const rawObjectives = [
    ...(talkBrief?.key_points || []),
    ...(talkBrief?.match_objective ? [talkBrief.match_objective] : []),
  ].filter(Boolean);

  const keyObjectives = rawObjectives.length >= 3
    ? rawObjectives.slice(0, 3)
    : [
        rawObjectives[0] || 'Intensité & pressing coordonné dès la perte du ballon',
        rawObjectives[1] || 'Jeu en largeur et verticalité rapide vers nos attaquants',
        rawObjectives[2] || 'Communication constante et compacité du bloc équipe',
      ];

  // Consignes spécifiques par phase
  const attackInstructions = talkBrief?.phase_instructions?.attack && talkBrief.phase_instructions.attack.length > 0
    ? talkBrief.phase_instructions.attack
    : [
        'Écarter les lignes et occuper la largeur dès la récupération',
        'Appuis-soutiens rapides et percussion dans les 30 derniers mètres',
        'Centres au premier poteau et présence massive au second poteau',
      ];

  const defenseInstructions = talkBrief?.phase_instructions?.defense && talkBrief.phase_instructions.defense.length > 0
    ? talkBrief.phase_instructions.defense
    : [
        'Bloc médian compact : 25 mètres maximum entre la ligne arrière et les attaquants',
        'Cadrer le porteur immédiatement sans se jeter, couvrir les intervalles',
        'Gestion agressive des seconds ballons sur dégagement adverse',
      ];

  // Tireurs désignés pour les coups de pied arrêtés
  const setPieces: SetPieceTakers = talkBrief?.set_pieces || {
    penalties: starters[0] ? [`${starters[0].name} (N°${starters[0].number})`, starters[1] ? `${starters[1].name} (N°${starters[1].number})` : 'Tireur 2'] : ['Tireur désigné'],
    corners_left: starters[2] ? [`${starters[2].name} (N°${starters[2].number})`] : ['Pied droit rentrant'],
    corners_right: starters[3] ? [`${starters[3].name} (N°${starters[3].number})`] : ['Pied gauche rentrant'],
    free_kicks_direct: starters[0] ? [`${starters[0].name} (Axe)`, starters[2] ? `${starters[2].name} (Côtés)` : 'Tireur axe'] : ['Tireur direct'],
    first_post_roles: starters[4] ? [`${starters[4].name} (Coupe au 1er poteau)`] : ['Coupe au premier poteau'],
  };

  // Staff encadrant & contacts
  const coachName = coachProfile?.display_name || event.organizer_name || 'Coach Principal';
  const coachPhone = coachProfile?.phone || '06 00 00 00 00';
  const coachDiploma = coachProfile?.profile?.diploma || 'Entraîneur Certifié';
  const coachEmail = coachProfile?.email || '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Feuille de Match A4 • ${escapeHtml(homeTeam)} vs ${escapeHtml(awayTeam)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0F172A;
      background-color: #FFFFFF;
      font-size: 11px;
      line-height: 1.35;
    }
    /* En-tête officiel */
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      background: #0B132B;
      color: #FFFFFF;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
      border-left: 5px solid #00F59B;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-svg {
      width: 38px;
      height: 38px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #FFFFFF;
      margin: 0;
      line-height: 1.1;
    }
    .brand-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #00F59B;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .match-meta-grid {
      display: flex;
      gap: 20px;
      align-items: center;
      text-align: right;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .meta-val {
      font-size: 12px;
      font-weight: 800;
      color: #F8FAFC;
      margin-top: 1px;
    }

    /* Affiche du Match */
    .matchup-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 10px 18px;
      margin-bottom: 12px;
    }
    .team-box {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .team-box.away {
      text-align: right;
    }
    .team-role {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.08em;
    }
    .team-name {
      font-size: 18px;
      font-weight: 900;
      color: #0F172A;
      margin-top: 2px;
    }
    .versus-badge {
      padding: 4px 12px;
      background: #0B132B;
      color: #00F59B;
      font-weight: 900;
      font-size: 12px;
      border-radius: 20px;
      margin: 0 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .formation-pill {
      background: #0284C7;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 6px;
      align-self: center;
      margin-left: 12px;
    }

    /* Grille principale : Composition vs Causerie */
    .main-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      background: #FFFFFF;
      overflow: hidden;
    }
    .card-header {
      background: #0F172A;
      color: #FFFFFF;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header .badge {
      background: #00F59B;
      color: #0F172A;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .card-body {
      padding: 8px 10px;
    }

    /* Tableaux joueurs */
    table.lineup-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    table.lineup-table th {
      text-align: left;
      padding: 4px 6px;
      background: #F8FAFC;
      color: #475569;
      font-weight: 800;
      font-size: 9px;
      text-transform: uppercase;
      border-bottom: 1px solid #CBD5E1;
    }
    table.lineup-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #F1F5F9;
      vertical-align: middle;
    }
    table.lineup-table tr:last-child td {
      border-bottom: none;
    }
    .num-tag {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      background: #0F172A;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 10px;
      border-radius: 4px;
    }
    .pos-tag {
      font-size: 9.5px;
      font-weight: 700;
      color: #0284C7;
      background: #E0F2FE;
      padding: 1px 5px;
      border-radius: 3px;
    }

    /* Section Causerie */
    .objective-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .objective-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
      background: #F8FAFC;
      border-left: 3px solid #00F59B;
      padding: 5px 8px;
      border-radius: 0 4px 4px 0;
      font-size: 10.5px;
      font-weight: 600;
      color: #1E293B;
    }
    .obj-num {
      background: #0B132B;
      color: #00F59B;
      font-weight: 900;
      font-size: 9px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Phases de jeu */
    .phase-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 6px;
    }
    .phase-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 6px 8px;
    }
    .phase-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .phase-title.attack { color: #0284C7; }
    .phase-title.defense { color: #DC2626; }
    .phase-ul {
      margin: 0;
      padding-left: 14px;
      font-size: 9.5px;
      color: #334155;
    }
    .phase-ul li {
      margin-bottom: 2px;
    }

    /* Coups de pied arrêtés */
    .setpieces-box {
      margin-top: 8px;
      background: #F1F5F9;
      border-radius: 6px;
      padding: 6px 8px;
      border: 1px solid #CBD5E1;
    }
    .setpieces-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .setpieces-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 8px;
      font-size: 9.5px;
    }
    .sp-item strong {
      color: #0F172A;
    }

    /* Footer & Contacts */
    .bottom-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .contact-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 3px;
    }
    .contact-desc {
      font-size: 10px;
      color: #1E293B;
      line-height: 1.4;
    }
    .emergency-badge {
      display: inline-block;
      background: #DC2626;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 8.5px;
      padding: 1px 5px;
      border-radius: 3px;
      margin-right: 4px;
    }
    .footer-stamp {
      text-align: center;
      font-size: 8.5px;
      color: #94A3B8;
      margin-top: 10px;
      border-top: 1px dashed #CBD5E1;
      padding-top: 6px;
    }
  </style>
</head>
<body>

  <!-- En-tête officiel -->
  <header class="sheet-header">
    <div class="brand-section">
      <!-- SVG ProDay -->
      <svg class="brand-logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0F172A"/>
        <path d="M12 28V12H20C23.3 12 25.5 13.8 25.5 17C25.5 20.2 23.3 22 20 22H16.5V28H12Z" fill="#00F59B"/>
        <circle cx="28" cy="26" r="3" fill="#00F59B"/>
      </svg>
      <div>
        <h1 class="brand-title">ProDay Football</h1>
        <div class="brand-subtitle">${options?.isDraft ? 'BROUILLON DE TRAVAIL • NON HOMOLOGUÉ' : 'Feuille de Match &amp; Causerie Vestiaire'}</div>
      </div>
    </div>

    <div class="match-meta-grid">
      <div class="meta-item">
        <span class="meta-label">Compétition</span>
        <span class="meta-val">${escapeHtml(competition)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date &amp; Heure</span>
        <span class="meta-val">${escapeHtml(dateStr)} • ${escapeHtml(timeStr)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Lieu de la Rencontre</span>
        <span class="meta-val">${escapeHtml(venue)}</span>
      </div>
    </div>
  </header>

  ${
    options?.draftWarning
      ? `<div style="background: #FEF2F2; border: 1.5px solid #EF4444; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; color: #991B1B; font-size: 10.5px; font-weight: 700;">
          ⚠️ AVERTISSEMENT DISCIPLINAIRE : ${escapeHtml(options.draftWarning)}
        </div>`
      : ''
  }

  <!-- Bannière Domicile vs Extérieur -->
  <div class="matchup-banner">
    <div class="team-box home">
      <span class="team-role">Équipe Domicile</span>
      <span class="team-name">${escapeHtml(homeTeam)}</span>
    </div>

    <div class="versus-badge">VS</div>

    <div class="team-box away">
      <span class="team-role">Équipe Extérieur</span>
      <span class="team-name">${escapeHtml(awayTeam)}</span>
    </div>

    <div class="formation-pill">Schéma : ${escapeHtml(formation)}</div>
  </div>

  <!-- Corps principal -->
  <div class="main-grid">

    <!-- Colonne 1 : Composition (Titulaires & Remplaçants) -->
    <div style="display: flex; flex-direction: column; gap: 10px;">
      
      <!-- Titulaires -->
      <div class="card">
        <div class="card-header">
          <span>XI Titulaires</span>
          <span class="badge">${starters.length} Joueurs</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="lineup-table">
            <thead>
              <tr>
                <th style="width: 32px; text-align: center;">N°</th>
                <th>Joueur</th>
                <th style="width: 100px;">Poste</th>
              </tr>
            </thead>
            <tbody>
              ${starters.length > 0 ? starters.map((p) => `
                <tr>
                  <td style="text-align: center;"><span class="num-tag">${p.number}</span></td>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td><span class="pos-tag">${escapeHtml(p.position)}</span></td>
                </tr>
              `).join('') : `
                <tr><td colspan="3" style="text-align: center; color: #94A3B8; padding: 12px;">Aucun titulaire assigné</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Remplaçants -->
      <div class="card">
        <div class="card-header">
          <span>Banc des Remplaçants</span>
          <span class="badge">${subs.length} Joueurs</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="lineup-table">
            <thead>
              <tr>
                <th style="width: 32px; text-align: center;">N°</th>
                <th>Joueur</th>
                <th style="width: 100px;">Poste</th>
              </tr>
            </thead>
            <tbody>
              ${subs.length > 0 ? subs.map((p) => `
                <tr>
                  <td style="text-align: center;"><span class="num-tag" style="background: #475569;">${p.number}</span></td>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td><span class="pos-tag" style="background: #F1F5F9; color: #475569;">${escapeHtml(p.position)}</span></td>
                </tr>
              `).join('') : `
                <tr><td colspan="3" style="text-align: center; color: #94A3B8; padding: 8px;">Aucun remplaçant</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Colonne 2 : Causerie Vestiaire & Consignes -->
    <div style="display: flex; flex-direction: column; gap: 10px;">
      
      <div class="card">
        <div class="card-header" style="background: #0284C7;">
          <span>Causerie d'Avant-Match</span>
          <span class="badge" style="background: #FFFFFF; color: #0284C7;">Priorités</span>
        </div>
        <div class="card-body">
          
          <!-- 3 Objectifs prioritaires -->
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0F172A; margin-bottom: 6px;">
            🎯 3 Principes de Jeu Clés
          </div>
          <ul class="objective-list">
            ${keyObjectives.map((obj, i) => `
              <li class="objective-item">
                <span class="obj-num">${i + 1}</span>
                <span>${escapeHtml(obj)}</span>
              </li>
            `).join('')}
          </ul>

          <!-- Phases de Jeu -->
          <div class="phase-grid">
            <div class="phase-box">
              <div class="phase-title attack">⚽ Phase Attaque</div>
              <ul class="phase-ul">
                ${attackInstructions.map((ins) => `<li>${escapeHtml(ins)}</li>`).join('')}
              </ul>
            </div>
            <div class="phase-box">
              <div class="phase-title defense">🛡️ Phase Défense</div>
              <ul class="phase-ul">
                ${defenseInstructions.map((ins) => `<li>${escapeHtml(ins)}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Coups de pied arrêtés -->
          <div class="setpieces-box">
            <div class="setpieces-title">🎯 Coups de Pied Arrêtés</div>
            <div class="setpieces-grid">
              <div class="sp-item">
                <strong>Penaltys :</strong> ${(setPieces.penalties || []).map(escapeHtml).join(', ') || 'N°9'}
              </div>
              <div class="sp-item">
                <strong>C. Francs Directs :</strong> ${(setPieces.free_kicks_direct || []).map(escapeHtml).join(', ') || 'N°10'}
              </div>
              <div class="sp-item">
                <strong>Corners Gauche :</strong> ${(setPieces.corners_left || []).map(escapeHtml).join(', ') || 'Pied droit'}
              </div>
              <div class="sp-item">
                <strong>Corners Droit :</strong> ${(setPieces.corners_right || []).map(escapeHtml).join(', ') || 'Pied gauche'}
              </div>
              <div class="sp-item" style="grid-column: span 2;">
                <strong>1er Poteau / Rôles :</strong> ${(setPieces.first_post_roles || []).map(escapeHtml).join(', ') || 'Coupe au 1er poteau'}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>

  </div>

  <!-- Contacts d'urgence et Staff encadrant -->
  <div class="bottom-section">
    <div>
      <div class="contact-title">Staff Technique &amp; Encadrement</div>
      <div class="contact-desc">
        <strong>Entraîneur Principal :</strong> ${escapeHtml(coachName)} (${escapeHtml(coachDiploma)})<br/>
        <strong>Téléphone :</strong> ${escapeHtml(coachPhone)} ${coachEmail ? `• <strong>Email :</strong> ${escapeHtml(coachEmail)}` : ''}<br/>
        <strong>Club :</strong> ${escapeHtml(event.club_name || 'ProDay FC')}
      </div>
    </div>
    <div>
      <div class="contact-title">Sécurité &amp; Contacts d'Urgence</div>
      <div class="contact-desc">
        <span class="emergency-badge">SAMU 15</span>
        <span class="emergency-badge">POMPIERS 18</span>
        <span class="emergency-badge">URGENCES 112</span><br/>
        <strong>Kiné / Soigneur club :</strong> Contact staff au ${escapeHtml(coachPhone)}<br/>
        <strong>Sécurité :</strong> Défibrillateur (DAE) au complexe • Trousse de secours vestiaire ProDay.
      </div>
    </div>
  </div>

  <div class="footer-stamp">
    Feuille de match officielle générée par ProDay Football • Format A4 d'affichage vestiaire • ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>

</body>
</html>`;
}

/**
 * Fonction d'exportation ou d'impression de la feuille de match :
 * - Web : ouvre la fenêtre d'impression native (A4 PDF ou papier)
 * - Mobile : partage les informations clés du match via le tiroir natif
 */
export async function exportOrPrintMatchSheet(
  event: TeamEvent,
  lineup: MatchSheetLineupInput,
  members: User[],
  talkBrief?: MatchTalkBrief,
  coachProfile?: User,
  options?: MatchSheetExportOptions,
): Promise<void> {
  const html = generateMatchSheetHtml(event, lineup, members, talkBrief, coachProfile, options);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    return;
  }

  // Formatage texte enrichi pour partage mobile
  const membersMap = new Map(members.map((m) => [m.uid, m]));
  const slotsMap = new Map((event.lineup?.slots || []).map((s) => [s.uid, s]));

  const starters = lineup.starterUids.map((uid, idx) =>
    resolvePlayer(uid, membersMap, slotsMap, idx, true),
  );
  const subs = lineup.subUids.map((uid, idx) =>
    resolvePlayer(uid, membersMap, slotsMap, idx, false),
  );

  const { homeTeam, awayTeam } = resolveMatchTeams(event, talkBrief);
  const { dateStr, timeStr } = formatMatchDate(event.starts_at);
  const formation = talkBrief?.formation || event.lineup?.formation || '4-3-3';

  const rawObjectives = [
    ...(talkBrief?.key_points || []),
    ...(talkBrief?.match_objective ? [talkBrief.match_objective] : []),
  ].filter(Boolean);

  const summary = [
    `📋 FEUILLE DE MATCH PRODAY : ${homeTeam} vs ${awayTeam}`,
    `📅 ${dateStr} à ${timeStr}`,
    `📍 ${event.location_label || event.location || event.city || 'Stade'}`,
    `⚡ Schéma tactique : ${formation}`,
    '',
    `🟢 XI TITULAIRES (${starters.length}) :`,
    ...starters.map((p) => `  ${p.number}. ${p.name} (${p.position})`),
    '',
    `🟡 REMPLAÇANTS (${subs.length}) :`,
    ...subs.map((p) => `  ${p.number}. ${p.name} (${p.position})`),
    '',
    `🎯 CONSIGNES CLÉS DU MATCH :`,
    ...(rawObjectives.length > 0 ? rawObjectives.slice(0, 3).map((o, i) => `  ${i + 1}. ${o}`) : ['  1. Intensité & pressing', '  2. Largeur et verticalité', '  3. Bloc compact']),
    '',
    `📞 Contact Coach : ${coachProfile?.display_name || event.organizer_name} (${coachProfile?.phone || 'N/A'})`,
  ].join('\n');

  await Share.share({
    title: `Feuille de match • ${homeTeam} vs ${awayTeam}`,
    message: summary,
  });
}

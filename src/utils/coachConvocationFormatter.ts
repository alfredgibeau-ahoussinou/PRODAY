/**
 * Module de Partage de Convocation Express (WhatsApp, SMS & Presse-papier)
 * Pôle Coach ProDay.
 *
 * Formate des messages prêts à l'envoi pour WhatsApp, SMS et réseaux sociaux,
 * avec regroupement par poste, horaires de rendez-vous calculés, liens Maps cliquables,
 * consignes de paquetage et relances ciblées des retardataires.
 */

import type { TeamEvent } from '../models/TeamEvent';
import { isCoachMatchEvent, getPendingInviteeUids } from '../models/TeamEvent';
import type { User } from '../models/User';

export type PositionLineKind = 'gk' | 'def' | 'mid' | 'att' | 'other';

export interface ConvocationFormatOptions {
  includeLocationLink?: boolean;
  customNote?: string;
  coachContact?: string;
  meetingTimeOverride?: string;
}

export interface GroupedPlayers {
  gk: Array<{ uid: string; name: string; rsvp: string }>;
  def: Array<{ uid: string; name: string; rsvp: string }>;
  mid: Array<{ uid: string; name: string; rsvp: string }>;
  att: Array<{ uid: string; name: string; rsvp: string }>;
  other: Array<{ uid: string; name: string; rsvp: string }>;
}

/**
 * Normalise et catégorise un poste de joueur en l'une des 4 lignes fondamentales
 * (Gardiens, Défenseurs, Milieux, Attaquants) ou 'other'.
 */
export function categorizePlayerPosition(position?: string): PositionLineKind {
  if (!position) return 'other';
  const p = position.toLowerCase().trim();

  // 🧤 Gardiens
  if (
    p.includes('gardien') ||
    p.includes('goal') ||
    p === 'gk' ||
    p === 'g'
  ) {
    return 'gk';
  }

  // ⚙️ Milieux (Vérifié avant 'défens' pour attraper 'milieu défensif')
  if (
    p.includes('milieu') ||
    p.includes('relayeur') ||
    p.includes('meneur') ||
    p.includes('recup') ||
    p.includes('sentinelle') ||
    ['mid', 'mdc', 'mc', 'moc', 'md', 'mg', 'cdm', 'cm', 'cam', 'rm', 'lm'].includes(p)
  ) {
    return 'mid';
  }

  // 🛡️ Défenseurs
  if (
    p.includes('défens') ||
    p.includes('defens') ||
    p.includes('arriere') ||
    p.includes('arrière') ||
    p.includes('latéral') ||
    p.includes('lateral') ||
    p.includes('stoppeur') ||
    p.includes('libero') ||
    ['def', 'dc', 'dg', 'dd', 'dld', 'dlg', 'cb', 'lb', 'rb'].includes(p)
  ) {
    return 'def';
  }

  // ⚡ Attaquants
  if (
    p.includes('attaqu') ||
    p.includes('avant') ||
    p.includes('buteur') ||
    p.includes('pointe') ||
    p.includes('ailier') ||
    ['att', 'bu', 'ac', 'av', 'st', 'cf', 'rw', 'lw'].includes(p)
  ) {
    return 'att';
  }

  return 'other';
}

/**
 * Formate une date en français, ex: "Samedi 24 octobre 2026".
 */
export function formatDateFr(dateInput: Date | string | undefined): string {
  if (!dateInput) return 'Date à définir';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return 'Date à définir';

  const str = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formate une heure en français (HH'h'mm), ex: "15h00".
 */
export function formatTimeFr(dateInput: Date | string | undefined): string {
  if (!dateInput) return '15h00';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '15h00';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}h${minutes}`;
}

/**
 * Calcule l'heure de RDV selon le type d'événement (Match = -1h15, Entraînement = -15 min).
 */
export function computeMeetingTime(event: TeamEvent, override?: string): string {
  if (override?.trim()) {
    return override.trim();
  }

  // Si défini dans le premier créneau covoiturage / logistique
  const slotMeetingTime = event.carpool_slots?.[0]?.meeting_time;
  if (slotMeetingTime?.trim()) {
    return slotMeetingTime.trim();
  }

  const start = event.starts_at instanceof Date ? event.starts_at : new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) {
    return '1 h 15 avant le coup d’envoi';
  }

  const isMatch = isCoachMatchEvent(event);
  // Match : RDV 1h15 (75 min) avant ; Entraînement : RDV 15 min avant
  const deltaMinutes = isMatch ? 75 : 15;
  const meetingDate = new Date(start.getTime() - deltaMinutes * 60_000);

  return formatTimeFr(meetingDate);
}

/**
 * Calcule l'heure de fin estimée de l'événement.
 */
export function computeEndTime(event: TeamEvent): string {
  if (event.ends_at) {
    const end = event.ends_at instanceof Date ? event.ends_at : new Date(event.ends_at);
    if (!Number.isNaN(end.getTime())) {
      return formatTimeFr(end);
    }
  }

  const start = event.starts_at instanceof Date ? event.starts_at : new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) {
    return '17h00';
  }

  const durationMin = event.duration_minutes && event.duration_minutes > 0
    ? event.duration_minutes
    : isCoachMatchEvent(event) ? 105 : 90;

  const calculatedEnd = new Date(start.getTime() + durationMin * 60_000);
  return formatTimeFr(calculatedEnd);
}

/**
 * Construit un lien Google Maps valide et cliquable.
 */
export function buildGoogleMapsLink(location?: string, city?: string): string {
  const parts = [location, city].map((s) => s?.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  const query = encodeURIComponent(parts.join(', '));
  return `https://maps.google.com/?q=${query}`;
}

/**
 * Regroupe les joueurs convoqués par ligne tactique.
 */
export function groupConvocatedPlayers(
  event: TeamEvent,
  members: User[]
): GroupedPlayers {
  const membersMap = new Map<string, User>(members.map((m) => [m.uid, m]));
  const groups: GroupedPlayers = {
    gk: [],
    def: [],
    mid: [],
    att: [],
    other: [],
  };

  const inviteeUids = event.invitee_uids || [];

  for (const uid of inviteeUids) {
    const user = membersMap.get(uid);
    const slot = event.lineup?.slots?.find((s) => s.uid === uid);
    const displayName = user?.display_name || slot?.display_name || `Joueur #${uid.slice(0, 5)}`;
    const rawPos = user?.profile?.position || slot?.position_label;
    const category = categorizePlayerPosition(rawPos);
    const rsvp = event.rsvps?.[uid] || 'pending';

    groups[category].push({
      uid,
      name: displayName,
      rsvp,
    });
  }

  // Tri alphabétique dans chaque ligne
  for (const key of Object.keys(groups) as Array<keyof GroupedPlayers>) {
    groups[key].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }

  return groups;
}

/**
 * Formate un message complet de convocation prêt pour WhatsApp, SMS et réseaux sociaux.
 */
export function formatConvocationMessage(
  event: TeamEvent,
  members: User[],
  options?: ConvocationFormatOptions
): string {
  const isMatch = isCoachMatchEvent(event);
  const isTraining = event.event_type === 'training';
  const clubPrefix = event.club_name ? `🔴🔵 *${event.club_name.toUpperCase()}*\n` : '';

  // 1. Titre
  let titleEmoji = '📅';
  let titleKind = 'ÉVÉNEMENT';
  if (isMatch) {
    titleEmoji = '⚽';
    titleKind = event.live_state?.opponent_name
      ? `MATCH vs ${event.live_state.opponent_name}`
      : `MATCH : ${event.title}`;
  } else if (isTraining) {
    titleEmoji = '🏃';
    titleKind = `ENTRAÎNEMENT : ${event.title}`;
  } else if (event.event_type === 'tournament') {
    titleEmoji = '🏆';
    titleKind = `TOURNOI : ${event.title}`;
  } else if (event.event_type === 'detection') {
    titleEmoji = '🔍';
    titleKind = `DÉTECTION : ${event.title}`;
  } else {
    titleKind = event.title;
  }

  const titleHeader = `${clubPrefix}${titleEmoji} *${titleKind.toUpperCase()}*`;

  // 2. Horaires & Rendez-vous
  const dateStr = formatDateFr(event.starts_at);
  const startTime = formatTimeFr(event.starts_at);
  const meetingTime = computeMeetingTime(event, options?.meetingTimeOverride);
  const endTime = computeEndTime(event);

  const actionKickoffLabel = isMatch ? 'coup d’envoi' : 'début';
  const scheduleBlock = [
    `📅 *Date :* ${dateStr}`,
    `⏰ *Horaires :* RDV à *${meetingTime}* pour ${actionKickoffLabel} à *${startTime}* (Fin : ${endTime})`,
  ];

  // 3. Lieu & Lien Google Maps
  const locLabel = [event.location_label || event.location, event.city]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(', ');

  const locationLines: string[] = [];
  if (locLabel) {
    locationLines.push(`📍 *Lieu :* ${locLabel}`);
    const includeMap = options?.includeLocationLink !== false;
    if (includeMap) {
      const mapsUrl = buildGoogleMapsLink(event.location_label || event.location, event.city);
      if (mapsUrl) {
        locationLines.push(`🗺️ *Itinéraire :* ${mapsUrl}`);
      }
    }
  }

  // 4. Liste ordonnée des joueurs convoqués par ligne
  const groups = groupConvocatedPlayers(event, members);
  const totalConvoques = (event.invitee_uids || []).length;

  const playerLines: string[] = [
    `📋 *JOUEURS CONVOQUÉS (${totalConvoques}) :*`,
  ];

  const hasAnyPosition =
    groups.gk.length > 0 ||
    groups.def.length > 0 ||
    groups.mid.length > 0 ||
    groups.att.length > 0;

  if (hasAnyPosition) {
    if (groups.gk.length > 0) {
      playerLines.push(`\n🧤 *Gardiens (${groups.gk.length}) :*`);
      for (const p of groups.gk) {
        playerLines.push(`  • ${p.name}`);
      }
    }

    if (groups.def.length > 0) {
      playerLines.push(`\n🛡️ *Défenseurs (${groups.def.length}) :*`);
      for (const p of groups.def) {
        playerLines.push(`  • ${p.name}`);
      }
    }

    if (groups.mid.length > 0) {
      playerLines.push(`\n⚙️ *Milieux (${groups.mid.length}) :*`);
      for (const p of groups.mid) {
        playerLines.push(`  • ${p.name}`);
      }
    }

    if (groups.att.length > 0) {
      playerLines.push(`\n⚡ *Attaquants (${groups.att.length}) :*`);
      for (const p of groups.att) {
        playerLines.push(`  • ${p.name}`);
      }
    }

    if (groups.other.length > 0) {
      playerLines.push(`\n👥 *Autres joueurs (${groups.other.length}) :*`);
      for (const p of groups.other) {
        playerLines.push(`  • ${p.name}`);
      }
    }
  } else {
    // Si aucun poste n'est renseigné
    for (const p of groups.other) {
      playerLines.push(`  • ${p.name}`);
    }
  }

  // 5. Statut des réponses & relance des retardataires
  const pendingUids = getPendingInviteeUids(event);
  const membersMap = new Map<string, User>(members.map((m) => [m.uid, m]));
  const rsvpLines: string[] = [];

  if (pendingUids.length > 0) {
    const pendingNames = pendingUids.map((uid) => {
      const u = membersMap.get(uid);
      const slot = event.lineup?.slots?.find((s) => s.uid === uid);
      return u?.display_name || slot?.display_name || `Joueur #${uid.slice(0, 5)}`;
    });
    rsvpLines.push(
      `⏳ *En attente de confirmation (${pendingUids.length}) :*`,
      pendingNames.map((n) => `  • ${n}`).join('\n'),
      `⚠️ *Merci de confirmer votre présence au plus vite sur l'application ProDay !*`
    );
  } else if (totalConvoques > 0) {
    rsvpLines.push(`✅ *Toutes les réponses sont validées !*`);
  }

  // 6. Consignes de paquetage
  const packagingLines = [
    `🎒 *Consignes de paquetage :*`,
    `  • Protège-tibias obligatoires`,
    `  • Gourde d'eau individuelle`,
    isMatch
      ? `  • Maillot / tenue d'échauffement du club\n  • Crampons adaptés au terrain`
      : `  • Tenue d'entraînement du club`,
  ];

  // 7. Mot personnalisé du coach
  const customNoteLines: string[] = [];
  if (options?.customNote?.trim()) {
    customNoteLines.push(
      `📝 *Consigne du Coach :*`,
      `${options.customNote.trim()}`
    );
  }

  // 8. Contact coach
  const coachContactLines: string[] = [];
  if (options?.coachContact?.trim()) {
    coachContactLines.push(`📞 *Contact Staff :* ${options.coachContact.trim()}`);
  }

  // 9. Assemblage propre
  const sections = [
    titleHeader,
    scheduleBlock.join('\n'),
    locationLines.length > 0 ? locationLines.join('\n') : null,
    playerLines.join('\n'),
    rsvpLines.length > 0 ? rsvpLines.join('\n') : null,
    packagingLines.join('\n'),
    customNoteLines.length > 0 ? customNoteLines.join('\n') : null,
    coachContactLines.length > 0 ? coachContactLines.join('\n') : null,
    `📲 _Convocation générée via l'application ProDay_`,
  ].filter(Boolean);

  return sections.join('\n\n');
}

/**
 * Génère un message court et percutant pour relancer uniquement les joueurs
 * n'ayant pas encore répondu (RSVP pending).
 */
export function generatePendingPlayersReminderMessage(
  event: TeamEvent,
  members: User[]
): string {
  const pendingUids = getPendingInviteeUids(event);
  if (pendingUids.length === 0) {
    return `✅ Tous les joueurs convoqués pour "${event.title}" ont déjà répondu !`;
  }

  const membersMap = new Map<string, User>(members.map((m) => [m.uid, m]));
  const pendingNames = pendingUids.map((uid) => {
    const user = membersMap.get(uid);
    const slot = event.lineup?.slots?.find((s) => s.uid === uid);
    return user?.display_name || slot?.display_name || `Joueur #${uid.slice(0, 5)}`;
  });

  const isMatch = isCoachMatchEvent(event);
  const eventKind = isMatch ? 'le match' : "l'entraînement";
  const dateStr = formatDateFr(event.starts_at);
  const timeStr = formatTimeFr(event.starts_at);

  return [
    `🚨 *RAPPEL IMPORTANT — CONVOCATION PRODAY*`,
    ``,
    `Bonjour à tous,`,
    `Pour ${eventKind} *${event.title}* prévu le *${dateStr}* à *${timeStr}*, nous attendons encore la réponse de :`,
    ``,
    ...pendingNames.map((name) => `⏳ ${name}`),
    ``,
    `⚠️ Merci d'indiquer votre présence (OUI / NON) immédiatement sur l'application ProDay pour permettre au coach de finaliser l'effectif.`,
    ``,
    `📲 _Rendez-vous sur ProDay > Mon Calendrier_`,
  ].join('\n');
}

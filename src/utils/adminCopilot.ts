/**
 * Moteur copilote admin — déterministe, templates FR, faits uniquement.
 * Jamais d’invention de chiffres. Donnée absente = phrase honnête.
 */

import { isPlatformAdminEmail } from '../config/admin';
import type { PlatformDailySnapshot } from '../services/admin.service';
import type { AdminWorkItem } from './adminInsights';
import type { AdminNavTarget } from '../navigation/adminNavConfig';

export const ADMIN_COPILOT_MISSING = 'Je n’ai pas cette donnée dans ProDay pour le moment.';
export const ADMIN_COPILOT_INSUFFICIENT_HISTORY =
  'Pas assez d’historique pour un % cette semaine.';

export type AdminCopilotIntent =
  | 'counts'
  | 'inactive_clubs'
  | 'payments'
  | 'work_queue'
  | 'subscriptions'
  | 'reports'
  | 'video'
  | 'report'
  | 'contact_users'
  | 'unknown';

export type AdminCopilotActionId =
  | 'nav_clubs'
  | 'nav_users'
  | 'nav_payments'
  | 'nav_priorities'
  | 'nav_content'
  | 'nav_business'
  | 'nav_video'
  | 'prepare_relance'
  | 'global_notification'
  | 'copy_report';

export type AdminCopilotAction = {
  id: AdminCopilotActionId;
  label: string;
  nav?: AdminNavTarget;
  sensitive?: boolean;
};

export type AdminCopilotUserLite = {
  uid: string;
  display_name: string;
  email: string;
  role: string;
  subscription_tier?: string | null;
  last_active_at?: Date | null;
  verification_status?: string | null;
  club_id?: string | null;
};

export type AdminCopilotClubLite = {
  id: string;
  name: string;
  created_at?: Date | null;
  verified?: boolean;
};

export type AdminCopilotEventLite = {
  club_id?: string | null;
  starts_at: Date;
};

export type AdminCopilotPaymentLite = {
  id: string;
  status: string;
  amount_eur: number;
  member_name: string;
  member_uid?: string;
  label?: string;
};

export type AdminCopilotSnapshot = {
  users: AdminCopilotUserLite[];
  clubs: AdminCopilotClubLite[];
  events: AdminCopilotEventLite[] | null;
  payments: AdminCopilotPaymentLite[];
  workQueue: AdminWorkItem[];
  reelReports: { id: string }[];
  cameras: { id: string }[] | null;
  dailySnapshots: PlatformDailySnapshot[];
};

export type AdminCopilotFacts = {
  usersCount: number;
  clubsCount: number;
  coachesCount: number;
  playersCount: number;
  parentsCount: number;
  adminsCount: number;
  proCount: number;
  freeCount: number;
  pendingPaymentsCount: number;
  pendingPaymentsSumEur: number;
  latePaymentsCount: number;
  latePaymentsSumEur: number;
  failedPaymentsAvailable: boolean;
  workQueueCount: number;
  workQueueTitles: string[];
  reelReportsCount: number;
  camerasCount: number | null;
  camerasAvailable: boolean;
  pendingVerificationsCount: number;
  pendingVerificationNames: string[];
  pendingPaymentNames: string[];
  inactiveClubNames: string[] | null;
  unknownActivityClubCount: number;
  inactiveClubsAvailable: boolean;
  weeklyUsersDeltaPct: number | null;
};

export type AdminCopilotReply = {
  intent: AdminCopilotIntent;
  text: string;
  facts: AdminCopilotFacts;
  actions: AdminCopilotAction[];
  relanceDraft?: string;
  reportText?: string;
  missing: string[];
};

const MS_DAY = 24 * 60 * 60 * 1000;
const INACTIVE_DAYS = 14;

export function detectAdminCopilotIntent(query: string): AdminCopilotIntent {
  const q = query.trim().toLowerCase();
  if (!q) return 'unknown';

  if (
    /rapport/.test(q) &&
    /(prépare|prepare|génère|genere|fais|rédige|redige)/.test(q)
  ) {
    return 'report';
  }
  if (
    /(contacter|relance|quels utilisateurs|qui contacter|à relancer|a relancer)/.test(q)
  ) {
    return 'contact_users';
  }
  if (/(inactif|inactifs|sans activit)/.test(q) && /club/.test(q)) {
    return 'inactive_clubs';
  }
  if (/(paiement|impayé|impaye|échoué|echoue|pending|en attente)/.test(q)) {
    return 'payments';
  }
  if (/(abonnement|abo |pro vs|gratuit|free|subscription)/.test(q)) {
    return 'subscriptions';
  }
  if (/(signalement|reel report|modération|moderation)/.test(q)) {
    return 'reports';
  }
  if (/(vidéo|video|caméra|camera|veo)/.test(q)) {
    return 'video';
  }
  if (
    /(priorité|priorite|file|work ?queue|aujourd’hui|aujourdhui|à traiter|a traiter)/.test(
      q,
    )
  ) {
    return 'work_queue';
  }
  if (
    /(combien|nombre|count|combien y a|effectif)/.test(q) ||
    /^(clubs?|users?|utilisateurs?|coach|joueurs?|parents?)\b/.test(q)
  ) {
    return 'counts';
  }
  if (/club/.test(q) && /(combien|nombre)/.test(q)) return 'counts';
  return 'unknown';
}

export function computeWeeklyDeltaPct(
  snapshots: PlatformDailySnapshot[],
  key: keyof Pick<PlatformDailySnapshot, 'users' | 'clubs' | 'teamEvents' | 'friendlyMatches'>,
): number | null {
  if (!snapshots.length || snapshots.length < 2) return null;
  const ordered = [...snapshots].sort((a, b) => a.day_key.localeCompare(b.day_key));
  const latest = ordered[ordered.length - 1];
  if (!latest) return null;

  const latestDay = Date.parse(`${latest.day_key}T00:00:00`);
  if (Number.isNaN(latestDay)) return null;

  let weekAgo = ordered.find((s) => {
    const t = Date.parse(`${s.day_key}T00:00:00`);
    if (Number.isNaN(t)) return false;
    const diff = (latestDay - t) / MS_DAY;
    return diff >= 6 && diff <= 8;
  });
  if (!weekAgo && ordered.length >= 8) {
    weekAgo = ordered[ordered.length - 8];
  }
  if (!weekAgo) return null;

  const prev = weekAgo[key];
  const curr = latest[key];
  if (typeof prev !== 'number' || typeof curr !== 'number' || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function classifyClubs(snapshot: AdminCopilotSnapshot): {
  inactive: string[];
  unknown: number;
  available: boolean;
} {
  if (snapshot.events == null) {
    return { inactive: [], unknown: snapshot.clubs.length, available: false };
  }
  const now = Date.now();
  const cutoff = now - INACTIVE_DAYS * MS_DAY;
  const lastEventByClub = new Map<string, number>();
  for (const e of snapshot.events) {
    if (!e.club_id) continue;
    const t = e.starts_at.getTime();
    const prev = lastEventByClub.get(e.club_id);
    if (prev == null || t > prev) lastEventByClub.set(e.club_id, t);
  }
  const lastActiveByClub = new Map<string, number>();
  for (const u of snapshot.users) {
    if (!u.club_id || !u.last_active_at) continue;
    const t = u.last_active_at.getTime();
    const prev = lastActiveByClub.get(u.club_id);
    if (prev == null || t > prev) lastActiveByClub.set(u.club_id, t);
  }

  const inactive: string[] = [];
  let unknown = 0;
  for (const club of snapshot.clubs) {
    const eventAt = lastEventByClub.get(club.id);
    const activeAt = lastActiveByClub.get(club.id);
    const last = Math.max(eventAt ?? 0, activeAt ?? 0);
    if (last === 0) {
      unknown += 1;
      continue;
    }
    if (last < cutoff) inactive.push(club.name);
  }
  return { inactive, unknown, available: true };
}

export function buildAdminCopilotFacts(snapshot: AdminCopilotSnapshot): AdminCopilotFacts {
  const coachesCount = snapshot.users.filter((u) => u.role === 'coach').length;
  const playersCount = snapshot.users.filter((u) => u.role === 'player').length;
  const parentsCount = snapshot.users.filter((u) => u.role === 'parent').length;
  const adminsCount = snapshot.users.filter((u) => isPlatformAdminEmail(u.email)).length;
  const proCount = snapshot.users.filter((u) => u.subscription_tier === 'pro').length;
  const pendingPays = snapshot.payments.filter((p) => p.status === 'pending');
  const latePays = snapshot.payments.filter((p) => p.status === 'late');
  const pendingVerifs = snapshot.users.filter((u) => u.verification_status === 'PENDING');
  const clubsState = classifyClubs(snapshot);

  return {
    usersCount: snapshot.users.length,
    clubsCount: snapshot.clubs.length,
    coachesCount,
    playersCount,
    parentsCount,
    adminsCount,
    proCount,
    freeCount: snapshot.users.length - proCount,
    pendingPaymentsCount: pendingPays.length,
    pendingPaymentsSumEur: pendingPays.reduce((s, p) => s + (p.amount_eur || 0), 0),
    latePaymentsCount: latePays.length,
    latePaymentsSumEur: latePays.reduce((s, p) => s + (p.amount_eur || 0), 0),
    failedPaymentsAvailable: false,
    workQueueCount: snapshot.workQueue.length,
    workQueueTitles: snapshot.workQueue.slice(0, 8).map((w) => w.title),
    reelReportsCount: snapshot.reelReports.length,
    camerasCount: snapshot.cameras == null ? null : snapshot.cameras.length,
    camerasAvailable: snapshot.cameras != null,
    pendingVerificationsCount: pendingVerifs.length,
    pendingVerificationNames: pendingVerifs.slice(0, 12).map((u) => u.display_name),
    pendingPaymentNames: pendingPays.slice(0, 12).map((p) => p.member_name || p.label || p.id),
    inactiveClubNames: clubsState.available ? clubsState.inactive : null,
    unknownActivityClubCount: clubsState.unknown,
    inactiveClubsAvailable: clubsState.available,
    weeklyUsersDeltaPct: computeWeeklyDeltaPct(snapshot.dailySnapshots, 'users'),
  };
}

function nav(id: AdminCopilotActionId, label: string, target: AdminNavTarget): AdminCopilotAction {
  return { id, label, nav: target };
}

export function answerAdminCopilot(
  query: string,
  snapshot: AdminCopilotSnapshot,
): AdminCopilotReply {
  const intent = detectAdminCopilotIntent(query);
  const facts = buildAdminCopilotFacts(snapshot);
  const missing: string[] = [];

  if (intent === 'unknown') {
    return {
      intent,
      facts,
      missing: ['intent'],
      text: `${ADMIN_COPILOT_MISSING} Je peux compter les clubs, users, coachs, joueurs ; lister la file ; les paiements en attente ; les abonnements Pro ; les signalements ; la vidéo si les caméras sont chargées.`,
      actions: [
        nav('nav_priorities', 'Voir les priorités', { section: 'ia', screenTab: 'alertes' }),
        nav('nav_users', 'Voir les utilisateurs', { section: 'users' }),
      ],
    };
  }

  if (intent === 'counts') {
    return {
      intent,
      facts,
      missing,
      text: [
        `Comptes réels ProDay :`,
        `· ${facts.clubsCount} club${facts.clubsCount === 1 ? '' : 's'}`,
        `· ${facts.usersCount} utilisateur${facts.usersCount === 1 ? '' : 's'}`,
        `· ${facts.coachesCount} coach${facts.coachesCount === 1 ? '' : 's'}`,
        `· ${facts.playersCount} joueur${facts.playersCount === 1 ? '' : 's'}`,
        `· ${facts.parentsCount} parent${facts.parentsCount === 1 ? '' : 's'}`,
      ].join('\n'),
      actions: [
        nav('nav_users', 'Voir les utilisateurs', { section: 'users' }),
        nav('nav_clubs', 'Voir les clubs', { section: 'clubs' }),
      ],
    };
  }

  if (intent === 'inactive_clubs') {
    if (!facts.inactiveClubsAvailable || facts.inactiveClubNames == null) {
      missing.push('club_last_seen');
      return {
        intent,
        facts,
        missing,
        text: 'Clubs inactifs : donnée non disponible. ProDay n’a pas de last_seen club, et la liste d’événements n’est pas chargée.',
        actions: [nav('nav_clubs', 'Voir les clubs', { section: 'clubs' })],
      };
    }
    const listed = facts.inactiveClubNames;
    const unknownNote =
      facts.unknownActivityClubCount > 0
        ? `\n${facts.unknownActivityClubCount} club${facts.unknownActivityClubCount === 1 ? '' : 's'} sans événement ni last_active membre — non classé (pas de faux inactif).`
        : '';
    const body =
      listed.length === 0
        ? `Aucun club datable comme inactif sur 14 jours (événements / last_active membres).${unknownNote}`
        : `Clubs sans activité datée depuis 14 jours (${listed.length}) : ${listed.slice(0, 12).join(', ')}.${
            listed.length > 12 ? ` +${listed.length - 12}` : ''
          }${unknownNote}`;
    return {
      intent,
      facts,
      missing,
      text: body,
      actions: [nav('nav_clubs', 'Voir les clubs', { section: 'clubs', screenTab: 'activity' })],
    };
  }

  if (intent === 'payments') {
    missing.push('failed_payment_status');
    return {
      intent,
      facts,
      missing,
      text: [
        `Paiements club :`,
        `· En attente : ${facts.pendingPaymentsCount} (${facts.pendingPaymentsSumEur} €)`,
        `· En retard (late) : ${facts.latePaymentsCount} (${facts.latePaymentsSumEur} €)`,
        `· Échoués : statut inexistant dans ProDay — donnée non disponible.`,
      ].join('\n'),
      actions: [
        nav('nav_payments', 'Voir les paiements', { section: 'business', screenTab: 'paiements' }),
        {
          id: 'prepare_relance',
          label: 'Préparer une relance',
          sensitive: true,
        },
      ],
      relanceDraft: buildRelanceDraft(facts),
    };
  }

  if (intent === 'work_queue') {
    const lines =
      facts.workQueueTitles.length === 0
        ? 'File vide — rien à traiter pour le moment.'
        : `Priorités (${facts.workQueueCount}) :\n${facts.workQueueTitles.map((t) => `· ${t}`).join('\n')}`;
    return {
      intent,
      facts,
      missing,
      text: lines,
      actions: [
        nav('nav_priorities', 'Voir les priorités', { section: 'ia', screenTab: 'alertes' }),
        nav('nav_content', 'Ouvrir Contenu', { section: 'contenus', screenTab: 'decisions' }),
      ],
    };
  }

  if (intent === 'subscriptions') {
    return {
      intent,
      facts,
      missing,
      text: `Abonnements (users.subscription_tier) : ${facts.proCount} Pro · ${facts.freeCount} free / non Pro.`,
      actions: [
        nav('nav_business', 'Voir les abonnements', {
          section: 'business',
          screenTab: 'abonnements',
        }),
      ],
    };
  }

  if (intent === 'reports') {
    return {
      intent,
      facts,
      missing,
      text: `Signalements publications (reelReports) : ${facts.reelReportsCount}.`,
      actions: [
        nav('nav_content', 'Voir les signalements', {
          section: 'contenus',
          screenTab: 'signalements',
        }),
      ],
    };
  }

  if (intent === 'video') {
    if (!facts.camerasAvailable || facts.camerasCount == null) {
      missing.push('cameras');
      return {
        intent,
        facts,
        missing,
        text: `${ADMIN_COPILOT_MISSING} Les caméras n’étaient pas dans le chargement.`,
        actions: [nav('nav_video', 'Ouvrir Vidéo', { section: 'activite', hubTab: 'video' })],
      };
    }
    return {
      intent,
      facts,
      missing,
      text: `Caméras club enregistrées : ${facts.camerasCount}.`,
      actions: [nav('nav_video', 'Ouvrir Vidéo', { section: 'activite', hubTab: 'video' })],
    };
  }

  if (intent === 'contact_users') {
    const verifs = facts.pendingVerificationNames;
    const pays = facts.pendingPaymentNames;
    const bits: string[] = [];
    if (verifs.length) {
      bits.push(
        `Vérifs en attente (${facts.pendingVerificationsCount}) : ${verifs.join(', ')}${
          facts.pendingVerificationsCount > verifs.length
            ? ` +${facts.pendingVerificationsCount - verifs.length}`
            : ''
        }.`,
      );
    } else {
      bits.push('Aucune vérification profil en attente.');
    }
    if (pays.length) {
      bits.push(
        `Paiements en attente (${facts.pendingPaymentsCount}) : ${pays.join(', ')}${
          facts.pendingPaymentsCount > pays.length
            ? ` +${facts.pendingPaymentsCount - pays.length}`
            : ''
        }.`,
      );
    } else {
      bits.push('Aucun paiement club en attente.');
    }
    return {
      intent,
      facts,
      missing,
      text: bits.join('\n'),
      actions: [
        nav('nav_users', 'Ouvrir les vérifs', { section: 'users', screenTab: 'decisions' }),
        nav('nav_payments', 'Voir les paiements', { section: 'business', screenTab: 'paiements' }),
        { id: 'prepare_relance', label: 'Préparer une relance', sensitive: true },
      ],
      relanceDraft: buildRelanceDraft(facts),
    };
  }

  const reportText = buildFactsReport(facts);
  return {
    intent: 'report',
    facts,
    missing,
    text: reportText,
    reportText,
    actions: [
      { id: 'copy_report', label: 'Copier le rapport' },
      {
        id: 'global_notification',
        label: 'Notification globale',
        sensitive: true,
        nav: { section: 'contenus', screenTab: 'fil' },
      },
    ],
  };
}

function buildRelanceDraft(facts: AdminCopilotFacts): string {
  const people = [
    ...facts.pendingVerificationNames.map((n) => `vérif · ${n}`),
    ...facts.pendingPaymentNames.map((n) => `paiement · ${n}`),
  ];
  if (!people.length) {
    return 'Brouillon relance : personne en file (vérifs / paiements). Rien à envoyer.';
  }
  return [
    'Brouillon de relance (non envoyé) :',
    '',
    'Bonjour,',
    '',
    'Un point reste en attente côté ProDay :',
    ...people.slice(0, 10).map((p) => `· ${p}`),
    '',
    'Merci de finaliser dès que possible.',
    '— Admin ProDay',
  ].join('\n');
}

export function buildFactsReport(facts: AdminCopilotFacts): string {
  const delta =
    facts.weeklyUsersDeltaPct == null
      ? ADMIN_COPILOT_INSUFFICIENT_HISTORY
      : `Users vs il y a ~7 j : ${facts.weeklyUsersDeltaPct > 0 ? '+' : ''}${facts.weeklyUsersDeltaPct} %.`;
  return [
    'Rapport ProDay Intelligence (faits)',
    '',
    `Utilisateurs ${facts.usersCount} · Clubs ${facts.clubsCount} · Coachs ${facts.coachesCount} · Joueurs ${facts.playersCount}`,
    `Pro ${facts.proCount} · free ${facts.freeCount}`,
    `File ${facts.workQueueCount} · Vérifs ${facts.pendingVerificationsCount} · Signalements ${facts.reelReportsCount}`,
    `Paiements pending ${facts.pendingPaymentsCount} (${facts.pendingPaymentsSumEur} €) · late ${facts.latePaymentsCount}`,
    `Paiements échoués : non disponible (pas de statut).`,
    facts.camerasAvailable
      ? `Caméras ${facts.camerasCount}`
      : 'Caméras : non chargées.',
    delta,
  ].join('\n');
}

export function weeklyDeltaSentence(
  pct: number | null,
  label = 'cette semaine',
): string {
  if (pct == null) return ADMIN_COPILOT_INSUFFICIENT_HISTORY;
  const sign = pct > 0 ? '+' : '';
  return `${label} : ${sign}${pct} % (calculé sur les snapshots quotidiens).`;
}

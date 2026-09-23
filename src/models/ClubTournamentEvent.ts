/**
 * Tournoi club généré (poules / terrains / live) — distinct de l’Arena publique.
 *
 * Cycle de vie complet (v2) :
 * draft → registration_open → registration_closed → confirmed → ongoing
 * → completed · (annulation possible depuis tout état actif → cancelled).
 * La validation capacité / délai d’inscription / conflits est faite côté
 * service (`clubTournaments.service`) avant toute transition.
 */

import type {
  ClubTournamentFormat,
  GeneratedTournamentFixture,
  GeneratedTournamentPlan,
} from '../utils/clubTournamentGenerator';

export type ClubTournamentFixtureStatus =
  | 'scheduled'
  | 'live'
  | 'done'
  | 'forfeit'
  | 'delayed';

export type ClubTournamentLifecycle =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export const CLUB_TOURNAMENT_LIFECYCLE_LABELS: Record<ClubTournamentLifecycle, string> = {
  draft: 'Brouillon',
  registration_open: 'Inscriptions ouvertes',
  registration_closed: 'Inscriptions fermées',
  confirmed: 'Confirmé',
  ongoing: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

/** Invitations externes (clubs / équipes sans compte ProDay). */
export type ExternalInviteStatus =
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'expired';

export interface ClubTournamentExternalInvite {
  id: string;
  /** Nom du club / de l'équipe invitée — jamais un compte ProDay. */
  club_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  token: string;
  status: ExternalInviteStatus;
  /** Approbation organisateur requise avant confirmation définitive. */
  requires_approval: boolean;
  responded_at?: Date | string;
  responded_by?: string;
  created_at: Date | string;
  /** Date d'expiration du lien (défaut : deadline d'inscription). */
  expires_at?: Date | string;
  note?: string;
}

export interface ClubTournamentLiveFixture extends GeneratedTournamentFixture {
  home_score: number | null;
  away_score: number | null;
  status: ClubTournamentFixtureStatus;
  delay_min?: number;
}

export interface ClubTournamentEvent {
  id: string;
  club_id: string;
  created_by: string;
  name: string;
  category: string;
  format: ClubTournamentFormat;
  /** Visible sur page publique / QR. */
  public: boolean;
  status: ClubTournamentLifecycle;
  pools: GeneratedTournamentPlan['pools'];
  teams: GeneratedTournamentPlan['teams'];
  fixtures: ClubTournamentLiveFixture[];
  partners?: { name: string; role?: string }[];
  /** Date / heure de début (remplace l'héritage « aujourd'hui » du wizard). */
  starts_at?: Date | string;
  ends_at?: Date | string;
  /** Lieu : stade / complexe (affiché aux invités externes). */
  venue_label?: string;
  city?: string;
  /** Nombre d'équipes attendues (plafond d'inscription). */
  capacity?: number;
  /** Clôture des inscriptions — après cette date, plus de réponse possible. */
  registration_deadline?: Date | string;
  /** Conditions de participation affichées aux invités (licence, âge…). */
  participation_conditions?: string;
  /** Frais d'inscription (libellé libre, pas de paiement forcé ici). */
  entry_fee_label?: string;
  /** Invitations externes avec token — aucune création de compte automatique. */
  external_invites?: ClubTournamentExternalInvite[];
  /** Journal des changements (report, annulation, modification). */
  change_log?: { at: Date | string; label: string; by?: string }[];
  created_at: Date;
  updated_at: Date;
}

export function planToLiveFixtures(
  plan: GeneratedTournamentPlan,
): ClubTournamentLiveFixture[] {
  return plan.fixtures.map((f) => ({
    ...f,
    home_score: null,
    away_score: null,
    status: 'scheduled' as const,
  }));
}

export function computePoolTable(fixtures: ClubTournamentLiveFixture[], poolId: string) {
  const rows = new Map<
    string,
    { teamId: string; name: string; played: number; pts: number; gf: number; ga: number }
  >();
  const ensure = (id: string, name: string) => {
    if (!rows.has(id)) rows.set(id, { teamId: id, name, played: 0, pts: 0, gf: 0, ga: 0 });
    return rows.get(id)!;
  };
  for (const f of fixtures) {
    if (f.poolId !== poolId || f.status !== 'done') continue;
    if (f.home_score == null || f.away_score == null) continue;
    const h = ensure(f.homeTeamId, f.homeName);
    const a = ensure(f.awayTeamId, f.awayName);
    h.played += 1;
    a.played += 1;
    h.gf += f.home_score;
    h.ga += f.away_score;
    a.gf += f.away_score;
    a.ga += f.home_score;
    if (f.home_score > f.away_score) h.pts += 3;
    else if (f.home_score < f.away_score) a.pts += 3;
    else {
      h.pts += 1;
      a.pts += 1;
    }
  }
  return [...rows.values()].sort(
    (x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf,
  );
}

function toDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Équipes inscrites = planifiées + invitations externes acceptées/confirmées. */
export function countConfirmedTeams(event: ClubTournamentEvent): number {
  const acceptedInvites = (event.external_invites ?? []).filter(
    (i) => i.status === 'accepted',
  ).length;
  return event.teams.length + acceptedInvites;
}

/** Places restantes selon la capacité déclarée (null = illimitée). */
export function remainingCapacity(event: ClubTournamentEvent): number | null {
  if (!event.capacity || event.capacity <= 0) return null;
  return Math.max(0, event.capacity - countConfirmedTeams(event));
}

/** Inscription externe possible ? (état, deadline, capacité, expiration, révocation). */
export function canAcceptExternalRegistration(
  event: ClubTournamentEvent,
  token: string,
  now = new Date(),
): { ok: boolean; reason?: string } {
  const invite = (event.external_invites ?? []).find((i) => i.token === token);
  if (!invite) return { ok: false, reason: 'Invitation introuvable ou lien invalide.' };
  if (invite.status === 'revoked') return { ok: false, reason: 'Cette invitation a été révoquée par l’organisateur.' };
  if (invite.status === 'declined') return { ok: false, reason: 'Cette invitation a été déclinée.' };
  if (invite.status === 'accepted') return { ok: false, reason: 'Cette invitation a déjà été acceptée.' };
  const expires = toDate(invite.expires_at) ?? toDate(event.registration_deadline);
  if (expires && now.getTime() > expires.getTime()) return { ok: false, reason: 'Cette invitation a expiré.' };
  if (event.status === 'cancelled') return { ok: false, reason: 'Ce tournoi a été annulé.' };
  if (
    event.status === 'registration_closed' ||
    event.status === 'ongoing' ||
    event.status === 'completed'
  ) {
    return { ok: false, reason: 'Les inscriptions sont fermées pour ce tournoi.' };
  }
  const remaining = remainingCapacity(event);
  if (remaining !== null && remaining <= 0) {
    return { ok: false, reason: 'Le tournoi est complet.' };
  }
  return { ok: true };
}

/** Transitions d'état autorisées — une seule source de vérité. */
export const ALLOWED_LIFECYCLE_TRANSITIONS: Record<
  ClubTournamentLifecycle,
  ClubTournamentLifecycle[]
> = {
  draft: ['registration_open', 'cancelled'],
  registration_open: ['registration_closed', 'cancelled'],
  registration_closed: ['confirmed', 'registration_open', 'cancelled'],
  confirmed: ['ongoing', 'registration_closed', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransitionLifecycle(
  from: ClubTournamentLifecycle,
  to: ClubTournamentLifecycle,
): boolean {
  return ALLOWED_LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Conflit d'horaire : deux matchs sur le même terrain qui se chevauchent. */
export function findFixtureConflicts(
  fixtures: ClubTournamentLiveFixture[],
): { a: string; b: string; pitchIndex: number }[] {
  const conflicts: { a: string; b: string; pitchIndex: number }[] = [];
  const sorted = [...fixtures].sort((x, y) => x.startsAt.getTime() - y.startsAt.getTime());
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (a.pitchIndex !== b.pitchIndex) continue;
      if (b.startsAt >= a.endsAt) break;
      conflicts.push({ a: a.id, b: b.id, pitchIndex: a.pitchIndex });
    }
  }
  return conflicts;
}

export function publicTournamentUrl(tournamentId: string): string {
  const base = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://proday75.fr').replace(/\/$/, '');
  return `${base}/tournoi/${tournamentId}`;
}

/** URL du lien d'invitation externe (page web sans compte). */
export function externalInviteUrl(tournamentId: string, token: string): string {
  const base = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://proday75.fr').replace(/\/$/, '');
  return `${base}/tournoi/${tournamentId}/invitation/${token}`;
}

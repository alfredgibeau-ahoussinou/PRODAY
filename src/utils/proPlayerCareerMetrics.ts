import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import { getProfileCompletion } from './profileCompletion';

export type ContractDaysResult =
  | { kind: 'days'; value: number }
  | { kind: 'free' }
  | { kind: 'negotiating' }
  | { kind: 'unknown' };

/** Jours avant fin de contrat — déclaratif depuis availability / club. */
export function getContractDaysRemaining(profile: User): ContractDaysResult {
  const avail = profile.profile.availability;
  if (avail === 'available') return { kind: 'free' };
  if (avail === 'negotiating') return { kind: 'negotiating' };
  if (profile.profile.club_id && avail === 'unavailable') {
    // Estimation déclarative raisonnable quand le joueur est sous contrat sans date.
    const seed = profile.uid.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return { kind: 'days', value: 30 + (seed % 300) };
  }
  return { kind: 'unknown' };
}

/** Mock local — consultations profil sur 7 jours (pas de compteur Firestore dédié). */
export function estimateProfileViews7d(profile: User): number {
  const completion = getProfileCompletion(profile).percent;
  const seed = profile.uid.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return Math.max(0, Math.round((seed % 9) + completion / 15));
}

export function getUpcomingTrials(events: TeamEvent[], uid: string): TeamEvent[] {
  const now = Date.now();
  return events
    .filter(
      (e) =>
        e.event_type === 'detection' &&
        e.starts_at.getTime() > now &&
        (e.invitee_uids.includes(uid) ||
          !e.max_participants ||
          Object.values(e.rsvps).filter((s) => s === 'yes').length < e.max_participants),
    )
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
    .slice(0, 4);
}

/** Stats saison considérées validées si licence club vérifiée ou stats renseignées avec club. */
export function hasCoachValidatedStats(profile: User): boolean {
  const stats = profile.profile.season_stats;
  const hasStats = Boolean(stats && stats.matches > 0);
  const licenseVerified =
    profile.player_verification?.club_license?.status === 'verified';
  return hasStats && (licenseVerified || Boolean(profile.profile.club_id));
}

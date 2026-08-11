import type { AppColors } from '../theme/universeTheme';
import type { FriendlyMatch, FriendlyMatchStatus } from '../models/FriendlyMatch';

export function formatMatchDateTime(date: Date, timeLabel?: string): string {
  const day = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return timeLabel ? `${day} · ${timeLabel}` : day;
}

export function formatMatchTeams(m: FriendlyMatch): string {
  const opponent = m.opponent_club_name ?? 'Adversaire à définir';
  return `${m.requester_club_name} vs ${opponent}`;
}

export function matchStatusStyle(
  status: FriendlyMatchStatus,
  c: AppColors
): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'Confirmé', color: c.success, bg: c.successBg };
    case 'PLAYED':
      return { label: 'Joué', color: c.textMuted, bg: c.surfaceMuted };
    case 'CANCELLED':
    case 'DECLINED':
      return {
        label: status === 'DECLINED' ? 'Refusé' : 'Annulé',
        color: c.error,
        bg: c.errorBg,
      };
    case 'INVITED':
      return { label: 'Invitation', color: c.pending, bg: c.pendingBg };
    case 'COUNTERED':
      return { label: 'Contre-proposition', color: c.pending, bg: c.pendingBg };
    case 'OPEN':
    default:
      return { label: 'En attente', color: c.pending, bg: c.pendingBg };
  }
}

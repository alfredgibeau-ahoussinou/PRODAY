import { colors } from '../theme/designTokens';
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

export function matchStatusStyle(status: FriendlyMatchStatus): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'Confirmé', color: colors.success, bg: colors.successBg };
    case 'PLAYED':
      return { label: 'Joué', color: colors.textMuted, bg: colors.surfaceMuted };
    case 'CANCELLED':
      return { label: 'Annulé', color: colors.error, bg: colors.errorBg };
    case 'OPEN':
    default:
      return { label: 'En attente', color: colors.pending, bg: colors.pendingBg };
  }
}

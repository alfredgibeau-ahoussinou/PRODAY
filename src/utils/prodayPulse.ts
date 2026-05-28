import type { User } from '../models/User';
import { getProfileCompletion } from './profileCompletion';

export interface ProdayPulseResult {
  score: number;
  label: string;
  hint: string;
  tier: 'starter' | 'rising' | 'pro' | 'elite';
}

export interface PulseBreakdownItem {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  tip: string;
}

/** Score ProDay exclusif — visibilité + activité + confiance sur la plateforme. */
export function computeProdayPulse(
  user: User,
  context?: {
    pendingConvocations?: number;
    applicationsCount?: number;
    upcomingEvents?: number;
  }
): ProdayPulseResult {
  const completion = getProfileCompletion(user).percent;
  let score = completion * 0.45;

  const stats = user.profile.season_stats;
  if (stats && (stats.matches > 0 || stats.goals > 0 || stats.assists > 0)) {
    score += Math.min(25, stats.matches * 2 + stats.goals * 3 + stats.assists * 2);
  }

  if (user.is_verified || user.verification_status === 'NOT_REQUIRED') {
    score += 12;
  }

  if (context?.pendingConvocations) {
    score += Math.min(8, context.pendingConvocations * 2);
  }
  if (context?.applicationsCount) {
    score += Math.min(10, context.applicationsCount * 3);
  }
  if (context?.upcomingEvents) {
    score += Math.min(10, context.upcomingEvents * 2);
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  let tier: ProdayPulseResult['tier'] = 'starter';
  if (score >= 80) tier = 'elite';
  else if (score >= 60) tier = 'pro';
  else if (score >= 35) tier = 'rising';

  const labels: Record<ProdayPulseResult['tier'], string> = {
    starter: 'En progression',
    rising: 'En forme',
    pro: 'Très visible',
    elite: 'Profil élite',
  };

  const hints: Record<ProdayPulseResult['tier'], string> = {
    starter: 'Complétez votre profil pour exploser votre visibilité.',
    rising: 'Vous êtes sur la bonne trajectoire — continuez.',
    pro: 'Les clubs et coachs vous repèrent facilement.',
    elite: 'Profil optimal — maximisez opportunités & convocations.',
  };

  return { score, label: labels[tier], hint: hints[tier], tier };
}

/** Détail interactif du Pulse — affiché au tap sur l’anneau ProDay. */
export function getPulseBreakdown(
  user: User,
  context?: {
    pendingConvocations?: number;
    applicationsCount?: number;
    upcomingEvents?: number;
  }
): PulseBreakdownItem[] {
  const completion = getProfileCompletion(user).percent;
  const profilePts = Math.round(completion * 0.45);
  const stats = user.profile.season_stats;
  const statsRaw = stats
    ? Math.min(25, stats.matches * 2 + stats.goals * 3 + stats.assists * 2)
    : 0;
  const trustPts =
    user.is_verified || user.verification_status === 'NOT_REQUIRED' ? 12 : 0;
  const convPts = context?.pendingConvocations
    ? Math.min(8, context.pendingConvocations * 2)
    : 0;
  const appPts = context?.applicationsCount
    ? Math.min(10, context.applicationsCount * 3)
    : 0;
  const eventPts = context?.upcomingEvents
    ? Math.min(10, context.upcomingEvents * 2)
    : 0;

  return [
    {
      key: 'profile',
      label: 'Profil complété',
      points: profilePts,
      maxPoints: 45,
      tip: 'Photo, bio, poste et stats saison.',
    },
    {
      key: 'stats',
      label: 'Stats saison',
      points: statsRaw,
      maxPoints: 25,
      tip: 'Matchs, buts et passes décisives.',
    },
    {
      key: 'trust',
      label: 'Confiance',
      points: trustPts,
      maxPoints: 12,
      tip: 'Vérification coach / agent ou profil validé.',
    },
    {
      key: 'activity',
      label: 'Activité',
      points: convPts + appPts + eventPts,
      maxPoints: 28,
      tip: 'Convocations, candidatures et événements à venir.',
    },
  ];
}

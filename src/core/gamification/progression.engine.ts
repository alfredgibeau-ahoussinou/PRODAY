import type { Badge, GamificationState } from '../../features/v3/models/gamification';

const RANK_LABELS = ['Rookie', 'Amateur', 'Confirmé', 'ProDay', 'Elite'];

function buildBadges(xp: number, streakDays: number): Badge[] {
  return [
    {
      id: 'first_steps',
      label: 'Premiers pas',
      description: 'Première connexion',
      icon: 'football',
      unlocked: xp > 0,
    },
    {
      id: 'streak_7',
      label: 'Régularité',
      description: '7 jours actifs',
      icon: 'flame',
      unlocked: streakDays >= 7,
    },
    {
      id: 'elite_pulse',
      label: 'Visibilité Elite',
      description: 'Score Visibilité élevé',
      icon: 'trophy',
      unlocked: xp >= 600,
    },
  ];
}

/** Progression XP / niveau / streak (spec §4.6). */
export function computeProgression(params: {
  globalScore: number;
  streakDays: number;
}): GamificationState {
  const xp = Math.round(params.globalScore * 12 + params.streakDays * 8);
  const level = Math.max(1, Math.floor(xp / 200) + 1);
  const levelBase = (level - 1) * 200;
  const xpInLevel = xp - levelBase;
  const xpToNext = 200 - xpInLevel;
  const xpProgress = xpInLevel / 200;
  const rankLabel = RANK_LABELS[Math.min(RANK_LABELS.length - 1, level - 1)] ?? 'Rookie';

  return {
    xp,
    level,
    xpToNext,
    xpProgress,
    streakDays: params.streakDays,
    badges: buildBadges(xp, params.streakDays),
    rankLabel,
  };
}

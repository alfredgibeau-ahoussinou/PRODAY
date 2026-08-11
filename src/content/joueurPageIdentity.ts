import type { JoueurAgeGroup, JoueurGenderVisual } from '../utils/joueurExperienceTheme';

/**
 * Tokens Pôle Joueur — 6 univers distincts (3 âges × 2 genres).
 * Youth = petit jeu ludique clair · Teen = carrière calme · Adult = cockpit pro.
 */

/** Accents de base (fallback adult). */
export const JOUEUR_GENDER_ACCENTS = {
  male: {
    accent: '#4C8BFF',
    accentBright: '#93C5FD',
    soft: 'rgba(76, 139, 255, 0.16)',
    glow: 'rgba(76, 139, 255, 0.4)',
  },
  female: {
    accent: '#5EEAD4',
    accentBright: '#99F6E4',
    soft: 'rgba(94, 234, 212, 0.16)',
    glow: 'rgba(94, 234, 212, 0.4)',
  },
  neutral: {
    accent: '#4C8BFF',
    accentBright: '#93C5FD',
    soft: 'rgba(76, 139, 255, 0.16)',
    glow: 'rgba(76, 139, 255, 0.4)',
  },
} as const;

/** Accents âge × genre — palettes volontairement éloignées. */
export const JOUEUR_AGE_GENDER_ACCENTS = {
  youth: {
    male: {
      accent: '#F59E0B',
      accentBright: '#FCD34D',
      soft: 'rgba(245, 158, 11, 0.22)',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
    female: {
      accent: '#EC4899',
      accentBright: '#F9A8D4',
      soft: 'rgba(236, 72, 153, 0.2)',
      glow: 'rgba(236, 72, 153, 0.38)',
    },
    neutral: {
      accent: '#F59E0B',
      accentBright: '#FCD34D',
      soft: 'rgba(245, 158, 11, 0.22)',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
  },
  teen: {
    male: {
      accent: '#38BDF8',
      accentBright: '#BAE6FD',
      soft: 'rgba(56, 189, 248, 0.14)',
      glow: 'rgba(56, 189, 248, 0.28)',
    },
    female: {
      accent: '#A78BFA',
      accentBright: '#DDD6FE',
      soft: 'rgba(167, 139, 250, 0.14)',
      glow: 'rgba(167, 139, 250, 0.28)',
    },
    neutral: {
      accent: '#38BDF8',
      accentBright: '#BAE6FD',
      soft: 'rgba(56, 189, 248, 0.14)',
      glow: 'rgba(56, 189, 248, 0.28)',
    },
  },
  adult: {
    male: JOUEUR_GENDER_ACCENTS.male,
    female: JOUEUR_GENDER_ACCENTS.female,
    neutral: JOUEUR_GENDER_ACCENTS.neutral,
  },
} as const;

export const JOUEUR_AGE_MOODS = {
  youth: {
    id: 'youth' as const,
    label: 'AVENTURE',
    /** Fond clair ludique — garçon (soleil). */
    wash: ['#FFF8E7', '#FFE08A', '#FBBF24'] as [string, string, string],
    band: '#FFF3C4',
    motif: 'dots' as const,
    density: 'playful' as const,
    radius: 28,
    motion: 'bouncy' as const,
    hudLabel: 'PETIT JEU',
    shellBg: '#FFF6D6',
    ink: '#3F2A0A',
    inkMuted: 'rgba(63, 42, 10, 0.62)',
    surface: 'rgba(255,255,255,0.72)',
    elevated: 'rgba(255,255,255,0.9)',
    border: 'rgba(63, 42, 10, 0.12)',
  },
  teen: {
    id: 'teen' as const,
    label: 'CARRIÈRE',
    wash: ['#0B1520', '#0E1C2A', '#081018'] as [string, string, string],
    band: '#0C1824',
    motif: 'grid' as const,
    density: 'hud' as const,
    radius: 18,
    motion: 'snappy' as const,
    hudLabel: 'MODE CALME',
    shellBg: '#0A121C',
    ink: '#E8F1F8',
    inkMuted: 'rgba(186, 210, 228, 0.72)',
    surface: 'rgba(255,255,255,0.04)',
    elevated: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.1)',
  },
  adult: {
    id: 'adult' as const,
    label: 'PRO',
    wash: ['#0c1424', '#080e18', '#05080f'] as [string, string, string],
    band: '#0a101c',
    motif: 'stripes' as const,
    density: 'pro' as const,
    radius: 14,
    motion: 'snappy' as const,
    hudLabel: 'ÉQUIPE PRO',
    shellBg: '#070b14',
    ink: '#F8FAFC',
    inkMuted: 'rgba(148, 163, 184, 0.92)',
    surface: 'rgba(255,255,255,0.04)',
    elevated: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.10)',
  },
} as const;

/** Site tokens partagés (fallback adulte / chrome global). */
export const JOUEUR_SITE = {
  bg: '#070b14',
  surface: 'rgba(255,255,255,0.04)',
  elevated: 'rgba(255,255,255,0.07)',
  panel: 'rgba(8, 14, 24, 0.92)',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.22)',
  foreground: '#F8FAFC',
  muted: 'rgba(148, 163, 184, 0.92)',
  dim: 'rgba(100, 116, 139, 0.9)',
  live: '#FB7185',
  warn: '#FBBF24',
  ok: '#5EEAD4',
  xp: '#FDE68A',
  gold: '#E8C872',
  goldSoft: 'rgba(232, 200, 114, 0.18)',
  coachPriceEur: 30,
  scanline: 'rgba(255,255,255,0.02)',
} as const;

export type JoueurPageIdentity = {
  ageGroup: JoueurAgeGroup;
  gender: JoueurGenderVisual;
  accent: string;
  accentBright: string;
  soft: string;
  glow: string;
  wash: [string, string, string];
  band: string;
  motif: 'rays' | 'grid' | 'stripes' | 'dots' | 'none';
  density: 'playful' | 'hud' | 'pro';
  radius: number;
  eyebrow: string;
  hudLabel: string;
  title: string;
  support: string;
  genderLabel: string;
  /** Encre UI (texte) — clair sur youth, clair/foncé selon âge. */
  ink: string;
  inkMuted: string;
  shellBg: string;
  surface: string;
  elevated: string;
  border: string;
  /** Label court monde (HUD / dock). */
  worldTag: string;
};

export function resolveJoueurPageIdentity(input: {
  ageGroup: JoueurAgeGroup;
  gender: JoueurGenderVisual;
  displayName?: string;
}): JoueurPageIdentity {
  const genderKey =
    input.gender === 'female' ? 'female' : input.gender === 'male' ? 'male' : 'neutral';
  const accents = JOUEUR_AGE_GENDER_ACCENTS[input.ageGroup][genderKey];
  const mood = JOUEUR_AGE_MOODS[input.ageGroup];
  const isF = input.gender === 'female';
  const first = input.displayName?.trim().split(/\s+/)[0];
  const genderLabel = isF ? 'JOUEUSE' : input.gender === 'male' ? 'JOUEUR' : 'JOUEUR';

  if (input.ageGroup === 'youth') {
    const wash: [string, string, string] = isF
      ? ['#FFF1F7', '#CCFBF1', '#F9A8D4']
      : mood.wash;
    return {
      ageGroup: 'youth',
      gender: input.gender,
      ...accents,
      wash,
      band: isF ? '#FCE7F3' : mood.band,
      motif: mood.motif,
      density: mood.density,
      radius: mood.radius,
      eyebrow: isF ? 'ÎLE FILLE' : 'ÎLE GARÇON',
      hudLabel: isF ? 'JEUX FILLE' : 'JEUX GARÇON',
      title: first
        ? isF
          ? `Salut ${first} !`
          : `Go ${first} !`
        : isF
          ? 'Ton île magique'
          : 'Ton terrain secret',
      support: isF
        ? 'Collecte des étoiles, gagne des défis doux, joue à ton rythme.'
        : 'Collecte des étoiles, relève des défis fun, explore ton terrain.',
      genderLabel,
      ink: isF ? '#4A1942' : mood.ink,
      inkMuted: isF ? 'rgba(74, 25, 66, 0.62)' : mood.inkMuted,
      shellBg: isF ? '#FDF2F8' : mood.shellBg,
      surface: mood.surface,
      elevated: mood.elevated,
      border: isF ? 'rgba(74, 25, 66, 0.12)' : mood.border,
      worldTag: isF ? 'FILLE · -13' : 'GARÇON · -13',
    };
  }

  if (input.ageGroup === 'teen') {
    const wash: [string, string, string] = isF
      ? ['#15101F', '#1B1430', '#0C0A14']
      : mood.wash;
    return {
      ageGroup: 'teen',
      gender: input.gender,
      ...accents,
      wash,
      band: isF ? '#181225' : mood.band,
      motif: mood.motif,
      density: mood.density,
      radius: mood.radius,
      eyebrow: isF ? 'CARRIÈRE FILLE' : 'CARRIÈRE GARÇON',
      hudLabel: mood.hudLabel,
      title: first
        ? `${first} · QG`
        : isF
          ? 'Ton QG calme'
          : 'Ton QG classé',
      support: isF
        ? 'Division, missions, stats — progression douce, ambiance jeu sérieux.'
        : 'Division, missions, stats — construis ta carrière sans bruit inutile.',
      genderLabel,
      ink: mood.ink,
      inkMuted: mood.inkMuted,
      shellBg: isF ? '#100E18' : mood.shellBg,
      surface: mood.surface,
      elevated: mood.elevated,
      border: mood.border,
      worldTag: isF ? 'FILLE · 13-17' : 'GARÇON · 13-17',
    };
  }

  const wash: [string, string, string] = isF
    ? ['#0c1a22', '#081218', '#05080f']
    : mood.wash;

  return {
    ageGroup: 'adult',
    gender: input.gender,
    ...accents,
    wash,
    band: mood.band,
    motif: mood.motif,
    density: mood.density,
    radius: mood.radius,
    eyebrow: mood.label,
    hudLabel: mood.hudLabel,
    title: isF ? 'PRO · JOUEUSE' : 'MODE PRO.',
    support: isF
      ? 'Forme · carte · coach — cockpit performance féminine.'
      : 'Forme · carte · coach session — ton cockpit de jeu.',
    genderLabel,
    ink: mood.ink,
    inkMuted: mood.inkMuted,
    shellBg: mood.shellBg,
    surface: mood.surface,
    elevated: mood.elevated,
    border: mood.border,
    worldTag: isF ? 'FEMME · 18+' : 'HOMME · 18+',
  };
}

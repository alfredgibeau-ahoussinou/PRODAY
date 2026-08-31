import type { JoueurAgeGroup, JoueurGenderVisual } from '../utils/joueurExperienceTheme';
import { PLAYER_DARK } from '../theme/playerDarkPremium';

/**
 * Tokens Pôle Joueur — dark premium unifié (ref. shield card + performance hub).
 * Copy / hudLabel / density varient par âge×genre ; couleurs = PLAYER_DARK partout.
 */

const MINT = {
  accent: PLAYER_DARK.accent,
  accentBright: PLAYER_DARK.accentAlt,
  soft: PLAYER_DARK.accentSoft,
  glow: PLAYER_DARK.accentGlow,
} as const;

/** Accents unifiés mint — conservé pour compat API. */
export const JOUEUR_GENDER_ACCENTS = {
  male: MINT,
  female: MINT,
  neutral: MINT,
} as const;

/** Accents âge × genre — palette mint unique (dark premium). */
export const JOUEUR_AGE_GENDER_ACCENTS = {
  youth: { male: MINT, female: MINT, neutral: MINT },
  teen: { male: MINT, female: MINT, neutral: MINT },
  adult: { male: MINT, female: MINT, neutral: MINT },
} as const;

const DARK_WASH: [string, string, string] = [
  PLAYER_DARK.bgElevated,
  PLAYER_DARK.bg,
  PLAYER_DARK.bg,
];

const DARK_MOOD = {
  wash: DARK_WASH,
  band: PLAYER_DARK.bgElevated,
  shellBg: PLAYER_DARK.bg,
  ink: PLAYER_DARK.text,
  inkMuted: PLAYER_DARK.textMuted,
  surface: PLAYER_DARK.surface,
  elevated: PLAYER_DARK.surfaceRaised,
  border: PLAYER_DARK.border,
} as const;

export const JOUEUR_AGE_MOODS = {
  youth: {
    id: 'youth' as const,
    label: 'AVENTURE',
    ...DARK_MOOD,
    motif: 'dots' as const,
    density: 'playful' as const,
    radius: 28,
    motion: 'bouncy' as const,
    hudLabel: 'PETIT JEU',
  },
  teen: {
    id: 'teen' as const,
    label: 'CARRIÈRE',
    ...DARK_MOOD,
    motif: 'grid' as const,
    density: 'hud' as const,
    radius: 18,
    motion: 'snappy' as const,
    hudLabel: 'MODE CALME',
  },
  adult: {
    id: 'adult' as const,
    label: 'PRO',
    ...DARK_MOOD,
    motif: 'stripes' as const,
    density: 'pro' as const,
    radius: 14,
    motion: 'snappy' as const,
    hudLabel: 'ÉQUIPE PRO',
  },
} as const;

/** Site tokens partagés — dark premium joueur. */
export const JOUEUR_SITE = {
  bg: PLAYER_DARK.bg,
  surface: PLAYER_DARK.surface,
  elevated: PLAYER_DARK.surfaceRaised,
  panel: PLAYER_DARK.surface,
  border: PLAYER_DARK.border,
  borderStrong: PLAYER_DARK.borderStrong,
  foreground: PLAYER_DARK.text,
  muted: PLAYER_DARK.textMuted,
  dim: PLAYER_DARK.textDim,
  live: '#FB7185',
  warn: '#FBBF24',
  ok: PLAYER_DARK.accentAlt,
  xp: '#FDE68A',
  gold: PLAYER_DARK.accent,
  goldSoft: PLAYER_DARK.accentSoft,
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
  ink: string;
  inkMuted: string;
  shellBg: string;
  surface: string;
  elevated: string;
  border: string;
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
    return {
      ageGroup: 'youth',
      gender: input.gender,
      ...accents,
      wash: mood.wash,
      band: mood.band,
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
      ink: mood.ink,
      inkMuted: mood.inkMuted,
      shellBg: mood.shellBg,
      surface: mood.surface,
      elevated: mood.elevated,
      border: mood.border,
      worldTag: isF ? 'FILLE · -13' : 'GARÇON · -13',
    };
  }

  if (input.ageGroup === 'teen') {
    return {
      ageGroup: 'teen',
      gender: input.gender,
      ...accents,
      wash: mood.wash,
      band: mood.band,
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
      shellBg: mood.shellBg,
      surface: mood.surface,
      elevated: mood.elevated,
      border: mood.border,
      worldTag: isF ? 'FILLE · 13-17' : 'GARÇON · 13-17',
    };
  }

  return {
    ageGroup: 'adult',
    gender: input.gender,
    ...accents,
    wash: mood.wash,
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

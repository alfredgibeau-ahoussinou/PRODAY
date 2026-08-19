/**
 * Dark Premium ProDay — pôle joueur (ref. shield card + performance hub).
 * Tokens statiques, indépendants du contexte React.
 */
export const PLAYER_DARK = {
  bg: '#0A0A0F',
  bgElevated: '#121218',
  surface: '#1A1A24',
  surfaceRaised: '#222230',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  textMuted: '#8B8B9A',
  textDim: 'rgba(139,139,154,0.72)',
  accent: '#00E676',
  accentAlt: '#2DD4BF',
  accentSoft: 'rgba(0,230,118,0.14)',
  accentGlow: 'rgba(45,212,191,0.35)',
  statBlue: '#3B82F6',
  statYellow: '#EAB308',
  statGreen: '#22C55E',
  dockBg: 'rgba(18,18,24,0.96)',
  dockBorder: 'rgba(255,255,255,0.06)',
  cardGradient: ['#1A1A24', '#0A0A0F'] as [string, string],
  shieldGradient: ['#222230', '#121218', '#0A0A0F'] as [string, string, string],
  ratingRing: ['#3B82F6', '#EAB308', '#22C55E', '#2DD4BF', '#00E676'] as [string, string, string, string, string],
} as const;

export const PLAYER_DARK_RADIUS = {
  card: 18,
  shield: 20,
  pill: 999,
  dock: 24,
} as const;

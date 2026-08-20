/**
 * PRODAY Football Hub — identité immersive (violet énergie).
 * Distinct du pôle joueur (pas de champagne / tribune chips).
 */
export const FOOTBALL_HUB = {
  accent: '#3C00F0',
  deep: '#180078',
  bright: '#7C5CFF',
  soft: 'rgba(60, 0, 240, 0.16)',
  glow: 'rgba(60, 0, 240, 0.28)',
  bg: '#050508',
  band: '#0A0A12',
  surface: '#10101A',
  elevated: '#16162A',
  border: 'rgba(124, 92, 255, 0.22)',
  foreground: '#F7F7FF',
  muted: 'rgba(247, 247, 255, 0.55)',
  live: '#22C55E',
  liveSoft: 'rgba(34, 197, 94, 0.18)',
  danger: '#F87171',
  score: '#FFFFFF',
  logoPlaceholder: 'rgba(124, 92, 255, 0.35)',
} as const;

export const FOOTBALL_HUB_COPY = {
  heroTitle: 'Tout le football, au même endroit.',
  heroSubtitle: 'Tes matchs, tes clubs, tes statistiques et les matchs ProDay.',
  emptyLive: 'Aucun match en direct pour le moment.',
  emptyUpcoming: 'Aucun match à venir disponible.',
  emptyProday: 'Aucun match ProDay programmé.',
  emptyFavorites: 'Suis des clubs ou des compétitions pour personnaliser ton fil.',
  emptyVideos: 'Aucune vidéo disponible avec droits de diffusion.',
  emptySearch: 'Aucun résultat. Essaie un autre club ou une compétition.',
  apiBanner: 'Scores externes indisponibles. Les matchs ProDay restent visibles.',
  iaDisclaimer: 'ProDay IA résume uniquement les données disponibles — aucune invention.',
} as const;

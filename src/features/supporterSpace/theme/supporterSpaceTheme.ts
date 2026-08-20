/**
 * Supporter Space V3 — thème immersif football ProDay (violet).
 * Distinct du dashboard admin et du look FIFA générique.
 */
export const SUPPORTER_SPACE = {
  accent: '#3C00F0',
  deep: '#14005C',
  bright: '#8B6CFF',
  soft: 'rgba(60, 0, 240, 0.18)',
  glow: 'rgba(139, 108, 255, 0.32)',
  bg: '#04040A',
  band: '#0B0B14',
  surface: '#12121E',
  elevated: '#1A1A2C',
  border: 'rgba(139, 108, 255, 0.24)',
  foreground: '#F7F7FF',
  muted: 'rgba(247, 247, 255, 0.58)',
  live: '#22C55E',
  liveSoft: 'rgba(34, 197, 94, 0.2)',
  danger: '#F87171',
  score: '#FFFFFF',
  demo: '#FBBF24',
  proday: '#A78BFA',
} as const;

export const SUPPORTER_SPACE_COPY = {
  heroTitle: 'Ton football, en direct.',
  heroSubtitle: 'Live, clubs suivis, matchs ProDay — sans scores inventés.',
  emptyLive: 'Aucun match en direct pour le moment.',
  emptyUpcoming: 'Aucun match à venir.',
  emptyFinished: 'Aucun résultat récent.',
  emptyProday: 'Aucun match ProDay programmé.',
  emptyClubs: 'Suis des clubs pour personnaliser ton espace.',
  emptySearch: 'Aucun résultat. Essaie un autre club ou une compétition.',
  emptyCategory: 'Cette catégorie n’est pas exposée par l’API pour le moment.',
  demoBanner: 'Mode démo (source: demo). Configure Sportmonks pour des scores réels.',
  apiBanner: 'Scores externes indisponibles. Les matchs ProDay restent visibles.',
  searchPlaceholder: 'Clubs, matchs, compétitions…',
  notifStub: 'Notifications — bientôt',
  debateCta: 'Débattre',
} as const;

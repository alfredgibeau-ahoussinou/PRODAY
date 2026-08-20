/**
 * Supporter Space — Live Score UI kit (royal blue / white / yellow).
 * Scoped to supporter space only; does not rewrite the global ProDay brand.
 */
export const SUPPORTER_SPACE = {
  /** Deep royal blue — live cards, selected pills, headers */
  accent: '#1B2A6B',
  deep: '#15225A',
  bright: '#243A8C',
  soft: 'rgba(27, 42, 107, 0.12)',
  glow: 'rgba(27, 42, 107, 0.22)',
  /** Page canvas */
  bg: '#F4F6FA',
  band: '#E8ECF4',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  border: 'rgba(27, 42, 107, 0.12)',
  foreground: '#0F172A',
  muted: '#8B93A7',
  onBlue: '#FFFFFF',
  live: '#E53935',
  liveSoft: 'rgba(229, 57, 53, 0.12)',
  danger: '#E53935',
  score: '#FFFFFF',
  /** Yellow accent for home-side stat bars */
  yellow: '#F5C518',
  demo: '#D97706',
  proday: '#1B2A6B',
  league: '#243A8C',
} as const;

export const SUPPORTER_SPACE_COPY = {
  heroTitle: 'Ton football, en direct.',
  heroSubtitle: 'Matchs ProDay et ligues — données réelles uniquement.',
  welcomeBack: 'Bon retour',
  emptyLive: 'Aucun match en direct pour le moment.',
  emptyUpcoming: 'Aucun match à venir.',
  emptyFinished: 'Aucun résultat récent.',
  emptyProday: 'Aucun match ProDay pour le moment.',
  emptyLeagues: 'Aucun match de ligue pour le moment.',
  emptyLeaguesDate:
    'Aucun match ligue à cette date — change de jour ou regarde « Cette semaine » sur l’Accueil.',
  emptyClubs: 'Suis des clubs pour personnaliser ton espace.',
  emptySearch: 'Aucun résultat. Essaie un autre club ou une compétition.',
  emptyCategory: 'Cette catégorie n’est pas exposée par l’API pour le moment.',
  configureSportmonks: 'Configurer Sportmonks pour les scores ligues.',
  demoBanner: 'Mode démo forcé (EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1).',
  apiBanner: 'Scores ligues indisponibles. Les matchs ProDay restent visibles.',
  /** Shown when token works but preferred majors (Ligue 1…) are outside the plan. */
  planLimitedBanner:
    'Plan Sportmonks limité : pas de Ligue 1 / top 5. Upgrade sur my.sportmonks.com pour les débloquer.',
  searchPlaceholder: 'Clubs, matchs, compétitions…',
  notifStub: 'Notifications — bientôt',
  debateCta: 'Débattre',
  sectionProday: 'Matchs ProDay',
  sectionLeagues: 'Matchs Ligues',
  matchThisWeek: 'Cette semaine',
  liveBadge: 'Live',
  sourceProday: 'ProDay',
  sourceLeagues: 'Ligues',
} as const;

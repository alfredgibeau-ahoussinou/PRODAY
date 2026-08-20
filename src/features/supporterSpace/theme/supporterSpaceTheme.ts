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

/**
 * Match Center + fiche joueur — charcoal / bleu vif / blanc.
 * Ne remplace pas `SUPPORTER_SPACE` sur Accueil / rails.
 */
export const SUPPORTER_SPACE_MATCH = {
  bg: '#0B0D12',
  surface: '#161A22',
  elevated: '#1C212B',
  border: 'rgba(255,255,255,0.08)',
  foreground: '#FFFFFF',
  muted: '#9AA3B5',
  accent: '#2F6BFF',
  accentSoft: 'rgba(47, 107, 255, 0.18)',
  onAccent: '#FFFFFF',
  heroOverlay: 'rgba(11, 13, 18, 0.72)',
  pill: 'rgba(0,0,0,0.45)',
  gaugeTrack: 'rgba(255,255,255,0.12)',
  gaugeBlue: '#2F6BFF',
  gaugeCyan: '#2EC5C0',
  gaugeGreen: '#3DDC97',
  gaugeOrange: '#F5A524',
  gaugeYellow: '#F5C518',
  gaugeRed: '#E53935',
} as const;

export const SUPPORTER_SPACE_COPY = {
  heroTitle: 'Ton football, en direct.',
  heroSubtitle:
    'Sources : APIs officielles agrégées (Sportmonks / football-data) — pas de génération IA ni de recherche web depuis l’app.',
  welcomeBack: 'Bon retour',
  emptyLive: 'Aucun match en direct pour le moment (données API).',
  emptyUpcoming:
    'Aucun match à venir sur cette fenêtre — jour sans calendrier API, pas un suivi cassé.',
  emptyFinished: 'Aucun résultat récent.',
  emptyProday: 'Aucun match ProDay pour le moment.',
  emptyLeagues: 'Aucun match de ligue renvoyé par les APIs pour le moment.',
  emptyLeaguesDate:
    'Aucun match ligue à cette date (calendrier API) — change de jour ou regarde « Cette semaine » sur l’Accueil. Ce n’est pas un bug de suivi.',
  emptyClubs: 'Suis des clubs pour personnaliser ton espace.',
  emptySearch: 'Aucun résultat. Essaie un autre club ou une compétition.',
  emptyCategory: 'Cette catégorie n’est pas exposée par l’API pour le moment.',
  configureSportmonks:
    'Configure Sportmonks et/ou EXPO_PUBLIC_FOOTBALL_DATA_TOKEN (Ligue 1 + Big-5 gratuits via football-data.org).',
  demoBanner: 'Mode démo forcé (EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1).',
  apiBanner: 'Scores ligues indisponibles. Les matchs ProDay restent visibles.',
  /** Shown when Sportmonks Free lacks majors and football-data token is missing. */
  planLimitedBanner:
    'Plan Sportmonks limité : ajoute EXPO_PUBLIC_FOOTBALL_DATA_TOKEN pour Ligue 1 / top 5 (API gratuite), ou upgrade Sportmonks.',
  /** Soft reminder under Accueil banners when APIs are live but lists can still be empty. */
  dataSourceHint:
    'Calendriers et scores = APIs réelles (agrégats officiels). Jour vide = rien de publié. Pas d’invention IA ; une recherche web agent resterait côté serveur allowlist (futur).',
  searchPlaceholder: 'Clubs, matchs, compétitions…',
  notifStub: 'Notifications — bientôt',
  debateCta: 'Débattre',
  sectionProday: 'Matchs ProDay',
  sectionLeagues: 'Matchs Ligues',
  sectionFollowedClubs: 'Mes clubs',
  emptyFollowedClubs:
    'Aucun match API pour tes clubs suivis sur cette période — jour de repos ou hors fenêtre. Le suivi reste actif ; élargis la date si besoin.',
  matchThisWeek: 'Cette semaine',
  liveBadge: 'Live',
  sourceProday: 'ProDay',
  sourceLeagues: 'Ligues',
  matchDetails: 'Détails du match',
  playerRatings: 'Notes des joueurs',
  watchHighlights: 'Voir les highlights',
  headToHead: 'Face à face',
  playerRatingSection: 'Notes du match',
  noPlayerStats: 'Aucune statistique joueur publiée pour ce match.',
  noMatchStats: 'Statistiques non disponibles pour ce match.',
  noEventsYet: 'Pas encore d’événements publiés.',
  noVideoRights: 'Aucune vidéo avec droits de diffusion.',
  positionLabel: 'Poste',
} as const;

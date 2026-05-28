/** Visuels générés (IA) — enrichissement UI sans dépendre de Firebase Storage. */
export const SHOWCASE_IMAGES = {
  discoverHero: require('../../assets/generated/discover-hero-football.png'),
  arenaTournament: require('../../assets/generated/arena-tournament.png'),
  mercatoDetection: require('../../assets/generated/mercato-detection.png'),
  playerProfile: require('../../assets/generated/player-profile-showcase.png'),
  friendlyMatch: require('../../assets/generated/friendly-match.png'),
  coachFounder: require('../../assets/generated/coach-founder.png'),
  /**
   * Expériences interactives (fallbacks provisoires).
   * Remplacer par des images IA dédiées quand disponibles.
   */
  expPulse: require('../../assets/generated/discover-hero-football.png'),
  expArena: require('../../assets/generated/arena-tournament.png'),
  expSponsors: require('../../assets/generated/coach-founder.png'),
  expDiscover: require('../../assets/generated/discover-hero-football.png'),
  expTeam: require('../../assets/generated/friendly-match.png'),
  expProfile: require('../../assets/generated/player-profile-showcase.png'),
  expMessages: require('../../assets/generated/coach-founder.png'),
} as const;

export type ShowcaseImageKey = keyof typeof SHOWCASE_IMAGES;

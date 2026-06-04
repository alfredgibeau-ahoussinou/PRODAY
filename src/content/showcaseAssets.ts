/**
 * Visuels ProDay classique — foot masculin / mixte amateur-pro.
 * Sources : photos Unsplash ; remplaçables via scripts/download-classic-showcase-images.mjs
 */
export const SHOWCASE_IMAGES = {
  discoverHero: require('../../assets/generated/classic/classic-discover-hero.jpg'),
  arenaTournament: require('../../assets/generated/classic/classic-arena.jpg'),
  mercatoDetection: require('../../assets/generated/classic/classic-mercato.jpg'),
  playerProfile: require('../../assets/generated/classic/classic-profile.jpg'),
  friendlyMatch: require('../../assets/generated/classic/classic-match.jpg'),
  coachFounder: require('../../assets/generated/classic/classic-staff.jpg'),
  expPulse: require('../../assets/generated/classic/classic-exp-pulse.jpg'),
  expArena: require('../../assets/generated/classic/classic-exp-arena.jpg'),
  expSponsors: require('../../assets/generated/classic/classic-exp-sponsors.jpg'),
  expDiscover: require('../../assets/generated/classic/classic-exp-discover.jpg'),
  expTeam: require('../../assets/generated/classic/classic-exp-team.jpg'),
  expProfile: require('../../assets/generated/classic/classic-exp-profile.jpg'),
  expMessages: require('../../assets/generated/classic/classic-exp-messages.jpg'),
} as const;

export type ShowcaseImageKey = keyof typeof SHOWCASE_IMAGES;

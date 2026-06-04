/**
 * Visuels ProDay Woman — foot féminin uniquement (terrain, maillots, ballon).
 * Sources vérifiées : Unsplash + Pexels — `node scripts/download-woman-showcase-images.mjs`
 */
export const WOMAN_SHOWCASE_IMAGES = {
  discoverHero: require('../../assets/generated/woman/woman-discover-hero.jpg'),
  arenaTournament: require('../../assets/generated/woman/woman-arena.jpg'),
  mercatoDetection: require('../../assets/generated/woman/woman-mercato.jpg'),
  playerProfile: require('../../assets/generated/woman/woman-profile.jpg'),
  friendlyMatch: require('../../assets/generated/woman/woman-match.jpg'),
  coachFounder: require('../../assets/generated/woman/woman-staff.jpg'),
  expPulse: require('../../assets/generated/woman/woman-exp-pulse.jpg'),
  expArena: require('../../assets/generated/woman/woman-exp-arena.jpg'),
  expSponsors: require('../../assets/generated/woman/woman-exp-sponsors.jpg'),
  expDiscover: require('../../assets/generated/woman/woman-exp-discover.jpg'),
  expTeam: require('../../assets/generated/woman/woman-exp-team.jpg'),
  expProfile: require('../../assets/generated/woman/woman-exp-profile.jpg'),
  expMessages: require('../../assets/generated/woman/woman-exp-messages.jpg'),
} as const;

export type WomanShowcaseImageKey = keyof typeof WOMAN_SHOWCASE_IMAGES;

export type SponsorVisibilityEstimate = {
  activeClubs: number;
  playersReached: number;
  monthlyImpressions: number;
  estimatedClickLeads: number;
  localEventsPerSeason: number;
  coverageLabel: string;
  recommendedBudgetMin: number;
};

/**
 * Calcule l'estimation de visibilité locale en fonction de la formule, des régions et sports sélectionnés.
 */
export function calculateSponsorVisibility(
  packageTier: string,
  regionsCount: number,
  sportsCount: number,
  budgetStr?: string,
): SponsorVisibilityEstimate {
  const normRegions = Math.max(1, regionsCount);
  const normSports = Math.max(1, sportsCount);

  let baseClubs = 12;
  let basePlayers = 1800;
  let impressionsMultiplier = 8;
  let coverageLabel = "1 Ville & clubs de proximité";
  let recommendedBudgetMin = 0;

  if (packageTier === "territorial") {
    baseClubs = 45 * normRegions;
    basePlayers = 6500 * normRegions;
    impressionsMultiplier = 12;
    coverageLabel = `${normRegions} Département(s) / Territoire`;
    recommendedBudgetMin = 49;
  } else if (packageTier === "national") {
    baseClubs = 280 * Math.min(5, normRegions);
    basePlayers = 42000 * Math.min(5, normRegions);
    impressionsMultiplier = 18;
    coverageLabel = "France entière (National Pro)";
    recommendedBudgetMin = 99;
  } else if (packageTier === "custom") {
    baseClubs = 120 * normRegions;
    basePlayers = 22000 * normRegions;
    impressionsMultiplier = 15;
    coverageLabel = "Sur mesure multi-territoires";
    recommendedBudgetMin = 250;
  }

  // Facteur sport
  const sportsFactor = 1 + (normSports - 1) * 0.25;
  const activeClubs = Math.round(baseClubs * sportsFactor);
  const playersReached = Math.round(basePlayers * sportsFactor);
  const monthlyImpressions = Math.round(playersReached * impressionsMultiplier);
  const estimatedClickLeads = Math.round(monthlyImpressions * 0.024); // ~2.4% CTR/engagement
  const localEventsPerSeason = Math.round(activeClubs * 4.5);

  return {
    activeClubs,
    playersReached,
    monthlyImpressions,
    estimatedClickLeads,
    localEventsPerSeason,
    coverageLabel,
    recommendedBudgetMin,
  };
}

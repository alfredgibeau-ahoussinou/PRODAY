import { useMemo } from 'react';
import { useAppTheme } from '../context/ProductLineContext';
import { useSessionProfile } from './useSessionProfile';
import { getSponsorAppColors, isSponsorRole } from '../content/sponsorExperience';
import type { AppColors } from '../theme/universeTheme';

/** Thème actif selon le rôle (partenaire = sombre Pro). */
export function useExperienceTheme() {
  const app = useAppTheme();
  const profile = useSessionProfile();
  const isSponsorExperience = isSponsorRole(profile?.role);

  const colors: AppColors = useMemo(
    () => (isSponsorExperience ? getSponsorAppColors() : app.colors),
    [isSponsorExperience, app.colors]
  );

  return {
    ...app,
    colors,
    isSponsorExperience,
  };
}

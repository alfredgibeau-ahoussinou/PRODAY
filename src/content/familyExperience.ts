import type { ProductLineId } from '../models/ProductLine';
import type { User } from '../models/User';
import type { MainTabId } from '../navigation/mainTabConfig';
import { isMinorUser } from '../utils/minor';
import { isMedicalPractitionerRole } from './medicalExperience';
import { isSponsorRole } from './sponsorExperience';

/** Espace Famille visible sur les lignes joueur (homme / femme / amateur / pro). */
export function shouldShowFamilyTab(
  profile: User | null | undefined,
  line: ProductLineId,
): boolean {
  if (!profile) return false;
  if (profile.role !== 'player') return false;
  if (line !== 'homme' && line !== 'woman' && line !== 'amateur' && line !== 'pro') return false;
  if (isSponsorRole(profile.role) || isMedicalPractitionerRole(profile.role)) return false;
  return isMinorUser(profile);
}

/** Insère l’onglet Famille avant Profil. */
export function injectFamilyTab(
  tabs: MainTabId[],
  profile: User | null | undefined,
  line: ProductLineId,
): MainTabId[] {
  if (!shouldShowFamilyTab(profile, line) || tabs.includes('famille')) return tabs;
  const profilIndex = tabs.indexOf('profil');
  const insertAt = profilIndex >= 0 ? profilIndex : tabs.length;
  const next = [...tabs];
  next.splice(insertAt, 0, 'famille');
  return next;
}

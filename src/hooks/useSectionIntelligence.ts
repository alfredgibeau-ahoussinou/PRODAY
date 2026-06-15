import { useMemo } from 'react';
import type { User } from '../models/User';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { ProductLineId } from '../models/ProductLine';
import { isV3IntelligenceUiEnabled } from '../config/featureFlags';
import { buildSectionIntelligence } from '../features/v3/engines/sectionIntelligence.engine';
import type { SectionIntelligence } from '../features/v3/models/sectionIntelligence';
import { useProDayBrain } from './useProDayBrain';

export interface SectionIntelligenceOverrides {
  pendingConvocations?: number;
  openMatches?: number;
  liveMatches?: number;
  mercatoPosts?: number;
  availableRides?: number;
  unreadMessages?: number;
  pendingAppointments?: number;
  todayAppointments?: number;
  sponsorLeads?: number;
  activeOffers?: number;
  staffMode?: boolean;
  mercatoApplications?: number;
}

/** Insights contextuels par onglet — désactivé tant que l’UI n’est pas affichée. */
export function useSectionIntelligence(
  tab: MainTabId,
  profile: User | null,
  productLine: ProductLineId,
  overrides: SectionIntelligenceOverrides = {}
): SectionIntelligence | null {
  const uiEnabled = isV3IntelligenceUiEnabled();
  const brain = useProDayBrain(uiEnabled ? profile : null, productLine);

  return useMemo(() => {
    if (!uiEnabled || !profile) return null;
    return buildSectionIntelligence({
      tab,
      healthState: brain.ai.health.state,
      coachMessage: brain.ai.health.coachMessage,
      pendingConvocations: overrides.pendingConvocations,
      openMatches: overrides.openMatches ?? brain.ai.matchRecommendations.length,
      liveMatches: overrides.liveMatches,
      mercatoPosts: overrides.mercatoPosts,
      unreadMessages:
        overrides.unreadMessages ??
        brain.notifications.push.length + brain.notifications.inbox.length,
      nearbyMatches: brain.geoDensity.matchesNearby,
      availableRides: overrides.availableRides,
      progressionLevel: brain.progression.level,
      streakDays: brain.progression.streakDays,
      globalScore: brain.ai.dynamicScore,
      city: profile.city,
      pendingAppointments: overrides.pendingAppointments,
      todayAppointments: overrides.todayAppointments,
      sponsorLeads: overrides.sponsorLeads,
      activeOffers: overrides.activeOffers,
      staffMode: overrides.staffMode,
      mercatoApplications: overrides.mercatoApplications,
    });
  }, [uiEnabled, tab, brain, overrides, profile]);
}

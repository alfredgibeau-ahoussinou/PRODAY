import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADMIN_FOC_NAV,
  DEFAULT_FOC_DASHBOARD_ORDER,
  migrateAdminFocSectionId,
  type AdminFocSectionId,
  type FocDashboardBlockId,
} from '../navigation/adminFocConfig';
import { CLUB_SITE } from '../content/clubPageIdentity';

const KEY = 'proday_admin_foc_prefs_v2';

export type AdminFocDensity = 'comfortable' | 'compact';

export type AdminFocPreferences = {
  primaryColor: string;
  secondaryColor: string;
  pitchAccent: boolean;
  density: AdminFocDensity;
  clubDisplayName: string;
  sidebarCollapsed: boolean;
  sectionOrder: AdminFocSectionId[];
  hiddenSections: AdminFocSectionId[];
  dashboardOrder: FocDashboardBlockId[];
};

export const DEFAULT_ADMIN_FOC_PREFS: AdminFocPreferences = {
  primaryColor: CLUB_SITE.accent,
  secondaryColor: CLUB_SITE.pitchLight,
  pitchAccent: true,
  density: 'comfortable',
  clubDisplayName: 'ProDay',
  sidebarCollapsed: false,
  sectionOrder: ADMIN_FOC_NAV.map((n) => n.id),
  hiddenSections: [],
  dashboardOrder: [...DEFAULT_FOC_DASHBOARD_ORDER],
};

export async function loadAdminFocPreferences(uid: string): Promise<AdminFocPreferences> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY}:${uid}`);
    if (!raw) return { ...DEFAULT_ADMIN_FOC_PREFS };
    const parsed = JSON.parse(raw) as Partial<AdminFocPreferences>;
    const validIds = new Set(ADMIN_FOC_NAV.map((n) => n.id));
    const migrate = (id: string): AdminFocSectionId | null => {
      const next = migrateAdminFocSectionId(id);
      return validIds.has(next) ? next : null;
    };
    const sectionOrder = (parsed.sectionOrder ?? DEFAULT_ADMIN_FOC_PREFS.sectionOrder)
      .map((id) => migrate(String(id)))
      .filter((id): id is AdminFocSectionId => id != null);
    const dedupedOrder = sectionOrder.filter(
      (id, index) => sectionOrder.indexOf(id) === index,
    );
    return {
      ...DEFAULT_ADMIN_FOC_PREFS,
      ...parsed,
      sectionOrder: dedupedOrder.length ? dedupedOrder : DEFAULT_ADMIN_FOC_PREFS.sectionOrder,
      dashboardOrder: parsed.dashboardOrder?.length
        ? parsed.dashboardOrder
        : DEFAULT_ADMIN_FOC_PREFS.dashboardOrder,
      hiddenSections: (parsed.hiddenSections ?? [])
        .map((id) => migrate(String(id)))
        .filter((id): id is AdminFocSectionId => id != null)
        .filter((id, index, arr) => arr.indexOf(id) === index),
    };
  } catch {
    return { ...DEFAULT_ADMIN_FOC_PREFS };
  }
}

export async function saveAdminFocPreferences(
  uid: string,
  prefs: AdminFocPreferences,
): Promise<void> {
  await AsyncStorage.setItem(`${KEY}:${uid}`, JSON.stringify(prefs));
}

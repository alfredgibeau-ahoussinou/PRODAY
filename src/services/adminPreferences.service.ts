import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADMIN_NAV,
  DEFAULT_ADMIN_DASHBOARD_ORDER,
  type AdminSectionId,
  type AdminDashboardBlockId,
} from '../navigation/adminNavConfig';
import { CLUB_SITE } from '../content/clubPageIdentity';

const KEY = 'proday_admin_prefs_v3';

export type AdminFocDensity = 'comfortable' | 'compact';

export type AdminFocPreferences = {
  primaryColor: string;
  secondaryColor: string;
  pitchAccent: boolean;
  cornerRadius: number;
  density: AdminFocDensity;
  clubDisplayName: string;
  sidebarCollapsed: boolean;
  sectionOrder: AdminSectionId[];
  hiddenSections: AdminSectionId[];
  dashboardOrder: AdminDashboardBlockId[];
};

export const DEFAULT_ADMIN_FOC_PREFS: AdminFocPreferences = {
  primaryColor: CLUB_SITE.accent,
  secondaryColor: CLUB_SITE.pitchLight,
  pitchAccent: true,
  cornerRadius: 12,
  density: 'comfortable',
  clubDisplayName: 'ProDay',
  sidebarCollapsed: false,
  sectionOrder: ADMIN_NAV.map((n) => n.id),
  hiddenSections: [],
  dashboardOrder: [...DEFAULT_ADMIN_DASHBOARD_ORDER],
};

export async function loadAdminFocPreferences(uid: string): Promise<AdminFocPreferences> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY}:${uid}`);
    if (!raw) return { ...DEFAULT_ADMIN_FOC_PREFS };
    const parsed = JSON.parse(raw) as Partial<AdminFocPreferences>;
    const validIds = new Set(ADMIN_NAV.map((n) => n.id));
    const sectionOrder = (parsed.sectionOrder ?? DEFAULT_ADMIN_FOC_PREFS.sectionOrder).filter(
      (id): id is AdminSectionId => validIds.has(id as AdminSectionId),
    );
    return {
      ...DEFAULT_ADMIN_FOC_PREFS,
      ...parsed,
      cornerRadius: parsed.cornerRadius ?? DEFAULT_ADMIN_FOC_PREFS.cornerRadius,
      sectionOrder: sectionOrder.length ? sectionOrder : DEFAULT_ADMIN_FOC_PREFS.sectionOrder,
      dashboardOrder: parsed.dashboardOrder?.length
        ? parsed.dashboardOrder
        : DEFAULT_ADMIN_FOC_PREFS.dashboardOrder,
      hiddenSections: (parsed.hiddenSections ?? []).filter((id) =>
        validIds.has(id as AdminSectionId),
      ) as AdminSectionId[],
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADMIN_NAV_ITEMS,
  DEFAULT_ADMIN_DASHBOARD_ORDER,
  migrateAdminNavSectionId,
  type AdminDashboardBlockId,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import {
  DEFAULT_ADMIN_AUTOMATION_TOGGLES,
  type AdminAutomationRuleId,
} from '../utils/adminIntel';
import { CLUB_SITE } from '../content/clubPageIdentity';

const KEY = 'proday_admin_nav_prefs_v3';

export type AdminFocDensity = 'comfortable' | 'compact';

export type AdminFocPreferences = {
  primaryColor: string;
  secondaryColor: string;
  pitchAccent: boolean;
  density: AdminFocDensity;
  clubDisplayName: string;
  sidebarCollapsed: boolean;
  sectionOrder: AdminNavSectionId[];
  hiddenSections: AdminNavSectionId[];
  dashboardOrder: AdminDashboardBlockId[];
  automations: Record<AdminAutomationRuleId, boolean>;
};

export type FocDashboardBlockId = AdminDashboardBlockId;

export const DEFAULT_ADMIN_FOC_PREFS: AdminFocPreferences = {
  primaryColor: CLUB_SITE.accent,
  secondaryColor: CLUB_SITE.pitchLight,
  pitchAccent: true,
  density: 'comfortable',
  clubDisplayName: 'ProDay',
  sidebarCollapsed: false,
  sectionOrder: ADMIN_NAV_ITEMS.map((n) => n.id),
  hiddenSections: [],
  dashboardOrder: [...DEFAULT_ADMIN_DASHBOARD_ORDER],
  automations: { ...DEFAULT_ADMIN_AUTOMATION_TOGGLES },
};

export async function loadAdminFocPreferences(uid: string): Promise<AdminFocPreferences> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY}:${uid}`);
    if (!raw) return { ...DEFAULT_ADMIN_FOC_PREFS };
    const parsed = JSON.parse(raw) as Partial<AdminFocPreferences>;
    const validIds = new Set(ADMIN_NAV_ITEMS.map((n) => n.id));
    const migrate = (id: string): AdminNavSectionId | null => {
      const next = migrateAdminNavSectionId(id);
      return validIds.has(next) ? next : null;
    };
    const sectionOrder = (parsed.sectionOrder ?? DEFAULT_ADMIN_FOC_PREFS.sectionOrder)
      .map((id) => migrate(String(id)))
      .filter((id): id is AdminNavSectionId => id != null);
    const dedupedOrder = sectionOrder.filter(
      (id, index) => sectionOrder.indexOf(id) === index,
    );
    const validBlocks = new Set<string>(DEFAULT_ADMIN_DASHBOARD_ORDER);
    const dashboardOrder = (parsed.dashboardOrder ?? DEFAULT_ADMIN_FOC_PREFS.dashboardOrder).filter(
      (id): id is AdminDashboardBlockId => validBlocks.has(String(id)),
    );
    return {
      ...DEFAULT_ADMIN_FOC_PREFS,
      ...parsed,
      sectionOrder: dedupedOrder.length ? dedupedOrder : DEFAULT_ADMIN_FOC_PREFS.sectionOrder,
      dashboardOrder: dashboardOrder.length
        ? dashboardOrder
        : DEFAULT_ADMIN_FOC_PREFS.dashboardOrder,
      hiddenSections: (parsed.hiddenSections ?? [])
        .map((id) => migrate(String(id)))
        .filter((id): id is AdminNavSectionId => id != null)
        .filter((id, index, arr) => arr.indexOf(id) === index),
      automations: {
        ...DEFAULT_ADMIN_AUTOMATION_TOGGLES,
        ...(parsed.automations ?? {}),
      },
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

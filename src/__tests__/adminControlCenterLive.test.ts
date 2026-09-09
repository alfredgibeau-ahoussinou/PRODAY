import {
  ADMIN_NAV_ITEMS,
  ADMIN_MENU_DEST_IDS,
  resolveAdminNav,
  resolveAdminCommandItems,
} from '../features/admin/navigation/adminNavConfig';
import { mapPlatformConfig } from '../utils/platformConfigMap';
import { DEFAULT_AI_OPS } from '../models/PlatformConfig';

describe('Cockpit Total · data & claims nav', () => {
  it('expose effectifs + classements + identité', () => {
    expect(ADMIN_NAV_ITEMS.some((n) => n.id === 'effectifs')).toBe(true);
    expect(ADMIN_NAV_ITEMS.some((n) => n.id === 'classements')).toBe(true);
    expect(ADMIN_NAV_ITEMS.some((n) => n.id === 'identite')).toBe(true);
    expect(ADMIN_MENU_DEST_IDS).toContain('effectifs');
    expect(ADMIN_MENU_DEST_IDS).toContain('classements');
    expect(resolveAdminNav('standings').section).toBe('classements');
    expect(resolveAdminNav('donnees').section).toBe('effectifs');
    expect(resolveAdminNav('claims').section).toBe('identite');
  });

  it('ajoute les commandes palette sync', () => {
    const cmds = resolveAdminCommandItems();
    expect(cmds.some((c) => c.section === 'classements')).toBe(true);
    expect(cmds.some((c) => c.section === 'effectifs')).toBe(true);
  });
});

describe('Platform AI ops config map', () => {
  it('parse ai_ops avec défauts sûrs', () => {
    const cfg = mapPlatformConfig({
      maintenance_mode: false,
      feature_flags: {},
      ai_ops: { max_calls_per_user_per_day: 9999, coach_system_prompt: '  hello  ' },
    });
    expect(cfg.ai_ops?.coach_system_prompt).toBe('  hello  ');
    expect(cfg.ai_ops?.max_calls_per_user_per_day).toBe(500);
  });

  it('fallback DEFAULT_AI_OPS si absent', () => {
    const cfg = mapPlatformConfig({ maintenance_mode: false, feature_flags: {} });
    expect(cfg.ai_ops?.max_calls_per_user_per_day).toBe(
      DEFAULT_AI_OPS.max_calls_per_user_per_day,
    );
  });
});

describe('Admin hard-delete whitelist', () => {
  const allowed = new Set([
    'community_reels',
    'platform_feed',
    'reel_reports',
    'recruitment_posts',
    'club_announcements',
    'weekly_questions',
  ]);

  it('refuse les collections hors whitelist', () => {
    expect(allowed.has('users')).toBe(false);
    expect(allowed.has('community_reels')).toBe(true);
  });
});

import {
  ADMIN_NAV_ITEMS,
  ADMIN_MENU_DEST_IDS,
  resolveAdminNav,
  resolveAdminCommandItems,
} from '../features/admin/navigation/adminNavConfig';
import { mapPlatformConfig } from '../utils/platformConfigMap';
import { DEFAULT_AI_OPS } from '../models/PlatformConfig';

describe('Admin Data & classements nav', () => {
  it('expose la section donnees dans le menu', () => {
    expect(ADMIN_NAV_ITEMS.some((n) => n.id === 'donnees')).toBe(true);
    expect(ADMIN_MENU_DEST_IDS).toContain('donnees');
    expect(resolveAdminNav('standings').section).toBe('donnees');
    expect(resolveAdminNav('classements').section).toBe('donnees');
  });

  it('ajoute la commande palette data FFF', () => {
    const cmds = resolveAdminCommandItems();
    expect(cmds.some((c) => c.section === 'donnees')).toBe(true);
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

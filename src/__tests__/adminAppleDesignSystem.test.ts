import { ADMIN_TOKENS, resolveAdminTokens } from '../features/admin/theme/adminTokens';
import {
  adminChrome,
  adminRadius,
  adminSpace,
  adminType,
} from '../features/admin/theme/adminDesignSystem';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  resolveAdminNav,
  resolveAdminCommandItems,
  isAdminNavSectionId,
} from '../features/admin/navigation/adminNavConfig';
import { APPLE_FONT_STACK } from '../theme/appleTypography';

describe('Platform Admin — Apple-Inspired Visual Identity & Architecture', () => {
  describe('1. Apple Color System & Tokens', () => {
    it('uses Apple System Blue as primary interactive accent', () => {
      expect(ADMIN_TOKENS.accent).toBe('#0A84FF');
      expect(ADMIN_TOKENS.accentHot).toBe('#0A84FF');
      expect(ADMIN_TOKENS.signal).toBe('#0A84FF');
      expect(ADMIN_TOKENS.accentSoft).toContain('rgba(10, 132, 255');
    });

    it('uses standard Apple semantic colors for success, warning, and danger', () => {
      expect(ADMIN_TOKENS.success).toBe('#30D158');
      expect(ADMIN_TOKENS.warn).toBe('#FF9F0A');
      expect(ADMIN_TOKENS.danger).toBe('#FF453A');
      expect(ADMIN_TOKENS.info).toBe('#0A84FF');
    });

    it('provides layered dark Apple system surfaces', () => {
      expect(ADMIN_TOKENS.bg).toBe('#080C14');
      expect(ADMIN_TOKENS.surface).toBe('#161922');
      expect(ADMIN_TOKENS.surfaceRaised).toContain('rgba(38, 42, 54');
    });
  });

  describe('2. Apple SF Typography & Geometry', () => {
    it('uses Apple typography stack centrally across all variants', () => {
      expect(adminType.display.fontFamily).toBe(APPLE_FONT_STACK.display);
      expect(adminType.h1.fontFamily).toBe(APPLE_FONT_STACK.display);
      expect(adminType.h2.fontFamily).toBe(APPLE_FONT_STACK.system);
      expect(adminType.body.fontFamily).toBe(APPLE_FONT_STACK.system);
      expect(adminType.mono.fontFamily).toBe(APPLE_FONT_STACK.mono);
    });

    it('applies calibrated Apple squircle radii and spacing', () => {
      expect(adminRadius.sm).toBe(8);
      expect(adminRadius.md).toBe(12);
      expect(adminRadius.lg).toBe(14);
      expect(adminRadius.hero).toBe(16);
      expect(adminRadius.pill).toBe(999);
      expect(adminSpace.lg).toBe(16);
      expect(adminSpace.xl).toBe(24);
    });
  });

  describe('3. Information Architecture — 7 Administrative Task Domains', () => {
    it('groups all sections into the 7 clear administrative task domains', () => {
      const groupIds = ADMIN_NAV_GROUPS.map((g) => g.id);
      expect(groupIds).toEqual([
        'command',
        'people',
        'orgs',
        'fff',
        'business',
        'content',
        'platform',
      ]);
    });

    it('provides complete routing coverage for all platform admin capabilities', () => {
      expect(isAdminNavSectionId('overview')).toBe(true);
      expect(isAdminNavSectionId('queue')).toBe(true);
      expect(isAdminNavSectionId('health')).toBe(true);
      expect(isAdminNavSectionId('audit')).toBe(true);
      expect(isAdminNavSectionId('users')).toBe(true);
      expect(isAdminNavSectionId('user_create')).toBe(true);
      expect(isAdminNavSectionId('verifications')).toBe(true);
      expect(isAdminNavSectionId('memberships')).toBe(true);
      expect(isAdminNavSectionId('beta')).toBe(true);
      expect(isAdminNavSectionId('clubs')).toBe(true);
      expect(isAdminNavSectionId('club_create')).toBe(true);
      expect(isAdminNavSectionId('teams')).toBe(true);
      expect(isAdminNavSectionId('cameras')).toBe(true);
      expect(isAdminNavSectionId('claims')).toBe(true);
      expect(isAdminNavSectionId('effectifs')).toBe(true);
      expect(isAdminNavSectionId('classements')).toBe(true);
      expect(isAdminNavSectionId('directory')).toBe(true);
      expect(isAdminNavSectionId('sync')).toBe(true);
      expect(isAdminNavSectionId('payments')).toBe(true);
      expect(isAdminNavSectionId('subscriptions')).toBe(true);
      expect(isAdminNavSectionId('quotes')).toBe(true);
      expect(isAdminNavSectionId('sponsor_quotes')).toBe(true);
      expect(isAdminNavSectionId('shop')).toBe(true);
      expect(isAdminNavSectionId('sponsors')).toBe(true);
      expect(isAdminNavSectionId('reels')).toBe(true);
      expect(isAdminNavSectionId('feed')).toBe(true);
      expect(isAdminNavSectionId('messages')).toBe(true);
      expect(isAdminNavSectionId('stages')).toBe(true);
      expect(isAdminNavSectionId('recruitment')).toBe(true);
      expect(isAdminNavSectionId('config')).toBe(true);
      expect(isAdminNavSectionId('traffic')).toBe(true);
      expect(isAdminNavSectionId('tournaments')).toBe(true);
    });

    it('resolves legacy routes transparently to new administrative modules', () => {
      expect(resolveAdminNav('cockpit').section).toBe('overview');
      expect(resolveAdminNav('comptes').section).toBe('users');
      expect(resolveAdminNav('devis_sponsors').section).toBe('sponsor_quotes');
      expect(resolveAdminNav('securite').section).toBe('verifications');
    });

    it('provides fast shortcuts in the command palette', () => {
      const items = resolveAdminCommandItems();
      expect(items.length).toBeGreaterThanOrEqual(ADMIN_NAV_ITEMS.length);
      expect(items.some((i) => i.id === 'cmd-claims')).toBe(true);
      expect(items.some((i) => i.id === 'cmd-standings')).toBe(true);
      expect(items.some((i) => i.id === 'cmd-users')).toBe(true);
    });
  });

  describe('4. Liquid Glass Integration & Responsive Breakpoints', () => {
    it('defines responsive layout thresholds for sidebar and top bar', () => {
      expect(adminChrome.wideBreakpoint).toBe(920);
      expect(adminChrome.tabletBreakpoint).toBe(700);
      expect(adminChrome.sidebarExpanded).toBe(228);
      expect(adminChrome.brandMark).toBe('ESPACE ADMIN');
    });

    it('supports seamless transition between glass and opaque modes', () => {
      const glass = resolveAdminTokens(true, 'regular');
      const opaque = resolveAdminTokens(false);

      expect(glass.isGlass).toBe(true);
      expect(opaque.isGlass).toBe(false);
      expect(glass.accent).toBe(opaque.accent);
      expect(glass.foreground).toBe(opaque.foreground);
    });
  });
});

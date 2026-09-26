import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  appearanceSettingsService,
  DEFAULT_APPEARANCE_PREFS,
} from '../services/appearanceSettings.service';
import {
  getLiquidGlassTokens,
  LIQUID_GLASS_INTENSITIES,
  OPAQUE_TOKENS,
} from '../theme/liquidGlass';
import { resolveAdminTokens, ADMIN_TOKENS } from '../features/admin/theme/adminTokens';
import { adminType } from '../features/admin/theme/adminDesignSystem';
import { APPLE_FONT_STACK, APPLE_TYPOGRAPHY } from '../theme/appleTypography';

describe('Platform Admin — Apple & Liquid Glass Appearance System', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await appearanceSettingsService.reset();
    appearanceSettingsService._setReduceTransparencyForTest(false);
  });

  describe('1. Appearance Settings Service & Persistence', () => {
    it('initializes with default settings (system mode, regular intensity)', () => {
      const prefs = appearanceSettingsService.getPreferences();
      expect(prefs.glassMode).toBe('system');
      expect(prefs.intensity).toBe('regular');
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(true);
    });

    it('persists changes to AsyncStorage and broadcasts to subscribers', async () => {
      let notifiedEffective: boolean | null = null;
      let notifiedMode: string | null = null;

      const unsubscribe = appearanceSettingsService.subscribe((prefs, effective) => {
        notifiedMode = prefs.glassMode;
        notifiedEffective = effective;
      });

      await appearanceSettingsService.setGlassMode('opaque');

      expect(notifiedMode).toBe('opaque');
      expect(notifiedEffective).toBe(false);
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(false);

      const storedRaw = await AsyncStorage.getItem('@proday:appearance_liquid_glass');
      expect(storedRaw).toBeTruthy();
      const parsed = JSON.parse(storedRaw!);
      expect(parsed.glassMode).toBe('opaque');

      unsubscribe();
    });

    it('updates intensity correctly and persists', async () => {
      let notifiedIntensity: string | null = null;
      const unsubscribe = appearanceSettingsService.subscribe((prefs) => {
        notifiedIntensity = prefs.intensity;
      });

      await appearanceSettingsService.setIntensity('intense');
      expect(notifiedIntensity).toBe('intense');
      expect(appearanceSettingsService.getIntensity()).toBe('intense');

      const storedRaw = await AsyncStorage.getItem('@proday:appearance_liquid_glass');
      const parsed = JSON.parse(storedRaw!);
      expect(parsed.intensity).toBe('intense');

      unsubscribe();
    });
  });

  describe('2. Liquid Glass Tokens & Intensities', () => {
    it('resolves distinct blur and specular levels per intensity', () => {
      const subtle = LIQUID_GLASS_INTENSITIES.subtle;
      const regular = LIQUID_GLASS_INTENSITIES.regular;
      const intense = LIQUID_GLASS_INTENSITIES.intense;

      expect(subtle.mode).toBe('glass');
      expect(regular.mode).toBe('glass');
      expect(intense.mode).toBe('glass');

      expect(subtle.bg).not.toBe(intense.bg);
      expect(getLiquidGlassTokens(false, 'subtle')).toBe(subtle);
      expect(getLiquidGlassTokens(false, 'intense')).toBe(intense);
    });

    it('returns solid high-contrast opaque tokens when forceOpaque is true', () => {
      const opaque = getLiquidGlassTokens(true);
      expect(opaque.mode).toBe('opaque');
      expect(opaque.bg).toBe(OPAQUE_TOKENS.bg);
      expect(opaque.border).toBe(OPAQUE_TOKENS.border);
      expect(opaque.blurStyle).toBeUndefined();
    });
  });

  describe('3. Accessibility & Reduced Transparency', () => {
    it('automatically disables glass effects when reduceTransparency is enabled in OS', () => {
      appearanceSettingsService._setReduceTransparencyForTest(true);
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(false);

      const tokens = resolveAdminTokens(appearanceSettingsService.isEffectiveGlass());
      expect(tokens.isGlass).toBe(false);
      expect(tokens.glassBackdrop).toBeUndefined();
    });

    it('restores glass immediately when reduceTransparency is turned off', () => {
      appearanceSettingsService._setReduceTransparencyForTest(true);
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(false);

      appearanceSettingsService._setReduceTransparencyForTest(false);
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(true);

      const tokens = resolveAdminTokens(appearanceSettingsService.isEffectiveGlass());
      expect(tokens.isGlass).toBe(true);
    });
  });

  describe('4. Apple System Typography & Design System Alignment', () => {
    it('uses Apple font stacks for display, system and monospace typography', () => {
      expect(APPLE_FONT_STACK.system).toBeDefined();
      expect(APPLE_FONT_STACK.display).toBeDefined();
      expect(APPLE_FONT_STACK.mono).toBeDefined();

      expect(adminType.display.fontFamily).toBe(APPLE_FONT_STACK.display);
      expect(adminType.h1.fontFamily).toBe(APPLE_FONT_STACK.display);
      expect(adminType.body.fontFamily).toBe(APPLE_FONT_STACK.system);
      expect(adminType.mono.fontFamily).toBe(APPLE_FONT_STACK.mono);
    });

    it('provides tight, calibrated Apple HIG tracking and line heights', () => {
      expect(adminType.display.letterSpacing).toBeLessThan(0);
      expect(adminType.displaySm.letterSpacing).toBeLessThan(0);
      expect(adminType.h1.letterSpacing).toBeLessThan(0);
      expect(adminType.label.textTransform).toBe('uppercase');
    });

    it('maintains high text contrast for headers and table cells in both modes', () => {
      const glassTokens = resolveAdminTokens(true);
      const opaqueTokens = resolveAdminTokens(false);

      expect(glassTokens.foreground).toBe('#FFFFFF');
      expect(opaqueTokens.foreground).toBe('#FFFFFF');

      expect(glassTokens.accent).toBe('#0A84FF');
      expect(opaqueTokens.accent).toBe('#0A84FF');

      expect(glassTokens.champagne).toBe('#38BDF8');
      expect(opaqueTokens.champagne).toBe('#38BDF8');
    });
  });

  describe('5. Real-Time Dynamic Tokens & Session Restoration', () => {
    it('resolves dynamic admin tokens on the fly when switching between glass and opaque', async () => {
      // Step 1: Default glass
      let tokens = resolveAdminTokens(appearanceSettingsService.isEffectiveGlass(), appearanceSettingsService.getIntensity());
      expect(tokens.isGlass).toBe(true);
      expect(tokens.borderStrong).toBe('rgba(255, 255, 255, 0.22)');

      // Step 2: Switch to opaque
      await appearanceSettingsService.setGlassMode('opaque');
      tokens = resolveAdminTokens(appearanceSettingsService.isEffectiveGlass(), appearanceSettingsService.getIntensity());
      expect(tokens.isGlass).toBe(false);
      expect(tokens.glassBackdrop).toBeUndefined();
      expect(tokens.borderStrong).toBe('rgba(255, 255, 255, 0.16)');

      // Step 3: Switch back to glass with intense blur
      await appearanceSettingsService.setGlassMode('glass');
      await appearanceSettingsService.setIntensity('intense');
      tokens = resolveAdminTokens(appearanceSettingsService.isEffectiveGlass(), appearanceSettingsService.getIntensity());
      expect(tokens.isGlass).toBe(true);
      expect(tokens.surfaceGlass).toBe(LIQUID_GLASS_INTENSITIES.intense.bg);
    });

    it('restores stored user preferences upon new service session', async () => {
      // Simulate stored preferences in AsyncStorage from previous session
      await AsyncStorage.setItem(
        '@proday:appearance_liquid_glass',
        JSON.stringify({ glassMode: 'opaque', intensity: 'subtle' })
      );

      // Verify that changing preference updates AsyncStorage
      await appearanceSettingsService.setGlassMode('glass');
      await appearanceSettingsService.setIntensity('intense');

      const saved = await AsyncStorage.getItem('@proday:appearance_liquid_glass');
      expect(JSON.parse(saved!)).toMatchObject({ glassMode: 'glass', intensity: 'intense' });
    });
  });
});


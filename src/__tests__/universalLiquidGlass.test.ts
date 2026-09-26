import {
  getLiquidGlassTokens,
  LIQUID_GLASS_INTENSITIES_DARK,
  LIQUID_GLASS_INTENSITIES_LIGHT,
  OPAQUE_TOKENS_DARK,
  OPAQUE_TOKENS_LIGHT,
} from '../theme/liquidGlass';
import {
  appearanceSettingsService,
  DEFAULT_APPEARANCE_PREFS,
} from '../services/appearanceSettings.service';

describe('Universal Liquid Glass Visual System & Appearance Unification', () => {
  beforeEach(async () => {
    await appearanceSettingsService.reset();
    appearanceSettingsService._setReduceTransparencyForTest(false);
    appearanceSettingsService._setReduceMotionForTest(false);
  });

  describe('1. Token Architecture & Multi-Palette Liquid Glass', () => {
    it('returns regular dark glass tokens by default', () => {
      const tokens = getLiquidGlassTokens();
      expect(tokens.mode).toBe('glass');
      expect(tokens.isLight).toBe(false);
      expect(tokens.accent).toBe('#00F0A8');
      expect(tokens.text).toBe('#FFFFFF');
      expect(tokens.border).toBeDefined();
      expect(tokens.specularTop).toBeDefined();
    });

    it('returns light glass tokens when isLight is true', () => {
      const tokens = getLiquidGlassTokens(false, 'regular', true);
      expect(tokens.mode).toBe('glass');
      expect(tokens.isLight).toBe(true);
      expect(tokens.text).toBe('#0F172A');
      expect(tokens.bg).toContain('rgba(255, 255, 255');
    });

    it('scales transparency through subtle, regular, and intense presets', () => {
      const subtle = getLiquidGlassTokens(false, 'subtle', false);
      const regular = getLiquidGlassTokens(false, 'regular', false);
      const intense = getLiquidGlassTokens(false, 'intense', false);

      expect(subtle.bg).toBe(LIQUID_GLASS_INTENSITIES_DARK.subtle.bg);
      expect(regular.bg).toBe(LIQUID_GLASS_INTENSITIES_DARK.regular.bg);
      expect(intense.bg).toBe(LIQUID_GLASS_INTENSITIES_DARK.intense.bg);
    });

    it('returns opaque fallback when forceOpaque is requested', () => {
      const darkOpaque = getLiquidGlassTokens(true, 'regular', false);
      expect(darkOpaque.mode).toBe('opaque');
      expect(darkOpaque.bg).toBe(OPAQUE_TOKENS_DARK.bg);

      const lightOpaque = getLiquidGlassTokens(true, 'regular', true);
      expect(lightOpaque.mode).toBe('opaque');
      expect(lightOpaque.bg).toBe(OPAQUE_TOKENS_LIGHT.bg);
    });
  });

  describe('2. Unified Appearance Settings Service', () => {
    it('initializes with default preferences', () => {
      const prefs = appearanceSettingsService.getPreferences();
      expect(prefs.themeMode).toBe('system');
      expect(prefs.glassMode).toBe('system');
      expect(prefs.intensity).toBe('regular');
      expect(prefs.reduceMotion).toBe('auto');
    });

    it('updates theme mode immediately and notifies subscribers', async () => {
      let notifiedLight = false;
      const unsubscribe = appearanceSettingsService.subscribe((_, __, isLight) => {
        notifiedLight = isLight;
      });

      await appearanceSettingsService.setThemeMode('light');
      expect(appearanceSettingsService.getPreferences().themeMode).toBe('light');
      expect(appearanceSettingsService.isEffectiveLight()).toBe(true);
      expect(notifiedLight).toBe(true);

      await appearanceSettingsService.setThemeMode('dark');
      expect(appearanceSettingsService.getPreferences().themeMode).toBe('dark');
      expect(appearanceSettingsService.isEffectiveDark()).toBe(true);

      unsubscribe();
    });

    it('updates glass mode and intensity', async () => {
      await appearanceSettingsService.setGlassMode('opaque');
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(false);

      await appearanceSettingsService.setGlassMode('glass');
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(true);

      await appearanceSettingsService.setIntensity('intense');
      expect(appearanceSettingsService.getIntensity()).toBe('intense');
    });

    it('updates motion mode and reflects effective state', async () => {
      expect(appearanceSettingsService.isEffectiveReducedMotion()).toBe(false);

      await appearanceSettingsService.setMotionMode('reduce');
      expect(appearanceSettingsService.getPreferences().reduceMotion).toBe('reduce');
      expect(appearanceSettingsService.isEffectiveReducedMotion()).toBe(true);
    });
  });

  describe('3. Strict Priority of Device-Level Accessibility Needs', () => {
    it('forces opaque mode when OS reduced transparency is enabled, even if user chose glass', async () => {
      await appearanceSettingsService.setGlassMode('glass');
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(true);

      // Simule l'activation de l'option d'accessibilité système
      appearanceSettingsService._setReduceTransparencyForTest(true);
      expect(appearanceSettingsService.isReducedTransparencyActive()).toBe(true);
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(false);

      // Désactivation de l'accessibilité système rétablit le choix utilisateur
      appearanceSettingsService._setReduceTransparencyForTest(false);
      expect(appearanceSettingsService.isEffectiveGlass()).toBe(true);
    });

    it('forces reduced motion when OS reduced motion is enabled, even if user chose auto', async () => {
      await appearanceSettingsService.setMotionMode('auto');
      expect(appearanceSettingsService.isEffectiveReducedMotion()).toBe(false);

      // Simule l'option de réduction de mouvement de l'OS
      appearanceSettingsService._setReduceMotionForTest(true);
      expect(appearanceSettingsService.isReducedMotionActive()).toBe(true);
      expect(appearanceSettingsService.isEffectiveReducedMotion()).toBe(true);

      appearanceSettingsService._setReduceMotionForTest(false);
      expect(appearanceSettingsService.isEffectiveReducedMotion()).toBe(false);
    });
  });

  describe('4. Reset and Consistency Across Sessions', () => {
    it('resets all appearance preferences to defaults', async () => {
      await appearanceSettingsService.setThemeMode('light');
      await appearanceSettingsService.setGlassMode('opaque');
      await appearanceSettingsService.setIntensity('subtle');
      await appearanceSettingsService.setMotionMode('reduce');

      await appearanceSettingsService.reset();
      const prefs = appearanceSettingsService.getPreferences();
      expect(prefs).toEqual(DEFAULT_APPEARANCE_PREFS);
    });
  });
});

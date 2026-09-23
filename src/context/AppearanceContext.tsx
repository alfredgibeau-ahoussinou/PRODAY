import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  appearanceSettingsService,
  type AppearancePreferences,
  type LiquidGlassMode,
  type LiquidGlassIntensity,
  DEFAULT_APPEARANCE_PREFS,
} from '../services/appearanceSettings.service';
import { getLiquidGlassTokens, type LiquidGlassTokens } from '../theme/liquidGlass';

interface AppearanceContextValue {
  preferences: AppearancePreferences;
  glassMode: LiquidGlassMode;
  intensity: LiquidGlassIntensity;
  isEffectiveGlass: boolean;
  isReducedTransparency: boolean;
  setGlassMode: (mode: LiquidGlassMode) => Promise<void>;
  setIntensity: (intensity: LiquidGlassIntensity) => Promise<void>;
  resetAppearance: () => Promise<void>;
  tokens: LiquidGlassTokens;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<AppearancePreferences>(
    appearanceSettingsService.getPreferences() ?? DEFAULT_APPEARANCE_PREFS,
  );
  const [isEffectiveGlass, setIsEffectiveGlass] = useState<boolean>(
    appearanceSettingsService.isEffectiveGlass(),
  );

  useEffect(() => {
    const unsubscribe = appearanceSettingsService.subscribe((newPrefs, effective) => {
      setPrefs(newPrefs);
      setIsEffectiveGlass(effective);
    });
    return unsubscribe;
  }, []);

  const tokens = useMemo(
    () => getLiquidGlassTokens(!isEffectiveGlass, prefs.intensity),
    [isEffectiveGlass, prefs.intensity],
  );

  const value = useMemo<AppearanceContextValue>(
    () => ({
      preferences: prefs,
      glassMode: prefs.glassMode,
      intensity: prefs.intensity,
      isEffectiveGlass,
      isReducedTransparency: appearanceSettingsService.isReducedTransparencyActive(),
      setGlassMode: (mode) => appearanceSettingsService.setGlassMode(mode),
      setIntensity: (intensity) => appearanceSettingsService.setIntensity(intensity),
      resetAppearance: () => appearanceSettingsService.reset(),
      tokens,
    }),
    [prefs, isEffectiveGlass, tokens],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    const isEff = appearanceSettingsService.isEffectiveGlass();
    const currentPrefs = appearanceSettingsService.getPreferences();
    return {
      preferences: currentPrefs,
      glassMode: currentPrefs.glassMode,
      intensity: currentPrefs.intensity,
      isEffectiveGlass: isEff,
      isReducedTransparency: appearanceSettingsService.isReducedTransparencyActive(),
      setGlassMode: (mode) => appearanceSettingsService.setGlassMode(mode),
      setIntensity: (intensity) => appearanceSettingsService.setIntensity(intensity),
      resetAppearance: () => appearanceSettingsService.reset(),
      tokens: getLiquidGlassTokens(!isEff, currentPrefs.intensity),
    };
  }
  return ctx;
}

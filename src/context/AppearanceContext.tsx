import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  appearanceSettingsService,
  type AppearancePreferences,
  type LiquidGlassMode,
  type LiquidGlassIntensity,
  type ThemeMode,
  type MotionMode,
  DEFAULT_APPEARANCE_PREFS,
} from '../services/appearanceSettings.service';
import { getLiquidGlassTokens, type LiquidGlassTokens } from '../theme/liquidGlass';

export interface AppearanceContextValue {
  preferences: AppearancePreferences;
  themeMode: ThemeMode;
  glassMode: LiquidGlassMode;
  intensity: LiquidGlassIntensity;
  reduceMotion: MotionMode;
  isEffectiveGlass: boolean;
  isEffectiveLight: boolean;
  isEffectiveDark: boolean;
  isEffectiveReducedMotion: boolean;
  isReducedTransparency: boolean;
  isReducedMotion: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setGlassMode: (mode: LiquidGlassMode) => Promise<void>;
  setIntensity: (intensity: LiquidGlassIntensity) => Promise<void>;
  setMotionMode: (mode: MotionMode) => Promise<void>;
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
  const [isEffectiveLight, setIsEffectiveLight] = useState<boolean>(
    appearanceSettingsService.isEffectiveLight(),
  );

  useEffect(() => {
    const unsubscribe = appearanceSettingsService.subscribe((newPrefs, effectiveGlass, effectiveLight) => {
      setPrefs(newPrefs);
      setIsEffectiveGlass(effectiveGlass);
      setIsEffectiveLight(effectiveLight);
    });
    return unsubscribe;
  }, []);

  const tokens = useMemo(
    () => getLiquidGlassTokens(!isEffectiveGlass, prefs.intensity, isEffectiveLight),
    [isEffectiveGlass, prefs.intensity, isEffectiveLight],
  );

  const value = useMemo<AppearanceContextValue>(
    () => ({
      preferences: prefs,
      themeMode: prefs.themeMode,
      glassMode: prefs.glassMode,
      intensity: prefs.intensity,
      reduceMotion: prefs.reduceMotion,
      isEffectiveGlass,
      isEffectiveLight,
      isEffectiveDark: !isEffectiveLight,
      isEffectiveReducedMotion: appearanceSettingsService.isEffectiveReducedMotion(),
      isReducedTransparency: appearanceSettingsService.isReducedTransparencyActive(),
      isReducedMotion: appearanceSettingsService.isReducedMotionActive(),
      setThemeMode: (mode) => appearanceSettingsService.setThemeMode(mode),
      setGlassMode: (mode) => appearanceSettingsService.setGlassMode(mode),
      setIntensity: (intensity) => appearanceSettingsService.setIntensity(intensity),
      setMotionMode: (mode) => appearanceSettingsService.setMotionMode(mode),
      resetAppearance: () => appearanceSettingsService.reset(),
      tokens,
    }),
    [prefs, isEffectiveGlass, isEffectiveLight, tokens],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    const isEff = appearanceSettingsService.isEffectiveGlass();
    const isLight = appearanceSettingsService.isEffectiveLight();
    const currentPrefs = appearanceSettingsService.getPreferences();
    return {
      preferences: currentPrefs,
      themeMode: currentPrefs.themeMode,
      glassMode: currentPrefs.glassMode,
      intensity: currentPrefs.intensity,
      reduceMotion: currentPrefs.reduceMotion,
      isEffectiveGlass: isEff,
      isEffectiveLight: isLight,
      isEffectiveDark: !isLight,
      isEffectiveReducedMotion: appearanceSettingsService.isEffectiveReducedMotion(),
      isReducedTransparency: appearanceSettingsService.isReducedTransparencyActive(),
      isReducedMotion: appearanceSettingsService.isReducedMotionActive(),
      setThemeMode: (mode) => appearanceSettingsService.setThemeMode(mode),
      setGlassMode: (mode) => appearanceSettingsService.setGlassMode(mode),
      setIntensity: (intensity) => appearanceSettingsService.setIntensity(intensity),
      setMotionMode: (mode) => appearanceSettingsService.setMotionMode(mode),
      resetAppearance: () => appearanceSettingsService.reset(),
      tokens: getLiquidGlassTokens(!isEff, currentPrefs.intensity, isLight),
    };
  }
  return ctx;
}

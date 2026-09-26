import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo, Appearance, Platform } from 'react-native';

export type LiquidGlassMode = 'system' | 'glass' | 'opaque';
export type LiquidGlassIntensity = 'subtle' | 'regular' | 'intense';
export type ThemeMode = 'system' | 'dark' | 'light';
export type MotionMode = 'auto' | 'reduce';

export interface AppearancePreferences {
  themeMode: ThemeMode;
  glassMode: LiquidGlassMode;
  intensity: LiquidGlassIntensity;
  reduceMotion: MotionMode;
}

const STORAGE_KEY = '@proday:appearance_liquid_glass';

export const DEFAULT_APPEARANCE_PREFS: AppearancePreferences = {
  themeMode: 'system',
  glassMode: 'system',
  intensity: 'regular',
  reduceMotion: 'auto',
};

type Listener = (prefs: AppearancePreferences, isEffectiveGlass: boolean, isEffectiveLight: boolean) => void;

class AppearanceSettingsService {
  private prefs: AppearancePreferences = { ...DEFAULT_APPEARANCE_PREFS };
  private isReduceTransparency = false;
  private isReduceMotion = false;
  private systemColorScheme: 'light' | 'dark' = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Lire accessibilité système (transparence réduite)
    if (typeof AccessibilityInfo?.isReduceTransparencyEnabled === 'function') {
      try {
        const reduced = await AccessibilityInfo.isReduceTransparencyEnabled();
        this.isReduceTransparency = Boolean(reduced);
      } catch {
        this.isReduceTransparency = false;
      }

      if (typeof AccessibilityInfo?.addEventListener === 'function') {
        AccessibilityInfo.addEventListener('reduceTransparencyChanged', (reduced) => {
          this.isReduceTransparency = Boolean(reduced);
          this.notify();
        });
      }
    }

    // 2. Lire accessibilité système (mouvement réduit)
    if (typeof AccessibilityInfo?.isReduceMotionEnabled === 'function') {
      try {
        const reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
        this.isReduceMotion = Boolean(reducedMotion);
      } catch {
        this.isReduceMotion = false;
      }

      if (typeof AccessibilityInfo?.addEventListener === 'function') {
        AccessibilityInfo.addEventListener('reduceMotionChanged', (reduced) => {
          this.isReduceMotion = Boolean(reduced);
          this.notify();
        });
      }
    }

    // 3. Détecter schéma de couleur système (OS)
    if (typeof Appearance?.addChangeListener === 'function') {
      Appearance.addChangeListener(({ colorScheme }) => {
        this.systemColorScheme = colorScheme === 'light' ? 'light' : 'dark';
        this.notify();
      });
    }

    // 4. Détecter préférences Web via matchMedia
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (motionMq.matches) this.isReduceMotion = true;
        motionMq.addEventListener?.('change', (e) => {
          this.isReduceMotion = e.matches;
          this.notify();
        });

        const transMq = window.matchMedia('(prefers-reduced-transparency: reduce)');
        if (transMq.matches) this.isReduceTransparency = true;
        transMq.addEventListener?.('change', (e) => {
          this.isReduceTransparency = e.matches;
          this.notify();
        });
      } catch {
        // Safe catch
      }
    }

    // 5. Restaurer préférences stockées
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppearancePreferences>;
        if (parsed.themeMode && ['system', 'dark', 'light'].includes(parsed.themeMode)) {
          this.prefs.themeMode = parsed.themeMode;
        }
        if (parsed.glassMode && ['system', 'glass', 'opaque'].includes(parsed.glassMode)) {
          this.prefs.glassMode = parsed.glassMode;
        }
        if (parsed.intensity && ['subtle', 'regular', 'intense'].includes(parsed.intensity)) {
          this.prefs.intensity = parsed.intensity;
        }
        if (parsed.reduceMotion && ['auto', 'reduce'].includes(parsed.reduceMotion)) {
          this.prefs.reduceMotion = parsed.reduceMotion;
        }
      }
    } catch {
      // Ignorer erreur lecture
    }

    this.notify();
  }

  /**
   * Retourne true si le rendu Liquid Glass doit être activé.
   * L'accessibilité matérielle / OS est prioritaire :
   * Si l'accessibilité a activé la réduction de transparence, le mode opaque est forcé.
   * Sinon, respecte 'opaque' explicite, ou autorise 'glass' / 'system'.
   */
  public isEffectiveGlass(): boolean {
    if (this.isReduceTransparency) return false;
    if (this.prefs.glassMode === 'opaque') return false;
    return true;
  }

  /**
   * Retourne true si les animations doivent être réduites.
   * Priorité absolue à la contrainte OS, ou choix utilisateur explicite.
   */
  public isEffectiveReducedMotion(): boolean {
    if (this.isReduceMotion) return true;
    return this.prefs.reduceMotion === 'reduce';
  }

  /**
   * Retourne true si le thème clair effectif est actif.
   */
  public isEffectiveLight(): boolean {
    if (this.prefs.themeMode === 'light') return true;
    if (this.prefs.themeMode === 'dark') return false;
    return this.systemColorScheme === 'light';
  }

  public isEffectiveDark(): boolean {
    return !this.isEffectiveLight();
  }

  public getPreferences(): AppearancePreferences {
    return { ...this.prefs };
  }

  public getIntensity(): LiquidGlassIntensity {
    return this.prefs.intensity;
  }

  public isReducedTransparencyActive(): boolean {
    return this.isReduceTransparency;
  }

  public isReducedMotionActive(): boolean {
    return this.isReduceMotion;
  }

  public async setThemeMode(mode: ThemeMode): Promise<void> {
    this.prefs.themeMode = mode;
    await this.persist();
    this.notify();
  }

  public async setGlassMode(mode: LiquidGlassMode): Promise<void> {
    this.prefs.glassMode = mode;
    await this.persist();
    this.notify();
  }

  public async setIntensity(intensity: LiquidGlassIntensity): Promise<void> {
    this.prefs.intensity = intensity;
    await this.persist();
    this.notify();
  }

  public async setMotionMode(mode: MotionMode): Promise<void> {
    this.prefs.reduceMotion = mode;
    await this.persist();
    this.notify();
  }

  public async reset(): Promise<void> {
    this.prefs = { ...DEFAULT_APPEARANCE_PREFS };
    await this.persist();
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getPreferences(), this.isEffectiveGlass(), this.isEffectiveLight());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
    } catch {
      // Ignore
    }
  }

  private notify(): void {
    const effective = this.isEffectiveGlass();
    const effectiveLight = this.isEffectiveLight();
    const current = this.getPreferences();
    this.listeners.forEach((l) => {
      try {
        l(current, effective, effectiveLight);
      } catch {
        // Safe catch
      }
    });
  }

  /** Utilitaires pour tests */
  public _setReduceTransparencyForTest(val: boolean) {
    this.isReduceTransparency = val;
    this.notify();
  }

  public _setReduceMotionForTest(val: boolean) {
    this.isReduceMotion = val;
    this.notify();
  }
}

export const appearanceSettingsService = new AppearanceSettingsService();

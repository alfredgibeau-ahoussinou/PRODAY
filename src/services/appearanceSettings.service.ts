import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';

export type LiquidGlassMode = 'system' | 'glass' | 'opaque';
export type LiquidGlassIntensity = 'subtle' | 'regular' | 'intense';

export interface AppearancePreferences {
  glassMode: LiquidGlassMode;
  intensity: LiquidGlassIntensity;
}

const STORAGE_KEY = '@proday:appearance_liquid_glass';

export const DEFAULT_APPEARANCE_PREFS: AppearancePreferences = {
  glassMode: 'system',
  intensity: 'regular',
};

type Listener = (prefs: AppearancePreferences, isEffectiveGlass: boolean) => void;

class AppearanceSettingsService {
  private prefs: AppearancePreferences = { ...DEFAULT_APPEARANCE_PREFS };
  private isReduceTransparency = false;
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Lire accessibilité système
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

    // 2. Restaurer préférence stockée
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppearancePreferences>;
        if (parsed.glassMode && ['system', 'glass', 'opaque'].includes(parsed.glassMode)) {
          this.prefs.glassMode = parsed.glassMode;
        }
        if (parsed.intensity && ['subtle', 'regular', 'intense'].includes(parsed.intensity)) {
          this.prefs.intensity = parsed.intensity;
        }
      }
    } catch {
      // Ignorer erreur lecture
    }

    this.notify();
  }

  /**
   * Retourne true si le rendu Liquid Glass doit être activé.
   * Si 'system' : activé sauf si l'accessibilité a activé la réduction de transparence.
   * Si 'glass' : forcé actif (sauf si réduction de transparence explicite de l'OS).
   * Si 'opaque' : forcé opaque (désactivé).
   */
  public isEffectiveGlass(): boolean {
    if (this.isReduceTransparency) return false;
    if (this.prefs.glassMode === 'opaque') return false;
    return true; // 'system' ou 'glass'
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

  public async reset(): Promise<void> {
    this.prefs = { ...DEFAULT_APPEARANCE_PREFS };
    await this.persist();
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Notifier immédiatement à l'abonnement
    listener(this.getPreferences(), this.isEffectiveGlass());
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
    const current = this.getPreferences();
    this.listeners.forEach((l) => {
      try {
        l(current, effective);
      } catch {
        // Safe catch
      }
    });
  }

  /** Utilitaire pour tests */
  public _setReduceTransparencyForTest(val: boolean) {
    this.isReduceTransparency = val;
    this.notify();
  }
}

export const appearanceSettingsService = new AppearanceSettingsService();

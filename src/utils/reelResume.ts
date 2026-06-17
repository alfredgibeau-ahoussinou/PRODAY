import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductLineId } from '../models/ProductLine';
import type { ReelPoleId } from '../content/reelSeedCatalog';
import type { ReelThemeId } from '../content/reelThemes';

const KEY = 'proday:reel-resume';

export interface ReelResumeState {
  bookmarkKey: string;
  activeIndex: number;
  at: string;
}

function resumeKey(
  universe: ProductLineId,
  pole: ReelPoleId,
  theme: ReelThemeId,
): string {
  return `${universe}:${pole}:${theme}`;
}

export async function loadReelResume(
  universe: ProductLineId,
  pole: ReelPoleId,
  theme: ReelThemeId,
): Promise<ReelResumeState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, ReelResumeState>;
    return map[resumeKey(universe, pole, theme)] ?? null;
  } catch {
    return null;
  }
}

export async function saveReelResume(
  universe: ProductLineId,
  pole: ReelPoleId,
  theme: ReelThemeId,
  state: ReelResumeState,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const map: Record<string, ReelResumeState> = raw ? JSON.parse(raw) : {};
    map[resumeKey(universe, pole, theme)] = state;
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

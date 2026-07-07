import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'proday_supporter_filters_v1';

export type SupporterGenderFilter = 'all' | 'men' | 'women' | 'mixed';
export type SupporterSourceFilter = 'all' | 'proday' | 'world';
export type SupporterScopeFilter = 'all' | 'follows';

export interface SupporterMatchFilters {
  gender: SupporterGenderFilter;
  source: SupporterSourceFilter;
  scope: SupporterScopeFilter;
}

export const DEFAULT_SUPPORTER_MATCH_FILTERS: SupporterMatchFilters = {
  gender: 'all',
  source: 'all',
  scope: 'all',
};

export const SUPPORTER_FREE_CLUB_LIMIT = 5;
export const SUPPORTER_FREE_PLAYER_LIMIT = 10;

export async function loadSupporterMatchFilters(
  uid: string
): Promise<SupporterMatchFilters> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${uid}`);
    if (!raw) return { ...DEFAULT_SUPPORTER_MATCH_FILTERS };
    return { ...DEFAULT_SUPPORTER_MATCH_FILTERS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SUPPORTER_MATCH_FILTERS };
  }
}

export async function saveSupporterMatchFilters(
  uid: string,
  filters: SupporterMatchFilters
): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEY}:${uid}`, JSON.stringify(filters));
}

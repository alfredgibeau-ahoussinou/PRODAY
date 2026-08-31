import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { clubsService } from '../services/clubs.service';
import { playerThemePrefsService } from '../services/playerThemePrefs.service';
import {
  DEFAULT_PLAYER_THEME_PREFS,
  type PlayerThemePrefs,
} from '../models/PlayerThemePrefs';
import {
  resolveClubBrandColors,
  type ClubBrandColors,
} from '../utils/clubBrandColors';
import {
  resolvePlayerThemeColors,
  type ResolvedPlayerThemeColors,
} from '../utils/resolvePlayerThemeColors';
import { PLAYER_DARK } from '../theme/playerDarkPremium';

type PlayerThemeContextValue = {
  ready: boolean;
  prefs: PlayerThemePrefs;
  colors: ResolvedPlayerThemeColors;
  clubColors: ClubBrandColors | null;
  clubName: string | null;
  hasClub: boolean;
  setPrefs: (prefs: PlayerThemePrefs) => Promise<void>;
  resetPrefs: () => Promise<void>;
  refresh: () => Promise<void>;
};

const DEFAULT_COLORS = resolvePlayerThemeColors(null, null);

const PlayerThemeContext = createContext<PlayerThemeContextValue | null>(null);

export function PlayerThemeProvider({ children }: { children: React.ReactNode }) {
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const uid = profile?.uid;
  const clubId = profile?.profile.club_id ?? null;

  const [prefs, setPrefsState] = useState<PlayerThemePrefs>(DEFAULT_PLAYER_THEME_PREFS);
  const [clubName, setClubName] = useState<string | null>(null);
  const [clubColors, setClubColors] = useState<ClubBrandColors | null>(null);
  const [ready, setReady] = useState(!isPlayer);

  const load = useCallback(async () => {
    if (!isPlayer || !uid) {
      setPrefsState(DEFAULT_PLAYER_THEME_PREFS);
      setClubName(null);
      setClubColors(null);
      setReady(true);
      return;
    }

    setReady(false);
    try {
      const nextPrefs = await playerThemePrefsService.get(uid);
      setPrefsState(nextPrefs);

      if (clubId) {
        const club = await clubsService.getById(clubId);
        setClubName(club?.name?.trim() || null);
        setClubColors(resolveClubBrandColors(club));
      } else {
        setClubName(null);
        setClubColors(null);
      }
    } finally {
      setReady(true);
    }
  }, [clubId, isPlayer, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const colors = useMemo(
    () => resolvePlayerThemeColors(prefs, clubColors),
    [clubColors, prefs],
  );

  const setPrefs = useCallback(
    async (next: PlayerThemePrefs) => {
      if (!uid) return;
      setPrefsState(next);
      await playerThemePrefsService.set(uid, next);
    },
    [uid],
  );

  const resetPrefs = useCallback(async () => {
    await setPrefs(DEFAULT_PLAYER_THEME_PREFS);
  }, [setPrefs]);

  const value = useMemo<PlayerThemeContextValue>(
    () => ({
      ready,
      prefs,
      colors,
      clubColors,
      clubName,
      hasClub: Boolean(clubId),
      setPrefs,
      resetPrefs,
      refresh: load,
    }),
    [clubColors, clubId, clubName, colors, load, prefs, ready, resetPrefs, setPrefs],
  );

  return <PlayerThemeContext.Provider value={value}>{children}</PlayerThemeContext.Provider>;
}

export function usePlayerTheme(): PlayerThemeContextValue {
  const ctx = useContext(PlayerThemeContext);
  if (!ctx) {
    return {
      ready: true,
      prefs: DEFAULT_PLAYER_THEME_PREFS,
      colors: DEFAULT_COLORS,
      clubColors: null,
      clubName: null,
      hasClub: false,
      setPrefs: async () => {},
      resetPrefs: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

/** Tokens PLAYER_DARK avec accents résolus — fallback statique hors provider joueur. */
export type PlayerThemeColorTokens = ResolvedPlayerThemeColors &
  Omit<typeof PLAYER_DARK, 'accent' | 'accentAlt' | 'accentSoft' | 'accentGlow' | 'bg' | 'surface' | 'surfaceRaised'>;

export function usePlayerThemeColors(): PlayerThemeColorTokens {
  const { colors } = usePlayerTheme();
  return useMemo(
    () => ({
      ...PLAYER_DARK,
      ...colors,
    }),
    [colors],
  );
}

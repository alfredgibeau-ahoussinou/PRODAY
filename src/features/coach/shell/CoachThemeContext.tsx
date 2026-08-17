import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import { teamsService } from '../../../services/teams.service';
import {
  buildCoachThemeTokens,
  pickCoachTeam,
  resolveCoachTeamAccent,
  type CoachAccentMode,
  type CoachShellVariant,
  type CoachThemeTokens,
} from '../../../utils/coachTeamTheme';

const VARIANT_STORAGE_PREFIX = '@proday/coach_shell_variant';
const ACCENT_STORAGE_PREFIX = '@proday/coach_shell_accent';

type StoredAccent = {
  mode: CoachAccentMode;
  color?: string;
};

type CoachThemeContextValue = {
  tokens: CoachThemeTokens;
  variant: CoachShellVariant;
  setVariant: (variant: CoachShellVariant) => void;
  accentMode: CoachAccentMode;
  accentOverride: string;
  teamAccent: string;
  setAccentMode: (mode: CoachAccentMode) => void;
  setAccentOverride: (color: string) => void;
  resetAccentToTeam: () => void;
  teamId?: string;
  teamName: string;
};

const CoachThemeContext = createContext<CoachThemeContextValue | null>(null);

function variantStorageKey(uid: string): string {
  return `${VARIANT_STORAGE_PREFIX}:${uid}`;
}

function accentStorageKey(uid: string): string {
  return `${ACCENT_STORAGE_PREFIX}:${uid}`;
}

function parseStoredAccent(raw: string | null): StoredAccent {
  if (!raw) return { mode: 'auto' };
  try {
    const parsed = JSON.parse(raw) as StoredAccent;
    if (parsed.mode === 'manual' && typeof parsed.color === 'string') {
      return { mode: 'manual', color: parsed.color };
    }
    if (parsed.mode === 'auto') return { mode: 'auto' };
  } catch {
    /* legacy or corrupt — fall back to auto */
  }
  return { mode: 'auto' };
}

function persistAccent(uid: string, accent: StoredAccent): void {
  void AsyncStorage.setItem(accentStorageKey(uid), JSON.stringify(accent));
}

export function CoachThemeProvider({ children }: { children: React.ReactNode }) {
  const profile = useSessionProfile();
  const uid = profile?.uid;
  const [variant, setVariantState] = useState<CoachShellVariant>('solid');
  const [accentMode, setAccentModeState] = useState<CoachAccentMode>('auto');
  const [accentOverride, setAccentOverrideState] = useState('');
  const [teamId, setTeamId] = useState<string | undefined>();
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    if (!uid) {
      setVariantState('solid');
      setAccentModeState('auto');
      setAccentOverrideState('');
      return;
    }
    let cancelled = false;
    void AsyncStorage.getItem(variantStorageKey(uid))
      .then((raw) => {
        if (cancelled) return;
        if (raw === 'solid' || raw === 'clear') {
          setVariantState(raw);
        }
      })
      .catch(() => {
        if (!cancelled) setVariantState('solid');
      });
    void AsyncStorage.getItem(accentStorageKey(uid))
      .then((raw) => {
        if (cancelled) return;
        const stored = parseStoredAccent(raw);
        setAccentModeState(stored.mode);
        setAccentOverrideState(stored.color ?? '');
      })
      .catch(() => {
        if (!cancelled) {
          setAccentModeState('auto');
          setAccentOverrideState('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    const clubId = profile?.profile.club_id;
    if (!clubId || !uid) {
      setTeamId(undefined);
      setTeamName('');
      return;
    }
    let cancelled = false;
    void Promise.all([clubsService.getById(clubId), teamsService.listByClubId(clubId)])
      .then(([club, teams]) => {
        if (cancelled) return;
        const mine = pickCoachTeam(teams, uid);
        setTeamId(mine?.id);
        setTeamName(mine?.name || club?.name || '');
      })
      .catch(() => {
        if (!cancelled) {
          setTeamId(undefined);
          setTeamName('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.profile.club_id, uid]);

  const setVariant = useCallback(
    (next: CoachShellVariant) => {
      setVariantState(next);
      if (uid) {
        void AsyncStorage.setItem(variantStorageKey(uid), next);
      }
    },
    [uid],
  );

  const setAccentMode = useCallback(
    (mode: CoachAccentMode) => {
      setAccentModeState(mode);
      if (!uid) return;
      if (mode === 'auto') {
        setAccentOverrideState('');
        persistAccent(uid, { mode: 'auto' });
        return;
      }
      persistAccent(uid, { mode: 'manual', color: accentOverride || undefined });
    },
    [uid, accentOverride],
  );

  const setAccentOverride = useCallback(
    (color: string) => {
      setAccentModeState('manual');
      setAccentOverrideState(color);
      if (uid) {
        persistAccent(uid, { mode: 'manual', color });
      }
    },
    [uid],
  );

  const resetAccentToTeam = useCallback(() => {
    setAccentModeState('auto');
    setAccentOverrideState('');
    if (uid) {
      persistAccent(uid, { mode: 'auto' });
    }
  }, [uid]);

  const teamAccent = useMemo(
    () => resolveCoachTeamAccent(teamId, teamName || undefined),
    [teamId, teamName],
  );

  const tokens = useMemo(
    () =>
      buildCoachThemeTokens({
        variant,
        teamId,
        teamName: teamName || undefined,
        accentMode,
        accentOverride: accentOverride || undefined,
      }),
    [variant, teamId, teamName, accentMode, accentOverride],
  );

  const value = useMemo(
    () => ({
      tokens,
      variant,
      setVariant,
      accentMode,
      accentOverride,
      teamAccent,
      setAccentMode,
      setAccentOverride,
      resetAccentToTeam,
      teamId,
      teamName,
    }),
    [
      tokens,
      variant,
      setVariant,
      accentMode,
      accentOverride,
      teamAccent,
      setAccentMode,
      setAccentOverride,
      resetAccentToTeam,
      teamId,
      teamName,
    ],
  );

  return <CoachThemeContext.Provider value={value}>{children}</CoachThemeContext.Provider>;
}

export function useCoachTheme(): CoachThemeContextValue {
  const ctx = useContext(CoachThemeContext);
  if (!ctx) {
    const fallback = buildCoachThemeTokens({ variant: 'solid' });
    return {
      tokens: fallback,
      variant: 'solid',
      setVariant: () => {},
      accentMode: 'auto',
      accentOverride: '',
      teamAccent: fallback.accent,
      setAccentMode: () => {},
      setAccentOverride: () => {},
      resetAccentToTeam: () => {},
      teamId: undefined,
      teamName: '',
    };
  }
  return ctx;
}

/** Accès direct aux tokens Pôle Coach (solid / clear). */
export function useCoachTokens(): CoachThemeTokens {
  return useCoachTheme().tokens;
}

/** Styles memoïsés sur les tokens — évite COACH_SITE statique en module. */
export function useCoachThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (tokens: CoachThemeTokens) => T,
): T {
  const { tokens } = useCoachTheme();
  return useMemo(() => createStyles(tokens), [tokens]);
}

export { coachTokensAsAppColors } from './coachTokensAsAppColors';

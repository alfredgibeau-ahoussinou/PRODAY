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
  listCoachTeams,
  pickCoachTeam,
  resolveCoachTeamAccent,
  type CoachAccentMode,
  type CoachShellVariant,
  type CoachThemeTokens,
} from '../../../utils/coachTeamTheme';
import { normalizeCoachHexColor } from '../../../utils/coachColorPicker';

const VARIANT_STORAGE_PREFIX = '@proday/coach_shell_variant';
const ACCENT_STORAGE_PREFIX = '@proday/coach_shell_accent';
const ACTIVE_TEAM_STORAGE_PREFIX = '@proday/coach_active_team';

export type CoachTeamOption = {
  id: string;
  name: string;
  category?: string;
};

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
  coachTeams: CoachTeamOption[];
  teamId?: string;
  teamName: string;
  setActiveTeamId: (id: string) => void;
};

const CoachThemeContext = createContext<CoachThemeContextValue | null>(null);

function variantStorageKey(uid: string): string {
  return `${VARIANT_STORAGE_PREFIX}:${uid}`;
}

function accentStorageKey(uid: string): string {
  return `${ACCENT_STORAGE_PREFIX}:${uid}`;
}

function activeTeamStorageKey(uid: string): string {
  return `${ACTIVE_TEAM_STORAGE_PREFIX}:${uid}`;
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
  const [coachTeams, setCoachTeams] = useState<CoachTeamOption[]>([]);
  const [teamId, setTeamId] = useState<string | undefined>();
  const [teamName, setTeamName] = useState('');
  const [clubFallbackName, setClubFallbackName] = useState('');

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
      setCoachTeams([]);
      setTeamId(undefined);
      setTeamName('');
      setClubFallbackName('');
      return;
    }
    let cancelled = false;
    void Promise.all([
      clubsService.getById(clubId),
      teamsService.listByClubId(clubId),
      AsyncStorage.getItem(activeTeamStorageKey(uid)),
    ])
      .then(([club, teams, storedTeamId]) => {
        if (cancelled) return;
        const fallbackName = club?.name || '';
        setClubFallbackName(fallbackName);
        const assigned = listCoachTeams(teams, uid);
        const fallbackTeam = pickCoachTeam(teams, uid);
        const options: CoachTeamOption[] =
          assigned.length > 0
            ? assigned.map((team) => ({
                id: team.id,
                name: team.name,
                category: team.category,
              }))
            : fallbackTeam
              ? [
                  {
                    id: fallbackTeam.id,
                    name: fallbackTeam.name,
                    category: fallbackTeam.category,
                  },
                ]
              : [];
        setCoachTeams(options);
        const stored =
          storedTeamId && options.some((team) => team.id === storedTeamId)
            ? options.find((team) => team.id === storedTeamId)
            : undefined;
        const active = stored ?? fallbackTeam ?? options[0];
        setTeamId(active?.id);
        setTeamName(active?.name || fallbackName);
      })
      .catch(() => {
        if (!cancelled) {
          setCoachTeams([]);
          setTeamId(undefined);
          setTeamName('');
          setClubFallbackName('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.profile.club_id, uid]);

  const setActiveTeamId = useCallback(
    (id: string) => {
      const team = coachTeams.find((row) => row.id === id);
      if (!team) return;
      setTeamId(team.id);
      setTeamName(team.name || clubFallbackName);
      if (uid) {
        void AsyncStorage.setItem(activeTeamStorageKey(uid), team.id);
      }
    },
    [coachTeams, clubFallbackName, uid],
  );

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
      const hex = normalizeCoachHexColor(color);
      if (!hex) return;
      setAccentModeState('manual');
      setAccentOverrideState(hex);
      if (uid) {
        persistAccent(uid, { mode: 'manual', color: hex });
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
      coachTeams,
      teamId,
      teamName,
      setActiveTeamId,
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
      coachTeams,
      teamId,
      teamName,
      setActiveTeamId,
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
      coachTeams: [],
      teamId: undefined,
      teamName: '',
      setActiveTeamId: () => {},
    };
  }
  return ctx;
}

/** Vrai lorsque l'écran est rendu dans le shell coach (CoachThemeProvider actif). */
export function useIsCoachShell(): boolean {
  return useContext(CoachThemeContext) !== null;
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

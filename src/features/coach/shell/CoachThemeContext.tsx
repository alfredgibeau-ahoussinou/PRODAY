import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import { teamsService } from '../../../services/teams.service';
import {
  buildCoachThemeTokens,
  pickCoachTeam,
  type CoachShellVariant,
  type CoachThemeTokens,
} from '../../../utils/coachTeamTheme';

const STORAGE_PREFIX = '@proday/coach_shell_variant';

type CoachThemeContextValue = {
  tokens: CoachThemeTokens;
  variant: CoachShellVariant;
  setVariant: (variant: CoachShellVariant) => void;
  teamId?: string;
  teamName: string;
};

const CoachThemeContext = createContext<CoachThemeContextValue | null>(null);

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}:${uid}`;
}

export function CoachThemeProvider({ children }: { children: React.ReactNode }) {
  const profile = useSessionProfile();
  const uid = profile?.uid;
  const [variant, setVariantState] = useState<CoachShellVariant>('solid');
  const [teamId, setTeamId] = useState<string | undefined>();
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    if (!uid) {
      setVariantState('solid');
      return;
    }
    let cancelled = false;
    void AsyncStorage.getItem(storageKey(uid))
      .then((raw) => {
        if (cancelled) return;
        if (raw === 'solid' || raw === 'clear') {
          setVariantState(raw);
        }
      })
      .catch(() => {
        if (!cancelled) setVariantState('solid');
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
        void AsyncStorage.setItem(storageKey(uid), next);
      }
    },
    [uid],
  );

  const tokens = useMemo(
    () =>
      buildCoachThemeTokens({
        variant,
        teamId,
        teamName: teamName || undefined,
      }),
    [variant, teamId, teamName],
  );

  const value = useMemo(
    () => ({
      tokens,
      variant,
      setVariant,
      teamId,
      teamName,
    }),
    [tokens, variant, setVariant, teamId, teamName],
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
      teamId: undefined,
      teamName: '',
    };
  }
  return ctx;
}

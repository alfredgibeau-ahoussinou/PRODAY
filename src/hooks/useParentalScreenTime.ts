import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { User } from '../models/User';
import { isMinorUser } from '../utils/minor';
import {
  evaluateScreenTimeAccess,
  recordScreenTimeMinute,
  shouldEnforceScreenTime,
  type ScreenTimeBlockReason,
} from '../utils/parentalScreenTime';

const TICK_MS = 60_000;

export function useParentalScreenTime(profile: User | null) {
  const { refreshProfile } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [limitMinutes, setLimitMinutes] = useState(90);
  const [reason, setReason] = useState<ScreenTimeBlockReason | undefined>();

  const refresh = useCallback(async () => {
    if (!profile || !isMinorUser(profile)) {
      setBlocked(false);
      setReason(undefined);
      return;
    }
    const settings = profile.parental_settings;
    if (!shouldEnforceScreenTime(settings)) {
      setBlocked(false);
      setReason(undefined);
      return;
    }
    const result = await evaluateScreenTimeAccess(profile.uid, settings!);
    setBlocked(result.blocked);
    setMinutesUsed(result.minutesUsed);
    setLimitMinutes(result.limitMinutes);
    setReason(result.reason);
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!profile || !isMinorUser(profile) || !shouldEnforceScreenTime(profile.parental_settings)) {
      return;
    }

    const appState = { current: AppState.currentState };
    const interval = setInterval(() => {
      if (appState.current !== 'active') return;
      void (async () => {
        await recordScreenTimeMinute(profile.uid);
        await refresh();
      })();
    }, TICK_MS);

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      appState.current = next;
      if (next === 'active') {
        void refreshProfile();
        void refresh();
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [profile, refresh, refreshProfile]);

  return { blocked, minutesUsed, limitMinutes, reason, refresh };
}

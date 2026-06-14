import { useEffect, useRef } from 'react';
import type { User } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { isV3ShellEnabled } from '../config/featureFlags';
import { useProDayBrain } from './useProDayBrain';
import { syncEntitiesToDeviceCalendar } from '../services/deviceCalendar.service';
import { isCalendarSyncEnabled, setLastCalendarSyncAt } from '../services/v3Preferences.service';
import { trackV3Event } from '../core/analytics/v3Events';

const SYNC_DEBOUNCE_MS = 8000;

/** Sync calendrier device — matchs, convocations, objectifs IA (annexe C). */
export function useDeviceCalendarSync(
  profile: User | null | undefined,
  productLine: ProductLineId
): void {
  const enabled = isV3ShellEnabled();
  const brain = useProDayBrain(profile ?? null, productLine);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToken = useRef<string>('');

  useEffect(() => {
    if (!enabled || !profile?.uid || profile.role === 'physio' || profile.role === 'sponsor') {
      return;
    }

    const signature = brain.calendar.map((e) => `${e.id}:${e.startsAt.getTime()}`).join('|');
    if (signature === lastToken.current) return;
    lastToken.current = signature;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void isCalendarSyncEnabled(profile.uid).then((allowed) => {
        if (!allowed) return;
        void syncEntitiesToDeviceCalendar(profile.uid, brain.calendar).then(async (synced) => {
          if (synced) {
            await setLastCalendarSyncAt(profile.uid, Date.now());
            trackV3Event('calendar_device_sync', { count: brain.calendar.length });
          }
        });
      });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, profile, productLine, brain.calendar]);
}

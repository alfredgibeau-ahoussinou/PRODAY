import { useEffect, useMemo, useRef } from 'react';
import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { syncProdayLocalNotifications, type EngagementNotificationHints } from '../services/prodayLocalNotifications.service';

/** Synchronise les notifications locales quand le calendrier / matchs changent. */
export function useProdayNotificationSync(
  profile: User | null | undefined,
  events: TeamEvent[],
  matches: FriendlyMatch[],
  engagement?: EngagementNotificationHints,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef(events);
  const matchesRef = useRef(matches);
  eventsRef.current = events;
  matchesRef.current = matches;

  const calendarKey = useMemo(
    () =>
      `${events.map((e) => e.id).join(',')}|${matches.map((m) => m.id).join(',')}|${engagement?.mercatoIncomplete ? 1 : 0}|${engagement?.weeklyQuestionOpen ? 1 : 0}`,
    [events, matches, engagement?.mercatoIncomplete, engagement?.weeklyQuestionOpen],
  );

  useEffect(() => {
    if (!profile?.uid) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void syncProdayLocalNotifications(
        profile,
        eventsRef.current,
        matchesRef.current,
        engagement,
      );
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [profile?.uid, calendarKey, engagement]);
}

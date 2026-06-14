import { useMemo } from 'react';
import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import { userRsvp } from '../models/TeamEvent';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';

export function useMatchScreenData(
  profile: User | null,
  teamEvents: TeamEvent[],
  calendarItems: SeasonCalendarItem[]
) {
  return useMemo(() => {
    if (!profile) {
      return {
        pendingConvocations: [] as TeamEvent[],
        myUpcomingEvents: [] as TeamEvent[],
        nextItem: null as SeasonCalendarItem | null,
      };
    }

    const now = Date.now();
    const pendingConvocations = teamEvents.filter(
      (e) =>
        e.invitee_uids.includes(profile.uid) &&
        userRsvp(e, profile.uid) === 'pending' &&
        e.starts_at.getTime() > now
    );

    const myUpcomingEvents = teamEvents.filter(
      (e) =>
        (e.organizer_uid === profile.uid ||
          userRsvp(e, profile.uid) === 'yes' ||
          userRsvp(e, profile.uid) === 'maybe') &&
        e.starts_at.getTime() > now
    );

    const nextItem =
      calendarItems.find((c) => c.starts_at.getTime() > now) ?? null;

    return { pendingConvocations, myUpcomingEvents, nextItem };
  }, [profile, teamEvents, calendarItems]);
}

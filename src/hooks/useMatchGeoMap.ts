import { useMemo, useState } from 'react';
import type { User } from '../models/User';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { TeamEvent } from '../models/TeamEvent';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';
import type { GeoRadiusKm } from '../core/types/geo';
import { buildGeoMarkers, filterByRadius, summarizeDensity } from '../core/geo/geoService';
import { useGeoLocation } from './useGeoLocation';

export function useMatchGeoMap(
  profile: User | null,
  matches: FriendlyMatch[],
  teamEvents: TeamEvent[],
  calendarItems: SeasonCalendarItem[]
) {
  const [radiusKm, setRadiusKm] = useState<GeoRadiusKm>(5);
  const { userLocation, refreshLocation, locating, locError } = useGeoLocation(profile);

  const allMarkers = useMemo(
    () =>
      buildGeoMarkers({
        userLocation,
        openMatches: matches.filter((m) => m.status === 'OPEN'),
        calendarItems,
        events: teamEvents,
        radiusKm: 10,
      }),
    [userLocation, matches, calendarItems, teamEvents]
  );

  const markers = useMemo(() => filterByRadius(allMarkers, radiusKm), [allMarkers, radiusKm]);
  const density = useMemo(() => summarizeDensity(allMarkers, radiusKm), [allMarkers, radiusKm]);

  return {
    radiusKm,
    setRadiusKm,
    userLocation,
    refreshLocation,
    locating,
    locError,
    markers,
    density,
    allMarkers,
  };
}

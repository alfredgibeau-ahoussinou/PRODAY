import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { ProDayLiveMap } from '../../components/geo/ProDayLiveMap';
import { ProDayText } from '../../components/ui/ProDayText';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { spacing, radius } from '../../theme/designTokens';
import type { TeamEvent } from '../../models/TeamEvent';
import type { GeoMarker } from '../../core/types/geo';
import { captureCurrentLocation, requestForegroundLocationPermission } from '../../utils/geoLocation';
import { distanceKm } from '../../utils/geofencing';
import { resolveCityCoords, isWithinWeek } from '../../utils/supporterCityGeo';
import type { GeoPoint } from '../../models/User';
import { PushScreenTransition } from '../../components/motion';
import { SupporterMatchDetailScreen } from './SupporterMatchDetailScreen';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';

function eventToMatchItem(event: TeamEvent): SupporterMatchViewItem {
  const live = event.live_state;
  const opponent = live?.opponent_name ?? event.title;
  const startsAt = event.starts_at instanceof Date ? event.starts_at : new Date(event.starts_at);
  return {
    id: `proday-event-${event.id}`,
    source: 'proday',
    status:
      live?.status === 'live' || live?.status === 'halftime'
        ? 'live'
        : startsAt.getTime() > Date.now()
          ? 'upcoming'
          : 'finished',
    genderScope: 'unspecified',
    homeLabel: event.club_name ?? 'ProDay',
    awayLabel: opponent,
    startsAt,
    scoreHome: live?.home_score,
    scoreAway: live?.away_score,
    meta: event.city,
    watchUrl: event.public_watch_url,
  };
}

type Props = {
  onBack?: () => void;
};

/** Carte football amateur — matchs ProDay cette semaine près de l'utilisateur. */
export const SupporterFootballMapScreen: React.FC<Props> = ({ onBack }) => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [userLoc, setUserLoc] = useState<GeoPoint | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [listMode, setListMode] = useState(false);

  const loadLocation = useCallback(async () => {
    setLoadingLoc(true);
    try {
      const ok = await requestForegroundLocationPermission();
      if (ok) {
        setUserLoc(await captureCurrentLocation());
      } else {
        setUserLoc(null);
        setListMode(true);
      }
    } catch {
      setUserLoc(null);
      setListMode(true);
    } finally {
      setLoadingLoc(false);
    }
  }, []);

  useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  const weekEvents = useMemo(
    () =>
      (events ?? []).filter(
        (e) =>
          (e.event_type === 'friendly' || e.event_type === 'competition' || e.event_type === 'tournament') &&
          isWithinWeek(e.starts_at),
      ),
    [events],
  );

  const markers: GeoMarker[] = useMemo(() => {
    const center = userLoc ?? resolveCityCoords('Paris');
    const rows: GeoMarker[] = [];
    for (const event of weekEvents) {
      const loc = resolveCityCoords(event.city);
      if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) continue;
      const dist = distanceKm(center, loc);
      rows.push({
        id: event.id,
        kind: 'match',
        title: event.club_name ?? event.title,
        subtitle: event.live_state?.opponent_name ?? event.location_label ?? event.city ?? 'ProDay',
        city: event.city ?? '',
        location: loc,
        distanceKm: Number.isFinite(dist) ? dist : 0,
        tab: 'matchs',
        entityId: event.id,
      });
    }
    return rows.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLoc, weekEvents]);

  const mapCenter = userLoc ?? (markers[0]?.location ?? resolveCityCoords('Paris'));

  const onMarkerPress = useCallback(
    (markerId: string) => {
      const event = weekEvents.find((e) => e.id === markerId);
      if (event) setSelected(eventToMatchItem(event));
    },
    [weekEvents],
  );

  if (selected) {
    return (
      <PushScreenTransition active={Boolean(selected)}>
        {selected ? (
          <SupporterMatchDetailScreen item={selected} onBack={() => setSelected(null)} />
        ) : null}
      </PushScreenTransition>
    );
  }

  return (
    <SupporterPageFrame identity={getSupporterPageIdentity('matchs')} showHero={false}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.back}>
          <ProDayText variant="caption" style={styles.backText}>
            ← Retour
          </ProDayText>
        </Pressable>
      ) : null}

      <ProDayText variant="section" style={styles.title}>
        Proche de toi
      </ProDayText>
      <ProDayText variant="caption" style={styles.sub}>
        Matchs ProDay cette semaine{tournaments.length > 0 ? ` · ${tournaments.length} tournoi(s) actifs` : ''}
      </ProDayText>

      {loadingLoc ? (
        <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginVertical: spacing.lg }} />
      ) : null}

      <Pressable onPress={() => setListMode((v) => !v)} style={styles.toggle}>
        <ProDayText variant="caption" style={styles.toggleText}>
          {listMode ? 'Voir la carte' : 'Voir la liste'}
        </ProDayText>
      </Pressable>

      {listMode || markers.length === 0 ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {markers.length === 0 ? (
            <ProDayText variant="body" style={styles.empty}>
              Aucun match ProDay cette semaine. Reviens plus tard ou élargis ta zone.
            </ProDayText>
          ) : (
            markers.map((m) => (
              <Pressable key={m.id} onPress={() => onMarkerPress(m.id)} style={styles.listRow}>
                <ProDayText variant="section" style={styles.listTitle}>
                  {m.title}
                </ProDayText>
                <ProDayText variant="caption" style={styles.listSub}>
                  {m.subtitle} · {m.city} · {m.distanceKm.toFixed(1)} km
                </ProDayText>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={styles.mapWrap}>
          <ProDayLiveMap
            center={mapCenter}
            radiusKm={10}
            markers={markers}
            onMarkerPress={onMarkerPress}
            accent={SUPPORTER_SITE.accent}
          />
        </View>
      )}
    </SupporterPageFrame>
  );
};

const styles = StyleSheet.create({
  back: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { color: SUPPORTER_SITE.accent, letterSpacing: 1.2, fontSize: 11, textTransform: 'uppercase' },
  title: { color: SUPPORTER_SITE.foreground, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  sub: { color: SUPPORTER_SITE.muted, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  toggle: { alignSelf: 'flex-end', marginRight: spacing.lg, marginBottom: spacing.sm },
  toggleText: { color: SUPPORTER_SITE.accent, fontSize: 11 },
  mapWrap: { paddingHorizontal: spacing.lg, flex: 1, minHeight: 280 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  listRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
    gap: 4,
  },
  listTitle: { color: SUPPORTER_SITE.foreground, fontSize: 15 },
  listSub: { color: SUPPORTER_SITE.muted, fontSize: 12 },
  empty: { color: SUPPORTER_SITE.muted, lineHeight: 22 },
});

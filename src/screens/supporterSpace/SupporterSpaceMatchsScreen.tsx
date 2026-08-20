import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterFootballFeed } from '../../hooks/supporterFootball';
import {
  DateStrip,
  FilterChips,
  MatchCard,
  SourceSegment,
  SpaceScreen,
  SpaceSection,
  type SupporterSourceSide,
} from '../../features/supporterSpace/components';
import {
  SUPPORTER_SPACE,
  SUPPORTER_SPACE_COPY,
} from '../../features/supporterSpace/theme/supporterSpaceTheme';
import type { Follow } from '../../models/Follow';
import { followsService } from '../../services/follows.service';
import type { GenderScope, UnifiedMatch } from '../../services/supporterFootball';
import { addDays, ymd } from '../../services/supporterFootball/mappers';
import { SupporterSpaceMatchCenterScreen } from './SupporterSpaceMatchCenterScreen';

const EMPTY: never[] = [];

const STATUS_CHIPS = [
  { id: 'all', label: 'Tous' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'finished', label: 'Terminés' },
];

const GENDER_CHIPS = [
  { id: 'all', label: 'Tous genres' },
  { id: 'men', label: 'Hommes' },
  { id: 'women', label: 'Femmes' },
  { id: 'youth', label: 'Jeunes' },
];

function inDateBucket(match: UnifiedMatch, bucket: string): boolean {
  const d = match.date;
  if (Number.isNaN(d.getTime())) return false;
  if (bucket.length === 10 && bucket.includes('-')) {
    return ymd(d) === bucket;
  }
  const today = ymd(new Date());
  const tomorrow = ymd(addDays(new Date(), 1));
  const key = ymd(d);
  if (bucket === 'today') return key === today;
  if (bucket === 'tomorrow') return key === tomorrow;
  if (bucket === 'week') {
    const end = ymd(addDays(new Date(), 7));
    return key >= today && key <= end;
  }
  if (bucket === 'weekend') {
    const day = d.getDay();
    return day === 0 || day === 6;
  }
  return true;
}

function applyFilters(
  list: UnifiedMatch[],
  status: string,
  gender: string,
  dateKey: string,
): UnifiedMatch[] {
  let out =
    status === 'live'
      ? list.filter((m) => m.status === 'live' || m.status === 'halftime')
      : list.filter((m) => inDateBucket(m, dateKey));
  if (status === 'upcoming') out = out.filter((m) => m.status === 'scheduled');
  if (status === 'finished') out = out.filter((m) => m.status === 'finished');
  if (gender !== 'all') {
    out = out.filter((m) => (m.genderScope as GenderScope | undefined) === gender);
  }
  return out;
}

export const SupporterSpaceMatchsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const sideBySide = width >= 720;
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [clubScope, setClubScope] = useState<'all' | 'followed'>('all');
  const [dayLeagues, setDayLeagues] = useState<UnifiedMatch[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) {
      setFollows([]);
      return;
    }
    try {
      const list = await followsService.listByFollower(profile.uid);
      setFollows((list ?? []).filter((f) => f.target_type === 'club'));
    } catch {
      setFollows([]);
    }
  }, [profile?.uid]);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  const feed = useSupporterFootballFeed({
    calendarEvents: events ?? EMPTY,
    tournaments: tournaments ?? EMPTY,
    follows,
    pollLive: true,
  });

  const [status, setStatus] = useState('all');
  const [gender, setGender] = useState('all');
  const [selectedDateKey, setSelectedDateKey] = useState(() => ymd(new Date()));
  const [sourceSide, setSourceSide] = useState<SupporterSourceSide>('all');
  const [selected, setSelected] = useState<UnifiedMatch | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch ligues for the selected calendar day (avoids empty when pool window misses the day).
  useEffect(() => {
    let cancelled = false;
    setDayLoading(true);
    void feed.facade
      .getLeagueMatches({ from: selectedDateKey, to: selectedDateKey })
      .then((list) => {
        if (!cancelled) setDayLeagues(list.filter((m) => m.source === 'external'));
      })
      .catch(() => {
        if (!cancelled) setDayLeagues([]);
      })
      .finally(() => {
        if (!cancelled) setDayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [feed.facade, selectedDateKey]);

  const clubScopeChips = useMemo(
    () => [
      { id: 'all', label: 'Tous clubs' },
      {
        id: 'followed',
        label: follows.length ? `Mes clubs (${follows.length})` : 'Mes clubs',
      },
    ],
    [follows.length],
  );

  const prodayPool = useMemo(
    () => dedupe([...feed.liveProday, ...feed.proday, ...feed.upcomingProday]),
    [feed.liveProday, feed.proday, feed.upcomingProday],
  );

  const leaguesPool = useMemo(
    () =>
      dedupe([
        ...feed.liveLeagues,
        ...feed.upcomingLeagues,
        ...feed.finishedLeagues,
        ...feed.leagues,
        ...dayLeagues,
        ...feed.favorites,
      ]).filter((m) => m.source === 'external'),
    [
      feed.liveLeagues,
      feed.upcomingLeagues,
      feed.finishedLeagues,
      feed.leagues,
      feed.favorites,
      dayLeagues,
    ],
  );

  const prodayFiltered = useMemo(
    () => applyFilters(prodayPool, status, gender, selectedDateKey),
    [prodayPool, status, gender, selectedDateKey],
  );

  const leaguesFiltered = useMemo(() => {
    const base =
      clubScope === 'followed'
        ? applyFilters(feed.favorites, status, gender, selectedDateKey)
        : applyFilters(leaguesPool, status, gender, selectedDateKey);
    return base;
  }, [clubScope, feed.favorites, leaguesPool, status, gender, selectedDateKey]);

  const showProday = sourceSide === 'all' || sourceSide === 'proday';
  const showLeagues = sourceSide === 'all' || sourceSide === 'leagues';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([feed.refresh({ silent: true }), loadFollows()]);
    setRefreshing(false);
  }, [feed, loadFollows]);

  if (selected) {
    return (
      <SupporterSpaceMatchCenterScreen
        matchId={selected.id}
        seed={selected}
        onClose={() => setSelected(null)}
        facade={feed.facade}
      />
    );
  }

  return (
    <SpaceScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={SUPPORTER_SPACE.accent}
        />
      }
    >
      <ProDayText variant="title" style={styles.title}>
        Matchs
      </ProDayText>

      <SourceSegment value={sourceSide} onChange={setSourceSide} showAll />
      <View style={styles.gap} />
      <FilterChips chips={STATUS_CHIPS} selectedId={status} onSelect={setStatus} />
      <View style={styles.gap} />
      <DateStrip selectedKey={selectedDateKey} onSelect={setSelectedDateKey} />
      <View style={styles.gap} />
      <FilterChips chips={GENDER_CHIPS} selectedId={gender} onSelect={setGender} />
      <View style={styles.gap} />
      <FilterChips
        chips={clubScopeChips}
        selectedId={clubScope}
        onSelect={(id) => setClubScope(id === 'followed' ? 'followed' : 'all')}
      />

      {feed.loading || dayLoading ? (
        <ActivityIndicator color={SUPPORTER_SPACE.accent} style={{ marginTop: 16 }} />
      ) : null}

      {feed.health?.mode === 'empty' && showLeagues ? (
        <ProDayText variant="body" style={styles.hint}>
          {SUPPORTER_SPACE_COPY.configureSportmonks}
        </ProDayText>
      ) : null}

      {feed.health?.mode === 'live' &&
      showLeagues &&
      feed.health.missingPreferredLeagueIds?.length ? (
        <ProDayText variant="body" style={styles.hint}>
          {feed.health.message || SUPPORTER_SPACE_COPY.planLimitedBanner}
        </ProDayText>
      ) : null}

      <View style={[styles.dual, sideBySide && styles.dualWide]}>
        {showProday ? (
          <View style={[styles.column, sideBySide && styles.columnWide]}>
            <SpaceSection title={SUPPORTER_SPACE_COPY.sectionProday}>
              {prodayFiltered.length ? (
                prodayFiltered.map((m) => (
                  <MatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
                ))
              ) : (
                <ProDayText variant="body" style={styles.empty}>
                  {SUPPORTER_SPACE_COPY.emptyProday}
                </ProDayText>
              )}
            </SpaceSection>
          </View>
        ) : null}

        {showLeagues ? (
          <View style={[styles.column, sideBySide && styles.columnWide]}>
            <SpaceSection
              title={
                clubScope === 'followed'
                  ? SUPPORTER_SPACE_COPY.sectionFollowedClubs
                  : SUPPORTER_SPACE_COPY.sectionLeagues
              }
            >
              {leaguesFiltered.length ? (
                leaguesFiltered.map((m) => (
                  <MatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
                ))
              ) : (
                <ProDayText variant="body" style={styles.empty}>
                  {clubScope === 'followed'
                    ? follows.length
                      ? SUPPORTER_SPACE_COPY.emptyFollowedClubs
                      : SUPPORTER_SPACE_COPY.emptyClubs
                    : status === 'live'
                      ? SUPPORTER_SPACE_COPY.emptyLive
                      : leaguesPool.length || dayLeagues.length
                        ? SUPPORTER_SPACE_COPY.emptyLeaguesDate
                        : feed.health?.message || SUPPORTER_SPACE_COPY.emptyLeagues}
                </ProDayText>
              )}
            </SpaceSection>
          </View>
        ) : null}
      </View>
    </SpaceScreen>
  );
};

function dedupe(list: UnifiedMatch[]): UnifiedMatch[] {
  const seen = new Set<string>();
  return list.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

const styles = StyleSheet.create({
  title: { color: SUPPORTER_SPACE.foreground, marginBottom: 12, fontSize: 22, fontWeight: '700' },
  gap: { height: 10 },
  empty: { color: SUPPORTER_SPACE.muted, marginTop: 4 },
  hint: { color: SUPPORTER_SPACE.muted, marginTop: 12, marginBottom: 4 },
  dual: { marginTop: 8, gap: 4 },
  dualWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  column: { flex: 1 },
  columnWide: { flex: 1, minWidth: 0 },
});

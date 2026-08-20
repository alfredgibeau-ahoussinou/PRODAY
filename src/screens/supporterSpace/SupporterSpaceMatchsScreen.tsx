import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterFootballFeed } from '../../hooks/supporterFootball';
import {
  FilterChips,
  MatchCard,
  SpaceScreen,
} from '../../features/supporterSpace/components';
import {
  SUPPORTER_SPACE,
  SUPPORTER_SPACE_COPY,
} from '../../features/supporterSpace/theme/supporterSpaceTheme';
import type { GenderScope, UnifiedMatch } from '../../services/supporterFootball';
import { addDays, ymd } from '../../services/supporterFootball/mappers';
import { SupporterSpaceMatchCenterScreen } from './SupporterSpaceMatchCenterScreen';

const EMPTY: never[] = [];

const STATUS_CHIPS = [
  { id: 'all', label: 'Tous' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'finished', label: 'Terminés' },
  { id: 'proday', label: 'ProDay' },
  { id: 'external', label: 'Externes' },
];

const GENDER_CHIPS = [
  { id: 'all', label: 'Tous genres' },
  { id: 'men', label: 'Hommes' },
  { id: 'women', label: 'Femmes' },
  { id: 'youth', label: 'Jeunes' },
];

const DATE_CHIPS = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'tomorrow', label: 'Demain' },
  { id: 'week', label: 'Semaine' },
  { id: 'weekend', label: 'Week-end' },
];

function inDateBucket(match: UnifiedMatch, bucket: string): boolean {
  const d = match.date;
  if (Number.isNaN(d.getTime())) return false;
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

function groupByDateThenComp(matches: UnifiedMatch[]): Array<{
  dateKey: string;
  competition: string;
  items: UnifiedMatch[];
}> {
  const map = new Map<string, UnifiedMatch[]>();
  for (const m of matches) {
    const dateKey = ymd(m.date);
    const key = `${dateKey}||${m.competition.name}`;
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const [dateKey, competition] = key.split('||');
      return { dateKey, competition, items };
    });
}

export const SupporterSpaceMatchsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const feed = useSupporterFootballFeed({
    calendarEvents: events ?? EMPTY,
    tournaments: tournaments ?? EMPTY,
    follows: [],
    pollLive: true,
  });
  const [status, setStatus] = useState('all');
  const [gender, setGender] = useState('all');
  const [dateBucket, setDateBucket] = useState('week');
  const [selected, setSelected] = useState<UnifiedMatch | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pool = useMemo(() => {
    const all = dedupe([...feed.live, ...feed.upcoming, ...feed.finished, ...feed.proday]);
    return all;
  }, [feed.live, feed.upcoming, feed.finished, feed.proday]);

  const filtered = useMemo(() => {
    // Onglet Live : toutes les fixtures inplay, sans filtre date (évite de masquer le live).
    let list =
      status === 'live'
        ? pool.filter((m) => m.status === 'live' || m.status === 'halftime')
        : pool.filter((m) => inDateBucket(m, dateBucket));
    if (status === 'upcoming') list = list.filter((m) => m.status === 'scheduled');
    if (status === 'finished') list = list.filter((m) => m.status === 'finished');
    if (status === 'proday') list = list.filter((m) => m.source === 'proday');
    if (status === 'external') list = list.filter((m) => m.source === 'external' || m.source === 'demo');
    if (gender !== 'all') {
      list = list.filter((m) => (m.genderScope as GenderScope | undefined) === gender);
    }
    return list;
  }, [pool, status, gender, dateBucket]);

  const groups = useMemo(() => groupByDateThenComp(filtered), [filtered]);

  const genderEmptyHonest =
    gender !== 'all' &&
    filtered.length === 0 &&
    pool.some((m) => status === 'live' || inDateBucket(m, dateBucket));

  const liveEmptyHonest =
    !feed.loading && status === 'live' && filtered.length === 0 && !genderEmptyHonest;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await feed.refresh({ silent: true });
    setRefreshing(false);
  }, [feed]);

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
          tintColor={SUPPORTER_SPACE.bright}
        />
      }
    >
      <ProDayText variant="title" style={styles.title}>
        Matchs
      </ProDayText>
      <FilterChips chips={STATUS_CHIPS} selectedId={status} onSelect={setStatus} />
      <View style={styles.gap} />
      <FilterChips chips={DATE_CHIPS} selectedId={dateBucket} onSelect={setDateBucket} />
      <View style={styles.gap} />
      <FilterChips chips={GENDER_CHIPS} selectedId={gender} onSelect={setGender} />

      {feed.loading ? (
        <ActivityIndicator color={SUPPORTER_SPACE.bright} style={{ marginTop: 24 }} />
      ) : null}

      {genderEmptyHonest ? (
        <ProDayText variant="body" style={styles.empty}>
          {SUPPORTER_SPACE_COPY.emptyCategory}
        </ProDayText>
      ) : null}

      {liveEmptyHonest ? (
        <ProDayText variant="body" style={styles.empty}>
          {SUPPORTER_SPACE_COPY.emptyLive}
        </ProDayText>
      ) : null}

      {!feed.loading && groups.length === 0 && !liveEmptyHonest ? (
        <ProDayText variant="body" style={styles.empty}>
          Aucun match pour ces filtres.
        </ProDayText>
      ) : null}

      {groups.map((g) => (
        <View key={`${g.dateKey}-${g.competition}`} style={styles.group}>
          <ProDayText variant="caption" style={styles.groupLabel}>
            {g.dateKey} · {g.competition}
          </ProDayText>
          {g.items.map((m) => (
            <MatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
          ))}
        </View>
      ))}
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
  title: { color: SUPPORTER_SPACE.foreground, marginBottom: 12, fontSize: 22 },
  gap: { height: 8 },
  empty: { color: SUPPORTER_SPACE.muted, marginTop: 16 },
  group: { marginTop: 16 },
  groupLabel: { color: SUPPORTER_SPACE.bright, marginBottom: 8 },
});

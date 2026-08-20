import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterFootballFeed } from '../../hooks/supporterFootball';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  LiveMatchCard,
  MatchCard,
  SpaceHero,
  SpaceScreen,
  SpaceSection,
} from '../../features/supporterSpace/components';
import {
  SUPPORTER_SPACE,
  SUPPORTER_SPACE_COPY,
} from '../../features/supporterSpace/theme/supporterSpaceTheme';
import { followsService } from '../../services/follows.service';
import type { Follow } from '../../models/Follow';
import type { UnifiedCompetitionRef, UnifiedMatch } from '../../services/supporterFootball';
import { SupporterSpaceMatchCenterScreen } from './SupporterSpaceMatchCenterScreen';
import { SupporterSpaceSearchScreen } from './SupporterSpaceSearchScreen';

const EMPTY_EVENTS: never[] = [];
const EMPTY_TOURNAMENTS: never[] = [];

/** Accueil Supporter Space V3. */
export const SupporterSpaceHomeScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [comps, setComps] = useState<UnifiedCompetitionRef[]>([]);
  const [selected, setSelected] = useState<UnifiedMatch | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const calendarEvents = events ?? EMPTY_EVENTS;
  const tournamentList = tournaments ?? EMPTY_TOURNAMENTS;

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) {
      setFollows([]);
      return;
    }
    try {
      const list = await followsService.listByFollower(profile.uid);
      setFollows(Array.isArray(list) ? list : []);
    } catch {
      setFollows([]);
    }
  }, [profile?.uid]);

  const feed = useSupporterFootballFeed({
    calendarEvents,
    tournaments: tournamentList,
    follows,
    pollLive: true,
  });

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  useEffect(() => {
    void feed.facade.getCompetitions().then(setComps).catch(() => setComps([]));
  }, [feed.facade]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([feed.refresh({ silent: true }), loadFollows()]);
    setRefreshing(false);
  }, [feed, loadFollows]);

  const heroMatch = useMemo(() => {
    if (feed.favorites[0]) return feed.favorites[0];
    if (feed.live[0]) return feed.live[0];
    if (feed.proday[0]) return feed.proday[0];
    return feed.upcoming[0] ?? null;
  }, [feed.favorites, feed.live, feed.proday, feed.upcoming]);

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

  if (showSearch) {
    return (
      <SupporterSpaceSearchScreen
        facade={feed.facade}
        onClose={() => setShowSearch(false)}
        onOpenMatch={(m) => {
          setShowSearch(false);
          setSelected(m);
        }}
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
      <SpaceHero
        heroMatch={heroMatch}
        onOpenMatch={setSelected}
        onSearch={() => setShowSearch(true)}
        onNotif={() => Alert.alert('Notifications', SUPPORTER_SPACE_COPY.notifStub)}
      />

      {feed.health?.mode === 'demo' ? (
        <View style={styles.banner}>
          <ProDayText variant="caption" style={styles.bannerText}>
            {SUPPORTER_SPACE_COPY.demoBanner}
          </ProDayText>
        </View>
      ) : null}

      {feed.loading && !feed.live.length && !feed.upcoming.length ? (
        <ActivityIndicator color={SUPPORTER_SPACE.bright} style={{ marginVertical: 24 }} />
      ) : null}

      <SpaceSection title="En direct" actionLabel="Matchs" onAction={() => nav.setActiveTab('matchs')}>
        {feed.live.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {feed.live.map((m) => (
              <LiveMatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
            ))}
          </ScrollView>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyLive}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Vos prochains">
        {feed.favorites.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {feed.favorites.slice(0, 8).map((m) => (
              <MatchCard key={m.id} match={m} compact onPress={() => setSelected(m)} />
            ))}
          </ScrollView>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyClubs}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Matchs ProDay" actionLabel="ProDay" onAction={() => nav.setActiveTab('feed')}>
        {feed.proday.length ? (
          feed.proday.slice(0, 5).map((m) => (
            <MatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
          ))
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyProday}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="À venir">
        {feed.upcoming.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {feed.upcoming.slice(0, 10).map((m) => (
              <MatchCard key={m.id} match={m} compact onPress={() => setSelected(m)} />
            ))}
          </ScrollView>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyUpcoming}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Résultats récents">
        {feed.finished.length ? (
          feed.finished.slice(0, 6).map((m) => (
            <MatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
          ))
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyFinished}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Vos clubs" actionLabel="Clubs" onAction={() => nav.setActiveTab('plus')}>
        {follows.length ? (
          <View style={styles.chips}>
            {follows.slice(0, 12).map((f) => (
              <Pressable
                key={f.id}
                style={styles.clubChip}
                onPress={() => nav.setActiveTab('plus')}
              >
                <ProDayText variant="caption" style={styles.clubChipText}>
                  {f.target_label || f.target_id}
                </ProDayText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyClubs}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="À découvrir">
        <ProDayText variant="body" style={styles.empty}>
          Explore les compétitions ci-dessous ou cherche un club.
        </ProDayText>
      </SpaceSection>

      <SpaceSection title="Compétitions">
        {comps.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {comps.slice(0, 16).map((c) => (
              <View key={c.id} style={styles.compCard}>
                <ProDayText variant="body" style={styles.compName} numberOfLines={2}>
                  {c.name}
                </ProDayText>
                {c.country ? (
                  <ProDayText variant="caption" style={styles.empty}>
                    {c.country}
                  </ProDayText>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            Compétitions chargées depuis l’API quand le token est actif.
          </ProDayText>
        )}
      </SpaceSection>
    </SpaceScreen>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  bannerText: { color: SUPPORTER_SPACE.demo },
  empty: { color: SUPPORTER_SPACE.muted, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clubChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: SUPPORTER_SPACE.elevated,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
  clubChipText: { color: SUPPORTER_SPACE.foreground },
  compCard: {
    width: 140,
    marginRight: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
  compName: { color: SUPPORTER_SPACE.foreground, marginBottom: 4 },
});

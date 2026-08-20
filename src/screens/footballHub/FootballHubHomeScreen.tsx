import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  HubClubChip,
  HubCompetitionCard,
  HubLiveScoreCard,
  HubMatchRow,
  HubScreen,
  HubSection,
} from '../../features/footballHub/components';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { followsService } from '../../services/follows.service';
import { supporterVideoService } from '../../services/supporterVideo.service';
import { footballDataFacade } from '../../services/footballData';
import { DEFAULT_SUPPORTER_MATCH_FILTERS } from '../../services/supporterPreferences.service';
import { findCompetitionById } from '../../content/supporterCompetitionsCatalog';
import type { Follow } from '../../models/Follow';
import type { SupporterVideo } from '../../models/SupporterVideo';
import type { FootballCompetitionEntry } from '../../services/footballData/types';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';
import { FootballHubSearchScreen } from './FootballHubSearchScreen';
import { FootballHubCompetitionScreen } from './FootballHubCompetitionScreen';
import { FootballHubDebateFeedScreen } from './FootballHubDebateFeedScreen';

const EMPTY_EVENTS: never[] = [];
const EMPTY_TOURNAMENTS: never[] = [];
const WORLD_CUP = findCompetitionById('world_cup')!;

/** Accueil PRODAY Football Hub. */
export const FootballHubHomeScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [videos, setVideos] = useState<SupporterVideo[]>([]);
  const [comps, setComps] = useState<FootballCompetitionEntry[]>([]);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showWorldCup, setShowWorldCup] = useState(false);
  const [showTribune, setShowTribune] = useState(false);

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

  const hub = useSupporterMatchHub({
    calendarEvents,
    tournaments: tournamentList,
    follows,
    filters: DEFAULT_SUPPORTER_MATCH_FILTERS,
    pollLive: true,
  });

  const loadExtras = useCallback(async () => {
    try {
      const [vids, catalog] = await Promise.all([
        supporterVideoService.listAvailable({ prodayEvents: calendarEvents, max: 8 }),
        footballDataFacade.listCompetitionsByCountry('FR'),
      ]);
      setVideos(Array.isArray(vids) ? vids : []);
      setComps((catalog ?? []).slice(0, 12));
    } catch {
      setVideos([]);
      setComps([]);
    }
  }, [calendarEvents]);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([hub.refresh({ silent: true }), loadFollows(), loadExtras()]);
    setRefreshing(false);
  }, [hub.refresh, loadFollows, loadExtras]);

  const live = hub.sections.live ?? [];
  const upcoming = (hub.sections.upcoming ?? []).slice(0, 12);
  const proday = (hub.sections.proday ?? []).slice(0, 8);
  const clubFollows = useMemo(
    () => follows.filter((f) => f.target_type === 'club'),
    [follows],
  );
  const apiUnhealthy = hub.providerState && hub.providerState.healthy === false;
  const showInitialSpinner = hub.loading && live.length === 0 && upcoming.length === 0;

  if (selected) {
    return (
      <FootballHubMatchCenterScreen item={selected} onBack={() => setSelected(null)} />
    );
  }

  if (showSearch) {
    return <FootballHubSearchScreen onBack={() => setShowSearch(false)} />;
  }

  if (showWorldCup && WORLD_CUP) {
    return (
      <FootballHubCompetitionScreen
        competition={WORLD_CUP}
        onBack={() => setShowWorldCup(false)}
      />
    );
  }

  if (showTribune) {
    return <FootballHubDebateFeedScreen onBack={() => setShowTribune(false)} />;
  }

  return (
    <HubScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={FOOTBALL_HUB.bright}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <ProDayText variant="caption" style={styles.eyebrow}>
            PRODAY FOOTBALL HUB
          </ProDayText>
          <View style={styles.heroActions}>
            <Pressable style={styles.heroBtn} onPress={() => setShowSearch(true)}>
              <Icon name="search" size={16} color={FOOTBALL_HUB.bright} />
              <ProDayText variant="caption" style={styles.heroBtnLabel}>
                {FOOTBALL_HUB_COPY.searchCta}
              </ProDayText>
            </Pressable>
            <Pressable style={styles.heroBtn} onPress={() => setShowTribune(true)}>
              <Icon name="chat" size={16} color={FOOTBALL_HUB.bright} />
              <ProDayText variant="caption" style={styles.heroBtnLabel}>
                {FOOTBALL_HUB_COPY.tribuneCta}
              </ProDayText>
            </Pressable>
          </View>
        </View>
        <ProDayText variant="hero" style={styles.heroTitle}>
          {FOOTBALL_HUB_COPY.heroTitle}
        </ProDayText>
        <ProDayText variant="body" style={styles.heroSub}>
          {FOOTBALL_HUB_COPY.heroSubtitle}
        </ProDayText>
      </View>

      {apiUnhealthy ? (
        <View style={styles.banner}>
          <ProDayText variant="caption" style={styles.bannerText}>
            {hub.providerState.message ?? FOOTBALL_HUB_COPY.apiBanner}
          </ProDayText>
          <Pressable
            style={styles.retryBtn}
            onPress={() => void hub.refresh({ silent: false })}
          >
            <ProDayText variant="caption" style={styles.retryLabel}>
              Réessayer
            </ProDayText>
          </Pressable>
        </View>
      ) : null}

      {showInitialSpinner ? (
        <ActivityIndicator color={FOOTBALL_HUB.bright} />
      ) : null}

      <HubSection
        title="Matchs en direct"
        actionLabel="Voir tout"
        onAction={() => nav.openMatchs?.({ supporterChapter: 'live' })}
        emptyLabel={!hub.loading && live.length === 0 ? FOOTBALL_HUB_COPY.emptyLive : undefined}
        loading={hub.loading && live.length === 0}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {live.map((item) => (
            <HubLiveScoreCard key={item.id} item={item} onPress={() => setSelected(item)} />
          ))}
        </ScrollView>
      </HubSection>

      <HubSection
        title="Prochains matchs"
        actionLabel="Calendrier"
        onAction={() => nav.setActiveTab?.('matchs')}
        emptyLabel={!hub.loading && upcoming.length === 0 ? FOOTBALL_HUB_COPY.emptyUpcoming : undefined}
      >
        {upcoming.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <HubSection title="Compétitions phares">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {WORLD_CUP ? (
            <HubCompetitionCard
              label={WORLD_CUP.label}
              country={WORLD_CUP.country}
              onPress={() => setShowWorldCup(true)}
            />
          ) : null}
          {comps.map((c) => (
            <HubCompetitionCard
              key={c.id}
              label={c.label}
              country={c.country}
              onPress={() => nav.setActiveTab?.('matchs')}
            />
          ))}
        </ScrollView>
      </HubSection>

      <HubSection
        title="Mes clubs"
        actionLabel="Favoris"
        onAction={() => nav.setActiveTab?.('plus')}
        emptyLabel={clubFollows.length === 0 ? FOOTBALL_HUB_COPY.emptyFavorites : undefined}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {clubFollows.map((f) => (
            <HubClubChip
              key={f.id}
              label={f.target_label || f.target_id}
              onPress={() => nav.setActiveTab?.('plus')}
            />
          ))}
        </ScrollView>
      </HubSection>

      <HubSection
        title="Matchs ProDay"
        actionLabel="ProDay"
        onAction={() => nav.setActiveTab?.('feed')}
        emptyLabel={!hub.loading && proday.length === 0 ? FOOTBALL_HUB_COPY.emptyProday : undefined}
      >
        {proday.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <HubSection
        title="À revoir"
        emptyLabel={videos.length === 0 ? FOOTBALL_HUB_COPY.emptyVideos : undefined}
      >
        {videos.map((v) => (
          <Pressable key={v.id} style={styles.videoRow} onPress={() => undefined}>
            <ProDayText variant="body" style={styles.videoTitle} numberOfLines={1}>
              {v.title || 'Replay ProDay'}
            </ProDayText>
            <ProDayText variant="caption" style={styles.muted}>
              Droits OK
            </ProDayText>
          </Pressable>
        ))}
      </HubSection>

      <HubSection title="Découvrir">
        <Pressable style={styles.discoverBtn} onPress={() => setShowSearch(true)}>
          <ProDayText variant="body" style={styles.discoverLabel}>
            Chercher clubs & compétitions
          </ProDayText>
        </Pressable>
      </HubSection>
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  hero: { gap: 8, paddingTop: 4 },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FOOTBALL_HUB.soft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  heroBtnLabel: { color: FOOTBALL_HUB.bright, fontWeight: '700' },
  eyebrow: {
    color: FOOTBALL_HUB.bright,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  heroTitle: {
    color: FOOTBALL_HUB.foreground,
    fontSize: 28,
    lineHeight: 34,
  },
  heroSub: { color: FOOTBALL_HUB.muted },
  banner: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    gap: 10,
  },
  bannerText: { color: FOOTBALL_HUB.danger },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: FOOTBALL_HUB.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  retryLabel: { color: FOOTBALL_HUB.bright, fontWeight: '700' },
  videoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  videoTitle: { color: FOOTBALL_HUB.foreground, flex: 1, marginRight: 8 },
  muted: { color: FOOTBALL_HUB.muted },
  discoverBtn: {
    backgroundColor: FOOTBALL_HUB.soft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    marginBottom: 10,
  },
  discoverLabel: { color: FOOTBALL_HUB.bright, fontWeight: '600' },
});

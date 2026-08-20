import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { SupporterMatchCard } from '../../components/supporter/SupporterMatchCard';
import { SupporterClubSearch } from '../../components/supporter/SupporterClubSearch';
import { ProDayText } from '../../components/ui/ProDayText';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { SupporterHubSection } from '../../features/supporter/components/SupporterHubSection';
import { SupporterHeroLiveCard } from '../../features/supporter/components/SupporterHeroLiveCard';
import { SupporterMatchDuJourCard } from '../../features/supporter/components/SupporterMatchDuJourCard';
import { SupporterProDayBridgeCard } from '../../features/supporter/components/SupporterProDayBridgeCard';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { followsService } from '../../services/follows.service';
import { supporterVideoService } from '../../services/supporterVideo.service';
import type { Follow } from '../../models/Follow';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { spacing, radius } from '../../theme/designTokens';
import { PushScreenTransition } from '../../components/motion';
import { SupporterMatchDetailScreen } from './SupporterMatchDetailScreen';
import { SupporterFootballMapScreen } from './SupporterFootballMapScreen';
import { SupporterLiveNowScreen } from './SupporterLiveNowScreen';
import { SupporterSuivisScreen } from '../SupporterSuivisScreen';
import { loadSupporterNotificationPrefs } from '../../services/supporterPreferences.service';
import { supporterNotificationPlanner } from '../../services/supporterNotificationPlanner';
import type { SupporterVideo } from '../../models/SupporterVideo';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { openClubHelpChatbot } from '../../features/club/shell/clubHelpOpen';
import { PoleHelpPanel } from '../../components/help/PoleHelpPanel';
import { getPoleHelpContent, getPoleHelpQuestionCount } from '../../content/poleHelpContent';
import { openSupporterLive } from '../../utils/supporterMatchsDeepLink';

/** Accueil — Centre du football (hub V2). */
export const SupporterFootballHubScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [showSuivis, setShowSuivis] = useState(false);
  const [videos, setVideos] = useState<SupporterVideo[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const list = await followsService.listByFollower(profile.uid);
      setFollows(Array.isArray(list) ? list : []);
      setFollowedIds(new Set((list ?? []).map((f) => f.target_id)));
    } catch {
      setFollows([]);
      setFollowedIds(new Set());
    }
  }, [profile?.uid]);

  const toggleFollow = useCallback(
    async (id: string, label: string) => {
      if (!profile?.uid) return;
      await followsService.toggle(profile.uid, 'club', id, label);
      await loadFollows();
    },
    [profile?.uid, loadFollows],
  );

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  const hub = useSupporterMatchHub({
    calendarEvents: events,
    tournaments,
    follows,
    filters: { gender: 'all', source: 'all', scope: 'all', competition: 'all' },
    pollLive: true,
  });

  const loadVideos = useCallback(async () => {
    try {
      const list = await supporterVideoService.listAvailable({ prodayEvents: events ?? [], max: 8 });
      setVideos(Array.isArray(list) ? list : []);
    } catch {
      setVideos([]);
    }
  }, [events]);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    if (!profile?.uid) return;
    void (async () => {
      try {
        const prefs = await loadSupporterNotificationPrefs(profile.uid);
        const followed = new Set((follows ?? []).map((f) => f.target_id));
        const upcoming = [
          ...(hub.sections.upcoming ?? []),
          ...(hub.sections.follows ?? []),
          ...(hub.heroKickoffs ?? []),
        ];
        const reminders = supporterNotificationPlanner.buildKickoffReminders(upcoming, followed);
        await supporterNotificationPlanner.scheduleNotifications(prefs, reminders);
      } catch {
        /* notifications optionnelles */
      }
    })();
  }, [profile?.uid, follows, hub.sections.upcoming, hub.sections.follows, hub.heroKickoffs]);

  const pourToiItems = useMemo(() => {
    const fromFollows = (hub.sections.follows ?? []).slice(0, 3);
    if (fromFollows.length >= 3) return fromFollows;
    const ids = new Set(fromFollows.map((m) => m.id));
    const fromUpcoming = (hub.sections.upcoming ?? []).filter((m) => !ids.has(m.id));
    const merged = [...fromFollows, ...fromUpcoming];
    if (merged.length >= 3) return merged.slice(0, 3);
    merged.forEach((m) => ids.add(m.id));
    const fromWorld = (hub.sections.world ?? []).filter((m) => !ids.has(m.id));
    return [...merged, ...fromWorld].slice(0, 3);
  }, [hub.sections.follows, hub.sections.upcoming, hub.sections.world]);

  const helpContent = useMemo(() => getPoleHelpContent('supporter', 'supporter'), []);
  const helpCount = useMemo(() => getPoleHelpQuestionCount(helpContent), [helpContent]);

  const openHelp = useCallback(() => {
    if (!openClubHelpChatbot()) setShowHelp(true);
  }, []);
  const firstName = profile?.display_name?.split(' ')[0]?.trim() || 'Supporter';
  const liveItems = hub.sections.live.slice(0, 4);
  const upcomingHero =
    hub.heroKickoffs[0] ?? hub.sections.upcoming[0] ?? hub.sections.world[0];
  const prodayWeekend = hub.sections.proday.filter((m) => m.status === 'upcoming').length;

  const followedClubCount = useMemo(
    () => follows.filter((f) => f.target_type === 'club').length,
    [follows],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([hub.refresh(), loadFollows(), loadVideos()]);
    } finally {
      setRefreshing(false);
    }
  }, [hub, loadFollows, loadVideos]);

  if (showLive) {
    return (
      <PushScreenTransition active={showLive}>
        <SupporterLiveNowScreen onBack={() => setShowLive(false)} />
      </PushScreenTransition>
    );
  }

  if (showMap) {
    return (
      <PushScreenTransition active={showMap}>
        <SupporterFootballMapScreen onBack={() => setShowMap(false)} />
      </PushScreenTransition>
    );
  }

  if (showSuivis) {
    return (
      <PushScreenTransition active={showSuivis}>
        <View style={{ flex: 1, backgroundColor: SUPPORTER_SITE.bg }}>
          <PressableSpring
            style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}
            onPress={() => setShowSuivis(false)}
            haptic
          >
            <ProDayText variant="caption" style={styles.link}>
              ← Accueil
            </ProDayText>
          </PressableSpring>
          <SupporterSuivisScreen />
        </View>
      </PushScreenTransition>
    );
  }

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
    <>
    <SupporterPageFrame identity={getSupporterPageIdentity('tribune')} showHero={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SUPPORTER_SITE.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <ProDayText variant="caption" style={styles.greetingEyebrow}>
            Centre du football
          </ProDayText>
          <ProDayText variant="hero" style={styles.greetingTitle}>
            Bonjour {firstName}
          </ProDayText>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable onPress={() => setShowSuivis(true)} style={styles.chip}>
            <ProDayText variant="caption" style={styles.chipText}>
              {followedClubCount} club{followedClubCount !== 1 ? 's' : ''} suivi{followedClubCount !== 1 ? 's' : ''}
            </ProDayText>
          </Pressable>
          <Pressable
            onPress={() =>
              openSupporterLive({
                showOverlay: () => setShowLive(true),
                openMatchsLive: () => nav.openMatchs({ supporterChapter: 'live' }),
              })
            }
            style={[styles.chip, styles.chipLive]}
          >
            <ProDayText variant="caption" style={styles.chipLiveText}>
              {hub.liveCount > 0 ? `${hub.liveCount} en direct` : 'LIVE'}
            </ProDayText>
          </Pressable>
          <Pressable onPress={() => nav.setActiveTab('messages')} style={styles.chip}>
            <ProDayText variant="caption" style={styles.chipText}>
              Fil communauté
            </ProDayText>
          </Pressable>
        </ScrollView>

        {hub.loading && liveItems.length === 0 ? (
          <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginVertical: spacing.lg }} />
        ) : null}

        <SupporterHubSection
          title="Matchs en direct"
          subtitle={
            liveItems.length > 0
              ? `${hub.liveCount} match${hub.liveCount > 1 ? 's' : ''}`
              : undefined
          }
          action={
            <Pressable
              onPress={() =>
                openSupporterLive({
                  showOverlay: () => setShowLive(true),
                  openMatchsLive: () => nav.openMatchs({ supporterChapter: 'live' }),
                })
              }
            >
              <ProDayText variant="caption" style={styles.link}>
                Tout voir
              </ProDayText>
            </Pressable>
          }
        >
          {liveItems.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveStrip}>
              {liveItems.map((item) => (
                <View key={item.id} style={styles.liveCardWrap}>
                  <SupporterHeroLiveCard item={item} onPress={() => setSelected(item)} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyBlock}>
              <ProDayText variant="body" style={styles.emptyTitle}>
                Aucun match en direct — reviens bientôt
              </ProDayText>
              <View style={styles.emptyActions}>
                <Pressable
                  onPress={() =>
                    openSupporterLive({
                      showOverlay: () => setShowLive(true),
                      openMatchsLive: () => nav.openMatchs({ supporterChapter: 'live' }),
                    })
                  }
                  style={styles.emptyCta}
                >
                  <ProDayText variant="caption" style={styles.emptyCtaText}>
                    Voir Live
                  </ProDayText>
                </Pressable>
                <Pressable
                  onPress={() => nav.openMatchs({ supporterChapter: 'upcoming' })}
                  style={styles.emptyCta}
                >
                  <ProDayText variant="caption" style={styles.emptyCtaText}>
                    Matchs
                  </ProDayText>
                </Pressable>
              </View>
            </View>
          )}
        </SupporterHubSection>

        <SupporterHubSection title="À ne pas manquer">
          {upcomingHero ? (
            <SupporterMatchDuJourCard item={upcomingHero} onPress={() => setSelected(upcomingHero)} />
          ) : (
            <View style={styles.emptyBlock}>
              <ProDayText variant="body" style={styles.emptyTitle}>
                Prochains coups d’envoi à suivre
              </ProDayText>
              <View style={styles.emptyActions}>
                <Pressable onPress={() => setShowSuivis(true)} style={styles.emptyCta}>
                  <ProDayText variant="caption" style={styles.emptyCtaText}>
                    Suivre un club
                  </ProDayText>
                </Pressable>
                <Pressable
                  onPress={() => nav.openMatchs({ supporterChapter: 'upcoming' })}
                  style={styles.emptyCta}
                >
                  <ProDayText variant="caption" style={styles.emptyCtaText}>
                    Explorer Matchs
                  </ProDayText>
                </Pressable>
              </View>
            </View>
          )}
        </SupporterHubSection>

        <SupporterHubSection title="Proche de toi">
          <SupporterProDayBridgeCard
            count={prodayWeekend}
            onPress={() => setShowMap(true)}
          />
        </SupporterHubSection>

        <SupporterHubSection
          title="Pour toi"
          subtitle={pourToiItems.length > 0 ? 'Tes clubs, historique et compétitions' : undefined}
        >
          {pourToiItems.length > 0 ? (
            pourToiItems.map((item) => (
              <SupporterMatchCard key={item.id} item={item} compact onPress={() => setSelected(item)} />
            ))
          ) : (
            <View style={styles.emptyBlock}>
              <ProDayText variant="body" style={styles.emptyTitle}>
                Suis un club pour personnaliser ton fil
              </ProDayText>
              <View style={styles.emptyActions}>
                <Pressable onPress={() => setShowSuivis(true)} style={styles.emptyCta}>
                  <ProDayText variant="caption" style={styles.emptyCtaText}>
                    Clubs suivis
                  </ProDayText>
                </Pressable>
                <Pressable
                  onPress={() =>
                    openSupporterLive({
                      showOverlay: () => setShowLive(true),
                      openMatchsLive: () => nav.openMatchs({ supporterChapter: 'live' }),
                    })
                  }
                  style={styles.emptyCta}
                >
                  <ProDayText variant="caption" style={styles.emptyCtaText}>
                    Plus Live
                  </ProDayText>
                </Pressable>
              </View>
            </View>
          )}
        </SupporterHubSection>

        {videos.length > 0 ? (
          <SupporterHubSection
            title="Vidéos"
            action={
              <Pressable onPress={() => nav.setActiveTab('reels')}>
                <ProDayText variant="caption" style={styles.link}>
                  Tout voir
                </ProDayText>
              </Pressable>
            }
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoStrip}>
              {videos.map((v) => (
                <Pressable
                  key={v.id}
                  style={styles.videoTile}
                  onPress={() => {
                    if (v.watchUrl) {
                      void nav.setActiveTab('reels');
                      return;
                    }
                    nav.setActiveTab('reels');
                  }}
                >
                  <Icon name="videocam" size={18} color={SUPPORTER_SITE.accent} />
                  <ProDayText variant="caption" style={styles.videoTitle} numberOfLines={2}>
                    {v.title}
                  </ProDayText>
                </Pressable>
              ))}
            </ScrollView>
          </SupporterHubSection>
        ) : null}

        <SupporterHubSection title="Rechercher un club">
          <View style={styles.searchWrap}>
            <SupporterClubSearch
              followedIds={followedIds}
              onToggle={toggleFollow}
              compact
            />
          </View>
        </SupporterHubSection>

        <PressableSpring
          style={styles.iaCta}
          onPress={openHelp}
          scaleTo={0.97}
        >
          <Icon name="star-four-points" size={18} color={SUPPORTER_SITE.foreground} />
          <ProDayText variant="caption" style={styles.iaCtaText}>
            IA Supporter
          </ProDayText>
        </PressableSpring>
      </ScrollView>
    </SupporterPageFrame>
    <PoleHelpPanel
      visible={showHelp}
      content={helpContent}
      questionCount={helpCount}
      usesBriefcaseIcon={false}
      onClose={() => setShowHelp(false)}
    />
    </>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2, paddingTop: spacing.md },
  greeting: { paddingHorizontal: spacing.lg, gap: 4, marginBottom: spacing.md },
  greetingEyebrow: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.6,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  greetingTitle: { color: SUPPORTER_SITE.foreground, fontSize: 26 },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: SUPPORTER_SITE.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  chipLive: { borderColor: SUPPORTER_SITE.live, backgroundColor: 'rgba(52,211,153,0.12)' },
  chipText: { color: SUPPORTER_SITE.muted, fontSize: 11 },
  chipLiveText: { color: SUPPORTER_SITE.live, fontSize: 11, fontWeight: '700' },
  liveStrip: { paddingLeft: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm },
  liveCardWrap: { width: 300 },
  link: { color: SUPPORTER_SITE.accent },
  emptyBlock: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: SUPPORTER_SITE.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    gap: spacing.md,
  },
  emptyTitle: { color: SUPPORTER_SITE.muted, fontSize: 13 },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emptyCta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: SUPPORTER_SITE.deep,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  emptyCtaText: { color: SUPPORTER_SITE.accent, fontSize: 11 },
  videoStrip: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  videoTile: {
    width: 140,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: SUPPORTER_SITE.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    gap: spacing.sm,
  },
  videoTitle: { color: SUPPORTER_SITE.foreground, fontSize: 11 },
  searchWrap: { paddingHorizontal: spacing.lg },
  iaCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: SUPPORTER_SITE.deep,
    borderWidth: 1,
    borderColor: SUPPORTER_SITE.border,
  },
  iaCtaText: { color: SUPPORTER_SITE.foreground, letterSpacing: 0.5 },
});

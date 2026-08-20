import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { User } from '../../../models/User';
import { PressableSpring, StaggerReveal, PushScreenTransition } from '../../../components/motion';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useTournaments } from '../../../hooks/useTournaments';
import { useProDayBrain } from '../../../hooks/useProDayBrain';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { ReelsPreviewStrip } from '../components/ReelsPreviewStrip';
import { WeeklyQuestionHomeCard } from '../../../components/weeklyQuestion/WeeklyQuestionHomeCard';
import { PlayersListScreen } from '../../../screens/PlayersListScreen';
import { PlayerProfileScreen } from '../../../screens/PlayerProfileScreen';
import { useUserProfile } from '../../../hooks/useRecruitmentData';
import { spacing } from '../../../theme/designTokens';
import { trackV3Event } from '../../../core/analytics/v3Events';
import { SupporterLiveScoresStrip } from '../../../components/supporter/SupporterLiveScoresStrip';
import { SupporterPageFrame } from '../../../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity } from '../../../content/supporterPageIdentity';
import { SUPPORTER_SITE } from '../../../content/supporterPageIdentity';
import { useFollows } from '../../../hooks/useFollows';
import { useTranslation } from '../../../context/LocaleContext';
import { TAB_BAR_CONTENT_INSET } from '../../../components/navigation/BottomTabBar';

export interface SupporterHomeProps {
  profile: User;
  unreadMessages: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

type SupporterOverlay = 'players' | 'player_profile' | null;

type ZoneId = 'matchs' | 'suivis' | 'debats' | 'moments' | 'shop' | 'discovery';

const ZONES: {
  id: ZoneId;
  icon: IconName;
  title: string;
  body: string;
  accent?: boolean;
}[] = [
  {
    id: 'matchs',
    icon: 'football',
    title: 'Matchs',
    body: 'Live & calendrier',
    accent: true,
  },
  {
    id: 'suivis',
    icon: 'heart',
    title: 'Suivis',
    body: 'Clubs & joueurs',
  },
  {
    id: 'debats',
    icon: 'chat',
    title: 'Fil',
    body: 'Question & réponses',
  },
  {
    id: 'moments',
    icon: 'videocam',
    title: 'Moments',
    body: 'Reels communauté',
  },
  {
    id: 'discovery',
    icon: 'search',
    title: 'Découvrir',
    body: 'Joueurs à suivre',
  },
  {
    id: 'shop',
    icon: 'bag',
    title: 'Shop',
    body: 'Merch ProDay',
  },
];

/** Tribune home — composition cinéma, pas un dashboard staff. */
export const SupporterHomeDashboard: React.FC<SupporterHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { productLine } = useAppTheme();
  const identity = getSupporterPageIdentity('tribune');
  const { data, refresh } = useDashboardData(profile);
  const { tournaments, refresh: refreshTournaments } = useTournaments();
  const { players: followedPlayerDocs, clubs: followedClubDocs, refresh: refreshFollows } =
    useFollows(profile.uid);
  const { t } = useTranslation();
  const brain = useProDayBrain(profile, productLine);
  const nav = useTabNavigationActions();

  const [overlay, setOverlay] = useState<SupporterOverlay>(null);
  const [playerReturnOverlay, setPlayerReturnOverlay] = useState<
    Exclude<SupporterOverlay, 'player_profile'>
  >('players');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const { user: selectedPlayer } = useUserProfile(selectedPlayerId);

  const upcomingMatches = useMemo(
    () =>
      data.calendarItems
        .filter((item) => item.starts_at.getTime() > Date.now())
        .slice(0, 3),
    [data.calendarItems],
  );

  const upcomingTournaments = useMemo(
    () =>
      tournaments
        .filter((tournament) => tournament.starts_at.getTime() > Date.now())
        .slice(0, 2),
    [tournaments],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), refreshTournaments(), refreshFollows()]);
    await onRefresh?.();
  }, [refresh, refreshTournaments, refreshFollows, onRefresh]);

  const openZone = (id: ZoneId) => {
    trackV3Event('supporter_home_action', { action: id });
    switch (id) {
      case 'matchs':
        nav.openMatchs({ homeTab: 'season' });
        break;
      case 'suivis':
        nav.setActiveTab('feed');
        break;
      case 'debats':
        nav.setActiveTab('messages');
        break;
      case 'moments':
        nav.setActiveTab('reels');
        break;
      case 'discovery':
        setOverlay('players');
        break;
      case 'shop':
        nav.openShop();
        break;
    }
  };

  const followedClubs = followedClubDocs.slice(0, 3);
  const followedPlayers = followedPlayerDocs.slice(0, 4);

  return (
    <>
      <SupporterPageFrame identity={identity} badge="100 % gratuit">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={() => void handleRefresh()}
              tintColor={SUPPORTER_SITE.accent}
            />
          }
        >
          {data.loading ? (
            <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginVertical: spacing.lg }} />
          ) : null}

          <View style={styles.liveHead}>
            <ProDayText variant="caption" style={styles.kicker}>
              Jour J · Live
            </ProDayText>
            {unreadMessages > 0 ? (
              <ProDayText variant="caption" style={styles.unread}>
                {unreadMessages} débat(s)
              </ProDayText>
            ) : null}
          </View>
          <SupporterLiveScoresStrip onViewAll={() => nav.openMatchs({ homeTab: 'season' })} />

          <ProDayText variant="caption" style={styles.kicker}>
            {t('supporter.home.matchChapters')}
          </ProDayText>
          <View style={styles.chapterRow}>
            {(
              [
                { key: 'live', label: t('supporter.home.chapterLive') },
                { key: 'proday', label: t('supporter.home.chapterProday') },
                { key: 'world', label: t('supporter.home.chapterWorld') },
                { key: 'follows', label: t('supporter.home.chapterFollows') },
              ] as const
            ).map((entry) => (
              <PressableSpring
                key={entry.key}
                onPress={() => nav.openMatchs({ homeTab: 'season' })}
                style={styles.chapterChip}
              >
                <ProDayText variant="caption" style={styles.chapterChipText}>
                  {entry.label}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          <ProDayText variant="caption" style={styles.kicker}>
            Zones tribune
          </ProDayText>
          <View style={styles.zoneGrid}>
            {ZONES.map((z, index) => (
              <StaggerReveal key={z.id} index={index} delayStep={35}>
                <PressableSpring
                  onPress={() => openZone(z.id)}
                  scaleTo={0.97}
                  haptic
                  style={[styles.zone, z.accent && styles.zoneAccent]}
                >
                  <Icon
                    name={z.icon}
                    size={18}
                    color={z.accent ? SUPPORTER_SITE.accent : SUPPORTER_SITE.foreground}
                  />
                  <ProDayText variant="section" style={styles.zoneTitle}>
                    {z.title}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.zoneBody}>
                    {z.body}
                  </ProDayText>
                </PressableSpring>
              </StaggerReveal>
            ))}
          </View>

          <Section title="Prochains matchs" action="Tous" onAction={() => nav.openMatchs()}>
            {upcomingMatches.length === 0 ? (
              <Empty copy="Aucun match à venir. Suis un club pour remplir ta tribune." />
            ) : (
              upcomingMatches.map((item) => (
                <Row
                  key={item.id}
                  title={item.title}
                  meta={formatCalendarDate(item.starts_at)}
                  onPress={() => nav.openMatchs({ homeTab: 'season' })}
                />
              ))
            )}
          </Section>

          <Section
            title="Tournois"
            action="Voir"
            onAction={() => nav.openMatchs({ homeTab: 'tournois' })}
          >
            {upcomingTournaments.length === 0 ? (
              <Empty copy="Pas de tournoi annoncé pour l’instant." />
            ) : (
              upcomingTournaments.map((tournament) => (
                <Row
                  key={tournament.id}
                  title={tournament.title}
                  meta={`${tournament.city} · ${formatCalendarDate(tournament.starts_at)}`}
                  onPress={() => nav.openMatchs({ homeTab: 'tournois' })}
                />
              ))
            )}
          </Section>

          <Section title="Tes joueurs" action="Gérer" onAction={() => nav.setActiveTab('feed')}>
            {followedPlayers.length === 0 ? (
              <Empty copy="Aucun joueur suivi. Découvre des profils ou cherche dans Suivis." />
            ) : (
              followedPlayers.map((f) => {
                const [name, ...rest] = (f.target_label ?? f.target_id).split(' · ');
                return (
                  <Row
                    key={f.id}
                    title={name}
                    meta={rest.length ? rest.join(' · ') : t('supporter.home.followedPlayersMeta')}
                    onPress={() => {
                      setSelectedPlayerId(f.target_id);
                      setPlayerReturnOverlay(null);
                      setOverlay('player_profile');
                    }}
                  />
                );
              })
            )}
          </Section>

          {followedClubs.length > 0 ? (
            <Section title="Tes clubs" action="Suivis" onAction={() => nav.setActiveTab('feed')}>
              {followedClubs.map((f) => (
                <Row
                  key={f.id}
                  title={f.target_label ?? f.target_id}
                  meta="Club"
                  onPress={() => nav.setActiveTab('feed')}
                />
              ))}
            </Section>
          ) : null}

          <ReelsPreviewStrip
            items={brain.reelPreviews}
            onPress={() => nav.setActiveTab('reels')}
          />

          <WeeklyQuestionHomeCard
            profile={profile}
            onOpenFeed={() => nav.setActiveTab('messages')}
          />

          <PressableSpring
            onPress={() => setOverlay('players')}
            scaleTo={0.98}
            style={styles.favCard}
          >
            <Icon name="search" size={16} color={SUPPORTER_SITE.accent} />
            <View style={styles.favCopy}>
              <ProDayText variant="section" style={styles.zoneTitle}>
                {t('supporter.home.discoverPlayers')}
              </ProDayText>
              <ProDayText variant="caption" style={styles.zoneBody}>
                {followedPlayerDocs.length > 0
                  ? `${followedPlayerDocs.length} joueur(s) suivi(s) · ${t('supporter.home.discoverPlayersSub')}`
                  : t('supporter.home.discoverPlayersSub')}
              </ProDayText>
            </View>
          </PressableSpring>

          <View style={styles.freeStamp}>
            <ProDayText variant="caption" style={styles.freeStampText}>
              Tribune 100 % gratuite · pas de Mercato · pas de paywall
            </ProDayText>
          </View>
        </ScrollView>
      </SupporterPageFrame>

      <PushScreenTransition active={overlay === 'players'}>
        {overlay === 'players' ? (
          <PlayersListScreen
            onBack={() => setOverlay(null)}
            onSelectPlayer={(player) => {
              setSelectedPlayerId(player.uid);
              setPlayerReturnOverlay('players');
              setOverlay('player_profile');
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={overlay === 'player_profile' && Boolean(selectedPlayer)}>
        {overlay === 'player_profile' && selectedPlayer ? (
          <PlayerProfileScreen
            player={selectedPlayer}
            onBack={() => {
              setOverlay(playerReturnOverlay);
              setSelectedPlayerId(null);
            }}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <ProDayText variant="caption" style={styles.kicker}>
          {title}
        </ProDayText>
        {action && onAction ? (
          <PressableSpring onPress={onAction} scaleTo={0.97}>
            <ProDayText variant="caption" style={styles.action}>
              {action}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Row({
  title,
  meta,
  onPress,
}: {
  title: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} style={styles.row}>
      <View style={styles.rowCopy}>
        <ProDayText variant="section" style={styles.zoneTitle}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.zoneBody}>
          {meta}
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={14} color={SUPPORTER_SITE.muted} />
    </PressableSpring>
  );
}

function Empty({ copy }: { copy: string }) {
  return (
    <ProDayText variant="caption" style={styles.empty}>
      {copy}
    </ProDayText>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  liveHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    color: SUPPORTER_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '800',
  },
  unread: { color: SUPPORTER_SITE.live, fontWeight: '700', fontSize: 11 },
  chapterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.xs,
  },
  chapterChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: 'rgba(60, 0, 240, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chapterChipText: {
    color: SUPPORTER_SITE.bright,
    fontWeight: '700',
    fontSize: 11,
  },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zone: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    gap: 4,
  },
  zoneAccent: {
    borderColor: SUPPORTER_SITE.accent,
    backgroundColor: SUPPORTER_SITE.soft,
  },
  zoneTitle: { color: SUPPORTER_SITE.foreground, fontWeight: '800', fontSize: 13 },
  zoneBody: { color: SUPPORTER_SITE.muted, fontSize: 11, lineHeight: 15 },
  section: { gap: 6 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: { color: SUPPORTER_SITE.bright, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
  },
  rowCopy: { flex: 1, gap: 2 },
  empty: { color: SUPPORTER_SITE.muted, lineHeight: 18, paddingVertical: 8 },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: SUPPORTER_SITE.accent,
    padding: spacing.md,
  },
  favCopy: { flex: 1, gap: 2 },
  freeStamp: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  freeStampText: {
    color: SUPPORTER_SITE.free,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
});

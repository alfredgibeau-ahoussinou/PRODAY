import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import type { User } from '../models/User';
import { Icon } from '../components/ui/Icon';
import { ProfileCompletionBar } from '../components/ProfileCompletionBar';
import { OrganizerReminderCard } from '../components/OrganizerReminderCard';
import { DashboardHero, type DashboardHeroStat } from '../components/home/DashboardHero';
import { DashboardQuickActions, type DashboardAction } from '../components/home/DashboardQuickActions';
import { DashboardSeasonPanel } from '../components/home/DashboardSeasonPanel';
import { DashboardWeekTimeline } from '../components/dashboard/DashboardWeekTimeline';
import { DashboardTopBar } from '../components/home/DashboardTopBar';
import { DashboardHomePager } from '../components/home/DashboardHomePager';
import { HomeModuleRail } from '../components/home/HomeModuleRail';
import { DashboardRolePanel } from '../components/dashboard/DashboardRolePanel';
import { PhysioCarePanel } from '../components/feed/PhysioCarePanel';
import type { ProDayModuleId } from '../content/prodayModules';
import type { DashboardChapterId } from '../content/dashboardChapters';
import { getPulseBreakdown } from '../utils/prodayPulse';
import { SponsorsScreen } from './SponsorsScreen';
import { TeamManagementScreen } from './TeamManagementScreen';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { openSeasonCalendarItem } from '../utils/navigationDeepLink';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { useDashboardData } from '../hooks/useDashboardData';
import { useOrganizerReminders } from '../hooks/useOrganizerReminders';
import { teamEventsService } from '../services/teamEvents.service';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { ProDayText } from '../components/ui/ProDayText';
import { PushScreenTransition, PressableSpring, SkeletonList } from '../components/motion';
import { OfflineCacheBanner } from '../components/ui/OfflineCacheBanner';
import { spacing, radius } from '../theme/designTokens';
import {
  canAccessSponsorsModule,
  getDashboardQuickAccessLabel,
  getMercatoTabLabel,
  getVisibleMainTabs,
  getDashboardLayoutKind,
} from '../content/poleExperience';
import { canPublishRecruitmentPost } from '../utils/roleCapabilities';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';

type DashboardView = 'main' | 'team' | 'sponsors';

interface DashboardScreenProps {
  profile: User;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ profile }) => {
  const { colors: themeColors, productLine } = useThemedScreen();
  const layoutKind = getDashboardLayoutKind(productLine, profile.role);
  const isAmateurPlayer = layoutKind === 'amateur_player';
  const isProLayout = layoutKind === 'pro';
  const showSponsors = canAccessSponsorsModule(productLine, profile.role);
  const quickAccessLabel = getDashboardQuickAccessLabel(productLine, profile.role);
  const firstName = profile.display_name.split(' ')[0];

  const [view, setView] = useState<DashboardView>('main');
  const [chapter, setChapter] = useState<DashboardChapterId>('cockpit');
  const { pendingDashboardView, clearPendingDashboard, openChat } = useTabNavigation();
  const nav = useTabNavigationActions();
  const { count: unreadCount } = useUnreadMessageCount();
  const { data, refresh } = useDashboardData(profile);
  const [refreshing, setRefreshing] = useState(false);

  const isStaff =
    profile.role === 'coach' ||
    profile.role === 'agent' ||
    profile.role === 'recruiter' ||
    profile.role === 'physio' ||
    profile.role === 'club';
  const isOrganizer =
    profile.role === 'coach' ||
    profile.role === 'organizer' ||
    profile.role === 'agent' ||
    profile.role === 'club';
  const pendingVerify = isStaff && profile.verification_status === 'PENDING';

  const { items: reminderItems, loading: loadingReminders, refresh: refreshReminders } =
    useOrganizerReminders(isOrganizer && isProLayout ? profile.uid : undefined);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshReminders()]);
    setRefreshing(false);
  }, [refresh, refreshReminders]);

  const handleQuickRemind = async (eventId: string) => {
    setRemindingId(eventId);
    try {
      const n = await teamEventsService.sendReminders(eventId);
      Alert.alert(
        'Relance',
        n > 0
          ? productLine === 'woman'
            ? `${n} joueuse${n > 1 ? 's' : ''} relancée${n > 1 ? 's' : ''}.`
            : `${n} joueur${n > 1 ? 's' : ''} relancé${n > 1 ? 's' : ''}.`
          : 'Aucune réponse en attente.'
      );
      refreshReminders();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    } finally {
      setRemindingId(null);
    }
  };

  const goMatchs = () => nav.openMatchs();
  const goRecruitment = () => {
    if (canPublishRecruitmentPost(profile.role)) {
      nav.openMercato('create_post');
    } else {
      nav.setActiveTab('recrutement');
    }
  };
  const goMessages = () => nav.setActiveTab('messages');
  const goHealth = () => nav.setActiveTab('sante');
  const goCarpool = () => nav.setActiveTab('covoiturage');
  const goProfile = () => nav.openProfile();

  const visibleTabs = getVisibleMainTabs(productLine, profile.role);
  const showFeedShortcut = visibleTabs.includes('feed');
  const showCarpoolShortcut = visibleTabs.includes('covoiturage');
  const showHealthShortcut = visibleTabs.includes('sante');

  const quickActions = useMemo((): DashboardAction[] => {
    const actions: DashboardAction[] = [];
    if (visibleTabs.includes('recrutement')) {
      actions.push({
        id: 'mercato',
        label: getMercatoTabLabel(productLine, profile.role),
        sublabel: 'Annonces clubs',
        icon: 'search',
        onPress: goRecruitment,
      });
    }
    if (visibleTabs.includes('matchs')) {
      actions.push({
        id: 'matchs',
        label: 'Matchs',
        sublabel: 'Calendrier & amicaux',
        icon: 'handshake',
        onPress: goMatchs,
      });
    }
    actions.push({
      id: 'messages',
      label: 'Messages',
      sublabel: unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Messagerie',
      icon: 'chat',
      onPress: goMessages,
    });
    if (showHealthShortcut) {
      actions.push({
        id: 'sante',
        label: 'Santé',
        sublabel: 'Kiné & suivi',
        icon: 'heart',
        onPress: goHealth,
      });
    } else if (showCarpoolShortcut) {
      actions.push({
        id: 'covoiturage',
        label: 'Covoiturage',
        sublabel: 'Trajets équipe',
        icon: 'car',
        onPress: goCarpool,
      });
    }
    return actions;
  }, [
    visibleTabs,
    productLine,
    profile.role,
    showHealthShortcut,
    showCarpoolShortcut,
    unreadCount,
  ]);

  const heroStats = useMemo((): DashboardHeroStat[] => {
    const stats: DashboardHeroStat[] = [];
    if (profile.role === 'player') {
      stats.push({
        key: 'applications',
        label: 'Candidatures',
        value: data.myApplications.length,
        onPress: () => nav.openProfile('applications'),
      });
    }
    if (data.pendingConvocations.length > 0) {
      stats.push({
        key: 'convoc',
        label: 'Convocations',
        value: data.pendingConvocations.length,
        onPress: goMatchs,
      });
    }
    if (data.calendarItems.length > 0) {
      stats.push({
        key: 'events',
        label: 'Événements',
        value: data.calendarItems.length,
        onPress: goMatchs,
      });
    }
    if (data.stats?.recruitment_posts_open) {
      stats.push({
        key: 'posts',
        label: 'Annonces live',
        value: data.stats.recruitment_posts_open,
        onPress: goRecruitment,
      });
    }
    return stats.slice(0, 3);
  }, [profile.role, data, nav]);

  const pulseBreakdown = getPulseBreakdown(profile, {
    pendingConvocations: data.pendingConvocations.length,
    applicationsCount: data.myApplications.length,
    upcomingEvents: data.calendarItems.length,
  });

  const onModulePress = (id: ProDayModuleId) => {
    switch (id) {
      case 'recrutement':
        goRecruitment();
        break;
      case 'matchs':
        goMatchs();
        break;
      case 'sponsors':
        if (showSponsors) setView('sponsors');
        break;
      case 'gestion':
        setView('team');
        break;
    }
  };

  useEffect(() => {
    if (!pendingDashboardView) return;
    if (pendingDashboardView === 'feed') {
      nav.setActiveTab('feed');
    } else {
      setView(pendingDashboardView);
    }
    clearPendingDashboard();
  }, [pendingDashboardView, clearPendingDashboard, nav]);

  const handleAgendaItem = (item: SeasonCalendarItem) => {
    openSeasonCalendarItem(item, nav);
  };

  const handleNextUp = () => {
    if (data.nextItem) openSeasonCalendarItem(data.nextItem, nav);
    else nav.openMatchs();
  };

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    nestedScrollEnabled: true,
    keyboardShouldPersistTaps: 'handled' as const,
  };

  const verifyAlert = isProLayout && pendingVerify ? (
    <PressableSpring
      style={[
        styles.alertCard,
        {
          backgroundColor: themeColors.warningBg,
          borderColor: themeColors.warning,
        },
      ]}
      onPress={goProfile}
      scaleTo={0.98}
      haptic
    >
      <Icon name="warning" size={22} color={themeColors.warning} />
      <View style={styles.alertBody}>
        <ProDayText variant="section">Vérification en cours</ProDayText>
        <ProDayText variant="body" muted>
          Complétez votre dossier pour la messagerie.
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={20} color={themeColors.warning} />
    </PressableSpring>
  ) : null;

  const pages = useMemo(
    () => [
      {
        id: 'cockpit' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={themeColors.accent}
              />
            }
            {...scrollProps}
          >
            <DashboardHero
              variant="pulse"
              profile={profile}
              pulse={data.pulse}
              breakdown={pulseBreakdown}
              unreadMessages={unreadCount}
              stats={heroStats}
              onProfilePress={goProfile}
              onMessagesPress={goMessages}
              onFeedPress={showFeedShortcut ? () => nav.setActiveTab('feed') : undefined}
              onHealthPress={showHealthShortcut ? goHealth : undefined}
              onCarpoolPress={showCarpoolShortcut ? goCarpool : undefined}
            />
            <DashboardQuickActions actions={quickActions} />
            {verifyAlert}
            {data.loading ? (
              <SkeletonList count={2} variant="card" />
            ) : null}
          </ScrollView>
        ),
      },
      {
        id: 'outils' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            <ProDayText variant="eyebrow" style={styles.sectionLabel}>
              {quickAccessLabel}
            </ProDayText>
            <HomeModuleRail
              onModulePress={onModulePress}
              liveRecruitment={Boolean(data.stats?.recruitment_posts_open)}
              role={profile.role}
            />
            <DashboardRolePanel
              profile={profile}
              layoutKind={layoutKind}
              applications={data.myApplications}
              detections={data.detections}
              openMatches={data.openMatches}
              onRecruitment={goRecruitment}
              onDetections={() => nav.openMercato('detections')}
              onMercatoStages={() => nav.openMercato('stages')}
              onMatches={goMatchs}
              onApplications={() => nav.openProfile('applications')}
              onHealth={goHealth}
              onSponsors={showSponsors ? () => setView('sponsors') : undefined}
              onProfile={isAmateurPlayer ? () => nav.openProfile('cv') : goProfile}
            />
          </ScrollView>
        ),
      },
      {
        id: 'saison' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            <DashboardWeekTimeline
              items={data.calendarItems}
              pendingConvocations={data.pendingConvocations.length}
              onItemPress={handleAgendaItem}
              onConvocationsPress={goMatchs}
              onCarpoolPress={showCarpoolShortcut ? goCarpool : undefined}
            />
            <DashboardSeasonPanel
              nextItem={data.nextItem}
              items={data.calendarItems}
              pendingConvocations={data.pendingConvocations.length}
              onNextPress={handleNextUp}
              onItemPress={handleAgendaItem}
              onSeeAll={goMatchs}
              onConvocationsPress={goMatchs}
            />
            {isAmateurPlayer ? (
              <>
                <PhysioCarePanel
                  profile={profile}
                  onOpenChat={(threadId) => openChat(threadId)}
                  onOpenMessages={goMessages}
                />
                <ProfileCompletionBar user={profile} />
              </>
            ) : null}
            {isProLayout && isOrganizer ? (
              <OrganizerReminderCard
                items={reminderItems}
                loading={loadingReminders}
                onPress={() => {
                  const firstId = reminderItems[0]?.event.id;
                  if (firstId) nav.openTeamEvent(firstId);
                  else goMatchs();
                }}
                onRemind={handleQuickRemind}
                remindingId={remindingId}
              />
            ) : null}
          </ScrollView>
        ),
      },
    ],
    [
      profile,
      data,
      pulseBreakdown,
      unreadCount,
      heroStats,
      quickActions,
      quickAccessLabel,
      layoutKind,
      isAmateurPlayer,
      isProLayout,
      isOrganizer,
      showSponsors,
      showFeedShortcut,
      showHealthShortcut,
      showCarpoolShortcut,
      reminderItems,
      loadingReminders,
      remindingId,
      refreshing,
      verifyAlert,
    ]
  );

  return (
    <ProDayScreenCanvas flat>
      <View style={styles.root}>
        <DashboardTopBar
          firstName={firstName}
          unreadMessages={unreadCount}
          onMessagesPress={goMessages}
          onProfilePress={goProfile}
        />
        <OfflineCacheBanner visible={data.fromCache} onRefresh={onRefresh} />
        <DashboardHomePager
          pages={pages}
          activeChapter={chapter}
          onChapterChange={setChapter}
        />
      </View>

      <PushScreenTransition active={view === 'team'}>
        <TeamManagementScreen profile={profile} onBack={() => setView('main')} />
      </PushScreenTransition>
      {showSponsors ? (
        <PushScreenTransition active={view === 'sponsors'}>
          <SponsorsScreen onBack={() => setView('main')} />
        </PushScreenTransition>
      ) : null}
    </ProDayScreenCanvas>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { marginVertical: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontWeight: '800', fontSize: 14 },
  alertSub: { fontSize: 12, marginTop: 2 },
});

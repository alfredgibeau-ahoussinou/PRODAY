import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import type { User } from '../models/User';
import { Icon } from '../components/ui/Icon';
import { ProfileCompletionBar } from '../components/ProfileCompletionBar';
import { OrganizerReminderCard } from '../components/OrganizerReminderCard';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { DashboardUniquesRail } from '../components/dashboard/DashboardUniquesRail';
import { DashboardNextUp } from '../components/dashboard/DashboardNextUp';
import { DashboardRolePanel } from '../components/dashboard/DashboardRolePanel';
import { DashboardAgenda } from '../components/dashboard/DashboardAgenda';
import { DashboardCommunityStrip } from '../components/dashboard/DashboardCommunityStrip';
import { DashboardActivityHub } from '../components/dashboard/DashboardActivityHub';
import { DashboardPulseBoost } from '../components/dashboard/DashboardPulseBoost';
import { AppSpaceBanner } from '../components/appSpace/AppSpaceBanner';
import { WomenHubScreen } from './women/WomenHubScreen';
import { MenHubScreen } from './men/MenHubScreen';
import { UnderU13HubScreen } from './underU13/UnderU13HubScreen';
import { ProDayModuleGrid } from '../components/ui/ProDayModuleGrid';
import { DiscoverSectionHeader } from '../components/discover/DiscoverSectionHeader';
import type { ProDayModuleId } from '../content/prodayModules';
import { getPulseBreakdown } from '../utils/prodayPulse';
import { getProfileCompletion } from '../utils/profileCompletion';
import { ArenaScreen } from './ArenaScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { TeamManagementScreen } from './TeamManagementScreen';
import { FeedScreen } from './FeedScreen';
import { platformFeedService } from '../services/platformFeed.service';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { openSeasonCalendarItem } from '../utils/navigationDeepLink';
import type { ProdayUniqueId } from '../content/dashboardUniques';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { useDashboardData } from '../hooks/useDashboardData';
import { useOrganizerReminders } from '../hooks/useOrganizerReminders';
import { teamEventsService } from '../services/teamEvents.service';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { PushScreenTransition } from '../components/motion';
import { colors, spacing, radius } from '../theme/designTokens';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';

type DashboardView =
  | 'main'
  | 'team'
  | 'arena'
  | 'sponsors'
  | 'feed'
  | 'women_hub'
  | 'men_hub'
  | 'under_u13_hub';

interface DashboardScreenProps {
  profile: User;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ profile }) => {
  const [view, setView] = useState<DashboardView>('main');
  const { pendingDashboardView, clearPendingDashboard, openChat } = useTabNavigation();
  const nav = useTabNavigationActions();
  const { count: unreadCount } = useUnreadMessageCount();
  const { data, refresh } = useDashboardData(profile);
  const [refreshing, setRefreshing] = useState(false);

  const isStaff =
    profile.role === 'coach' ||
    profile.role === 'agent' ||
    profile.role === 'physio' ||
    profile.role === 'club';
  const showFeedEntry = true;
  const isOrganizer =
    profile.role === 'coach' ||
    profile.role === 'organizer' ||
    profile.role === 'agent' ||
    profile.role === 'club';
  const pendingVerify = isStaff && profile.verification_status === 'PENDING';

  const { items: reminderItems, loading: loadingReminders, refresh: refreshReminders } =
    useOrganizerReminders(isOrganizer ? profile.uid : undefined);
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
      Alert.alert('Relance', n > 0 ? `${n} joueur(s) relancé(s).` : 'Aucune réponse en attente.');
      refreshReminders();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    } finally {
      setRemindingId(null);
    }
  };

  const goMatchs = () => nav.openMatchs();
  const goRecruitment = () => nav.setActiveTab('recrutement');
  const goMessages = () => nav.setActiveTab('messages');
  const goProfile = () => nav.openProfile();

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
      case 'arena':
        setView('arena');
        break;
      case 'sponsors':
        setView('sponsors');
        break;
      case 'gestion':
        setView('team');
        break;
    }
  };

  useEffect(() => {
    if (!pendingDashboardView) return;
    setView(pendingDashboardView);
    clearPendingDashboard();
  }, [pendingDashboardView, clearPendingDashboard]);

  const handleAgendaItem = (item: SeasonCalendarItem) => {
    openSeasonCalendarItem(item, nav);
  };

  const handleUniquePress = (id: ProdayUniqueId) => {
    switch (id) {
      case 'pulse':
      case 'cv-live':
      case 'trust':
        nav.openProfile();
        break;
      case 'season':
      case 'live':
        nav.openMatchs();
        break;
      case 'detect':
        nav.openMercato('detections');
        break;
      case 'arena':
        setView('arena');
        break;
      default:
        nav.openMatchs();
    }
  };

  const handleNextUp = () => {
    if (data.nextItem) openSeasonCalendarItem(data.nextItem, nav);
    else nav.openMatchs();
  };

  if (view === 'women_hub') {
    return <WomenHubScreen onBack={() => setView('main')} />;
  }

  if (view === 'men_hub') {
    return <MenHubScreen onBack={() => setView('main')} />;
  }

  if (view === 'under_u13_hub') {
    return <UnderU13HubScreen onBack={() => setView('main')} />;
  }

  if (view === 'feed') {
    return (
      <FeedScreen
        profile={profile}
        onBack={() => setView('main')}
        onOpenChat={(threadId) => {
          nav.setActiveTab('messages');
          openChat(threadId);
        }}
        onOpenMessages={() => nav.setActiveTab('messages')}
      />
    );
  }

  return (
    <View style={styles.root}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      <DashboardHero
        profile={profile}
        pulse={data.pulse}
        breakdown={pulseBreakdown}
        unreadMessages={unreadCount}
        onProfilePress={goProfile}
        onMessagesPress={goMessages}
      />

      <AppSpaceBanner
        showHubLinks
        onOpenWomenHub={() => setView('women_hub')}
        onOpenMenHub={() => setView('men_hub')}
        onOpenUnderU13Hub={() => setView('under_u13_hub')}
      />

      {showFeedEntry ? (
        <TouchableOpacity
          style={styles.feedBanner}
          onPress={() => setView('feed')}
          activeOpacity={0.9}
        >
          <View style={styles.feedBannerCopy}>
            <Text style={styles.feedEyebrow}>COMMUNAUTÉ</Text>
            <Text style={styles.feedTitle}>Fil d&apos;actualité ProDay</Text>
            <Text style={styles.feedSub}>
              {profile.role === 'agent'
                ? 'Actualités, sondages entre agents et veille mercato.'
                : profile.role === 'club'
                  ? 'Publiez actus club, stages et vie de votre structure.'
                  : profile.role === 'physio'
                    ? 'Publiez conseils prévention & récupération.'
                    : platformFeedService.canPublishFeedNews(profile.role)
                      ? 'Partagez vos actus avec la communauté ProDay.'
                      : 'Suivez les actus agents, coachs, clubs et kinés.'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={22} color={colors.accent} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.moduleHub}>
        <DiscoverSectionHeader
          label="Accès rapide"
          title="Vos modules ProDay"
        />
        <ProDayModuleGrid
          onModulePress={onModulePress}
          liveRecruitment={Boolean(data.stats?.recruitment_posts_open)}
        />
      </View>

      {data.loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : null}

      {profile.role === 'player' && <ProfileCompletionBar user={profile} />}

      <DashboardPulseBoost
        pulse={data.pulse}
        pendingConvocations={data.pendingConvocations.length}
        profileComplete={getProfileCompletion(profile).percent}
        onProfile={goProfile}
        onMatchs={goMatchs}
        onRecruitment={goRecruitment}
      />

      {isOrganizer && (
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
      )}

      {pendingVerify && (
        <TouchableOpacity style={styles.alertCard} onPress={goProfile}>
          <Icon name="warning" size={22} color={colors.warning} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Vérification en cours</Text>
            <Text style={styles.alertSub}>
              Complétez votre dossier pour débloquer la messagerie.
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.warning} />
        </TouchableOpacity>
      )}

      <DashboardNextUp
        item={data.nextItem}
        pendingCount={data.pendingConvocations.length}
        onPress={handleNextUp}
        onConvocationsPress={goMatchs}
      />

      <DashboardRolePanel
        profile={profile}
        applications={data.myApplications}
        detections={data.detections}
        openMatches={data.openMatches}
        onRecruitment={goRecruitment}
        onDetections={() => nav.openMercato('detections')}
        onMatches={goMatchs}
        onApplications={() => nav.openProfile('applications')}
        onSponsors={profile.role === 'sponsor' ? () => setView('sponsors') : undefined}
      />

      <DashboardUniquesRail onPressItem={handleUniquePress} />

      <DashboardAgenda
        items={data.calendarItems}
        onPressItem={handleAgendaItem}
        onSeeAll={goMatchs}
      />

      <DashboardCommunityStrip
        stats={data.stats}
        loading={data.loading}
        onRecruitment={goRecruitment}
      />

      <DashboardActivityHub
        profile={profile}
        unreadCount={unreadCount}
        onMessages={goMessages}
        onProfile={goProfile}
        onArena={() => setView('arena')}
        onSponsors={() => setView('sponsors')}
      />
    </ScrollView>

      <PushScreenTransition active={view === 'arena'}>
        <ArenaScreen onBack={() => setView('main')} />
      </PushScreenTransition>
      <PushScreenTransition active={view === 'team'}>
        <TeamManagementScreen profile={profile} onBack={() => setView('main')} />
      </PushScreenTransition>
      <PushScreenTransition active={view === 'sponsors'}>
        <SponsorsScreen onBack={() => setView('main')} />
      </PushScreenTransition>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  loader: { marginVertical: spacing.lg },
  feedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  feedBannerCopy: { flex: 1 },
  feedEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  feedTitle: { fontSize: 16, fontWeight: '900', color: colors.brandInverse },
  feedSub: { fontSize: 12, color: colors.heroMuted, marginTop: 4, lineHeight: 17 },
  moduleHub: { marginBottom: spacing.lg, gap: spacing.md },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontWeight: '800', color: colors.text, fontSize: 14 },
  alertSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { DashboardHomeHeader } from '../components/home/DashboardHomeHeader';
import { HomeModuleRail } from '../components/home/HomeModuleRail';
import { DashboardNextUp } from '../components/dashboard/DashboardNextUp';
import { DashboardRolePanel } from '../components/dashboard/DashboardRolePanel';
import { DashboardAgenda } from '../components/dashboard/DashboardAgenda';
import { DashboardFocusTabs, type DashboardFocusId } from '../components/dashboard/DashboardFocusTabs';
import { PhysioCarePanel } from '../components/feed/PhysioCarePanel';
import type { ProDayModuleId } from '../content/prodayModules';
import { getPulseBreakdown } from '../utils/prodayPulse';
import { ArenaScreen } from './ArenaScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { TeamManagementScreen } from './TeamManagementScreen';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { openSeasonCalendarItem } from '../utils/navigationDeepLink';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { useDashboardData } from '../hooks/useDashboardData';
import { useOrganizerReminders } from '../hooks/useOrganizerReminders';
import { teamEventsService } from '../services/teamEvents.service';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { PushScreenTransition } from '../components/motion';
import { colors, spacing, radius } from '../theme/designTokens';
import {
  canAccessSponsorsModule,
  getDashboardFocusTabLabels,
  getDashboardLayoutKind,
  getDashboardQuickAccessLabel,
  getMercatoTabLabel,
  getVisibleMainTabs,
} from '../content/poleExperience';
import { HomeQuickStrip, type HomeQuickItem } from '../components/home/HomeQuickStrip';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';

type DashboardView = 'main' | 'team' | 'arena' | 'sponsors';

interface DashboardScreenProps {
  profile: User;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ profile }) => {
  const { colors: themeColors, productLine } = useAppTheme();
  const layoutKind = getDashboardLayoutKind(productLine, profile.role);
  const isAmateurPlayer = layoutKind === 'amateur_player';
  const isProLayout = layoutKind === 'pro';
  const showSponsors = canAccessSponsorsModule(productLine, profile.role);
  const focusTabs = getDashboardFocusTabLabels(productLine, profile.role);
  const quickAccessLabel = getDashboardQuickAccessLabel(productLine, profile.role);

  const [view, setView] = useState<DashboardView>('main');
  const [focus, setFocus] = useState<DashboardFocusId>('priorities');
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
  const goHealth = () => nav.setActiveTab('sante');
  const goCarpool = () => nav.setActiveTab('covoiturage');
  const goProfile = () => nav.openProfile();

  const visibleTabs = getVisibleMainTabs(productLine, profile.role);
  const showFeedShortcut = visibleTabs.includes('feed');
  const showCarpoolShortcut = visibleTabs.includes('covoiturage');
  const showHealthShortcut = visibleTabs.includes('sante');

  const quickStripItems = useMemo((): HomeQuickItem[] => {
    const items: HomeQuickItem[] = [];
    if (visibleTabs.includes('recrutement')) {
      items.push({
        id: 'mercato',
        label: getMercatoTabLabel(productLine, profile.role),
        icon: 'search',
        onPress: goRecruitment,
      });
    }
    if (visibleTabs.includes('matchs')) {
      items.push({ id: 'matchs', label: 'Matchs', icon: 'handshake', onPress: goMatchs });
    }
    if (showCarpoolShortcut) {
      items.push({ id: 'covoiturage', label: 'Covoiturage', icon: 'car', onPress: goCarpool });
    }
    if (showHealthShortcut) {
      items.push({ id: 'sante', label: 'Santé', icon: 'heart', onPress: goHealth });
    }
    return items;
  }, [
    visibleTabs,
    productLine,
    profile.role,
    showCarpoolShortcut,
    showHealthShortcut,
  ]);

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

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.accent}
          />
        }
      >
        <DashboardHomeHeader
          profile={profile}
          pulse={data.pulse}
          breakdown={pulseBreakdown}
          unreadMessages={unreadCount}
          onProfilePress={goProfile}
          onMessagesPress={goMessages}
          onFeedPress={showFeedShortcut ? () => nav.setActiveTab('feed') : undefined}
          onHealthPress={showHealthShortcut ? goHealth : undefined}
          onCarpoolPress={showCarpoolShortcut ? goCarpool : undefined}
        />

        <HomeQuickStrip items={quickStripItems} />

        <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
          {quickAccessLabel}
        </Text>
        <HomeModuleRail
          onModulePress={onModulePress}
          liveRecruitment={Boolean(data.stats?.recruitment_posts_open)}
          role={profile.role}
        />

        {data.loading ? (
          <ActivityIndicator color={themeColors.accent} style={styles.loader} />
        ) : null}

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

        {isProLayout && pendingVerify ? (
          <TouchableOpacity
            style={[styles.alertCard, isProLayout && styles.alertCardPro]}
            onPress={goProfile}
          >
            <Icon name="warning" size={22} color={colors.warning} />
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>Vérification en cours</Text>
              <Text style={styles.alertSub}>Complétez votre dossier pour la messagerie.</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.warning} />
          </TouchableOpacity>
        ) : null}

        <DashboardFocusTabs active={focus} onChange={setFocus} tabs={focusTabs} />

        {focus === 'priorities' ? (
          <>
            <DashboardNextUp
              item={data.nextItem}
              pendingCount={data.pendingConvocations.length}
              onPress={handleNextUp}
              onConvocationsPress={goMatchs}
            />
            <DashboardRolePanel
              profile={profile}
              layoutKind={layoutKind}
              applications={data.myApplications}
              detections={data.detections}
              openMatches={data.openMatches}
              onRecruitment={goRecruitment}
              onDetections={() => nav.openMercato('detections')}
              onMatches={goMatchs}
              onApplications={() => nav.openProfile('applications')}
              onHealth={goHealth}
              onSponsors={showSponsors ? () => setView('sponsors') : undefined}
              onProfile={isAmateurPlayer ? () => nav.openProfile('cv') : goProfile}
            />
          </>
        ) : (
          <DashboardAgenda
            items={data.calendarItems}
            onPressItem={handleAgendaItem}
            onSeeAll={goMatchs}
          />
        )}
      </ScrollView>

      <PushScreenTransition active={view === 'arena'}>
        <ArenaScreen onBack={() => setView('main')} />
      </PushScreenTransition>
      <PushScreenTransition active={view === 'team'}>
        <TeamManagementScreen profile={profile} onBack={() => setView('main')} />
      </PushScreenTransition>
      {showSponsors ? (
        <PushScreenTransition active={view === 'sponsors'}>
          <SponsorsScreen onBack={() => setView('main')} />
        </PushScreenTransition>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  loader: { marginVertical: spacing.lg },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
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
  alertCardPro: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  alertBody: { flex: 1 },
  alertTitle: { fontWeight: '800', color: colors.text, fontSize: 14 },
  alertSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

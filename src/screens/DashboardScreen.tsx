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
import { DashboardNextUp } from '../components/dashboard/DashboardNextUp';
import { DashboardRolePanel } from '../components/dashboard/DashboardRolePanel';
import { DashboardAgenda } from '../components/dashboard/DashboardAgenda';
import { DashboardFocusTabs, type DashboardFocusId } from '../components/dashboard/DashboardFocusTabs';
import { AppSpaceBanner } from '../components/appSpace/AppSpaceBanner';
import { MenHubScreen } from './men/MenHubScreen';
import { UnderU13HubScreen } from './underU13/UnderU13HubScreen';
import { ProDayModuleGrid } from '../components/ui/ProDayModuleGrid';
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
import type { SeasonCalendarItem } from '../utils/seasonCalendar';

type DashboardView =
  | 'main'
  | 'team'
  | 'arena'
  | 'sponsors'
  | 'men_hub'
  | 'under_u13_hub';

interface DashboardScreenProps {
  profile: User;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ profile }) => {
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
    profile.role === 'physio' ||
    profile.role === 'club';
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

  if (view === 'men_hub') {
    return <MenHubScreen onBack={() => setView('main')} />;
  }

  if (view === 'under_u13_hub') {
    return <UnderU13HubScreen onBack={() => setView('main')} />;
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

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickChip} onPress={() => nav.setActiveTab('feed')} activeOpacity={0.85}>
            <Icon name="star-four-points" size={18} color={colors.accent} />
            <Text style={styles.quickLabel}>Fil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={goMessages} activeOpacity={0.85}>
            <Icon name="chat" size={18} color={colors.accent} />
            <Text style={styles.quickLabel}>Messages</Text>
            {unreadCount > 0 ? (
              <View style={styles.quickBadge}>
                <Text style={styles.quickBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={goProfile} activeOpacity={0.85}>
            <Icon name="person" size={18} color={colors.accent} />
            <Text style={styles.quickLabel}>Profil</Text>
          </TouchableOpacity>
        </View>

        <AppSpaceBanner
          showHubLinks
          onOpenMenHub={() => setView('men_hub')}
          onOpenUnderU13Hub={() => setView('under_u13_hub')}
        />

        <ProDayModuleGrid
          onModulePress={onModulePress}
          liveRecruitment={Boolean(data.stats?.recruitment_posts_open)}
          role={profile.role}
        />

        {data.loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : null}

        {profile.role === 'player' ? <ProfileCompletionBar user={profile} /> : null}

        {isOrganizer ? (
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

        {pendingVerify ? (
          <TouchableOpacity style={styles.alertCard} onPress={goProfile}>
            <Icon name="warning" size={22} color={colors.warning} />
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>Vérification en cours</Text>
              <Text style={styles.alertSub}>Complétez votre dossier pour la messagerie.</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.warning} />
          </TouchableOpacity>
        ) : null}

        <DashboardFocusTabs active={focus} onChange={setFocus} />

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
              applications={data.myApplications}
              detections={data.detections}
              openMatches={data.openMatches}
              onRecruitment={goRecruitment}
              onDetections={() => nav.openMercato('detections')}
              onMatches={goMatchs}
              onApplications={() => nav.openProfile('applications')}
              onSponsors={profile.role === 'sponsor' ? () => setView('sponsors') : undefined}
              onProfile={goProfile}
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
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: { fontSize: 12, fontWeight: '700', color: colors.text },
  quickBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickBadgeText: { fontSize: 9, fontWeight: '800', color: colors.brandInverse },
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

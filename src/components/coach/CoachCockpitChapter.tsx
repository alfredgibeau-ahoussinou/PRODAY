import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachText } from './coachPortalUi';
import { Icon } from '../ui/Icon';
import { type TeamEvent } from '../../models/TeamEvent';
import { isInMatchWindow } from '../../utils/matchLive';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachNavItemId } from '../../features/coach/navigation/coachNavConfig';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { CreateTeamEventScreen } from '../../screens/CreateTeamEventScreen';
import { CoachScreenHeader } from './CoachScreenHeader';
import {
  coachCalendarEventSummary,
  coachEventPlaceLabel,
  formatCoachCalendarDateStack,
  listCoachCalendarRest,
  resolveCoachDayPriority,
} from '../../utils/coachCalendarHome';
import { findLatestPostMatchAnalysis } from '../../utils/coachPostMatchAnalysis';
import { CoachSectionCard } from './coachPortalUi';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import {
  CoachCockpitShortcutRow,
  CoachDayCalmEmpty,
  CoachDayPriorityHero,
} from './CoachCockpitChrome';

const PEOPLE_GOLD = '#F5C518';

export const CoachCockpitChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();
  const { tokens, teamId: activeTeamId } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { count: unreadMessages } = useUnreadMessageCount();
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canConvoc = userCanManageConvocations(profile, { clubCoversCoach });
  const hasClub = Boolean(profile.profile.club_id);
  const [creating, setCreating] = useState(false);

  const priority = useMemo(() => resolveCoachDayPriority(events), [events]);
  const heroEventId =
    priority.kind === 'calm' ? null : priority.event.id;
  const restUpcoming = useMemo(
    () => listCoachCalendarRest(events, heroEventId),
    [events, heroEventId],
  );

  const lastPostMatch = useMemo(
    () => findLatestPostMatchAnalysis(events, members),
    [events, members],
  );

  const openNav = (id: CoachNavItemId) => {
    if (shellNav) shellNav.requestNav(id);
    else if (id === 'carpool') nav.openCarpool();
    else if (id === 'match_center' || id === 'matchs') tabNav.openMatchs();
    else if (id === 'gestion') nav.openDashboard('gestion');
    else if (id === 'messages') nav.setActiveTab('messages');
    else if (id === 'profil') nav.openProfile();
    else if (id === 'smart_tactics') nav.openDashboard('smart_tactics');
    else if (id === 'coach_ia') nav.openDashboard('train_ai');
  };

  const openCreate = () => {
    if (!hasClub) {
      openNav('gestion');
      return;
    }
    if (!canConvoc) {
      Alert.alert(t('coach.portal.proGate.title'), t('coach.portal.proGate.body'));
      return;
    }
    setCreating(true);
  };

  const openMoreMenu = () => {
    Alert.alert(t('coach.calendar.title'), undefined, [
      { text: t('coach.calendar.agenda'), onPress: () => openNav('planning') },
      { text: t('coach.calendar.help'), onPress: () => shellNav?.openHelp?.() },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const openPointage = (eventId: string) => {
    tabNav.openMatchs({ eventId, hubChapter: 'effectif' });
  };

  const openEvent = (eventId: string, hubChapter?: 'live' | 'composition' | 'effectif') => {
    tabNav.openMatchs({ eventId, hubChapter });
  };

  if (creating) {
    return (
      <CreateTeamEventScreen
        activeTeamId={activeTeamId}
        onBack={() => setCreating(false)}
        onCreated={(eventId) => {
          setCreating(false);
          onRefresh();
          tabNav.openMatchs({ eventId });
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <CoachScreenHeader
        title={t('coach.calendar.title')}
        unreadMessages={unreadMessages}
        actions={[
          {
            icon: 'chat',
            onPress: () => openNav('messages'),
            accessibilityLabel: t('messages.title'),
          },
          {
            icon: 'add',
            onPress: openCreate,
            accessibilityLabel: t('coach.calendar.create'),
          },
          {
            icon: 'ellipsis-horizontal',
            onPress: openMoreMenu,
            accessibilityLabel: t('coach.calendar.more'),
          },
        ]}
      />

      <CoachChapterScroll>
        <CoachCockpitShortcutRow
          items={[
            {
              id: 'matchs',
              label: 'Matchs',
              icon: 'trophy',
              onPress: () => openNav('match_center'),
            },
            {
              id: 'trainings',
              label: 'Séances',
              icon: 'football',
              onPress: () => openNav('entrainements'),
            },
            {
              id: 'effectif',
              label: 'Effectif',
              icon: 'people',
              onPress: () => openNav('equipe'),
            },
            {
              id: 'planning',
              label: 'Planning',
              icon: 'calendar',
              onPress: () => openNav('planning'),
            },
          ]}
        />

        {priority.kind === 'calm' ? (
          <CoachDayCalmEmpty
            onCreate={openCreate}
            onPlanning={() => openNav('planning')}
          />
        ) : (
          <CoachDayPriorityHero
            priority={priority}
            onOpenHub={() => openEvent(priority.event.id)}
            onPointage={() => openPointage(priority.event.id)}
            onComposition={
              priority.kind === 'match' || priority.kind === 'live'
                ? () => openEvent(priority.event.id, 'composition')
                : undefined
            }
            onLive={
              priority.kind === 'live'
                ? () => openEvent(priority.event.id, 'live')
                : undefined
            }
          />
        )}

        {lastPostMatch ? (
          <CoachSectionCard
            kicker="Dernier match"
            title={lastPostMatch.title}
            body={
              lastPostMatch.scoreLabel
                ? `Score ${lastPostMatch.scoreLabel} — ${lastPostMatch.positives[0] ?? lastPostMatch.nextMatchRecommendation}`
                : lastPostMatch.nextMatchRecommendation
            }
          >
            <Pressable
              onPress={() => {
                if (lastPostMatch.eventId) {
                  openEvent(lastPostMatch.eventId, 'composition');
                  return;
                }
                openNav('match_center');
              }}
              style={({ pressed }) => [styles.postMatchLink, pressed && { opacity: 0.65 }]}
            >
              <CoachText variant="caption" accent>
                Voir le hub match →
              </CoachText>
            </Pressable>
          </CoachSectionCard>
        ) : null}

        {restUpcoming.length > 0 ? (
          <>
            <CoachText variant="section" style={styles.sectionTitle}>
              {t('coach.calendar.upcoming')}
            </CoachText>
            {restUpcoming.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                styles={styles}
                live={isInMatchWindow(event)}
                liveLabel={t('coach.calendar.live')}
                convokedLabel={t('coach.calendar.convoked')}
                confirmedLabel={t('coach.calendar.confirmed')}
                pointageLabel={t('coach.calendar.pointage')}
                onOpen={() => openEvent(event.id)}
                onPointage={() => openPointage(event.id)}
              />
            ))}
          </>
        ) : null}
      </CoachChapterScroll>
    </View>
  );
};

function CalendarEventCard({
  event,
  styles,
  live,
  liveLabel,
  convokedLabel,
  confirmedLabel,
  pointageLabel,
  onOpen,
  onPointage,
}: {
  event: TeamEvent;
  styles: ReturnType<typeof createStyles>;
  live: boolean;
  liveLabel: string;
  convokedLabel: string;
  confirmedLabel: string;
  pointageLabel: string;
  onOpen: () => void;
  onPointage: () => void;
}) {
  const { tokens } = useCoachTheme();
  const stack = formatCoachCalendarDateStack(event.starts_at);
  const summary = coachCalendarEventSummary(event);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.dateCol}>
        <CoachText variant="caption" muted style={styles.dateWeek}>
          {stack.weekday}
        </CoachText>
        <CoachText variant="title" style={styles.dateDay}>
          {stack.day}
        </CoachText>
        <CoachText variant="caption" style={styles.dateMonth}>
          {stack.month}
        </CoachText>
        <CoachText variant="caption" muted style={styles.dateTime}>
          {stack.time}
        </CoachText>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <CoachText variant="section" style={styles.eventTitle}>
            {event.title}
          </CoachText>
          {live ? (
            <View style={styles.liveBadge}>
              <CoachText variant="caption" style={styles.liveBadgeText}>
                {liveLabel}
              </CoachText>
            </View>
          ) : null}
        </View>
        <View style={styles.attendanceRow}>
          <CoachText variant="caption" muted style={styles.attendanceSummary}>
            {convokedLabel} {summary.invited} · {confirmedLabel} {summary.confirmed}
          </CoachText>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onPointage();
            }}
            style={({ pressed }) => [styles.pointageBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={pointageLabel}
          >
            <Icon name="checkmark-circle" size={16} color={tokens.foreground} />
            <CoachText variant="caption" style={styles.pointageBtnText}>
              {pointageLabel}
            </CoachText>
          </Pressable>
        </View>
        <View style={styles.cardFooter}>
          <CoachText variant="caption" muted numberOfLines={1} style={styles.place}>
            {coachEventPlaceLabel(event)}
          </CoachText>
          <View style={styles.people}>
            <Icon name="people" size={16} color={PEOPLE_GOLD} />
            <CoachText variant="caption" style={styles.peopleCount}>
              {summary.confirmed}
            </CoachText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    sectionTitle: {
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 22,
      marginTop: spacing.sm,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: tokens.surface,
      borderRadius: 20,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    dateCol: {
      width: 58,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    dateWeek: { fontSize: 13, fontWeight: '600' },
    dateDay: { color: tokens.foreground, fontWeight: '800', fontSize: 22, lineHeight: 24 },
    dateMonth: { color: tokens.foreground, fontWeight: '700', fontSize: 13 },
    dateTime: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    cardDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: tokens.border,
      marginVertical: 4,
    },
    cardBody: { flex: 1, minWidth: 0, gap: spacing.md },
    cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    eventTitle: { flex: 1, color: tokens.foreground, fontWeight: '700', fontSize: 17 },
    liveBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: '#FF3B30',
    },
    liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    attendanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    attendanceSummary: { flex: 1, fontSize: 13, fontWeight: '600' },
    pointageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 36,
      borderRadius: radius.pill,
      backgroundColor: tokens.elevated,
      paddingHorizontal: spacing.md,
    },
    pointageBtnText: { color: tokens.foreground, fontWeight: '700' },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    place: { flex: 1, fontSize: 13 },
    people: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    peopleCount: { color: tokens.foreground, fontWeight: '700' },
    postMatchLink: { marginTop: spacing.sm },
  });

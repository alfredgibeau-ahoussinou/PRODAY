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
  COACH_CALENDAR_TIPS,
  coachCalendarEventSummary,
  coachEventPlaceLabel,
  formatCoachCalendarDateStack,
  listCoachCalendarUpcoming,
} from '../../utils/coachCalendarHome';
import { findLatestPostMatchAnalysis } from '../../utils/coachPostMatchAnalysis';
import { CoachSectionCard } from './coachPortalUi';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';

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
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { count: unreadMessages } = useUnreadMessageCount();
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canConvoc = userCanManageConvocations(profile, { clubCoversCoach });
  const hasClub = Boolean(profile.profile.club_id);
  const [creating, setCreating] = useState(false);
  const [discoverOn, setDiscoverOn] = useState(true);

  const upcoming = useMemo(() => listCoachCalendarUpcoming(events), [events]);

  const lastPostMatch = useMemo(
    () => findLatestPostMatchAnalysis(events, members),
    [events, members],
  );

  const openNav = (id: CoachNavItemId) => {
    if (shellNav) shellNav.requestNav(id);
    else if (id === 'carpool') nav.openCarpool();
    else if (id === 'match_center' || id === 'matchs') nav.openMatchs();
    else if (id === 'gestion') nav.openDashboard('gestion');
    else if (id === 'messages') nav.setActiveTab('messages');
    else if (id === 'profil') nav.openProfile();
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

  if (creating) {
    return (
      <CreateTeamEventScreen
        onBack={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          onRefresh();
        }}
      />
    );
  }

  const firstTip = COACH_CALENDAR_TIPS[0];

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
        {discoverOn && firstTip ? (
          <Pressable
            onPress={() => setDiscoverOn(false)}
            style={({ pressed }) => [styles.discoverBanner, pressed && styles.discoverPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('coach.calendar.dismiss')}
          >
            <CoachText variant="caption" style={styles.discoverText} numberOfLines={1}>
              {firstTip.title}
            </CoachText>
            <Icon name="close" size={14} color={tokens.muted} />
          </Pressable>
        ) : null}

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
              onPress={() => openNav('coach_ia')}
              style={({ pressed }) => [styles.postMatchLink, pressed && { opacity: 0.65 }]}
            >
              <CoachText variant="caption" accent>
                Voir l’analyse complète →
              </CoachText>
            </Pressable>
          </CoachSectionCard>
        ) : null}

        <CoachText variant="section" style={styles.sectionTitle}>
          {t('coach.calendar.upcoming')}
        </CoachText>

        {upcoming.length === 0 ? (
          <View style={styles.emptyBlock}>
            <CoachText variant="body" muted style={styles.emptyText}>
              {t('coach.calendar.empty')}
            </CoachText>
            <Pressable
              onPress={openCreate}
              style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.85 }]}
            >
              <CoachText variant="section" style={styles.emptyCtaText}>
                {t('coach.calendar.create')}
              </CoachText>
            </Pressable>
          </View>
        ) : (
          upcoming.map((event) => (
            <CalendarEventCard
              key={event.id}
              event={event}
              styles={styles}
              live={isInMatchWindow(event)}
              liveLabel={t('coach.calendar.live')}
              convokedLabel={t('coach.calendar.convoked')}
              confirmedLabel={t('coach.calendar.confirmed')}
              pointageLabel={t('coach.calendar.pointage')}
              onOpen={() => tabNav.openMatchs({ eventId: event.id })}
              onPointage={() => openPointage(event.id)}
            />
          ))
        )}
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
    discoverBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: tokens.surface,
      marginBottom: spacing.sm,
    },
    discoverPressed: { opacity: 0.7 },
    discoverText: { flex: 1, color: tokens.foreground, fontWeight: '500' },
    sectionTitle: {
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 22,
      marginTop: spacing.sm,
    },
    emptyBlock: { gap: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
    emptyText: { fontSize: 16 },
    emptyCta: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      borderRadius: radius.pill,
      backgroundColor: tokens.elevated,
      paddingHorizontal: spacing.xl,
    },
    emptyCtaText: { color: tokens.foreground, fontWeight: '700' },
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

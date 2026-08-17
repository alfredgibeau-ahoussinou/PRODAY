import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachText } from './coachPortalUi';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { countRsvpYes, userRsvp, type RsvpStatus, type TeamEvent } from '../../models/TeamEvent';
import { isInMatchWindow } from '../../utils/matchLive';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import type { CoachNavItemId } from '../../features/coach/navigation/coachNavConfig';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { teamEventsService } from '../../services/teamEvents.service';
import { CreateTeamEventScreen } from '../../screens/CreateTeamEventScreen';
import { CoachScreenHeader } from './CoachScreenHeader';
import {
  COACH_CALENDAR_TIPS,
  coachEventPlaceLabel,
  formatCoachCalendarDateStack,
  listCoachCalendarUpcoming,
} from '../../utils/coachCalendarHome';
import { findLatestPostMatchAnalysis } from '../../utils/coachPostMatchAnalysis';
import { CoachSectionCard } from './coachPortalUi';

const PEOPLE_GOLD = '#F5C518';
const PILL_BORDER = 'rgba(255, 255, 255, 0.88)';

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
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canConvoc = userCanManageConvocations(profile, { clubCoversCoach });
  const hasClub = Boolean(profile.profile.club_id);
  const [creating, setCreating] = useState(false);
  const [discoverOn, setDiscoverOn] = useState(true);
  const [rsvpOverride, setRsvpOverride] = useState<Record<string, RsvpStatus>>({});

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

  const setEventRsvp = async (eventId: string, status: RsvpStatus) => {
    setRsvpOverride((prev) => ({ ...prev, [eventId]: status }));
    try {
      await teamEventsService.updateRsvp(eventId, profile.uid, status);
      onRefresh();
    } catch (e) {
      setRsvpOverride((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
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

  return (
    <View style={styles.root}>
      <CoachScreenHeader
        title={t('coach.calendar.title')}
        actions={[
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
        {discoverOn ? (
          <View style={styles.discoverBlock}>
            <View style={styles.discoverHead}>
              <CoachText variant="section" style={styles.discoverTitle} numberOfLines={1}>
                {t('coach.calendar.discover')}
              </CoachText>
              <PressableSpring onPress={() => setDiscoverOn(false)} scaleTo={0.96} haptic>
                <CoachText variant="caption" muted style={styles.dismiss}>
                  {t('coach.calendar.dismiss')}
                </CoachText>
              </PressableSpring>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.discoverRow}
            >
              {COACH_CALENDAR_TIPS.map((tip, index) => (
                <PressableSpring
                  key={tip.id}
                  onPress={tip.id === 'create' ? openCreate : () => setDiscoverOn(false)}
                  scaleTo={0.98}
                  haptic
                >
                  <LinearGradient
                    colors={index === 0 ? ['#1BA3A0', '#006CFC'] : ['#2C2C2E', '#1C1C1E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tipCard}
                  >
                    <CoachText variant="caption" style={styles.tipKicker}>
                      {tip.kicker}
                    </CoachText>
                    <CoachText variant="section" numberOfLines={2} style={styles.tipTitle}>
                      {tip.title}
                    </CoachText>
                  </LinearGradient>
                </PressableSpring>
              ))}
            </ScrollView>
          </View>
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
            <PressableSpring
              onPress={() => openNav('coach_ia')}
              scaleTo={0.98}
              haptic
              style={styles.postMatchLink}
            >
              <CoachText variant="caption" accent>
                Voir l’analyse complète →
              </CoachText>
            </PressableSpring>
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
            <PressableSpring onPress={openCreate} scaleTo={0.97} haptic style={styles.emptyCta}>
              <CoachText variant="section" style={styles.emptyCtaText}>
                {t('coach.calendar.create')}
              </CoachText>
            </PressableSpring>
          </View>
        ) : (
          upcoming.map((event) => (
            <CalendarEventCard
              key={event.id}
              event={event}
              rsvp={rsvpOverride[event.id] ?? userRsvp(event, profile.uid)}
              live={isInMatchWindow(event)}
              presentLabel={t('coach.calendar.present')}
              absentLabel={t('coach.calendar.absent')}
              liveLabel={t('coach.calendar.live')}
              onOpen={() => tabNav.openMatchs({ eventId: event.id })}
              onRsvp={(status) => void setEventRsvp(event.id, status)}
            />
          ))
        )}
      </CoachChapterScroll>
    </View>
  );
};

function CalendarEventCard({
  event,
  rsvp,
  live,
  presentLabel,
  absentLabel,
  liveLabel,
  onOpen,
  onRsvp,
}: {
  event: TeamEvent;
  rsvp: RsvpStatus;
  live: boolean;
  presentLabel: string;
  absentLabel: string;
  liveLabel: string;
  onOpen: () => void;
  onRsvp: (status: RsvpStatus) => void;
}) {
  const stack = formatCoachCalendarDateStack(event.starts_at);
  const presentOn = rsvp === 'yes' || rsvp === 'late_under_10' || rsvp === 'late_over_10' || rsvp === 'late_unknown';
  const absentOn = rsvp === 'no';

  return (
    <PressableSpring onPress={onOpen} scaleTo={0.99} haptic style={styles.card}>
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
        <View style={styles.rsvpRow}>
          <RsvpPill label={presentLabel} on={presentOn} onPress={() => onRsvp('yes')} />
          <RsvpPill label={absentLabel} on={absentOn} onPress={() => onRsvp('no')} />
        </View>
        <View style={styles.cardFooter}>
          <CoachText variant="caption" muted numberOfLines={1} style={styles.place}>
            {coachEventPlaceLabel(event)}
          </CoachText>
          <View style={styles.people}>
            <Icon name="people" size={16} color={PEOPLE_GOLD} />
            <CoachText variant="caption" style={styles.peopleCount}>
              {countRsvpYes(event)}
            </CoachText>
          </View>
        </View>
      </View>
    </PressableSpring>
  );
}

function RsvpPill({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <PressableSpring
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
      scaleTo={0.97}
      haptic
      style={[styles.rsvpPill, on && styles.rsvpPillOn]}
    >
      <CoachText variant="caption" style={[styles.rsvpPillText, on && styles.rsvpPillTextOn]}>
        {label}
      </CoachText>
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: COACH_SITE.bg },
  discoverBlock: { gap: spacing.sm },
  discoverHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  discoverTitle: { flex: 1, fontWeight: '700', color: COACH_SITE.foreground },
  dismiss: { fontWeight: '600' },
  discoverRow: { gap: spacing.sm, paddingRight: spacing.md },
  tipCard: {
    width: 168,
    minHeight: 88,
    borderRadius: 16,
    padding: spacing.md,
    justifyContent: 'flex-end',
    gap: 6,
  },
  tipKicker: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', letterSpacing: 0.6 },
  tipTitle: { color: '#fff', fontWeight: '700' },
  sectionTitle: {
    color: COACH_SITE.foreground,
    fontWeight: '800',
    fontSize: 22,
    marginTop: spacing.sm,
  },
  emptyBlock: { gap: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  emptyText: { fontSize: 16 },
  emptyCta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: spacing.xl,
  },
  emptyCtaText: { color: '#000', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COACH_SITE.surface,
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
  dateDay: { color: COACH_SITE.foreground, fontWeight: '800', fontSize: 22, lineHeight: 24 },
  dateMonth: { color: COACH_SITE.foreground, fontWeight: '700', fontSize: 13 },
  dateTime: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  cardDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginVertical: 4,
  },
  cardBody: { flex: 1, minWidth: 0, gap: spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  eventTitle: { flex: 1, color: COACH_SITE.foreground, fontWeight: '700', fontSize: 17 },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#FF3B30',
  },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rsvpRow: { flexDirection: 'row', gap: spacing.sm },
  rsvpPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: PILL_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  rsvpPillOn: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  rsvpPillText: { color: COACH_SITE.foreground, fontWeight: '700' },
  rsvpPillTextOn: { color: '#000' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  place: { flex: 1, fontSize: 13 },
  people: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  peopleCount: { color: COACH_SITE.foreground, fontWeight: '700' },
  postMatchLink: { marginTop: spacing.sm },
});

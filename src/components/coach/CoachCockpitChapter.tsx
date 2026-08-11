import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachEmptyState } from './coachPortalUi';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { PressableSpring } from '../motion';
import { StaffPrioritiesStrip } from '../../features/v3/components/StaffPrioritiesStrip';
import {
  buildCoachAiSuggestions,
  buildCoachPortalPriorities,
} from '../../utils/coachAiSuggestions';
import {
  countAttendanceMark,
  countRsvpYes,
  EVENT_TYPE_LABELS,
  getPendingInviteeUids,
} from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { isInMatchWindow } from '../../utils/matchLive';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { ImmersivePoleHero } from '../poles';
import { radius, spacing } from '../../theme/designTokens';
import {
  buildPlayerFormAnalysis,
  type PlayerFormRow,
} from '../../utils/formAnalysis';
import type { PlayerLoadSignals } from '../../utils/playerLoadAlerts';
import { CoachFormeDashboardCard } from './CoachAnalyseFormePanel';

export const CoachCockpitChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onOpenChapter,
  onOpenSmartTactics,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canConvoc = userCanManageConvocations(profile, { clubCoversCoach });
  const hasClub = Boolean(profile.profile.club_id);
  const isEmptySetup = !hasClub || (members.length === 0 && events.length === 0);

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.starts_at.getTime() > Date.now())
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime()),
    [events],
  );
  const next = upcoming[0] ?? null;
  const live = useMemo(() => events.find((e) => isInMatchWindow(e)) ?? null, [events]);

  const pendingConvocations = useMemo(
    () => upcoming.reduce((acc, e) => acc + getPendingInviteeUids(e).length, 0),
    [upcoming],
  );

  const priorities = useMemo(
    () =>
      buildCoachPortalPriorities({
        hasClub,
        membersCount: members.length,
        upcomingEvents: upcoming.length,
        pendingConvocations,
        canManageConvocations: canConvoc,
      }),
    [hasClub, members.length, upcoming.length, pendingConvocations, canConvoc],
  );

  const ai = useMemo(
    () => buildCoachAiSuggestions({ events, membersCount: members.length }),
    [events, members.length],
  );

  const openEvent = (eventId: string, hubChapter?: 'live' | 'composition') => {
    if (!eventId) return;
    tabNav.openMatchs({ eventId, hubChapter });
  };

  const openGestion = () => nav.openDashboard('gestion');

  const formRows: PlayerFormRow[] = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 3600_000;
    const signals: PlayerLoadSignals[] = members.slice(0, 20).map((m) => {
      const recent = events.filter(
        (e) =>
          e.starts_at.getTime() >= weekAgo &&
          e.starts_at.getTime() <= Date.now() &&
          (e.invitee_uids.includes(m.uid) || Boolean(e.player_match_stats?.[m.uid])),
      );
      const matchEvents = recent.filter(
        (e) =>
          e.event_type === 'friendly' ||
          e.event_type === 'competition' ||
          e.event_type === 'tournament',
      );
      const trainings = recent.filter((e) => e.event_type === 'training');
      const minutes = matchEvents.reduce(
        (sum, e) => sum + (e.player_match_stats?.[m.uid]?.minutes_played ?? 0),
        0,
      );
      const lastMatch = [...matchEvents].sort(
        (a, b) => b.starts_at.getTime() - a.starts_at.getTime(),
      )[0];
      return {
        uid: m.uid,
        displayName: m.display_name,
        matchesLast7d: matchEvents.length,
        minutesLast7d: minutes,
        trainingsLast7d: trainings.length,
        declaredFatigue: null,
        daysSinceLastMatch: lastMatch
          ? Math.floor((Date.now() - lastMatch.starts_at.getTime()) / 86400000)
          : null,
      };
    });
    return signals.map((s) => buildPlayerFormAnalysis(s));
  }, [members, events]);

  return (
    <CoachChapterScroll>
      <ImmersivePoleHero
        kicker="Pôle Coach · Banc de touche"
        title="Composer. Décider. Gagner."
        support="Tactique IA, effectif et bourse interne : rattaché à un club. Sous Tout inclus, les coachs ne paient rien."
        primaryLabel="Tactique IA"
        onPrimaryPress={() => onOpenSmartTactics?.()}
        secondaryLabel="Effectif et bourse"
        onSecondaryPress={() => onOpenChapter('effectif')}
        mood="coach"
      />

      <CoachFormeDashboardCard
        rows={formRows}
        onOpenFull={() => onOpenChapter('performance')}
      />

      <View style={styles.heading}>
        <ProDayText variant="section">{t('coach.portal.cockpit.title')}</ProDayText>
        <ProDayText variant="caption" muted>
          {t('coach.portal.cockpit.subtitle')}
        </ProDayText>
      </View>

      {isEmptySetup ? (
        <ProDaySurface
          variant="module"
          style={[styles.setupCard, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
        >
          <ProDayText variant="section">
            {!hasClub
              ? t('coach.portal.cockpit.setupNoClubTitle')
              : t('coach.portal.cockpit.setupEmptyTitle')}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {!hasClub
              ? t('coach.portal.cockpit.setupNoClubBody')
              : t('coach.portal.cockpit.setupEmptyBody')}
          </ProDayText>
          <PressableSpring onPress={openGestion} scaleTo={0.96} haptic style={styles.setupCtaWrap}>
            <ProDayGradient kind="cta" style={styles.setupCta}>
              <ProDayText variant="caption" inverse style={styles.link}>
                {!hasClub
                  ? t('coach.portal.cockpit.setupNoClubCta')
                  : t('coach.portal.cockpit.setupEmptyCta')}
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
          {hasClub ? (
            <View style={styles.setupLinks}>
              <PressableSpring onPress={() => onOpenChapter('effectif')} scaleTo={0.96} haptic>
                <ProDayText variant="caption" accent style={styles.link}>
                  {t('coach.portal.cockpit.setupInvite')}
                </ProDayText>
              </PressableSpring>
              <PressableSpring onPress={() => onOpenChapter('planning')} scaleTo={0.96} haptic>
                <ProDayText variant="caption" accent style={styles.link}>
                  {t('coach.portal.cockpit.setupPlan')}
                </ProDayText>
              </PressableSpring>
            </View>
          ) : null}
        </ProDaySurface>
      ) : null}

      {!isEmptySetup ? (
        <StaffPrioritiesStrip
          items={priorities}
          onPress={(item) => {
            if (item.id === 'pro-gate') {
              nav.openProfile();
              return;
            }
            if (item.id === 'invite-roster') {
              onOpenChapter('effectif');
              return;
            }
            if (
              item.id === 'first-session' ||
              item.action === 'gestion' ||
              item.id === 'team-mgmt' ||
              item.id === 'join-club'
            ) {
              if (item.id === 'first-session') {
                onOpenChapter('planning');
                return;
              }
              openGestion();
              return;
            }
            if (item.tab === 'matchs') {
              nav.openMatchs({ homeTab: 'convocations' });
              return;
            }
            if (item.tab === 'recrutement') {
              nav.openMercato();
            }
          }}
        />
      ) : null}

      {!canConvoc && hasClub && !isEmptySetup ? (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
            {t('coach.portal.proGate.title')}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {t('coach.portal.proGate.body')}
          </ProDayText>
          <PressableSpring onPress={() => nav.openProfile()} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              {t('coach.portal.proGate.cta')}
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      ) : null}

      <ProDaySurface
        variant="module"
        style={[styles.card, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
      >
        <ProDayText variant="section">Tactique IA</ProDayText>
        <ProDayText variant="caption" muted>
          Match → Composition → Effectif. Pose le XI et synchronise le match.
        </ProDayText>
        <PressableSpring
          onPress={() => {
            if (onOpenSmartTactics) onOpenSmartTactics();
            else nav.openDashboard('smart_tactics');
          }}
          scaleTo={0.96}
          haptic
          style={styles.setupCtaWrap}
        >
          <ProDayGradient kind="cta" style={styles.setupCta}>
            <ProDayText variant="caption" inverse style={styles.link}>
              Ouvrir Tactique IA
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
      </ProDaySurface>

      <ProDayText variant="caption" accent style={styles.section}>
        {t('coach.portal.cockpit.aiTitle')}
      </ProDayText>
      {ai.map((s) => (
        <PressableSpring
          key={s.id}
          onPress={() =>
            s.id === 'plan-session' ? onOpenChapter('planning') : onOpenChapter('matchs')
          }
          scaleTo={0.98}
          haptic
        >
          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="caption" muted style={styles.kind}>
              {s.kind === 'squad'
                ? t('coach.portal.ai.squad')
                : s.kind === 'training'
                  ? t('coach.portal.ai.training')
                  : t('coach.portal.ai.logistics')}
            </ProDayText>
            <ProDayText variant="section">{s.title}</ProDayText>
            <ProDayText variant="caption" muted>
              {s.detail}
            </ProDayText>
          </ProDaySurface>
        </PressableSpring>
      ))}

      <ProDayText variant="caption" accent style={styles.section}>
        {t('coach.portal.cockpit.nextTitle')}
      </ProDayText>
      {upcoming.length === 0 ? (
        <CoachEmptyState
          title={t('coach.portal.cockpit.noEvents')}
          body={t('coach.portal.cockpit.noEventsBody')}
          cta={t('coach.portal.cockpit.planCta')}
          onPress={() => (hasClub ? onOpenChapter('planning') : openGestion())}
        />
      ) : (
        upcoming.slice(0, 4).map((event) => (
          <PressableSpring key={event.id} onPress={() => openEvent(event.id)} scaleTo={0.98} haptic>
            <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
              <ProDayText variant="section">{event.title}</ProDayText>
              <ProDayText variant="caption" muted>
                {EVENT_TYPE_LABELS[event.event_type]} · {formatCalendarDate(event.starts_at)}
              </ProDayText>
              {event === next ? (
                <View style={styles.kpiRow}>
                  <ProDayText variant="caption" accent>
                    {t('roleHome.coach.rsvpYes')}: {countRsvpYes(event)}
                  </ProDayText>
                  <ProDayText variant="caption" muted>
                    {t('roleHome.coach.present')}: {countAttendanceMark(event, 'present')}
                  </ProDayText>
                </View>
              ) : null}
            </ProDaySurface>
          </PressableSpring>
        ))
      )}

      {live ? (
        <PressableSpring onPress={() => openEvent(live.id, 'live')} scaleTo={0.98} haptic>
          <ProDaySurface
            variant="module"
            style={[styles.card, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
          >
            <ProDayText variant="section">{t('roleHome.coach.liveStats')}</ProDayText>
            <ProDayText variant="caption" muted>
              {live.title}
            </ProDayText>
          </ProDaySurface>
        </PressableSpring>
      ) : null}

      <View style={styles.quickRow}>
        <PressableSpring
          style={[styles.quickBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => (next ? openEvent(next.id, 'composition') : onOpenChapter('planning'))}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" accent style={styles.link}>
            {t('roleHome.coach.lineup')}
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          style={[styles.quickBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => onOpenChapter('matchs')}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.cockpit.matchFlow')}
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          style={[styles.quickBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => nav.openCarpool()}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.cockpit.carpool')}
          </ProDayText>
        </PressableSpring>
      </View>
    </CoachChapterScroll>
  );
};

const styles = StyleSheet.create({
  heading: { gap: 2, marginBottom: 2 },
  section: { fontWeight: '800', marginTop: spacing.xs },
  kind: { textTransform: 'uppercase', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  link: { fontWeight: '800' },
  kpiRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  quickBtn: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  setupCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    gap: 4,
  },
  setupCtaWrap: { marginTop: 4, alignSelf: 'stretch' },
  setupCta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  setupLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 2 },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    gap: 4,
  },
});

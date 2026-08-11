import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachEmptyState } from './coachPortalUi';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { totalCarpoolAvailableSeats, totalCarpoolSeats } from '../../utils/carpoolBalance';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import { MatchTalkPanel } from './MatchTalkPanel';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';

const FLOW: { hub: 'apercu' | 'composition' | 'live' | 'stats'; labelKey: string }[] = [
  { hub: 'apercu', labelKey: 'coach.portal.matchs.stepConvoc' },
  { hub: 'composition', labelKey: 'coach.portal.matchs.stepLineup' },
  { hub: 'live', labelKey: 'coach.portal.matchs.stepLive' },
  { hub: 'stats', labelKey: 'coach.portal.matchs.stepReport' },
];

export const CoachMatchsChapter: React.FC<CoachChapterCommonProps> = ({
  events,
  profile,
  members,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();

  const openSmartTactics = () => {
    if (shellNav) shellNav.requestNav('smart_tactics');
    else nav.openDashboard('smart_tactics');
  };

  const nextMatch = useMemo(() => {
    const now = Date.now();
    return (
      [...events]
        .filter(
          (e) =>
            e.starts_at.getTime() > now &&
            (e.event_type === 'friendly' ||
              e.event_type === 'competition' ||
              e.event_type === 'tournament' ||
              e.event_type === 'training'),
        )
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0] ?? null
    );
  }, [events]);

  const carpoolSeats = nextMatch ? totalCarpoolSeats(nextMatch.carpool_slots) : 0;
  const carpoolFree = nextMatch ? totalCarpoolAvailableSeats(nextMatch.carpool_slots) : null;

  return (
    <CoachChapterScroll>
      <ProDayText variant="section">{t('coach.portal.matchs.title')}</ProDayText>
      <ProDayText variant="caption" muted>
        {t('coach.portal.matchs.subtitle')}
      </ProDayText>

      {!nextMatch ? (
        <CoachEmptyState
          title={t('coach.portal.matchs.empty')}
          body={t('coach.portal.matchs.emptyBody')}
          cta={t('coach.portal.matchs.openCalendar')}
          onPress={() => nav.openMatchs({ homeTab: 'season' })}
        />
      ) : (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="section">{nextMatch.title}</ProDayText>
          <ProDayText variant="caption" muted>
            {EVENT_TYPE_LABELS[nextMatch.event_type]} · {formatCalendarDate(nextMatch.starts_at)}
          </ProDayText>
          <ProDayText variant="caption" accent style={styles.flowTitle}>
            {t('coach.portal.matchs.guided')}
          </ProDayText>
          <View style={styles.flowRow}>
            {FLOW.map((step) => (
              <PressableSpring
                key={step.hub}
                onPress={() =>
                  tabNav.openMatchs({ eventId: nextMatch.id, hubChapter: step.hub })
                }
                scaleTo={0.96}
                haptic
                style={[styles.step, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <ProDayText variant="caption" accent style={styles.stepText}>
                  {t(step.labelKey)}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>
        </ProDaySurface>
      )}

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.matchs.carpool')}
        </ProDayText>
        {nextMatch ? (
          <>
            <ProDayText variant="caption" muted>
              {carpoolSeats === 0
                ? t('coach.portal.matchs.carpoolNone')
                : t('coach.portal.matchs.carpoolMeta', {
                    seats: carpoolSeats,
                    free: carpoolFree ?? 0,
                  })}
            </ProDayText>
            <PressableSpring
              onPress={() => tabNav.openMatchs({ eventId: nextMatch.id })}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" accent style={styles.link}>
                {t('coach.portal.matchs.openCarpool')}
              </ProDayText>
            </PressableSpring>
          </>
        ) : (
          <ProDayText variant="caption" muted>
            {t('coach.portal.matchs.carpoolWait')}
          </ProDayText>
        )}
        <PressableSpring onPress={() => nav.openCarpool()} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.matchs.carpoolTab')}
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.matchs.competitions')}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {t('coach.portal.matchs.competitionsBody')}
        </ProDayText>
        <PressableSpring
          onPress={() => nav.openMatchs({ homeTab: 'competitions' })}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.matchs.openCompetitions')}
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          onPress={() => nav.openMatchs({ homeTab: 'convocations' })}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.matchs.openConvocs')}
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>

      {nextMatch ? (
        <MatchTalkPanel
          event={nextMatch}
          profile={profile}
          members={members}
        />
      ) : (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent style={styles.section}>
            Causerie match
          </ProDayText>
          <ProDayText variant="caption" muted>
            Donnée indisponible — créez un match pour démarrer.
          </ProDayText>
          <PressableSpring
            onPress={openSmartTactics}
            scaleTo={0.96}
            haptic
          >
            <ProDayText variant="caption" accent style={styles.link}>
              Tactique IA — composition
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      )}
    </CoachChapterScroll>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  section: { fontWeight: '800', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6 },
  flowTitle: { fontWeight: '800', marginTop: spacing.sm },
  flowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  step: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  stepText: { fontWeight: '800', fontSize: 11 },
  link: { fontWeight: '800', marginTop: 4 },
});

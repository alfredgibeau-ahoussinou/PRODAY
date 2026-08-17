import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachActionRow,
  CoachChapterScroll,
  CoachEmptyState,
  CoachKpiRow,
  CoachSectionCard,
  CoachSettingsGroup,
  CoachSettingsRow,
  CoachText,
} from './coachPortalUi';
import { CoachScreenHeader } from './CoachScreenHeader';
import { EVENT_TYPE_LABELS, countRsvpYes, getPendingInviteeUids } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import { COACH_MATCH_FLOW_STEPS } from '../../features/coach/navigation/coachMatchDeepLink';
import type { MatchHubChapterId } from '../../content/matchHubChapters';

const ACTION_CHAPTERS: {
  hub: MatchHubChapterId;
  label: string;
  icon: React.ComponentProps<typeof CoachSettingsRow>['icon'];
}[] = [
  { hub: 'effectif', label: 'Pointage', icon: 'people' },
  { hub: 'composition', label: 'Compo', icon: 'football' },
  { hub: 'live', label: 'Direct', icon: 'time' },
  { hub: 'stats', label: 'Stats', icon: 'stats-chart' },
];

export const CoachMatchsChapter: React.FC<CoachChapterCommonProps> = ({ events }) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const styles = useMemo(() => createStyles(), []);

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

  const openHub = (hubChapter: MatchHubChapterId) => {
    if (!nextMatch) return;
    tabNav.openMatchs({ eventId: nextMatch.id, hubChapter });
  };

  const yesCount = nextMatch ? countRsvpYes(nextMatch) : 0;
  const pendingCount = nextMatch ? getPendingInviteeUids(nextMatch).length : 0;
  const inviteeCount = nextMatch?.invitee_uids.length ?? 0;

  return (
    <View style={styles.root}>
      <CoachScreenHeader title={t('coach.portal.matchs.title')} showTeamRow={false} />
      <CoachChapterScroll>
        <CoachText variant="body" muted style={styles.subtitle}>
          {t('coach.portal.matchs.subtitle')}
        </CoachText>

        {!nextMatch ? (
          <CoachEmptyState
            title={t('coach.portal.matchs.empty')}
            body={t('coach.portal.matchs.emptyBody')}
            cta={t('coach.portal.matchs.openCalendar')}
            onPress={() => nav.openMatchs({ homeTab: 'season' })}
          />
        ) : (
          <>
            <CoachSectionCard
              kicker={EVENT_TYPE_LABELS[nextMatch.event_type]}
              title={nextMatch.title}
              body={`${formatCalendarDate(nextMatch.starts_at)}${nextMatch.city ? `\n${nextMatch.city}` : ''}`}
            >
              <View style={styles.kpiWrap}>
                <CoachKpiRow
                  items={[
                    { label: 'Convoqués', value: String(inviteeCount) },
                    { label: 'Confirmés', value: String(yesCount) },
                    { label: 'En attente', value: String(pendingCount) },
                  ]}
                />
              </View>
              <CoachActionRow
                primary="Ouvrir l'événement"
                onPrimary={() => openHub('apercu')}
                secondary="Pointage"
                onSecondary={() => openHub('effectif')}
              />
            </CoachSectionCard>

            <CoachText variant="caption" muted style={styles.sectionLabel}>
              Actions rapides
            </CoachText>
            <View style={styles.actionGrid}>
              {ACTION_CHAPTERS.map((action) => (
                <Pressable
                  key={action.hub}
                  onPress={() => openHub(action.hub)}
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <CoachText variant="section" style={styles.actionLabel}>
                    {action.label}
                  </CoachText>
                </Pressable>
              ))}
            </View>

            <CoachText variant="caption" muted style={styles.sectionLabel}>
              {t('coach.portal.matchs.guided')}
            </CoachText>
            <CoachSettingsGroup>
              {COACH_MATCH_FLOW_STEPS.map((step, index) => (
                <CoachSettingsRow
                  key={step.hub}
                  icon={
                    step.hub === 'effectif'
                      ? 'people'
                      : step.hub === 'composition'
                        ? 'football'
                        : step.hub === 'live'
                          ? 'time'
                          : 'stats-chart'
                  }
                  label={t(step.labelKey)}
                  onPress={() => openHub(step.hub)}
                  last={index === COACH_MATCH_FLOW_STEPS.length - 1}
                />
              ))}
            </CoachSettingsGroup>
          </>
        )}

        <CoachSectionCard kicker={t('coach.portal.matchs.competitions')} title="Calendrier & compétitions">
          <CoachSettingsGroup>
            <CoachSettingsRow
              icon="calendar"
              label={t('coach.portal.matchs.openCalendar')}
              onPress={() => nav.openMatchs({ homeTab: 'season' })}
            />
            <CoachSettingsRow
              icon="trophy"
              label={t('coach.portal.matchs.openCompetitions')}
              onPress={() => nav.openMatchs({ homeTab: 'competitions' })}
            />
            <CoachSettingsRow
              icon="mail"
              label={t('coach.portal.matchs.openConvocs')}
              onPress={() => nav.openMatchs({ homeTab: 'convocations' })}
              last
            />
          </CoachSettingsGroup>
        </CoachSectionCard>

        {nextMatch ? (
          <CoachSectionCard kicker="Causerie" title="Briefing avant match">
            <CoachText variant="caption" muted>
              Objectifs et consignes depuis l’événement.
            </CoachText>
            <Pressable
              onPress={() => openHub('apercu')}
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
            >
              <CoachText variant="caption" accent style={styles.link}>
                Ouvrir le résumé événement →
              </CoachText>
            </Pressable>
          </CoachSectionCard>
        ) : null}
      </CoachChapterScroll>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: COACH_SITE.bg },
    subtitle: { marginTop: -spacing.sm },
    kpiWrap: { marginTop: spacing.sm },
    sectionLabel: {
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontSize: 11,
      marginTop: spacing.xs,
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionBtn: {
      flexGrow: 1,
      flexBasis: '45%',
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: COACH_SITE.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    actionLabel: {
      color: COACH_SITE.foreground,
      fontWeight: '700',
      fontSize: 16,
    },
    linkRow: { marginTop: spacing.sm },
    link: { fontWeight: '700' },
  });
}

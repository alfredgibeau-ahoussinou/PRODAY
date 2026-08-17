import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
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
import { CoachPane } from './CoachScreenHeader';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  getPendingInviteeUids,
  isCoachEventHubReady,
  isCoachMatchEvent,
} from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { spacing } from '../../theme/designTokens';
import { COACH_MATCH_FLOW_STEPS } from '../../features/coach/navigation/coachMatchDeepLink';
import type { MatchHubChapterId } from '../../content/matchHubChapters';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { PressableSpring } from '../motion';

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

export const CoachMatchsChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
}) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const shellNav = useCoachShellNav();
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = userCanManageConvocations(profile, { clubCoversCoach });

  const upcomingMatches = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => e.starts_at.getTime() > now && isCoachMatchEvent(e))
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [events]);

  const nextMatch = upcomingMatches[0] ?? null;

  const openNav = (id: 'entrainements' | 'gestion' | 'match_center') => {
    if (shellNav) {
      shellNav.requestNav(id);
      return;
    }
    tabNav.openMatchs(
      id === 'entrainements'
        ? { homeTab: 'season' }
        : id === 'gestion'
          ? { homeTab: 'convocations' }
          : undefined,
    );
  };

  const openCreate = () => {
    if (!canManage) {
      Alert.alert(t('coach.portal.proGate.title'), t('coach.portal.proGate.body'));
      return;
    }
    openNav('gestion');
  };

  const openHub = (eventId: string, hubChapter: MatchHubChapterId = 'apercu') => {
    tabNav.openMatchs({ eventId, hubChapter });
  };

  const yesCount = nextMatch ? countRsvpYes(nextMatch) : 0;
  const pendingCount = nextMatch ? getPendingInviteeUids(nextMatch).length : 0;
  const inviteeCount = nextMatch?.invitee_uids.length ?? 0;

  return (
    <CoachPane title={getCoachPageIdentity('match_center').title}>
      <CoachChapterScroll>
        <CoachText variant="body" muted style={styles.subtitle}>
          {t('coach.portal.matchs.subtitle')}
        </CoachText>

        {!nextMatch ? (
          <CoachEmptyState
            title={t('coach.portal.matchs.empty')}
            body={t('coach.portal.matchs.emptyBody')}
            cta={t('coach.portal.matchs.emptyCta')}
            onPress={openCreate}
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
                onPrimary={() => openHub(nextMatch.id, 'apercu')}
                secondary="Pointage"
                onSecondary={() => openHub(nextMatch.id, 'effectif')}
              />
            </CoachSectionCard>

            <CoachText variant="caption" muted style={styles.sectionLabel}>
              Actions rapides
            </CoachText>
            <View style={styles.actionGrid}>
              {ACTION_CHAPTERS.map((action) => (
                <Pressable
                  key={action.hub}
                  onPress={() => openHub(nextMatch.id, action.hub)}
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
                  onPress={() => openHub(nextMatch.id, step.hub)}
                  last={index === COACH_MATCH_FLOW_STEPS.length - 1}
                />
              ))}
            </CoachSettingsGroup>
          </>
        )}

        {upcomingMatches.length > 0 ? (
          <CoachSectionCard
            kicker={t('coach.portal.matchs.upcoming')}
            title={t('coach.portal.matchs.upcoming')}
          >
            {upcomingMatches.map((match, index) => {
              const ready = isCoachEventHubReady(match);
              return (
                <PressableSpring
                  key={match.id}
                  onPress={() => (ready ? openHub(match.id) : openCreate())}
                  scaleTo={0.98}
                  haptic={ready}
                >
                  <View
                    style={[
                      styles.matchRow,
                      index < upcomingMatches.length - 1 && styles.matchRowBorder,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <CoachText variant="section">{match.title}</CoachText>
                      <CoachText variant="caption" muted>
                        {EVENT_TYPE_LABELS[match.event_type]} · {formatCalendarDate(match.starts_at)}
                        {match.city ? ` · ${match.city}` : ''}
                      </CoachText>
                    </View>
                    <CoachText variant="caption" accent style={styles.matchLink}>
                      {ready ? 'Ouvrir →' : t('coach.portal.planning.hubIncompleteCta')}
                    </CoachText>
                  </View>
                </PressableSpring>
              );
            })}
          </CoachSectionCard>
        ) : null}

        <CoachSectionCard kicker={t('coach.portal.matchs.competitions')} title="Calendrier & compétitions">
          <CoachSettingsGroup>
            <CoachSettingsRow
              icon="calendar"
              label={t('coach.portal.matchs.openCalendar')}
              onPress={() => openNav('entrainements')}
            />
            <CoachSettingsRow
              icon="trophy"
              label={t('coach.portal.matchs.openCompetitions')}
              onPress={() => openNav('match_center')}
            />
            <CoachSettingsRow
              icon="mail"
              label={t('coach.portal.matchs.openConvocs')}
              onPress={() => openNav('gestion')}
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
              onPress={() => openHub(nextMatch.id, 'apercu')}
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
            >
              <CoachText variant="caption" accent style={styles.link}>
                Ouvrir le résumé événement →
              </CoachText>
            </Pressable>
          </CoachSectionCard>
        ) : null}
      </CoachChapterScroll>
    </CoachPane>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
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
      backgroundColor: tokens.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    actionLabel: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 16,
    },
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    matchRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    matchLink: { fontWeight: '700' },
    linkRow: { marginTop: spacing.sm },
    link: { fontWeight: '700' },
  });
}

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachSectionCard,
  CoachSettingsGroup,
  CoachSettingsRow,
  CoachText,
} from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import {
  isCoachMatchEvent,
  isCoachPlanningRelevant,
  isCoachTrainingEvent,
  resolveEventSessionStatus,
  type EventSessionStatus,
  type EventTask,
  type TeamEvent,
} from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { teamEventsService } from '../../services/teamEvents.service';
import { buildCoachComposedPlan, formatRecommendedSessionNotes } from '../../utils/coachTrainingRecommendation';
import { coachObjectivesService } from '../../services/coachObjectives.service';
import type { CoachSeasonObjective } from '../../models/CoachSeasonObjective';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { radius, spacing } from '../../theme/designTokens';

function isPlanningVisible(event: TeamEvent): boolean {
  if (!isCoachPlanningRelevant(event)) return false;
  const status = resolveEventSessionStatus(event);
  if (status === 'in_progress') return true;
  if (status === 'finished') return false;
  return event.starts_at.getTime() > Date.now() - 6 * 3600_000;
}

function statusLabel(status: EventSessionStatus, t: (key: string) => string): string {
  if (status === 'in_progress') return t('coach.portal.planning.statusInProgress');
  if (status === 'finished') return t('coach.portal.planning.statusFinished');
  return t('coach.portal.planning.statusScheduled');
}

function statusTone(status: EventSessionStatus, tokens: CoachThemeTokens): string {
  if (status === 'in_progress') return tokens.accent;
  if (status === 'finished') return tokens.muted;
  return tokens.foreground;
}

export const CoachPlanningChapter: React.FC<CoachChapterCommonProps> = ({
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
  const formInputStyle = useMemo(
    () => ({
      borderColor: tokens.border,
      color: tokens.foreground,
      backgroundColor: tokens.surface,
    }),
    [tokens.border, tokens.foreground, tokens.surface],
  );
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = userCanManageConvocations(profile, { clubCoversCoach });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [focus, setFocus] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('90');
  const [saving, setSaving] = useState(false);
  const [objectives, setObjectives] = useState<CoachSeasonObjective[]>([]);

  const clubId = profile.profile.club_id;

  useEffect(() => {
    if (!clubId) return;
    void coachObjectivesService.listForClub(clubId).then(setObjectives).catch(() => setObjectives([]));
  }, [clubId]);

  const { trainings, matches } = useMemo(() => {
    const visible = [...events].filter(isPlanningVisible);
    const sortByStart = (a: TeamEvent, b: TeamEvent) =>
      a.starts_at.getTime() - b.starts_at.getTime();
    return {
      trainings: visible.filter(isCoachTrainingEvent).sort(sortByStart),
      matches: visible.filter(isCoachMatchEvent).sort(sortByStart),
    };
  }, [events]);

  const hasAny = trainings.length > 0 || matches.length > 0;

  const openCreate = () => {
    if (!canManage) {
      Alert.alert(t('coach.portal.proGate.title'), t('coach.portal.proGate.body'));
      return;
    }
    if (shellNav) shellNav.requestNav('gestion');
    else nav.openDashboard('gestion');
  };

  const selectEvent = (event: TeamEvent) => {
    setExpandedId(event.id === expandedId ? null : event.id);
    setFocus(event.session_plan?.focus ?? '');
    setNotes(event.session_plan?.notes ?? '');
    setDuration(String(event.session_plan?.duration_min ?? 90));
  };

  const savePlan = async (event: TeamEvent) => {
    setSaving(true);
    try {
      await teamEventsService.updateSessionPlan(
        event.id,
        {
          focus: focus.trim() || undefined,
          notes: notes.trim() || undefined,
          duration_min: parseInt(duration, 10) || undefined,
          objective_ids: objectives.filter((o) => o.scope === 'team').slice(0, 3).map((o) => o.id),
        },
        { user: profile },
      );
      onRefresh();
      Alert.alert('OK', t('coach.portal.planning.planSaved'));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const generateAiPlan = async (event: TeamEvent) => {
    if (!canManage) {
      Alert.alert(t('coach.portal.proGate.title'), t('coach.portal.proGate.body'));
      return;
    }
    const isMatch = isCoachMatchEvent(event);
    const plan = buildCoachComposedPlan({
      events,
      members,
      hasClub: Boolean(clubId),
      targetEvent: event,
    });

    setFocus(plan.focus);
    setNotes(formatRecommendedSessionNotes(plan));
    setDuration(String(plan.totalMinutes || 90));
    setExpandedId(event.id);
    Alert.alert(
      isMatch ? t('coach.portal.planning.matchBriefing') : t('coach.portal.planning.aiTitle'),
      isMatch
        ? `${plan.totalMinutes} min — ${plan.focus}`
        : t('coach.portal.planning.aiBody', { min: plan.totalMinutes }),
    );
  };

  const confirmDelete = (event: TeamEvent) => {
    const isMatch = isCoachMatchEvent(event);
    Alert.alert(
      t('coach.portal.planning.confirmDeleteTitle'),
      isMatch
        ? t('coach.portal.planning.confirmDeleteMatch')
        : t('coach.portal.planning.confirmDeleteTraining'),
      [
        { text: t('coach.portal.planning.cancel'), style: 'cancel' },
        {
          text: t('coach.portal.planning.delete'),
          style: 'destructive',
          onPress: () => void deleteEvent(event),
        },
      ],
    );
  };

  const confirmEnd = (event: TeamEvent) => {
    const isMatch = isCoachMatchEvent(event);
    Alert.alert(
      t('coach.portal.planning.confirmEndTitle'),
      isMatch
        ? t('coach.portal.planning.confirmEndMatch')
        : t('coach.portal.planning.confirmEndTraining'),
      [
        { text: t('coach.portal.planning.cancel'), style: 'cancel' },
        {
          text: t('coach.portal.planning.end'),
          onPress: () => void endSession(event),
        },
      ],
    );
  };

  const deleteEvent = async (event: TeamEvent) => {
    try {
      await teamEventsService.deleteEvent(event.id, { user: profile });
      if (expandedId === event.id) setExpandedId(null);
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const endSession = async (event: TeamEvent) => {
    try {
      await teamEventsService.endSession(event.id, { user: profile });
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const toggleTask = async (event: TeamEvent, taskId: string) => {
    const tasks: EventTask[] = (event.event_tasks ?? []).map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );
    try {
      await teamEventsService.updateEventTasks(event.id, tasks, { user: profile });
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const addDefaultTasks = async (event: TeamEvent) => {
    if ((event.event_tasks ?? []).length > 0) return;
    const defaults: EventTask[] = [
      { id: `t_carpool_${Date.now()}`, kind: 'carpool', label: 'Covoiturage', assignee_uids: [], done: false },
      { id: `t_eq_${Date.now()}`, kind: 'equipment', label: 'Matériel', assignee_uids: [], done: false },
      { id: `t_snack_${Date.now()}`, kind: 'snacks', label: 'Collation', assignee_uids: [], done: false },
    ];
    try {
      await teamEventsService.updateEventTasks(event.id, defaults, { user: profile });
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const renderStatusBadge = (event: TeamEvent) => {
    const status = resolveEventSessionStatus(event);
    const isTraining = isCoachTrainingEvent(event);
    return (
      <View
        style={[
          styles.statusBadge,
          {
            borderColor: isTraining ? tokens.accent : 'rgba(255, 180, 50, 0.55)',
            backgroundColor: isTraining ? tokens.soft : 'rgba(255, 180, 50, 0.12)',
          },
        ]}
      >
        <CoachText variant="caption" style={{ color: statusTone(status, tokens), fontWeight: '700' }}>
          {statusLabel(status, t)}
        </CoachText>
      </View>
    );
  };

  const renderPlanForm = (event: TeamEvent, isMatch: boolean) => (
    <>
      <PressableSpring onPress={() => void generateAiPlan(event)} scaleTo={0.96} haptic>
        <CoachText variant="caption" accent style={styles.link}>
          {isMatch ? t('coach.portal.planning.generateMatchAi') : t('coach.portal.planning.generateAi')}
        </CoachText>
      </PressableSpring>

      <CoachText variant="caption" muted style={styles.label}>
        {isMatch ? t('coach.portal.planning.matchBriefing') : t('coach.portal.planning.focus')}
      </CoachText>
      <TextInput
        style={[styles.input, formInputStyle]}
        value={focus}
        onChangeText={setFocus}
        placeholder={
          isMatch
            ? t('coach.portal.planning.matchBriefingPlaceholder')
            : t('coach.portal.planning.focusPlaceholder')
        }
        placeholderTextColor={tokens.muted}
      />
      <CoachText variant="caption" muted style={styles.label}>
        {t('coach.portal.planning.duration')}
      </CoachText>
      <TextInput
        style={[styles.input, formInputStyle]}
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        placeholderTextColor={tokens.muted}
      />
      <CoachText variant="caption" muted style={styles.label}>
        {isMatch ? t('coach.portal.planning.notes') : t('coach.portal.planning.notes')}
      </CoachText>
      <TextInput
        style={[styles.input, styles.multi, formInputStyle]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder={
          isMatch
            ? t('coach.portal.planning.matchBriefingPlaceholder')
            : t('coach.portal.planning.notesPlaceholder')
        }
        placeholderTextColor={tokens.muted}
      />
      <PressableSpring onPress={() => void savePlan(event)} disabled={saving} scaleTo={0.96} haptic>
        <CoachText variant="caption" accent style={styles.link}>
          {t('coach.portal.planning.savePlan')}
        </CoachText>
      </PressableSpring>
    </>
  );

  const renderTasks = (event: TeamEvent) => (
    <>
      <CoachText variant="caption" accent style={styles.label}>
        {t('coach.portal.planning.prep')}
      </CoachText>
      {(event.event_tasks ?? []).length === 0 ? (
        <PressableSpring onPress={() => void addDefaultTasks(event)} scaleTo={0.96} haptic>
          <CoachText variant="caption" muted>
            {t('coach.portal.planning.addTasks')}
          </CoachText>
        </PressableSpring>
      ) : (
        (event.event_tasks ?? []).map((task) => (
          <PressableSpring
            key={task.id}
            onPress={() => void toggleTask(event, task.id)}
            scaleTo={0.97}
            haptic
            style={styles.taskRow}
          >
            <CoachText variant="caption" accent={task.done} muted={!task.done}>
              {task.done ? '✓ ' : '○ '}
              {task.label}
            </CoachText>
          </PressableSpring>
        ))
      )}
    </>
  );

  const renderManageActions = (event: TeamEvent, isMatch: boolean) => {
    if (!canManage) return null;
    const status = resolveEventSessionStatus(event);
    const showEnd = status === 'in_progress';

    return (
      <CoachSettingsGroup>
        {showEnd ? (
          <CoachSettingsRow
            icon={isMatch ? 'football' : 'calendar'}
            label={isMatch ? t('coach.portal.planning.endMatch') : t('coach.portal.planning.endTraining')}
            onPress={() => confirmEnd(event)}
          />
        ) : null}
        <CoachSettingsRow
          icon="close"
          label={isMatch ? t('coach.portal.planning.deleteMatch') : t('coach.portal.planning.deleteTraining')}
          onPress={() => confirmDelete(event)}
          destructive
          last
        />
      </CoachSettingsGroup>
    );
  };

  const renderTrainingCard = (event: TeamEvent) => {
    const open = expandedId === event.id;
    return (
      <View
        key={event.id}
        style={[styles.eventCard, styles.trainingCard, { backgroundColor: tokens.surface }]}
      >
        <PressableSpring onPress={() => selectEvent(event)} scaleTo={0.98} haptic>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Icon name="calendar" size={16} color={tokens.accent} />
              <CoachText variant="section" style={styles.cardTitle}>
                {event.title}
              </CoachText>
            </View>
            {renderStatusBadge(event)}
          </View>
          <CoachText variant="caption" muted>
            {formatCalendarDate(event.starts_at)}
            {event.session_plan?.duration_min ? ` · ${event.session_plan.duration_min} min` : ''}
          </CoachText>
          {event.session_plan?.focus ? (
            <CoachText variant="caption" accent>
              {event.session_plan.focus}
            </CoachText>
          ) : null}
        </PressableSpring>

        {open ? (
          <View style={styles.form}>
            {renderPlanForm(event, false)}
            {renderTasks(event)}
            <PressableSpring
              onPress={() => {
                if (shellNav) shellNav.requestNav('carpool');
                else nav.openCarpool();
              }}
              scaleTo={0.96}
              haptic
            >
              <CoachText variant="caption" accent style={styles.link}>
                Covoiturage
              </CoachText>
            </PressableSpring>
            {renderManageActions(event, false)}
          </View>
        ) : null}
      </View>
    );
  };

  const renderMatchCard = (event: TeamEvent) => {
    const open = expandedId === event.id;
    return (
      <View
        key={event.id}
        style={[styles.eventCard, styles.matchCard, { backgroundColor: tokens.surface }]}
      >
        <PressableSpring onPress={() => selectEvent(event)} scaleTo={0.98} haptic>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Icon name="trophy" size={16} color="rgba(255, 180, 50, 0.95)" />
              <CoachText variant="section" style={styles.cardTitle}>
                {event.title}
              </CoachText>
            </View>
            {renderStatusBadge(event)}
          </View>
          <CoachText variant="caption" muted>
            {formatCalendarDate(event.starts_at)}
            {event.city ? ` · ${event.city}` : ''}
          </CoachText>
          {event.session_plan?.focus ? (
            <CoachText variant="caption" accent>
              {event.session_plan.focus}
            </CoachText>
          ) : null}
        </PressableSpring>

        {open ? (
          <View style={styles.form}>
            {renderPlanForm(event, true)}
            {renderTasks(event)}
            <PressableSpring
              onPress={() => tabNav.openMatchs({ eventId: event.id })}
              scaleTo={0.96}
              haptic
            >
              <CoachText variant="caption" accent style={styles.link}>
                {t('coach.portal.planning.openMatchHub')}
              </CoachText>
            </PressableSpring>
            <PressableSpring
              onPress={() => {
                if (shellNav) shellNav.requestNav('carpool');
                else nav.openCarpool();
              }}
              scaleTo={0.96}
              haptic
            >
              <CoachText variant="caption" accent style={styles.link}>
                Covoiturage
              </CoachText>
            </PressableSpring>
            {renderManageActions(event, true)}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <CoachPane
      title={getCoachPageIdentity('planning').title}
      actions={[
        {
          icon: 'add',
          onPress: openCreate,
          accessibilityLabel: t('coach.portal.planning.create'),
        },
      ]}
    >
      <CoachChapterScroll>
        {!hasAny ? (
          <CoachEmptyState
            title={t('coach.portal.planning.empty')}
            body={t('coach.portal.planning.emptyBody')}
            cta={t('coach.portal.planning.create')}
            onPress={openCreate}
          />
        ) : (
          <>
            <CoachSectionCard
              kicker={t('coach.portal.planning.sectionTrainings')}
              title={t('coach.portal.planning.sectionTrainings')}
            >
              {trainings.length === 0 ? (
                <CoachText variant="caption" muted>
                  {t('coach.portal.planning.sectionTrainingsEmpty')}
                </CoachText>
              ) : (
                trainings.map(renderTrainingCard)
              )}
            </CoachSectionCard>

            <CoachSectionCard
              kicker={t('coach.portal.planning.sectionMatches')}
              title={t('coach.portal.planning.sectionMatches')}
            >
              {matches.length === 0 ? (
                <CoachText variant="caption" muted>
                  {t('coach.portal.planning.sectionMatchesEmpty')}
                </CoachText>
              ) : (
                matches.map(renderMatchCard)
              )}
            </CoachSectionCard>
          </>
        )}
      </CoachChapterScroll>
    </CoachPane>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    eventCard: {
      borderRadius: 14,
      padding: spacing.md,
      gap: 4,
      marginTop: spacing.sm,
      borderWidth: 1,
    },
    trainingCard: {
      borderColor: tokens.accent,
    },
    matchCard: {
      borderColor: 'rgba(255, 180, 50, 0.45)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    cardTitleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    cardTitle: { flex: 1 },
    statusBadge: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    form: { marginTop: spacing.sm, gap: spacing.xs },
    label: { fontWeight: '700', marginTop: spacing.xs },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
    },
    multi: { minHeight: 72, textAlignVertical: 'top' },
    link: { fontWeight: '800' },
    taskRow: { paddingVertical: 4 },
  });

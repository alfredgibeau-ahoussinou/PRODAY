import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachEmptyState, CoachText } from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { PressableSpring } from '../motion';
import { EVENT_TYPE_LABELS, type EventTask, type TeamEvent } from '../../models/TeamEvent';
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
import { COACH_SITE, getCoachPageIdentity } from '../../content/coachPageIdentity';
import { radius, spacing } from '../../theme/designTokens';

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

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.starts_at.getTime() > Date.now() - 6 * 3600_000)
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime()),
    [events],
  );

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
    const isMatch =
      event.event_type === 'friendly' ||
      event.event_type === 'competition' ||
      event.event_type === 'tournament';

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
      isMatch ? 'Préparation match' : t('coach.portal.planning.aiTitle'),
      isMatch
        ? `Briefing ${plan.totalMinutes} min — ${plan.focus}`
        : t('coach.portal.planning.aiBody', { min: plan.totalMinutes }),
    );
  };

  const toggleTask = async (event: TeamEvent, taskId: string) => {
    const tasks: EventTask[] = (event.event_tasks ?? []).map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );
    try {
      await teamEventsService.updateEventTasks(event.id, tasks, {
        user: profile,
      });
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
      await teamEventsService.updateEventTasks(event.id, defaults, {
        user: profile,
      });
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
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
      {upcoming.length === 0 ? (
        <CoachEmptyState
          title={t('coach.portal.planning.empty')}
          body={t('coach.portal.planning.emptyBody')}
          cta={t('coach.portal.planning.create')}
          onPress={openCreate}
        />
      ) : (
        upcoming.map((event) => {
          const open = expandedId === event.id;
          return (
            <View
              key={event.id}
              style={[styles.card, { backgroundColor: COACH_SITE.surface }]}
            >
              <PressableSpring onPress={() => selectEvent(event)} scaleTo={0.98} haptic>
                <CoachText variant="section">{event.title}</CoachText>
                <CoachText variant="caption" muted>
                  {EVENT_TYPE_LABELS[event.event_type]} · {formatCalendarDate(event.starts_at)}
                </CoachText>
                {event.session_plan?.focus ? (
                  <CoachText variant="caption" accent>
                    {event.session_plan.focus}
                  </CoachText>
                ) : null}
              </PressableSpring>

              {open ? (
                <View style={styles.form}>
                  <PressableSpring
                    onPress={() => void generateAiPlan(event)}
                    scaleTo={0.96}
                    haptic
                  >
                    <CoachText variant="caption" accent style={styles.link}>
                      {event.event_type === 'friendly' ||
                      event.event_type === 'competition' ||
                      event.event_type === 'tournament'
                        ? 'Générer briefing match (IA)'
                        : t('coach.portal.planning.generateAi')}
                    </CoachText>
                  </PressableSpring>

                  {(event.event_type === 'training' ||
                    event.event_type === 'other' ||
                    event.event_type === 'friendly' ||
                    event.event_type === 'competition' ||
                    event.event_type === 'tournament') && (
                    <>
                      <CoachText variant="caption" muted style={styles.label}>
                        {t('coach.portal.planning.focus')}
                      </CoachText>
                      <TextInput
                        style={[styles.input, { borderColor: COACH_SITE.border, color: COACH_SITE.foreground, backgroundColor: COACH_SITE.bg }]}
                        value={focus}
                        onChangeText={setFocus}
                        placeholder={t('coach.portal.planning.focusPlaceholder')}
                        placeholderTextColor={COACH_SITE.muted}
                      />
                      <CoachText variant="caption" muted style={styles.label}>
                        {t('coach.portal.planning.duration')}
                      </CoachText>
                      <TextInput
                        style={[styles.input, { borderColor: COACH_SITE.border, color: COACH_SITE.foreground, backgroundColor: COACH_SITE.bg }]}
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="number-pad"
                        placeholderTextColor={COACH_SITE.muted}
                      />
                      <CoachText variant="caption" muted style={styles.label}>
                        {t('coach.portal.planning.notes')}
                      </CoachText>
                      <TextInput
                        style={[
                          styles.input,
                          styles.multi,
                          { borderColor: COACH_SITE.border, color: COACH_SITE.foreground, backgroundColor: COACH_SITE.bg },
                        ]}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        placeholder={t('coach.portal.planning.notesPlaceholder')}
                        placeholderTextColor={COACH_SITE.muted}
                      />
                      <PressableSpring
                        onPress={() => void savePlan(event)}
                        disabled={saving}
                        scaleTo={0.96}
                        haptic
                      >
                        <CoachText variant="caption" accent style={styles.link}>
                          {t('coach.portal.planning.savePlan')}
                        </CoachText>
                      </PressableSpring>
                    </>
                  )}

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
                  <PressableSpring
                    onPress={() => tabNav.openMatchs({ eventId: event.id })}
                    scaleTo={0.96}
                    haptic
                  >
                    <CoachText variant="caption" accent style={styles.link}>
                      {t('coach.portal.planning.openEvent')}
                    </CoachText>
                  </PressableSpring>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </CoachChapterScroll>
    </CoachPane>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: spacing.md, gap: 4 },
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

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachEmptyState } from './coachPortalUi';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { EVENT_TYPE_LABELS, type EventTask, type TeamEvent } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { teamEventsService } from '../../services/teamEvents.service';
import { smartTacticsService } from '../../services/smartTactics.service';
import { coachObjectivesService } from '../../services/coachObjectives.service';
import type { CoachSeasonObjective } from '../../models/CoachSeasonObjective';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';

export const CoachPlanningChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onRefresh,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
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
    nav.openDashboard('gestion');
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
    const previous = [...events]
      .filter(
        (e) =>
          e.id !== event.id &&
          (e.event_type === 'friendly' || e.event_type === 'competition') &&
          e.starts_at.getTime() < event.starts_at.getTime(),
      )
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())[0];
    const session = smartTacticsService.generateTraining({
      previous_match: previous,
      season_objectives: objectives.slice(0, 4).map((o) => o.title),
      team_weaknesses: previous ? ['Transitions', 'Finition'] : undefined,
    });
    const blockNotes = session.blocks
      .map((b) => `• ${b.title} (${b.duration_min}') — ${b.focus}`)
      .join('\n');
    setFocus(session.blocks.find((b) => b.kind === 'tactical')?.title ?? session.blocks[0]?.title ?? '');
    setNotes(blockNotes);
    setDuration(String(session.total_duration_min));
    setExpandedId(event.id);
    Alert.alert(
      t('coach.portal.planning.aiTitle'),
      t('coach.portal.planning.aiBody', { min: session.total_duration_min }),
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
    <CoachChapterScroll>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <ProDayText variant="section">{t('coach.portal.planning.title')}</ProDayText>
          <ProDayText variant="caption" muted>
            {t('coach.portal.planning.subtitle')}
          </ProDayText>
        </View>
        <PressableSpring onPress={openCreate} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.planning.create')}
          </ProDayText>
        </PressableSpring>
      </View>

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
            <ProDaySurface
              key={event.id}
              variant="module"
              style={[styles.card, { borderColor: colors.border }]}
            >
              <PressableSpring onPress={() => selectEvent(event)} scaleTo={0.98} haptic>
                <ProDayText variant="section">{event.title}</ProDayText>
                <ProDayText variant="caption" muted>
                  {EVENT_TYPE_LABELS[event.event_type]} · {formatCalendarDate(event.starts_at)}
                </ProDayText>
                {event.session_plan?.focus ? (
                  <ProDayText variant="caption" accent>
                    {event.session_plan.focus}
                  </ProDayText>
                ) : null}
              </PressableSpring>

              {open ? (
                <View style={styles.form}>
                  {(event.event_type === 'training' || event.event_type === 'other') && (
                    <>
                      <PressableSpring
                        onPress={() => void generateAiPlan(event)}
                        scaleTo={0.96}
                        haptic
                      >
                        <ProDayText variant="caption" accent style={styles.link}>
                          {t('coach.portal.planning.generateAi')}
                        </ProDayText>
                      </PressableSpring>
                      <ProDayText variant="caption" muted style={styles.label}>
                        {t('coach.portal.planning.focus')}
                      </ProDayText>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
                        value={focus}
                        onChangeText={setFocus}
                        placeholder={t('coach.portal.planning.focusPlaceholder')}
                        placeholderTextColor={colors.textMuted}
                      />
                      <ProDayText variant="caption" muted style={styles.label}>
                        {t('coach.portal.planning.duration')}
                      </ProDayText>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="number-pad"
                        placeholderTextColor={colors.textMuted}
                      />
                      <ProDayText variant="caption" muted style={styles.label}>
                        {t('coach.portal.planning.notes')}
                      </ProDayText>
                      <TextInput
                        style={[
                          styles.input,
                          styles.multi,
                          { borderColor: colors.border, color: colors.ink },
                        ]}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        placeholder={t('coach.portal.planning.notesPlaceholder')}
                        placeholderTextColor={colors.textMuted}
                      />
                      <PressableSpring
                        onPress={() => void savePlan(event)}
                        disabled={saving}
                        scaleTo={0.96}
                        haptic
                      >
                        <ProDayText variant="caption" accent style={styles.link}>
                          {t('coach.portal.planning.savePlan')}
                        </ProDayText>
                      </PressableSpring>
                    </>
                  )}

                  <ProDayText variant="caption" accent style={styles.label}>
                    {t('coach.portal.planning.prep')}
                  </ProDayText>
                  {(event.event_tasks ?? []).length === 0 ? (
                    <PressableSpring onPress={() => void addDefaultTasks(event)} scaleTo={0.96} haptic>
                      <ProDayText variant="caption" muted>
                        {t('coach.portal.planning.addTasks')}
                      </ProDayText>
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
                        <ProDayText variant="caption" accent={task.done} muted={!task.done}>
                          {task.done ? '✓ ' : '○ '}
                          {task.label}
                        </ProDayText>
                      </PressableSpring>
                    ))
                  )}

                  <PressableSpring
                    onPress={() => tabNav.openMatchs({ eventId: event.id })}
                    scaleTo={0.96}
                    haptic
                  >
                    <ProDayText variant="caption" accent style={styles.link}>
                      {t('coach.portal.planning.openEvent')}
                    </ProDayText>
                  </PressableSpring>
                </View>
              ) : null}
            </ProDaySurface>
          );
        })
      )}
    </CoachChapterScroll>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
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

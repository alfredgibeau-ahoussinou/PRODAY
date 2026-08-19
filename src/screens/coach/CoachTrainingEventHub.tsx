import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { EventTask, TeamEvent } from '../../models/TeamEvent';
import {
  EVENT_TYPE_LABELS,
  isCoachEventHubReady,
  resolveEventSessionStatus,
} from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { membershipsService } from '../../services/memberships.service';
import { usersService } from '../../services/users.service';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { canViewTeamEvent } from '../../utils/teamEventAccess';
import { useAuth } from '../../context/AuthContext';
import { CoachKpiRow, CoachText } from '../../components/coach/coachPortalUi';
import { CoachTrainingTeamRoster } from '../../components/coach/CoachTrainingTeamRoster';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { spacing, radius } from '../../theme/designTokens';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import {
  filterMembersForTeam,
  filterTrainingsForTeam,
  teamPlayerUids,
} from '../../utils/coachTeamTheme';
import { useTranslation } from '../../context/LocaleContext';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import type { Membership } from '../../models/Membership';
import type { User } from '../../models/User';
import { aiTrainingService } from '../../services/aiTraining.service';
import type { TrainingPhase, TrainingObjective, TrainingLevel } from '../../models/TrainingSession';
import {
  COLLECTIVE_OBJECTIVES,
  COLLECTIVE_DURATIONS,
  TRAINING_OBJECTIVE_LABELS,
  TRAINING_LEVEL_LABELS,
  phaseLabel,
} from '../../models/TrainingSession';

export type CoachTrainingEventHubProps = {
  eventId: string;
  onBack: () => void;
  onOpenCarpool?: () => void;
};

export function CoachTrainingEventHub({
  eventId,
  onBack,
  onOpenCarpool,
}: CoachTrainingEventHubProps) {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const { isAdmin } = useAuth();
  const { tokens, teamId: activeTeamId, teamName } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [focus, setFocus] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('90');
  const [saving, setSaving] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiObjective, setAiObjective] = useState<TrainingObjective>('technique');
  const [aiLevel, setAiLevel] = useState<TrainingLevel>('intermediate');
  const [aiDuration, setAiDuration] = useState(90);
  const [aiPlayerCount, setAiPlayerCount] = useState('18');
  const [aiNotes, setAiNotes] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<TrainingPhase[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setEvent(await teamEventsService.getById(eventId));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const clubId = profile?.profile.club_id;
  useEffect(() => {
    if (!clubId) {
      setMembers([]);
      setMemberships([]);
      return;
    }
    void usersService.listMembersByClubId(clubId).then(setMembers).catch(() => setMembers([]));
    void membershipsService.listByClub(clubId).then(setMemberships).catch(() => setMemberships([]));
  }, [clubId]);

  const teamMembers = useMemo(
    () => filterMembersForTeam(members, memberships, activeTeamId),
    [members, memberships, activeTeamId],
  );
  const teamUids = useMemo(
    () => teamPlayerUids(memberships, activeTeamId),
    [memberships, activeTeamId],
  );

  useEffect(() => {
    if (!event) return;
    setFocus(event.session_plan?.focus ?? '');
    setNotes(event.session_plan?.notes ?? '');
    setDuration(String(event.session_plan?.duration_min ?? 90));
  }, [event?.id, event?.session_plan]);

  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = Boolean(profile && userCanManageConvocations(profile, { clubCoversCoach }));
  const hasAccess = Boolean(event && profile && canViewTeamEvent(event, profile, { isAdmin }));
  const ready = Boolean(event && isCoachEventHubReady(event));
  const scopedEvent = useMemo(() => {
    if (!event) return null;
    const [matched] = filterTrainingsForTeam([event], activeTeamId, teamUids);
    return matched ?? event;
  }, [event, activeTeamId, teamUids]);

  const generateAiSession = async () => {
    if (!profile || !clubId) return;
    setAiGenerating(true);
    try {
      const result = await aiTrainingService.generateCollective({
        club_id: clubId,
        team_id: activeTeamId,
        objective: aiObjective,
        duration_min: aiDuration,
        level: aiLevel,
        player_count: parseInt(aiPlayerCount, 10) || 18,
        coach_notes: aiNotes || undefined,
      });
      setAiResult(result.phases);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'Génération impossible.');
    } finally {
      setAiGenerating(false);
    }
  };

  const savePlan = async () => {
    if (!event || !profile) return;
    setSaving(true);
    try {
      await teamEventsService.updateSessionPlan(
        event.id,
        {
          focus: focus.trim() || undefined,
          notes: notes.trim() || undefined,
          duration_min: parseInt(duration, 10) || undefined,
        },
        { user: profile },
      );
      await load();
      Alert.alert('OK', t('coach.portal.planning.planSaved'));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const endSession = async () => {
    if (!event || !profile) return;
    try {
      await teamEventsService.endSession(event.id, { user: profile });
      await load();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!event || !profile) return;
    const tasks: EventTask[] = (event.event_tasks ?? []).map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );
    try {
      await teamEventsService.updateEventTasks(event.id, tasks, { user: profile });
      await load();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const addDefaultTasks = async () => {
    if (!event || !profile || (event.event_tasks ?? []).length > 0) return;
    const defaults: EventTask[] = [
      { id: `t_carpool_${Date.now()}`, kind: 'carpool', label: 'Covoiturage', assignee_uids: [], done: false },
      { id: `t_eq_${Date.now()}`, kind: 'equipment', label: 'Matériel', assignee_uids: [], done: false },
      { id: `t_snack_${Date.now()}`, kind: 'snacks', label: 'Collation', assignee_uids: [], done: false },
    ];
    try {
      await teamEventsService.updateEventTasks(event.id, defaults, { user: profile });
      await load();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={tokens.accent} size="large" />
      </View>
    );
  }

  if (!event || !profile || !scopedEvent) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
          <Icon name="arrow-back" size={22} color={tokens.foreground} />
          <CoachText variant="body" accent>
            {t('coach.portal.eventHub.backPlanning')}
          </CoachText>
        </Pressable>
        <CoachText variant="body" muted>
          {t('coach.portal.eventHub.notFound')}
        </CoachText>
      </View>
    );
  }

  if (!hasAccess || !ready) {
    return (
      <View style={styles.root}>
        <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
          <Icon name="arrow-back" size={22} color={tokens.foreground} />
          <CoachText variant="body" accent>
            {t('coach.portal.eventHub.backPlanning')}
          </CoachText>
        </Pressable>
        <View style={styles.denied}>
          <Icon name="alert-circle" size={28} color={tokens.muted} />
          <CoachText variant="section">{t('coach.portal.planning.hubIncompleteTitle')}</CoachText>
          <CoachText variant="body" muted style={styles.deniedBody}>
            {t('coach.portal.planning.hubIncompleteBody')}
          </CoachText>
        </View>
      </View>
    );
  }

  const status = resolveEventSessionStatus(scopedEvent);
  const yesCount = scopedEvent.invitee_uids.filter(
    (uid) => scopedEvent.rsvps[uid] === 'yes',
  ).length;

  return (
    <View style={styles.root}>
      <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
        <Icon name="arrow-back" size={22} color={tokens.foreground} />
        <CoachText variant="body" accent>
          {t('coach.portal.eventHub.backPlanning')}
        </CoachText>
      </Pressable>

      <View style={styles.meta}>
        <CoachText variant="caption" muted style={styles.type}>
          {EVENT_TYPE_LABELS[scopedEvent.event_type]}
        </CoachText>
        <CoachText variant="title" style={styles.title} numberOfLines={2}>
          {scopedEvent.title}
        </CoachText>
        <CoachText variant="body" muted>
          {formatCalendarDate(scopedEvent.starts_at)}
        </CoachText>
      </View>

      <View style={styles.kpiWrap}>
        <CoachKpiRow
          items={[
            { label: t('coach.portal.eventHub.confirmed'), value: String(yesCount) },
            { label: t('coach.portal.eventHub.invited'), value: String(scopedEvent.invitee_uids.length) },
            {
              label: t('coach.portal.planning.duration'),
              value: scopedEvent.session_plan?.duration_min
                ? `${scopedEvent.session_plan.duration_min} min`
                : '—',
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CoachTrainingTeamRoster
          event={scopedEvent}
          profile={profile}
          teamMembers={teamMembers}
          teamName={teamName || t('coach.portal.team.switchLabel')}
          canManage={canManage}
          onUpdated={load}
        />

        <CoachText variant="caption" muted style={styles.label}>
          {t('coach.portal.planning.focus')}
        </CoachText>
        <TextInput
          style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
          value={focus}
          onChangeText={setFocus}
          placeholder={t('coach.portal.planning.focusPlaceholder')}
          placeholderTextColor={tokens.muted}
          editable={canManage}
        />
        <CoachText variant="caption" muted style={styles.label}>
          {t('coach.portal.planning.duration')}
        </CoachText>
        <TextInput
          style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          placeholderTextColor={tokens.muted}
          editable={canManage}
        />
        <CoachText variant="caption" muted style={styles.label}>
          {t('coach.portal.planning.notes')}
        </CoachText>
        <TextInput
          style={[styles.input, styles.multi, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder={t('coach.portal.planning.notesPlaceholder')}
          placeholderTextColor={tokens.muted}
          editable={canManage}
        />
        {canManage ? (
          <PressableSpring onPress={() => void savePlan()} disabled={saving} scaleTo={0.96} haptic>
            <CoachText variant="caption" accent style={styles.link}>
              {t('coach.portal.planning.savePlan')}
            </CoachText>
          </PressableSpring>
        ) : null}

        <CoachText variant="caption" accent style={styles.label}>
          {t('coach.portal.planning.prep')}
        </CoachText>
        {(scopedEvent.event_tasks ?? []).length === 0 ? (
          canManage ? (
            <PressableSpring onPress={() => void addDefaultTasks()} scaleTo={0.96} haptic>
              <CoachText variant="caption" muted>
                {t('coach.portal.planning.addTasks')}
              </CoachText>
            </PressableSpring>
          ) : null
        ) : (
          (scopedEvent.event_tasks ?? []).map((task) => (
            <PressableSpring
              key={task.id}
              onPress={() => canManage && void toggleTask(task.id)}
              scaleTo={0.97}
              haptic
            >
              <CoachText variant="caption" accent={task.done} muted={!task.done}>
                {task.done ? '✓ ' : '○ '}
                {task.label}
              </CoachText>
            </PressableSpring>
          ))
        )}

        {onOpenCarpool ? (
          <PressableSpring onPress={onOpenCarpool} scaleTo={0.96} haptic>
            <CoachText variant="caption" accent style={styles.link}>
              Covoiturage
            </CoachText>
          </PressableSpring>
        ) : null}

        {canManage ? (
          <>
            <CoachText variant="caption" accent style={styles.label}>
              Séance IA
            </CoachText>
            {!showAiForm && !aiResult ? (
              <PressableSpring onPress={() => setShowAiForm(true)} scaleTo={0.96} haptic>
                <View style={[styles.aiCta, { backgroundColor: tokens.accent }]}>
                  <Icon name="star-four-points" size={18} color={tokens.bg} />
                  <CoachText variant="caption" style={{ color: tokens.bg, fontWeight: '700' }}>
                    Générer une séance IA
                  </CoachText>
                </View>
              </PressableSpring>
            ) : null}

            {showAiForm && !aiResult ? (
              <View style={[styles.aiForm, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                <CoachText variant="caption" muted style={styles.label}>Objectif</CoachText>
                <View style={styles.chipRow}>
                  {COLLECTIVE_OBJECTIVES.map((obj) => (
                    <PressableSpring
                      key={obj}
                      style={[
                        styles.chip,
                        { borderColor: tokens.border },
                        aiObjective === obj && { backgroundColor: tokens.accent },
                      ]}
                      onPress={() => setAiObjective(obj)}
                      scaleTo={0.96}
                    >
                      <CoachText
                        variant="caption"
                        style={aiObjective === obj ? { color: tokens.bg } : { color: tokens.foreground }}
                      >
                        {TRAINING_OBJECTIVE_LABELS[obj]}
                      </CoachText>
                    </PressableSpring>
                  ))}
                </View>

                <CoachText variant="caption" muted style={styles.label}>Durée</CoachText>
                <View style={styles.chipRow}>
                  {COLLECTIVE_DURATIONS.map((d) => (
                    <PressableSpring
                      key={d}
                      style={[
                        styles.chip,
                        { borderColor: tokens.border },
                        aiDuration === d && { backgroundColor: tokens.accent },
                      ]}
                      onPress={() => setAiDuration(d)}
                      scaleTo={0.96}
                    >
                      <CoachText
                        variant="caption"
                        style={aiDuration === d ? { color: tokens.bg } : { color: tokens.foreground }}
                      >
                        {d} min
                      </CoachText>
                    </PressableSpring>
                  ))}
                </View>

                <CoachText variant="caption" muted style={styles.label}>Niveau</CoachText>
                <View style={styles.chipRow}>
                  {(['beginner', 'intermediate', 'advanced'] as TrainingLevel[]).map((lvl) => (
                    <PressableSpring
                      key={lvl}
                      style={[
                        styles.chip,
                        { borderColor: tokens.border },
                        aiLevel === lvl && { backgroundColor: tokens.accent },
                      ]}
                      onPress={() => setAiLevel(lvl)}
                      scaleTo={0.96}
                    >
                      <CoachText
                        variant="caption"
                        style={aiLevel === lvl ? { color: tokens.bg } : { color: tokens.foreground }}
                      >
                        {TRAINING_LEVEL_LABELS[lvl]}
                      </CoachText>
                    </PressableSpring>
                  ))}
                </View>

                <CoachText variant="caption" muted style={styles.label}>Joueurs</CoachText>
                <TextInput
                  style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                  value={aiPlayerCount}
                  onChangeText={setAiPlayerCount}
                  keyboardType="number-pad"
                  placeholderTextColor={tokens.muted}
                />

                <CoachText variant="caption" muted style={styles.label}>Notes (optionnel)</CoachText>
                <TextInput
                  style={[styles.input, styles.multi, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                  value={aiNotes}
                  onChangeText={setAiNotes}
                  multiline
                  placeholder="Précisions pour l'IA…"
                  placeholderTextColor={tokens.muted}
                />

                <PressableSpring
                  onPress={() => void generateAiSession()}
                  disabled={aiGenerating}
                  scaleTo={0.96}
                  haptic
                >
                  <View style={[styles.aiCta, { backgroundColor: tokens.accent }]}>
                    {aiGenerating ? (
                      <ActivityIndicator color={tokens.bg} />
                    ) : (
                      <>
                        <Icon name="star-four-points" size={18} color={tokens.bg} />
                        <CoachText variant="caption" style={{ color: tokens.bg, fontWeight: '700' }}>
                          Générer
                        </CoachText>
                      </>
                    )}
                  </View>
                </PressableSpring>

                <PressableSpring onPress={() => setShowAiForm(false)} scaleTo={0.96}>
                  <CoachText variant="caption" muted style={styles.link}>Annuler</CoachText>
                </PressableSpring>
              </View>
            ) : null}

            {aiResult ? (
              <View style={[styles.aiForm, { borderColor: tokens.accent, backgroundColor: tokens.surface }]}>
                <CoachText variant="section" style={{ color: tokens.foreground }}>
                  Séance générée par l'IA
                </CoachText>
                {aiResult.map((phase, i) => (
                  <View key={`${phase.name}-${i}`} style={{ marginTop: spacing.sm }}>
                    <CoachText variant="caption" accent style={{ fontWeight: '800' }}>
                      {phase.label || phaseLabel(phase.name)} · {phase.duration_min} min
                    </CoachText>
                    {phase.exercises.map((ex, j) => (
                      <View key={`ex-${i}-${j}`} style={{ marginTop: spacing.xs }}>
                        <CoachText variant="caption" style={{ fontWeight: '700', color: tokens.foreground }}>
                          {ex.name}
                        </CoachText>
                        <CoachText variant="caption" muted>{ex.description}</CoachText>
                        {ex.duration_min ? (
                          <CoachText variant="caption" muted>
                            {ex.duration_min} min
                            {ex.reps ? ` · ${ex.reps} reps` : ''}
                            {ex.sets ? ` × ${ex.sets} séries` : ''}
                            {ex.rest_sec ? ` · ${ex.rest_sec}s repos` : ''}
                          </CoachText>
                        ) : null}
                        {ex.equipment?.length ? (
                          <CoachText variant="caption" muted>
                            Matériel : {ex.equipment.join(', ')}
                          </CoachText>
                        ) : null}
                        {ex.tips?.map((tip, k) => (
                          <CoachText key={`tip-${i}-${j}-${k}`} variant="caption" muted>
                            → {tip}
                          </CoachText>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
                <PressableSpring
                  onPress={() => {
                    setAiResult(null);
                    setShowAiForm(false);
                  }}
                  scaleTo={0.96}
                  haptic
                >
                  <CoachText variant="caption" accent style={styles.link}>
                    Fermer
                  </CoachText>
                </PressableSpring>
              </View>
            ) : null}
          </>
        ) : null}

        {canManage && status === 'in_progress' ? (
          <PressableSpring
            onPress={() => {
              Alert.alert(
                t('coach.portal.planning.confirmEndTitle'),
                t('coach.portal.planning.confirmEndTraining'),
                [
                  { text: t('coach.portal.planning.cancel'), style: 'cancel' },
                  { text: t('coach.portal.planning.end'), onPress: () => void endSession() },
                ],
              );
            }}
            scaleTo={0.96}
            haptic
          >
            <CoachText variant="caption" accent style={styles.link}>
              {t('coach.portal.planning.endTraining')}
            </CoachText>
          </PressableSpring>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    centered: { justifyContent: 'center', alignItems: 'center' },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    meta: { paddingHorizontal: spacing.lg, gap: 4, paddingBottom: spacing.sm },
    type: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '600',
      fontSize: 11,
    },
    title: {
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 26,
      letterSpacing: -0.5,
      lineHeight: 30,
    },
    kpiWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    scroll: { flex: 1, minHeight: 0 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.xs,
    },
    label: { fontWeight: '700', marginTop: spacing.sm },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
    },
    multi: { minHeight: 72, textAlignVertical: 'top' },
    link: { fontWeight: '800', marginTop: spacing.xs },
    denied: {
      margin: spacing.lg,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: tokens.surface,
      borderRadius: 18,
    },
    deniedBody: { textAlign: 'center', lineHeight: 22 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
    chip: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    aiCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
    },
    aiForm: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.sm,
      gap: 2,
    },
  });
}

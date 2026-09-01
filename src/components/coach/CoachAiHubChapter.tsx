import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachSectionCard,
  CoachText,
} from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { CoachSeasonStatsPanel } from './CoachSeasonStatsPanel';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import { Icon } from '../ui/Icon';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import {
  filterMembersForTeam,
  teamPlayerUids,
} from '../../utils/coachTeamTheme';
import type { CoachNavItemId } from '../../features/coach/navigation/coachNavConfig';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import type { WellnessSignals } from '../../models/SmartTactics';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import {
  buildCoachAiInsights,
  type CoachAiAction,
  type CoachAiActionId,
} from '../../utils/coachAiInsights';
import {
  listRecentPostMatchAnalyses,
  type PostMatchAnalysis,
} from '../../utils/coachPostMatchAnalysis';
import {
  loadCoachPitchLineup,
  normalizeCoachPitchLineup,
  type CoachPitchLineup,
} from '../../utils/coachPitchLineup';
import {
  buildCoachComposedPlan,
  coachArchetypeLabel,
  defaultRecommendedSessionStart,
  formatRecommendedSessionNotes,
  resolveCoachCalendarContext,
  type CoachComposedPlan,
} from '../../utils/coachTrainingRecommendation';
import { composedPlanFromPrompt } from '../../utils/coachSessionPrompt';
import { teamEventsService } from '../../services/teamEvents.service';
import { membershipsService } from '../../services/memberships.service';
import type { Membership } from '../../models/Membership';
import { clubCamerasService } from '../../services/clubCameras.service';
import type { ClubMatchVideo } from '../../models/ClubCameras';
import {
  countReadyClubVideos,
  listRecentClubVideos,
} from '../../utils/coachVideoInsights';
import {
  resolveClubCoversCoachFromMembers,
  userCanManageConvocations,
} from '../../utils/clubFeatureAccess';
import {
  executeBulkRsvpReminders,
  getPendingConvocationsSummary,
} from '../../utils/coachRsvpReminders';
import { coachHubHeuristicFootnote } from '../../utils/aiUxHonesty';

type Props = CoachChapterCommonProps & {
  /** Afficher le panneau stats saison sous l’hub. */
  showSeasonStats?: boolean;
};

function actionNavTarget(id: CoachAiActionId | string): CoachNavItemId | null {
  switch (id) {
    case 'join-club':
    case 'invite-roster':
      return 'gestion';
    case 'add-match-sheets':
    case 'remind-rsvp':
    case 'plan-session':
      return 'today';
    case 'complete-lineup':
      return 'equipe';
    case 'add-player-notes':
      return 'joueurs';
    case 'add-wellness':
    case 'open-forme':
      return 'forme';
    case 'open-tactics':
    case 'squad-select':
    case 'training-focus':
      return 'smart_tactics';
    case 'carpool-gap':
      return 'carpool';
    default:
      return null;
  }
}

/** Hub IA coach — synthèse honnête, stratégie et actions prioritaires. */
export const CoachAiHubChapter: React.FC<Props> = ({
  profile,
  members,
  events,
  showSeasonStats = true,
}) => {
  const shellNav = useCoachShellNav();
  const { tokens, teamId: activeTeamId } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const clubId = profile.profile.club_id;
  const [wellnessByUid, setWellnessByUid] = useState<Record<string, WellnessSignals>>({});
  const [evaluations, setEvaluations] = useState<CoachPlayerEvaluation[]>([]);
  const [lineup, setLineup] = useState<CoachPitchLineup | null>(null);
  const [clubVideos, setClubVideos] = useState<ClubMatchVideo[]>([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [sessionPrompt, setSessionPrompt] = useState('');
  const [promptPlan, setPromptPlan] = useState<CoachComposedPlan | null>(null);
  const [hubTab, setHubTab] = useState<'sessions' | 'tactics' | 'analysis'>('sessions');

  const teamMembers = useMemo(
    () => filterMembersForTeam(members, memberships, activeTeamId),
    [members, memberships, activeTeamId],
  );
  const teamUids = useMemo(
    () => teamPlayerUids(memberships, activeTeamId),
    [memberships, activeTeamId],
  );
  const rosterUids = useMemo(() => teamMembers.map((m) => m.uid), [teamMembers]);
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = userCanManageConvocations(profile, { clubCoversCoach });
  const [remindingRsvp, setRemindingRsvp] = useState(false);

  const pendingSummary = useMemo(() => getPendingConvocationsSummary(events), [events]);

  const handleBulkReminder = useCallback(async () => {
    if (pendingSummary.totalPendingCount === 0) {
      Alert.alert('Convocations', 'Toutes les convocations sont à jour (aucune réponse en attente).');
      return;
    }
    setRemindingRsvp(true);
    try {
      const res = await executeBulkRsvpReminders(events, { user: profile });
      Alert.alert(
        'Relance groupée envoyée',
        `${res.remindedCount} relance(s) envoyée(s) avec succès pour ${res.eventCount} convocation(s) en attente.`,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    } finally {
      setRemindingRsvp(false);
    }
  }, [pendingSummary.totalPendingCount, events, profile]);

  useEffect(() => {
    if (!clubId) return;
    void wellnessCheckinsService.listLatestForClub(clubId).then(setWellnessByUid).catch(() => {});
    void coachEvaluationsService.listForClub(clubId).then(setEvaluations).catch(() => {});
    void clubCamerasService.listMatchVideos(clubId).then(setClubVideos).catch(() => setClubVideos([]));
    void membershipsService.listByClub(clubId).then(setMemberships).catch(() => setMemberships([]));
  }, [clubId, members.length]);

  useEffect(() => {
    if (!clubId) {
      setLineup(null);
      return;
    }
    void loadCoachPitchLineup(clubId)
      .then((raw) => setLineup(raw ? normalizeCoachPitchLineup(raw, rosterUids) : null))
      .catch(() => setLineup(null));
  }, [clubId, rosterUids.join('|')]);

  const insights = useMemo(
    () =>
      buildCoachAiInsights({
        events,
        members: teamMembers,
        wellnessByUid,
        evaluations,
        lineup,
        hasClub: Boolean(clubId),
      }),
    [events, teamMembers, wellnessByUid, evaluations, lineup, clubId],
  );

  const openNav = useCallback(
    (id: CoachNavItemId) => {
      shellNav?.requestNav(id);
    },
    [shellNav],
  );

  const runAction = useCallback(
    (action: CoachAiAction) => {
      setActionsOpen(false);
      if (action.id === 'remind-rsvp') {
        void handleBulkReminder();
        return;
      }
      const target = actionNavTarget(action.id);
      if (target) openNav(target);
    },
    [openNav, handleBulkReminder],
  );

  const { overview, strategy, actions } = insights;

  const postMatchAnalyses = useMemo(
    () => listRecentPostMatchAnalyses(events, members, 3, clubVideos),
    [events, members, clubVideos],
  );

  const recentVideos = useMemo(() => listRecentClubVideos(clubVideos, 4), [clubVideos]);
  const videoCount = useMemo(() => countReadyClubVideos(clubVideos), [clubVideos]);

  const calendarContext = useMemo(
    () => resolveCoachCalendarContext(events),
    [events],
  );

  const composedPlan = useMemo(
    () =>
      buildCoachComposedPlan({
        events,
        members: teamMembers,
        wellnessByUid,
        evaluations,
        lineup,
        hasClub: Boolean(clubId),
        postMatchAnalysis: postMatchAnalyses[0] ?? null,
      }),
    [events, teamMembers, wellnessByUid, evaluations, lineup, clubId, postMatchAnalyses],
  );

  const activePlan = promptPlan ?? composedPlan;

  const composeFromPrompt = useCallback(() => {
    const text = sessionPrompt.trim();
    if (!text) {
      Alert.alert('Demande', 'Décrivez la séance (ex. « crée une séance bloc bas »).');
      return;
    }
    const nextTraining = calendarContext.nextTraining;
    const plan = composedPlanFromPrompt(text, {
      targetEventId: nextTraining?.id,
      playerCount: teamMembers.length || undefined,
    });
    setPromptPlan(plan);
  }, [sessionPrompt, calendarContext.nextTraining, teamMembers.length]);

  const applyComposedPlan = useCallback(async () => {
    if (!canManage) {
      Alert.alert(
        'Composition IA',
        'La modification du calendrier est réservée au coach Premium (ou couvert par un Tout inclus).',
      );
      return;
    }
    if (!clubId) {
      Alert.alert('Club requis', 'Rattachez un club pour appliquer un plan.');
      return;
    }

    const isMatch = activePlan.context === 'match';
    const targetId = activePlan.targetEventId;
    const targetEvent =
      (targetId ? events.find((e) => e.id === targetId) : null) ??
      (isMatch ? calendarContext.nextMatch : calendarContext.nextTraining);

    if (activePlan.archetype === 'empty') {
      if (isMatch || !calendarContext.nextTraining) {
        openNav('today');
      } else {
        openNav('entrainements');
      }
      return;
    }

    setApplyingPlan(true);
    try {
      if (targetEvent) {
        await teamEventsService.updateSessionPlan(
          targetEvent.id,
          {
            focus: activePlan.focus,
            notes: formatRecommendedSessionNotes(activePlan),
            duration_min: activePlan.totalMinutes || undefined,
          },
          { user: profile },
        );
        Alert.alert(
          isMatch ? 'Match enrichi' : 'Plan appliqué',
          isMatch
            ? `Briefing ajouté à « ${targetEvent.title} ».`
            : `« ${targetEvent.title} » mis à jour avec le plan proposé.`,
        );
        setPromptPlan(null);
        setSessionPrompt('');
        openNav(isMatch ? 'today' : 'entrainements');
        return;
      }

      if (isMatch) {
        Alert.alert(
          'Match requis',
          'Planifiez d’abord une convocation match — la préparation ne crée pas d’entraînement.',
        );
        openNav('today');
        return;
      }

      const startsAt = defaultRecommendedSessionStart();
      const inviteeUids = teamUids.filter((uid) => uid !== profile.uid);
      const eventId = await teamEventsService.create({
        title: activePlan.title,
        description: activePlan.reason,
        event_type: 'training',
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        club_id: clubId,
        team_id: activeTeamId,
        starts_at: startsAt,
        city: profile.city?.trim() || 'Paris',
        invitee_uids: inviteeUids.length > 0 ? inviteeUids : teamMembers.filter((m) => m.uid !== profile.uid).map((m) => m.uid),
        reminder_hours_before: 24,
      });
      await teamEventsService.updateSessionPlan(
        eventId,
        {
          focus: activePlan.focus,
          notes: formatRecommendedSessionNotes(activePlan),
          duration_min: activePlan.totalMinutes,
        },
        { user: profile },
      );
      Alert.alert(
        'Entraînement créé',
        `« ${activePlan.title} » planifié. Retrouvez-le dans Entraînements.`,
      );
      setPromptPlan(null);
      setSessionPrompt('');
      openNav('entrainements');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    } finally {
      setApplyingPlan(false);
    }
  }, [
    canManage,
    clubId,
    activePlan,
    calendarContext,
    events,
    teamMembers,
    teamUids,
    activeTeamId,
    profile,
    openNav,
  ]);

  const QUICK_PROMPTS = [
    { label: '🛡️ Bloc bas 90 min', prompt: 'Crée une séance bloc bas 90 min' },
    { label: '⚡ Pressing haut', prompt: 'Crée une séance pressing haut et récupération 90 min' },
    { label: '🔥 Blood Bath (Cardio)', prompt: 'Crée une séance blood bath haute intensité 75 min' },
    { label: '🎯 Finition & Tirs', prompt: 'Crée une séance finition et face au but 60 min' },
    { label: '🔄 Transitions rapides', prompt: 'Crée une séance transition offensive rapide 90 min' },
  ];

  const handleSelectQuickPrompt = useCallback(
    (promptText: string) => {
      setSessionPrompt(promptText);
      const nextTraining = calendarContext.nextTraining;
      const plan = composedPlanFromPrompt(promptText, {
        targetEventId: nextTraining?.id,
        playerCount: teamMembers.length || undefined,
      });
      setPromptPlan(plan);
      setHubTab('sessions');
    },
    [calendarContext.nextTraining, teamMembers.length],
  );

  return (
    <CoachPane title={getCoachPageIdentity('coach_ia').title}>
      <CoachChapterScroll>
        <View style={styles.stack}>
          {/* Header & Quick Action */}
          <View style={styles.hubHeaderCard}>
            <View style={styles.hubHeaderRow}>
              <View style={styles.hubHeaderIconWrap}>
                <Icon name="star-four-points" size={20} color={tokens.accent} />
              </View>
              <View style={styles.hubHeaderTextWrap}>
                <CoachText variant="section" style={styles.hubHeaderTitle}>
                  Copilote IA Entraîneur
                </CoachText>
                <CoachText variant="caption" muted>
                  Planification de séances, composition et analyses tactiques
                </CoachText>
              </View>
            </View>
            <Pressable style={styles.primaryActionPill} onPress={() => setActionsOpen(true)}>
              <Icon name="star-four-points" size={14} color={tokens.onAccent} />
              <CoachText variant="caption" inverse style={styles.primaryActionPillText}>
                {actions.length > 0 ? `${actions.length} action(s) prioritaire(s)` : 'Actions prioritaires'} →
              </CoachText>
            </Pressable>
          </View>

          {/* Bannière Relance Groupée en 1 clic si convocations en attente */}
          {pendingSummary.totalPendingCount > 0 ? (
            <View style={styles.bulkReminderBanner}>
              <View style={styles.bulkReminderLeft}>
                <Icon name="mail" size={18} color={tokens.accent} />
                <View style={styles.bulkReminderInfo}>
                  <CoachText variant="caption" style={styles.bulkReminderTitle}>
                    {pendingSummary.totalPendingCount} convocation{pendingSummary.totalPendingCount > 1 ? 's' : ''} sans réponse
                  </CoachText>
                  <CoachText variant="caption" muted numberOfLines={1}>
                    {pendingSummary.eventsWithPending.length} événement{pendingSummary.eventsWithPending.length > 1 ? 's' : ''} en attente
                  </CoachText>
                </View>
              </View>
              <Pressable
                style={styles.bulkReminderBtn}
                onPress={() => void handleBulkReminder()}
                disabled={remindingRsvp}
              >
                <CoachText variant="caption" inverse style={styles.bulkReminderBtnText}>
                  {remindingRsvp ? 'Envoi…' : '⚡ Relancer en 1 clic'}
                </CoachText>
              </Pressable>
            </View>
          ) : null}

          {/* Navigation par Onglets Clairs */}
          <View style={styles.hubTabRow}>
            <Pressable
              style={[styles.hubTabItem, hubTab === 'sessions' && styles.hubTabItemActive]}
              onPress={() => setHubTab('sessions')}
            >
              <Icon name="star-four-points" size={14} color={hubTab === 'sessions' ? tokens.accent : tokens.muted} />
              <CoachText variant="caption" style={[styles.hubTabText, hubTab === 'sessions' && styles.hubTabTextActive]}>
                Séances IA
              </CoachText>
            </Pressable>
            <Pressable
              style={[styles.hubTabItem, hubTab === 'tactics' && styles.hubTabItemActive]}
              onPress={() => setHubTab('tactics')}
            >
              <Icon name="tune" size={14} color={hubTab === 'tactics' ? tokens.accent : tokens.muted} />
              <CoachText variant="caption" style={[styles.hubTabText, hubTab === 'tactics' && styles.hubTabTextActive]}>
                Tactique & 11
              </CoachText>
            </Pressable>
            <Pressable
              style={[styles.hubTabItem, hubTab === 'analysis' && styles.hubTabItemActive]}
              onPress={() => setHubTab('analysis')}
            >
              <Icon name="stats-chart" size={14} color={hubTab === 'analysis' ? tokens.accent : tokens.muted} />
              <CoachText variant="caption" style={[styles.hubTabText, hubTab === 'analysis' && styles.hubTabTextActive]}>
                Analyses & Vidéos
              </CoachText>
            </Pressable>
          </View>

          {/* CONTENU ONGLET 1 : SÉANCES IA */}
          {hubTab === 'sessions' ? (
            <>
              <ComposedPlanCard
                plan={activePlan}
                applying={applyingPlan}
                onApply={() => void applyComposedPlan()}
                prompt={sessionPrompt}
                onPromptChange={setSessionPrompt}
                onComposeFromPrompt={composeFromPrompt}
                quickPrompts={QUICK_PROMPTS}
                onSelectQuickPrompt={handleSelectQuickPrompt}
                onClearPromptPlan={
                  promptPlan
                    ? () => {
                        setPromptPlan(null);
                      }
                    : undefined
                }
                fromPrompt={Boolean(promptPlan)}
              />
            </>
          ) : null}

          {/* CONTENU ONGLET 2 : TACTIQUE & 11 TYPE */}
          {hubTab === 'tactics' ? (
            <>
              <CoachSectionCard
                kicker="Stratégie recommandée"
                title={
                  strategy.formation
                    ? `Partir en ${strategy.formation}`
                    : strategy.level === 'none'
                      ? 'Pas assez de données'
                      : 'Pistes tactiques'
                }
                body={
                  strategy.formationDetail ??
                  strategy.emptyHint ??
                  'Basé sur vos feuilles de match, votre composition et la forme déclarée des joueurs.'
                }
              >
                {strategy.playersToStart.length > 0 ? (
                  <View style={styles.listBlock}>
                    <CoachText variant="caption" style={styles.listLabel}>
                      À titulariser (Forme optimale)
                    </CoachText>
                    {strategy.playersToStart.map((p) => (
                      <View key={p.uid} style={styles.playerLine}>
                        <CoachText variant="section" numberOfLines={1} style={styles.playerName}>
                          {p.name}
                        </CoachText>
                        <CoachText variant="caption" muted numberOfLines={2}>
                          {p.reason}
                        </CoachText>
                      </View>
                    ))}
                  </View>
                ) : null}

                {strategy.playersToWatch.length > 0 ? (
                  <View style={styles.listBlock}>
                    <CoachText variant="caption" style={styles.listLabel}>
                      À surveiller (Fatigue / Charge)
                    </CoachText>
                    {strategy.playersToWatch.map((p) => (
                      <View key={p.uid} style={styles.playerLine}>
                        <CoachText variant="section" numberOfLines={1} style={styles.playerName}>
                          {p.name}
                        </CoachText>
                        <CoachText variant="caption" muted numberOfLines={2}>
                          {p.reason}
                        </CoachText>
                      </View>
                    ))}
                  </View>
                ) : null}

                {strategy.matchBrief ? (
                  <View style={styles.focusBox}>
                    <CoachText variant="caption" muted>
                      Brief match
                    </CoachText>
                    <CoachText variant="caption">{strategy.matchBrief}</CoachText>
                  </View>
                ) : null}

                {strategy.trainingFocus ? (
                  <View style={styles.focusBox}>
                    <CoachText variant="caption" muted>
                      Focus entraînement
                    </CoachText>
                    <CoachText variant="caption">{strategy.trainingFocus}</CoachText>
                  </View>
                ) : null}

                <Pressable style={styles.secondaryBtn} onPress={() => openNav('smart_tactics')}>
                  <Icon name="star-four-points" size={14} color={tokens.accent} />
                  <CoachText variant="caption" accent>
                    Ouvrir le Tableau Noir & Tactique IA →
                  </CoachText>
                </Pressable>
              </CoachSectionCard>
            </>
          ) : null}

          {/* CONTENU ONGLET 3 : ANALYSES & VIDÉOS */}
          {hubTab === 'analysis' ? (
            <>
              <CoachSectionCard
                kicker="Vue d’ensemble de l'effectif"
                title={overview.headline}
                body={overview.synthesis}
              >
                <CoachText variant="caption" muted style={{ marginBottom: spacing.sm }}>
                  {coachHubHeuristicFootnote()}
                </CoachText>
                <View style={styles.metricsRow}>
                  {overview.metrics.map((m, index, arr) => (
                    <View
                      key={m.label}
                      style={[styles.metricCell, index < arr.length - 1 && styles.metricBorder]}
                    >
                      <CoachText variant="section" style={styles.metricValue}>
                        {m.value}
                      </CoachText>
                      <CoachText variant="caption" muted numberOfLines={1}>
                        {m.label}
                      </CoachText>
                    </View>
                  ))}
                </View>
              </CoachSectionCard>

              <CoachSectionCard
                kicker="Analyse vidéo"
                title={
                  videoCount > 0
                    ? `${videoCount} captation${videoCount > 1 ? 's' : ''} disponible${videoCount > 1 ? 's' : ''}`
                    : 'Aucune vidéo club'
                }
                body={
                  videoCount > 0
                    ? 'Matchs filmés liés à votre club — ouvrez Mes vidéos pour le détail.'
                    : 'Aucune captation ProDay enregistrée pour votre club. Importez ou connectez une caméra depuis Mes vidéos.'
                }
              >
                {recentVideos.length > 0 ? (
                  <View style={styles.videoList}>
                    {recentVideos.map((v) => (
                      <Pressable
                        key={v.id}
                        style={styles.videoRow}
                        onPress={() => openNav('mes_videos')}
                      >
                        <Icon name="videocam" size={14} color={tokens.accent} />
                        <View style={styles.videoRowBody}>
                          <CoachText variant="caption" style={styles.videoTitle} numberOfLines={1}>
                            {v.title}
                          </CoachText>
                          <CoachText variant="caption" muted>
                            {v.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {v.aiReady ? ' · IA prête' : ''}
                          </CoachText>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <Pressable style={styles.secondaryBtn} onPress={() => openNav('mes_videos')}>
                  <Icon name="videocam" size={14} color={tokens.accent} />
                  <CoachText variant="caption" accent>
                    Ouvrir Mes vidéos →
                  </CoachText>
                </Pressable>
              </CoachSectionCard>

              <CoachSectionCard
                kicker="Après-match"
                title={
                  postMatchAnalyses.length > 0
                    ? `${postMatchAnalyses.length} analyse${postMatchAnalyses.length > 1 ? 's' : ''} récente${postMatchAnalyses.length > 1 ? 's' : ''}`
                    : 'Aucune feuille finalisée'
                }
                body={
                  postMatchAnalyses.length > 0
                    ? 'Synthèse honnête depuis feuilles de match et scores live.'
                    : 'Validez une feuille de match pour générer une analyse post-match.'
                }
              >
                {postMatchAnalyses.length > 0 ? (
                  <View style={styles.postMatchList}>
                    {postMatchAnalyses.map((a) => (
                      <PostMatchCard
                        key={a.eventId}
                        analysis={a}
                        onOpenVideos={() => openNav('mes_videos')}
                      />
                    ))}
                  </View>
                ) : null}
              </CoachSectionCard>

              {showSeasonStats ? (
                <View style={styles.statsBlock}>
                  <CoachText variant="caption" style={styles.statsTitle}>
                    Statistiques saison
                  </CoachText>
                  <CoachSeasonStatsPanel events={events} profile={profile} />
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </CoachChapterScroll>

      <Modal visible={actionsOpen} animationType="slide" transparent onRequestClose={() => setActionsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActionsOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <CoachText variant="section" style={styles.modalTitle}>
              Actions prioritaires
            </CoachText>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {actions.length === 0 ? (
                <CoachEmptyState
                  title="Rien d’urgent"
                  body="Continuez à alimenter le calendrier et les feuilles de match."
                  cta="Fermer"
                  onPress={() => setActionsOpen(false)}
                />
              ) : (
                actions.map((a) => (
                  <Pressable key={a.id} style={styles.actionRow} onPress={() => runAction(a)}>
                    <CoachText variant="section" style={styles.actionTitle}>
                      {a.title}
                    </CoachText>
                    <CoachText variant="caption" muted>
                      {a.detail}
                    </CoachText>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Pressable style={styles.modalClose} onPress={() => setActionsOpen(false)}>
              <CoachText variant="caption" accent>
                Fermer
              </CoachText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </CoachPane>
  );
};

function ComposedPlanCard({
  plan,
  applying,
  onApply,
  prompt,
  onPromptChange,
  onComposeFromPrompt,
  onClearPromptPlan,
  quickPrompts,
  onSelectQuickPrompt,
  fromPrompt,
}: {
  plan: CoachComposedPlan;
  applying: boolean;
  onApply: () => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  onComposeFromPrompt: () => void;
  onClearPromptPlan?: () => void;
  quickPrompts?: { label: string; prompt: string }[];
  onSelectQuickPrompt?: (prompt: string) => void;
  fromPrompt?: boolean;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const isMatch = plan.context === 'match';
  const isEmpty = plan.archetype === 'empty';
  const confidenceLabel =
    plan.dataConfidence === 'high'
      ? 'Données fiables'
      : plan.dataConfidence === 'low'
        ? 'Données partielles'
        : fromPrompt
          ? 'Brouillon généré depuis votre demande'
          : 'Modèle tactique ProDay';

  const ctaLabel = isEmpty
    ? plan.context === 'match'
      ? 'Planifier un match'
      : 'Planifier un entraînement'
    : isMatch
      ? 'Enrichir le match'
      : plan.targetEventId
        ? 'Appliquer au calendrier'
        : 'Créer l’entraînement';

  return (
    <CoachSectionCard
      kicker={isMatch ? 'Match' : 'Entraînement'}
      title={plan.title}
      body={plan.reason}
    >
      <CoachText variant="caption" muted style={styles.label}>
        Suggestions rapides en 1 clic
      </CoachText>
      {quickPrompts && quickPrompts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {quickPrompts.map((q) => (
            <Pressable
              key={q.label}
              style={[styles.promptChip, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
              onPress={() => onSelectQuickPrompt?.(q.prompt)}
            >
              <CoachText variant="caption" style={styles.promptChipText}>
                {q.label}
              </CoachText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <CoachText variant="caption" muted style={styles.label}>
        Ou saisissez votre consigne libre
      </CoachText>
      <TextInput
        style={[
          styles.promptInput,
          { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface },
        ]}
        value={prompt}
        onChangeText={onPromptChange}
        placeholder="Ex. crée une séance bloc bas 90 min, pressing haut, blood bath…"
        placeholderTextColor={tokens.muted}
        multiline
      />
      <View style={styles.promptActions}>
        <Pressable style={[styles.secondaryBtn, styles.promptComposeBtn]} onPress={onComposeFromPrompt}>
          <Icon name="star-four-points" size={14} color={tokens.accent} />
          <CoachText variant="caption" accent>
            Générer la séance →
          </CoachText>
        </Pressable>
        {onClearPromptPlan ? (
          <Pressable onPress={onClearPromptPlan}>
            <CoachText variant="caption" muted>
              Réinitialiser
            </CoachText>
          </Pressable>
        ) : null}
      </View>

      {!isEmpty ? (
        <>
          <View style={styles.sessionMeta}>
            <CoachText variant="caption" muted>
              {isMatch ? 'Préparation' : 'Archétype'} · {coachArchetypeLabel(plan)}
            </CoachText>
            <CoachText variant="caption" muted>
              Focus · {plan.focus}
            </CoachText>
            <CoachText variant="caption" muted>
              {confidenceLabel}
              {plan.playerCount != null ? ` · ${plan.playerCount} joueurs` : ''}
              {plan.totalMinutes > 0 ? ` · ${plan.totalMinutes} min · ${plan.difficulty}` : ''}
            </CoachText>
          </View>
          <View style={styles.sessionBlocks}>
            {plan.blocks.map((block) => (
              <View key={block.label} style={styles.sessionBlockRow}>
                {block.minutes > 0 ? (
                  <CoachText variant="section" style={styles.sessionBlockMin}>
                    {block.minutes}'
                  </CoachText>
                ) : null}
                <View style={styles.sessionBlockBody}>
                  <CoachText variant="caption" style={styles.sessionBlockLabel}>
                    {block.label}
                  </CoachText>
                  {block.objective ? (
                    <CoachText variant="caption" muted numberOfLines={2}>
                      {block.objective}
                    </CoachText>
                  ) : null}
                  {block.material && block.material !== '—' ? (
                    <CoachText variant="caption" muted style={styles.sessionMaterial}>
                      Matériel : {block.material}
                    </CoachText>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
      <Pressable
        style={[styles.primaryBtn, styles.sessionCreateBtn, applying && styles.sessionCreateDisabled]}
        onPress={onApply}
        disabled={applying}
      >
        {applying ? (
          <ActivityIndicator color={tokens.onAccent} size="small" />
        ) : (
          <Icon name={isMatch ? 'football' : 'calendar'} size={18} color={tokens.onAccent} />
        )}
        <CoachText variant="section" inverse style={styles.primaryBtnText}>
          {applying ? 'Application…' : ctaLabel}
        </CoachText>
      </Pressable>
    </CoachSectionCard>
  );
}

function PostMatchCard({
  analysis,
  onOpenVideos,
}: {
  analysis: PostMatchAnalysis;
  onOpenVideos?: () => void;
}) {
  const styles = useCoachThemedStyles(createStyles);
  const dateStr = analysis.date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  return (
    <View style={styles.postMatchCard}>
      <View style={styles.postMatchHead}>
        <CoachText variant="section" numberOfLines={1} style={styles.postMatchTitle}>
          {analysis.title}
        </CoachText>
        <CoachText variant="caption" muted>
          {dateStr}
          {analysis.scoreLabel ? ` · ${analysis.scoreLabel}` : ''}
        </CoachText>
      </View>
      {analysis.positives.length > 0 ? (
        <View style={styles.postMatchBlock}>
          <CoachText variant="caption" style={styles.postMatchLabel}>
            Points positifs
          </CoachText>
          {analysis.positives.map((p) => (
            <CoachText key={p} variant="caption" muted>
              + {p}
            </CoachText>
          ))}
        </View>
      ) : null}
      {analysis.improvements.length > 0 ? (
        <View style={styles.postMatchBlock}>
          <CoachText variant="caption" style={styles.postMatchLabelWarn}>
            À améliorer
          </CoachText>
          {analysis.improvements.map((p) => (
            <CoachText key={p} variant="caption" muted>
              → {p}
            </CoachText>
          ))}
        </View>
      ) : null}
      {analysis.mvp ? (
        <CoachText variant="caption" style={styles.mvpLine}>
          ⭐ {analysis.mvp.name} — {analysis.mvp.reason}
        </CoachText>
      ) : null}
      <CoachText variant="caption" muted style={styles.recLine}>
        Prochain match : {analysis.nextMatchRecommendation}
      </CoachText>
      {analysis.hasVideos && analysis.videos.length > 0 ? (
        <View style={styles.postMatchBlock}>
          <CoachText variant="caption" style={styles.postMatchLabel}>
            Analyse vidéo disponible
          </CoachText>
          {analysis.videos.map((v) => (
            <Pressable key={v.id} onPress={onOpenVideos} style={styles.videoLinkRow}>
              <CoachText variant="caption" accent numberOfLines={1}>
                {v.title}
              </CoachText>
              <CoachText variant="caption" muted>
                {v.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </CoachText>
            </Pressable>
          ))}
        </View>
      ) : (
        <CoachText variant="caption" muted style={styles.videoNote}>
          {analysis.videoNote}
        </CoachText>
      )}
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    stack: { gap: spacing.md, paddingBottom: spacing.xl },
    hubHeaderCard: {
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
    },
    hubHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    hubHeaderIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hubHeaderTextWrap: {
      flex: 1,
      gap: 2,
    },
    hubHeaderTitle: {
      fontWeight: '800',
      fontSize: 16,
      color: tokens.foreground,
    },
    primaryActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: tokens.accent,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
    },
    primaryActionPillText: {
      fontWeight: '700',
      fontSize: 13,
      color: tokens.onAccent,
    },
    hubTabRow: {
      flexDirection: 'row',
      backgroundColor: tokens.surface,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 4,
    },
    hubTabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
    },
    hubTabItemActive: {
      backgroundColor: tokens.elevated,
    },
    hubTabText: {
      fontWeight: '600',
      fontSize: 12,
      color: tokens.muted,
    },
    hubTabTextActive: {
      fontWeight: '800',
      color: tokens.foreground,
    },
    chipsScroll: {
      gap: 8,
      paddingVertical: 6,
    },
    promptChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    promptChipText: {
      fontWeight: '700',
      fontSize: 12,
      color: tokens.foreground,
    },
    metricsRow: {
      flexDirection: 'row',
      marginTop: spacing.sm,
      borderRadius: 12,
      backgroundColor: tokens.elevated,
      overflow: 'hidden',
    },
    metricCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: 4,
    },
    metricBorder: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: tokens.border,
    },
    metricValue: { fontWeight: '800', fontSize: 18 },
    ctaLink: { marginTop: spacing.sm },
    listBlock: { marginTop: spacing.sm, gap: spacing.xs },
    listLabel: {
      color: tokens.accent,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    playerLine: {
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    playerName: { fontWeight: '700', marginBottom: 2 },
    focusBox: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderRadius: 10,
      backgroundColor: tokens.elevated,
      gap: 4,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    label: {
      marginTop: spacing.xs,
      marginBottom: 4,
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    promptInput: {
      minHeight: 64,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      textAlignVertical: 'top',
      fontSize: 14,
    },
    promptActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    promptComposeBtn: { marginTop: 0 },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: tokens.accent,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: spacing.lg,
    },
    primaryBtnText: { fontWeight: '800', color: tokens.onAccent },
    sessionMeta: { marginTop: spacing.sm, gap: 4 },
    sessionBlocks: { marginTop: spacing.sm, gap: spacing.xs },
    sessionBlockRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    sessionBlockMin: { fontWeight: '800', width: 36, color: tokens.accent },
    sessionBlockBody: { flex: 1, gap: 2 },
    sessionBlockLabel: { fontWeight: '700' },
    sessionMaterial: { fontSize: 10, fontStyle: 'italic' },
    sessionCreateBtn: { marginTop: spacing.md },
    sessionCreateDisabled: { opacity: 0.7 },
    previewActions: { gap: spacing.xs },
    previewRow: {
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    previewTitle: { fontWeight: '700', marginBottom: 4 },
    postMatchList: { marginTop: spacing.sm, gap: spacing.sm },
    postMatchCard: {
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: tokens.elevated,
      gap: spacing.xs,
    },
    postMatchHead: { gap: 2, marginBottom: spacing.xs },
    postMatchTitle: { fontWeight: '700' },
    postMatchBlock: { gap: 2 },
    postMatchLabel: {
      color: tokens.accent,
      fontWeight: '700',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    postMatchLabelWarn: {
      color: '#F59E0B',
      fontWeight: '700',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    mvpLine: { fontWeight: '700', marginTop: spacing.xs },
    recLine: { marginTop: spacing.xs, lineHeight: 17 },
    videoNote: { fontSize: 10, fontStyle: 'italic', marginTop: 4 },
    videoList: { marginTop: spacing.sm, gap: spacing.xs },
    videoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    videoRowBody: { flex: 1, gap: 2 },
    videoTitle: { fontWeight: '700' },
    videoLinkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: 2,
    },
    statsBlock: { gap: spacing.sm, marginTop: spacing.sm },
    statsTitle: {
      color: tokens.muted,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: tokens.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      maxHeight: '72%',
    },
    modalTitle: { fontWeight: '800', marginBottom: spacing.md },
    modalScroll: { maxHeight: 360 },
    actionRow: {
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    actionTitle: { fontWeight: '700', marginBottom: 4 },
    modalClose: { alignItems: 'center', paddingTop: spacing.md },
    bulkReminderBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.accent,
      borderRadius: 14,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    bulkReminderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bulkReminderInfo: { flex: 1, gap: 2 },
    bulkReminderTitle: { fontWeight: '800', color: tokens.foreground },
    bulkReminderBtn: {
      backgroundColor: tokens.accent,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
    },
    bulkReminderBtnText: {
      fontWeight: '700',
      color: tokens.onAccent,
      fontSize: 12,
    },
  });
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
} from './coachPortalUi';
import {
  CoachTrainingDrillDiagram,
  inferDrillType,
} from './CoachTrainingDrillDiagram';
import { CoachText } from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import {
  getPendingInviteeUids,
  isCoachDetectionEvent,
  isCoachEventHubReady,
  isCoachMatchEvent,
  isCoachMeetingEvent,
  isCoachPlanningRelevant,
  isCoachTrainingEvent,
  resolveEventSessionStatus,
  type EventSessionStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import {
  executeBulkRsvpReminders,
  getPendingConvocationsSummary,
} from '../../utils/coachRsvpReminders';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { teamEventsService } from '../../services/teamEvents.service';
import { membershipsService } from '../../services/memberships.service';
import type { Membership } from '../../models/Membership';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import {
  filterMembersForTeam,
  filterTrainingsForTeam,
  teamPlayerUids,
} from '../../utils/coachTeamTheme';
import { FederationSyncDrawer } from './FederationSyncDrawer';
import { federationService } from '../../services/federation.service';
import { CoachTeamSwitcher } from './CoachTeamSwitcher';
import { TrainingRosterPreview } from './CoachTrainingTeamRoster';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { radius, spacing } from '../../theme/designTokens';
import { composedPlanFromPrompt } from '../../utils/coachSessionPrompt';
import type { CoachComposedPlan } from '../../utils/coachTrainingRecommendation';
import { aiTrainingService } from '../../services/aiTraining.service';

type TrainingFilter = 'all' | 'upcoming' | 'past';

const AI_PRESET_CHIPS: { label: string; prompt: string; icon: IconName }[] = [
  { label: 'Blood Bath (Intensité Max)', prompt: 'Blood Bath haute intensité, endurance et dépassement', icon: 'star-four-points' },
  { label: 'Bloc bas & Contre', prompt: 'Séance bloc bas compacité et projection rapide en contre', icon: 'shield' },
  { label: 'Pressing & Triggers', prompt: 'Pressing haut coordonné et récupération immédiate', icon: 'trophy' },
  { label: 'Finition & Tirs', prompt: 'Finition face au but, centres et combinaisons offensives', icon: 'football' },
  { label: 'Possession & Rondo', prompt: 'Conservation de balle, rondo et jeu de position sous pression', icon: 'refresh' },
  { label: 'Coups de pied arrêtés', prompt: 'Corners, coups francs offensifs et placement défensif', icon: 'star' },
  { label: 'Duels & 1v1', prompt: 'Duels 1 contre 1, puissance athlétique et protection du ballon', icon: 'people' },
  { label: 'Récupération active', prompt: 'Séance de décrassage, mobilité articulaire et étirements', icon: 'heart' },
];

function isPlanningVisible(event: TeamEvent): boolean {
  if (!isCoachPlanningRelevant(event)) return false;
  const status = resolveEventSessionStatus(event);
  if (status === 'in_progress') return true;
  if (status === 'finished') return false;
  return event.starts_at.getTime() > Date.now() - 6 * 3600_000;
}

export const CoachPlanningChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const shellNav = useCoachShellNav();
  const { tokens, teamId: activeTeamId } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = userCanManageConvocations(profile, { clubCoversCoach });
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [remindingRsvp, setRemindingRsvp] = useState(false);
  const [syncDrawerVisible, setSyncDrawerVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [syncedTeamName, setSyncedTeamName] = useState('');

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDuration, setAiDuration] = useState<number>(90);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<CoachComposedPlan | null>(null);

  // Manual Modal State
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualFocus, setManualFocus] = useState('');
  const [manualDuration, setManualDuration] = useState('90');
  const [manualCity, setManualCity] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  // Filter State
  const [filter, setFilter] = useState<TrainingFilter>('all');

  const clubId = profile.profile.club_id;
  const teamMembers = useMemo(
    () => filterMembersForTeam(members, memberships, activeTeamId),
    [members, memberships, activeTeamId],
  );
  const teamUids = useMemo(
    () => teamPlayerUids(memberships, activeTeamId),
    [memberships, activeTeamId],
  );

  useEffect(() => {
    if (!clubId) return;
    void membershipsService.listByClub(clubId).then(setMemberships).catch(() => setMemberships([]));
  }, [clubId, members.length]);

  const allTrainings = useMemo(() => {
    const visible = [...events].filter(isCoachTrainingEvent);
    return filterTrainingsForTeam(visible, activeTeamId, teamUids).sort(
      (a, b) => a.starts_at.getTime() - b.starts_at.getTime(),
    );
  }, [events, activeTeamId, teamUids]);

  const upcomingTrainings = useMemo(() => {
    const now = Date.now();
    return allTrainings.filter((e) => e.starts_at.getTime() > now);
  }, [allTrainings]);

  const pastTrainings = useMemo(() => {
    const now = Date.now();
    return allTrainings
      .filter((e) => e.starts_at.getTime() <= now)
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
  }, [allTrainings]);

  const filteredTrainings = useMemo(() => {
    if (filter === 'upcoming') return upcomingTrainings;
    if (filter === 'past') return pastTrainings;
    return allTrainings;
  }, [filter, allTrainings, upcomingTrainings, pastTrainings]);

  const pendingSummary = useMemo(() => getPendingConvocationsSummary(events), [events]);

  const handleBulkReminder = async () => {
    if (pendingSummary.totalPendingCount === 0) {
      Alert.alert('Convocations', 'Toutes les convocations sont à jour.');
      return;
    }
    setRemindingRsvp(true);
    try {
      const res = await executeBulkRsvpReminders(events, { user: profile });
      Alert.alert(
        'Relance groupée envoyée',
        `${res.remindedCount} relance(s) envoyée(s) pour ${res.eventCount} convocation(s) en attente.`,
      );
      onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    } finally {
      setRemindingRsvp(false);
    }
  };

  const handleEventReminder = async (event: TeamEvent) => {
    const pendingUids = getPendingInviteeUids(event);
    if (pendingUids.length === 0) {
      Alert.alert('Convocation', 'Tous les joueurs convoqués ont répondu.');
      return;
    }
    try {
      const res = await teamEventsService.sendRsvpReminders(event.id, { user: profile });
      Alert.alert(
        'Relance envoyée',
        `${res.remindedCount} relance(s) envoyée(s) pour « ${event.title} ».`,
      );
      onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    }
  };

  const handleGenerateAi = async (customPrompt?: string) => {
    const text = (customPrompt ?? aiPrompt).trim();
    if (!text) {
      Alert.alert('Thème requis', 'Indiquez le thème de la séance ou choisissez une suggestion.');
      return;
    }
    if (customPrompt) setAiPrompt(customPrompt);
    setAiLoading(true);

    try {
      if (clubId) {
        try {
          const res = await aiTrainingService.generateCollective({
            club_id: clubId,
            team_id: activeTeamId,
            objective: 'technique',
            duration_min: aiDuration,
            level: 'intermediate',
            player_count: teamMembers.length || 18,
            coach_notes: text,
          });
          if (res?.phases && res.phases.length > 0) {
            setGeneratedPlan({
              context: 'training',
              archetype: 'collective',
              title: res.objective || `Séance ${text}`,
              focus: text,
              reason: `${res.duration_min} min • ${res.phases.length} phases générées avec le Copilote IA`,
              totalMinutes: res.duration_min,
              blocks: res.phases.map((p) => ({
                label: p.label || p.name,
                minutes: p.duration_min,
                objective: p.exercises.map((e) => e.name).join(', ') || p.label,
                material: p.exercises.flatMap((e) => e.equipment || []).join(', ') || 'Cônes, ballons, chasubles',
              })),
              difficulty: 'moyen',
              dataConfidence: 'none',
            });
            setAiLoading(false);
            return;
          }
        } catch {
          // fallback local engine
        }
      }

      const localPlan = composedPlanFromPrompt(text, {
        playerCount: teamMembers.length || 18,
      });
      setGeneratedPlan(localPlan);
    } catch {
      const fallback = composedPlanFromPrompt(text);
      setGeneratedPlan(fallback);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiPlan = async () => {
    if (!generatedPlan) return;
    setAiLoading(true);
    try {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + 1);
      startsAt.setHours(18, 30, 0, 0);

      const endsAt = new Date(startsAt.getTime() + (generatedPlan.totalMinutes || 90) * 60_000);
      const targetClubId = clubId || 'club_default';
      const invitees = teamMembers.length > 0 ? teamMembers.map((m) => m.uid) : members.map((m) => m.uid);

      await teamEventsService.create({
        title: generatedPlan.title,
        description: `${generatedPlan.reason}\n\nFocus : ${generatedPlan.focus}\nDurée : ${generatedPlan.totalMinutes} min\n\nPhases :\n${generatedPlan.blocks.map((b) => `• ${b.label} (${b.minutes} min) : ${b.objective}`).join('\n')}`,
        event_type: 'training',
        organizer_uid: profile.uid,
        organizer_name: profile.display_name || 'Coach',
        team_id: activeTeamId,
        club_id: targetClubId,
        starts_at: startsAt,
        ends_at: endsAt,
        city: profile.city || 'Terrain d’entraînement',
        invitee_uids: invitees,
      });

      Alert.alert('Séance Planifiée', `« ${generatedPlan.title} » a été ajoutée au planning.`);
      setGeneratedPlan(null);
      setAiPrompt('');
      onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de planifier la séance.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateManual = async () => {
    if (!manualTitle.trim()) {
      Alert.alert('Titre requis', 'Veuillez renseigner un titre pour la séance.');
      return;
    }
    setManualSaving(true);
    try {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + 1);
      startsAt.setHours(18, 30, 0, 0);

      const duration = parseInt(manualDuration, 10) || 90;
      const endsAt = new Date(startsAt.getTime() + duration * 60_000);
      const targetClubId = clubId || 'club_default';
      const invitees = teamMembers.length > 0 ? teamMembers.map((m) => m.uid) : members.map((m) => m.uid);

      await teamEventsService.create({
        title: manualTitle.trim(),
        description: `Séance manuelle : ${manualFocus.trim() || 'Entraînement'}`,
        event_type: 'training',
        organizer_uid: profile.uid,
        organizer_name: profile.display_name || 'Coach',
        team_id: activeTeamId,
        club_id: targetClubId,
        starts_at: startsAt,
        ends_at: endsAt,
        city: manualCity.trim() || profile.city || 'Terrain Principal',
        invitee_uids: invitees,
      });

      Alert.alert('Séance Créée', `« ${manualTitle.trim()} » a été ajoutée au planning.`);
      setManualModalVisible(false);
      setManualTitle('');
      setManualFocus('');
      onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de créer la séance.');
    } finally {
      setManualSaving(false);
    }
  };

  const confirmDelete = (event: TeamEvent) => {
    Alert.alert(
      'Supprimer la séance',
      `Confirmez-vous la suppression de « ${event.title} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamEventsService.deleteEvent(event.id, { user: profile });
              onRefresh();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible.');
            }
          },
        },
      ],
    );
  };

  const openEventHub = (event: TeamEvent) => {
    if (!isCoachEventHubReady(event)) return;
    tabNav.openMatchs({
      eventId: event.id,
      hubChapter: isCoachMatchEvent(event) ? 'apercu' : undefined,
    });
  };

  return (
    <CoachPane title={getCoachPageIdentity('entrainements').title}>
      <CoachChapterScroll>
        {/* Équipe active & En-tête */}
        <View style={styles.topRow}>
          <CoachTeamSwitcher />
          <PressableSpring
            style={styles.manualAddBtn}
            onPress={() => setManualModalVisible(true)}
            scaleTo={0.96}
            haptic
          >
            <Icon name="add" size={16} color={tokens.foreground} />
            <ProDayText variant="caption" style={[styles.manualAddBtnText, { color: tokens.foreground }]}>
              Création manuelle
            </ProDayText>
          </PressableSpring>
        </View>

        {/* 1. COPILOTE ENTRAÎNEMENT IA (CENTERPIECE HERO) */}
        <View style={styles.aiStudioCard}>
          <View style={styles.aiStudioHead}>
            <View style={styles.aiStudioBadge}>
              <Icon name="star-four-points" size={13} color="#8B5CF6" />
              <ProDayText variant="caption" style={styles.aiStudioBadgeText}>
                COPILOTE ENTRAÎNEMENT IA
              </ProDayText>
            </View>
            <ProDayText variant="caption" style={styles.aiStudioSubHead}>
              {teamMembers.length || 18} joueurs ciblés
            </ProDayText>
          </View>

          <ProDayText variant="title" style={styles.aiStudioTitle}>
            Générer une séance d'entraînement
          </ProDayText>
          <ProDayText variant="caption" style={styles.aiStudioDesc}>
            Décrivez votre objectif ou choisissez un thème préconçu. L'IA structure les exercices, durées et ateliers.
          </ProDayText>

          {/* Saisie libre de l'objectif */}
          <View style={styles.aiInputWrap}>
            <TextInput
              style={[styles.aiInput, { color: '#FFFFFF' }]}
              placeholder="Ex : Séance bloc bas, compacité et transitions rapides..."
              placeholderTextColor="#6B6B7F"
              value={aiPrompt}
              onChangeText={setAiPrompt}
              onSubmitEditing={() => void handleGenerateAi()}
              returnKeyType="go"
            />
            <PressableSpring
              style={[styles.aiSubmitBtn, { backgroundColor: tokens.accent }]}
              onPress={() => void handleGenerateAi()}
              disabled={aiLoading}
              scaleTo={0.95}
              haptic
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Icon name="star-four-points" size={17} color="#000000" />
              )}
            </PressableSpring>
          </View>

          {/* Durées rapides */}
          <View style={styles.durationRow}>
            <ProDayText variant="caption" style={styles.durationLabel}>
              Durée :
            </ProDayText>
            {[45, 60, 75, 90, 120].map((mins) => (
              <PressableSpring
                key={mins}
                style={[
                  styles.durationPill,
                  aiDuration === mins && { backgroundColor: `${tokens.accent}25`, borderColor: tokens.accent },
                ]}
                onPress={() => setAiDuration(mins)}
                scaleTo={0.95}
              >
                <ProDayText
                  variant="caption"
                  style={[
                    styles.durationPillText,
                    aiDuration === mins && { color: tokens.accent, fontWeight: '800' },
                  ]}
                >
                  {mins} min
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          {/* Thèmes rapides IA */}
          <View style={styles.presetsWrap}>
            <ProDayText variant="caption" style={styles.presetsLabel}>
              Thèmes tactiques & physiques :
            </ProDayText>
            <View style={styles.presetsGrid}>
              {AI_PRESET_CHIPS.map((chip) => (
                <PressableSpring
                  key={chip.label}
                  style={styles.presetChip}
                  onPress={() => void handleGenerateAi(chip.prompt)}
                  scaleTo={0.96}
                  haptic
                >
                  <Icon name={chip.icon} size={12} color={tokens.accent} />
                  <ProDayText variant="caption" style={styles.presetChipText} numberOfLines={1}>
                    {chip.label}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>

          {/* SÉANCE GÉNÉRÉE (PREVIEW & VALIDATION) */}
          {generatedPlan ? (
            <View style={styles.generatedResultCard}>
              <View style={styles.generatedHead}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="title" style={styles.generatedTitle}>
                    {generatedPlan.title}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.generatedSub}>
                    {generatedPlan.reason}
                  </ProDayText>
                </View>
                <PressableSpring
                  style={styles.generatedCloseBtn}
                  onPress={() => setGeneratedPlan(null)}
                  scaleTo={0.92}
                >
                  <Icon name="close" size={16} color="#8B8B9A" />
                </PressableSpring>
              </View>

              <View style={styles.phasesList}>
                {generatedPlan.blocks.map((block, idx) => (
                  <View key={idx} style={styles.phaseItem}>
                    <View style={styles.phaseBadge}>
                      <ProDayText variant="caption" style={styles.phaseBadgeText}>
                        {block.minutes} min
                      </ProDayText>
                    </View>
                    <View style={styles.phaseInfo}>
                      <ProDayText variant="section" style={styles.phaseTitle}>
                        {block.label}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.phaseDesc}>
                        {block.objective}
                      </ProDayText>
                      {/* Visual Tactical Exercise Board for training phase */}
                      <CoachTrainingDrillDiagram
                        drillType={inferDrillType(block.label, block.objective)}
                        title={block.label}
                        width={280}
                        height={150}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <PressableSpring
                style={[styles.applyPlanBtn, { backgroundColor: tokens.accent }]}
                onPress={() => void handleApplyAiPlan()}
                disabled={aiLoading}
                scaleTo={0.97}
                haptic
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Icon name="calendar" size={16} color="#000000" />
                    <ProDayText variant="section" style={styles.applyPlanBtnText}>
                      Valider et planifier la séance
                    </ProDayText>
                  </>
                )}
              </PressableSpring>
            </View>
          ) : null}
        </View>

        {/* 2. RELANCES GROUPÉES & SYNCHRO FÉDÉRATION */}
        {pendingSummary.totalPendingCount > 0 ? (
          <View style={[styles.bulkReminderBanner, { backgroundColor: '#14141A', borderColor: '#22222E' }]}>
            <View style={styles.bulkReminderInfo}>
              <Icon name="mail" size={18} color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <ProDayText variant="section" style={styles.bulkReminderTitle}>
                  {pendingSummary.totalPendingCount} convocation{pendingSummary.totalPendingCount > 1 ? 's' : ''} en attente
                </ProDayText>
                <ProDayText variant="caption" style={{ color: '#8B8B9A' }}>
                  {pendingSummary.eventsWithPending.length} séance{pendingSummary.eventsWithPending.length > 1 ? 's' : ''} à confirmer
                </ProDayText>
              </View>
            </View>
            <PressableSpring
              onPress={() => void handleBulkReminder()}
              scaleTo={0.96}
              haptic
              style={[styles.bulkReminderBtn, { backgroundColor: tokens.accent }]}
            >
              <ProDayText variant="caption" style={styles.bulkReminderBtnText}>
                {remindingRsvp ? 'Envoi…' : 'Relance groupée'}
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        {/* 3. CALENDRIER & SÉANCES PROGRAMMÉES */}
        <View style={styles.calendarSectionHeader}>
          <ProDayText variant="section" style={styles.calendarSectionTitle}>
            Planning des entraînements
          </ProDayText>

          <View style={styles.filterPillsRow}>
            <PressableSpring
              style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
              onPress={() => setFilter('all')}
              scaleTo={0.95}
            >
              <ProDayText
                variant="caption"
                style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}
              >
                Toutes ({allTrainings.length})
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              style={[styles.filterPill, filter === 'upcoming' && styles.filterPillActive]}
              onPress={() => setFilter('upcoming')}
              scaleTo={0.95}
            >
              <ProDayText
                variant="caption"
                style={[styles.filterPillText, filter === 'upcoming' && styles.filterPillTextActive]}
              >
                À venir ({upcomingTrainings.length})
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              style={[styles.filterPill, filter === 'past' && styles.filterPillActive]}
              onPress={() => setFilter('past')}
              scaleTo={0.95}
            >
              <ProDayText
                variant="caption"
                style={[styles.filterPillText, filter === 'past' && styles.filterPillTextActive]}
              >
                Terminées ({pastTrainings.length})
              </ProDayText>
            </PressableSpring>
          </View>
        </View>

        {filteredTrainings.length === 0 ? (
          <CoachEmptyState
            title="Aucun entraînement programmé"
            body="Générez votre première séance avec le Copilote IA ou créez-en une manuellement."
            cta="Créer une séance"
            onPress={() => setManualModalVisible(true)}
          />
        ) : (
          <View style={styles.trainingsList}>
            {filteredTrainings.map((event) => {
              const ready = isCoachEventHubReady(event);
              const pendingUids = getPendingInviteeUids(event);
              const isPast = event.starts_at.getTime() <= Date.now();

              return (
                <View key={event.id} style={styles.trainingCard}>
                  <PressableSpring
                    onPress={() => (ready ? openEventHub(event) : undefined)}
                    scaleTo={0.98}
                    haptic={ready}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleCol}>
                        <View style={styles.cardTagRow}>
                          <View style={styles.trainingTag}>
                            <Icon name="football" size={11} color={tokens.accent} />
                            <ProDayText variant="caption" style={styles.trainingTagText}>
                              ENTRAÎNEMENT
                            </ProDayText>
                          </View>
                          {event.session_plan?.duration_min ? (
                            <View style={styles.durationBadge}>
                              <Icon name="time" size={10} color="#8B8B9A" />
                              <ProDayText variant="caption" style={styles.durationBadgeText}>
                                {event.session_plan.duration_min} min
                              </ProDayText>
                            </View>
                          ) : null}
                        </View>

                        <ProDayText variant="section" style={styles.cardTitle}>
                          {event.title}
                        </ProDayText>
                      </View>

                      {canManage ? (
                        <PressableSpring
                          onPress={() => confirmDelete(event)}
                          scaleTo={0.92}
                          style={styles.deleteBtn}
                        >
                          <Icon name="trash" size={15} color="#EF4444" />
                        </PressableSpring>
                      ) : null}
                    </View>

                    <View style={styles.cardMetaRow}>
                      <Icon name="calendar" size={13} color="#8B8B9A" />
                      <ProDayText variant="caption" style={styles.cardMetaText}>
                        {formatCalendarDate(event.starts_at)}
                      </ProDayText>
                      {event.city ? (
                        <>
                          <ProDayText variant="caption" style={{ color: '#4B4B5F' }}>·</ProDayText>
                          <Icon name="location" size={13} color="#8B8B9A" />
                          <ProDayText variant="caption" style={styles.cardMetaText}>
                            {event.city}
                          </ProDayText>
                        </>
                      ) : null}
                    </View>

                    {event.session_plan?.focus ? (
                      <View style={styles.focusPill}>
                        <Icon name="star-four-points" size={11} color="#A78BFA" />
                        <ProDayText variant="caption" style={styles.focusPillText}>
                          Thème : {event.session_plan.focus}
                        </ProDayText>
                      </View>
                    ) : null}

                    {/* Roster & Présences */}
                    <TrainingRosterPreview event={event} teamMembers={teamMembers} />
                  </PressableSpring>

                  <View style={styles.cardFooter}>
                    {pendingUids.length > 0 ? (
                      <PressableSpring
                        onPress={() => void handleEventReminder(event)}
                        scaleTo={0.96}
                        haptic
                        style={styles.relanceBtn}
                      >
                        <Icon name="mail" size={13} color={tokens.accent} />
                        <ProDayText variant="caption" style={styles.relanceBtnText}>
                          Relancer ({pendingUids.length})
                        </ProDayText>
                      </PressableSpring>
                    ) : (
                      <View style={styles.allSetBadge}>
                        <Icon name="checkmark-circle" size={13} color="#10B981" />
                        <ProDayText variant="caption" style={styles.allSetText}>
                          Vestiaire au complet
                        </ProDayText>
                      </View>
                    )}

                    <PressableSpring
                      onPress={() => (ready ? openEventHub(event) : setManualModalVisible(true))}
                      scaleTo={0.96}
                      haptic
                    >
                      <ProDayText variant="caption" style={[styles.openHubLink, { color: tokens.accent }]}>
                        {ready ? 'Ouvrir la séance →' : 'Modifier'}
                      </ProDayText>
                    </PressableSpring>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* MODAL CRÉATION MANUELLE */}
        <Modal
          visible={manualModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setManualModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ProDayText variant="title" style={styles.modalTitle}>
                  Nouvelle séance manuelle
                </ProDayText>
                <PressableSpring
                  onPress={() => setManualModalVisible(false)}
                  scaleTo={0.92}
                >
                  <Icon name="close" size={18} color="#8B8B9A" />
                </PressableSpring>
              </View>

              <View style={styles.modalForm}>
                <ProDayText variant="caption" style={styles.inputLabel}>
                  Titre de la séance
                </ProDayText>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex : Séance tactique & opposition"
                  placeholderTextColor="#6B6B7F"
                  value={manualTitle}
                  onChangeText={setManualTitle}
                />

                <ProDayText variant="caption" style={styles.inputLabel}>
                  Thème ou objectifs
                </ProDayText>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex : Sorties de balle et pressing haut"
                  placeholderTextColor="#6B6B7F"
                  value={manualFocus}
                  onChangeText={setManualFocus}
                />

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="caption" style={styles.inputLabel}>
                      Durée (minutes)
                    </ProDayText>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={manualDuration}
                      onChangeText={setManualDuration}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="caption" style={styles.inputLabel}>
                      Lieu / Terrain
                    </ProDayText>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Terrain Annexe"
                      placeholderTextColor="#6B6B7F"
                      value={manualCity}
                      onChangeText={setManualCity}
                    />
                  </View>
                </View>

                <PressableSpring
                  style={[styles.modalSubmitBtn, { backgroundColor: tokens.accent }]}
                  onPress={() => void handleCreateManual()}
                  disabled={manualSaving}
                  scaleTo={0.97}
                  haptic
                >
                  {manualSaving ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <ProDayText variant="section" style={styles.modalSubmitBtnText}>
                      Enregistrer la séance
                    </ProDayText>
                  )}
                </PressableSpring>
              </View>
            </View>
          </View>
        </Modal>

        <FederationSyncDrawer
          visible={syncDrawerVisible}
          onClose={() => setSyncDrawerVisible(false)}
          onSyncComplete={(name) => {
            setSyncedTeamName(name);
            setHasSynced(true);
          }}
        />
      </CoachChapterScroll>
    </CoachPane>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    manualAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.md,
      backgroundColor: '#1A1A24',
      borderWidth: 1,
      borderColor: '#262638',
    },
    manualAddBtnText: {
      fontWeight: '700',
      fontSize: 11.5,
    },
    aiStudioCard: {
      backgroundColor: '#14141A',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      borderRadius: 22,
      padding: 18,
      marginBottom: spacing.lg,
    },
    aiStudioHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    aiStudioBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(139, 92, 246, 0.16)',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    aiStudioBadgeText: {
      color: '#A78BFA',
      fontWeight: '900',
      fontSize: 9.5,
      letterSpacing: 0.3,
    },
    aiStudioSubHead: {
      color: '#8B8B9A',
      fontSize: 11,
      fontWeight: '600',
    },
    aiStudioTitle: {
      color: '#FFFFFF',
      fontSize: 19,
      fontWeight: '900',
      letterSpacing: -0.3,
      lineHeight: 24,
    },
    aiStudioDesc: {
      color: '#8B8B9A',
      fontSize: 11.5,
      lineHeight: 16,
      marginTop: 4,
      marginBottom: 12,
    },
    aiInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1A1A24',
      borderWidth: 1,
      borderColor: '#2B2B3E',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 12,
    },
    aiInput: {
      flex: 1,
      fontSize: 13,
      paddingVertical: 8,
    },
    aiSubmitBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    durationLabel: {
      color: '#8B8B9A',
      fontSize: 11,
      fontWeight: '600',
      marginRight: 2,
    },
    durationPill: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: '#1A1A24',
      borderWidth: 1,
      borderColor: '#262638',
    },
    durationPillText: {
      color: '#8B8B9A',
      fontSize: 11,
      fontWeight: '600',
    },
    presetsWrap: {
      gap: 6,
    },
    presetsLabel: {
      color: '#8B8B9A',
      fontSize: 11,
      fontWeight: '600',
    },
    presetsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    presetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#1A1A24',
      borderWidth: 1,
      borderColor: '#262638',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },
    presetChipText: {
      color: '#D4D4E0',
      fontSize: 11,
      fontWeight: '600',
    },
    generatedResultCard: {
      backgroundColor: '#101017',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.4)',
      borderRadius: 16,
      padding: 14,
      marginTop: 14,
      gap: 12,
    },
    generatedHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    generatedTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: -0.2,
    },
    generatedSub: {
      color: '#A78BFA',
      fontSize: 11,
      marginTop: 2,
    },
    generatedCloseBtn: {
      padding: 4,
    },
    phasesList: {
      gap: 8,
    },
    phaseItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: '#181822',
      borderRadius: 10,
      padding: 10,
    },
    phaseBadge: {
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    phaseBadgeText: {
      color: '#C4B5FD',
      fontSize: 10,
      fontWeight: '800',
    },
    phaseInfo: {
      flex: 1,
      gap: 2,
    },
    phaseTitle: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    phaseDesc: {
      color: '#8B8B9A',
      fontSize: 11,
      lineHeight: 15,
    },
    applyPlanBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
    },
    applyPlanBtnText: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 13.5,
    },
    bulkReminderBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: spacing.md,
      gap: 10,
    },
    bulkReminderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    bulkReminderTitle: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 13,
    },
    bulkReminderBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 9,
    },
    bulkReminderBtnText: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 11.5,
    },
    calendarSectionHeader: {
      gap: 10,
      marginBottom: 12,
    },
    calendarSectionTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    filterPillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#14141A',
      borderWidth: 1,
      borderColor: '#22222E',
    },
    filterPillActive: {
      backgroundColor: `${tokens.accent}20`,
      borderColor: `${tokens.accent}55`,
    },
    filterPillText: {
      color: '#8B8B9A',
      fontWeight: '700',
      fontSize: 11,
    },
    filterPillTextActive: {
      color: tokens.accent,
      fontWeight: '800',
    },
    trainingsList: {
      gap: 12,
      marginBottom: spacing.xxl,
    },
    trainingCard: {
      backgroundColor: '#14141A',
      borderWidth: 1,
      borderColor: '#22222E',
      borderRadius: 18,
      padding: 15,
      gap: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    cardTitleCol: {
      flex: 1,
      gap: 5,
    },
    cardTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    trainingTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: `${tokens.accent}14`,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 5,
    },
    trainingTagText: {
      color: tokens.accent,
      fontSize: 9.5,
      fontWeight: '800',
    },
    durationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      paddingHorizontal: 6,
      paddingVertical: 2.5,
      borderRadius: 5,
    },
    durationBadgeText: {
      color: '#8B8B9A',
      fontSize: 9.5,
      fontWeight: '700',
    },
    cardTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    deleteBtn: {
      padding: 4,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardMetaText: {
      color: '#8B8B9A',
      fontSize: 11.5,
      fontWeight: '500',
    },
    focusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    focusPillText: {
      color: '#C4B5FD',
      fontSize: 11,
      fontWeight: '700',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: '#1C1C24',
      paddingTop: 10,
      marginTop: 2,
    },
    relanceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: `${tokens.accent}15`,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
    },
    relanceBtnText: {
      color: tokens.accent,
      fontWeight: '700',
      fontSize: 11,
    },
    allSetBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    allSetText: {
      color: '#10B981',
      fontWeight: '700',
      fontSize: 11,
    },
    openHubLink: {
      fontWeight: '800',
      fontSize: 11.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: '#14141A',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: '#2A2A38',
      padding: 20,
      gap: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    modalForm: {
      gap: 10,
    },
    inputLabel: {
      color: '#8B8B9A',
      fontSize: 11,
      fontWeight: '700',
      marginTop: 2,
    },
    modalInput: {
      backgroundColor: '#1C1C26',
      borderWidth: 1,
      borderColor: '#2B2B3E',
      borderRadius: 12,
      color: '#FFFFFF',
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13,
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },
    modalSubmitBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
    },
    modalSubmitBtnText: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 13.5,
    },
  });
}


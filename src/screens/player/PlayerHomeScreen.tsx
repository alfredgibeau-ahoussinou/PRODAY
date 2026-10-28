import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../context/LocaleContext';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTabNavigationOptional } from '../../context/TabNavigationContext';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  isCoachMatchEvent,
  userRsvp,
  type RsvpStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import { CoachTrainingDrillDiagram } from '../../components/coach/CoachTrainingDrillDiagram';
import { createPresetDiagram } from '../../models/ExerciseDiagram';
import {
  playerColors,
  playerType,
  playerForm,
  playerCard,
  playerResponseTone,
  PLAYER_SURFACE_TOKENS,
} from '../../theme/playerDesignSystem';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { ProDayText } from '../../components/ui/ProDayText';

// Composants de Progression & Quêtes
import { XpProgressBar } from '../../components/progression/XpProgressBar';
import { ObjectiveCard } from '../../components/progression/ObjectiveCard';
import { RankJourneyModal } from '../../components/progression/RankJourneyModal';
import { LevelUpModal } from '../../components/progression/LevelUpModal';
import { footballProgressionService } from '../../services/footballProgression.service';
import type {
  PlayerProgressionProfile,
  ProgressionObjective,
  ObjectiveActionKind,
  ProgressionRank,
} from '../../models/FootballProgression';
import { playerFeedbackService } from '../../services/playerFeedback.service';
import type { PlayerFeedbackRequest } from '../../models/PlayerFeedback';
import { EventEquipmentChecklistPanel } from '../../components/team/EventEquipmentChecklistPanel';

interface PlayerHomeScreenProps {
  onNavigateTab?: (tabId: 'stats' | 'wellness' | 'tactics') => void;
}

function deriveRsvp(event: TeamEvent, uid: string): PlayerRsvpStatus {
  const stored = userRsvp(event, uid);
  if (stored === 'yes') return 'present';
  if (stored === 'no') return 'absent';
  return 'pending';
}

export const PlayerHomeScreen: React.FC<PlayerHomeScreenProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';
  const tabNav = useTabNavigationOptional();
  const { width: winWidth } = useWindowDimensions();

  // Événement & RSVP
  const [rsvp, setRsvp] = useState<PlayerRsvpStatus>('pending');
  const [rsvpError, setRsvpError] = useState(false);
  const [nextMatch, setNextMatch] = useState<TeamEvent | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  // Progression & Quêtes
  const [progressionProfile, setProgressionProfile] = useState<PlayerProgressionProfile | null>(null);
  const [activeObjectives, setActiveObjectives] = useState<ProgressionObjective[]>([]);
  const [recentCoachFeedback, setRecentCoachFeedback] = useState<PlayerFeedbackRequest[]>([]);
  const [showJourneyModal, setShowJourneyModal] = useState(false);

  // Modal Level-Up / Promotion
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    level: number;
    rank: ProgressionRank;
    isRankPromotion: boolean;
    unlockedTitle?: string;
  }>({ level: 1, rank: 'wood', isRankPromotion: false });

  // Checklist rapide
  const [showChecklistSheet, setShowChecklistSheet] = useState(false);

  const loadProgressionData = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const p = await footballProgressionService.getOrCreateProgressionProfile(
        profile.uid,
        profile?.profile?.club_id || undefined,
      );
      setProgressionProfile(p);

      const objs = await footballProgressionService.listActiveObjectives(profile.uid);
      setActiveObjectives(objs);

      const fb = await playerFeedbackService.listForPlayer(profile.uid);
      setRecentCoachFeedback(fb.filter((item: PlayerFeedbackRequest) => item.status === 'answered').slice(0, 2));
    } catch {
      // Best-effort
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.uid) return;
    let alive = true;

    // Chargement prochain événement (entraînement ou match)
    teamEventsService
      .listForUser(profile.uid, profile?.profile?.club_id || undefined)
      .then(async (rows) => {
        if (!alive) return;
        const nowMs = Date.now() - 2 * 3600 * 1000;
        const upcoming = rows
          .filter((e) => e.starts_at && e.starts_at.getTime() >= nowMs)
          .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

        if (upcoming.length > 0) {
          setNextMatch(upcoming[0]);
          setRsvp(deriveRsvp(upcoming[0], profile.uid));
        } else {
          setNextMatch(null);
          setRsvp('pending');
        }
      })
      .catch(() => undefined);

    loadProgressionData();

    return () => {
      alive = false;
    };
  }, [userId, profile, loadProgressionData]);

  const handleRsvpChange = (status: PlayerRsvpStatus) => {
    prodayHaptics.impactMedium();
    if (!nextMatch || !profile?.uid) return;
    const mapped: RsvpStatus = status === 'present' ? 'yes' : status === 'absent' ? 'no' : 'maybe';
    setRsvpError(false);
    setRsvp(status);
    setRsvpBusy(true);
    teamEventsService
      .updateRsvp(nextMatch.id, profile.uid, mapped)
      .then(async () => {
        prodayHaptics.rsvpConfirm();
        // Attribution de jalon de présence si applicable
        if (status === 'present') {
          await footballProgressionService.awardXp(profile.uid, 15, 'rsvp_presence_confirmed', {
            idempotencyKey: `xp_rsvp_${nextMatch.id}_${profile.uid}`,
            completionStatus: 'system_observed',
            milestoneKey: 'm_bronze_presence',
          });
          loadProgressionData();
        }
      })
      .catch(() => {
        setRsvp(deriveRsvp(nextMatch, profile.uid));
        setRsvpError(true);
        prodayHaptics.error();
      })
      .finally(() => setRsvpBusy(false));
  };

  // Action directe sur une quête
  const handleExecuteObjectiveAction = (actionKind: ObjectiveActionKind, targetId?: string) => {
    prodayHaptics.selection();
    switch (actionKind) {
      case 'open_tactical_role':
        onNavigateTab?.('tactics');
        break;
      case 'open_individual_program':
      case 'open_mid_season_review':
        tabNav?.setActiveTab('progression');
        break;
      case 'open_video_clips':
      case 'open_journal':
      case 'open_feedback':
        tabNav?.setActiveTab('plus');
        break;
      case 'open_checklist':
        if (nextMatch) {
          setShowChecklistSheet(true);
        } else {
          tabNav?.setActiveTab('matchs');
        }
        break;
      case 'open_calendar':
        tabNav?.setActiveTab('matchs');
        break;
      default:
        tabNav?.setActiveTab('progression');
        break;
    }
  };

  // Soumission de complétion d'un objectif
  const handleSubmitCompletion = async (objectiveId: string) => {
    if (!profile?.uid) return;
    try {
      const res = await footballProgressionService.submitObjectiveCompletion(objectiveId, profile.uid);
      if (res.completed) {
        prodayHaptics.confirm();
        if (res.leveledUp || res.rankPromoted) {
          const updated = await footballProgressionService.getOrCreateProgressionProfile(profile.uid);
          setLevelUpData({
            level: updated.level,
            rank: updated.rank,
            isRankPromotion: res.rankPromoted,
            unlockedTitle: updated.current_title,
          });
          setLevelUpModalVisible(true);
        } else {
          Alert.alert(t('hc.player.playerprogression.quete.validee.81857a'), `Tu as gagné +${res.xpAwarded} XP.`);
        }
      } else if (res.awaitingCoach) {
        Alert.alert(t('hc.player.playerprogression.transmis.au.coach.7728d0'), t('hc.player.playerhome.ton.coach.a.ete.notifie.pour.valider.cette.reali.b19812'));
      }
      loadProgressionData();
    } catch (err: any) {
      Alert.alert('Information', err?.message || t('hc.player.playerhome.impossible.de.valider.cet.objectif.3e8cea'));
    }
  };

  const nextMatchWhen = nextMatch
    ? `${nextMatch.starts_at.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${nextMatch.starts_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const rsvpOptions: { status: PlayerRsvpStatus; icon: keyof typeof Ionicons.glyphMap }[] = [
    { status: 'present', icon: 'checkmark-circle' },
    { status: 'pending', icon: 'help-circle' },
    { status: 'absent', icon: 'close-circle' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. En-tête Identité & Contexte Équipe */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.greetingText}>
            Bonjour, {profile?.display_name?.split(' ')[0] || 'Joueur'}
          </Text>
          <Text style={styles.teamSubHeader} numberOfLines={1}>
            {profile?.profile?.club_id ? t('hc.player.playerhome.club.affilie.806b66') : t('hc.player.playerhome.joueur.independant.e55bfd')} • {profile?.profile?.position || t('hc.player.playerhome.poste.a.renseigner.02c5f5')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.journeyRoadmapBtn}
          onPress={() => {
            prodayHaptics.selection();
            setShowJourneyModal(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="map" size={13} color={PLAYER_DARK.accentAlt} style={{ marginRight: 4 }} />
          <ProDayText variant="caption" style={styles.journeyBtnText}>
            Roadmap
          </ProDayText>
        </TouchableOpacity>
      </View>

      {/* 2. Centre de Gravité : Système de Progression Football (Solo Leveling inspiré) */}
      {progressionProfile ? (
        <XpProgressBar
          level={progressionProfile.level}
          rank={progressionProfile.rank}
          totalXp={progressionProfile.total_xp}
          xpIntoLevel={progressionProfile.xp_into_level}
          xpForNextLevel={progressionProfile.xp_for_next_level}
          currentTitle={progressionProfile.current_title}
          onPressRank={() => setShowJourneyModal(true)}
        />
      ) : null}

      {/* 3. ALERTE URGENTE / CONVOCATION (Ne doit jamais être masquée par la progression) */}
      <View style={[styles.matchWidgetCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
        <View style={styles.matchBadgeRow}>
          <View style={styles.matchLiveBadge}>
            <Ionicons name="calendar" size={12} color={playerColors.accent} />
            <Text style={styles.matchLiveBadgeText}>
              {nextMatch?.event_type === 'training' ? t('hc.player.playerhome.prochain.entrainement.f0bf87') : t('hc.player.playerhome.prochain.match.b3986a')}
            </Text>
          </View>
          {nextMatch && rsvp === 'pending' && (
            <View style={styles.urgentBadge}>
              <Ionicons name="alert-circle" size={12} color={PLAYER_DARK.text} style={{ marginRight: 3 }} />
              <Text style={styles.rsvpUrgentPill}>RÉPONSE ATTENDUE</Text>
            </View>
          )}
        </View>

        {nextMatch ? (
          <>
            <Text style={styles.matchFixtureTitle} numberOfLines={2}>
              {nextMatch.title || t('hc.player.playerhome.seance.programmee.fc7514')}
            </Text>
            <Text style={styles.matchCountdownSub} numberOfLines={2}>
              {nextMatchWhen}
              {nextMatch.location_label || nextMatch.city ? ` · ${nextMatch.location_label || nextMatch.city}` : ''}
            </Text>

            {/* Accès séance tactique complète & animations Tacticslot */}
            {nextMatch?.session_plan?.exercises && nextMatch.session_plan.exercises.length > 0 && (
              <TouchableOpacity
                style={styles.tacticslotLaunchBtn}
                onPress={() => {
                  prodayHaptics.impactLight();
                  setShowTrainingModal(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.tacticslotIconWrap}>
                  <Ionicons name="football" size={15} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tacticslotLaunchTitle}>
                    Séance Tactique & Terrain Animé (Tacticslot)
                  </Text>
                  <Text style={styles.tacticslotLaunchSub}>
                    {nextMatch.session_plan.exercises.length} ateliers avec schémas interactifs
                  </Text>
                </View>
                <Ionicons name="play-circle" size={22} color={playerColors.accent} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.matchEmptyBox}>
            <Ionicons name="calendar-outline" size={20} color={playerColors.textDim} />
            <Text style={styles.matchEmptyText}>
              Aucun match ou entraînement programmé pour l'instant. Les convocations du staff apparaîtront ici.
            </Text>
          </View>
        )}

        {/* Barre de réponse RSVP en un tap */}
        {nextMatch && (
          <View style={styles.rsvpSection}>
            <View style={styles.rsvpHeaderRow}>
              <Text style={styles.rsvpSectionTitle}>MON STATUT DE PRÉSENCE</Text>
              {rsvp === 'pending' && !rsvpBusy && (
                <Text style={styles.rsvpHintText}>Le coach attend ta confirmation</Text>
              )}
            </View>
            <View style={[styles.rsvpBar, rsvpBusy && styles.rsvpBarBusy]}>
              {rsvpOptions.map(({ status, icon }) => {
                const tone = playerResponseTone[status];
                const active = rsvp === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.rsvpBtn,
                      active && { backgroundColor: tone.color },
                      !active && { backgroundColor: playerColors.surfaceRaised, borderWidth: 1, borderColor: playerColors.border },
                    ]}
                    onPress={() => handleRsvpChange(status)}
                    disabled={rsvpBusy}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={icon} size={14} color={active ? tone.ink : tone.color} />
                    <Text style={[styles.rsvpBtnText, { color: active ? tone.ink : playerColors.text }]}>
                      {tone.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {rsvpError && (
              <Text style={styles.rsvpErrorText}>
                Réponse non enregistrée — vérifie ta connexion puis réessaie.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 4. Section : QUÊTES ACTIVES & OBJECTIFS DE DÉVELOPPEMENT */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="flame" size={16} color={PLAYER_DARK.accentAlt} style={{ marginRight: 6 }} />
          <ProDayText variant="title" style={styles.sectionHeading}>
            Quêtes Football en cours
          </ProDayText>
        </View>
        <TouchableOpacity
          onPress={() => {
            prodayHaptics.selection();
            tabNav?.setActiveTab('progression');
          }}
        >
          <ProDayText variant="caption" style={styles.sectionLink}>
            Voir tout →
          </ProDayText>
        </TouchableOpacity>
      </View>

      {activeObjectives.length === 0 ? (
        <View style={styles.emptyObjectivesBox}>
          <Ionicons name="sparkles-outline" size={24} color={PLAYER_DARK.textMuted} />
          <ProDayText variant="body" style={styles.emptyObjectivesText}>
            Toutes tes quêtes actuelles sont complétées !
          </ProDayText>
          <TouchableOpacity
            style={styles.browseObjectivesBtn}
            onPress={() => tabNav?.setActiveTab('progression')}
          >
            <ProDayText variant="caption" style={styles.browseObjectivesBtnText}>
              Choisir un nouvel objectif de travail
            </ProDayText>
          </TouchableOpacity>
        </View>
      ) : (
        activeObjectives.slice(0, 3).map((obj) => (
          <ObjectiveCard
            key={obj.id}
            objective={obj}
            onExecuteAction={handleExecuteObjectiveAction}
            onSubmitCompletion={handleSubmitCompletion}
          />
        ))
      )}

      {/* 5. Section : RETOURS DU COACH & ACCOMPLISSEMENTS */}
      <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chatbubble-ellipses" size={16} color={CLUB_TOKENS.warning} style={{ marginRight: 6 }} />
          <ProDayText variant="title" style={styles.sectionHeading}>
            Derniers retours du coach
          </ProDayText>
        </View>
      </View>

      {recentCoachFeedback.length === 0 ? (
        <View style={styles.feedbackEmptyCard}>
          <ProDayText variant="caption" style={styles.feedbackEmptyText}>
            Aucun débriefing récent du staff. Pose une question technique au coach pour ouvrir un axe de progression.
          </ProDayText>
        </View>
      ) : (
        recentCoachFeedback.map((fb) => (
          <View key={fb.id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <ProDayText variant="caption" style={styles.feedbackCoachName}>
                Coach {fb.coach_name}
              </ProDayText>
              <ProDayText variant="caption" style={styles.feedbackDate}>
                {fb.event_title || 'Débriefing technique'}
              </ProDayText>
            </View>
            <ProDayText variant="body" style={styles.feedbackQuote}>
              « {fb.coach_response} »
            </ProDayText>
          </View>
        ))
      )}

      {/* Modals de progression */}
      {progressionProfile ? (
        <RankJourneyModal
          visible={showJourneyModal}
          onClose={() => setShowJourneyModal(false)}
          profile={progressionProfile}
        />
      ) : null}

      <LevelUpModal
        visible={levelUpModalVisible}
        onClose={() => setLevelUpModalVisible(false)}
        level={levelUpData.level}
        rank={levelUpData.rank}
        isRankPromotion={levelUpData.isRankPromotion}
        unlockedTitle={levelUpData.unlockedTitle}
      />

      {/* Modal Détail Séance d'entraînement & Terrain Tactique Animé (Tacticslot) */}
      <Modal
        visible={showTrainingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTrainingModal(false)}
      >
        <View style={styles.trainingModalRoot}>
          {/* Header Modal */}
          <View style={styles.trainingModalHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.trainingTypeRow}>
                <Ionicons name="fitness" size={14} color={playerColors.accent} />
                <Text style={styles.trainingTypePill}>SÉANCE TACTIQUE & TECHNIQUE</Text>
              </View>
              <Text style={styles.trainingModalTitle} numberOfLines={2}>
                {nextMatch?.title || 'Séance d’entraînement'}
              </Text>
              {nextMatch?.session_plan?.focus ? (
                <Text style={styles.trainingModalFocus}>
                  Focus : {nextMatch.session_plan.focus}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => setShowTrainingModal(false)}
              style={styles.closeModalBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color={PLAYER_DARK.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.trainingModalScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Métadonnées rapides */}
            <View style={styles.trainingMetaCard}>
              <View style={styles.trainingMetaItem}>
                <Ionicons name="time-outline" size={16} color={PLAYER_DARK.accentAlt} />
                <Text style={styles.trainingMetaVal}>{nextMatchWhen || 'À venir'}</Text>
              </View>
              {nextMatch?.location_label ? (
                <View style={styles.trainingMetaItem}>
                  <Ionicons name="location-outline" size={16} color={PLAYER_DARK.accentAlt} />
                  <Text style={styles.trainingMetaVal} numberOfLines={1}>
                    {nextMatch.location_label}
                  </Text>
                </View>
              ) : null}
              {nextMatch?.session_plan?.duration_min ? (
                <View style={styles.trainingMetaItem}>
                  <Ionicons name="timer-outline" size={16} color={PLAYER_DARK.accentAlt} />
                  <Text style={styles.trainingMetaVal}>
                    {nextMatch.session_plan.duration_min} min au total
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Ateliers Tacticslot */}
            <Text style={styles.drillSectionTitle}>
              ATELIERS & SCHÉMAS ANIMÉS ({nextMatch?.session_plan?.exercises?.length || 0})
            </Text>

            {nextMatch?.session_plan?.exercises?.map((drill, index) => {
              const drillWidth = Math.min(winWidth - 40, 420);
              const drillHeight = Math.round(drillWidth * 0.72);
              return (
                <View key={drill.id || index} style={styles.drillCard}>
                  <View style={styles.drillHeader}>
                    <View style={styles.drillIndexBadge}>
                      <Text style={styles.drillIndexText}>#{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.drillTitle}>{drill.name}</Text>
                      <View style={styles.drillTagRow}>
                        {drill.durationMin ? (
                          <Text style={styles.drillDurationTag}>{drill.durationMin} min</Text>
                        ) : null}
                        {drill.drillType ? (
                          <Text style={styles.drillTypeTag}>{drill.drillType.toUpperCase()}</Text>
                        ) : null}
                        {drill.intensity ? (
                          <Text style={styles.drillIntensityTag}>
                            {drill.intensity === 'high' ? 'Intensité élevée' : drill.intensity === 'medium' ? 'Intensité modérée' : 'Échauffement'}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Terrain Tacticslot avec animation interactive */}
                  {drill.diagram ? (
                    <View style={styles.diagramWrapper}>
                      <CoachTrainingDrillDiagram
                        diagramData={drill.diagram}
                        width={drillWidth}
                        height={drillHeight}
                        animate={true}
                      />
                    </View>
                  ) : null}

                  {drill.instructions ? (
                    <View style={styles.drillInstructionsBox}>
                      <Text style={styles.drillInstructionsLabel}>CONSIGNES DU COACH</Text>
                      <Text style={styles.drillInstructionsText}>{drill.instructions}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}

            {/* Confirmation présence directement depuis le plan de séance */}
            {nextMatch ? (
              <View style={[styles.modalRsvpBox, { marginTop: 12 }]}>
                <Text style={styles.modalRsvpTitle}>CONFIRMER MA PRÉSENCE À CET ENTRAÎNEMENT</Text>
                <View style={styles.rsvpBar}>
                  {rsvpOptions.map(({ status, icon }) => {
                    const tone = playerResponseTone[status];
                    const active = rsvp === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.rsvpBtn,
                          active && { backgroundColor: tone.color },
                          !active && { backgroundColor: PLAYER_DARK.surfaceRaised, borderWidth: 1, borderColor: PLAYER_DARK.border },
                        ]}
                        onPress={() => handleRsvpChange(status)}
                        disabled={rsvpBusy}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={icon} size={14} color={active ? tone.ink : tone.color} />
                        <Text style={[styles.rsvpBtnText, { color: active ? tone.ink : PLAYER_DARK.text }]}>
                          {tone.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Checklist Sac de Sport */}
      {nextMatch ? (
        <Modal
          visible={showChecklistSheet}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowChecklistSheet(false)}
        >
          <View style={styles.trainingModalRoot}>
            <View style={styles.trainingModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.trainingModalTitle}>Checklist Sac de Sport</Text>
                <Text style={styles.trainingModalFocus}>{nextMatch.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowChecklistSheet(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={20} color={PLAYER_DARK.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              <EventEquipmentChecklistPanel
                eventId={nextMatch.id}
                eventType={nextMatch.event_type}
                playerUid={userId}
              />
            </ScrollView>
          </View>
        </Modal>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: playerColors.bg,
  },
  content: {
    padding: playerForm.space.lg,
    paddingBottom: playerForm.space.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingText: {
    ...playerType.subheadline,
    color: playerColors.textMuted,
  },
  teamSubHeader: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: 2,
  },
  journeyRoadmapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PLAYER_DARK.accentGlow,
  },
  journeyBtnText: {
    color: PLAYER_DARK.accentAlt,
    fontWeight: '800',
    fontSize: 11,
  },
  matchWidgetCard: {
    padding: playerForm.cardPaddingH,
    marginBottom: playerForm.space.md,
    marginTop: 6,
  },
  matchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: playerForm.space.sm,
  },
  matchLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: playerColors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: playerForm.fieldRadius - 10,
  },
  matchLiveBadgeText: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.accent,
    letterSpacing: 0.5,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CLUB_TOKENS.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rsvpUrgentPill: {
    ...playerType.micro,
    fontWeight: '900',
    color: PLAYER_DARK.text,
    letterSpacing: 0.5,
  },
  matchFixtureTitle: {
    ...playerType.headline,
    color: playerColors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  matchCountdownSub: {
    ...playerType.caption,
    color: playerColors.textSecondary,
    marginBottom: 12,
  },
  matchEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  matchEmptyText: {
    ...playerType.caption,
    color: playerColors.textDim,
    flex: 1,
    lineHeight: 16,
  },
  rsvpSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: playerColors.border,
  },
  rsvpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rsvpSectionTitle: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.textMuted,
    letterSpacing: 0.5,
  },
  rsvpHintText: {
    ...playerType.micro,
    color: CLUB_TOKENS.warning,
    fontWeight: '700',
  },
  rsvpBar: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpBarBusy: {
    opacity: 0.6,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
  },
  rsvpBtnText: {
    ...playerType.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  rsvpErrorText: {
    ...playerType.micro,
    color: CLUB_TOKENS.danger,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeading: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionLink: {
    color: PLAYER_DARK.accentAlt,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyObjectivesBox: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  emptyObjectivesText: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 10,
  },
  browseObjectivesBtn: {
    backgroundColor: PLAYER_DARK.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseObjectivesBtnText: {
    color: PLAYER_DARK.accentAlt,
    fontWeight: '700',
    fontSize: 12,
  },
  feedbackEmptyCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  feedbackEmptyText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  feedbackCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: CLUB_TOKENS.warningSoft,
    marginBottom: 10,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  feedbackCoachName: {
    color: CLUB_TOKENS.warning,
    fontWeight: '700',
    fontSize: 11,
  },
  feedbackDate: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  feedbackQuote: {
    color: PLAYER_DARK.text,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  tacticslotLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  tacticslotIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tacticslotLaunchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0FDF4',
  },
  tacticslotLaunchSub: {
    fontSize: 11,
    color: '#86EFAC',
    marginTop: 1,
  },
  trainingModalRoot: {
    flex: 1,
    backgroundColor: PLAYER_DARK.bg,
  },
  trainingModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  trainingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  trainingTypePill: {
    fontSize: 10,
    fontWeight: '800',
    color: playerColors.accent,
    letterSpacing: 0.5,
  },
  trainingModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  trainingModalFocus: {
    fontSize: 12,
    color: PLAYER_DARK.textSecondary,
    marginTop: 3,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingModalScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  trainingMetaCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  trainingMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trainingMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: PLAYER_DARK.text,
  },
  drillSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: PLAYER_DARK.textMuted,
    marginBottom: 12,
  },
  drillCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    marginBottom: 16,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  drillIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PLAYER_DARK.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillIndexText: {
    color: PLAYER_DARK.accentAlt,
    fontWeight: '800',
    fontSize: 12,
  },
  drillTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  drillTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  drillDurationTag: {
    fontSize: 10,
    fontWeight: '700',
    color: PLAYER_DARK.accentAlt,
    backgroundColor: PLAYER_DARK.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  drillTypeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: CLUB_TOKENS.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  drillIntensityTag: {
    fontSize: 10,
    fontWeight: '700',
    color: CLUB_TOKENS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diagramWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0B2912',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  drillInstructionsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  drillInstructionsLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PLAYER_DARK.textMuted,
    marginBottom: 3,
  },
  drillInstructionsText: {
    fontSize: 12,
    lineHeight: 17,
    color: PLAYER_DARK.textSecondary,
  },
  modalRsvpBox: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  modalRsvpTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PLAYER_DARK.textMuted,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default PlayerHomeScreen;

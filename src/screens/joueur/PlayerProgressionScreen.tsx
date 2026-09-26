import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
import { ProDayText } from '../../components/ui/ProDayText';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { PlayerIndividualProgramsPanel } from '../../components/player/PlayerIndividualProgramsPanel';
import { PlayerMidSeasonReviewPanel } from '../../components/player/PlayerMidSeasonReviewPanel';
import { PlayerFeedbackModal } from '../../components/player/PlayerFeedbackModal';
import { prodayHaptics } from '../../utils/prodayHaptics';

// Progression & Quêtes
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
  XpLedgerEntry,
} from '../../models/FootballProgression';

type ProgressionTab = 'quests' | 'individual' | 'review';

export function PlayerProgressionScreen({ embedded = false }: { embedded?: boolean }) {
  const profile = useSessionProfile();
  const nav = useTabNavigationActions();
  const theme = useJoueurTheme();
  const accent = theme.accent;

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProgressionTab>('quests');

  // État de progression
  const [progressionProfile, setProgressionProfile] = useState<PlayerProgressionProfile | null>(null);
  const [activeObjectives, setActiveObjectives] = useState<ProgressionObjective[]>([]);
  const [availableObjectives, setAvailableObjectives] = useState<
    Array<Omit<ProgressionObjective, 'id' | 'player_uid' | 'created_at' | 'updated_at'>>
  >([]);
  const [xpLedger, setXpLedger] = useState<XpLedgerEntry[]>([]);
  const [showLedger, setShowLedger] = useState(false);

  // Modals
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    level: number;
    rank: ProgressionRank;
    isRankPromotion: boolean;
    unlockedTitle?: string;
  }>({ level: 1, rank: 'wood', isRankPromotion: false });

  // Modal feedback
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackSkillTopic, setFeedbackSkillTopic] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const p = await footballProgressionService.getOrCreateProgressionProfile(
        profile.uid,
        profile.profile.club_id || undefined,
      );
      setProgressionProfile(p);

      const actives = await footballProgressionService.listActiveObjectives(profile.uid);
      setActiveObjectives(actives);

      const availables = await footballProgressionService.listAvailableObjectives(
        profile.uid,
        profile.profile.position || undefined,
      );
      setAvailableObjectives(availables);

      const ledger = await footballProgressionService.listXpLedger(profile.uid, 20);
      setXpLedger(ledger);
    } catch {
      // Best-effort
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  // Action directe sur une quête
  const handleExecuteAction = (actionKind: ObjectiveActionKind, targetId?: string) => {
    prodayHaptics.selection();
    switch (actionKind) {
      case 'open_individual_program':
        setActiveTab('individual');
        break;
      case 'open_mid_season_review':
        setActiveTab('review');
        break;
      case 'open_feedback':
        setFeedbackSkillTopic('Technique & Placement');
        setFeedbackModalVisible(true);
        break;
      case 'open_tactical_role':
        nav.setActiveTab('feed');
        break;
      case 'open_video_clips':
      case 'open_journal':
      case 'open_checklist':
        nav.setActiveTab('plus');
        break;
      case 'open_calendar':
        nav.setActiveTab('matchs');
        break;
      default:
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
          Alert.alert('Quête validée !', `Tu as gagné +${res.xpAwarded} XP.`);
        }
      } else if (res.awaitingCoach) {
        Alert.alert('Transmis au coach', 'Ton coach examinera et validera cette réalisation.');
      }
      loadData();
    } catch (err: any) {
      Alert.alert('Information', err?.message || 'Impossible de valider cet objectif.');
    }
  };

  // Activation d'un objectif depuis le catalogue
  const handleAcceptObjective = async (templateId: string) => {
    if (!profile?.uid) return;
    try {
      await footballProgressionService.acceptObjective(
        profile.uid,
        templateId,
        profile.profile.club_id || undefined,
      );
      prodayHaptics.confirm();
      Alert.alert('Quête activée', 'Retrouve-la dans tes quêtes en cours.');
      loadData();
    } catch (err: any) {
      Alert.alert('Limite atteinte', err?.message || 'Impossible d’activer cette quête.');
    }
  };

  if (!profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  const renderSegmentNav = () => (
    <View style={styles.segmentContainer}>
      <TouchableOpacity
        style={[
          styles.segmentButton,
          activeTab === 'quests' && [styles.segmentButtonActive, { borderColor: `${accent}40` }],
        ]}
        onPress={() => {
          prodayHaptics.selection();
          setActiveTab('quests');
        }}
      >
        <ProDayText
          variant="caption"
          style={[
            styles.segmentText,
            activeTab === 'quests' && { color: accent, fontWeight: '700' },
          ]}
        >
          Quêtes & Rangs
        </ProDayText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.segmentButton,
          activeTab === 'individual' && [styles.segmentButtonActive, { borderColor: `${accent}40` }],
        ]}
        onPress={() => {
          prodayHaptics.selection();
          setActiveTab('individual');
        }}
      >
        <ProDayText
          variant="caption"
          style={[
            styles.segmentText,
            activeTab === 'individual' && { color: accent, fontWeight: '700' },
          ]}
        >
          Programme perso
        </ProDayText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.segmentButton,
          activeTab === 'review' && [styles.segmentButtonActive, { borderColor: `${accent}40` }],
        ]}
        onPress={() => {
          prodayHaptics.selection();
          setActiveTab('review');
        }}
      >
        <ProDayText
          variant="caption"
          style={[
            styles.segmentText,
            activeTab === 'review' && { color: accent, fontWeight: '700' },
          ]}
        >
          Bilan mi-saison
        </ProDayText>
      </TouchableOpacity>
    </View>
  );

  const body = (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.pad, { paddingBottom: TAB_BAR_CONTENT_INSET + 24 }]}
      decelerationRate="normal"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
      }
    >
      {renderSegmentNav()}

      {activeTab === 'quests' ? (
        <>
          {/* Jauge d'XP & Rangs */}
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

          {/* Bouton feuille de route Bois -> Diamant */}
          <TouchableOpacity
            style={styles.roadmapBanner}
            onPress={() => {
              prodayHaptics.selection();
              setShowJourneyModal(true);
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="map" size={18} color="#00D2D3" style={{ marginRight: 10 }} />
              <View>
                <ProDayText variant="body" style={styles.roadmapTitle}>
                  Feuille de Route : Bois → Diamant
                </ProDayText>
                <ProDayText variant="caption" style={styles.roadmapSub}>
                  Consulte les jalons requis pour ton prochain rang
                </ProDayText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={PLAYER_DARK.textMuted} />
          </TouchableOpacity>

          {/* Quêtes en cours */}
          <View style={styles.sectionHeaderRow}>
            <ProDayText variant="title" style={styles.sectionHeading}>
              Quêtes Actives ({activeObjectives.length}/5)
            </ProDayText>
          </View>

          {activeObjectives.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={24} color={PLAYER_DARK.textMuted} />
              <ProDayText variant="body" style={styles.emptyText}>
                Aucune quête active pour l'instant. Choisis-en une ci-dessous pour démarrer ton entraînement.
              </ProDayText>
            </View>
          ) : (
            activeObjectives.map((obj) => (
              <ObjectiveCard
                key={obj.id}
                objective={obj}
                onExecuteAction={handleExecuteAction}
                onSubmitCompletion={handleSubmitCompletion}
              />
            ))
          )}

          {/* Quêtes disponibles au catalogue */}
          <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
            <ProDayText variant="title" style={styles.sectionHeading}>
              Objectifs recommandés à activer
            </ProDayText>
          </View>

          {availableObjectives.slice(0, 4).map((tpl) => (
            <View key={tpl.template_id} style={styles.catalogCard}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <ProDayText variant="body" style={styles.catalogTitle}>
                  {tpl.title}
                </ProDayText>
                <ProDayText variant="caption" style={styles.catalogDesc}>
                  {tpl.action_description}
                </ProDayText>
                <ProDayText variant="caption" style={styles.catalogMeta}>
                  +{tpl.xp_reward} XP • {tpl.measurable_condition}
                </ProDayText>
              </View>
              <TouchableOpacity
                style={styles.activateBtn}
                onPress={() => handleAcceptObjective(tpl.template_id)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={14} color="#00D2D3" style={{ marginRight: 2 }} />
                <ProDayText variant="caption" style={styles.activateBtnText}>
                  Activer
                </ProDayText>
              </TouchableOpacity>
            </View>
          ))}

          {/* Transparence & Grand Livre XP */}
          <TouchableOpacity
            style={styles.ledgerToggleBtn}
            onPress={() => setShowLedger(!showLedger)}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={14} color={PLAYER_DARK.textMuted} style={{ marginRight: 6 }} />
            <ProDayText variant="caption" style={styles.ledgerToggleText}>
              {showLedger ? 'Masquer le grand livre d’XP' : 'Afficher l’historique des XP (Grand livre)'}
            </ProDayText>
            <Ionicons
              name={showLedger ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={PLAYER_DARK.textMuted}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {showLedger ? (
            <View style={styles.ledgerBox}>
              <ProDayText variant="caption" style={styles.ledgerHeading}>
                HISTORIQUE AUDITÉ DES GAINS D’XP (ANTI-DOUBLONS)
              </ProDayText>
              {xpLedger.length === 0 ? (
                <ProDayText variant="caption" style={styles.ledgerEmptyText}>
                  Aucune transaction enregistrée.
                </ProDayText>
              ) : (
                xpLedger.map((entry) => (
                  <View key={entry.id} style={styles.ledgerRow}>
                    <View style={{ flex: 1 }}>
                      <ProDayText variant="caption" style={styles.ledgerEvent}>
                        {entry.source_event}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.ledgerStatus}>
                        {entry.completion_status} • {entry.awarded_at.toLocaleDateString('fr-FR')}
                      </ProDayText>
                    </View>
                    <ProDayText variant="caption" style={styles.ledgerAmount}>
                      +{entry.amount} XP
                    </ProDayText>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </>
      ) : null}

      {activeTab === 'individual' ? (
        <PlayerIndividualProgramsPanel
          playerUid={profile.uid}
          playerName={profile.display_name}
          clubId={profile.profile?.club_id || undefined}
        />
      ) : null}

      {activeTab === 'review' ? (
        <PlayerMidSeasonReviewPanel
          playerUid={profile.uid}
          playerName={profile.display_name}
          clubId={profile.profile?.club_id || 'sans_club'}
        />
      ) : null}

      {/* Modals */}
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

      <PlayerFeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        playerUid={profile.uid}
        playerName={profile.display_name}
        clubId={profile.profile?.club_id || undefined}
        initialSkillTopic={feedbackSkillTopic}
        initialKind="specific_skill"
      />
    </ScrollView>
  );

  if (embedded) return body;

  return (
    <JoueurScreenChrome
      title="Progression"
      subtitle="Parcours d'entraînement & développement"
    >
      {body}
    </JoueurScreenChrome>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: PLAYER_DARK.bg,
  },
  pad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  roadmapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 211, 0.25)',
    padding: 12,
    marginVertical: 8,
  },
  roadmapTitle: {
    color: PLAYER_DARK.text,
    fontSize: 13,
    fontWeight: '700',
  },
  roadmapSub: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionHeading: {
    color: PLAYER_DARK.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 12,
    marginBottom: 8,
  },
  catalogTitle: {
    color: PLAYER_DARK.text,
    fontSize: 13,
    fontWeight: '700',
  },
  catalogDesc: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  catalogMeta: {
    color: '#00D2D3',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 211, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 211, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activateBtnText: {
    color: '#00D2D3',
    fontWeight: '800',
    fontSize: 11,
  },
  ledgerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  ledgerToggleText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  ledgerBox: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    marginBottom: 20,
  },
  ledgerHeading: {
    color: PLAYER_DARK.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  ledgerEmptyText: {
    color: PLAYER_DARK.textDim,
    fontSize: 11,
    fontStyle: 'italic',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  ledgerEvent: {
    color: PLAYER_DARK.text,
    fontSize: 11,
    fontWeight: '600',
  },
  ledgerStatus: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
  },
  ledgerAmount: {
    color: '#00D2D3',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default PlayerProgressionScreen;

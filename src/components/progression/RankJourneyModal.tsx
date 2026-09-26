import React from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { RankEmblem, RANK_VISUAL_STYLES } from './RankEmblem';
import type { PlayerProgressionProfile, ProgressionRank } from '../../models/FootballProgression';
import { RANK_DEFINITIONS } from '../../config/footballProgressionRules';
import { footballProgressionService } from '../../services/footballProgression.service';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface RankJourneyModalProps {
  visible: boolean;
  onClose: () => void;
  profile: PlayerProgressionProfile;
}

const ALL_RANKS: ProgressionRank[] = ['wood', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const RankJourneyModal: React.FC<RankJourneyModalProps> = ({
  visible,
  onClose,
  profile,
}) => {
  const roadmap = footballProgressionService.getRankRoadmap(profile);
  const currentRankIdx = ALL_RANKS.indexOf(profile.rank);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ProDayText variant="title" style={styles.headerTitle}>
                Parcours Bois → Diamant
              </ProDayText>
              <ProDayText variant="caption" style={styles.headerSubtitle}>
                Progression personnelle & jalons de développement
              </ProDayText>
            </View>
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.selection();
                onClose();
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={PLAYER_DARK.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Défilement visuel des 6 Rangs */}
            <View style={styles.rankStrip}>
              {ALL_RANKS.map((r, idx) => {
                const def = RANK_DEFINITIONS[r];
                const visual = RANK_VISUAL_STYLES[r];
                const isCurrent = r === profile.rank;
                const isPassed = idx < currentRankIdx;

                return (
                  <View key={r} style={[styles.rankStep, isCurrent && styles.rankStepCurrent]}>
                    <RankEmblem rank={r} size="small" />
                    <ProDayText
                      variant="caption"
                      style={[
                        styles.rankStepName,
                        isCurrent && { color: visual.labelColor, fontWeight: '800' },
                        isPassed && { color: PLAYER_DARK.textMuted },
                      ]}
                    >
                      {def.name_fr}
                    </ProDayText>
                    {isPassed ? (
                      <Ionicons name="checkmark-circle" size={12} color="#10AC84" style={{ marginTop: 2 }} />
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* Carte de statut actuel */}
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <RankEmblem rank={profile.rank} size="medium" />
                <View style={styles.statusInfo}>
                  <ProDayText variant="section" style={styles.statusRankText}>
                    Rang actuel : {roadmap.currentRankDef.name_fr}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.statusMaterialText}>
                    {roadmap.currentRankDef.material_description}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.statusLevelText}>
                    Niveau {profile.level} • {profile.total_xp} XP cumulés
                  </ProDayText>
                </View>
              </View>
            </View>

            {/* Conditions pour le rang suivant */}
            {roadmap.nextRankDef ? (
              <View style={styles.nextRankCard}>
                <View style={styles.nextRankHeader}>
                  <Ionicons name="arrow-up-circle" size={16} color="#00D2D3" style={{ marginRight: 6 }} />
                  <ProDayText variant="section" style={styles.nextRankTitle}>
                    Objectif : Passer au Rang {roadmap.nextRankDef.name_fr}
                  </ProDayText>
                </View>

                {/* Condition 1: Niveau */}
                <View style={styles.reqItem}>
                  <Ionicons
                    name={roadmap.levelSatisfied ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={roadmap.levelSatisfied ? '#10AC84' : PLAYER_DARK.textMuted}
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="body" style={styles.reqTitle}>
                      Atteindre le Niveau {roadmap.nextRankDef.required_level}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.reqSub}>
                      Niveau actuel : {profile.level} / {roadmap.nextRankDef.required_level}
                    </ProDayText>
                  </View>
                </View>

                {/* Condition 2: Jalons obligatoires */}
                <ProDayText variant="caption" style={styles.milestonesSectionTitle}>
                  JALONS REQUIS DU RANG {roadmap.currentRankDef.name_fr.toUpperCase()} :
                </ProDayText>

                {roadmap.milestoneProgress.map((m) => (
                  <View key={m.key} style={styles.reqItem}>
                    <Ionicons
                      name={m.satisfied ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={m.satisfied ? '#10AC84' : '#FF9F43'}
                      style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ProDayText variant="body" style={styles.reqTitle}>
                          {m.title}
                        </ProDayText>
                        {m.requiresCoach ? (
                          <View style={styles.coachTag}>
                            <ProDayText variant="caption" style={styles.coachTagText}>
                              Validation coach
                            </ProDayText>
                          </View>
                        ) : null}
                      </View>
                      <ProDayText variant="caption" style={styles.reqSub}>
                        {m.description}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.reqProgressCount}>
                        Progression : {m.current} / {m.target}
                      </ProDayText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.maxRankBox}>
                <Ionicons name="sparkles" size={24} color="#70A1FF" style={{ marginBottom: 6 }} />
                <ProDayText variant="section" style={styles.maxRankTitle}>
                  Rang Diamant Atteint !
                </ProDayText>
                <ProDayText variant="caption" style={styles.maxRankSub}>
                  Tu as atteint le rang le plus élevé du parcours ProDay. Continue d'affiner tes compétences avec ton coach.
                </ProDayText>
              </View>
            )}

            {/* Avertissement & Philosophie */}
            <View style={styles.ethicalNotice}>
              <Ionicons name="information-circle-outline" size={14} color={PLAYER_DARK.textMuted} style={{ marginRight: 6, marginTop: 2 }} />
              <ProDayText variant="caption" style={styles.ethicalNoticeText}>
                Les rangs ProDay mesurent ton investissement personnel, ton assiduité aux séances et le suivi de tes axes de travail. Ils ne constituent pas un classement officiel FFF ni une garantie de détection.
              </ProDayText>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: PLAYER_DARK.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: PLAYER_DARK.border,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: PLAYER_DARK.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
  },
  rankStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  rankStep: {
    alignItems: 'center',
    flex: 1,
  },
  rankStepCurrent: {
    transform: [{ scale: 1.05 }],
  },
  rankStepName: {
    fontSize: 10,
    marginTop: 4,
    color: PLAYER_DARK.textSecondary,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 14,
    flex: 1,
  },
  statusRankText: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statusMaterialText: {
    color: '#00D2D3',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  statusLevelText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  nextRankCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 211, 0.25)',
    marginBottom: 16,
  },
  nextRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  nextRankTitle: {
    color: '#00D2D3',
    fontSize: 15,
    fontWeight: '800',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reqTitle: {
    color: PLAYER_DARK.text,
    fontSize: 13,
    fontWeight: '700',
  },
  reqSub: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  reqProgressCount: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  coachTag: {
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  coachTagText: {
    color: '#FF9F43',
    fontSize: 9,
    fontWeight: '700',
  },
  milestonesSectionTitle: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
  },
  maxRankBox: {
    backgroundColor: 'rgba(112, 161, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  maxRankTitle: {
    color: '#70A1FF',
    fontSize: 18,
    fontWeight: '900',
  },
  maxRankSub: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  ethicalNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  ethicalNoticeText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
});

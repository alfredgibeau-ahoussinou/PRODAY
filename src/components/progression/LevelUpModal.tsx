import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { RankEmblem, RANK_VISUAL_STYLES } from './RankEmblem';
import type { ProgressionRank } from '../../models/FootballProgression';
import { RANK_DEFINITIONS } from '../../config/footballProgressionRules';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface LevelUpModalProps {
  visible: boolean;
  onClose: () => void;
  level: number;
  rank: ProgressionRank;
  isRankPromotion?: boolean;
  unlockedTitle?: string;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  onClose,
  level,
  rank,
  isRankPromotion = false,
  unlockedTitle,
}) => {
  const visual = RANK_VISUAL_STYLES[rank] || RANK_VISUAL_STYLES.wood;
  const def = RANK_DEFINITIONS[rank] || RANK_DEFINITIONS.wood;

  const handleDismiss = () => {
    prodayHaptics.confirm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Badge discret d'accomplissement */}
          <View style={[styles.eyebrowBadge, { borderColor: `${visual.borderColor}60` }]}>
            <Ionicons
              name={isRankPromotion ? 'sparkles' : 'trending-up'}
              size={12}
              color={visual.labelColor}
              style={{ marginRight: 4 }}
            />
            <ProDayText variant="caption" style={[styles.eyebrowText, { color: visual.labelColor }]}>
              {isRankPromotion ? 'PROMOTION DE RANG' : 'PROGRESSION SPORTIVE'}
            </ProDayText>
          </View>

          {/* Emblème visuel avec texture matière */}
          <View style={styles.emblemWrapper}>
            <RankEmblem rank={rank} size="large" />
          </View>

          {/* Titre principal */}
          <ProDayText variant="hero" style={styles.heroText}>
            {isRankPromotion ? `Rang ${def.name_fr}` : `Niveau ${level}`}
          </ProDayText>

          <ProDayText variant="body" style={styles.subtitleText}>
            {isRankPromotion
              ? `Félicitations ! Tes jalons validés et ton investissement t'élèvent au rang ${def.name_fr}.`
              : `Nouvelle étape franchie dans ton parcours football. Ton engagement porte ses fruits.`}
          </ProDayText>

          {/* Titre honorifique débloqué */}
          {unlockedTitle ? (
            <View style={styles.unlockedBox}>
              <Ionicons name="ribbon-outline" size={16} color="#FFD700" style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <ProDayText variant="caption" style={styles.unlockedLabel}>
                  Nouveau titre honorifique :
                </ProDayText>
                <ProDayText variant="caption" style={styles.unlockedTitle}>
                  « {unlockedTitle} »
                </ProDayText>
              </View>
            </View>
          ) : null}

          {/* Avertissement éthique et clarté */}
          <ProDayText variant="caption" style={styles.disclaimerText}>
            Cette progression récompense ton développement et ton assiduité dans ProDay.
          </ProDayText>

          {/* Bouton Continuer */}
          <TouchableOpacity style={styles.continueButton} onPress={handleDismiss} activeOpacity={0.8}>
            <ProDayText variant="caption" style={styles.continueButtonText}>
              Continuer mon parcours
            </ProDayText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  eyebrowText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  emblemWrapper: {
    marginVertical: 12,
  },
  heroText: {
    color: PLAYER_DARK.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  unlockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 16,
  },
  unlockedLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  unlockedTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
  disclaimerText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 14,
  },
  continueButton: {
    backgroundColor: '#003399',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

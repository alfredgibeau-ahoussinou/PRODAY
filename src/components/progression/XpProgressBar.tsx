import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { RankEmblem, RANK_VISUAL_STYLES } from './RankEmblem';
import type { ProgressionRank } from '../../models/FootballProgression';
import { RANK_DEFINITIONS } from '../../config/footballProgressionRules';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

interface XpProgressBarProps {
  level: number;
  rank: ProgressionRank;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentTitle?: string;
  onPressRank?: () => void;
}

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  level,
  rank,
  totalXp,
  xpIntoLevel,
  xpForNextLevel,
  currentTitle,
  onPressRank,
}) => {
  const percent = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpForNextLevel) * 100)));
  const visual = RANK_VISUAL_STYLES[rank] || RANK_VISUAL_STYLES.wood;
  const def = RANK_DEFINITIONS[rank] || RANK_DEFINITIONS.wood;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.rankTouchable}
          onPress={onPressRank}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Rang ${def.name_fr}. Appuyer pour voir la feuille de route`}
        >
          <RankEmblem rank={rank} size="small" />
          <View style={styles.rankInfo}>
            <View style={styles.rankBadge}>
              <ProDayText variant="caption" style={[styles.rankLabel, { color: visual.labelColor }]}>
                Rang {def.name_fr}
              </ProDayText>
            </View>
            {currentTitle ? (
              <ProDayText variant="caption" style={styles.titleLabel} numberOfLines={1}>
                {currentTitle}
              </ProDayText>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.levelBadge}>
          <ProDayText variant="title" style={styles.levelNumber}>
            NIV. {level}
          </ProDayText>
          <ProDayText variant="caption" style={styles.xpTotal}>
            {totalXp} XP
          </ProDayText>
        </View>
      </View>

      {/* Barre de progression XP */}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percent}%`,
              backgroundColor: visual.borderColor,
            },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <ProDayText variant="caption" style={styles.progressText}>
          {xpIntoLevel} / {xpForNextLevel} XP ({percent}%)
        </ProDayText>
        <ProDayText variant="caption" style={styles.nextLevelGoal}>
          {xpForNextLevel - xpIntoLevel} XP jusqu'au Niv. {level + 1}
        </ProDayText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 14,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rankInfo: {
    marginLeft: 10,
    flex: 1,
  },
  rankBadge: {
    alignSelf: 'flex-start',
  },
  rankLabel: {
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleLabel: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  levelBadge: {
    alignItems: 'flex-end',
  },
  levelNumber: {
    color: PLAYER_DARK.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  xpTotal: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  nextLevelGoal: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});

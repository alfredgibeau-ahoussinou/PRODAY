import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProgressionRank } from '../../models/FootballProgression';
import { RANK_DEFINITIONS } from '../../config/footballProgressionRules';

interface RankEmblemProps {
  rank: ProgressionRank;
  size?: 'small' | 'medium' | 'large' | 'hero';
  showLabel?: boolean;
}

export const RANK_VISUAL_STYLES: Record<
  ProgressionRank,
  {
    bgGradient: [string, string];
    borderColor: string;
    iconColor: string;
    iconName: keyof typeof Ionicons.glyphMap;
    labelColor: string;
    shapeStyle: 'wood_shield' | 'bronze_ribbon' | 'silver_crest' | 'gold_trophy' | 'platinum_hex' | 'diamond_star';
    textureTag: string;
  }
> = {
  wood: {
    bgGradient: ['#3A2312', '#241408'],
    borderColor: '#8B5A2B',
    iconColor: '#D2B48C',
    iconName: 'shield',
    labelColor: '#D2B48C',
    shapeStyle: 'wood_shield',
    textureTag: 'Bois naturel',
  },
  bronze: {
    bgGradient: ['#4A2E1B', '#2A180C'],
    borderColor: '#CD7F32',
    iconColor: '#FFA07A',
    iconName: 'ribbon',
    labelColor: '#CD7F32',
    shapeStyle: 'bronze_ribbon',
    textureTag: 'Bronze martelé',
  },
  silver: {
    bgGradient: ['#2F3640', '#1E272C'],
    borderColor: '#BDC3C7',
    iconColor: '#ECF0F1',
    iconName: 'medal',
    labelColor: '#ECF0F1',
    shapeStyle: 'silver_crest',
    textureTag: 'Argent brossé',
  },
  gold: {
    bgGradient: ['#4A3B00', '#2E2400'],
    borderColor: '#FFD700',
    iconColor: '#FFEAA7',
    iconName: 'trophy',
    labelColor: '#FFD700',
    shapeStyle: 'gold_trophy',
    textureTag: 'Or poli',
  },
  platinum: {
    bgGradient: ['#003844', '#001E24'],
    borderColor: '#00D2D3',
    iconColor: '#54A0FF',
    iconName: 'diamond',
    labelColor: '#00D2D3',
    shapeStyle: 'platinum_hex',
    textureTag: 'Platine cyan',
  },
  diamond: {
    bgGradient: ['#1A2A6C', '#0C1033'],
    borderColor: '#70A1FF',
    iconColor: '#FFFFFF',
    iconName: 'sparkles',
    labelColor: '#70A1FF',
    shapeStyle: 'diamond_star',
    textureTag: 'Diamant facetté',
  },
};

export const RankEmblem: React.FC<RankEmblemProps> = ({
  rank,
  size = 'medium',
  showLabel = false,
}) => {
  const visual = RANK_VISUAL_STYLES[rank] || RANK_VISUAL_STYLES.wood;
  const def = RANK_DEFINITIONS[rank] || RANK_DEFINITIONS.wood;

  const sizeMetrics = {
    small: { containerSize: 32, iconSize: 16, fontSize: 10, borderWidth: 1.5, radius: 8 },
    medium: { containerSize: 48, iconSize: 24, fontSize: 12, borderWidth: 2, radius: 12 },
    large: { containerSize: 72, iconSize: 36, fontSize: 14, borderWidth: 2.5, radius: 18 },
    hero: { containerSize: 96, iconSize: 48, fontSize: 16, borderWidth: 3, radius: 24 },
  }[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            width: sizeMetrics.containerSize,
            height: sizeMetrics.containerSize,
            borderRadius: sizeMetrics.radius,
            borderColor: visual.borderColor,
            borderWidth: sizeMetrics.borderWidth,
            backgroundColor: visual.bgGradient[0],
          },
        ]}
      >
        <Ionicons name={visual.iconName} size={sizeMetrics.iconSize} color={visual.iconColor} />
      </View>

      {showLabel ? (
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: visual.labelColor, fontSize: sizeMetrics.fontSize }]}>
            {def.name_fr}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  labelContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  labelText: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

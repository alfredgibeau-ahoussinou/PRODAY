import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';

interface MatchChapterIntroProps {
  kicker?: string;
  title: string;
  subtitle: string;
}

/** En-tête de chapitre Match Center — kicker + titre + support. */
export const MatchChapterIntro: React.FC<MatchChapterIntroProps> = ({
  kicker = 'Centre Match',
  title,
  subtitle,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <ProDayText variant="caption" style={[styles.kicker, { color: colors.accent }]}>
        {kicker}
      </ProDayText>
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      <ProDayText variant="caption" style={styles.subtitle}>
        {subtitle}
      </ProDayText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    gap: 4,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 22,
    color: MATCH_SITE.foreground,
  },
  subtitle: {
    lineHeight: 18,
    color: MATCH_SITE.muted,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { spacing } from '../../theme/designTokens';

interface MatchChapterIntroProps {
  title: string;
  subtitle: string;
}

/** En-tête de chapitre Match — titre + sous-titre unifiés. */
export const MatchChapterIntro: React.FC<MatchChapterIntroProps> = ({ title, subtitle }) => (
  <View style={styles.wrap}>
    <ProDayText variant="section" style={styles.title}>
      {title}
    </ProDayText>
    <ProDayText variant="body" muted style={styles.subtitle}>
      {subtitle}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: 4,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    lineHeight: 22,
  },
});

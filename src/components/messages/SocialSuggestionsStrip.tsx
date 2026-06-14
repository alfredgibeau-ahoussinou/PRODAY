import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { SocialProfileSuggestion } from '../../features/v3/engines/socialRecommendation.engine';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

interface SocialSuggestionsStripProps {
  suggestions: SocialProfileSuggestion[];
  onPress: (suggestion: SocialProfileSuggestion) => void;
}

/** Bandeau contacts recommandés — réseau IA (Messages V3). */
export const SocialSuggestionsStrip: React.FC<SocialSuggestionsStripProps> = ({
  suggestions,
  onPress,
}) => {
  const { colors } = useAppTheme();

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ProDayText variant="caption" muted style={styles.label}>
        Réseau recommandé
      </ProDayText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {suggestions.map((item) => (
          <PressableSpring
            key={item.id}
            onPress={() => onPress(item)}
            scaleTo={0.97}
            haptic
          >
            <GlassCard variant="default" style={[styles.card, { borderColor: colors.border }]}>
              <ProDayText variant="caption" accent style={styles.score}>
                {item.matchScore}%
              </ProDayText>
              <ProDayText variant="section" numberOfLines={1} style={styles.name}>
                {item.displayName}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={1}>
                {item.role}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={2} style={styles.reason}>
                {item.reason}
              </ProDayText>
            </GlassCard>
          </PressableSpring>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  card: {
    width: 168,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  score: { fontWeight: '900', fontSize: 11 },
  name: { fontSize: 14 },
  reason: { marginTop: 2, lineHeight: 16 },
});

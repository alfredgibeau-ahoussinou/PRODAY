import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';
import type { Recommendation } from '../models/recommendations';

interface RecommendationStripProps {
  items: Recommendation[];
  onItemPress: (item: Recommendation) => void;
}

export const RecommendationStrip: React.FC<RecommendationStripProps> = ({
  items,
  onItemPress,
}) => {
  const { colors } = useAppTheme();
  if (items.length === 0) return null;

  return (
    <View style={styles.shell}>
      <ProDayText variant="eyebrow" muted style={styles.label}>
        Recommandé pour vous
      </ProDayText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <PressableSpring
            key={item.id}
            onPress={() => onItemPress(item)}
            scaleTo={0.97}
            haptic
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <ProDayText variant="caption" accent style={styles.score}>
              {item.score}%
            </ProDayText>
            <ProDayText variant="caption" accent style={styles.title} numberOfLines={2}>
              {item.title}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={2} style={styles.sub}>
              {item.subtitle}
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.reason} numberOfLines={1}>
              {item.reason}
            </ProDayText>
          </PressableSpring>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.md, gap: spacing.sm },
  label: { paddingHorizontal: spacing.lg, fontSize: 10, letterSpacing: 2 },
  row: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: {
    width: 160,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  score: { fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  title: { fontWeight: '700', fontSize: 12, lineHeight: 16 },
  sub: { fontSize: 11, lineHeight: 14 },
  reason: { fontSize: 9, marginTop: 2 },
});

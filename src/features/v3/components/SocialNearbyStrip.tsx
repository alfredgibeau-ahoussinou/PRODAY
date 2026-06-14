import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { formatDistanceKm } from '../../../utils/geoLocation';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';
import type { SocialProfileSuggestion } from '../engines/socialRecommendation.engine';

interface SocialNearbyStripProps {
  items: SocialProfileSuggestion[];
  onItemPress?: (item: SocialProfileSuggestion) => void;
}

export const SocialNearbyStrip: React.FC<SocialNearbyStripProps> = ({ items, onItemPress }) => {
  const { colors } = useAppTheme();
  if (items.length === 0) return null;

  return (
    <View style={styles.shell}>
      <ProDayText variant="eyebrow" muted style={styles.label}>
        Social · Proches
      </ProDayText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <PressableSpring
            key={item.id}
            onPress={() => onItemPress?.(item)}
            scaleTo={0.97}
            haptic
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.score, { backgroundColor: colors.accentSoft }]}>
              <ProDayText variant="caption" accent style={styles.scoreText}>
                {item.matchScore}%
              </ProDayText>
            </View>
            <ProDayText variant="caption" accent style={styles.name} numberOfLines={1}>
              {item.displayName}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={1}>
              {item.role}
            </ProDayText>
            <View style={styles.meta}>
              <Icon name="walk" size={12} color={colors.textMuted} />
              <ProDayText variant="caption" muted style={styles.metaText}>
                {item.distanceKm != null ? formatDistanceKm(item.distanceKm) : item.city}
              </ProDayText>
            </View>
          </PressableSpring>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.md, gap: spacing.sm },
  label: { paddingHorizontal: spacing.lg, fontSize: 10, letterSpacing: 2.2 },
  row: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: {
    width: 140,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  score: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 2,
  },
  scoreText: { fontWeight: '800', fontSize: 10 },
  name: { fontWeight: '700', fontSize: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 10 },
});

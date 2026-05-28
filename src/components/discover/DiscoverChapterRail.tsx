import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DISCOVER_CHAPTERS, type DiscoverChapterId } from '../../content/discoverChapters';
import { PressableSpring } from './PressableSpring';
import { colors, spacing, radius } from '../../theme/designTokens';

interface DiscoverChapterRailProps {
  active: DiscoverChapterId;
  onSelect: (id: DiscoverChapterId) => void;
}

export const DiscoverChapterRail: React.FC<DiscoverChapterRailProps> = ({
  active,
  onSelect,
}) => (
  <View style={styles.wrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {DISCOVER_CHAPTERS.map((ch) => {
        const on = ch.id === active;
        return (
          <PressableSpring
            key={ch.id}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onSelect(ch.id)}
            scaleTo={0.96}
          >
            <Text style={[styles.chipNum, on && styles.chipNumOn]}>{ch.short}</Text>
            <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{ch.label}</Text>
          </PressableSpring>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rail: {
    gap: 4,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  chipOn: {
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  chipNum: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
  },
  chipNumOn: { color: colors.accent },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipLabelOn: { color: colors.text, fontWeight: '700' },
});

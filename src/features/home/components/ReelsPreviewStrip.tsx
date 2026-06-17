import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

export type ReelPreviewItem = {
  id: string;
  author: string;
  tag: string;
  usefulnessScore: number;
};

interface ReelsPreviewStripProps {
  items: ReelPreviewItem[];
  onPress: () => void;
}

/** Aperçu réels filtrés par l’IA (spec §11). */
export const ReelsPreviewStrip: React.FC<ReelsPreviewStripProps> = ({ items, onPress }) => {
  const { colors } = useAppTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.shell}>
      <View style={styles.titleRow}>
        <ProDayText variant="section">Réels pour vous</ProDayText>
        <PressableSpring onPress={onPress} scaleTo={0.98}>
          <ProDayText variant="caption" accent style={styles.link}>
            Voir tout
          </ProDayText>
        </PressableSpring>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {items.map((item) => (
          <PressableSpring key={item.id} onPress={onPress} scaleTo={0.97}>
            <GlassCard variant="default" style={styles.card}>
              <View style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}>
                <Icon name="videocam" size={24} color={colors.accent} />
              </View>
              <ProDayText variant="caption" numberOfLines={1} style={styles.author}>
                {item.author}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={1}>
                {item.tag}
              </ProDayText>
            </GlassCard>
          </PressableSpring>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.lg },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  link: { fontWeight: '600' },
  scroll: { gap: spacing.sm },
  card: { width: 140, padding: spacing.sm, gap: 4 },
  thumb: {
    height: 88,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  author: { fontWeight: '600' },
});

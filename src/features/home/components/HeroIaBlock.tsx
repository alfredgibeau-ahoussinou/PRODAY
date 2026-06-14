import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import type { HeroIaState } from '../../../core/types/ai';
import { spacing, radius } from '../../../theme/designTokens';

interface HeroIaBlockProps {
  state: HeroIaState;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
}

const STATE_LABELS: Record<HeroIaState, string> = {
  MATCH_RECOMMENDATION: 'Match',
  TRAINING_RECOMMENDATION: 'Entraînement',
  REST_RECOMMENDATION: 'Repos',
  SOCIAL_RECOMMENDATION: 'Réseau',
};

/** Bloc Hero IA — une seule action principale (spec §4.2). */
export const HeroIaBlock: React.FC<HeroIaBlockProps> = ({
  state,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <GlassCard variant="accent" style={styles.card}>
      <View style={[styles.statePill, { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted }]}>
        <ProDayText variant="caption" accent style={styles.stateText}>
          {STATE_LABELS[state]}
        </ProDayText>
      </View>
      <ProDayText variant="title" style={styles.title}>
        {title}
      </ProDayText>
      <ProDayText variant="body" muted style={styles.description}>
        {description}
      </ProDayText>
      <View style={styles.actions}>
        <PressableSpring onPress={onPrimaryPress} style={[styles.primaryBtn, { backgroundColor: colors.accent }]} scaleTo={0.98} haptic>
          <ProDayText variant="caption" inverse style={styles.primaryLabel}>
            {primaryLabel}
          </ProDayText>
        </PressableSpring>
        {secondaryLabel && onSecondaryPress ? (
          <PressableSpring
            onPress={onSecondaryPress}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            scaleTo={0.98}
            haptic
          >
            <ProDayText variant="caption" accent style={styles.secondaryLabel}>
              {secondaryLabel}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  statePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  stateText: { fontWeight: '700', letterSpacing: 1.2, fontSize: 10 },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  description: { lineHeight: 22 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  primaryLabel: { fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  secondaryLabel: { fontWeight: '600' },
});

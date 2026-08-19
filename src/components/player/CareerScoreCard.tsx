import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { AnimatedEntrance } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import type { CareerProgressionResult } from '../../utils/careerProgressionScore';
import { spacing, radius } from '../../theme/designTokens';

interface CareerScoreCardProps {
  career: CareerProgressionResult;
}

/** Score carrière calculé à partir de stats et activités réelles. */
export const CareerScoreCard: React.FC<CareerScoreCardProps> = ({ career }) => {
  const { colors } = useAppTheme();
  const playerColors = usePlayerThemeColors();
  const { t } = useTranslation();

  const label =
    career.total >= 75
      ? t('career.score.label.strong')
      : career.total >= 50
        ? t('career.score.label.progress')
        : t('career.score.label.start');

  return (
    <AnimatedEntrance kind="fadeUp">
      <GlassCard variant="default" style={styles.card}>
        <View style={styles.header}>
          <View>
            <ProDayText variant="caption" muted style={styles.eyebrow}>
              {t('career.score.title')}
            </ProDayText>
            <ProDayText variant="section">{label}</ProDayText>
          </View>
          <View style={[styles.ring, { borderColor: playerColors.accent, backgroundColor: playerColors.accentSoft }]}>
            <ProDayText variant="hero" accent style={styles.scoreNum}>
              {career.total}
            </ProDayText>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.fill,
              { width: `${career.total}%`, backgroundColor: playerColors.accent },
            ]}
          />
        </View>

        <View style={styles.facets}>
          {career.facets.map((facet) => (
            <View key={facet.id} style={styles.facetRow}>
              <ProDayText variant="caption" muted style={styles.facetLabel}>
                {facet.label}
              </ProDayText>
              <ProDayText variant="caption" accent style={styles.facetScore}>
                {facet.score}%
              </ProDayText>
            </View>
          ))}
        </View>
      </GlassCard>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1, fontSize: 9 },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  facets: { gap: spacing.xs, marginTop: spacing.xs },
  facetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  facetLabel: { flex: 1 },
  facetScore: { fontWeight: '700' },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

const V3_FEATURES = [
  { icon: 'star-four-points' as const, title: 'Hero IA', detail: 'Sachez quoi faire dès l’ouverture' },
  { icon: 'football' as const, title: 'Matchs compatibles', detail: 'Scores santé + niveau + distance' },
  { icon: 'heart' as const, title: 'Santé connectée', detail: 'Récupération liée à vos matchs' },
];

/** Aperçu marketing V3 pour invités Discover. */
export const DiscoverV3Teaser: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <ProDayText variant="eyebrow" muted style={styles.eyebrow}>
        ProDay Intelligence
      </ProDayText>
      <GlassCard variant="default" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="section" style={styles.title}>
          L’app qui s’adapte à vous
        </ProDayText>
        <ProDayText variant="body" muted style={styles.sub}>
          Inscrivez-vous pour débloquer le cockpit IA : matchs, santé, mercato et progression.
        </ProDayText>
        <View style={styles.list}>
          {V3_FEATURES.map((feature) => (
            <View key={feature.title} style={styles.row}>
              <Icon name={feature.icon} size={18} color={colors.accent} />
              <View style={styles.copy}>
                <ProDayText variant="caption" accent>
                  {feature.title}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {feature.detail}
                </ProDayText>
              </View>
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  title: { fontSize: 18 },
  sub: { lineHeight: 20 },
  list: { gap: spacing.sm, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  copy: { flex: 1, gap: 2 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PRODAY_PILLARS } from '../../content/competitiveAdvantages';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from './PressableSpring';
import { colors, spacing, radius } from '../../theme/designTokens';

interface ProDayPillarsSectionProps {
  onPress?: () => void;
}

/** Pourquoi ProDay — piliers produit propriétaires. */
export const ProDayPillarsSection: React.FC<ProDayPillarsSectionProps> = ({
  onPress,
}) => (
  <View style={styles.wrap}>
    <DiscoverSectionHeader
      label="POURQUOI PRODAY"
      title="Le foot amateur, réinventé"
      subtitle="ProDay réunit carrière, club et communauté dans une expérience pensée pour progresser."
    />
    <View style={styles.grid}>
      {PRODAY_PILLARS.map((pillar) => (
        <PressableSpring key={pillar.id} onPress={onPress} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Icon name={pillar.icon as IconName} size={20} color={colors.accent} />
            </View>
            <View style={styles.titles}>
              <Text style={styles.cardTitle}>{pillar.title}</Text>
              <Text style={styles.cardSub}>{pillar.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{pillar.description}</Text>
        </PressableSpring>
      ))}
    </View>
  </View>
);

/** Alias historique */
export const CompetitiveEdgeSection = ProDayPillarsSection;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg },
  grid: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  titles: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
  cardSub: { fontSize: 11, fontWeight: '800', color: colors.accent, marginTop: 2 },
  cardDesc: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
});

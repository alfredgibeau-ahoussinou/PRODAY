import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PRODAY_PILLARS } from '../../content/competitiveAdvantages';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

interface ProDayPillarsSectionProps {
  onPress?: () => void;
}

/** Pourquoi ProDay — piliers produit propriétaires. */
export const ProDayPillarsSection: React.FC<ProDayPillarsSectionProps> = ({
  onPress,
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
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
                <Icon name={pillar.icon as IconName} size={20} color={c.brand} />
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
};

/** Alias historique */
export const CompetitiveEdgeSection = ProDayPillarsSection;

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { paddingHorizontal: spacing.lg },
    grid: { gap: spacing.sm },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
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
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.brand,
    },
    titles: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '900', color: c.text },
    cardSub: { fontSize: 11, fontWeight: '800', color: c.brand, marginTop: 2 },
    cardDesc: { fontSize: 13, lineHeight: 19, color: c.textSecondary },
  });
}

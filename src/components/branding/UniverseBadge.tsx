import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getUniverseIdentity } from '../../content/brandExperience';
import type { ProductLineId } from '../../models/ProductLine';
import type { AppColors } from '../../theme/universeTheme';
import { radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface UniverseBadgeProps {
  productLine: ProductLineId;
  colors: AppColors;
  compact?: boolean;
}

/** Badge univers — même forme Homme / Woman / Pro, couleurs et libellé adaptés. */
export const UniverseBadge: React.FC<UniverseBadgeProps> = ({
  productLine,
  colors,
  compact,
}) => {
  const brand = getUniverseIdentity(productLine);
  return (
    <View
      style={[
        styles.pill,
        compact && styles.pillCompact,
        {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accentMuted,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
      <Text style={[styles.label, { color: colors.ink }]}>{brand.accentLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fontFamily.extrabold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

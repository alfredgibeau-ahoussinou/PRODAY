import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Logo } from '../Logo';
import { BRAND, colors, spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { brandForProductLine } from '../../models/ProductLine';

interface AuthBrandHeaderProps {
  width?: number;
  /** Clair (#F7F7F7 / blanc) ou bandeau sombre (pitch legacy) */
  tone?: 'light' | 'dark';
  /**
   * Tagline en texte natif — désactivé par défaut (intégrée au PNG hero sur fond sombre).
   */
  showTagline?: boolean;
}

/**
 * Logo ProDay — variante selon l’univers actif (Man / Woman / Pro).
 */
export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({
  width = 220,
  tone = 'dark',
  showTagline = false,
}) => {
  const { productLine } = useAppTheme();
  const isLight = tone === 'light';
  const background = isLight ? 'light' : 'dark';
  const brand = brandForProductLine(productLine);

  const logo = (
    <Logo
      background={background}
      width={width}
      showTagline={false}
      productLine={productLine}
    />
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.logoSlot}>{logo}</View>
      {showTagline ? (
        <Text
          style={[styles.tagline, !isLight && styles.taglineDark]}
          accessibilityRole="text"
        >
          {productLine === 'homme' ? BRAND.tagline : brand.tagline}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.sm,
  },
  logoSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    textAlign: 'center',
  },
  taglineDark: {
    color: colors.heroMuted,
    letterSpacing: 2.2,
    fontSize: 10,
    marginTop: spacing.md,
  },
});

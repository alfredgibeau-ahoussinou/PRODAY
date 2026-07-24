import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Logo } from '../Logo';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { brandForAuthContext, isSponsorAuthPreset } from '../../utils/authBrandContext';
import type { AppColors } from '../../theme/universeTheme';

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
 * Logo ProDay — variante selon l'univers actif (Man / Woman / Pro / Sponsor).
 */
export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({
  width = 220,
  tone = 'dark',
  showTagline = false,
}) => {
  const { productLine, colors: c, proSignupPresetRole } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const isLight = tone === 'light';
  const background = isLight ? 'light' : 'dark';
  const isSponsor = isSponsorAuthPreset(proSignupPresetRole);
  const brand = brandForAuthContext(productLine, proSignupPresetRole);

  const logo = (
    <Logo
      background={background}
      width={width}
      showTagline={false}
      productLine={productLine}
      sponsor={isSponsor}
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
          {brand.tagline}
        </Text>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
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
      color: c.textMuted,
      textAlign: 'center',
    },
    taglineDark: {
      color: c.heroMuted,
      letterSpacing: 2.2,
      fontSize: 10,
      marginTop: spacing.md,
    },
  });
}

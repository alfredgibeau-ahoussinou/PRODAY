import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Logo } from '../Logo';
import { BRAND, colors, spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

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
 * Logo ProDay — clair (connexion) ou hero transparent (bandeau noir legacy).
 */
export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({
  width = 220,
  tone = 'dark',
  showTagline = false,
}) => {
  const { isWoman } = useAppTheme();
  const isLight = tone === 'light';

  return (
    <View style={styles.wrap}>
      <View style={styles.logoSlot}>
        <Logo
          background={isLight ? 'light' : 'dark'}
          variant={isLight ? 'light' : 'transparent'}
          width={width}
          showTagline={false}
          woman={isWoman}
        />
      </View>
      {showTagline ? (
        <Text
          style={[styles.tagline, !isLight && styles.taglineDark]}
          accessibilityRole="text"
        >
          {BRAND.tagline}
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

import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { BRAND, colors, typography, spacing } from '../theme/designTokens';

type LogoVariant = 'light' | 'dark';

interface LogoProps {
  variant?: LogoVariant;
  width?: number;
  showTagline?: boolean;
}

const LOGO_SOURCES: Record<LogoVariant, ImageSourcePropType> = {
  light: require('../../assets/branding/logo-light.png'),
  dark: require('../../assets/branding/logo-dark.png'),
};

/** Ratio du fichier logo (largeur / hauteur) */
const LOGO_ASPECT = 2.1;

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  width = 200,
  showTagline = false,
}) => {
  const source = LOGO_SOURCES[variant];
  const height = width / LOGO_ASPECT;

  return (
    <View style={styles.wrap}>
      <Image source={source} style={{ width, height }} resizeMode="contain" accessibilityLabel={BRAND.name} />
      {showTagline && (
        <Text
          style={[
            styles.tagline,
            variant === 'dark' ? styles.taglineOnDark : styles.taglineOnLight,
          ]}
        >
          {BRAND.tagline}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  tagline: {
    fontSize: typography.sizes.caption,
    letterSpacing: 1.2,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  taglineOnLight: { color: colors.navySoft },
  taglineOnDark: { color: colors.textMuted },
});

export default Logo;

import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { BRAND, colors, typography, spacing } from '../theme/designTokens';

type LogoVariant = 'light' | 'dark' | 'wordmark';

interface LogoProps {
  variant?: LogoVariant;
  width?: number;
  showTagline?: boolean;
}

const LOGO_SOURCES: Record<'light' | 'dark', ImageSourcePropType> = {
  light: require('../../assets/branding/logo-light.png'),
  dark: require('../../assets/branding/logo-dark.png'),
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  width = 200,
  showTagline = true,
}) => {
  if (variant === 'wordmark') {
    return (
      <View style={styles.wordmarkWrap}>
        <Text style={styles.wordmarkPro}>Pro</Text>
        <Text style={styles.wordmarkDay}>Day</Text>
        {showTagline && <Text style={styles.tagline}>{BRAND.tagline}</Text>}
      </View>
    );
  }

  const source = LOGO_SOURCES[variant];
  const height = width * 0.55;

  return (
    <View style={styles.wrap}>
      <Image source={source} style={{ width, height }} resizeMode="contain" />
      {showTagline && variant === 'light' && (
        <Text style={[styles.tagline, styles.taglineOnLight]}>{BRAND.tagline}</Text>
      )}
      {showTagline && variant === 'dark' && (
        <Text style={[styles.tagline, styles.taglineOnDark]}>{BRAND.tagline}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wordmarkWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    transform: [{ skewX: typography.brandSlant }],
  },
  wordmarkPro: {
    fontSize: 32,
    fontWeight: typography.weights.extrabold,
    color: colors.navy,
    fontStyle: 'italic',
  },
  wordmarkDay: {
    fontSize: 32,
    fontWeight: typography.weights.extrabold,
    color: colors.blueBright,
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: typography.sizes.caption,
    letterSpacing: 1.2,
    marginTop: spacing.sm,
    textAlign: 'center',
    width: '100%',
  },
  taglineOnLight: { color: colors.navySoft },
  taglineOnDark: { color: colors.textMuted },
});

export default Logo;

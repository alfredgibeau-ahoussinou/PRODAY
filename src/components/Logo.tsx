import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { BRAND, colors, typography, spacing } from '../theme/designTokens';
import { BRANDING_LOGOS } from '../content/brandingAssets';

/** Fond derrière le logo — choisit automatiquement transparent ou non */
export type LogoBackground = 'light' | 'dark' | 'photo';

/** Variante forcée (optionnel) */
export type LogoVariant =
  | 'light'
  | 'dark'
  | 'transparent'
  | 'transparentDark'
  | 'mark';

interface LogoProps {
  /** Fond blanc/clair → logo classique · fond sombre/photo → logo transparent */
  background?: LogoBackground;
  variant?: LogoVariant;
  width?: number;
  showTagline?: boolean;
  /** Filigrane discret (uniquement sur photo) */
  watermark?: boolean;
  opacity?: number;
}

const LOGO_SOURCES: Record<LogoVariant, ImageSourcePropType> = {
  light: BRANDING_LOGOS.light,
  dark: BRANDING_LOGOS.dark,
  transparent: BRANDING_LOGOS.transparent,
  transparentDark: BRANDING_LOGOS.transparentDark,
  mark: BRANDING_LOGOS.mark,
};

const LOGO_ASPECT: Record<LogoVariant, number> = {
  light: 1.066,
  dark: 1.003,
  transparent: 0.93,
  transparentDark: 0.946,
  mark: 1.813,
};

/** Transparent seulement si le fond n’est pas blanc. */
export function logoVariantForBackground(bg: LogoBackground, watermark = false): LogoVariant {
  if (watermark) return 'mark';
  switch (bg) {
    case 'light':
      return 'light';
    case 'dark':
    case 'photo':
      return 'transparent';
    default:
      return 'light';
  }
}

export const Logo: React.FC<LogoProps> = ({
  background = 'light',
  variant,
  width = 200,
  showTagline = false,
  watermark = false,
  opacity,
}) => {
  const resolved = variant ?? logoVariantForBackground(background, watermark);
  const source = LOGO_SOURCES[resolved];
  const height = width / LOGO_ASPECT[resolved];
  const imageOpacity = opacity ?? (watermark ? 0.14 : 1);
  const onLightBg = resolved === 'light' || resolved === 'dark';

  return (
    <View style={[styles.wrap, watermark && styles.watermarkWrap]}>
      <Image
        source={source}
        style={{ width, height, opacity: imageOpacity }}
        resizeMode="contain"
        accessibilityLabel={BRAND.name}
      />
      {showTagline && !watermark && (
        <Text
          style={[
            styles.tagline,
            onLightBg ? styles.taglineOnLight : styles.taglineOnDark,
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
  watermarkWrap: {
    pointerEvents: 'none',
  },
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

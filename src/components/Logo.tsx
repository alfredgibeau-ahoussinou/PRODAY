import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { BRAND, colors, typography, spacing } from '../theme/designTokens';
import { BRANDING_LOGOS, WOMAN_BRANDING_LOGOS } from '../content/brandingAssets';
import { PRODAY_WOMAN_BRAND } from '../models/ProductLine';
import { useAppTheme } from '../context/ProductLineContext';
import { WomanLogo, womanLogoAspect } from './WomanLogo';

/** Fond derrière le logo — choisit automatiquement transparent ou non */
export type LogoBackground = 'light' | 'dark' | 'photo';

/** Variante forcée (optionnel) */
export type LogoVariant =
  | 'light'
  | 'dark'
  | 'transparent'
  | 'transparentDark'
  | 'authDark'
  | 'mark';

interface LogoProps {
  background?: LogoBackground;
  variant?: LogoVariant;
  width?: number;
  showTagline?: boolean;
  watermark?: boolean;
  opacity?: number;
  woman?: boolean;
}

const LOGO_ASPECT: Record<LogoVariant, number> = {
  light: 1.066,
  dark: 1.003,
  transparent: 0.93,
  transparentDark: 0.946,
  authDark: 0.93,
  mark: 1.813,
};

export function logoVariantForBackground(bg: LogoBackground, watermark = false): LogoVariant {
  if (watermark) return 'mark';
  switch (bg) {
    case 'light':
      return 'light';
    case 'dark':
      return 'transparent';
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
  woman: womanProp,
}) => {
  const { isWoman } = useAppTheme();
  const isWomanLogo = womanProp ?? isWoman;
  const resolved = variant ?? logoVariantForBackground(background, watermark);

  if (isWomanLogo) {
    if (resolved === 'mark' || watermark) {
      const markW = width * (watermark ? 1 : 0.55);
      const markH = markW / 1.813;
      return (
        <Image
          source={WOMAN_BRANDING_LOGOS.mark}
          style={{ width: markW, height: markH, opacity: opacity ?? (watermark ? 0.14 : 1) }}
          resizeMode="contain"
          accessibilityLabel={PRODAY_WOMAN_BRAND.name}
        />
      );
    }
    return (
      <WomanLogo
        width={width}
        background={background}
        opacity={opacity}
        watermark={false}
      />
    );
  }

  const source: ImageSourcePropType = BRANDING_LOGOS[resolved];
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
        accessible
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

/** Ratio largeur/hauteur pour réserver l’espace (Woman = composant vectoriel). */
export function logoDisplayAspect(
  width: number,
  opts: { woman?: boolean; variant?: LogoVariant; watermark?: boolean }
): number {
  if (opts.woman) {
    if (opts.variant === 'mark' || opts.watermark) return 1.813;
    return womanLogoAspect(width);
  }
  const v = opts.variant ?? 'transparent';
  return LOGO_ASPECT[v] ?? 0.93;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  watermarkWrap: { pointerEvents: 'none' },
  tagline: {
    fontSize: typography.sizes.caption,
    letterSpacing: 1.2,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  taglineOnLight: { color: colors.navySoft },
  taglineOnDark: { color: colors.heroMuted },
});

export default Logo;

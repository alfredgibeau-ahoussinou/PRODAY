import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { BRAND, typography, spacing } from '../theme/designTokens';
import {
  BRANDING_LOGOS,
  MAN_BRANDING_LOGOS,
  PRO_BRANDING_LOGOS,
  WOMAN_BRANDING_LOGOS,
} from '../content/brandingAssets';
import { brandForProductLine } from '../models/ProductLine';
import type { ProductLineId } from '../models/ProductLine';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';
import { ManLogo, manLogoAspect } from './ManLogo';
import { ProLogo, proLogoAspect } from './ProLogo';
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
  /** Force l'univers Woman (rétrocompat.) */
  woman?: boolean;
  /** Force un univers (cartes intro, previews). */
  productLine?: ProductLineId;
}

const LOGO_ASPECT: Record<LogoVariant, number> = {
  light: 1.066,
  dark: 1.003,
  transparent: 0.93,
  transparentDark: 0.946,
  authDark: 0.93,
  mark: 1.813,
};

const MARK_ASPECT = 1.813;

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

function resolveProductLine(
  productLineProp: ProductLineId | undefined,
  womanProp: boolean | undefined,
  themeLine: ProductLineId
): ProductLineId {
  if (productLineProp) return productLineProp;
  if (womanProp) return 'woman';
  return themeLine;
}

function markForLine(line: ProductLineId): ImageSourcePropType {
  if (line === 'woman') return WOMAN_BRANDING_LOGOS.mark;
  if (line === 'pro') return PRO_BRANDING_LOGOS.mark;
  if (line === 'homme') return MAN_BRANDING_LOGOS.mark;
  return BRANDING_LOGOS.mark;
}

export const Logo: React.FC<LogoProps> = ({
  background = 'light',
  variant,
  width = 200,
  showTagline = false,
  watermark = false,
  opacity,
  woman: womanProp,
  productLine: productLineProp,
}) => {
  const { productLine: themeLine, colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const line = resolveProductLine(productLineProp, womanProp, themeLine);
  const resolved = variant ?? logoVariantForBackground(background, watermark);
  const brand = brandForProductLine(line);

  if (resolved === 'mark' || watermark) {
    const markW = width * (watermark ? 1 : 0.55);
    const markH = markW / MARK_ASPECT;
    return (
      <Image
        source={markForLine(line)}
        style={{ width: markW, height: markH, opacity: opacity ?? (watermark ? 0.14 : 1) }}
        resizeMode="contain"
        accessibilityLabel={brand.name}
      />
    );
  }

  if (line === 'woman') {
    return (
      <WomanLogo
        width={width}
        background={background}
        opacity={opacity}
        watermark={false}
      />
    );
  }

  if (line === 'pro') {
    return (
      <ProLogo
        width={width}
        background={background}
        opacity={opacity}
        watermark={false}
      />
    );
  }

  if (line === 'homme') {
    return (
      <ManLogo
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

/** Ratio largeur/hauteur pour réserver l'espace (logos composés Man / Woman / Pro). */
export function logoDisplayAspect(
  width: number,
  opts: {
    woman?: boolean;
    productLine?: ProductLineId;
    variant?: LogoVariant;
    watermark?: boolean;
  } = {}
): number {
  const line = resolveProductLine(opts.productLine, opts.woman, 'homme');
  if (opts.variant === 'mark' || opts.watermark) return MARK_ASPECT;
  if (line === 'woman') return womanLogoAspect(width);
  if (line === 'pro') return proLogoAspect(width);
  if (line === 'homme') return manLogoAspect(width);
  const v = opts.variant ?? 'transparent';
  return LOGO_ASPECT[v] ?? 0.93;
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { alignItems: 'center' },
    watermarkWrap: { pointerEvents: 'none' },
    tagline: {
      fontSize: typography.sizes.caption,
      letterSpacing: 1.2,
      marginTop: spacing.sm,
      textAlign: 'center',
      fontWeight: '600',
    },
    taglineOnLight: { color: c.navySoft },
    taglineOnDark: { color: c.heroMuted },
  });
}

export default Logo;

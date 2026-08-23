import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BRAND, typography, spacing } from '../theme/designTokens';
import {
  PRODAY_LOGO_MASTER_ASPECT,
  PRODAY_SYMBOL_ASPECT,
} from '../theme/prodayBrand';
import { PRODAY_OFFICIAL_LOGO_ASPECT } from '../content/brandingAssets';
import { brandForProductLine } from '../models/ProductLine';
import type { ProductLineId } from '../models/ProductLine';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';
import {
  ProDayLogo,
  brandVariantForProductLine,
} from './branding/ProDayLogo';

/** Fond derrière le logo — choisit automatiquement transparent ou non */
export type LogoBackground = 'light' | 'dark' | 'photo';

/** Variante forcée (optionnel) */
export type LogoVariant =
  | 'official'
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
  /** Force le branding Sponsor. */
  sponsor?: boolean;
}

export function logoVariantForBackground(bg: LogoBackground, watermark = false): LogoVariant {
  if (watermark) return 'mark';
  switch (bg) {
    case 'light':
      return 'official';
    case 'dark':
      return 'official';
    case 'photo':
      return 'official';
    default:
      return 'official';
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

/**
 * Logo ProDay — Master Brand unique ; accent pôle via variante.
 */
export const Logo: React.FC<LogoProps> = ({
  background = 'light',
  variant,
  width = 200,
  showTagline = false,
  watermark = false,
  opacity,
  woman: womanProp,
  productLine: productLineProp,
  sponsor: sponsorProp,
}) => {
  const { productLine: themeLine, colors: c, isSponsorAuthChrome } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const line = resolveProductLine(productLineProp, womanProp, themeLine);
  const resolved = variant ?? logoVariantForBackground(background, watermark);
  const brand = brandForProductLine(line);
  const useSponsorBrand = sponsorProp === true || (sponsorProp !== false && isSponsorAuthChrome);
  const onDark = background === 'dark' || background === 'photo';
  const brandVariant = brandVariantForProductLine(line, { sponsor: useSponsorBrand });

  if (resolved === 'mark' || watermark) {
    return (
      <ProDayLogo
        layout="symbol"
        width={width * (watermark ? 1 : 0.55)}
        variant={brandVariant}
        onDark={onDark || watermark}
        opacity={opacity ?? (watermark ? 0.14 : 1)}
        showPoleLabel={false}
      />
    );
  }

  return (
    <View style={[styles.wrap, watermark && styles.watermarkWrap]}>
      <ProDayLogo
        width={width}
        variant={brandVariant}
        onDark={onDark}
        layout="stacked"
        showPoleLabel={brandVariant !== 'master'}
        opacity={opacity ?? 1}
      />
      {showTagline && !watermark && (
        <Text style={[styles.tagline, onDark ? styles.taglineOnDark : styles.taglineOnLight]}>
          {brand.tagline || BRAND.tagline}
        </Text>
      )}
    </View>
  );
};

/** Ratio largeur/hauteur pour réserver l'espace. */
export function logoDisplayAspect(
  width: number,
  opts: {
    woman?: boolean;
    productLine?: ProductLineId;
    variant?: LogoVariant;
    watermark?: boolean;
    sponsor?: boolean;
  } = {}
): number {
  if (opts.variant === 'mark' || opts.watermark) return PRODAY_SYMBOL_ASPECT;
  const line = resolveProductLine(opts.productLine, opts.woman, 'amateur');
  const v = brandVariantForProductLine(line, { sponsor: opts.sponsor });
  if (v === 'master') return PRODAY_LOGO_MASTER_ASPECT;
  // symbole + wordmark approx
  return width / (width / PRODAY_SYMBOL_ASPECT + width * 0.28);
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

// re-export for callers that imported aspect from old constant
export { PRODAY_OFFICIAL_LOGO_ASPECT };

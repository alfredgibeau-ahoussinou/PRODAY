import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { BRAND, typography, spacing } from '../theme/designTokens';
import {
  BRANDING_LOGOS,
  PRODAY_OFFICIAL_LOGO_ASPECT,
  MAN_BRANDING_LOGOS,
  AMATEUR_BRANDING_LOGOS,
  SUPPORTER_BRANDING_LOGOS,
  PRO_BRANDING_LOGOS,
  WOMAN_BRANDING_LOGOS,
  SPONSOR_BRANDING_LOGOS,
} from '../content/brandingAssets';
import { brandForProductLine } from '../models/ProductLine';
import type { ProductLineId } from '../models/ProductLine';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';
import { ManLogo, manLogoAspect } from './ManLogo';
import { AmateurLogo, amateurLogoAspect } from './AmateurLogo';
import { SupporterLogo, supporterLogoAspect } from './SupporterLogo';
import { ProLogo, proLogoAspect } from './ProLogo';
import { ParentLogo, parentLogoAspect } from './ParentLogo';
import { WomanLogo, womanLogoAspect } from './WomanLogo';
import { SponsorLogo, sponsorLogoAspect } from './SponsorLogo';

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
  /** Force le branding Sponsor or (#D4AF37). */
  sponsor?: boolean;
}

const LOGO_ASPECT: Record<LogoVariant, number> = {
  official: 1024 / 961,
  light: 1024 / 961,
  dark: 1024 / 961,
  transparent: 1024 / 961,
  transparentDark: 1024 / 961,
  authDark: 1024 / 961,
  mark: 1.813,
};

const MARK_ASPECT = 1.813;

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

function markForLine(line: ProductLineId, sponsor = false): ImageSourcePropType {
  if (sponsor) return SPONSOR_BRANDING_LOGOS.mark;
  if (line === 'woman') return WOMAN_BRANDING_LOGOS.mark;
  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return PRO_BRANDING_LOGOS.mark;
  }
  if (line === 'sante') return PRO_BRANDING_LOGOS.mark;
  if (line === 'amateur') return AMATEUR_BRANDING_LOGOS.mark;
  if (line === 'supporter') return SUPPORTER_BRANDING_LOGOS.mark;
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
  sponsor: sponsorProp,
}) => {
  const { productLine: themeLine, colors: c, isSponsorAuthChrome } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const line = resolveProductLine(productLineProp, womanProp, themeLine);
  const resolved = variant ?? logoVariantForBackground(background, watermark);
  const brand = brandForProductLine(line);
  /** Or sponsor : prop explicite, ou chrome auth invité Sponsor (jamais un user Pro connecté). */
  const useSponsorBrand = sponsorProp === true || (sponsorProp !== false && isSponsorAuthChrome);

  if (useSponsorBrand) {
    if (resolved === 'mark' || watermark) {
      const markW = width * (watermark ? 1 : 0.55);
      const markH = markW / MARK_ASPECT;
      return (
        <Image
          source={SPONSOR_BRANDING_LOGOS.mark}
          style={{
            width: markW,
            height: markH,
            opacity: opacity ?? (watermark ? 0.14 : 1),
          }}
          resizeMode="contain"
          accessibilityLabel="Pro Day Sponsor"
        />
      );
    }
    return (
      <SponsorLogo
        width={width}
        background={background}
        opacity={opacity}
        watermark={false}
      />
    );
  }

  if (resolved === 'mark' || watermark) {
    const markW = width * (watermark ? 1 : 0.55);
    const markH = markW / MARK_ASPECT;
    return (
      <Image
        source={markForLine(line)}
        style={{
          width: markW,
          height: markH,
          opacity: opacity ?? (watermark ? 0.14 : 1),
        }}
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

  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return (
      <ProLogo
        width={width}
        background={background}
        opacity={opacity}
        watermark={false}
        productLine={line === 'pro' ? 'pro_staff' : line}
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

  if (line === 'amateur') {
    return (
      <AmateurLogo
        width={width}
        background={background}
        opacity={opacity}
        watermark={false}
      />
    );
  }

  if (line === 'supporter') {
    return (
      <SupporterLogo
        width={width}
        background={background}
        opacity={opacity}
        watermark={false}
      />
    );
  }

  if (line === 'parent') {
    return (
      <ParentLogo
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
  const onLightBg = true;

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
    sponsor?: boolean;
  } = {}
): number {
  if (opts.sponsor) return sponsorLogoAspect(width);
  const line = resolveProductLine(opts.productLine, opts.woman, 'amateur');
  if (opts.variant === 'mark' || opts.watermark) return MARK_ASPECT;
  if (line === 'woman') return womanLogoAspect(width);
  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return proLogoAspect(width);
  }
  if (line === 'sante') return proLogoAspect(width);
  if (line === 'parent') return parentLogoAspect(width);
  if (line === 'homme') return manLogoAspect(width);
  if (line === 'amateur') return amateurLogoAspect(width);
  if (line === 'supporter') return supporterLogoAspect(width);
  if (opts.sponsor) return sponsorLogoAspect(width);
  const v = opts.variant ?? 'official';
  return LOGO_ASPECT[v] ?? PRODAY_OFFICIAL_LOGO_ASPECT;
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

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { LogoBackground } from '../Logo';
import { ProDaySymbol } from './ProDaySymbol';
import {
  brandVariantForProductLine,
  PRODAY_POLE_LABELS,
  type ProDayBrandVariant,
} from '../../theme/prodayBrand';
import { fontFamily } from '../../theme/typography';

export interface BrandWordmark {
  name: string;
  logoLine1: string;
  logoLine2Lead?: string;
  logoLine2Accent: string;
  tagline: string;
}

export interface BrandWordmarkColors {
  brand: string;
  accent: string;
  taglineLight: string;
  taglineDark: string;
}

interface BrandWordmarkLogoProps {
  brand: BrandWordmark;
  /** @deprecated Ignoré — symbole master unique. */
  picto?: unknown;
  colors: BrandWordmarkColors;
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
  centered?: boolean;
  /** Variante brand explicite (sinon dérivée du libellé accent). */
  variant?: ProDayBrandVariant;
}

function variantFromBrand(brand: BrandWordmark): ProDayBrandVariant {
  const accent = (brand.logoLine2Accent || '').toLowerCase();
  if (accent.includes('sponsor')) return 'sponsor';
  if (accent.includes('parent')) return 'parent';
  if (accent.includes('supporter')) return 'supporter';
  if (accent.includes('club')) return 'club';
  if (accent.includes('président') || accent.includes('president')) return 'president';
  if (accent.includes('coach') || accent.includes('staff')) return 'coach';
  if (accent.includes('joueur') || accent.includes('women') || accent.includes('man')) {
    return 'player';
  }
  if (accent.includes('admin')) return 'admin';
  return brandVariantForProductLine(undefined);
}

/** Mot-symbole ProDay — symbole unique + wordmark / tagline natifs. */
export const BrandWordmarkLogo: React.FC<BrandWordmarkLogoProps> = ({
  brand,
  colors,
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
  centered = false,
  variant: variantProp,
}) => {
  const onDark = background === 'dark' || background === 'photo';
  const variant = variantProp ?? variantFromBrand(brand);

  const layout = useMemo(() => {
    const symbolSize = width * (watermark ? 1 : 0.72);
    const line1 = width * 0.1;
    const line2 = width * 0.115;
    const tagSize = width * 0.076;
    return { symbolSize, line1, line2, tagSize };
  }, [width, watermark]);

  if (watermark) {
    return (
      <ProDaySymbol
        size={layout.symbolSize}
        variant={variant}
        tone={onDark ? 'white' : 'black'}
        opacity={opacity * 0.14}
      />
    );
  }

  const shadowSoft = Platform.select({
    ios: {
      textShadowColor: onDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
      textShadowOffset: { width: 0, height: 1 } as const,
      textShadowRadius: 2,
    },
    default: {},
  });

  return (
    <View style={[styles.wrap, { width, opacity }, centered && styles.wrapCentered]}>
      <ProDaySymbol
        size={layout.symbolSize}
        variant={variant}
        tone={onDark ? 'white' : 'black'}
      />

      <View style={[styles.wordBlock, { marginTop: width * 0.024 }, centered && styles.wordBlockCentered]}>
        <Text
          style={[
            styles.wordLine1,
            {
              fontSize: layout.line1,
              color: onDark ? '#FFFFFF' : colors.brand,
              fontFamily: fontFamily.brand,
            },
            shadowSoft,
            centered && styles.textCenter,
          ]}
        >
          PRODAY
        </Text>
        <Text
          style={[
            styles.wordLine2,
            { fontSize: layout.line2, color: colors.accent, fontFamily: fontFamily.brandSemi },
            shadowSoft,
            centered && styles.textCenter,
          ]}
        >
          {brand.logoLine2Lead ?? ''}
          <Text style={{ color: colors.accent }}>{brand.logoLine2Accent}</Text>
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              fontSize: layout.tagSize,
              color: onDark ? colors.taglineDark : colors.taglineLight,
            },
            centered && styles.textCenter,
          ]}
        >
          {brand.tagline}
        </Text>
        {variant !== 'master' && PRODAY_POLE_LABELS[variant] ? null : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  wrapCentered: { alignItems: 'center' },
  wordBlock: { gap: 1 },
  wordBlockCentered: { alignItems: 'center', width: '100%' },
  wordLine1: { letterSpacing: 2.4, textTransform: 'uppercase' },
  wordLine2: { letterSpacing: -0.5, marginTop: -2 },
  tagline: {
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  textCenter: { textAlign: 'center' },
});

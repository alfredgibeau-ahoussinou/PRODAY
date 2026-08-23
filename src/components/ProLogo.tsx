import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  brandForProductLine,
  PRODAY_PRO_BRAND,
  type ProductLineId,
} from '../models/ProductLine';
import { PRODAY_SYMBOL_ASPECT, brandVariantForProductLine } from '../theme/prodayBrand';
import { ProDaySymbol } from './branding/ProDaySymbol';
import type { LogoBackground } from './Logo';

const PRO_COLORS = {
  pro: '#1E3A8A',
  accent: '#2563EB',
  taglineLight: '#3B82F6',
  taglineDark: 'rgba(255, 255, 255, 0.92)',
} as const;

interface ProLogoProps {
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
  /** pro_player | pro_club | pro_staff — évite d’afficher « Coach » sur Club. */
  productLine?: ProductLineId;
}

/**
 * Logo famille Pro — picto + mot-symbole selon la ligne (Joueur / Club / Coach).
 */
export const ProLogo: React.FC<ProLogoProps> = ({
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
  productLine = 'pro_staff',
}) => {
  const brandVariant = brandVariantForProductLine(productLine);
  const onDark = background === 'dark' || background === 'photo';
  const brand = brandForProductLine(productLine);

  const layout = useMemo(() => {
    const pictoW = width * (watermark ? 1 : 0.76);
    const pictoH = pictoW / PRODAY_SYMBOL_ASPECT;
    const line1 = width * 0.1;
    const line2 = width * 0.115;
    const tagSize = width * 0.065;
    // Picto + wordmark only — tagline affichée sous le logo dans AuthScreen (évite le double / overlap).
    const height = pictoH + line1 + line2 + width * 0.06;
    return { pictoW, pictoH, line1, line2, tagSize, height };
  }, [width, watermark]);

  if (watermark) {
    return (
      <ProDaySymbol
        size={layout.pictoW}
        variant={brandVariant}
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
    <View style={[styles.wrap, { width, opacity }]}>
      <ProDaySymbol
        size={layout.pictoW}
        variant={brandVariant}
        tone={onDark ? 'white' : 'black'}
      />

      <View style={[styles.wordBlock, { marginTop: width * 0.028 }]}>
        <Text
          style={[
            styles.wordLine1,
            { fontSize: layout.line1, color: PRO_COLORS.pro },
            shadowSoft,
          ]}
          allowFontScaling={false}
        >
          {brand.logoLine1 || PRODAY_PRO_BRAND.logoLine1}
        </Text>
        <View style={styles.wordLine2Row}>
          {brand.logoLine2Lead ? (
            <Text
              style={[
                styles.wordLine2,
                { fontSize: layout.line2, color: PRO_COLORS.pro },
                shadowSoft,
              ]}
              allowFontScaling={false}
            >
              {brand.logoLine2Lead}
            </Text>
          ) : null}
          <Text
            style={[
              styles.wordLine2,
              { fontSize: layout.line2, color: PRO_COLORS.accent },
              shadowSoft,
            ]}
            allowFontScaling={false}
          >
            {brand.logoLine2Accent}
          </Text>
        </View>
      </View>
    </View>
  );
};

export function proLogoAspect(width: number): number {
  const pictoW = width * 0.76;
  const pictoH = pictoW / PRODAY_SYMBOL_ASPECT;
  const line1 = width * 0.1;
  const line2 = width * 0.115;
  const height = pictoH + line1 + line2 + width * 0.06;
  return width / height;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wordBlock: { alignItems: 'center' },
  wordLine1: {
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  wordLine2Row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 2,
  },
  wordLine2: {
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
});

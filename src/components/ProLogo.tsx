import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import {
  brandForProductLine,
  PRODAY_PRO_BRAND,
  type ProductLineId,
} from '../models/ProductLine';
import { PRO_BRANDING_LOGOS } from '../content/brandingAssets';
import type { LogoBackground } from './Logo';

const PICTO_ASPECT = 1.78;

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
  const onDark = background === 'dark' || background === 'photo';
  const brand = brandForProductLine(productLine);

  const layout = useMemo(() => {
    const pictoW = width * (watermark ? 1 : 0.76);
    const pictoH = pictoW / PICTO_ASPECT;
    const line1 = width * 0.1;
    const line2 = width * 0.115;
    const tagSize = width * 0.065;
    // Picto + wordmark only — tagline affichée sous le logo dans AuthScreen (évite le double / overlap).
    const height = pictoH + line1 + line2 + width * 0.06;
    return { pictoW, pictoH, line1, line2, tagSize, height };
  }, [width, watermark]);

  if (watermark) {
    return (
      <Image
        source={PRO_BRANDING_LOGOS.picto}
        style={{ width: layout.pictoW, height: layout.pictoH, opacity: opacity * 0.14 }}
        resizeMode="contain"
        accessibilityLabel={brand.name}
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
      <Image
        source={PRO_BRANDING_LOGOS.picto}
        style={{ width: layout.pictoW, height: layout.pictoH }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={brand.name}
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
  const pictoH = pictoW / PICTO_ASPECT;
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

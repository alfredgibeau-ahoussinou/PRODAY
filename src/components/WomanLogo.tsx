import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { PRODAY_WOMAN_BRAND } from '../models/ProductLine';
import { WOMAN_BRANDING_LOGOS } from '../content/brandingAssets';
import type { LogoBackground } from './Logo';

/** Ratio largeur/hauteur du picto P (mark rose). */
const PICTO_ASPECT = 1.78;

const WOMAN_COLORS = {
  pro: '#831843',
  women: '#DB2777',
  taglineLight: '#9D174D',
  taglineDark: 'rgba(255, 255, 255, 0.92)',
} as const;

interface WomanLogoProps {
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
}

/**
 * Logo Pro Day for Women — picto P rose (PNG) + mot-symbole + tagline en texte natif.
 */
export const WomanLogo: React.FC<WomanLogoProps> = ({
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
}) => {
  const onDark = background === 'dark' || background === 'photo';

  const layout = useMemo(() => {
    const pictoW = width * (watermark ? 1 : 0.76);
    const pictoH = pictoW / PICTO_ASPECT;
    const line1 = width * 0.1;
    const line2 = width * 0.115;
    const tagSize = width * 0.076;
    const height =
      pictoH + line1 + line2 + tagSize * 2.2 + width * 0.05;
    return { pictoW, pictoH, line1, line2, tagSize, height };
  }, [width, watermark]);

  if (watermark) {
    return (
      <Image
        source={WOMAN_BRANDING_LOGOS.picto}
        style={{ width: layout.pictoW, height: layout.pictoH, opacity: opacity * 0.14 }}
        resizeMode="contain"
        accessibilityLabel={PRODAY_WOMAN_BRAND.name}
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
        source={WOMAN_BRANDING_LOGOS.picto}
        style={{ width: layout.pictoW, height: layout.pictoH }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={PRODAY_WOMAN_BRAND.name}
      />

      <View style={[styles.wordBlock, { marginTop: width * 0.024 }]}>
        <Text
          style={[
            styles.wordLine1,
            { fontSize: layout.line1, color: WOMAN_COLORS.pro },
            shadowSoft,
          ]}
          allowFontScaling={false}
        >
          {PRODAY_WOMAN_BRAND.logoLine1}
        </Text>
        <View style={styles.wordLine2Row}>
          <Text
            style={[
              styles.wordLine2,
              { fontSize: layout.line2, color: WOMAN_COLORS.pro },
              shadowSoft,
            ]}
            allowFontScaling={false}
          >
            {PRODAY_WOMAN_BRAND.logoLine2Lead}
          </Text>
          <Text
            style={[
              styles.wordLine2,
              { fontSize: layout.line2, color: WOMAN_COLORS.women },
              shadowSoft,
            ]}
            allowFontScaling={false}
          >
            {PRODAY_WOMAN_BRAND.logoLine2Accent}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.tagline,
          {
            fontSize: layout.tagSize,
            color: onDark ? WOMAN_COLORS.taglineDark : WOMAN_COLORS.taglineLight,
            marginTop: width * 0.032,
          },
        ]}
        allowFontScaling={false}
      >
        {PRODAY_WOMAN_BRAND.tagline}
      </Text>
    </View>
  );
};

export function womanLogoAspect(width: number): number {
  const pictoW = width * 0.76;
  const pictoH = pictoW / PICTO_ASPECT;
  const line1 = width * 0.1;
  const line2 = width * 0.115;
  const tagSize = width * 0.076;
  const height = pictoH + line1 + line2 + tagSize * 2.2 + width * 0.05;
  return width / height;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  wordBlock: {
    alignItems: 'center',
  },
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
  tagline: {
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default WomanLogo;

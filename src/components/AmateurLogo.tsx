import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { PRODAY_AMATEUR_BRAND } from '../models/ProductLine';
import { AMATEUR_BRANDING_LOGOS } from '../content/brandingAssets';
import type { LogoBackground } from './Logo';

const PICTO_ASPECT = 1.78;

export function amateurLogoAspect(width: number): number {
  const pictoW = width * 0.76;
  const pictoH = pictoW / PICTO_ASPECT;
  const line1 = width * 0.1;
  const line2 = width * 0.115;
  const tagSize = width * 0.076;
  const height = pictoH + line1 + line2 + tagSize * 2.2 + width * 0.05;
  return width / height;
}

const AMATEUR_COLORS = {
  brand: '#9A3412',
  accent: '#EA580C',
  taglineLight: '#C2410C',
  taglineDark: 'rgba(255, 255, 255, 0.92)',
} as const;

interface AmateurLogoProps {
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
}

/** Logo Pro Day Amateur — picto + mot-symbole orange (structure alignée Pro / Santé). */
export const AmateurLogo: React.FC<AmateurLogoProps> = ({
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
    const height = pictoH + line1 + line2 + tagSize * 2.2 + width * 0.05;
    return { pictoW, pictoH, line1, line2, tagSize, height };
  }, [width, watermark]);

  if (watermark) {
    return (
      <Image
        source={AMATEUR_BRANDING_LOGOS.picto}
        style={{ width: layout.pictoW, height: layout.pictoH, opacity: opacity * 0.14 }}
        resizeMode="contain"
        accessibilityLabel={PRODAY_AMATEUR_BRAND.name}
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
        source={AMATEUR_BRANDING_LOGOS.picto}
        style={{ width: layout.pictoW, height: layout.pictoH }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={PRODAY_AMATEUR_BRAND.name}
      />

      <View style={[styles.wordBlock, { marginTop: width * 0.024 }]}>
        <Text
          style={[
            styles.wordLine1,
            { fontSize: layout.line1, color: onDark ? '#FFFFFF' : AMATEUR_COLORS.brand },
            shadowSoft,
          ]}
        >
          {PRODAY_AMATEUR_BRAND.logoLine1}
        </Text>
        <Text
          style={[
            styles.wordLine2,
            { fontSize: layout.line2, color: onDark ? AMATEUR_COLORS.accent : AMATEUR_COLORS.accent },
            shadowSoft,
          ]}
        >
          {PRODAY_AMATEUR_BRAND.logoLine2Accent}
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              fontSize: layout.tagSize,
              color: onDark ? AMATEUR_COLORS.taglineDark : AMATEUR_COLORS.taglineLight,
            },
          ]}
        >
          {PRODAY_AMATEUR_BRAND.tagline}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  wordBlock: { gap: 1 },
  wordLine1: { fontWeight: '900', letterSpacing: -0.5 },
  wordLine2: { fontWeight: '900', letterSpacing: -0.5, marginTop: -2 },
  tagline: {
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 6,
    textTransform: 'uppercase',
  },
});

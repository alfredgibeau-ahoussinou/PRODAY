import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Platform, type ImageSourcePropType } from 'react-native';
import type { LogoBackground } from '../Logo';

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
  picto: ImageSourcePropType;
  colors: BrandWordmarkColors;
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
  centered?: boolean;
}

const PICTO_ASPECT = 1.78;

/** Mot-symbole Pro Day (picto + lignes + tagline) — base commune des logos pôle. */
export const BrandWordmarkLogo: React.FC<BrandWordmarkLogoProps> = ({
  brand,
  picto,
  colors,
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
  centered = false,
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
        source={picto}
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
    <View style={[styles.wrap, { width, opacity }, centered && styles.wrapCentered]}>
      <Image
        source={picto}
        style={{ width: layout.pictoW, height: layout.pictoH }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={brand.name}
      />

      <View style={[styles.wordBlock, { marginTop: width * 0.024 }, centered && styles.wordBlockCentered]}>
        <Text
          style={[
            styles.wordLine1,
            { fontSize: layout.line1, color: onDark ? '#FFFFFF' : colors.brand },
            shadowSoft,
            centered && styles.textCenter,
          ]}
        >
          {brand.logoLine1}
        </Text>
        <Text
          style={[
            styles.wordLine2,
            { fontSize: layout.line2, color: colors.accent },
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  wrapCentered: { alignItems: 'center' },
  wordBlock: { gap: 1 },
  wordBlockCentered: { alignItems: 'center', width: '100%' },
  wordLine1: { fontWeight: '900', letterSpacing: -0.5 },
  wordLine2: { fontWeight: '900', letterSpacing: -0.5, marginTop: -2 },
  tagline: {
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  textCenter: { textAlign: 'center' },
});

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {
  PRODAY_LOGO_HORIZONTAL_ASPECT,
  PRODAY_LOGO_MASTER_ASPECT,
  PRODAY_POLE_LABELS,
  PRODAY_TAGLINE,
  brandVariantForProductLine,
  type ProDayBrandVariant,
} from '../../theme/prodayBrand';
import { PRODAY_BRAND_ASSETS } from '../../content/brandingAssets';
import { ProDaySymbol } from './ProDaySymbol';
import { ProDayWordmark } from './ProDayWordmark';

export { brandVariantForProductLine, PRODAY_TAGLINE };
export type { ProDayBrandVariant };

export type ProDayLogoLayout = 'stacked' | 'horizontal' | 'symbol' | 'wordmark';

type ProDayLogoProps = {
  width?: number;
  variant?: ProDayBrandVariant;
  /** Fond sombre → symbole/wordmark blancs (master). */
  onDark?: boolean;
  layout?: ProDayLogoLayout;
  /** Affiche le libellé pôle sous PRODAY. */
  showPoleLabel?: boolean;
  /** Tagline officielle sous le wordmark. */
  showTagline?: boolean;
  opacity?: number;
};

/**
 * Logo officiel : symbole teinté pôle + wordmark ; lockup PNG master.
 */
export function ProDayLogo({
  width = 180,
  variant = 'master',
  onDark = true,
  layout = 'stacked',
  showPoleLabel = variant !== 'master',
  showTagline = false,
  opacity = 1,
}: ProDayLogoProps) {
  if (layout === 'symbol') {
    return (
      <ProDaySymbol
        size={width}
        variant={variant}
        tone={onDark ? 'white' : 'black'}
        opacity={opacity}
      />
    );
  }

  if (layout === 'wordmark') {
    return (
      <View style={[styles.wrap, { width, opacity }]}>
        <ProDayWordmark
          width={width}
          variant={variant}
          onDark={onDark}
          poleLabel={showPoleLabel ? PRODAY_POLE_LABELS[variant] || null : null}
          showTagline={showTagline}
        />
      </View>
    );
  }

  if (layout === 'horizontal') {
    if (variant === 'master' && !showPoleLabel) {
      const height = width / PRODAY_LOGO_HORIZONTAL_ASPECT;
      const source = onDark
        ? PRODAY_BRAND_ASSETS.lockupHorizontalWhite
        : PRODAY_BRAND_ASSETS.lockupHorizontalBlack;
      return (
        <Image
          source={source}
          style={{ width, height, opacity }}
          resizeMode="contain"
          accessibilityLabel="ProDay"
        />
      );
    }

    const symbolSize = width * 0.34;
    const wordWidth = width - symbolSize - width * 0.06;
    const poleLabelText = showPoleLabel ? PRODAY_POLE_LABELS[variant] || null : null;
    return (
      <View style={[styles.horizontal, { width, opacity }]}>
        <ProDaySymbol size={symbolSize} variant={variant} tone={onDark ? 'white' : 'black'} />
        <View style={styles.horizontalWord}>
          <ProDayWordmark
            width={wordWidth}
            variant={variant}
            onDark={onDark}
            align="left"
            poleLabel={poleLabelText}
            poleLabelInline={Boolean(poleLabelText)}
            showTagline={showTagline}
          />
        </View>
      </View>
    );
  }

  if (variant === 'master') {
    const height = width / PRODAY_LOGO_MASTER_ASPECT;
    const source = onDark
      ? PRODAY_BRAND_ASSETS.logoMasterWhite
      : PRODAY_BRAND_ASSETS.logoMasterBlack;
    return (
      <Image
        source={source}
        style={{ width, height, opacity }}
        resizeMode="contain"
        accessibilityLabel="ProDay"
      />
    );
  }

  const symbolSize = width * 0.72;
  return (
    <View style={[styles.wrap, { width, opacity }]}>
      <ProDaySymbol size={symbolSize} variant={variant} tone={onDark ? 'white' : 'black'} />
      <View style={styles.wordSlot}>
        <ProDayWordmark
          width={width}
          variant={variant}
          onDark={onDark}
          poleLabel={showPoleLabel ? PRODAY_POLE_LABELS[variant] || null : null}
          showTagline={showTagline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wordSlot: { marginTop: 10, alignItems: 'center' },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  horizontalWord: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
});

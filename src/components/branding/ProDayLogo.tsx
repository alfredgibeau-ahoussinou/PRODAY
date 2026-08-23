import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {
  PRODAY_LOGO_MASTER_ASPECT,
  PRODAY_POLE_LABELS,
  brandVariantForProductLine,
  type ProDayBrandVariant,
} from '../../theme/prodayBrand';
import { PRODAY_BRAND_ASSETS } from '../../content/brandingAssets';
import { ProDaySymbol } from './ProDaySymbol';
import { ProDayWordmark } from './ProDayWordmark';

export { brandVariantForProductLine };
export type { ProDayBrandVariant };

export type ProDayLogoLayout = 'stacked' | 'symbol' | 'wordmark';

type ProDayLogoProps = {
  width?: number;
  variant?: ProDayBrandVariant;
  /** Fond sombre → symbole/wordmark blancs. */
  onDark?: boolean;
  layout?: ProDayLogoLayout;
  /** Affiche le libellé pôle sous PRODAY. */
  showPoleLabel?: boolean;
  opacity?: number;
};

/**
 * Logo officiel : symbole identique + wordmark ; accent pôle uniquement.
 */
export function ProDayLogo({
  width = 180,
  variant = 'master',
  onDark = true,
  layout = 'stacked',
  showPoleLabel = variant !== 'master',
  opacity = 1,
}: ProDayLogoProps) {
  if (layout === 'symbol') {
    return (
      <ProDaySymbol
        size={width}
        variant={variant}
        tone={onDark ? 'white' : 'black'}
        showAccentBar={variant !== 'master'}
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
        />
      </View>
    );
  }

  // Master stacked : PNG officiel symbole+wordmark (géométrie fidèle)
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

  // Pôle : symbole + barre accent + wordmark coloré
  const symbolSize = width * 0.72;
  return (
    <View style={[styles.wrap, { width, opacity }]}>
      <ProDaySymbol
        size={symbolSize}
        variant={variant}
        tone={onDark ? 'white' : 'black'}
        showAccentBar
      />
      <View style={styles.wordSlot}>
        <ProDayWordmark
          width={width}
          variant={variant}
          onDark={onDark}
          poleLabel={showPoleLabel ? PRODAY_POLE_LABELS[variant] || null : null}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wordSlot: { marginTop: 10, alignItems: 'center' },
});

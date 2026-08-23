import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PRODAY_SYMBOL_ASPECT, type ProDayBrandVariant } from '../../theme/prodayBrand';
import { poleSymbolAsset } from '../../content/brandingAssets';

export type ProDaySymbolTone = 'white' | 'black';

type ProDaySymbolProps = {
  size?: number;
  /** Symbole teinté pôle — géométrie inchangée (planche brand). */
  variant?: ProDayBrandVariant;
  tone?: ProDaySymbolTone;
  opacity?: number;
};

/**
 * Symbole officiel PRODAY — asset extrait, jamais redessiné / étiré.
 */
export function ProDaySymbol({
  size = 48,
  variant = 'master',
  tone = 'white',
  opacity = 1,
}: ProDaySymbolProps) {
  const height = size / PRODAY_SYMBOL_ASPECT;

  const source = useMemo(
    () => poleSymbolAsset(variant, tone),
    [variant, tone],
  );

  return (
    <View style={[styles.wrap, { opacity }]} accessibilityRole="image" accessibilityLabel="ProDay">
      <Image source={source} style={{ width: size, height }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});

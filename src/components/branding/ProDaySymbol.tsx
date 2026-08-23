import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {
  PRODAY_SYMBOL_ASPECT,
  poleAccent,
  type ProDayBrandVariant,
} from '../../theme/prodayBrand';
import { PRODAY_BRAND_ASSETS } from '../../content/brandingAssets';

export type ProDaySymbolTone = 'white' | 'black';

type ProDaySymbolProps = {
  size?: number;
  /** Couleur du trait/détail bas — géométrie symbole inchangée. */
  variant?: ProDayBrandVariant;
  tone?: ProDaySymbolTone;
  /** Affiche la barre d’accent pôle sous le symbole (sauf master). */
  showAccentBar?: boolean;
  opacity?: number;
};

/**
 * Symbole officiel PRODAY — asset extrait, jamais redessiné / étiré.
 */
export function ProDaySymbol({
  size = 48,
  variant = 'master',
  tone = 'white',
  showAccentBar = variant !== 'master',
  opacity = 1,
}: ProDaySymbolProps) {
  const height = size / PRODAY_SYMBOL_ASPECT;
  const accent = poleAccent(variant);
  const showBar = showAccentBar && variant !== 'master';
  const barH = Math.max(2, Math.round(size * 0.045));
  const barW = size * 0.42;

  const source = useMemo(
    () => (tone === 'black' ? PRODAY_BRAND_ASSETS.symbolBlack : PRODAY_BRAND_ASSETS.symbolWhite),
    [tone],
  );

  return (
    <View style={[styles.wrap, { opacity }]} accessibilityRole="image" accessibilityLabel="ProDay">
      <Image
        source={source}
        style={{ width: size, height }}
        resizeMode="contain"
      />
      {showBar ? (
        <View
          style={[
            styles.accentBar,
            {
              width: barW,
              height: barH,
              backgroundColor: accent,
              marginTop: Math.max(4, size * 0.06),
              borderRadius: barH / 2,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  accentBar: { alignSelf: 'center' },
});

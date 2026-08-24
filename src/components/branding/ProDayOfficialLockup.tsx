import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PRODAY_BRAND_ASSETS } from '../../content/brandingAssets';

type ProDayOfficialLockupProps = {
  /** Largeur du lockup carré (P + PRODAY + tagline). */
  width?: number;
  opacity?: number;
};

/**
 * Lockup officiel PRODAY (source planche) — splash / auth / moments brand à large surface.
 * Pour les petits formats (tab bar, 64px), préférer `ProDaySymbol`.
 */
export function ProDayOfficialLockup({ width = 180, opacity = 1 }: ProDayOfficialLockupProps) {
  return (
    <View style={[styles.wrap, { opacity }]} accessibilityRole="image" accessibilityLabel="ProDay">
      <Image
        source={PRODAY_BRAND_ASSETS.logoMasterWhite}
        style={{ width, height: width }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});

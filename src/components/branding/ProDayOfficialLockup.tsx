import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayLogo } from './ProDayLogo';

type ProDayOfficialLockupProps = {
  /** Largeur du lockup (symbole + PRODAY + tagline or). */
  width?: number;
  opacity?: number;
};

/**
 * Lockup officiel PRODAY pour splash / auth / moments brand.
 * Composé natif (symbole transparent + wordmark) — jamais le PNG carré
 * avec fond baked-in, qui créait un « carré flottant » sur fond noir.
 * Pour les petits formats (tab bar, 64px), préférer `ProDaySymbol`.
 */
export function ProDayOfficialLockup({ width = 180, opacity = 1 }: ProDayOfficialLockupProps) {
  return (
    <View style={[styles.wrap, { opacity }]} accessibilityRole="image" accessibilityLabel="ProDay">
      <ProDayLogo
        width={width}
        variant="master"
        onDark
        layout="stacked"
        showPoleLabel={false}
        showTagline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});

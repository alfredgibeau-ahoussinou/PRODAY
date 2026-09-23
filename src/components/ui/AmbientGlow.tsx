import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AmbientGlowProps = {
  /** Couleur du halo — accent de pôle ou or master. */
  color?: string;
  /** Opacité du halo (0–1) — spec DESIGN.md §4.3 : 0.12 à 0.20. */
  intensity?: number;
  /** Hauteur de la zone diffusée (px). */
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Halo lumineux « Ambient Glow » (DESIGN.md §4.3) — dégradé diffus placé en
 * haut d'écran pour donner de la profondeur sans surcharger. Décoratif :
 * `pointerEvents="none"` et z-index sous le contenu.
 */
export const AmbientGlow = memo(function AmbientGlow({
  color = '#C5A059',
  intensity = 0.16,
  height = 240,
  style,
}: AmbientGlowProps) {
  const clamped = Math.min(0.2, Math.max(0.12, intensity));
  return (
    <View
      pointerEvents="none"
      style={[styles.root, { height }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={[withAlpha(color, clamped), withAlpha(color, clamped * 0.35), 'rgba(0,0,0,0)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(0, 0, 0, 0)`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { ProDaySymbol } from '../ProDaySymbol';
import { spacing } from '../../../theme/designTokens';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { brandVariantForCarouselPole } from './universePoleBrand';

interface UniverseChoicePageProps {
  line: CarouselPoleId;
  index: number;
  pageWidth: number;
  pageHeight: number;
  scrollX: SharedValue<number>;
  /** Largeur de la slide (peek) — ≠ largeur écran. */
  itemWidth: number;
  /** Composition tablette / desktop : plus d'air. */
  cinematic?: boolean;
  /** Réduit parallax pour accessibilité mouvement. */
  reducedMotion?: boolean;
  /**
   * Mode stage fixe (tablette) — pas de scrollX, focus piloté par `focused`.
   */
  staticFocus?: boolean;
  focused?: boolean;
}

/**
 * Stage univers — symbole HD teinté pôle uniquement (pas de carte / bordure).
 * Nom + tagline vivent dans le chrome pour une seule accent active.
 */
export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  itemWidth,
  scrollX,
  cinematic = false,
  reducedMotion = false,
  staticFocus = false,
  focused = true,
}) => {
  const accent = UNIVERSE_ACCENT[line];
  const variant = brandVariantForCarouselPole(line);
  const symbolSize = cinematic ? 200 : 148;
  const haloSize = symbolSize + (cinematic ? 96 : 72);
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic),
    [itemWidth, cinematic],
  );

  const stageStyle = useAnimatedStyle(() => {
    if (staticFocus) {
      const opacity = focused ? 1 : reducedMotion ? 0.55 : 0.42;
      const scale = focused ? 1 : reducedMotion ? 0.97 : 0.9;
      return { opacity, transform: [{ scale }] };
    }
    if (itemWidth <= 0) {
      return { opacity: 0, transform: [{ scale: 0.96 }] };
    }
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const abs = Math.abs(offset);

    if (reducedMotion) {
      const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.7, 0.42], Extrapolation.CLAMP);
      const scale = interpolate(abs, [0, 1], [1, 0.94], Extrapolation.CLAMP);
      return { opacity, transform: [{ scale }] };
    }

    const scale = interpolate(abs, [0, 0.55, 1], [1, 0.94, 0.88], Extrapolation.CLAMP);
    const opacity = interpolate(abs, [0, 0.4, 1], [1, 0.55, 0.28], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  }, [focused, index, itemWidth, reducedMotion, staticFocus]);

  const haloStyle = useAnimatedStyle(() => {
    if (staticFocus) {
      return { opacity: focused ? (reducedMotion ? 0.16 : 0.22) : 0.06 };
    }
    if (itemWidth <= 0) {
      return { opacity: 0.08 };
    }
    const page = scrollX.value / itemWidth;
    const abs = Math.abs(page - index);
    const opacity = interpolate(abs, [0, 0.4, 1], [0.22, 0.1, 0.04], Extrapolation.CLAMP);
    return { opacity };
  }, [focused, index, itemWidth, reducedMotion, staticFocus]);

  return (
    <View
      style={styles.page}
      accessibilityElementsHidden={!focused && staticFocus}
      importantForAccessibility={focused || !staticFocus ? 'yes' : 'no-hide-descendants'}
    >
      <Animated.View style={[styles.stage, stageStyle]}>
        <View style={styles.symbolWrap}>
          <Animated.View
            style={[
              styles.halo,
              {
                width: haloSize,
                height: haloSize,
                borderRadius: haloSize / 2,
                backgroundColor: accent,
              },
              haloStyle,
            ]}
          />
          <ProDaySymbol size={symbolSize} variant={variant} tone="white" />
        </View>
      </Animated.View>
    </View>
  );
};

function createStyles(itemWidth: number, cinematic: boolean) {
  return StyleSheet.create({
    page: {
      width: itemWidth > 0 ? itemWidth : undefined,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stage: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: cinematic ? spacing.xl : spacing.md,
      // Remonte le symbole au-dessus du chrome bas (nom + CTA).
      marginBottom: cinematic ? 0 : 96,
    },
    symbolWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    halo: {
      position: 'absolute',
    },
  });
}

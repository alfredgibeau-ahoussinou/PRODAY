import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { getCarouselPoleIdentity } from '../../../content/carouselPoleExperience';
import { ProductLineLogo } from '../ProductLineLogo';
import { gradientsForCarouselPole } from '../../../theme/universeGradients';
import { spacing } from '../../../theme/designTokens';
import { UNIVERSE_ACCENT, UNIVERSE_SHORT } from './universeIntroAccents';
import { poleExclusivityNote } from '../../../utils/roleCapabilities';

interface UniverseChoicePageProps {
  line: CarouselPoleId;
  index: number;
  pageWidth: number;
  pageHeight: number;
  scrollX: SharedValue<number>;
}

function splitHeroLine(heroLine: string): [string, string] {
  const parts = heroLine.split('\n');
  return [parts[0] ?? heroLine, parts[1] ?? ''];
}

/** Plein écran — logo, accroche, mission courte. */
export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  pageWidth,
  scrollX,
}) => {
  const identity = getCarouselPoleIdentity(line);
  const stops = gradientsForCarouselPole(line);
  const accent = UNIVERSE_ACCENT[line];
  const styles = useMemo(() => createStyles(pageWidth), [pageWidth]);
  const [heroLead, heroAccent] = splitHeroLine(identity.heroLine);

  const logoStyle = useAnimatedStyle(() => {
    if (pageWidth <= 0) return { opacity: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    const page = scrollX.value / pageWidth;
    const offset = page - index;
    const translateY = interpolate(offset, [-1, 0, 1], [24, 0, 24], Extrapolation.CLAMP);
    const scale = interpolate(offset, [-1, 0, 1], [0.88, 1, 0.88], Extrapolation.CLAMP);
    const opacity = interpolate(offset, [-1, -0.15, 0, 0.15, 1], [0, 0.7, 1, 0.7, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }, { scale }] };
  });

  const copyStyle = useAnimatedStyle(() => {
    if (pageWidth <= 0) return { opacity: 0, transform: [{ translateY: 0 }] };
    const page = scrollX.value / pageWidth;
    const offset = page - index;
    const translateY = interpolate(offset, [-1, 0, 1], [16, 0, 16], Extrapolation.CLAMP);
    const opacity = interpolate(offset, [-1, -0.2, 0, 0.2, 1], [0, 0.5, 1, 0.5, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (pageWidth <= 0) return { opacity: 0, transform: [{ scale: 1 }] };
    const page = scrollX.value / pageWidth;
    const offset = page - index;
    const opacity = interpolate(offset, [-1, 0, 1], [0.08, 0.28, 0.08], Extrapolation.CLAMP);
    const scale = interpolate(offset, [-1, 0, 1], [0.9, 1.05, 0.9], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={[stops.heroDark[0], stops.hero[0], stops.hero[1] ?? stops.hero[0]]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.45)']}
        style={styles.vignette}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.stage}>
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { backgroundColor: accent }, glowStyle]}
        />

        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <ProductLineLogo
            line={line}
            width={Math.min(pageWidth * 0.48, 172)}
            onDark
            centered
          />
        </Animated.View>

        <Animated.View style={[styles.copy, copyStyle]}>
          <Text style={styles.kicker}>{UNIVERSE_SHORT[line]}</Text>
          <View style={styles.heroBlock}>
            <Text style={styles.heroLead}>{heroLead}</Text>
            {heroAccent ? (
              <Text style={[styles.heroAccent, { color: accent }]}>{heroAccent}</Text>
            ) : null}
          </View>
          <Text style={styles.name}>{identity.productName}</Text>
          <Text style={styles.mission} numberOfLines={2}>
            {identity.mission}
          </Text>
          {line === 'pro_club' || line === 'pro_staff' ? (
            <Text style={styles.exclusivity} numberOfLines={3}>
              {poleExclusivityNote(line)}
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
};

function createStyles(pageWidth: number) {
  return StyleSheet.create({
    page: {
      width: pageWidth,
      flex: 1,
    },
    vignette: {
      ...StyleSheet.absoluteFillObject,
    },
    stage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl * 6.5,
      paddingTop: spacing.xl * 2,
    },
    glow: {
      position: 'absolute',
      width: pageWidth * 0.75,
      height: pageWidth * 0.75,
      borderRadius: pageWidth,
      top: '18%',
    },
    logoWrap: {
      marginBottom: spacing.lg,
      width: '100%',
      alignItems: 'center',
    },
    copy: {
      alignItems: 'center',
      gap: spacing.sm,
      width: '100%',
      maxWidth: 320,
    },
    kicker: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2.4,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.55)',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    heroBlock: {
      alignItems: 'center',
      gap: 0,
    },
    heroLead: {
      fontSize: 32,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.8,
      lineHeight: 36,
      textAlign: 'center',
    },
    heroAccent: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -0.8,
      lineHeight: 36,
      textAlign: 'center',
    },
    name: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.78)',
      letterSpacing: 0.2,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    mission: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.62)',
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    exclusivity: {
      marginTop: spacing.sm,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
      color: 'rgba(255,220,180,0.78)',
      textAlign: 'center',
      maxWidth: 300,
    },
  });
}

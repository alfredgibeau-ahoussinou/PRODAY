import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { motion } from '../../../theme/motion';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Affiche le logo club (défaut true). */
  showLogo?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** En-tête Club premium — logo + lavage accent. */
export function ClubBrandHeader({
  title,
  subtitle,
  right,
  showLogo = true,
  style,
}: Props) {
  const { tokens, logoUrl } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[tokens.headerWash, tokens.pitchSoft, tokens.surface]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />
      <View style={styles.row}>
        {showLogo ? (
          <View style={[styles.logoWrap, { borderColor: tokens.accentSoft }]}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoPh, { backgroundColor: tokens.accentSoft }]}>
                <ClubText variant="h3" style={{ color: tokens.accent }}>
                  {title.charAt(0).toUpperCase()}
                </ClubText>
              </View>
            )}
          </View>
        ) : null}
        <View style={styles.textCol}>
          <ClubText variant="h1">{title}</ClubText>
          {subtitle ? (
            <ClubText variant="caption" muted>
              {subtitle}
            </ClubText>
          ) : null}
        </View>
        {right}
      </View>
      <View style={[styles.accentBar, { backgroundColor: tokens.accent }]} />
    </View>
  );
}

/** ScrollView chapter avec header parallax-lite (logo scale). */
export function useClubHeaderParallax() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.value, [0, 80], [1, 0.88], Extrapolation.CLAMP),
      },
      {
        translateY: interpolate(scrollY.value, [0, 80], [0, -6], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.85], Extrapolation.CLAMP),
  }));
  return { scrollY, onScroll, logoStyle, AnimatedScrollView: Animated.ScrollView };
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.md,
      gap: clubSpace.sm,
      overflow: 'hidden',
      borderRadius: clubRadius.xl,
      paddingHorizontal: clubSpace.md,
      marginHorizontal: -clubSpace.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    wash: {
      ...StyleSheet.absoluteFillObject,
      height: 160,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
    },
    logoWrap: {
      width: 58,
      height: 58,
      borderRadius: clubRadius.lg,
      overflow: 'hidden',
      borderWidth: 2,
      backgroundColor: tokens.elevated,
      ...clubShadow.accent(tokens),
    },
    logo: { width: '100%', height: '100%' },
    logoPh: { alignItems: 'center', justifyContent: 'center' },
    textCol: { flex: 1, minWidth: 0, gap: 4 },
    accentBar: {
      height: 3,
      width: 64,
      borderRadius: 2,
      opacity: 1,
    },
  });

/** Durée d’entrée alignée tokens motion. */
export const CLUB_ENTRANCE_MS = motion.duration.normal;

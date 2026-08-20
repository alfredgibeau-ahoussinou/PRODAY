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
import { spacing } from '../../../theme/designTokens';
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

/** En-tête Club premium — logo + lavage accent (parallax léger si scrollY fourni). */
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
        colors={[tokens.headerWash, tokens.bg]}
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
                <ClubText variant="section" style={{ color: tokens.accent }}>
                  {title.charAt(0).toUpperCase()}
                </ClubText>
              </View>
            )}
          </View>
        ) : null}
        <View style={styles.textCol}>
          <ClubText variant="title">{title}</ClubText>
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
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
      overflow: 'hidden',
    },
    wash: {
      ...StyleSheet.absoluteFillObject,
      height: 120,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    logoWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 2,
      backgroundColor: tokens.surface,
      shadowColor: tokens.accent,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    logo: { width: '100%', height: '100%' },
    logoPh: { alignItems: 'center', justifyContent: 'center' },
    textCol: { flex: 1, minWidth: 0, gap: 4 },
    accentBar: {
      height: 3,
      width: 48,
      borderRadius: 2,
      opacity: 0.9,
    },
  });

/** Durée d’entrée alignée tokens motion. */
export const CLUB_ENTRANCE_MS = motion.duration.normal;

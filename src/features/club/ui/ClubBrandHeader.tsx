import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
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

/**
 * En-tête équipe / club — fond noir + pill status (accent émeraude sur UI).
 */
export function ClubBrandHeader({
  title,
  subtitle,
  right,
  showLogo = true,
  crestLabel,
  style,
}: Props & { /** Initiale crest si pas de logo (défaut : titre). */ crestLabel?: string }) {
  const { tokens, logoUrl, club } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const initialSource = (crestLabel ?? club?.name ?? subtitle ?? title).trim();
  const initial = (initialSource.charAt(0) || '?').toUpperCase();

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        {showLogo ? (
          <View style={[styles.logoWrap, { borderColor: tokens.successSoft }]}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoPh, { backgroundColor: tokens.pitchSoft }]}>
                <ClubText variant="h3" style={{ color: tokens.success }}>
                  {initial}
                </ClubText>
              </View>
            )}
          </View>
        ) : null}
        <View style={styles.textCol}>
          <View style={styles.titlePill}>
            <View style={[styles.statusDot, { backgroundColor: tokens.success }]} />
            <ClubText variant="h3" numberOfLines={1} style={styles.pillTitle}>
              {title}
            </ClubText>
          </View>
          {subtitle ? (
            <ClubText variant="caption" muted numberOfLines={2} style={styles.sub}>
              {subtitle}
            </ClubText>
          ) : null}
        </View>
        {right}
      </View>
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
      paddingTop: clubSpace.xl,
      paddingBottom: clubSpace.xl,
      gap: clubSpace.sm,
      overflow: 'hidden',
      borderRadius: clubRadius.xl,
      paddingHorizontal: clubSpace.lg,
      marginHorizontal: -clubSpace.xs,
      backgroundColor: tokens.bg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      minHeight: 56,
    },
    logoWrap: {
      width: 52,
      height: 52,
      borderRadius: clubRadius.pill,
      overflow: 'hidden',
      borderWidth: 2,
      backgroundColor: tokens.elevated,
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
    logoPh: { alignItems: 'center', justifyContent: 'center' },
    textCol: { flex: 1, minWidth: 0, gap: 8, justifyContent: 'center' },
    titlePill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: '100%',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: clubRadius.pill,
      backgroundColor: 'rgba(4, 20, 16, 0.55)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(16, 185, 129, 0.45)',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
    },
    pillTitle: {
      color: tokens.foreground,
      fontWeight: '800',
      flexShrink: 1,
    },
    sub: {
      paddingLeft: 4,
      color: tokens.muted,
    },
  });

/** Durée d’entrée alignée tokens motion. */
export const CLUB_ENTRANCE_MS = motion.duration.normal;

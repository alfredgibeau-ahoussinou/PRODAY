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
 * En-tête équipe / club — forme de la référence : **titre posé sur le canvas**
 * (grand, gras, sans encart ni pastille), sous-titre discret dessous, crest du
 * club conservé comme identité à gauche. L’ancienne pastille de statut à puce
 * lumineuse est retirée : elle n’existe pas dans la référence.
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
          <View style={[styles.logoWrap, { borderColor: tokens.accentSoft }]}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoPh, { backgroundColor: tokens.accentSoft }]}>
                <ClubText variant="h3" style={{ color: tokens.accent }}>
                  {initial}
                </ClubText>
              </View>
            )}
          </View>
        ) : null}
        <View style={styles.textCol}>
          <ClubText variant="h1" numberOfLines={2} style={styles.title}>
            {title}
          </ClubText>
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
    /** Titre sur le canvas : aucun encart, aucune bordure, aucun fond ajouté. */
    wrap: {
      paddingTop: clubSpace.md,
      paddingBottom: clubSpace.sm,
      gap: clubSpace.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      minHeight: 48,
    },
    logoWrap: {
      width: 44,
      height: 44,
      borderRadius: clubRadius.md,
      overflow: 'hidden',
      backgroundColor: tokens.elevated,
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
    logoPh: { alignItems: 'center', justifyContent: 'center' },
    textCol: { flex: 1, minWidth: 0, gap: 4, justifyContent: 'center' },
    title: {
      color: tokens.foreground,
    },
    sub: {
      color: tokens.muted,
    },
  });

/** Durée d’entrée alignée tokens motion. */
export const CLUB_ENTRANCE_MS = motion.duration.normal;

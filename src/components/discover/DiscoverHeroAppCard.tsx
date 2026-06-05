import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Logo } from '../Logo';
import { BRAND, spacing, radius } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

interface DiscoverHeroAppCardProps {
  pitch: string;
  statsLabel?: string;
}

/** Carte accueil — calquée sur `.hero-card-app` des maquettes ProDay */
export const DiscoverHeroAppCard: React.FC<DiscoverHeroAppCardProps> = ({
  pitch,
  statsLabel = 'Communauté en direct',
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.wrap}>
      <View style={styles.card}>
        <Logo background="light" width={140} showTagline={false} />
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
        <Text style={styles.pitch}>{pitch}</Text>
        <View style={styles.statsPill}>
          <View style={styles.statsDot} />
          <Text style={styles.statsText}>{statsLabel}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      marginTop: -spacing.xl,
      zIndex: 2,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      alignItems: 'center',
      shadowColor: c.brand,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 4,
    },
    tagline: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      color: c.textMuted,
      marginTop: spacing.sm,
    },
    pitch: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: spacing.md,
      lineHeight: 19,
      textAlign: 'center',
    },
    statsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      backgroundColor: c.brandSoft,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.brand,
    },
    statsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.brand,
    },
    statsText: {
      fontSize: 10,
      fontWeight: '800',
      color: c.brand,
      letterSpacing: 0.3,
    },
  });
}

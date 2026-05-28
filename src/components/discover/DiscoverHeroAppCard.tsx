import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Logo } from '../Logo';
import { BRAND, colors, spacing, radius } from '../../theme/designTokens';

interface DiscoverHeroAppCardProps {
  pitch: string;
  statsLabel?: string;
}

/** Carte accueil — calquée sur `.hero-card-app` des maquettes ProDay */
export const DiscoverHeroAppCard: React.FC<DiscoverHeroAppCardProps> = ({
  pitch,
  statsLabel = 'Stats temps réel · Firebase',
}) => (
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

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    zIndex: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  pitch: {
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  statsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  statsText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.3,
  },
});

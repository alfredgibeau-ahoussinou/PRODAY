import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Logo } from '../Logo';
import { discoverStyles, BRAND } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';
import { colors, spacing } from '../../theme/designTokens';

interface DiscoverLightHeaderProps {
  statsLabel?: string;
  onStatsPress?: () => void;
  universeLabel?: string;
  onUniversePress?: () => void;
}

export const DiscoverLightHeader: React.FC<DiscoverLightHeaderProps> = ({
  statsLabel,
  onStatsPress,
  universeLabel,
  onUniversePress,
}) => {
  const { logoWidth, compact, headerTopPad } = useDiscoverMetrics();

  return (
    <View style={[discoverStyles.header, { paddingTop: headerTopPad }]}>
      {universeLabel && onUniversePress ? (
        <Pressable style={styles.universeLink} onPress={onUniversePress}>
          <Text style={styles.universeLinkText}>{universeLabel}</Text>
        </Pressable>
      ) : null}
      <Logo background="light" width={logoWidth} showTagline={false} />
      <Text
        style={[discoverStyles.tagline, compact && discoverStyles.taglineCompact]}
        maxFontSizeMultiplier={1.1}
      >
        {BRAND.tagline}
      </Text>
      {statsLabel ? (
        <Pressable
          style={[discoverStyles.headerStats, compact && discoverStyles.headerStatsCompact]}
          onPress={onStatsPress}
          disabled={!onStatsPress}
        >
          <View style={discoverStyles.liveDot} />
          <Text style={discoverStyles.headerStatsText} numberOfLines={2}>
            {statsLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  universeLink: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  universeLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

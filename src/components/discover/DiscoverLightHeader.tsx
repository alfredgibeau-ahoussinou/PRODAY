import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../Logo';
import { discoverStyles, BRAND } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';
import { spacing } from '../../theme/designTokens';

interface DiscoverLightHeaderProps {
  statsLabel?: string;
  onStatsPress?: () => void;
}

export const DiscoverLightHeader: React.FC<DiscoverLightHeaderProps> = ({
  statsLabel,
  onStatsPress,
}) => {
  const insets = useSafeAreaInsets();
  const { logoWidth, compact } = useDiscoverMetrics();

  return (
    <View
      style={[
        discoverStyles.header,
        { paddingTop: insets.top + (compact ? spacing.sm : spacing.md) },
      ]}
    >
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

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Logo } from '../Logo';
import { useDiscoverStyles, BRAND } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';
import { spacing } from '../../theme/designTokens';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';

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
  const { styles: discoverStyles, colors } = useDiscoverStyles();
  const local = StyleSheet.create({
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

  return (
    <View style={[discoverStyles.header, { paddingTop: headerTopPad }]}>
      <ProDayGradient
        kind="cta"
        style={discoverStyles.headerGradientBar}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
      {universeLabel && onUniversePress ? (
        <Pressable style={local.universeLink} onPress={onUniversePress}>
          <ProDayText variant="caption" accent style={local.universeLinkText}>
            {universeLabel}
          </ProDayText>
        </Pressable>
      ) : null}
      <Logo background="light" width={logoWidth} showTagline={false} />
      <ProDayText
        variant="eyebrow"
        style={[discoverStyles.tagline, compact && discoverStyles.taglineCompact]}
        maxFontSizeMultiplier={1.1}
      >
        {BRAND.tagline}
      </ProDayText>
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


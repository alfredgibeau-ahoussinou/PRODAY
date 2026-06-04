import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBrandHeader } from '../auth/AuthBrandHeader';
import { pitchStyles } from '../auth/pitchStyles';
import { spacing } from '../../theme/designTokens';

interface DiscoverStageHeroProps {
  compact?: boolean;
}

export const DiscoverStageHero: React.FC<DiscoverStageHeroProps> = ({ compact = false }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        pitchStyles.hero,
        {
          paddingTop: insets.top + (compact ? spacing.md : spacing.lg),
          paddingBottom: compact ? spacing.xl + spacing.md : spacing.xxl + spacing.lg,
        },
      ]}
    >
      <AuthBrandHeader width={220} />
    </View>
  );
};

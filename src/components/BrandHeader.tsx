import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Logo } from './Logo';
import { spacing } from '../theme/designTokens';

type BrandHeaderSize = 'hero' | 'screen' | 'compact';

interface BrandHeaderProps {
  size?: BrandHeaderSize;
  showTagline?: boolean;
  centered?: boolean;
  style?: ViewStyle;
}

const LOGO_WIDTH: Record<BrandHeaderSize, number> = {
  hero: 200,
  screen: 140,
  compact: 96,
};

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  size = 'screen',
  showTagline = size === 'hero',
  centered = true,
  style,
}) => (
  <View style={[styles.wrap, centered && styles.centered, style]}>
    <Logo variant="light" width={LOGO_WIDTH[size]} showTagline={showTagline} />
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm },
  centered: { alignItems: 'center' },
});

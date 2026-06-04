import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { discoverStyles } from './discoverStyles';

interface DiscoverSectionLabelProps {
  children: string;
  centered?: boolean;
}

export const DiscoverSectionLabel: React.FC<DiscoverSectionLabelProps> = ({
  children,
  centered = false,
}) => (
  <Text
    style={[discoverStyles.sectionLabel, centered && styles.centered]}
    maxFontSizeMultiplier={1.15}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
    width: '100%',
  },
});

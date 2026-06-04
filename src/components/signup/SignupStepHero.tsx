import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupStepHeroProps {
  icon: IconName;
  accentColor?: string;
  iconColor?: string;
  /** `stacked` : picto au-dessus du titre, centré (inscription). */
  layout?: 'inline' | 'stacked';
}

export const SignupStepHero: React.FC<SignupStepHeroProps> = ({
  icon,
  accentColor = colors.ink,
  iconColor = colors.brandInverse,
  layout = 'stacked',
}) => (
  <View
    style={[
      styles.wrap,
      layout === 'stacked' ? styles.wrapStacked : styles.wrapInline,
      { backgroundColor: accentColor },
    ]}
  >
    <Icon name={icon} size={24} color={iconColor} variant="filled" />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapStacked: {
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  wrapInline: {
    marginRight: spacing.md,
  },
});

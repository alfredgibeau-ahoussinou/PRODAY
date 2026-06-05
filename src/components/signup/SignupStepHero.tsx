import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupStepHeroProps {
  icon: IconName;
  accentColor?: string;
  iconColor?: string;
  /** `stacked` : picto au-dessus du titre, centré (inscription). */
  layout?: 'inline' | 'stacked';
}

export const SignupStepHero: React.FC<SignupStepHeroProps> = ({
  icon,
  accentColor,
  iconColor,
  layout = 'stacked',
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const bg = accentColor ?? c.ink;
  const fg = iconColor ?? c.brandInverse;

  return (
    <View
      style={[
        styles.wrap,
        layout === 'stacked' ? styles.wrapStacked : styles.wrapInline,
        { backgroundColor: bg },
      ]}
    >
      <Icon name={icon} size={24} color={fg} variant="filled" />
    </View>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
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
}

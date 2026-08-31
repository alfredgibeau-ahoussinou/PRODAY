import React, { useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { spacing } from '../../theme/designTokens';
import { joueurGameConfirm, joueurGamePress } from '../../features/joueur/joueurSfx';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** CTA FUT18 — gradient accent, scaleTo 0.98, pas de bounce. */
export function JoueurActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  testID,
}: Props) {
  const theme = useJoueurTheme();
  const styles = useMemo(
    () => createStyles(theme.accent, theme.accentBright, theme.border, theme.ink, theme.cardRadius),
    [theme.accent, theme.accentBright, theme.border, theme.ink, theme.cardRadius],
  );

  const handlePress = () => {
    if (variant === 'primary') joueurGameConfirm();
    else joueurGamePress();
    onPress();
  };

  if (variant === 'primary') {
    return (
      <PressableSpring
        onPress={handlePress}
        disabled={disabled}
        scaleTo={0.98}
        haptic
        style={[styles.primary, disabled && styles.disabled, style]}
        testID={testID}
      >
        <LinearGradient
          colors={[theme.accentBright, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ProDayText variant="caption" style={styles.primaryText}>
          {label.toUpperCase()}
        </ProDayText>
      </PressableSpring>
    );
  }

  return (
    <PressableSpring
      onPress={handlePress}
      disabled={disabled}
      scaleTo={0.98}
      haptic={variant === 'secondary'}
      style={[
        variant === 'secondary' ? styles.secondary : styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      <ProDayText
        variant="caption"
        style={variant === 'secondary' ? styles.secondaryText : styles.ghostText}
      >
        {label.toUpperCase()}
      </ProDayText>
    </PressableSpring>
  );
}

function createStyles(
  accent: string,
  accentBright: string,
  border: string,
  ink: string,
  cardRadius: number,
) {
  return StyleSheet.create({
    primary: {
      borderRadius: cardRadius,
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      minHeight: 46,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    primaryText: {
      color: '#fff',
      fontWeight: '900',
      letterSpacing: 1.2,
      fontSize: 11,
    },
    secondary: {
      borderRadius: cardRadius,
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      minHeight: 46,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    secondaryText: {
      color: ink,
      fontWeight: '800',
      letterSpacing: 0.8,
      fontSize: 11,
    },
    ghost: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ghostText: {
      color: accentBright,
      fontWeight: '800',
      letterSpacing: 0.6,
      fontSize: 10,
    },
    disabled: { opacity: 0.45 },
  });
}

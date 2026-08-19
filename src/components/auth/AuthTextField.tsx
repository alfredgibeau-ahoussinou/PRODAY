import React, { forwardRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

import { AUTH_SHEET } from './authSheetPalette';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  icon?: IconName;
  error?: string;
  secureToggle?: boolean;
  /** Champs sur feuille auth claire */
  tone?: 'default' | 'sheet';
}

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField(
  {
    label,
    icon,
    error,
    secureToggle,
    secureTextEntry,
    tone = 'default',
    style,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c, tone), [c, tone]);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const isSecure = secureToggle ? hidden : secureTextEntry;

  const fieldAnimStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? c.error
      : focusAnim.value > 0.5
        ? tone === 'sheet'
          ? AUTH_SHEET.text
          : c.ink
        : tone === 'sheet'
          ? AUTH_SHEET.border
          : c.border,
    backgroundColor: error
      ? c.errorBg
      : focusAnim.value > 0.5
        ? tone === 'sheet'
          ? AUTH_SHEET.background
          : c.surface
        : tone === 'sheet'
          ? AUTH_SHEET.backgroundMuted
          : c.surfaceMuted,
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, fieldAnimStyle]}>
        {icon ? (
          <Icon name={icon} size={20} color={focused ? c.text : c.textMuted} />
        ) : null}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={c.textMuted}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setFocused(true);
            focusAnim.value = withTiming(1, { duration: 160 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            focusAnim.value = withTiming(0, { duration: 160 });
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureToggle ? (
          <PressableSpring
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            scaleTo={0.97}
            accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer'}
          >
            <Icon name={hidden ? 'eye-off' : 'eye'} size={20} color={focused ? c.text : c.textMuted} />
          </PressableSpring>
        ) : null}
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

function createStyles(c: AppColors, tone: 'default' | 'sheet') {
  const sheet = tone === 'sheet';
  return StyleSheet.create({
    wrap: { marginBottom: spacing.sm + 2 },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: sheet ? AUTH_SHEET.textSecondary : c.textSecondary,
      marginBottom: 6,
      letterSpacing: -0.1,
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: sheet ? AUTH_SHEET.text : c.text,
      paddingVertical: spacing.sm,
    },
    errorText: { fontSize: 12, color: c.error, marginTop: 4, fontWeight: '600' },
  });
}

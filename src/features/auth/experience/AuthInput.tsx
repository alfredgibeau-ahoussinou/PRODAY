import React, { forwardRef, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { AUTH_XP } from './tokens';

export type AuthInputProps = TextInputProps & {
  label: string;
  error?: string;
  icon?: IconName;
  secureToggle?: boolean;
};

export const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  {
    label,
    error,
    icon,
    secureToggle,
    secureTextEntry,
    editable = true,
    value,
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref,
) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry || secureToggle));
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const isSecure = secureToggle ? hidden : secureTextEntry;
  const filled = Boolean(value && String(value).length > 0);
  const disabled = editable === false;

  const fieldAnim = useAnimatedStyle(() => ({
    borderColor: error
      ? AUTH_XP.borderError
      : focusAnim.value > 0.5
        ? AUTH_XP.borderFocus
        : AUTH_XP.border,
    backgroundColor: disabled
      ? AUTH_XP.inputBgDisabled
      : error
        ? AUTH_XP.errorBg
        : focusAnim.value > 0.5 || filled
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.04)',
  }));

  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <ProDayText
        variant="caption"
        style={[styles.label, focused && { color: AUTH_XP.gold }]}
      >
        {label}
      </ProDayText>
      <Animated.View style={[styles.field, fieldAnim, disabled && styles.disabled]}>
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={focused ? AUTH_XP.gold : AUTH_XP.textMuted}
          />
        ) : null}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          value={value}
          editable={editable}
          secureTextEntry={isSecure}
          placeholderTextColor={AUTH_XP.textDim}
          selectionColor={AUTH_XP.gold}
          autoCorrect={false}
          onFocus={(e) => {
            setFocused(true);
            focusAnim.value = withTiming(1, { duration: AUTH_XP.motionFast });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            focusAnim.value = withTiming(0, { duration: AUTH_XP.motionFast });
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          {...rest}
        />
        {secureToggle ? (
          <PressableSpring
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            scaleTo={0.92}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
          >
            <Icon
              name={hidden ? 'eye' : 'eye-off'}
              size={20}
              color={focused ? AUTH_XP.gold : AUTH_XP.textMuted}
            />
          </PressableSpring>
        ) : null}
      </Animated.View>
      {error ? (
        <ProDayText variant="caption" style={styles.error}>
          {error}
        </ProDayText>
      ) : null}
    </View>
  );
});

function createStyles() {
  return StyleSheet.create({
    wrap: {
      gap: 6,
      marginBottom: 16,
    },
    label: {
      color: AUTH_XP.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontSize: 11,
      fontWeight: '700',
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1.5,
    },
    input: {
      flex: 1,
      color: AUTH_XP.white,
      fontSize: 16,
      paddingVertical: 12,
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.55,
    },
    error: {
      color: AUTH_XP.error,
      marginTop: 2,
      fontSize: 12,
      fontWeight: '600',
    },
  });
}

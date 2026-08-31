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
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { AUTH_XP } from '../../features/auth/experience/tokens';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  icon?: IconName;
  error?: string;
  secureToggle?: boolean;
  /** @deprecated Conservé pour compat — la DA Experience est always dark. */
  tone?: 'default' | 'sheet';
}

/** Champ auth — délègue le look à Auth Experience (noir / or). */
export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(
  function AuthTextField(
    {
      label,
      icon,
      error,
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
    const styles = useMemo(() => createStyles(), []);

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
            ? AUTH_XP.inputBgFilled
            : AUTH_XP.inputBg,
    }));

    return (
      <View style={styles.wrap}>
        <ProDayText variant="caption" style={styles.label}>
          {label}
        </ProDayText>
        <Animated.View style={[styles.field, fieldAnim, disabled && styles.disabled]}>
          {icon ? (
            <Icon
              name={icon}
              size={18}
              color={focused ? AUTH_XP.goldBright : AUTH_XP.textMuted}
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
                size={18}
                color={AUTH_XP.textMuted}
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
  },
);

function createStyles() {
  return StyleSheet.create({
    wrap: {
      gap: 6,
      marginBottom: 16,
    },
    label: {
      color: AUTH_XP.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontSize: 11,
      fontWeight: '600',
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 52,
      paddingHorizontal: 16,
      borderRadius: AUTH_XP.radiusMd,
      borderWidth: 1,
    },
    input: {
      flex: 1,
      color: AUTH_XP.white,
      fontSize: 15,
      paddingVertical: 12,
      fontWeight: '500',
    },
    disabled: { opacity: 0.55 },
    error: {
      color: AUTH_XP.error,
      marginTop: 2,
      fontSize: 12,
    },
  });
}

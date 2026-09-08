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
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  icon?: IconName;
  error?: string;
  secureToggle?: boolean;
  /** @deprecated Conservé pour compat. */
  tone?: 'default' | 'sheet';
  /** Override accent focus (sinon chrome inscription courant). */
  accent?: string;
}

/** Champ auth/signup — focus & surfaces = pôle courant. */
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
      accent: accentProp,
      ...rest
    },
    ref,
  ) {
    const { visual } = useSignupFlowTheme();
    const focusColor = accentProp ?? visual.focus;
    const [hidden, setHidden] = useState(Boolean(secureTextEntry || secureToggle));
    const [focused, setFocused] = useState(false);
    const focusAnim = useSharedValue(0);
    const isSecure = secureToggle ? hidden : secureTextEntry;
    const filled = Boolean(value && String(value).length > 0);
    const disabled = editable === false;
    const styles = useMemo(
      () =>
        createStyles({
          text: visual.text,
          textMuted: visual.textMuted,
          border: visual.border,
          surface: visual.surface,
          elevated: visual.elevated,
          danger: visual.danger,
          dangerSoft: visual.dangerSoft,
        }),
      [visual],
    );

    const fieldAnim = useAnimatedStyle(() => ({
      borderColor: error
        ? visual.danger
        : focusAnim.value > 0.5
          ? focusColor
          : visual.border,
      backgroundColor: disabled
        ? 'rgba(255,255,255,0.02)'
        : error
          ? visual.dangerSoft
          : focusAnim.value > 0.5 || filled
            ? visual.elevated
            : visual.surface,
    }));

    return (
      <View style={styles.wrap}>
        <ProDayText
          variant="caption"
          style={[styles.label, focused && { color: focusColor }]}
        >
          {label}
        </ProDayText>
        <Animated.View style={[styles.field, fieldAnim, disabled && styles.disabled]}>
          {icon ? (
            <Icon
              name={icon}
              size={18}
              color={focused ? focusColor : visual.textMuted}
            />
          ) : null}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            value={value}
            editable={editable}
            secureTextEntry={isSecure}
            placeholderTextColor={visual.textFaint}
            selectionColor={focusColor}
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
                color={visual.textMuted}
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

function createStyles(v: {
  text: string;
  textMuted: string;
  border: string;
  surface: string;
  elevated: string;
  danger: string;
  dangerSoft: string;
}) {
  return StyleSheet.create({
    wrap: {
      gap: 6,
      marginBottom: 14,
    },
    label: {
      color: v.textMuted,
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
      borderRadius: 12,
      borderWidth: 1,
    },
    input: {
      flex: 1,
      color: v.text,
      fontSize: 15,
      paddingVertical: 12,
      fontWeight: '500',
    },
    disabled: { opacity: 0.55 },
    error: {
      color: v.danger,
      marginTop: 2,
      fontSize: 12,
    },
  });
}

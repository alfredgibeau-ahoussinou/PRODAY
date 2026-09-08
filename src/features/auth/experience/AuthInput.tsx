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
  /** Accent focus pôle (sinon or master). */
  accent?: string;
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
    accent = AUTH_XP.goldBright,
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
  const focusColor = accent.toUpperCase() === '#FFFFFF' ? AUTH_XP.goldBright : accent;

  const fieldAnim = useAnimatedStyle(() => ({
    borderColor: error
      ? AUTH_XP.borderError
      : focusAnim.value > 0.5
        ? focusColor
        : 'rgba(255, 255, 255, 0.12)',
    backgroundColor: disabled
      ? 'rgba(255, 255, 255, 0.02)'
      : error
        ? 'rgba(239, 68, 68, 0.08)'
        : focusAnim.value > 0.5 || filled
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(255, 255, 255, 0.03)',
  }));

  const styles = useMemo(() => createStyles(), []);

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
            color={focused ? focusColor : 'rgba(255, 255, 255, 0.4)'}
          />
        ) : null}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          value={value}
          editable={editable}
          secureTextEntry={isSecure}
          placeholderTextColor="rgba(255, 255, 255, 0.25)"
          selectionColor={focusColor}
          autoCorrect={false}
          onFocus={(e) => {
            setFocused(true);
            focusAnim.value = withTiming(1, { duration: 150 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            focusAnim.value = withTiming(0, { duration: 150 });
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
              color="rgba(255, 255, 255, 0.4)"
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
      marginBottom: 14,
    },
    label: {
      color: 'rgba(255, 255, 255, 0.55)',
      letterSpacing: 0.5,
      fontSize: 12,
      fontWeight: '600',
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 50,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
    },
    input: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 15,
      paddingVertical: 10,
      fontWeight: '500',
    },
    disabled: {
      opacity: 0.5,
    },
    error: {
      color: '#F87171',
      marginTop: 2,
      fontSize: 12,
      fontWeight: '500',
    },
  });
}

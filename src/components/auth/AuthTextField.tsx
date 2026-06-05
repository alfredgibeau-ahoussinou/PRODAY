import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  icon?: IconName;
  error?: string;
  secureToggle?: boolean;
}

export const AuthTextField: React.FC<AuthTextFieldProps> = ({
  label,
  icon,
  error,
  secureToggle,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);
  const isSecure = secureToggle ? hidden : secureTextEntry;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {icon ? (
          <Icon name={icon} size={20} color={focused ? c.text : c.textMuted} />
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={c.textMuted}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureToggle ? (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer'}
          >
            <Icon name={hidden ? 'eye-off' : 'eye'} size={20} color={c.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: c.text,
      marginBottom: spacing.xs,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      minHeight: 54,
    },
    fieldFocused: {
      borderColor: c.ink,
      backgroundColor: c.surface,
    },
    fieldError: {
      borderColor: c.error,
      backgroundColor: c.errorBg,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: c.text,
      paddingVertical: spacing.sm,
    },
    errorText: { fontSize: 12, color: c.error, marginTop: 4, fontWeight: '600' },
  });
}

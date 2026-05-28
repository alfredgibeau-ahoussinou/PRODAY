import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface AdminSearchFieldProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

export const AdminSearchField: React.FC<AdminSearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Rechercher…',
}) => (
  <View style={styles.wrap}>
    <Icon name="search" size={18} color={colors.textMuted} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});

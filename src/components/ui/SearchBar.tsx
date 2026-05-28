import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';
import { Icon } from './Icon';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher…',
  value,
  onChangeText,
}) => (
  <View style={styles.wrap}>
    <Icon name="search" size={18} color={colors.textMuted} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 15, color: colors.text },
});

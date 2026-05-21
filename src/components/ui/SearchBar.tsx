import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme/designTokens';

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
    <Text style={styles.icon}>🔍</Text>
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  icon: { fontSize: 16, marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 15, color: colors.text },
});

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { Icon } from './Icon';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  /** Sans marges externes — pour barres d’outils intégrées. */
  embedded?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher…',
  value,
  onChangeText,
  embedded = false,
}) => {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.wrap,
        embedded && styles.wrapEmbedded,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.soft,
      ]}
    >
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 44,
  },
  wrapEmbedded: {
    marginHorizontal: 0,
    marginBottom: 0,
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
});

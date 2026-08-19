import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { Icon } from './Icon';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  /** Sans marges externes — pour barres d’outils intégrées. */
  embedded?: boolean;
  palette?: {
    surface: string;
    border: string;
    text: string;
    textMuted: string;
  };
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher…',
  value,
  onChangeText,
  embedded = false,
  palette,
}) => {
  const { colors } = useAppTheme();
  const surface = palette?.surface ?? colors.surface;
  const border = palette?.border ?? colors.border;
  const text = palette?.text ?? colors.text;
  const textMuted = palette?.textMuted ?? colors.textMuted;

  return (
    <View
      style={[
        styles.wrap,
        embedded && styles.wrapEmbedded,
        {
          backgroundColor: surface,
          borderColor: border,
        },
      ]}
    >
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={[styles.input, { color: text }]}
        placeholder={placeholder}
        placeholderTextColor={textMuted}
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

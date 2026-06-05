import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminSearchFieldProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

export const AdminSearchField: React.FC<AdminSearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Rechercher…',
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <Icon name="search" size={18} color={c.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: c.text,
      paddingVertical: spacing.sm,
    },
  });
}

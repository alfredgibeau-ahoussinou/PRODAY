import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAdminStyles, adminChrome } from './adminStyles';
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
      <View style={styles.iconBox}>
        <Icon name="search" size={16} color={adminChrome.accentHot} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <PressableSpring onPress={() => onChangeText('')} scaleTo={0.97} haptic style={styles.clear}>
          <Icon name="close" size={14} color={c.textMuted} />
        </PressableSpring>
      ) : null}
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
      borderRadius: radius.xl,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: c.text,
      paddingVertical: spacing.sm,
      fontWeight: '600',
    },
    clear: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

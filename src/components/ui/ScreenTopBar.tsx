import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/designTokens';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from './Icon';

interface ScreenTopBarProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
}

export const ScreenTopBar: React.FC<ScreenTopBarProps> = ({
  title,
  onBack,
  onMenu,
  rightLabel,
  onRightPress,
}) => (
  <View style={styles.bar}>
    {onBack ? (
      <TouchableOpacity onPress={onBack} style={styles.side} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={colors.brand} />
      </TouchableOpacity>
    ) : (
      <View style={styles.side} />
    )}
    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>
    {onMenu ? (
      <TouchableOpacity onPress={onMenu} style={styles.side} hitSlop={12}>
        <Icon name="menu" size={20} color={colors.text} />
      </TouchableOpacity>
    ) : onRightPress && rightLabel ? (
      <TouchableOpacity onPress={onRightPress} style={styles.side}>
        <Text style={styles.right}>{rightLabel}</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.side} />
    )}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: { width: 40, alignItems: 'center', justifyContent: 'center' },
  backFlip: { transform: [{ rotate: '180deg' }], position: 'absolute' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  right: { fontSize: 14, fontWeight: '600', color: colors.brand },
});

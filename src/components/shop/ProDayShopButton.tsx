import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface ProDayShopButtonProps {
  compact?: boolean;
}

/** Accès boutique — présent sur tous les espaces ProDay. */
export const ProDayShopButton: React.FC<ProDayShopButtonProps> = ({ compact }) => {
  const { colors } = useAppTheme();
  const { openShop } = useTabNavigation();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.soft,
        pressed && styles.pressed,
      ]}
      onPress={openShop}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir ProDay Shop"
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <Icon name="bag" size={compact ? 14 : 16} color={colors.ink} variant="filled" />
      </View>
      <Text style={[styles.label, compact && styles.labelCompact, { color: colors.text }]}>
        Shop
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  btnCompact: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 12,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});

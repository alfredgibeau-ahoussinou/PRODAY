import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SHOP_TRUST_ITEMS } from '../../content/prodayShop';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';

export const ShopTrustStrip: React.FC = () => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.row}>
      {SHOP_TRUST_ITEMS.map((item) => (
        <View key={item.title} style={[styles.item, { borderColor: c.border, backgroundColor: c.surface }]}>
          <View style={[styles.iconWrap, { backgroundColor: c.surfaceMuted }]}>
            <Icon name={item.icon} size={18} color={c.accent} variant="filled" />
          </View>
          <ProDayText variant="caption" style={styles.title}>
            {item.title}
          </ProDayText>
          <ProDayText variant="caption" muted numberOfLines={2} style={styles.body}>
            {item.body}
          </ProDayText>
        </View>
      ))}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    item: {
      flex: 1,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.sm,
      alignItems: 'center',
      gap: 4,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontWeight: '800',
      textAlign: 'center',
      color: c.text,
    },
    body: {
      textAlign: 'center',
      fontSize: 10,
      lineHeight: 13,
    },
  });
}

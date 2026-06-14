import React, { useMemo } from 'react';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import {
  getShopCategories,
  type ShopProduct,
  type ShopProductCategory,
} from '../../content/prodayShop';
import type { ProductLineId } from '../../models/ProductLine';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';

interface ShopCategoryRailProps {
  productLine: ProductLineId;
  catalog: ShopProduct[];
  active: ShopProductCategory | 'all';
  onSelect: (category: ShopProductCategory | 'all') => void;
}

export const ShopCategoryRail: React.FC<ShopCategoryRailProps> = ({
  productLine,
  catalog,
  active,
  onSelect,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const chips = useMemo(() => {
    const count = (cat: ShopProductCategory | 'all') =>
      cat === 'all' ? catalog.length : catalog.filter((p) => p.category === cat).length;

    const all = { id: 'all' as const, label: 'Tout', icon: 'bag' as const, count: count('all') };
    const cats = getShopCategories(productLine)
      .map((def) => ({ ...def, count: count(def.id) }))
      .filter((def) => def.count > 0);

    return [all, ...cats];
  }, [catalog, productLine]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const selected = active === chip.id;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onSelect(chip.id)}
            style={[styles.chip, selected && styles.chipOn]}
          >
            <Icon
              name={chip.icon}
              size={15}
              color={selected ? c.brandInverse : c.textSecondary}
              variant={selected ? 'filled' : undefined}
            />
            <ProDayText
              variant="caption"
              style={[styles.chipLabel, selected && styles.chipLabelOn]}
            >
              {chip.label}
            </ProDayText>
          </Pressable>
        );
      })}
      <View style={styles.trail} />
    </ScrollView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: {
      backgroundColor: c.ink,
      borderColor: c.ink,
    },
    chipLabel: {
      fontWeight: '700',
      color: c.textSecondary,
    },
    chipLabelOn: {
      color: c.brandInverse,
    },
    trail: { width: spacing.xs },
  });
}

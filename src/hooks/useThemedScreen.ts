import { useMemo } from 'react';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';
import type { ProductLineId } from '../models/ProductLine';

export function useThemedScreen(): {
  colors: AppColors;
  productLine: ProductLineId;
  rootStyle: { flex: 1; backgroundColor: string };
} {
  const { colors, productLine } = useAppTheme();
  return useMemo(
    () => ({
      colors,
      productLine,
      rootStyle: { flex: 1, backgroundColor: colors.background },
    }),
    [colors, productLine]
  );
}

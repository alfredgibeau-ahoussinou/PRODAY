import { useMemo } from 'react';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';
import type { ProductLineId } from '../models/ProductLine';

export function useThemedScreen(): {
  colors: AppColors;
  productLine: ProductLineId;
  isWoman: boolean;
  rootStyle: { flex: 1; backgroundColor: string };
} {
  const { colors, productLine, isWoman } = useAppTheme();
  return useMemo(
    () => ({
      colors,
      productLine,
      isWoman,
      rootStyle: { flex: 1, backgroundColor: colors.background },
    }),
    [colors, productLine, isWoman]
  );
}

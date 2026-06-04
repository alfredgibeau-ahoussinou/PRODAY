import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isWomanProductLine,
  normalizeStoredProductLine,
  PRODAY_WOMAN_BRAND,
  PRODUCT_LINE_STORAGE_KEY,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import { getThemedColors, type AppColors } from '../theme/prodayWomanTheme';
import { BRAND, colors as defaultColors } from '../theme/designTokens';

interface ProductLineContextValue {
  productLine: ProductLineId;
  womanSpaceActive: boolean;
  isWoman: boolean;
  /** @deprecated Préférer isWoman */
  isGirl: boolean;
  brandName: string;
  tagline: string;
  colors: AppColors;
  setProductLine: (line: ProductLineId) => Promise<void>;
  enterWomanSpace: () => Promise<void>;
  exitWomanSpace: () => Promise<void>;
  loading: boolean;
}

const ProductLineContext = createContext<ProductLineContextValue | null>(null);

export const ProductLineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [productLine, setLineState] = useState<ProductLineId>('standard');
  const [womanSpaceActive, setWomanSpaceActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedLine, spaceFlag] = await Promise.all([
          AsyncStorage.getItem(PRODUCT_LINE_STORAGE_KEY),
          AsyncStorage.getItem(WOMAN_SPACE_ACTIVE_KEY),
        ]);
        const line = normalizeStoredProductLine(storedLine) ?? 'standard';
        const inWoman = spaceFlag === '1' && line === 'woman';
        if (!cancelled) {
          setWomanSpaceActive(inWoman);
          setLineState(inWoman ? 'woman' : 'standard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistWomanState = useCallback(async (active: boolean, line: ProductLineId) => {
    await AsyncStorage.multiSet([
      [PRODUCT_LINE_STORAGE_KEY, line],
      [WOMAN_SPACE_ACTIVE_KEY, active ? '1' : '0'],
    ]);
  }, []);

  const enterWomanSpace = useCallback(async () => {
    setWomanSpaceActive(true);
    setLineState('woman');
    await persistWomanState(true, 'woman');
  }, [persistWomanState]);

  const exitWomanSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('standard');
    await persistWomanState(false, 'standard');
  }, [persistWomanState]);

  const setProductLine = useCallback(
    async (line: ProductLineId) => {
      if (line === 'woman') await enterWomanSpace();
      else await exitWomanSpace();
    },
    [enterWomanSpace, exitWomanSpace]
  );

  const isWoman = womanSpaceActive && isWomanProductLine(productLine);

  const value = useMemo(
    () => ({
      productLine: (isWoman ? 'woman' : 'standard') as ProductLineId,
      womanSpaceActive,
      isWoman,
      isGirl: isWoman,
      brandName: isWoman ? PRODAY_WOMAN_BRAND.name : BRAND.name,
      tagline: isWoman ? PRODAY_WOMAN_BRAND.tagline : BRAND.tagline,
      colors: getThemedColors(isWoman),
      setProductLine,
      enterWomanSpace,
      exitWomanSpace,
      loading,
    }),
    [
      productLine,
      womanSpaceActive,
      isWoman,
      setProductLine,
      enterWomanSpace,
      exitWomanSpace,
      loading,
    ]
  );

  return (
    <ProductLineContext.Provider value={value}>{children}</ProductLineContext.Provider>
  );
};

export function useProductLine(): ProductLineContextValue {
  const ctx = useContext(ProductLineContext);
  if (!ctx) throw new Error('useProductLine doit être utilisé dans ProductLineProvider');
  return ctx;
}

export function useAppTheme() {
  const {
    colors,
    isWoman,
    isGirl,
    brandName,
    tagline,
    productLine,
    setProductLine,
    enterWomanSpace,
    exitWomanSpace,
    womanSpaceActive,
  } = useProductLine();
  return {
    colors,
    isWoman,
    isGirl,
    brandName,
    tagline,
    productLine,
    setProductLine,
    enterWomanSpace,
    exitWomanSpace,
    womanSpaceActive,
  };
}

export { defaultColors };

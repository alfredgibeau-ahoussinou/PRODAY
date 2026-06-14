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
  brandForProductLine,
  normalizeStoredProductLine,
  PRODUCT_LINE_STORAGE_KEY,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import { getThemedColorsForLine, type AppColors } from '../theme/universeTheme';
import { BRAND, colors as defaultColors } from '../theme/designTokens';

interface ProductLineContextValue {
  productLine: ProductLineId;
  womanSpaceActive: boolean;
  isWoman: boolean;
  isHomme: boolean;
  isPro: boolean;
  isSante: boolean;
  /** @deprecated Préférer isWoman */
  isGirl: boolean;
  brandName: string;
  tagline: string;
  colors: AppColors;
  setProductLine: (line: ProductLineId) => Promise<void>;
  enterHommeSpace: () => Promise<void>;
  enterWomanSpace: () => Promise<void>;
  enterProSpace: () => Promise<void>;
  enterSanteSpace: () => Promise<void>;
  exitWomanSpace: () => Promise<void>;
  loading: boolean;
}

const ProductLineContext = createContext<ProductLineContextValue | null>(null);

export const ProductLineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [productLine, setLineState] = useState<ProductLineId>('homme');
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
        const line = normalizeStoredProductLine(storedLine) ?? 'homme';
        const legacyWoman = spaceFlag === '1' && line === 'homme';
        const resolved: ProductLineId = legacyWoman ? 'woman' : line;
        if (!cancelled) {
          setWomanSpaceActive(resolved === 'woman');
          setLineState(resolved);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistLine = useCallback(async (line: ProductLineId) => {
    await AsyncStorage.multiSet([
      [PRODUCT_LINE_STORAGE_KEY, line],
      [WOMAN_SPACE_ACTIVE_KEY, line === 'woman' ? '1' : '0'],
    ]);
  }, []);

  const enterHommeSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('homme');
    await persistLine('homme');
  }, [persistLine]);

  const enterWomanSpace = useCallback(async () => {
    setWomanSpaceActive(true);
    setLineState('woman');
    await persistLine('woman');
  }, [persistLine]);

  const enterProSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('pro');
    await persistLine('pro');
  }, [persistLine]);

  const enterSanteSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('sante');
    await persistLine('sante');
  }, [persistLine]);

  const exitWomanSpace = useCallback(async () => {
    await enterHommeSpace();
  }, [enterHommeSpace]);

  const setProductLine = useCallback(
    async (line: ProductLineId) => {
      if (line === 'woman') await enterWomanSpace();
      else if (line === 'pro') await enterProSpace();
      else if (line === 'sante') await enterSanteSpace();
      else await enterHommeSpace();
    },
    [enterHommeSpace, enterWomanSpace, enterProSpace, enterSanteSpace]
  );

  const isWoman = productLine === 'woman';
  const isHomme = productLine === 'homme';
  const isPro = productLine === 'pro';
  const isSante = productLine === 'sante';
  const brand = brandForProductLine(productLine);

  const value = useMemo(
    () => ({
      productLine,
      womanSpaceActive,
      isWoman,
      isHomme,
      isPro,
      isSante,
      isGirl: isWoman,
      brandName: brand.name,
      tagline: brand.tagline,
      colors: getThemedColorsForLine(productLine),
      setProductLine,
      enterHommeSpace,
      enterWomanSpace,
      enterProSpace,
      enterSanteSpace,
      exitWomanSpace,
      loading,
    }),
    [
      productLine,
      womanSpaceActive,
      isWoman,
      isHomme,
      isPro,
      isSante,
      brand.name,
      brand.tagline,
      setProductLine,
      enterHommeSpace,
      enterWomanSpace,
      enterProSpace,
      enterSanteSpace,
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
    isHomme,
    isPro,
    isSante,
    isGirl,
    brandName,
    tagline,
    productLine,
    setProductLine,
    enterHommeSpace,
    enterWomanSpace,
    enterProSpace,
    enterSanteSpace,
    exitWomanSpace,
    womanSpaceActive,
  } = useProductLine();
  return {
    colors,
    isWoman,
    isHomme,
    isPro,
    isSante,
    isGirl,
    brandName,
    tagline,
    productLine,
    setProductLine,
    enterHommeSpace,
    enterWomanSpace,
    enterProSpace,
    enterSanteSpace,
    exitWomanSpace,
    womanSpaceActive,
  };
}

export { defaultColors };

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
  isProProductLine,
  normalizeStoredProductLine,
  PRODUCT_LINE_STORAGE_KEY,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import { PRO_SIGNUP_PRESET_ROLE_KEY } from '../models/CarouselPole';
import type { UserRole } from '../models/User';
import { getThemedColorsForLine, type AppColors } from '../theme/universeTheme';
import { BRAND, colors as defaultColors } from '../theme/designTokens';

interface ProductLineContextValue {
  productLine: ProductLineId;
  womanSpaceActive: boolean;
  isWoman: boolean;
  isHomme: boolean;
  isPro: boolean;
  isAmateur: boolean;
  isSupporter: boolean;
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
  enterProLine: (line: ProductLineId) => Promise<void>;
  enterAmateurSpace: () => Promise<void>;
  enterSupporterSpace: () => Promise<void>;
  enterSanteSpace: () => Promise<void>;
  exitWomanSpace: () => Promise<void>;
  /** Rôle présélectionné après choix carousel pro_player / pro_club / pro_staff. */
  proSignupPresetRole: UserRole | null;
  setProSignupPresetRole: (role: UserRole | null) => Promise<void>;
  loading: boolean;
}

const ProductLineContext = createContext<ProductLineContextValue | null>(null);

export const ProductLineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Défaut Amateur (cible doc architecture §1.4) — fusion homme/woman au carousel.
  const [productLine, setLineState] = useState<ProductLineId>('amateur');
  const [womanSpaceActive, setWomanSpaceActive] = useState(false);
  const [proSignupPresetRole, setProSignupPresetRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedLine, spaceFlag, presetRole] = await Promise.all([
          AsyncStorage.getItem(PRODUCT_LINE_STORAGE_KEY),
          AsyncStorage.getItem(WOMAN_SPACE_ACTIVE_KEY),
          AsyncStorage.getItem(PRO_SIGNUP_PRESET_ROLE_KEY),
        ]);
        const line = normalizeStoredProductLine(storedLine) ?? 'amateur';
        // Compat installs existants — ancien flag woman sans product_line homme/woman explicite.
        const legacyWoman = spaceFlag === '1' && line === 'homme';
        const resolved: ProductLineId = legacyWoman ? 'woman' : line;
        if (!cancelled) {
          setWomanSpaceActive(resolved === 'woman');
          setLineState(resolved);
          setProSignupPresetRoleState((presetRole as UserRole | null) ?? null);
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

  const setProSignupPresetRole = useCallback(async (role: UserRole | null) => {
    setProSignupPresetRoleState(role);
    if (role) {
      await AsyncStorage.setItem(PRO_SIGNUP_PRESET_ROLE_KEY, role);
    } else {
      await AsyncStorage.removeItem(PRO_SIGNUP_PRESET_ROLE_KEY);
    }
  }, []);

  const enterProSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('pro_staff');
    await persistLine('pro_staff');
  }, [persistLine]);

  const enterProLine = useCallback(
    async (line: ProductLineId) => {
      setWomanSpaceActive(false);
      const resolved =
        line === 'pro_player' || line === 'pro_club' || line === 'pro_staff'
          ? line
          : line === 'pro'
            ? 'pro_staff'
            : line;
      setLineState(resolved);
      await persistLine(resolved);
    },
    [persistLine],
  );

  const enterAmateurSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('amateur');
    setProSignupPresetRoleState(null);
    await AsyncStorage.removeItem(PRO_SIGNUP_PRESET_ROLE_KEY);
    await persistLine('amateur');
  }, [persistLine]);

  const enterSupporterSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('supporter');
    setProSignupPresetRoleState(null);
    await AsyncStorage.removeItem(PRO_SIGNUP_PRESET_ROLE_KEY);
    await persistLine('supporter');
  }, [persistLine]);

  const enterSanteSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('sante');
    setProSignupPresetRoleState(null);
    await AsyncStorage.removeItem(PRO_SIGNUP_PRESET_ROLE_KEY);
    await persistLine('sante');
  }, [persistLine]);

  const exitWomanSpace = useCallback(async () => {
    await enterAmateurSpace();
  }, [enterAmateurSpace]);

  const setProductLine = useCallback(
    async (line: ProductLineId) => {
      if (line === 'woman') await enterWomanSpace();
      else if (isProProductLine(line)) await enterProLine(line);
      else if (line === 'amateur') await enterAmateurSpace();
      else if (line === 'supporter') await enterSupporterSpace();
      else if (line === 'sante') await enterSanteSpace();
      else await enterHommeSpace();
    },
    [enterHommeSpace, enterWomanSpace, enterProLine, enterAmateurSpace, enterSupporterSpace, enterSanteSpace]
  );

  const isWoman = productLine === 'woman';
  const isHomme = productLine === 'homme';
  const isPro = isProProductLine(productLine);
  const isAmateur = productLine === 'amateur';
  const isSupporter = productLine === 'supporter';
  const isSante = productLine === 'sante';
  const brand = brandForProductLine(productLine);

  const value = useMemo(
    () => ({
      productLine,
      womanSpaceActive,
      isWoman,
      isHomme,
      isPro,
      isAmateur,
      isSupporter,
      isSante,
      isGirl: isWoman,
      brandName: brand.name,
      tagline: brand.tagline,
      colors: getThemedColorsForLine(productLine),
      setProductLine,
      enterHommeSpace,
      enterWomanSpace,
      enterProSpace,
      enterProLine,
      enterAmateurSpace,
      enterSupporterSpace,
      enterSanteSpace,
      exitWomanSpace,
      proSignupPresetRole,
      setProSignupPresetRole,
      loading,
    }),
    [
      productLine,
      womanSpaceActive,
      isWoman,
      isHomme,
      isPro,
      isAmateur,
      isSupporter,
      isSante,
      brand.name,
      brand.tagline,
      setProductLine,
      enterHommeSpace,
      enterWomanSpace,
      enterProSpace,
      enterProLine,
      enterAmateurSpace,
      enterSupporterSpace,
      enterSanteSpace,
      exitWomanSpace,
      proSignupPresetRole,
      setProSignupPresetRole,
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
    isAmateur,
    isSupporter,
    isSante,
    isGirl,
    brandName,
    tagline,
    productLine,
    setProductLine,
    enterHommeSpace,
    enterWomanSpace,
    enterProSpace,
    enterAmateurSpace,
    enterSupporterSpace,
    enterSanteSpace,
    exitWomanSpace,
    womanSpaceActive,
    proSignupPresetRole,
    setProSignupPresetRole,
  } = useProductLine();
  return {
    colors,
    isWoman,
    isHomme,
    isPro,
    isAmateur,
    isSupporter,
    isSante,
    isGirl,
    brandName,
    tagline,
    productLine,
    setProductLine,
    enterHommeSpace,
    enterWomanSpace,
    enterProSpace,
    enterAmateurSpace,
    enterSupporterSpace,
    enterSanteSpace,
    exitWomanSpace,
    womanSpaceActive,
    proSignupPresetRole,
    setProSignupPresetRole,
  };
}

export { defaultColors };

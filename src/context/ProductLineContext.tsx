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
  PRODAY_SPONSOR_BRAND,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import { PRO_SIGNUP_PRESET_ROLE_KEY } from '../models/CarouselPole';
import type { UserRole } from '../models/User';
import { getThemedColorsForLine, type AppColors } from '../theme/universeTheme';
import { BRAND, colors as defaultColors } from '../theme/designTokens';
import { useAuth } from './AuthContext';
import { getUserProductLine } from '../utils/productLineAccess';
import { resolvePlayerSegment, type PlayerSegment } from '../utils/playerSegment';
import {
  colorsForAuthContext,
  isSponsorAuthPreset,
  reconcileProSignupPreset,
} from '../utils/authBrandContext';

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
  /** Invité sur parcours Sponsor (carousel / CTA) — chrome or sans polluer un user connecté Pro. */
  isSponsorAuthChrome: boolean;
  /** Segment joueur actif (thème homme/femme/mineur). */
  playerSegment: PlayerSegment | null;
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
  const { profile } = useAuth();
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
        let line = normalizeStoredProductLine(storedLine) ?? 'amateur';
        // Compat installs — ancien flag woman : bascule vers amateur jusqu’au profil connecté.
        const legacyWoman = spaceFlag === '1' && line === 'homme';
        if (legacyWoman) line = 'amateur';
        // Homme / Woman ne sont plus des pôles carousel — normaliser le stockage invité.
        if (line === 'homme' || line === 'woman') line = 'amateur';
        const resolved: ProductLineId = line;
        if (!cancelled) {
          setWomanSpaceActive(false);
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

  const playerSegment = useMemo(() => {
    if (!profile) return null;
    const userLine = getUserProductLine(profile);
    return resolvePlayerSegment(profile, userLine);
  }, [profile]);

  const persistLine = useCallback(async (line: ProductLineId) => {
    await AsyncStorage.multiSet([
      [PRODUCT_LINE_STORAGE_KEY, line],
      [WOMAN_SPACE_ACTIVE_KEY, line === 'woman' ? '1' : '0'],
    ]);
  }, []);

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
      setProSignupPresetRoleState((prev) => {
        const next = reconcileProSignupPreset(resolved, prev);
        if (next === prev) return prev;
        if (next) {
          void AsyncStorage.setItem(PRO_SIGNUP_PRESET_ROLE_KEY, next);
        } else {
          void AsyncStorage.removeItem(PRO_SIGNUP_PRESET_ROLE_KEY);
        }
        return next;
      });
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

  const enterHommeSpace = useCallback(async () => {
    await enterAmateurSpace();
  }, [enterAmateurSpace]);

  const enterWomanSpace = useCallback(async () => {
    await enterAmateurSpace();
  }, [enterAmateurSpace]);

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
      if (line === 'woman' || line === 'homme') await enterAmateurSpace();
      else if (isProProductLine(line)) await enterProLine(line);
      else if (line === 'amateur') await enterAmateurSpace();
      else if (line === 'supporter') await enterSupporterSpace();
      else if (line === 'sante') await enterSanteSpace();
      else await enterAmateurSpace();
    },
    [enterProLine, enterAmateurSpace, enterSupporterSpace, enterSanteSpace]
  );

  useEffect(() => {
    if (!profile || loading) return;
    const userLine = getUserProductLine(profile);
    if (userLine !== productLine) {
      void setProductLine(userLine);
    }
  }, [profile, loading, productLine, setProductLine]);

  const isWoman = playerSegment === 'female' || productLine === 'woman';
  const isHomme = playerSegment === 'male' || productLine === 'homme';
  const isPro = isProProductLine(productLine);
  const isAmateur = productLine === 'amateur';
  const isSupporter = productLine === 'supporter';
  const isSante = productLine === 'sante';
  const guestSponsorAuth = !profile && isSponsorAuthPreset(proSignupPresetRole);
  const brand = guestSponsorAuth
    ? PRODAY_SPONSOR_BRAND
    : brandForProductLine(productLine);

  const themedColors = useMemo(
    () =>
      guestSponsorAuth
        ? colorsForAuthContext(productLine, 'sponsor')
        : getThemedColorsForLine(productLine, playerSegment),
    [guestSponsorAuth, productLine, playerSegment],
  );

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
      colors: themedColors,
      isSponsorAuthChrome: guestSponsorAuth,
      playerSegment,
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
      themedColors,
      guestSponsorAuth,
      playerSegment,
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
    isSponsorAuthChrome,
    proSignupPresetRole,
    setProSignupPresetRole,
    playerSegment,
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
    playerSegment,
    setProductLine,
    enterHommeSpace,
    enterWomanSpace,
    enterProSpace,
    enterAmateurSpace,
    enterSupporterSpace,
    enterSanteSpace,
    exitWomanSpace,
    womanSpaceActive,
    isSponsorAuthChrome,
    proSignupPresetRole,
    setProSignupPresetRole,
  };
}

export { defaultColors };

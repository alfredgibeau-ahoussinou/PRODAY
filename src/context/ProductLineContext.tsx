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
  PARENT_GUEST_SUPPORTER_KEY,
  PRODAY_PARENT_BRAND,
  PRODAY_PRESIDENT_BRAND,
  PRODAY_SPONSOR_BRAND,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import {
  CLUB_SHELL_MODE_STORAGE_KEY,
  normalizeClubShellMode,
  type ClubShellMode,
} from '../models/ClubShellMode';
import { canAccessProductLine } from '../content/universeRoles';
import { PRO_SIGNUP_PRESET_ROLE_KEY } from '../models/CarouselPole';
import type { UserRole } from '../models/User';
import { getThemedColorsForLine, type AppColors } from '../theme/universeTheme';
import { BRAND, colors as defaultColors } from '../theme/designTokens';
import { useAuthOptional } from './AuthContext';
import { getUserProductLine } from '../utils/productLineAccess';
import { resolvePlayerSegment, type PlayerSegment } from '../utils/playerSegment';
import {
  colorsForAuthContext,
  isParentAuthPreset,
  isSponsorAuthPreset,
  reconcileProSignupPreset,
} from '../utils/authBrandContext';

interface ProductLineContextValue {
  productLine: ProductLineId;
  /**
   * Shell actif pour le compte Club : opérationnel (`club`) ou exécutif (`president`).
   * Même product_line `pro_club` — lien Président ↔ Club conservé.
   */
  clubShellMode: ClubShellMode;
  womanSpaceActive: boolean;
  isWoman: boolean;
  isHomme: boolean;
  isPro: boolean;
  isAmateur: boolean;
  isSupporter: boolean;
  isSante: boolean;
  isParent: boolean;
  /** @deprecated Préférer isWoman */
  isGirl: boolean;
  brandName: string;
  tagline: string;
  colors: AppColors;
  /** Invité sur parcours Sponsor (carousel / CTA) — chrome or sans polluer un user connecté Pro. */
  isSponsorAuthChrome: boolean;
  /** Invité sur parcours Parent (carousel). */
  isParentAuthChrome: boolean;
  /** Segment joueur actif (thème homme/femme/mineur). */
  playerSegment: PlayerSegment | null;
  setProductLine: (line: ProductLineId) => Promise<void>;
  setClubShellMode: (mode: ClubShellMode) => Promise<void>;
  enterHommeSpace: () => Promise<void>;
  enterWomanSpace: () => Promise<void>;
  enterProSpace: () => Promise<void>;
  enterProLine: (line: ProductLineId) => Promise<void>;
  enterAmateurSpace: () => Promise<void>;
  enterSupporterSpace: () => Promise<void>;
  enterSanteSpace: () => Promise<void>;
  enterParentSpace: () => Promise<void>;
  enterSponsorSpace: () => Promise<void>;
  exitWomanSpace: () => Promise<void>;
  /** Parent en visite sur le scaffold Supporter (sans changer le rôle Firestore). */
  parentGuestSupporter: boolean;
  openParentSupporterGuest: () => Promise<void>;
  returnParentFromSupporterGuest: () => Promise<void>;
  /** Rôle présélectionné après choix carousel pro_player / pro_club / pro_staff. */
  proSignupPresetRole: UserRole | null;
  setProSignupPresetRole: (role: UserRole | null) => Promise<void>;
  loading: boolean;
}

const ProductLineContext = createContext<ProductLineContextValue | null>(null);

export const ProductLineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuthOptional();
  const profile = auth?.profile ?? null;
  // Défaut Amateur (cible doc architecture §1.4) — fusion homme/woman au carousel.
  const [productLine, setLineState] = useState<ProductLineId>('amateur');
  const [clubShellMode, setClubShellModeState] = useState<ClubShellMode>('club');
  const [womanSpaceActive, setWomanSpaceActive] = useState(false);
  const [proSignupPresetRole, setProSignupPresetRoleState] = useState<UserRole | null>(null);
  const [parentGuestSupporter, setParentGuestSupporter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedLine, spaceFlag, presetRole, guestSupporter, storedClubShell] =
          await Promise.all([
            AsyncStorage.getItem(PRODUCT_LINE_STORAGE_KEY),
            AsyncStorage.getItem(WOMAN_SPACE_ACTIVE_KEY),
            AsyncStorage.getItem(PRO_SIGNUP_PRESET_ROLE_KEY),
            AsyncStorage.getItem(PARENT_GUEST_SUPPORTER_KEY),
            AsyncStorage.getItem(CLUB_SHELL_MODE_STORAGE_KEY),
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
          setClubShellModeState(normalizeClubShellMode(storedClubShell));
          setProSignupPresetRoleState((presetRole as UserRole | null) ?? null);
          setParentGuestSupporter(guestSupporter === '1');
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

  const setClubShellMode = useCallback(async (mode: ClubShellMode) => {
    setClubShellModeState(mode);
    await AsyncStorage.setItem(CLUB_SHELL_MODE_STORAGE_KEY, mode);
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

  const enterSponsorSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setLineState('sponsor');
    setProSignupPresetRoleState('sponsor');
    await AsyncStorage.setItem(PRO_SIGNUP_PRESET_ROLE_KEY, 'sponsor');
    await persistLine('sponsor');
  }, [persistLine]);

  const enterParentSpace = useCallback(async () => {
    setWomanSpaceActive(false);
    setParentGuestSupporter(false);
    setLineState('parent');
    setProSignupPresetRoleState('parent');
    await AsyncStorage.setItem(PRO_SIGNUP_PRESET_ROLE_KEY, 'parent');
    await AsyncStorage.removeItem(PARENT_GUEST_SUPPORTER_KEY);
    await persistLine('parent');
  }, [persistLine]);

  const openParentSupporterGuest = useCallback(async () => {
    if (profile && profile.role !== 'parent') {
      console.warn('openParentSupporterGuest réservé au rôle parent');
      return;
    }
    setWomanSpaceActive(false);
    setParentGuestSupporter(true);
    setLineState('supporter');
    await AsyncStorage.setItem(PARENT_GUEST_SUPPORTER_KEY, '1');
    // Thème / chrome supporter sans écraser product_line profil (sync skip ci-dessous).
  }, [profile]);

  const returnParentFromSupporterGuest = useCallback(async () => {
    setParentGuestSupporter(false);
    await AsyncStorage.removeItem(PARENT_GUEST_SUPPORTER_KEY);
    await enterParentSpace();
  }, [enterParentSpace]);

  const exitWomanSpace = useCallback(async () => {
    await enterAmateurSpace();
  }, [enterAmateurSpace]);

  const setProductLine = useCallback(
    async (line: ProductLineId) => {
      // Enforce pole exclusivity for authenticated users
      if (profile && !canAccessProductLine(profile.role, line)) {
        console.warn(`User with role ${profile.role} cannot access product line ${line}`);
        return;
      }
      
      if (line === 'woman' || line === 'homme') await enterAmateurSpace();
      else if (line === 'sponsor') await enterSponsorSpace();
      else if (line === 'parent') await enterParentSpace();
      else if (isProProductLine(line)) await enterProLine(line);
      else if (line === 'amateur') await enterAmateurSpace();
      else if (line === 'supporter') await enterSupporterSpace();
      else if (line === 'sante') await enterSanteSpace();
      else await enterAmateurSpace();
    },
    [
      enterProLine,
      enterAmateurSpace,
      enterSupporterSpace,
      enterSanteSpace,
      enterSponsorSpace,
      enterParentSpace,
      profile,
    ],
  );

  useEffect(() => {
    if (!profile || loading) return;
    if (profile.role !== 'parent' && parentGuestSupporter) {
      setParentGuestSupporter(false);
      void AsyncStorage.removeItem(PARENT_GUEST_SUPPORTER_KEY);
      return;
    }
    if (profile.role === 'parent' && parentGuestSupporter) {
      if (productLine !== 'supporter') setLineState('supporter');
      return;
    }
    const userLine = getUserProductLine(profile);
    if (userLine !== productLine) {
      void setProductLine(userLine);
    }
  }, [profile, loading, productLine, setProductLine, parentGuestSupporter]);

  const isWoman = playerSegment === 'female' || productLine === 'woman';
  const isHomme = playerSegment === 'male' || productLine === 'homme';
  const isPro = isProProductLine(productLine);
  const isAmateur = productLine === 'amateur';
  const isSupporter = productLine === 'supporter';
  const isSante = productLine === 'sante';
  const isParent = productLine === 'parent' || (profile?.role === 'parent' && !parentGuestSupporter);
  const guestSponsorAuth =
    !profile && (productLine === 'sponsor' || isSponsorAuthPreset(proSignupPresetRole));
  const guestParentAuth =
    !profile && (productLine === 'parent' || isParentAuthPreset(proSignupPresetRole));
  const brand =
    clubShellMode === 'president' && productLine === 'pro_club'
      ? PRODAY_PRESIDENT_BRAND
      : guestSponsorAuth || productLine === 'sponsor'
        ? PRODAY_SPONSOR_BRAND
        : guestParentAuth || productLine === 'parent'
          ? PRODAY_PARENT_BRAND
          : brandForProductLine(productLine);

  const themedColors = useMemo(
    () =>
      productLine === 'sponsor' || guestSponsorAuth
        ? colorsForAuthContext('sponsor', 'sponsor')
        : productLine === 'parent' || guestParentAuth
          ? colorsForAuthContext('parent', 'parent')
          : getThemedColorsForLine(productLine, playerSegment),
    [guestSponsorAuth, guestParentAuth, productLine, playerSegment],
  );

  const value = useMemo(
    () => ({
      productLine,
      clubShellMode,
      womanSpaceActive,
      isWoman,
      isHomme,
      isPro,
      isAmateur,
      isSupporter,
      isSante,
      isParent,
      isGirl: isWoman,
      brandName: brand.name,
      tagline: brand.tagline,
      colors: themedColors,
      isSponsorAuthChrome: guestSponsorAuth,
      isParentAuthChrome: guestParentAuth,
      playerSegment,
      setProductLine,
      setClubShellMode,
      enterHommeSpace,
      enterWomanSpace,
      enterProSpace,
      enterProLine,
      enterAmateurSpace,
      enterSupporterSpace,
      enterSanteSpace,
      enterParentSpace,
      enterSponsorSpace,
      exitWomanSpace,
      parentGuestSupporter,
      openParentSupporterGuest,
      returnParentFromSupporterGuest,
      proSignupPresetRole,
      setProSignupPresetRole,
      loading,
    }),
    [
      productLine,
      clubShellMode,
      womanSpaceActive,
      isWoman,
      isHomme,
      isPro,
      isAmateur,
      isSupporter,
      isSante,
      isParent,
      brand.name,
      brand.tagline,
      themedColors,
      guestSponsorAuth,
      guestParentAuth,
      playerSegment,
      setProductLine,
      setClubShellMode,
      enterHommeSpace,
      enterWomanSpace,
      enterProSpace,
      enterProLine,
      enterAmateurSpace,
      enterSupporterSpace,
      enterSanteSpace,
      enterParentSpace,
      enterSponsorSpace,
      exitWomanSpace,
      parentGuestSupporter,
      openParentSupporterGuest,
      returnParentFromSupporterGuest,
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
    isParent,
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
    enterParentSpace,
    exitWomanSpace,
    womanSpaceActive,
    isSponsorAuthChrome,
    isParentAuthChrome,
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
    isParent,
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
    enterParentSpace,
    exitWomanSpace,
    womanSpaceActive,
    isSponsorAuthChrome,
    isParentAuthChrome,
    proSignupPresetRole,
    setProSignupPresetRole,
  };
}

export { defaultColors };

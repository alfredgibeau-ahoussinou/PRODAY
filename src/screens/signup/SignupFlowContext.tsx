import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ProductLineId } from '../../models/ProductLine';
import { isProProductLine } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import { getThemedColorsForLine, type AppColors } from '../../theme/universeTheme';
import { getSponsorAppColors } from '../../content/sponsorExperience';
import { useProductLine } from '../../context/ProductLineContext';
import type { PlayerSegment } from '../../utils/playerSegment';
import { genderToPlayerSegment } from '../../utils/playerSegment';
import type { Gender } from '../../models/User';
import { reconcileProSignupPreset } from '../../utils/authBrandContext';

interface SignupFlowContextValue {
  productLine: ProductLineId;
  isProSignup: boolean;
  isProPlayerSignup: boolean;
  isAmateurSignup: boolean;
  isSupporterSignup: boolean;
  isSanteSignup: boolean;
  isSponsorSignup: boolean;
  colors: AppColors;
  experienceRole: UserRole;
}

const SignupFlowContext = createContext<SignupFlowContextValue | null>(null);

export const SignupFlowProvider: React.FC<{
  productLine: ProductLineId;
  experienceRole: UserRole;
  signupGender?: Gender | null;
  children: React.ReactNode;
}> = ({ productLine, experienceRole, signupGender, children }) => {
  const {
    enterProLine,
    enterAmateurSpace,
    enterSupporterSpace,
    enterSanteSpace,
    enterSponsorSpace,
    enterParentSpace,
    setProSignupPresetRole,
  } = useProductLine();
  const isProSignup = isProProductLine(productLine);
  const isProPlayerSignup = productLine === 'pro_player';
  const isAmateurSignup = productLine === 'amateur';
  const isSupporterSignup = productLine === 'supporter';
  const isSanteSignup = productLine === 'sante';
  const isSponsorSignup = experienceRole === 'sponsor' || productLine === 'sponsor';
  const isParentSignup = experienceRole === 'parent' || productLine === 'parent';

  const playerSegment: PlayerSegment | null = useMemo(() => {
    if (!signupGender) return null;
    if (productLine !== 'amateur' && productLine !== 'pro_player') return null;
    return genderToPlayerSegment(signupGender);
  }, [signupGender, productLine]);

  const colors = useMemo(
    () =>
      isSponsorSignup
        ? getSponsorAppColors()
        : getThemedColorsForLine(productLine, playerSegment),
    [isSponsorSignup, productLine, playerSegment],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isSanteSignup) {
        await enterSanteSpace();
        return;
      }
      if (isAmateurSignup) {
        await enterAmateurSpace();
        return;
      }
      if (isSupporterSignup) {
        await enterSupporterSpace();
        return;
      }
      if (isParentSignup) {
        await setProSignupPresetRole('parent');
        if (!cancelled) await enterParentSpace();
        return;
      }
      if (isSponsorSignup) {
        await setProSignupPresetRole('sponsor');
        if (!cancelled) await enterSponsorSpace();
        return;
      }
      if (isProSignup) {
        const aligned = reconcileProSignupPreset(productLine, experienceRole);
        await setProSignupPresetRole(aligned);
        if (!cancelled) await enterProLine(productLine);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isSponsorSignup,
    isParentSignup,
    isSanteSignup,
    isAmateurSignup,
    isSupporterSignup,
    isProSignup,
    productLine,
    experienceRole,
    setProSignupPresetRole,
    enterSanteSpace,
    enterAmateurSpace,
    enterSupporterSpace,
    enterSponsorSpace,
    enterParentSpace,
    enterProLine,
  ]);

  return (
    <SignupFlowContext.Provider
      value={{
        productLine,
        isProSignup,
        isProPlayerSignup,
        isAmateurSignup,
        isSupporterSignup,
        isSanteSignup,
        isSponsorSignup,
        colors,
        experienceRole,
      }}
    >
      {children}
    </SignupFlowContext.Provider>
  );
};

export function useSignupFlowTheme(): SignupFlowContextValue {
  const ctx = useContext(SignupFlowContext);
  if (!ctx) {
    return {
      productLine: 'amateur',
      isProSignup: false,
      isProPlayerSignup: false,
      isAmateurSignup: true,
      isSupporterSignup: false,
      isSanteSignup: false,
      isSponsorSignup: false,
      colors: getThemedColorsForLine('amateur'),
      experienceRole: 'player',
    };
  }
  return ctx;
}

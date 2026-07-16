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
  const { enterProLine, enterAmateurSpace, enterSupporterSpace, enterSanteSpace } = useProductLine();
  const isProSignup = isProProductLine(productLine);
  const isProPlayerSignup = productLine === 'pro_player';
  const isAmateurSignup = productLine === 'amateur';
  const isSupporterSignup = productLine === 'supporter';
  const isSanteSignup = productLine === 'sante';
  const isSponsorSignup = experienceRole === 'sponsor';

  const playerSegment: PlayerSegment | null = useMemo(() => {
    if (!signupGender) return null;
    if (productLine !== 'amateur' && productLine !== 'pro_player') return null;
    return genderToPlayerSegment(signupGender);
  }, [signupGender, productLine]);

  const colors = useMemo(
    () => (isSponsorSignup ? getSponsorAppColors() : getThemedColorsForLine(productLine, playerSegment)),
    [isSponsorSignup, productLine, playerSegment],
  );

  useEffect(() => {
    if (isSanteSignup) void enterSanteSpace();
    else if (isAmateurSignup) void enterAmateurSpace();
    else if (isSupporterSignup) void enterSupporterSpace();
    else if (isProSignup) void enterProLine(productLine);
  }, [isSanteSignup, isAmateurSignup, isSupporterSignup, isProSignup, productLine, enterSanteSpace, enterAmateurSpace, enterSupporterSpace, enterProLine]);

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

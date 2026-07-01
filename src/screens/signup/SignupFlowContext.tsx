import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ProductLineId } from '../../models/ProductLine';
import { isProProductLine } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import { getThemedColorsForLine, type AppColors } from '../../theme/universeTheme';
import { useProductLine } from '../../context/ProductLineContext';
interface SignupFlowContextValue {
  productLine: ProductLineId;
  isWomanSignup: boolean;
  isProSignup: boolean;
  isAmateurSignup: boolean;
  isSupporterSignup: boolean;
  isSanteSignup: boolean;
  colors: AppColors;
  experienceRole: UserRole;
}

const SignupFlowContext = createContext<SignupFlowContextValue | null>(null);

export const SignupFlowProvider: React.FC<{
  productLine: ProductLineId;
  experienceRole: UserRole;
  children: React.ReactNode;
}> = ({ productLine, experienceRole, children }) => {
  const { enterWomanSpace, enterProLine, enterAmateurSpace, enterSupporterSpace, enterSanteSpace } = useProductLine();
  const isWomanSignup = productLine === 'woman';
  const isProSignup = isProProductLine(productLine);
  const isAmateurSignup = productLine === 'amateur';
  const isSupporterSignup = productLine === 'supporter';
  const isSanteSignup = productLine === 'sante';

  const colors = useMemo(() => getThemedColorsForLine(productLine), [productLine]);

  useEffect(() => {
    if (isWomanSignup) void enterWomanSpace();
    else if (isSanteSignup) void enterSanteSpace();
    else if (isAmateurSignup) void enterAmateurSpace();
    else if (isSupporterSignup) void enterSupporterSpace();
    else if (isProSignup) void enterProLine(productLine);
  }, [isWomanSignup, isSanteSignup, isAmateurSignup, isSupporterSignup, isProSignup, productLine, enterWomanSpace, enterSanteSpace, enterAmateurSpace, enterSupporterSpace, enterProLine]);

  return (
    <SignupFlowContext.Provider
      value={{ productLine, isWomanSignup, isProSignup, isAmateurSignup, isSupporterSignup, isSanteSignup, colors, experienceRole }}
    >
      {children}
    </SignupFlowContext.Provider>
  );
};

export function useSignupFlowTheme(): SignupFlowContextValue {
  const ctx = useContext(SignupFlowContext);
  if (!ctx) {
    return {
      productLine: 'homme',
      isWomanSignup: false,
      isProSignup: false,
      isAmateurSignup: false,
      isSupporterSignup: false,
      isSanteSignup: false,
      colors: getThemedColorsForLine('homme'),
      experienceRole: 'player',
    };
  }
  return ctx;
}

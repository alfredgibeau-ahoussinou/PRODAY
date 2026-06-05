import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ProductLineId } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import { getThemedColorsForLine, type AppColors } from '../../theme/universeTheme';
import { useProductLine } from '../../context/ProductLineContext';
interface SignupFlowContextValue {
  productLine: ProductLineId;
  isWomanSignup: boolean;
  isProSignup: boolean;
  colors: AppColors;
  experienceRole: UserRole;
}

const SignupFlowContext = createContext<SignupFlowContextValue | null>(null);

export const SignupFlowProvider: React.FC<{
  productLine: ProductLineId;
  experienceRole: UserRole;
  children: React.ReactNode;
}> = ({ productLine, experienceRole, children }) => {
  const { enterWomanSpace, enterProSpace } = useProductLine();
  const isWomanSignup = productLine === 'woman';
  const isProSignup = productLine === 'pro';

  const colors = useMemo(() => getThemedColorsForLine(productLine), [productLine]);

  useEffect(() => {
    if (isWomanSignup) void enterWomanSpace();
    else if (isProSignup) void enterProSpace();
  }, [isWomanSignup, isProSignup, enterWomanSpace, enterProSpace]);

  return (
    <SignupFlowContext.Provider
      value={{ productLine, isWomanSignup, isProSignup, colors, experienceRole }}
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
      colors: getThemedColorsForLine('homme'),
      experienceRole: 'player',
    };
  }
  return ctx;
}

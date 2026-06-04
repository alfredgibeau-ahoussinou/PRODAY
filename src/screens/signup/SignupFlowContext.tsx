import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ProductLineId } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import { getThemedColors, type AppColors } from '../../theme/prodayWomanTheme';
import { useProductLine } from '../../context/ProductLineContext';
import { getRoleSignupAccent } from './signupRoleExperience';

interface SignupFlowContextValue {
  isWomanSignup: boolean;
  colors: AppColors;
  experienceRole: UserRole;
}

const SignupFlowContext = createContext<SignupFlowContextValue | null>(null);

export const SignupFlowProvider: React.FC<{
  productLine: ProductLineId;
  experienceRole: UserRole;
  children: React.ReactNode;
}> = ({ productLine, experienceRole, children }) => {
  const { enterWomanSpace } = useProductLine();
  const isWomanSignup = productLine === 'woman';

  const colors = useMemo(() => {
    const base = getThemedColors(isWomanSignup);
    if (isWomanSignup) return base;
    const accent = getRoleSignupAccent(experienceRole);
    return {
      ...base,
      accent: accent.accent,
      accentSoft: accent.accentSoft,
      accentMuted: accent.accentMuted,
      ink: accent.accent,
      brand: accent.accent,
    };
  }, [isWomanSignup, experienceRole]);

  useEffect(() => {
    if (isWomanSignup) void enterWomanSpace();
  }, [isWomanSignup, enterWomanSpace]);

  return (
    <SignupFlowContext.Provider value={{ isWomanSignup, colors, experienceRole }}>
      {children}
    </SignupFlowContext.Provider>
  );
};

export function useSignupFlowTheme(): SignupFlowContextValue {
  const ctx = useContext(SignupFlowContext);
  if (!ctx) {
    return {
      isWomanSignup: false,
      colors: getThemedColors(false),
      experienceRole: 'player',
    };
  }
  return ctx;
}

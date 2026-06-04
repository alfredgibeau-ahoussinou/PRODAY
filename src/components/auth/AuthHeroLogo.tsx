import React from 'react';
import { AuthBrandHeader } from './AuthBrandHeader';

interface AuthHeroLogoProps {
  width?: number;
  showTagline?: boolean;
}

/** @deprecated Préférer AuthBrandHeader — conservé pour compatibilité. */
export const AuthHeroLogo: React.FC<AuthHeroLogoProps> = (props) => (
  <AuthBrandHeader {...props} />
);

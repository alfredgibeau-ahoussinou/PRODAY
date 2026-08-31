import React from 'react';
import { AuthExperienceShell } from '../../features/auth/experience';

/** Carte formulaire signup — transparente dans la DA Experience (plus de card flottante). */
export const SignupFormCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

/** Réexport pour écrans qui s’appuyaient sur le shell. */
export { AuthExperienceShell };

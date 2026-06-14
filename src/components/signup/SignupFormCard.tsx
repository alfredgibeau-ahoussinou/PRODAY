import React from 'react';
import { AuthFormCard } from '../auth/AuthFormCard';

interface SignupFormCardProps {
  children: React.ReactNode;
}

/** Carte formulaire inscription — même surface que la connexion. */
export const SignupFormCard: React.FC<SignupFormCardProps> = ({ children }) => (
  <AuthFormCard>{children}</AuthFormCard>
);

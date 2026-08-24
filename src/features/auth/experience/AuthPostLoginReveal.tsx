import React from 'react';
import { BrandSessionReveal } from '../../../components/branding/intro/BrandSessionReveal';

type AuthPostLoginRevealProps = {
  active: boolean;
  onDone: () => void;
};

/**
 * Transition post-connexion : logo + « Bienvenue », puis handoff vers le shell.
 * Remplace l’ancien micro-fade symbole seul.
 */
export const AuthPostLoginReveal: React.FC<AuthPostLoginRevealProps> = ({
  active,
  onDone,
}) => {
  if (!active) return null;
  return <BrandSessionReveal tone="welcome" onComplete={onDone} />;
};

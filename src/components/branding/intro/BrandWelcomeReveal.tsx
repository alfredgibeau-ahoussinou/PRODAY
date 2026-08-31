import React from 'react';
import { BrandSessionReveal } from './BrandSessionReveal';

type BrandWelcomeRevealProps = {
  onComplete: () => void;
};

/**
 * Première peinture cold-start : symbole + Bienvenue (délègue à BrandSessionReveal).
 */
export const BrandWelcomeReveal: React.FC<BrandWelcomeRevealProps> = ({ onComplete }) => (
  <BrandSessionReveal tone="welcome" onComplete={onComplete} fillScreen={false} />
);

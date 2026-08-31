import React from 'react';
import { AuthSuccessMoment } from '../../features/auth/experience';

interface SignupSuccessStepProps {
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: unknown;
  phaseIndex?: number;
  displayName: string;
  title: string;
  body: string;
  finishLabel: string;
  onFinish: () => void;
}

/** Succès inscription — moment ProDay (pas de confetti). */
export const SignupSuccessStep: React.FC<SignupSuccessStepProps> = ({
  displayName,
  title,
  body,
  finishLabel,
  onFinish,
}) => (
  <AuthSuccessMoment
    title={title || 'Bienvenue sur ProDay.'}
    subtitle={body}
    displayName={displayName}
    ctaLabel={finishLabel}
    onCta={onFinish}
  />
);

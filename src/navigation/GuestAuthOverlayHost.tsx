import React, { useCallback } from 'react';
import { AuthOverlayHost } from './AuthOverlayHost';
import { useLaunchIntro } from '../context/LaunchIntroContext';
import type { AuthIntent } from '../context/TabNavigationContext';
import type { UserRole } from '../models/User';
import type { CarouselPoleId } from '../models/CarouselPole';
import type { ProductLineId } from '../models/ProductLine';

type Props = {
  intent: AuthIntent;
  signupProductLine?: ProductLineId;
  signupInitialRole?: UserRole;
  initialPole?: CarouselPoleId;
  onClear: () => void;
};

/**
 * Overlay auth invité : à la fermeture, retour univers (pas de landing Discover).
 */
export function GuestAuthOverlayHost({
  intent,
  signupProductLine,
  signupInitialRole,
  initialPole,
  onClear,
}: Props) {
  const { openSpacePicker } = useLaunchIntro();

  const handleDismiss = useCallback(() => {
    onClear();
    openSpacePicker();
  }, [onClear, openSpacePicker]);

  return (
    <AuthOverlayHost
      intent={intent}
      signupProductLine={signupProductLine}
      signupInitialRole={signupInitialRole}
      initialPole={initialPole}
      onDismiss={handleDismiss}
    />
  );
}

import React from 'react';
import { useTranslation } from '../../context/LocaleContext';
import { CarpoolHero } from './CarpoolHero';

interface CarpoolGuestPromptProps {
  onLogin: () => void;
  onSignup: () => void;
}

/**
 * Invité : une seule composition plein cadre, une seule action.
 * Le lien « créer un compte » reste discret, en texte.
 */
export const CarpoolGuestPrompt: React.FC<CarpoolGuestPromptProps> = ({ onLogin, onSignup }) => {
  const { t } = useTranslation();

  return (
    <CarpoolHero
      fill
      headline={t('carpool.hero.guest.headline')}
      support={t('carpool.hero.guest.support')}
      primaryAction={{ label: t('common.login'), icon: 'chevron-forward', onPress: onLogin }}
      linkAction={{ label: t('common.guest.signup'), onPress: onSignup }}
    />
  );
};

import React, { useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { parseSubscriptionCheckoutReturn } from '../../utils/subscriptionCheckoutReturn';

/** Rafraîchit profil + quotas après retour deep link `proday://subscription?...`. */
export const SubscriptionCheckoutBridge: React.FC = () => {
  const { refreshProfile } = useAuth();
  const { refresh } = useSubscription();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const parsed = parseSubscriptionCheckoutReturn(url);
      if (!parsed || parsed.status === 'cancel') return;
      if (handled.current.has(url)) return;
      handled.current.add(url);

      void refreshProfile().then(() => refresh());

      if (parsed.status === 'success') {
        Alert.alert(
          'Abonnement Pro',
          'Paiement Stripe confirmé. Votre abonnement Pro s’active sous quelques secondes.',
        );
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [refreshProfile, refresh]);

  return null;
};

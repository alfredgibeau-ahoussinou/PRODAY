import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLaunchIntro } from '../context/LaunchIntroContext';
import { useTabNavigation } from '../context/TabNavigationContext';

/**
 * Accueil invité — fond neutre uniquement.
 * Plus de landing Discover (CTAs « Créer mon compte » / Accès rapide) :
 * le parcours est univers → gate auth.
 */
export const GuestUniverseHome: React.FC = () => {
  const { openSpacePicker, isUniverseVisible } = useLaunchIntro();
  const { pendingAuthIntent } = useTabNavigation();
  const askedRef = useRef(false);

  useEffect(() => {
    if (pendingAuthIntent) {
      askedRef.current = false;
      return;
    }
    if (isUniverseVisible) return;
    if (askedRef.current) return;
    // Laisse le temps à openAuth sync de poser pendingAuthIntent avant de rouvrir l’univers.
    const t = setTimeout(() => {
      if (askedRef.current) return;
      askedRef.current = true;
      openSpacePicker();
    }, 320);
    return () => clearTimeout(t);
  }, [pendingAuthIntent, isUniverseVisible, openSpacePicker]);

  return <View style={styles.root} accessibilityLabel="Accueil ProDay" />;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

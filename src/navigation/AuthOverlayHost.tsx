import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthScreen } from '../screens/AuthScreen';
import type { AuthIntent } from '../context/TabNavigationContext';
import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';

type Props = {
  intent: AuthIntent;
  signupProductLine?: ProductLineId;
  signupInitialRole?: UserRole;
  onDismiss: () => void;
};

/**
 * Auth plein écran par-dessus l’onglet courant.
 * Unmount immédiat au dismiss — pas de leave opaque (écran noir).
 */
export function AuthOverlayHost({
  intent,
  signupProductLine,
  signupInitialRole,
  onDismiss,
}: Props) {
  return (
    <View
      style={styles.fill}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityLabel="Connexion"
    >
      <AuthScreen
        key={intent}
        initialIntent={intent}
        signupProductLine={signupProductLine}
        signupInitialRole={signupInitialRole}
        onDismiss={onDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
});

/**
 * Panneau « Connexions → VEO » — Paramètres club.
 *
 * Utilise le composant officiel unifié VeoAccountPanel : connexion directe
 * au compte Veo (« Connecter mon compte Veo ») sans configuration technique
 * requise de l'utilisateur, statuts vérifiés côté serveur, et appairage caméra.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useVeoAccount } from '../../hooks/useVeoAccount';
import { VeoAccountPanel } from '../../features/video/VeoAccountPanel';

export function VeoConnectionPanel({ clubId }: { clubId?: string }) {
  const { tokens } = useClubTheme();
  const account = useVeoAccount(clubId ?? null);

  return (
    <View style={styles.stack} testID="club-settings-veo-panel">
      <VeoAccountPanel
        tokens={tokens}
        account={account}
        clubId={clubId}
        canConnect={true}
        canManageApiClient={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
});


import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDayButton } from '../components/ui/ProDayButton';
import { useAppTheme } from '../context/ProductLineContext';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../theme/designTokens';

/** Compte legacy agent / recruteur / santé — produit retiré. */
export const RetiredRoleScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { signOut } = useAuth();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ProDayText variant="title" style={{ color: colors.text }}>
        Rôle retiré
      </ProDayText>
      <ProDayText variant="body" muted style={styles.body}>
        Les espaces Agent, Recruteur et Santé ne sont plus proposés sur ProDay.
        Déconnectez-vous et créez un compte Joueur, Coach, Club, Supporter, Sponsor ou
        Parent.
      </ProDayText>
      <ProDayButton label="Se déconnecter" onPress={() => void signOut()} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  body: { lineHeight: 22, marginBottom: spacing.md },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDayButton } from '../components/ui/ProDayButton';
import { useAppTheme } from '../context/ProductLineContext';
import { useAuth } from '../context/AuthContext';
import { useLaunchIntro } from '../context/LaunchIntroContext';
import { useTabNavigationOptional } from '../context/TabNavigationContext';
import { spacing } from '../theme/designTokens';

/** Compte legacy agent / recruteur / santé — produit retiré. */
export const RetiredRoleScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { profile, signOut } = useAuth();
  const { openSpacePicker } = useLaunchIntro();
  const tabs = useTabNavigationOptional();
  const isGuest = !profile;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ProDayText variant="title" style={{ color: colors.text }}>
        {isGuest ? 'Espace à venir' : 'Rôle retiré'}
      </ProDayText>
      <ProDayText variant="body" muted style={styles.body}>
        {isGuest
          ? 'Cet espace n’est pas encore disponible. Revenez à l’accueil ou changez d’univers.'
          : 'Les espaces Agent, Recruteur et Santé ne sont plus proposés sur ProDay. Déconnectez-vous et créez un compte Joueur, Coach, Club, Supporter, Sponsor ou Parent.'}
      </ProDayText>
      {isGuest ? (
        <>
          <ProDayButton
            label="Retour à l’accueil"
            onPress={() => tabs?.setActiveTab('home')}
          />
          <ProDayButton label="Changer d’univers" onPress={openSpacePicker} variant="secondary" />
        </>
      ) : (
        <>
          <ProDayButton label="Se déconnecter" onPress={() => void signOut()} />
          <ProDayButton label="Changer d’univers" onPress={openSpacePicker} variant="secondary" />
        </>
      )}
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

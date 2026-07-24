import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

type SponsorGuestGateProps = {
  message: string;
};

/** Accueil invité Sponsor — CTA connexion / inscription marque. */
export const SponsorGuestGate: React.FC<SponsorGuestGateProps> = ({ message }) => {
  const { openAuth, openSponsorSignup } = useTabNavigation();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      <Icon name="star-four-points" size={28} color={SPONSOR_THEME.gold} />
      <Text style={styles.title}>Espace marque</Text>
      <Text style={styles.message}>{message}</Text>
      <PressableSpring
        style={styles.primary}
        onPress={() => openSponsorSignup()}
        scaleTo={0.98}
        haptic
      >
        <Text style={styles.primaryText}>Créer mon compte Sponsor</Text>
        <Icon name="chevron-forward" size={16} color={SPONSOR_THEME.goldInk} />
      </PressableSpring>
      <PressableSpring style={styles.secondary} onPress={() => openAuth('login')} scaleTo={0.98}>
        <Text style={styles.secondaryText}>J’ai déjà un compte</Text>
      </PressableSpring>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
      backgroundColor: SPONSOR_THEME.background,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: SPONSOR_THEME.text,
      letterSpacing: -0.4,
    },
    message: {
      textAlign: 'center',
      color: SPONSOR_THEME.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.sm,
    },
    primary: {
      minHeight: 52,
      borderRadius: radius.pill,
      backgroundColor: SPONSOR_THEME.gold,
      paddingHorizontal: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
    primaryText: {
      fontSize: 15,
      fontWeight: '800',
      color: SPONSOR_THEME.goldInk,
    },
    secondary: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    secondaryText: {
      fontSize: 14,
      fontWeight: '700',
      color: SPONSOR_THEME.goldLight,
      textDecorationLine: 'underline',
    },
  });
}

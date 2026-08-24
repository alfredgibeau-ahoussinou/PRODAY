import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

type SponsorGuestGateProps = {
  message: string;
};

/** Porte invité Sponsor — 1 CTA + lien login, noir + violet. */
export const SponsorGuestGate: React.FC<SponsorGuestGateProps> = ({ message }) => {
  const { openAuth, openSponsorSignup } = useTabNavigation();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      <AnimatedEntrance kind="fadeUp" index={0}>
        <View style={styles.heroBlock}>
          <View style={styles.mark}>
            <ProDaySymbol size={56} variant="sponsor" tone="white" />
          </View>
          <Text style={styles.eyebrow}>ProDay Sponsor</Text>
          <Text style={styles.title}>Espace marque</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </AnimatedEntrance>
      <AnimatedEntrance kind="fadeUp" index={1} style={styles.ctaCol}>
        <PressableSpring
          style={styles.primary}
          onPress={() => openSponsorSignup()}
          scaleTo={0.98}
          haptic
        >
          <Text style={styles.primaryText}>Créer mon compte Sponsor</Text>
        </PressableSpring>
        <PressableSpring style={styles.secondary} onPress={() => openAuth('login')} scaleTo={0.98}>
          <Text style={styles.secondaryText}>Déjà un compte ? Se connecter</Text>
        </PressableSpring>
      </AnimatedEntrance>
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
      gap: spacing.lg,
      backgroundColor: SPONSOR_THEME.background,
    },
    heroBlock: {
      alignItems: 'center',
    },
    mark: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: SPONSOR_THEME.primarySoft,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    eyebrow: {
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      color: SPONSOR_THEME.primary,
      marginBottom: spacing.xs,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    title: {
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '800',
      color: SPONSOR_THEME.text,
      letterSpacing: -0.4,
    },
    message: {
      textAlign: 'center',
      color: SPONSOR_THEME.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: spacing.sm,
      maxWidth: 300,
    },
    ctaCol: {
      alignSelf: 'stretch',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    primary: {
      minHeight: 48,
      borderRadius: radius.pill,
      backgroundColor: SPONSOR_THEME.primary,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    primaryText: {
      fontSize: 15,
      fontWeight: '800',
      color: SPONSOR_THEME.onPrimary,
    },
    secondary: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    secondaryText: {
      fontSize: 13,
      fontWeight: '600',
      color: SPONSOR_THEME.textMuted,
    },
  });
}

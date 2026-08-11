import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { JOUEUR_COACH_PRICE, JOUEUR_PASS_PRICE } from './constants';
import { spacing } from '../../theme/designTokens';
import { joueurGamePress } from './joueurSfx';

type Props = {
  accent: string;
  onOpenPass: () => void;
  onOpenCoach: () => void;
  onOpenFree?: () => void;
};

/** Boutique in-game — capsules store, pas grille SaaS. */
export function JoueurPricingStrip({
  accent,
  onOpenPass,
  onOpenCoach,
  onOpenFree,
}: Props) {
  return (
    <View style={styles.root}>
      <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
        BOUTIQUE
      </ProDayText>
      <ProDayText variant="section" style={styles.title}>
        Débloque ton run
      </ProDayText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            onOpenFree?.();
          }}
          disabled={!onOpenFree}
          scaleTo={0.96}
          style={styles.capsule}
        >
          <ProDayText variant="caption" style={styles.tier}>
            GRATUIT
          </ProDayText>
          <ProDayText variant="title" style={styles.price}>
            0 €
          </ProDayText>
          <ProDayText variant="caption" style={styles.line}>
            Profil · covoit · base
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => {
            joueurGamePress();
            onOpenPass();
          }}
          scaleTo={0.96}
          haptic
          style={[styles.capsule, styles.capsuleFeatured]}
        >
          <LinearGradient
            colors={[`${accent}55`, 'rgba(0,0,0,0.15)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.featuredRing, { borderColor: accent }]} />
          <ProDayText variant="caption" style={[styles.tier, { color: accent }]}>
            PASS IA
          </ProDayText>
          <ProDayText variant="title" style={styles.price}>
            {JOUEUR_PASS_PRICE}
            <ProDayText variant="caption" style={styles.per}>
              {' '}
              /mois
            </ProDayText>
          </ProDayText>
          <ProDayText variant="caption" style={styles.line}>
            Entraînement IA · heatmaps
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => {
            joueurGamePress();
            onOpenCoach();
          }}
          scaleTo={0.96}
          haptic
          style={styles.capsule}
        >
          <ProDayText variant="caption" style={styles.tier}>
            COACH
          </ProDayText>
          <ProDayText variant="title" style={styles.price}>
            {JOUEUR_COACH_PRICE}
            <ProDayText variant="caption" style={styles.per}>
              {' '}
              /h
            </ProDayText>
          </ProDayText>
          <ProDayText variant="caption" style={styles.line}>
            Session humaine
          </ProDayText>
        </PressableSpring>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.8,
  },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: -0.4,
  },
  rail: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: spacing.md,
  },
  capsule: {
    width: 148,
    minHeight: 132,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: JOUEUR_SITE.border,
    backgroundColor: 'rgba(10,16,28,0.9)',
    padding: spacing.md,
    gap: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  capsuleFeatured: {
    width: 168,
    borderColor: 'transparent',
  },
  featuredRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  tier: {
    color: JOUEUR_SITE.muted,
    fontWeight: '900',
    letterSpacing: 1.8,
    fontSize: 10,
  },
  price: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 26,
  },
  per: {
    color: JOUEUR_SITE.muted,
    fontWeight: '600',
    fontSize: 12,
  },
  line: {
    color: JOUEUR_SITE.muted,
    lineHeight: 16,
    fontWeight: '600',
  },
});

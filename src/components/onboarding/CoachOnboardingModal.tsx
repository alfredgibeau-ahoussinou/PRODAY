import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface StepDef {
  icon: IconName;
  title: string;
  desc: string;
  badge: string;
}

const ONBOARDING_STEPS: StepDef[] = [
  {
    icon: 'star',
    title: '1. Personnalise ta Carte FUT',
    desc: 'Définis ton poste, ton pied fort et booste ta note globale (OVR) au fil des entraînements et des matchs.',
    badge: 'IDENTITÉ SPORTIVE',
  },
  {
    icon: 'handshake',
    title: '2. Rejoins ton club ou équipe',
    desc: 'Accède aux convocations du coach, au tableau noir tactique et aux sessions d’entraînement du vestiaire.',
    badge: 'VIE D’ÉQUIPE',
  },
  {
    icon: 'car',
    title: '3. Matchs & Covoiturage ProDay',
    desc: 'Synchronise ton calendrier en 1 clic et organise tes trajets sécurisés entre coéquipiers et parents.',
    badge: 'LOGISTIQUE FACILE',
  },
];

interface CoachOnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
  onGoAction?: (stepIndex: number) => void;
}

export const CoachOnboardingModal: React.FC<CoachOnboardingModalProps> = ({
  visible,
  onDismiss,
  onGoAction,
}) => {
  const { colors } = useAppTheme();
  const [currentStep, setCurrentStep] = useState(0);

  if (!visible) return null;

  const isLast = currentStep === ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      setCurrentStep((c) => c + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.badgeText}>
              {step.badge}
            </ProDayText>
          </View>

          <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
            <Icon name={step.icon} size={32} color={colors.accent} variant="filled" />
          </View>

          <ProDayText variant="section" style={styles.title}>
            {step.title}
          </ProDayText>

          <ProDayText variant="body" muted style={styles.desc}>
            {step.desc}
          </ProDayText>

          <View style={styles.dotsRow}>
            {ONBOARDING_STEPS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentStep ? colors.accent : colors.surfaceMuted,
                    width: idx === currentStep ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <PressableSpring onPress={handleNext} scaleTo={0.97} haptic>
              <ProDayGradient kind="cta" style={styles.cta}>
                <ProDayText variant="caption" inverse style={styles.ctaText}>
                  {isLast ? 'C’est parti !' : 'Étape suivante →'}
                </ProDayText>
              </ProDayGradient>
            </PressableSpring>

            {!isLast ? (
              <PressableSpring onPress={onDismiss} scaleTo={0.97}>
                <ProDayText variant="caption" muted style={styles.skipText}>
                  Passer l’introduction
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cta: {
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
  },
  skipText: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 4,
  },
});

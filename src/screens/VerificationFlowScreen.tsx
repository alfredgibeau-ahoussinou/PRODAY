import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { VerificationSuccessScreen } from './VerificationSuccessScreen';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

type StepState = 'done' | 'active' | 'pending';

type VerificationStep = {
  id: number;
  label: string;
  state: StepState;
  sub?: string;
  date?: string;
};

const STEPS: VerificationStep[] = [
  { id: 1, label: 'Document reçu', state: 'done', date: '03/05/2025' },
  { id: 2, label: 'Authenticité', state: 'active', sub: 'En cours' },
  { id: 3, label: 'Établissement', state: 'pending', sub: 'En attente' },
  { id: 4, label: 'Résultat', state: 'pending', sub: 'En attente' },
];

interface VerificationFlowScreenProps {
  onBack?: () => void;
  diplomaName?: string;
  diplomaRef?: string;
  /** Affiche l'écran succès (démo ou profil déjà vérifié) */
  initialSuccess?: boolean;
}

export const VerificationFlowScreen: React.FC<VerificationFlowScreenProps> = ({
  onBack,
  diplomaName = 'UEFA A Licence',
  diplomaRef = 'REF-2025-0847',
  initialSuccess = false,
}) => {
  const [showSuccess, setShowSuccess] = useState(initialSuccess);

  if (showSuccess && onBack) {
    return (
      <VerificationSuccessScreen
        onBack={onBack}
        diplomaName={diplomaName}
        institution="UEFA · 2022"
      />
    );
  }

  return (
  <View style={styles.root}>
    {onBack ? (
      <ScreenHeader title="Vérification du diplôme" onBack={onBack} centered />
    ) : null}

    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Icon name="warning" size={22} color={colors.warning} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Vérification en cours</Text>
          <Text style={styles.bannerSub}>
            Le traitement peut prendre jusqu&apos;à 5 jours ouvrés. Votre profil reste
            visible avec un badge orange.
          </Text>
        </View>
      </View>

      <View style={[styles.card, shadows.card]}>
        {STEPS.map((step, index) => (
          <View key={step.id} style={styles.stepRow}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.stepCircle,
                  step.state === 'done' && styles.circleDone,
                  step.state === 'active' && styles.circleActive,
                  step.state === 'pending' && styles.circlePending,
                ]}
              >
                <Text
                  style={[
                    styles.stepNum,
                    step.state === 'pending' && styles.stepNumPending,
                  ]}
                >
                  {step.id}
                </Text>
              </View>
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    step.state === 'done' && styles.connectorDone,
                  ]}
                />
              )}
            </View>
            <View style={styles.stepBody}>
              <Text
                style={[
                  styles.stepLabel,
                  step.state === 'active' && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
              {step.date && <Text style={styles.stepDate}>{step.date}</Text>}
              {step.sub && (
                <Text
                  style={[
                    styles.stepSub,
                    step.state === 'active' && styles.stepSubActive,
                  ]}
                >
                  {step.sub}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.diplomaCard, shadows.card]}>
        <Text style={styles.diplomaLabel}>Diplôme concerné</Text>
        <Text style={styles.diplomaName}>{diplomaName}</Text>
        <Text style={styles.diplomaRef}>Réf. {diplomaRef}</Text>
      </View>

    </ScrollView>
  </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  bannerText: { flex: 1 },
  bannerTitle: { color: colors.warning, fontWeight: '700', fontSize: 15 },
  bannerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  stepRow: { flexDirection: 'row', minHeight: 56 },
  stepCol: { alignItems: 'center', width: 36 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.warning },
  circleActive: { backgroundColor: colors.warning, borderWidth: 2, borderColor: colors.warning },
  circlePending: { backgroundColor: colors.surfaceMuted, borderWidth: 2, borderColor: colors.border },
  stepNum: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  stepNumPending: { color: colors.textMuted },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  connectorDone: { backgroundColor: colors.warning },
  stepBody: { flex: 1, paddingBottom: spacing.md },
  stepLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  stepLabelActive: { color: colors.warning, fontWeight: '700' },
  stepDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  stepSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  stepSubActive: { color: colors.warning, fontWeight: '600' },
  diplomaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diplomaLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  diplomaName: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  diplomaRef: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});

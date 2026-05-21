import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/designTokens';

const STEPS = [
  { id: 1, label: 'Document reçu', done: true },
  { id: 2, label: 'Authenticité du document', done: true },
  { id: 3, label: "Vérification auprès de l'établissement", done: false, active: true },
  { id: 4, label: 'Résultat', done: false },
] as const;

/**
 * Écran « Vérification en cours » — timeline maquette coach/agent
 */
export const VerificationFlowScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Vérification des diplômes</Text>
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>Vérification en cours</Text>
      <Text style={styles.bannerSub}>
        Votre profil est visible avec un badge orange. La messagerie sera débloquée
        après validation admin.
      </Text>
    </View>

    {STEPS.map((step, index) => (
      <View key={step.id} style={styles.stepRow}>
        <View style={styles.stepLine}>
          <View
            style={[
              styles.dot,
              step.done && styles.dotDone,
              step.active && styles.dotActive,
            ]}
          />
          {index < STEPS.length - 1 && <View style={styles.connector} />}
        </View>
        <Text
          style={[
            styles.stepLabel,
            step.active && styles.stepLabelActive,
            step.done && styles.stepLabelDone,
          ]}
        >
          {step.label}
        </Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  banner: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  bannerTitle: {
    color: colors.warning,
    fontWeight: '700',
    fontSize: 16,
  },
  bannerSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  stepRow: { flexDirection: 'row', marginBottom: spacing.md },
  stepLine: { alignItems: 'center', width: 28 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border,
  },
  dotDone: { backgroundColor: colors.success },
  dotActive: { backgroundColor: colors.warning, width: 16, height: 16, borderRadius: 8 },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  stepLabel: { flex: 1, color: colors.textMuted, fontSize: 14, paddingTop: 0 },
  stepLabelDone: { color: colors.text },
  stepLabelActive: { color: colors.warning, fontWeight: '700' },
});

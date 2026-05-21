import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface VerificationSuccessScreenProps {
  onBack: () => void;
  diplomaName?: string;
  institution?: string;
  verifiedAt?: string;
}

export const VerificationSuccessScreen: React.FC<VerificationSuccessScreenProps> = ({
  onBack,
  diplomaName = 'UEFA A Licence',
  institution = 'UEFA · 2022',
  verifiedAt = '12 mai 2025',
}) => (
  <View style={styles.root}>
    <ScreenHeader title="Diplôme vérifié" onBack={onBack} centered />

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.checkCircle}>
          <Icon name="checkmark-circle" size={64} color={colors.success} />
        </View>
        <Text style={styles.heroTitle}>Diplôme vérifié</Text>
        <Text style={styles.heroSub}>
          Votre document a été validé par l&apos;équipe ProDay. Le badge vert est
          actif sur votre profil et la messagerie est débloquée.
        </Text>
      </View>

      <View style={[styles.card, shadows.card]}>
        <View style={styles.diplomaIcon}>
          <Icon name="school" size={28} color={colors.brand} />
        </View>
        <Text style={styles.diplomaName}>{diplomaName}</Text>
        <Text style={styles.diplomaInst}>{institution}</Text>
        <View style={styles.verifiedRow}>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Vérifié</Text>
          </View>
          <Text style={styles.verifiedDate}>Validé le {verifiedAt}</Text>
        </View>
      </View>

      <View style={[styles.infoCard, shadows.card]}>
        <Text style={styles.infoTitle}>Prochaines étapes</Text>
        <InfoLine text="Votre profil coach/agent affiche le badge vert." />
        <InfoLine text="Vous pouvez contacter les joueurs et clubs." />
        <InfoLine text="Vos diplômes restent visibles dans l'onglet Diplômes." />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
        <Text style={styles.primaryText}>Retour au profil</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

const InfoLine: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.infoLine}>
    <Icon name="checkmark-circle" size={16} color={colors.success} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  hero: { alignItems: 'center', marginBottom: spacing.xl, paddingTop: spacing.lg },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  diplomaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  diplomaName: { fontSize: 18, fontWeight: '800', color: colors.text },
  diplomaInst: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  verifiedRow: { alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm },
  verifiedBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  verifiedText: { color: colors.success, fontWeight: '800', fontSize: 13 },
  verifiedDate: { fontSize: 12, color: colors.textMuted },
  infoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoLine: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  infoText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

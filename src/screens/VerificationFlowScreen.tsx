import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../models/User';
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

function buildSteps(user: User): VerificationStep[] {
  const status = user.verification_status;
  const hasDoc = (user.documents?.length ?? 0) > 0;
  const uploaded = user.documents?.[0]?.uploaded_at;
  const dateStr = uploaded
    ? uploaded.toLocaleDateString('fr-FR')
    : undefined;

  if (status === 'VERIFIED') {
    return [
      { id: 1, label: 'Document reçu', state: 'done', date: dateStr },
      { id: 2, label: 'Authenticité', state: 'done' },
      { id: 3, label: 'Établissement', state: 'done' },
      { id: 4, label: 'Profil vérifié', state: 'done', sub: 'Validé' },
    ];
  }

  if (status === 'REJECTED') {
    return [
      { id: 1, label: 'Document reçu', state: 'done', date: dateStr },
      { id: 2, label: 'Contrôle', state: 'done' },
      { id: 3, label: 'Résultat', state: 'active', sub: 'Rejeté — renvoyez un document' },
      { id: 4, label: 'Accès complet', state: 'pending' },
    ];
  }

  const docDone = hasDoc;
  return [
    {
      id: 1,
      label: 'Document reçu',
      state: docDone ? 'done' : 'active',
      sub: docDone ? undefined : 'En attente d’upload',
      date: docDone ? dateStr : undefined,
    },
    {
      id: 2,
      label: 'Authenticité',
      state: docDone ? 'active' : 'pending',
      sub: docDone ? 'En cours' : 'En attente',
    },
    { id: 3, label: 'Établissement', state: 'pending', sub: 'En attente' },
    { id: 4, label: 'Résultat', state: 'pending', sub: 'En attente' },
  ];
}

interface VerificationFlowScreenProps {
  user: User;
  onBack?: () => void;
  /** Affiche l'écran succès (profil déjà vérifié) */
  initialSuccess?: boolean;
}

export const VerificationFlowScreen: React.FC<VerificationFlowScreenProps> = ({
  user,
  onBack,
  initialSuccess = false,
}) => {
  const [showSuccess, setShowSuccess] = useState(
    initialSuccess || user.verification_status === 'VERIFIED'
  );

  const steps = useMemo(() => buildSteps(user), [user]);
  const diplomaName =
    user.profile.diploma ?? user.profile.license_number ?? 'Document professionnel';
  const latestDoc = user.documents?.[user.documents.length - 1];

  if (showSuccess && onBack) {
    return (
      <VerificationSuccessScreen
        onBack={onBack}
        diplomaName={diplomaName}
        institution={user.profile.job_title ?? user.city ?? 'ProDay'}
      />
    );
  }

  const rejected = user.verification_status === 'REJECTED';

  return (
    <View style={styles.root}>
      {onBack ? (
        <ScreenHeader title="Vérification du diplôme" onBack={onBack} centered />
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, rejected && styles.bannerRejected]}>
          <Icon
            name={rejected ? 'warning' : 'warning'}
            size={22}
            color={rejected ? colors.brand : colors.warning}
          />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>
              {rejected
                ? 'Document à renvoyer'
                : user.verification_status === 'VERIFIED'
                  ? 'Profil vérifié'
                  : 'Vérification en cours'}
            </Text>
            <Text style={styles.bannerSub}>
              {rejected
                ? 'Votre dernier document n’a pas été accepté. Téléversez-en un nouveau depuis Profil.'
                : 'Le traitement peut prendre jusqu’à 5 jours ouvrés. Votre profil reste visible avec le badge orange.'}
            </Text>
          </View>
        </View>

        {latestDoc?.storage_url ? (
          <Text style={styles.docHint}>
            Dernier fichier envoyé · {latestDoc.type}
          </Text>
        ) : null}

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.diplomaTitle}>{diplomaName}</Text>
          {steps.map((step, index) => (
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
                  {step.state === 'done' ? (
                    <Icon name="checkmark-circle" size={18} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNum}>{step.id}</Text>
                  )}
                </View>
                {index < steps.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                {step.sub ? <Text style={styles.stepSub}>{step.sub}</Text> : null}
                {step.date ? <Text style={styles.stepDate}>{step.date}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {user.verification_status === 'VERIFIED' && onBack ? (
          <TouchableOpacity style={styles.btn} onPress={() => setShowSuccess(true)}>
            <Text style={styles.btnText}>Voir le certificat de vérification</Text>
          </TouchableOpacity>
        ) : null}
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
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerRejected: { backgroundColor: colors.brandSoft },
  bannerText: { flex: 1 },
  bannerTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  bannerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 20 },
  docHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diplomaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand,
    marginBottom: spacing.lg,
  },
  stepRow: { flexDirection: 'row', marginBottom: spacing.md },
  stepCol: { alignItems: 'center', width: 36 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.brand },
  circleActive: { backgroundColor: colors.warning },
  circlePending: { backgroundColor: colors.border },
  stepNum: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    minHeight: 24,
    marginVertical: 4,
  },
  stepBody: { flex: 1, paddingLeft: spacing.md },
  stepLabel: { fontWeight: '700', color: colors.text, fontSize: 14 },
  stepSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  stepDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontWeight: '700' },
});

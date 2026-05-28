import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { AppSpaceId } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { Icon } from '../../components/ui/Icon';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import { profileService } from '../../services/profile.service';
import type { PlayerVerificationCheckId } from '../../models/User';
import { getPlayerVerificationChecks } from './signupFlowConfig';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupPlayerVerificationStepProps {
  uid: string;
  appSpace: AppSpaceId;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: import('./useSignupForm').SignupForm['phases'];
  phaseIndex?: number;
  onBack?: () => void;
  onDone: () => void;
}

export const SignupPlayerVerificationStep: React.FC<SignupPlayerVerificationStepProps> = ({
  uid,
  appSpace,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onDone,
}) => {
  const checks = useMemo(() => getPlayerVerificationChecks(appSpace), [appSpace]);
  const underU13 = isUnderU13AppSpace(appSpace);

  const [loading, setLoading] = useState<PlayerVerificationCheckId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Partial<Record<PlayerVerificationCheckId, boolean>>>({});

  const pick = async (checkId: PlayerVerificationCheckId) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setLoading(checkId);
    setError(null);
    try {
      const asset = result.assets[0];
      const upload = await profileService.uploadPlayerVerificationCheck(
        uid,
        { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
        checkId
      );
      if (!upload.success) throw new Error(upload.error);
      setDone((d) => ({ ...d, [checkId]: true }));
      Alert.alert(
        'Document envoyé',
        'Analyse Mistral en cours. Vous serez notifié du résultat.'
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi impossible');
    } finally {
      setLoading(null);
    }
  };

  const finish = () => {
    if (!done.identity) {
      Alert.alert('Identité requise', 'La pièce d’identité est obligatoire pour un compte joueur.');
      return;
    }
    if (!underU13 && !done.club_license) {
      Alert.alert(
        'Licence club',
        'Sans licence club, votre profil restera en vérification partielle. Continuer ?',
        [
          { text: 'Ajouter licence', style: 'cancel' },
          { text: 'Continuer', onPress: onDone },
        ]
      );
      return;
    }
    onDone();
  };

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title="Justificatifs"
      subtitle={
        underU13
          ? 'Espace -13 : justificatif d’identité du joueur ou du responsable légal.'
          : 'Identité obligatoire · licence club recommandée pour le badge complet.'
      }
      onBack={onBack}
      footer={
        <SignupFooterButton
          label="Terminer l’inscription"
          onPress={finish}
          disabled={loading !== null}
        />
      }
    >
      {error ? <ProDayErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      {checks.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.cardHead}>
            <Icon
              name={done[c.id] ? 'checkmark-circle' : 'document'}
              size={22}
              color={done[c.id] ? colors.success : colors.accent}
            />
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>
                {c.title}
                {c.required ? ' *' : ''}
              </Text>
              <Text style={styles.cardSub}>{c.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.btn, done[c.id] && styles.btnDone]}
            onPress={() => pick(c.id)}
            disabled={loading !== null}
          >
            <Text style={styles.btnText}>
              {loading === c.id
                ? 'Envoi…'
                : done[c.id]
                  ? 'Remplacer'
                  : 'Téléverser'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.hint}>
        {underU13
          ? 'L’identité valide le compte et active la messagerie encadrée.'
          : 'L’identité débloque la messagerie. La licence club complète votre badge « joueur vérifié ».'}
      </Text>
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHead: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  btn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnDone: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  btnText: { color: colors.brandInverse, fontWeight: '800', fontSize: 13 },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: spacing.md },
});

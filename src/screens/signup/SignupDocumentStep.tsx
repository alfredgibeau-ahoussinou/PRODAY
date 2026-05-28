import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '../../components/ui/Icon';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { UserRole } from '../../models/User';
import { verificationDocumentTypeForRole } from '../../models/User';
import { profileService } from '../../services/profile.service';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { getErrorMessage } from '../../utils/errors';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupDocumentStepProps {
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: import('./useSignupForm').SignupForm['phases'];
  phaseIndex?: number;
  uid: string;
  role: UserRole;
  loading: boolean;
  error: string | null;
  onBack?: () => void;
  onSkip: () => void;
  onUploaded: () => void;
  onError: (msg: string) => void;
  setLoading: (v: boolean) => void;
}

export const SignupDocumentStep: React.FC<SignupDocumentStepProps> = ({
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  uid,
  role,
  loading,
  error,
  onBack,
  onSkip,
  onUploaded,
  onError,
  setLoading,
}) => {
  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLoading(true);
    onError('');
    try {
      const upload = await profileService.uploadVerificationDocument(
        uid,
        { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
        verificationDocumentTypeForRole(role)
      );
      if (!upload.success) throw new Error(upload.error);
      onUploaded();
    } catch (e) {
      onError(getErrorMessage(e, 'Envoi du document impossible.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title="Justificatif pro"
      subtitle={
        role === 'agent'
          ? 'Téléversez votre licence agent (FFF / FIFA). Analyse Mistral IA puis validation ProDay.'
          : role === 'organizer'
            ? 'Pièce d’identité ou attestation d’organisateur / responsable tournoi.'
            : 'Téléversez votre diplôme ou carte éducateur. Analyse Mistral IA puis validation ProDay.'
      }
      onBack={onBack}
      footer={
        <>
          <SignupFooterButton
            label="Choisir un document"
            onPress={pick}
            loading={loading}
          />
          <View style={styles.skipWrap}>
            <SignupFooterButton
              label="Passer cette étape"
              onPress={onSkip}
              variant="secondary"
              disabled={loading}
            />
          </View>
        </>
      }
    >
      <View style={styles.iconWrap}>
        <Icon name="document" size={36} color={colors.accent} />
      </View>
      {error ? (
        <ProDayErrorBanner message={error} onDismiss={() => onError('')} />
      ) : null}
      <Text style={styles.hint}>
        Mistral IA pré-analyse votre document en quelques secondes. La messagerie complète
        s&apos;ouvre après validation (automatique si le dossier est clair, sinon sous 48 h).
      </Text>
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  error: { color: colors.error, fontSize: 13, marginBottom: spacing.md },
  hint: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  skipWrap: { marginTop: spacing.sm },
});

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { SignupDocumentAiPanel } from '../../components/signup/SignupDocumentAiPanel';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { UserRole } from '../../models/User';
import { verifyOnboardingDocumentWithAi } from '../../services/onboardingDocument.service';
import { isAiVerificationPassing, type AiVerificationResult } from '../../utils/aiVerification';
import { captureDocumentWithCamera } from '../../utils/captureIdentityDocument';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { getErrorMessage } from '../../utils/errors';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

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
  onSkip?: () => void;
  onUploaded: () => void;
  allowSkip?: boolean;
  onError: (msg: string) => void;
  setLoading: (v: boolean) => void;
}

export const SignupDocumentStep: React.FC<SignupDocumentStepProps> = ({
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  role,
  loading,
  error,
  onBack,
  onSkip,
  onUploaded,
  allowSkip = true,
  onError,
  setLoading,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [aiResult, setAiResult] = useState<AiVerificationResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const capture = async () => {
    const photo = await captureDocumentWithCamera('document');
    if (!photo) return;

    setAiResult(null);
    setAnalyzing(true);
    setLoading(true);
    onError('');
    try {
      const ai = await verifyOnboardingDocumentWithAi(
        { uri: photo.uri, mimeType: photo.mimeType }
      );
      setAiResult(ai);
      if (isAiVerificationPassing(ai.status)) {
        onUploaded();
      } else {
        onError(
          ai.rejection_reason_fr ??
            'Document refusé par l’analyse IA. Reprenez la photo avec la caméra.'
        );
      }
    } catch (e) {
      onError(getErrorMessage(e, 'Analyse IA impossible.'));
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const passed = aiResult ? isAiVerificationPassing(aiResult.status) : false;

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title="Justificatif pro"
      subtitle="Photographiez votre document avec la caméra — analyse IA instantanée, rien n’est stocké."
      heroIcon="camera"
      contentKey={`doc-${role}`}
      onBack={onBack}
      footer={
        <>
          <SignupFooterButton
            label={passed ? 'Continuer' : 'Ouvrir la caméra'}
            onPress={passed ? onUploaded : capture}
            loading={loading || analyzing}
            disabled={analyzing}
          />
          {allowSkip && onSkip && !analyzing && !passed ? (
            <View style={styles.skipWrap}>
              <SignupFooterButton
                label="Passer cette étape"
                onPress={onSkip}
                variant="secondary"
                showArrow={false}
                disabled={loading}
              />
            </View>
          ) : null}
        </>
      }
    >
      <View style={styles.iconWrap}>
        <Icon name="camera" size={36} color={c.brand} />
      </View>
      {error ? (
        <ProDayErrorBanner message={error} onDismiss={() => onError('')} />
      ) : null}
      <SignupDocumentAiPanel result={aiResult ?? undefined} loading={analyzing} />
      <Text style={styles.hint}>
        Cadrez clairement votre diplôme, carte pro ou attestation. Mistral IA analyse la photo en
        mémoire — analyse locale sécurisée.
      </Text>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    iconWrap: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.brandSoft,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    hint: { fontSize: 14, lineHeight: 21, color: c.textSecondary, textAlign: 'center' },
    skipWrap: { marginTop: spacing.sm },
  });
}

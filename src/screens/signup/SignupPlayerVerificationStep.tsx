import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { AppSpaceId } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { Icon } from '../../components/ui/Icon';
import { SignupDocumentAiPanel } from '../../components/signup/SignupDocumentAiPanel';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import { verifyOnboardingDocumentWithAi } from '../../services/onboardingDocument.service';
import type { PlayerVerificationCheckId } from '../../models/User';
import { getPlayerVerificationChecks } from './signupFlowConfig';
import { isAiVerificationPassing, type AiVerificationResult } from '../../utils/aiVerification';
import { captureDocumentWithCamera } from '../../utils/captureIdentityDocument';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

type CheckAiState = 'idle' | 'analyzing' | 'passed' | 'rejected';

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
  appSpace,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onDone,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const checks = useMemo(() => getPlayerVerificationChecks(appSpace), [appSpace]);
  const underU13 = isUnderU13AppSpace(appSpace);

  const [checkState, setCheckState] = useState<Partial<Record<PlayerVerificationCheckId, CheckAiState>>>({});
  const [activeCheck, setActiveCheck] = useState<PlayerVerificationCheckId | null>(null);
  const [aiResult, setAiResult] = useState<AiVerificationResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identityPassed = checkState.identity === 'passed';
  const busy = analyzing;

  const capture = async (checkId: PlayerVerificationCheckId) => {
    const photo = await captureDocumentWithCamera(checkId === 'identity' ? 'identity' : 'document');
    if (!photo) return;

    setError(null);
    setActiveCheck(checkId);
    setAiResult(null);
    setAnalyzing(true);
    setCheckState((s) => ({ ...s, [checkId]: 'analyzing' }));
    try {
      const ai = await verifyOnboardingDocumentWithAi(
        { uri: photo.uri, mimeType: photo.mimeType },
        checkId
      );
      setAiResult(ai);
      if (isAiVerificationPassing(ai.status)) {
        setCheckState((s) => ({ ...s, [checkId]: 'passed' }));
      } else {
        setCheckState((s) => ({ ...s, [checkId]: 'rejected' }));
        setError(
          ai.rejection_reason_fr ??
            `Document « ${checkId} » refusé. Reprenez la photo avec la caméra.`
        );
      }
    } catch (e) {
      setCheckState((s) => ({ ...s, [checkId]: 'idle' }));
      setError(e instanceof Error ? e.message : 'Analyse IA impossible');
    } finally {
      setAnalyzing(false);
    }
  };

  const finish = () => {
    if (!identityPassed) {
      Alert.alert(
        'Identité requise',
        'Photographiez votre CNI ou passeport avec la caméra avant de continuer.'
      );
      return;
    }
    if (!underU13 && checkState.club_license !== 'passed') {
      Alert.alert(
        'Licence club',
        'Sans licence validée, votre profil restera partiel. Continuer ?',
        [
          { text: 'Photographier la licence', style: 'cancel' },
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
      title="Vérification par caméra"
      subtitle={
        underU13
          ? 'Photographiez la pièce d’identité du responsable — analyse IA instantanée, rien n’est stocké.'
          : 'CNI ou passeport obligatoire · licence club recommandée · prise de vue directe.'
      }
      heroIcon="camera"
      contentKey={`player-docs-${appSpace}`}
      onBack={onBack}
      footer={
        <SignupFooterButton
          label="Continuer vers l’email"
          onPress={finish}
          disabled={busy || !identityPassed}
        />
      }
    >
      {error ? <ProDayErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      {checks.map((check) => {
        const state = checkState[check.id] ?? 'idle';
        const passed = state === 'passed';
        const isIdentity = check.id === 'identity';
        return (
          <View key={check.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Icon
                name={passed ? 'checkmark-circle' : isIdentity ? 'camera' : 'document'}
                size={22}
                color={passed ? c.success : state === 'rejected' ? c.error : c.brand}
              />
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>
                  {check.title}
                  {check.required ? ' *' : ''}
                </Text>
                <Text style={styles.cardSub}>{check.subtitle}</Text>
                {isIdentity ? (
                  <Text style={styles.cameraTip}>
                    Cadrez le recto de la carte ou la page photo du passeport, sans reflet.
                  </Text>
                ) : null}
                {state === 'analyzing' ? (
                  <Text style={styles.aiTag}>Analyse IA…</Text>
                ) : null}
                {passed ? <Text style={styles.aiOk}>Validé — non stocké</Text> : null}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btn, passed && styles.btnDone]}
              onPress={() => capture(check.id)}
              disabled={busy}
            >
              <Text style={[styles.btnText, passed && styles.btnTextDone]}>
                {state === 'analyzing'
                  ? 'Analyse IA…'
                  : passed
                    ? 'Reprendre la photo'
                    : isIdentity
                      ? 'Ouvrir la caméra'
                      : 'Photographier avec la caméra'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {activeCheck && (analyzing || aiResult) ? (
        <SignupDocumentAiPanel result={aiResult ?? undefined} loading={analyzing} />
      ) : null}

      <Text style={styles.hint}>
        Utilisez la caméra pour photographier vos documents. L’IA Mistral analyse la photo en
        mémoire — aucune copie n’est enregistrée sur nos serveurs.
      </Text>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    cardHead: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
    cardCopy: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '900', color: c.text },
    cardSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    cameraTip: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 4,
      lineHeight: 16,
    },
    aiTag: { fontSize: 11, fontWeight: '700', color: c.warning, marginTop: 4 },
    aiOk: { fontSize: 11, fontWeight: '700', color: c.success, marginTop: 4 },
    btn: {
      backgroundColor: c.ink,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    btnDone: { backgroundColor: c.brandSoft, borderWidth: 1, borderColor: c.brand },
    btnText: { color: c.brandInverse, fontWeight: '800', fontSize: 13 },
    btnTextDone: { color: c.text },
    hint: { fontSize: 12, color: c.textMuted, lineHeight: 18, marginTop: spacing.md },
  });
}

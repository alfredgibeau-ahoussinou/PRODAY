import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupParentalStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
  onSubmit: () => void;
}

export const SignupParentalStep: React.FC<SignupParentalStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onSubmit,
}) => {
  const { colors: c, productLine } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const underU13 = isUnderU13AppSpace(form.appSpace);
  const meta = getPlayerStepMeta(form.productLine, 'family');
  const guardianCopy =
    productLine === 'woman'
      ? 'Je confirme être mineure et que mon responsable accepte la supervision du compte ProDay.'
      : 'Je confirme être mineur et que mon responsable accepte la supervision du compte ProDay.';

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={meta.title}
      subtitle={
        underU13
          ? 'Espace -13 — un parent ou tuteur valide le compte.'
          : meta.subtitle
      }
      contentKey={`family-${form.appSpace}`}
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <SignupFooterButton
          label="Continuer"
          onPress={onSubmit}
          loading={form.loading}
        />
      }
    >
      {form.error ? (
        <View>
          <Text style={styles.error}>{form.error}</Text>
        </View>
      ) : null}

      <View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Protection activée</Text>
          <Text style={styles.infoBody}>
            Filtrage des contacts, limite de temps d&apos;écran et rapport d&apos;activité pour
            les {productLine === 'woman' ? 'joueuses' : 'joueurs'} de moins de 18 ans.
          </Text>
        </View>
      </View>

      <View>
        <AuthTextField
          label="Nom du responsable"
          icon="person"
          placeholder="Parent ou tuteur légal"
          value={form.guardianName}
          onChangeText={form.setGuardianName}
          error={form.fieldErrors.guardianName}
        />
      </View>
      <View>
        <AuthTextField
          label="Email du responsable"
          icon="mail"
          placeholder="parent@exemple.com"
          value={form.guardianEmail}
          onChangeText={form.setGuardianEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={form.fieldErrors.guardianEmail}
        />
      </View>

      <View>
        <SignupPressable
          style={styles.consentRow}
          onPress={() => form.setGuardianConsent(!form.guardianConsent)}
        >
          <View style={[styles.checkbox, form.guardianConsent && styles.checkboxOn]}>
            {form.guardianConsent ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>{guardianCopy}</Text>
        </SignupPressable>
        {form.fieldErrors.guardianConsent ? (
          <Text style={styles.error}>{form.fieldErrors.guardianConsent}</Text>
        ) : null}
      </View>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    error: { color: c.error, fontSize: 13, marginBottom: spacing.md, fontWeight: '600' },
    infoBox: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    infoTitle: { fontSize: 14, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    infoBody: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
    consentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxOn: { backgroundColor: c.ink, borderColor: c.ink },
    checkMark: { color: c.brandInverse, fontSize: 14, fontWeight: '900' },
    consentText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}

import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { getPasswordStrength, SIGNUP_PASSWORD_MIN } from '../../utils/signupValidation';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { SignupPasswordStrengthBar } from '../../components/signup/SignupPasswordStrengthBar';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { getProStepMeta } from './signupProConfig';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupSecurityStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack?: () => void;
  onSubmit: () => void;
  nextLabel?: string;
}

export const SignupSecurityStep: React.FC<SignupSecurityStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onSubmit,
  nextLabel = 'Créer mon compte',
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const passwordStrength =
    form.password.length > 0 ? getPasswordStrength(form.password) : null;
  const meta = form.isProProduct
    ? getProStepMeta('security')
    : getPlayerStepMeta(form.productLine, 'security');

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={form.isOAuthCompletion ? 'Finaliser l’accès' : meta.title}
      subtitle={
        form.isOAuthCompletion
          ? 'Acceptez les conditions pour activer votre compte.'
          : meta.subtitle
      }
      contentKey="security"
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <SignupFooterButton
          label={nextLabel}
          onPress={onSubmit}
          loading={form.loading}
        />
      }
    >
      {form.error ? (
        <View>
          <ProDayErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
        </View>
      ) : null}

      {form.isOAuthCompletion ? null : (
        <>
          <View>
            <AuthTextField
              label="Mot de passe"
              icon="lock"
              placeholder={`${SIGNUP_PASSWORD_MIN} caractères, maj., chiffre, spécial`}
              value={form.password}
              onChangeText={form.setPassword}
              secureToggle
              error={form.fieldErrors.password}
            />
          </View>
          {passwordStrength?.label ? (
            <View>
              <SignupPasswordStrengthBar
                level={passwordStrength.level}
                label={`Sécurité : ${passwordStrength.label}`}
              />
            </View>
          ) : null}
          {!form.fieldErrors.password && form.password.length > 0 ? (
            <View>
              <Text style={styles.passwordRules}>
                Majuscule, minuscule, chiffre et caractère spécial requis.
              </Text>
            </View>
          ) : null}
          <View>
            <AuthTextField
              label="Confirmer le mot de passe"
              icon="lock"
              placeholder="Répétez le mot de passe"
              value={form.confirmPassword}
              onChangeText={form.setConfirmPassword}
              secureToggle
              error={form.fieldErrors.confirmPassword}
            />
          </View>
        </>
      )}

      <View>
        <SignupPressable
          style={styles.termsRow}
          onPress={() => form.setAcceptedTerms(!form.acceptedTerms)}
        >
          <View style={[styles.checkbox, form.acceptedTerms && styles.checkboxOn]}>
            {form.acceptedTerms ? (
              <Icon name="checkmark-circle" size={16} color={c.brandInverse} />
            ) : null}
          </View>
          <Text style={styles.termsText}>
            Je certifie l’exactitude des informations et j’accepte les conditions d’utilisation
            ProDay (CGU et confidentialité).
          </Text>
        </SignupPressable>
        {form.fieldErrors.acceptedTerms ? (
          <Text style={styles.termsError}>{form.fieldErrors.acceptedTerms}</Text>
        ) : null}
      </View>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    passwordRules: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: -spacing.xs,
      marginBottom: spacing.sm,
      lineHeight: 16,
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      backgroundColor: c.surface,
    },
    checkboxOn: {
      backgroundColor: c.ink,
      borderColor: c.ink,
    },
    termsText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: c.textSecondary,
    },
    termsError: {
      color: c.error,
      fontSize: 12,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
  });
}

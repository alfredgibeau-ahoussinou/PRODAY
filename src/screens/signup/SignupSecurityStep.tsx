import React, { useMemo } from 'react';
import { Linking, Text, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { getPasswordStrength, SIGNUP_PASSWORD_MIN } from '../../utils/signupValidation';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { StaggerReveal } from '../../components/motion';
import { SignupFormCard } from '../../components/signup/SignupFormCard';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { SignupPasswordStrengthBar } from '../../components/signup/SignupPasswordStrengthBar';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';
import { getProStepMeta } from './signupProConfig';
import { getSanteStepMeta } from './signupSanteConfig';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';
import { legalWebUrl } from '../../content/legalDocuments';

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
  nextLabel = undefined,
}) => {
  const { t } = useTranslation();
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const passwordStrength =
    form.password.length > 0 ? getPasswordStrength(form.password) : null;
  const meta = form.isSanteProduct
    ? getSanteStepMeta('security', t)
    : form.isProProduct
      ? getProStepMeta('security', t)
      : getPlayerStepMeta(form.productLine, 'security', t);

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={form.isOAuthCompletion ? t('signup.security.oauth.title') : meta.title}
      subtitle={
        form.isOAuthCompletion ? t('signup.security.oauth.subtitle') : meta.subtitle
      }
      contentKey="security"
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <SignupFooterButton
          label={
            nextLabel ??
            (form.isOAuthCompletion
              ? t('signup.form.finalize')
              : form.isSanteProduct
                ? t('signup.form.createSante')
                : form.isProPlayerSignup
                  ? t('signup.form.createProPlayer')
                  : form.isProProduct
                    ? t('signup.form.createPro')
                    : form.isAmateurProduct
                      ? t('signup.form.createAmateur')
                      : t('signup.form.createAccount'))
          }
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
        <SignupFormCard>
          <StaggerReveal index={0}>
            <AuthTextField
              label={t('signup.security.password')}
              icon="lock"
              placeholder={t('signup.security.passwordPlaceholder', { min: SIGNUP_PASSWORD_MIN })}
              value={form.password}
              onChangeText={form.setPassword}
              secureToggle
              error={form.fieldErrors.password}
            />
          </StaggerReveal>
          {passwordStrength?.label ? (
            <StaggerReveal index={1}>
              <SignupPasswordStrengthBar
                level={passwordStrength.level}
                label={t('signup.security.passwordStrength', { label: passwordStrength.label })}
              />
            </StaggerReveal>
          ) : null}
          {!form.fieldErrors.password && form.password.length > 0 ? (
            <Text style={styles.passwordRules}>{t('signup.security.passwordRules')}</Text>
          ) : null}
          <StaggerReveal index={2}>
            <AuthTextField
              label={t('signup.security.confirmPassword')}
              icon="lock"
              placeholder={t('signup.form.repeatPassword')}
              value={form.confirmPassword}
              onChangeText={form.setConfirmPassword}
              secureToggle
              error={form.fieldErrors.confirmPassword}
            />
          </StaggerReveal>
        </SignupFormCard>
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
            Je certifie l’exactitude des informations et j’accepte les{' '}
            <Text
              style={styles.termsLink}
              onPress={() => void Linking.openURL(legalWebUrl('terms'))}
            >
              CGU
            </Text>
            {' '}et la{' '}
            <Text
              style={styles.termsLink}
              onPress={() => void Linking.openURL(legalWebUrl('privacy'))}
            >
              politique de confidentialité
            </Text>
            {' '}ProDay.
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
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    termsText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: c.textSecondary,
    },
    termsLink: {
      color: c.brand,
      textDecorationLine: 'underline',
    },
    termsError: {
      color: c.error,
      fontSize: 12,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
  });
}

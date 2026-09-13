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
import { legalWebUrl, type LegalDocumentId } from '../../content/legalDocuments';
import { LegalDocumentModal } from '../../components/legal/LegalDocumentModal';

interface SignupSecurityStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack?: () => void;
  onClose?: () => void;
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
  onClose,
  onSubmit,
  nextLabel = undefined,
}) => {
  const { t } = useTranslation();
  const { colors: c } = useSignupFlowTheme();
  const [modalLegalDoc, setModalLegalDoc] = React.useState<LegalDocumentId | null>(null);
  const styles = useMemo(() => createStyles(c), [c]);
  const passwordChecks = useMemo(() => {
    const p = form.password;
    return [
      { key: 'len', label: '10+ caractères', ok: p.length >= SIGNUP_PASSWORD_MIN },
      { key: 'lower', label: '1 minuscule', ok: /[a-zàâäéèêëïîôùûüç]/.test(p) },
      { key: 'upper', label: '1 majuscule', ok: /[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/.test(p) },
      { key: 'num', label: '1 chiffre', ok: /\d/.test(p) },
      { key: 'special', label: '1 spécial (!@#$…)', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
    ];
  }, [form.password]);

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
      onClose={onClose}
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
          {form.password.length > 0 ? (
            <View style={styles.passwordChecksContainer}>
              {passwordChecks.map((check) => (
                <View
                  key={check.key}
                  style={[
                    styles.passwordCheckItem,
                    check.ok ? styles.passwordCheckItemOk : styles.passwordCheckItemPending,
                  ]}
                >
                  <Icon
                    name={check.ok ? 'checkmark-circle' : 'alert-circle'}
                    size={11}
                    color={check.ok ? '#30D158' : c.textMuted}
                  />
                  <Text
                    style={[
                      styles.passwordCheckLabel,
                      check.ok ? styles.passwordCheckLabelOk : styles.passwordCheckLabelPending,
                    ]}
                  >
                    {check.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.passwordRules}>{t('signup.security.passwordRules')}</Text>
          )}
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
              onPress={() => setModalLegalDoc('terms')}
            >
              CGU
            </Text>
            {' '}et la{' '}
            <Text
              style={styles.termsLink}
              onPress={() => setModalLegalDoc('privacy')}
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

      <LegalDocumentModal
        visible={modalLegalDoc !== null}
        documentId={modalLegalDoc}
        onClose={() => setModalLegalDoc(null)}
      />
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
    passwordChecksContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
      marginBottom: spacing.sm,
    },
    passwordCheckItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    passwordCheckItemOk: {
      backgroundColor: 'rgba(48, 209, 88, 0.12)',
      borderColor: 'rgba(48, 209, 88, 0.3)',
    },
    passwordCheckItemPending: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    passwordCheckLabel: {
      fontSize: 10,
      fontFamily: '-apple-system',
    },
    passwordCheckLabelOk: {
      color: '#30D158',
      fontWeight: '700',
    },
    passwordCheckLabelPending: {
      color: c.textMuted,
      fontWeight: '500',
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

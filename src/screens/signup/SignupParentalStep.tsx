import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';
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
  const { t } = useTranslation();
  const meta = getPlayerStepMeta(form.productLine, 'family', t);
  const guardianCopy =
    form.gender === 'women'
      ? t('signup.form.guardianConsentWoman')
      : t('signup.form.guardianConsentMan');

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={meta.title}
      subtitle={
        underU13 ? t('signup.parental.u13Subtitle') : meta.subtitle
      }
      contentKey={`family-${form.appSpace}`}
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <SignupFooterButton
          label={t('signup.form.continue')}
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
          <Text style={styles.infoTitle}>{t('signup.parental.protectionTitle')}</Text>
          <Text style={styles.infoBody}>
            {t('signup.parental.protectionBody', {
              players: t(
                form.gender === 'women'
                  ? 'signup.parental.playersWoman'
                  : 'signup.parental.playersMan'
              ),
            })}
          </Text>
        </View>
      </View>

      <View>
        <AuthTextField
          label={t('signup.form.guardianName')}
          icon="person"
          placeholder={t('signup.form.guardianPlaceholder')}
          value={form.guardianName}
          onChangeText={form.setGuardianName}
          error={form.fieldErrors.guardianName}
        />
      </View>
      <View>
        <AuthTextField
          label={t('signup.form.guardianEmail')}
          icon="mail"
          placeholder={t('signup.form.guardianEmailPlaceholder')}
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
    checkboxOn: { backgroundColor: c.accent, borderColor: c.accent },
    checkMark: { color: c.brandInverse, fontSize: 14, fontWeight: '900' },
    consentText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}

import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getStaffStepSubtitle } from './signupFlowConfig';
import { getMedicalSpecialtyConfigs } from './signupMedicalI18n';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import { useTranslation } from '../../context/LocaleContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupStaffStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
}

export const SignupStaffStep: React.FC<SignupStaffStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);

  const medicalOptions = useMemo(
    () => getMedicalSpecialtyConfigs(t).map((c) => ({ label: c.label, value: c.id })),
    [t]
  );

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={t('signup.form.proProfile')}
      subtitle={getStaffStepSubtitle(form.role, t)}
      contentKey={`staff-${form.role}`}
      heroIcon="briefcase"
      onBack={onBack}
      footer={
        <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
      }
    >
      <View>
        <Text style={styles.staffHint}>{t('signup.staff.hint')}</Text>
      </View>
      {form.role === 'physio' ? (
        <View>
          <SignupOptionPicker
            label={t('signup.form.medicalSpecialty')}
            options={medicalOptions.map((o) => o.label)}
            value={medicalOptions.find((o) => o.value === form.medicalSpecialty)?.label ?? ''}
            onChange={(label) => {
              const match = medicalOptions.find((o) => o.label === label);
              if (match) form.setMedicalSpecialty(match.value);
            }}
            error={form.fieldErrors.medicalSpecialty}
          />
        </View>
      ) : null}
      <View>
        <AuthTextField
          label={t('signup.form.cityRequired')}
          icon="location"
          placeholder={t('signup.form.cityPlaceholder')}
          value={form.city}
          onChangeText={form.setCity}
          error={form.fieldErrors.city}
        />
      </View>
      <View>
        <AuthTextField
          label={
            form.role === 'agent' || form.role === 'club' || form.role === 'recruiter'
              ? t('signup.form.departmentRequired')
              : t('signup.form.departmentOptional')
          }
          icon="location"
          placeholder={t('signup.form.deptPlaceholderLong')}
          value={form.department}
          onChangeText={form.setDepartment}
          error={form.fieldErrors.department}
        />
      </View>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    staffHint: {
      fontSize: 13,
      lineHeight: 20,
      color: c.textSecondary,
      marginBottom: spacing.lg,
      backgroundColor: c.brandSoft,
      padding: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
  });
}

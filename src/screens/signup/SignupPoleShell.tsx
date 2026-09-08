import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import type { SignupPageId } from './signupFlowTypes';
import { getStepMetaForRole } from './signupRoleExperience';
import { getProStepMeta } from './signupProConfig';
import { getSanteStepMeta } from './signupSanteConfig';
import { useSignupFlowTheme } from './SignupFlowContext';
import { useTranslation } from '../../context/LocaleContext';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { ProDayText } from '../../components/ui/ProDayText';
import { spacing } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

type LayoutProps = {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack?: () => void;
};

export type SignupPoleShellProps = LayoutProps & {
  page: SignupPageId;
  children: React.ReactNode;
  /** Aide sous le titre — caption légère, pas de boîte clutter. */
  hint?: string;
  continueLabel?: string;
};

/**
 * Chrome d’étape métier partagé (coach, club, agent, sponsor, médical…).
 * Même famille visuelle que login / gate.
 */
export const SignupPoleShell: React.FC<SignupPoleShellProps> = ({
  form,
  page,
  children,
  hint,
  continueLabel,
  ...layout
}) => {
  const { colors, isProSignup, isSanteSignup } = useSignupFlowTheme();
  const { t } = useTranslation();
  const meta = isSanteSignup
    ? getSanteStepMeta(page, t)
    : isProSignup
      ? getProStepMeta(page, t)
      : getStepMetaForRole(page, form.role, t);

  return (
    <SignupStepLayout
      {...layout}
      title={meta.title}
      subtitle={meta.subtitle}
      heroIcon={meta.heroIcon}
      stepName={meta.stepName ?? layout.stepName}
      contentKey={`${page}-${form.role}`}
      onBack={layout.onBack}
      footer={
        <SignupFooterButton
          label={continueLabel ?? t('signup.form.continue')}
          onPress={() => form.advanceFromCurrentPage()}
          accent={colors.accent?.toUpperCase() === '#FFFFFF' ? '#C5A059' : colors.accent}
        />
      }
    >
      {form.error ? (
        <View style={styles.errorWrap}>
          <ProDayErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
        </View>
      ) : null}

      {hint ? (
        <ProDayText style={[styles.hintText, { color: colors.textSecondary }]}>{hint}</ProDayText>
      ) : null}

      {children}
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  errorWrap: { marginBottom: spacing.md },
  hintText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamily.regular,
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
});

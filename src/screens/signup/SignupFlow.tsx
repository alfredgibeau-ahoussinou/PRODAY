import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useSignupForm } from './useSignupForm';
import { SignupRoleStep } from './SignupRoleStep';
import { SignupProgramStep } from './SignupProgramStep';
import { SignupAccountStep } from './SignupAccountStep';
import { SignupPlayerVerificationStep } from './SignupPlayerVerificationStep';
import { SignupPlayerStep } from './SignupPlayerStep';
import { SignupStaffStep } from './SignupStaffStep';
import { SignupParentalStep } from './SignupParentalStep';
import { SignupDocumentStep } from './SignupDocumentStep';
import { SignupSuccessStep } from './SignupSuccessStep';
import { useAuth } from '../../context/AuthContext';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import { getSuccessCopy } from './signupFlowConfig';
import { colors } from '../../theme/designTokens';

interface SignupFlowProps {
  onClose: () => void;
  onComplete: () => void;
  initialEmail?: string;
  initialDisplayName?: string;
}

export const SignupFlow: React.FC<SignupFlowProps> = ({
  onClose,
  onComplete,
  initialEmail,
  initialDisplayName,
}) => {
  const form = useSignupForm({ initialEmail, initialDisplayName });
  const { profile, refreshProfile } = useAuth();

  const layout = {
    stepIndex: form.pageIndex,
    stepTotal: form.steps.length,
    stepName: form.stepLabel,
    phases: form.phases,
    phaseIndex: form.phaseIndex,
    flowKind: form.flowKind,
  };

  const postAccountPages = ['player_verify', 'document', 'success'] as const;
  const backUnlessLocked =
    form.accountCreated && postAccountPages.includes(form.currentPage as (typeof postAccountPages)[number])
      ? undefined
      : form.goBack;

  const submitAccount = async () => {
    if (!form.validateAccount()) return;
    await form.createAccount(refreshProfile);
  };

  switch (form.currentPage) {
    case 'role':
      return <SignupRoleStep form={form} {...layout} onClose={onClose} />;

    case 'program':
      return <SignupProgramStep form={form} {...layout} onClose={onClose} />;

    case 'player':
      return (
        <SignupPlayerStep
          form={form}
          {...layout}
          onBack={form.goBack}
          onSubmit={() => form.submitPlayerProfile()}
        />
      );

    case 'parental':
      return (
        <SignupParentalStep
          form={form}
          {...layout}
          onBack={form.goBack}
          onSubmit={() => {
            if (!form.validateParental()) return;
            form.goNext();
          }}
        />
      );

    case 'staff':
      return (
        <SignupStaffStep
          form={form}
          {...layout}
          onBack={form.goBack}
          onNext={() => {
            if (!form.validateStaff()) return;
            form.goNext();
          }}
        />
      );

    case 'account':
      return (
        <SignupAccountStep
          form={form}
          {...layout}
          onBack={backUnlessLocked}
          onNext={() => void submitAccount()}
          nextLabel={form.isOAuthCompletion ? 'Finaliser mon compte' : 'Créer mon compte'}
        />
      );

    case 'player_verify':
      if (!profile) {
        return (
          <View style={styles.waiting}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        );
      }
      return (
        <SignupPlayerVerificationStep
          uid={profile.uid}
          appSpace={form.appSpace}
          {...layout}
          onBack={backUnlessLocked}
          onDone={() => form.goToPage('success')}
        />
      );

    case 'document':
      if (!profile) {
        return (
          <View style={styles.waiting}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        );
      }
      return (
        <SignupDocumentStep
          {...layout}
          uid={profile.uid}
          role={profile.role}
          loading={form.loading}
          error={form.error}
          onBack={backUnlessLocked}
          onSkip={() => form.goToPage('success')}
          onUploaded={() => form.goToPage('success')}
          onError={(msg) => form.setError(msg || null)}
          setLoading={form.setLoading}
        />
      );

    case 'success':
    default: {
      const verificationPending = profile
        ? profile.role === 'player'
          ? profile.verification_status === 'PENDING'
          : ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
            profile.verification_status === 'PENDING'
        : form.role === 'player' || form.needsDocument;

      const copy = getSuccessCopy(form.role, {
        emailVerificationPending: form.createdWithEmailPassword,
        verificationPending,
      });

      return (
        <SignupSuccessStep
          {...layout}
          displayName={form.createdDisplayName || profile?.display_name || 'Membre'}
          title={copy.title}
          body={copy.body}
          finishLabel={copy.finishLabel}
          onFinish={onComplete}
        />
      );
    }
  }
};

const styles = StyleSheet.create({
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

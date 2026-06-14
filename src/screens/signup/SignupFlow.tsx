import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { motion } from '../../theme/motion';
import { useSignupForm } from './useSignupForm';
import { SignupWelcomeStep } from './SignupWelcomeStep';
import { SignupSpaceStep } from './SignupSpaceStep';
import { SignupSportStep } from './SignupSportStep';
import { SignupLocationStep } from './SignupLocationStep';
import { SignupStatsStep } from './SignupStatsStep';
import {
  SignupCoachProStep,
  SignupClubProStep,
  SignupAgentProStep,
  SignupRecruiterProStep,
  SignupOrganizerProStep,
  SignupMedicalSpecialtyStep,
  SignupMedicalPracticeStep,
  SignupSponsorProStep,
} from './SignupRoleSteps';
import { SignupAccountStep } from './SignupAccountStep';
import { SignupSecurityStep } from './SignupSecurityStep';
import { SignupParentalStep } from './SignupParentalStep';
import { SignupSuccessStep } from './SignupSuccessStep';
import { useAuth } from '../../context/AuthContext';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import { SignupFlowProvider, useSignupFlowTheme } from './SignupFlowContext';
import { getWomanLaunchCopy } from './signupWomanConfig';
import { getManLaunchCopy } from './signupManConfig';
import { getProLaunchCopy } from './signupProConfig';
import { getSanteLaunchCopy } from './signupSanteConfig';

interface SignupFlowProps {
  onClose: () => void;
  onComplete: () => void;
  initialEmail?: string;
  initialDisplayName?: string;
  productLine?: ProductLineId;
}

type SignupFormApi = ReturnType<typeof useSignupForm>;

interface SignupFlowInnerProps extends SignupFlowProps {
  form: SignupFormApi;
}

const SignupFlowInner: React.FC<SignupFlowInnerProps> = ({
  onClose,
  onComplete,
  form,
}) => {
  const { colors, isWomanSignup, isProSignup, isSanteSignup } = useSignupFlowTheme();
  const { profile, refreshProfile } = useAuth();

  const layout = {
    stepIndex: form.pageIndex,
    stepTotal: form.steps.length,
    stepName: form.stepLabel,
    phases: form.phases,
    phaseIndex: form.phaseIndex,
  };

  const backUnlessLocked = form.accountCreated ? undefined : form.goBack;
  const prevIndexRef = useRef(form.pageIndex);
  const direction = form.pageIndex >= prevIndexRef.current ? 1 : -1;

  useEffect(() => {
    prevIndexRef.current = form.pageIndex;
  }, [form.pageIndex]);

  const pageEntering =
    direction > 0
      ? FadeInRight.springify()
          .damping(18)
          .stiffness(160)
          .duration(motion.duration.normal)
      : FadeInLeft.springify()
          .damping(18)
          .stiffness(160)
          .duration(motion.duration.normal);

  const submitSecurity = async () => {
    if (!form.validateAccount()) return;
    await form.createAccount(refreshProfile);
  };

  let content: React.ReactNode;
  switch (form.currentPage) {
    case 'welcome':
      content = <SignupWelcomeStep form={form} {...layout} onClose={onClose} />;
      break;
    case 'space':
      content = <SignupSpaceStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'sport':
      content = <SignupSportStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'location':
      content = <SignupLocationStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'stats':
      content = <SignupStatsStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'coach_pro':
      content = <SignupCoachProStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'club_pro':
      content = <SignupClubProStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'agent_pro':
      content = <SignupAgentProStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'recruiter_pro':
      content = <SignupRecruiterProStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'organizer_pro':
      content = <SignupOrganizerProStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'medical_specialty':
      content = <SignupMedicalSpecialtyStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'medical_practice':
      content = <SignupMedicalPracticeStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'sponsor_pro':
      content = <SignupSponsorProStep form={form} {...layout} onBack={form.goBack} />;
      break;
    case 'family':
      content = (
        <SignupParentalStep
          form={form}
          {...layout}
          onBack={form.goBack}
          onSubmit={() => form.advanceFromCurrentPage()}
        />
      );
      break;
    case 'account':
      content = <SignupAccountStep form={form} {...layout} onBack={backUnlessLocked} />;
      break;
    case 'security':
      content = (
        <SignupSecurityStep
          form={form}
          {...layout}
          onBack={backUnlessLocked}
          onSubmit={() => void submitSecurity()}
          nextLabel={
            form.isOAuthCompletion
              ? 'Finaliser mon accès'
              : form.isSanteProduct
                ? 'Créer mon compte Santé'
                : form.isProProduct
                  ? 'Créer mon compte Pro'
                  : form.isWomanProduct
                    ? 'Créer mon compte Woman'
                    : 'Créer mon compte'
          }
        />
      );
      break;
    case 'launch':
    default: {
      const verificationPending =
        profile?.verification_status === 'PENDING' ||
        form.role === 'player' ||
        ROLES_REQUIRING_VERIFICATION.includes(form.role) ||
        form.role === 'physio';

      const copy = isWomanSignup
        ? getWomanLaunchCopy({
            emailVerificationPending: form.createdWithEmailPassword,
          })
        : isSanteSignup
          ? getSanteLaunchCopy({
              emailVerificationPending: form.createdWithEmailPassword,
              verificationPending,
            })
          : isProSignup
            ? getProLaunchCopy({
                emailVerificationPending: form.createdWithEmailPassword,
                verificationPending,
              })
            : getManLaunchCopy({
                emailVerificationPending: form.createdWithEmailPassword,
              });

      content = (
        <SignupSuccessStep
          {...layout}
          displayName={form.createdDisplayName || profile?.display_name || 'Membre'}
          title={copy.title}
          body={copy.body}
          finishLabel={copy.finishLabel}
          onFinish={onComplete}
        />
      );
      break;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View key={form.currentPage} entering={pageEntering} style={styles.page}>
        {content}
      </Animated.View>
    </View>
  );
};

const SignupFlowWithTheme: React.FC<SignupFlowProps> = (props) => {
  const form = useSignupForm({
    initialEmail: props.initialEmail,
    initialDisplayName: props.initialDisplayName,
    productLine: props.productLine ?? 'homme',
  });

  return (
    <SignupFlowProvider productLine={props.productLine ?? 'homme'} experienceRole={form.role}>
      <SignupFlowInner {...props} form={form} />
    </SignupFlowProvider>
  );
};

export const SignupFlow: React.FC<SignupFlowProps> = (props) => <SignupFlowWithTheme {...props} />;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  page: { flex: 1, minHeight: 0 },
});

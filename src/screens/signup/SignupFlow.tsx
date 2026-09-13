import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { useReducedMotion } from '../../motion';
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
import {
  SignupSponsorCampaignStep,
  SignupSponsorCompanyStep,
  SignupSponsorTargetingStep,
} from './SignupSponsorSteps';
import { SignupAccountStep } from './SignupAccountStep';
import { SignupSecurityStep } from './SignupSecurityStep';
import { SignupParentalStep } from './SignupParentalStep';
import { SignupSuccessStep } from './SignupSuccessStep';
import { SignupErrorBoundary } from './SignupErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import { SignupFlowProvider, useSignupFlowTheme } from './SignupFlowContext';
import { getProLaunchCopy } from './signupProConfig';
import { getProPlayerLaunchCopy } from './signupProPlayerConfig';
import { getAmateurLaunchCopy } from './signupAmateurConfig';
import { getSupporterLaunchCopy } from './signupSupporterConfig';
import { getSanteLaunchCopy } from './signupSanteConfig';
import { useTranslation } from '../../context/LocaleContext';
import type { UserRole } from '../../models/User';
import { needsOnboardingDocumentUpload } from '../../utils/onboardingGate';
import { resolveSignupBackKind } from './signupFlowConfig';

interface SignupFlowProps {
  onClose: () => void;
  onComplete: () => void;
  initialEmail?: string;
  initialDisplayName?: string;
  productLine?: ProductLineId;
  initialRole?: UserRole;
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
  const { isProPlayerSignup, isProSignup, isAmateurSignup, isSupporterSignup, isSanteSignup } =
    useSignupFlowTheme();
  const { t } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const reduced = useReducedMotion();

  useEffect(() => {
    form.registerCreateBeforeLaunch(() => form.createAccount(refreshProfile));
    return () => form.registerCreateBeforeLaunch(null);
  }, [form, refreshProfile]);

  const layout = {
    stepIndex: form.pageIndex,
    stepTotal: form.steps.length,
    stepName: form.stepLabel,
    phases: form.phases,
    phaseIndex: form.phaseIndex,
  };

  const backKind = resolveSignupBackKind({
    accountCreated: form.accountCreated,
    pageIndex: form.pageIndex,
  });
  /** Étape 1 → gate ; sinon étape précédente. Toujours quittable. */
  const onBack =
    backKind === 'none' ? onClose : backKind === 'close' ? onClose : form.goBack;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const pageEntering = reduced
    ? undefined
    : FadeIn.duration(200).easing(Easing.out(Easing.cubic));
  const pageExiting = reduced
    ? undefined
    : FadeOut.duration(140).easing(Easing.in(Easing.cubic));

  const submitSecurity = async () => {
    if (!form.validateAccount()) return;
    const next = form.steps[form.pageIndex + 1];
    if (next === 'launch') {
      await form.createAccount(refreshProfile);
      return;
    }
    form.goNext();
  };

  const nav = { onBack, onClose };

  let content: React.ReactNode;
  switch (form.currentPage) {
    case 'welcome':
      content = <SignupWelcomeStep form={form} {...layout} onClose={onClose} />;
      break;
    case 'space':
      content = <SignupSpaceStep form={form} {...layout} {...nav} />;
      break;
    case 'sport':
      content = <SignupSportStep form={form} {...layout} {...nav} />;
      break;
    case 'location':
      content = <SignupLocationStep form={form} {...layout} {...nav} />;
      break;
    case 'stats':
      content = <SignupStatsStep form={form} {...layout} {...nav} />;
      break;
    case 'coach_pro':
      content = <SignupCoachProStep form={form} {...layout} {...nav} />;
      break;
    case 'club_pro':
      content = <SignupClubProStep form={form} {...layout} {...nav} />;
      break;
    case 'agent_pro':
      content = <SignupAgentProStep form={form} {...layout} {...nav} />;
      break;
    case 'recruiter_pro':
      content = <SignupRecruiterProStep form={form} {...layout} {...nav} />;
      break;
    case 'organizer_pro':
      content = <SignupOrganizerProStep form={form} {...layout} {...nav} />;
      break;
    case 'medical_specialty':
      content = <SignupMedicalSpecialtyStep form={form} {...layout} {...nav} />;
      break;
    case 'medical_practice':
      content = <SignupMedicalPracticeStep form={form} {...layout} {...nav} />;
      break;
    case 'sponsor_pro':
      content = <SignupSponsorProStep form={form} {...layout} {...nav} />;
      break;
    case 'sponsor_company':
      content = <SignupSponsorCompanyStep form={form} {...layout} {...nav} />;
      break;
    case 'sponsor_campaign':
      content = <SignupSponsorCampaignStep form={form} {...layout} {...nav} />;
      break;
    case 'sponsor_targeting':
      content = <SignupSponsorTargetingStep form={form} {...layout} {...nav} />;
      break;
    case 'family':
      content = (
        <SignupParentalStep
          form={form}
          {...layout}
          {...nav}
          onSubmit={() => form.advanceFromCurrentPage()}
        />
      );
      break;
    case 'account':
      content = <SignupAccountStep form={form} {...layout} {...nav} />;
      break;
    case 'security': {
      const isLastBeforeLaunch = form.steps[form.pageIndex + 1] === 'launch';
      content = (
        <SignupSecurityStep
          form={form}
          {...layout}
          {...nav}
          nextLabel={!isLastBeforeLaunch ? t('signup.form.continue') : undefined}
          onSubmit={() => void submitSecurity()}
        />
      );
      break;
    }
    case 'launch':
    default: {
      const verificationPending =
        profile?.verification_status === 'PENDING' ||
        form.role === 'player' ||
        ROLES_REQUIRING_VERIFICATION.includes(form.role) ||
        (profile != null && needsOnboardingDocumentUpload(profile));

      const copy = isSanteSignup
        ? getSanteLaunchCopy(
            {
              emailVerificationPending: form.createdWithEmailPassword,
              verificationPending,
            },
            t
          )
        : isSupporterSignup
          ? getSupporterLaunchCopy(
              { emailVerificationPending: form.createdWithEmailPassword },
              t
            )
          : isAmateurSignup
            ? getAmateurLaunchCopy(
                {
                  emailVerificationPending: form.createdWithEmailPassword,
                  verificationPending,
                },
                form.role,
                t
              )
            : isProPlayerSignup
              ? getProPlayerLaunchCopy(
                  {
                    emailVerificationPending: form.createdWithEmailPassword,
                    verificationPending,
                  },
                  t
                )
              : isProSignup
                ? getProLaunchCopy(
                    {
                      emailVerificationPending: form.createdWithEmailPassword,
                      verificationPending,
                    },
                    t
                  )
                : getAmateurLaunchCopy(
                    {
                      emailVerificationPending: form.createdWithEmailPassword,
                      verificationPending,
                    },
                    form.role,
                    t
                  );

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
    <View style={styles.root}>
      <SignupErrorBoundary onClose={onClose}>
        <Animated.View
          key={form.currentPage}
          entering={pageEntering}
          exiting={pageExiting}
          style={styles.page}
        >
          {content}
        </Animated.View>
      </SignupErrorBoundary>
    </View>
  );
};

const SignupFlowWithTheme: React.FC<SignupFlowProps> = (props) => {
  const form = useSignupForm({
    initialEmail: props.initialEmail,
    initialDisplayName: props.initialDisplayName,
    productLine: props.productLine ?? 'amateur',
    initialRole: props.initialRole,
  });

  return (
    <SignupFlowProvider
      productLine={props.productLine ?? 'amateur'}
      experienceRole={form.role}
      signupGender={form.genderTouched ? form.gender : null}
    >
      <SignupFlowInner {...props} form={form} />
    </SignupFlowProvider>
  );
};

export const SignupFlow: React.FC<SignupFlowProps> = (props) => (
  <SignupErrorBoundary onClose={props.onClose}>
    <SignupFlowWithTheme {...props} />
  </SignupErrorBoundary>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  page: { flex: 1, minHeight: 0 },
});

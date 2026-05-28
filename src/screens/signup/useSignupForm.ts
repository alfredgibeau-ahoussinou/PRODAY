import { useState, useCallback, useMemo } from 'react';
import type { UserRole } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import { DEFAULT_APP_SPACE, type AppSpaceId } from '../../models/AppSpace';
import { DEFAULT_PARENTAL_SETTINGS } from '../../models/ParentalSettings';
import { getFirebaseAuth } from '../../lib/firebase';
import { authService } from '../../services/auth.service';
import { isMinorAge, parseAgeInput } from '../../utils/minor';
import {
  buildSignupSteps,
  getFlowKind,
  getPostCreatePage,
  validateAgeForAppSpace,
  needsParentalStep,
  SIGNUP_PAGE_LABELS,
  getCurrentPhase,
  getPhaseIndex,
  getSignupPhases,
  getFlowStepLabels,
  getFlowIntro,
  type SignupPageId,
  type SignupFlowKind,
} from './signupFlowConfig';

export type { SignupPageId, SignupFlowKind };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useSignupForm(initial?: {
  initialEmail?: string;
  initialDisplayName?: string;
  startAtAccount?: boolean;
}) {
  const [role, setRoleState] = useState<UserRole>('player');
  const [draftRole, setDraftRole] = useState<UserRole>('player');
  const [appSpace, setAppSpaceState] = useState<AppSpaceId>(DEFAULT_APP_SPACE);
  const [spaceTouched, setSpaceTouched] = useState(false);
  const [parentalRequired, setParentalRequired] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<SignupPageId>('role');
  const [accountCreated, setAccountCreated] = useState(false);

  const [displayName, setDisplayName] = useState(initial?.initialDisplayName ?? '');
  const [email, setEmail] = useState(initial?.initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [age, setAge] = useState('');
  const [statMatches, setStatMatches] = useState('');
  const [statGoals, setStatGoals] = useState('');
  const [statAssists, setStatAssists] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdDisplayName, setCreatedDisplayName] = useState('');
  const [createdWithEmailPassword, setCreatedWithEmailPassword] = useState(false);

  const parsedAge = useMemo(() => parseAgeInput(age), [age]);
  const isMinor = useMemo(
    () => (parsedAge != null ? isMinorAge(parsedAge) : false),
    [parsedAge]
  );
  const flowKind = useMemo(() => getFlowKind(role), [role]);
  const draftFlowKind = useMemo(() => getFlowKind(draftRole), [draftRole]);

  const steps = useMemo(
    () =>
      buildSignupSteps(flowKind, {
        role,
        parentalRequired,
      }),
    [flowKind, role, parentalRequired]
  );

  const pageIndex = useMemo(() => {
    const idx = steps.indexOf(currentPageId);
    return idx >= 0 ? idx : 0;
  }, [steps, currentPageId]);

  const currentPage = steps[pageIndex] ?? 'role';
  const stepLabel = SIGNUP_PAGE_LABELS[currentPage] ?? 'Inscription';
  const phases = useMemo(() => getSignupPhases(flowKind), [flowKind]);
  const phaseIndex = getPhaseIndex(flowKind, currentPage);
  const currentPhase = getCurrentPhase(currentPage);
  const needsDocument = ROLES_REQUIRING_VERIFICATION.includes(role);
  const isOAuthCompletion = Boolean(getFirebaseAuth()?.currentUser);

  const flowStepLabels = useMemo(
    () => getFlowStepLabels(draftFlowKind, draftRole, false),
    [draftFlowKind, draftRole]
  );
  const flowIntro = useMemo(() => getFlowIntro(draftFlowKind, draftRole), [draftFlowKind, draftRole]);

  const ageSpaceMismatch = useMemo(() => {
    if (parsedAge == null || role !== 'player') return undefined;
    return validateAgeForAppSpace(parsedAge, appSpace);
  }, [parsedAge, appSpace, role]);

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const goToPage = useCallback(
    (pageId: SignupPageId) => {
      if (!steps.includes(pageId)) return;
      setCurrentPageId(pageId);
      clearErrors();
    },
    [steps, clearErrors]
  );

  const goNext = useCallback(() => {
    const idx = steps.indexOf(currentPageId);
    if (idx >= 0 && idx < steps.length - 1) {
      setCurrentPageId(steps[idx + 1]);
      clearErrors();
    }
  }, [steps, currentPageId, clearErrors]);

  const goBack = useCallback(() => {
    if (accountCreated) return;
    const idx = steps.indexOf(currentPageId);
    if (idx > 0) {
      setCurrentPageId(steps[idx - 1]);
      clearErrors();
    }
  }, [steps, currentPageId, accountCreated, clearErrors]);

  const resetPlayerFields = useCallback(() => {
    setAppSpaceState(DEFAULT_APP_SPACE);
    setSpaceTouched(false);
    setParentalRequired(false);
    setPosition('');
    setCategory('');
    setLevel('');
    setAge('');
    setStatMatches('');
    setStatGoals('');
    setStatAssists('');
    setGuardianName('');
    setGuardianEmail('');
    setGuardianConsent(false);
  }, []);

  const setDraftRoleOnly = useCallback((nextRole: UserRole) => {
    setDraftRole(nextRole);
    clearErrors();
  }, [clearErrors]);

  const confirmRoleAndContinue = useCallback(() => {
    const nextRole = draftRole;
    setRoleState(nextRole);
    setAccountCreated(false);
    if (nextRole !== 'player') {
      resetPlayerFields();
    } else {
      setParentalRequired(false);
    }
    const nextSteps = buildSignupSteps(getFlowKind(nextRole), {
      role: nextRole,
      parentalRequired: false,
    });
    setCurrentPageId(nextSteps[1] ?? 'account');
    clearErrors();
  }, [draftRole, resetPlayerFields, clearErrors]);

  const setAppSpace = useCallback((space: AppSpaceId) => {
    setAppSpaceState(space);
    setSpaceTouched(true);
    setCategory('');
    clearErrors();
  }, [clearErrors]);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email requis';
    if (!EMAIL_RE.test(value.trim())) return 'Format email invalide';
    return undefined;
  };

  const validateProgram = () => {
    if (!spaceTouched) {
      setFieldErrors({ appSpace: 'Sélectionnez un espace ProDay pour continuer' });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const validateAccount = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Nom affiché requis';
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    if (!isOAuthCompletion) {
      if (password.length < 6) errs.password = '6 caractères minimum';
      if (password !== confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (role === 'sponsor' && !city.trim()) {
      errs.city = 'Ville ou région recommandée pour les partenaires';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStaff = () => {
    const errs: Record<string, string> = {};
    if (!city.trim()) errs.city = 'Ville requise';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePlayer = () => {
    const errs: Record<string, string> = {};
    if (!position.trim()) errs.position = 'Choisissez un poste';
    if (!category.trim()) errs.category = 'Choisissez une catégorie';
    if (!level.trim()) errs.level = 'Choisissez un niveau';
    if (!city.trim()) errs.city = 'Ville requise';
    if (parsedAge == null) {
      errs.age = 'Âge valide requis (5–99 ans)';
    } else {
      const ageSpaceErr = validateAgeForAppSpace(parsedAge, appSpace);
      if (ageSpaceErr) errs.age = ageSpaceErr;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitPlayerProfile = useCallback(() => {
    if (!validatePlayer()) return false;
    const needsParental = needsParentalStep(isMinor, appSpace);
    setParentalRequired(needsParental);
    const nextSteps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: needsParental,
    });
    const playerIdx = nextSteps.indexOf('player');
    const nextPage = nextSteps[playerIdx + 1] ?? 'account';
    setCurrentPageId(nextPage);
    clearErrors();
    return true;
  }, [validatePlayer, isMinor, appSpace, clearErrors]);

  const validateParental = () => {
    const errs: Record<string, string> = {};
    if (!guardianName.trim()) errs.guardianName = 'Nom du responsable requis';
    const emailErr = validateEmail(guardianEmail);
    if (emailErr) errs.guardianEmail = emailErr;
    if (!guardianConsent) errs.guardianConsent = 'Consentement requis';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const parseStat = (value: string) => {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const buildPlayerPayload = () => ({
    position: position.trim(),
    category: category.trim(),
    level: level.trim(),
    age: parsedAge ?? undefined,
    season_stats: {
      matches: parseStat(statMatches),
      goals: parseStat(statGoals),
      assists: parseStat(statAssists),
    },
  });

  const buildParentalSettings = () => {
    if (!parentalRequired) return undefined;
    return {
      ...DEFAULT_PARENTAL_SETTINGS,
      is_minor: true,
      guardian_name: guardianName.trim(),
      guardian_email: guardianEmail.trim(),
      guardian_consent: true,
      supervision_enabled: true,
      contacts_filter_enabled: true,
      screen_time_enabled: true,
    };
  };

  const createAccount = useCallback(
    async (refreshProfile: () => Promise<void>) => {
      setLoading(true);
      clearErrors();
      try {
        const common = {
          email,
          display_name: displayName,
          role,
          city: city.trim() || undefined,
          department: department.trim() || undefined,
          profile: role === 'player' ? buildPlayerPayload() : undefined,
          parental_settings: buildParentalSettings(),
          ...(role === 'player' ? { app_space: appSpace } : {}),
        };

        const user = isOAuthCompletion
          ? await authService.completeProfile(common)
          : await authService.signUp({ ...common, password });

        await refreshProfile();
        setCreatedDisplayName(user.display_name);
        setCreatedWithEmailPassword(!isOAuthCompletion);
        setAccountCreated(true);
        goToPage(getPostCreatePage(role));
        return true;
      } catch (e) {
        setError(authService.getAuthErrorMessage(e));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      role,
      email,
      password,
      displayName,
      city,
      department,
      position,
      category,
      level,
      parsedAge,
      statMatches,
      statGoals,
      statAssists,
      parentalRequired,
      appSpace,
      guardianName,
      guardianEmail,
      isOAuthCompletion,
      clearErrors,
      goToPage,
    ]
  );

  return {
    isOAuthCompletion,
    accountCreated,
    appSpace,
    setAppSpace,
    spaceTouched,
    role,
    draftRole,
    setDraftRole: setDraftRoleOnly,
    confirmRoleAndContinue,
    flowKind,
    draftFlowKind,
    flowStepLabels,
    flowIntro,
    displayName,
    setDisplayName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    city,
    setCity,
    department,
    setDepartment,
    position,
    setPosition,
    category,
    setCategory,
    level,
    setLevel,
    age,
    setAge,
    statMatches,
    setStatMatches,
    statGoals,
    setStatGoals,
    statAssists,
    setStatAssists,
    guardianName,
    setGuardianName,
    guardianEmail,
    setGuardianEmail,
    guardianConsent,
    setGuardianConsent,
    isMinor,
    parentalRequired,
    ageSpaceMismatch,
    pageIndex,
    steps,
    currentPage,
    stepLabel,
    phases,
    phaseIndex,
    currentPhase,
    needsDocument,
    loading,
    error,
    fieldErrors,
    createdDisplayName,
    createdWithEmailPassword,
    clearErrors,
    goNext,
    goBack,
    goToPage,
    validateAccount,
    validateStaff,
    validatePlayer,
    validateParental,
    validateProgram,
    submitPlayerProfile,
    createAccount,
    setError,
    setLoading,
  };
}

export type SignupForm = ReturnType<typeof useSignupForm>;

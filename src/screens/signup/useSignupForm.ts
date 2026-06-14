import { useState, useCallback, useMemo } from 'react';
import type { UserRole } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import { DEFAULT_APP_SPACE, type AppSpaceId } from '../../models/AppSpace';
import { DEFAULT_PARENTAL_SETTINGS } from '../../models/ParentalSettings';
import { defaultCategoriesForAppSpace } from '../../constants/appSpaces';
import { getFirebaseAuth } from '../../lib/firebase';
import { authService } from '../../services/auth.service';
import { isMinorAge, parseAgeInput } from '../../utils/minor';
import {
  validateAccountStepFields,
  validateParentalStepFields,
  validatePlayerStepFields,
  validateSignupIntegrity,
  validateStaffStepFields,
  validateMedicalSpecialtyStep,
  validateMedicalPracticeStep,
  validateRoleProFields,
  validateSponsorProFields,
} from '../../utils/signupValidation';
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
  MEDICAL_POLE_SPECIALTIES,
  type SignupPageId,
  type SignupFlowKind,
} from './signupFlowConfig';
import { WOMAN_SIGNUP_PHASES, suggestFeminineAppSpaceFromAge } from './signupWomanConfig';
import { MAN_SIGNUP_PHASES } from './signupManConfig';
import { PRO_SIGNUP_PHASES } from './signupProConfig';
import { SANTE_SIGNUP_PHASES } from './signupSanteConfig';
import { isRoleAllowedForProductLine } from '../../content/universeRoles';
import type { ProductLineId } from '../../models/ProductLine';
import { useProductLine } from '../../context/ProductLineContext';

export type { SignupPageId, SignupFlowKind };

export function useSignupForm(initial?: {
  initialEmail?: string;
  initialDisplayName?: string;
  startAtAccount?: boolean;
  productLine?: ProductLineId;
}) {
  const { setProductLine } = useProductLine();
  const productLine: ProductLineId = initial?.productLine ?? 'homme';
  const isWomanProduct = productLine === 'woman';
  const isProProduct = productLine === 'pro';
  const isSanteProduct = productLine === 'sante';
  const isStaffProduct = isProProduct || isSanteProduct;

  const [role, setRoleState] = useState<UserRole>(
    isSanteProduct ? 'physio' : isProProduct ? 'coach' : 'player'
  );
  const [draftRole, setDraftRole] = useState<UserRole>(
    isSanteProduct ? 'physio' : isProProduct ? 'coach' : 'player'
  );
  const [appSpace, setAppSpaceState] = useState<AppSpaceId>(
    isWomanProduct ? 'girls' : DEFAULT_APP_SPACE
  );
  const [spaceTouched, setSpaceTouched] = useState(false);
  const [parentalRequired, setParentalRequired] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<SignupPageId>('welcome');
  const [accountCreated, setAccountCreated] = useState(false);

  const [displayName, setDisplayName] = useState(initial?.initialDisplayName ?? '');
  const [email, setEmail] = useState(initial?.initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [medicalSpecialty, setMedicalSpecialty] = useState<(typeof MEDICAL_POLE_SPECIALTIES)[number]>(
    MEDICAL_POLE_SPECIALTIES[0]
  );
  const [medicalPracticeFocus, setMedicalPracticeFocus] = useState('');
  const [structureName, setStructureName] = useState('');
  const [professionalHeadline, setProfessionalHeadline] = useState('');
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

  const currentPage = steps[pageIndex] ?? 'welcome';
  const stepLabel = SIGNUP_PAGE_LABELS[currentPage] ?? 'Inscription';
  const phases = useMemo(() => {
    if (isWomanProduct) return WOMAN_SIGNUP_PHASES;
    if (isSanteProduct) return SANTE_SIGNUP_PHASES;
    if (isProProduct) return PRO_SIGNUP_PHASES;
    return MAN_SIGNUP_PHASES;
  }, [isWomanProduct, isSanteProduct, isProProduct]);
  const phaseIndex = getPhaseIndex(flowKind, currentPage);
  const currentPhase = getCurrentPhase(currentPage);
  const needsDocument = ROLES_REQUIRING_VERIFICATION.includes(role);
  const isOAuthCompletion = Boolean(getFirebaseAuth()?.currentUser);

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
    const nextRole =
      isWomanProduct || (!isStaffProduct && productLine === 'homme') ? 'player' : draftRole;
    if (!isRoleAllowedForProductLine(nextRole, productLine)) {
      setError('Ce profil n’est pas disponible sur cet univers ProDay.');
      return;
    }
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
  }, [draftRole, productLine, resetPlayerFields, clearErrors]);

  const setAppSpace = useCallback((space: AppSpaceId) => {
    setAppSpaceState(space);
    setSpaceTouched(true);
    setCategory('');
    clearErrors();
  }, [clearErrors]);

  const allowedCategories = useMemo(
    () => [...defaultCategoriesForAppSpace(appSpace, productLine)],
    [appSpace, productLine]
  );

  const buildIntegrityInput = useCallback(
    () => ({
      role,
      productLine,
      flowKind,
      spaceTouched,
      parentalRequired,
      staff: {
        role,
        city,
        department,
        medicalSpecialty,
        medicalPracticeFocus,
        structureName,
        professionalHeadline,
      },
      player:
        role === 'player'
          ? {
              position,
              category,
              level,
              city,
              department,
              parsedAge,
              appSpace,
              allowedCategories,
              statMatches,
              statGoals,
              statAssists,
            }
          : undefined,
      account: {
        displayName,
        email,
        password,
        confirmPassword,
        isOAuth: isOAuthCompletion,
        role,
        city,
        acceptedTerms,
        guardianEmail: parentalRequired ? guardianEmail : undefined,
      },
      parental: parentalRequired
        ? {
            guardianName,
            guardianEmail,
            guardianConsent,
            accountEmail: email,
          }
        : undefined,
    }),
    [
      role,
      productLine,
      flowKind,
      spaceTouched,
      parentalRequired,
      city,
      department,
      medicalSpecialty,
      medicalPracticeFocus,
      structureName,
      professionalHeadline,
      position,
      category,
      level,
      parsedAge,
      appSpace,
      allowedCategories,
      statMatches,
      statGoals,
      statAssists,
      displayName,
      email,
      password,
      confirmPassword,
      isOAuthCompletion,
      acceptedTerms,
      guardianName,
      guardianEmail,
      guardianConsent,
    ]
  );

  const validateProgram = () => {
    if (!spaceTouched) {
      setFieldErrors({ appSpace: 'Sélectionnez un espace ProDay pour continuer' });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const validateAccount = () => {
    const errs = validateAccountStepFields({
      displayName,
      email,
      password,
      confirmPassword,
      isOAuth: isOAuthCompletion,
      role,
      city,
      acceptedTerms,
      guardianEmail: parentalRequired ? guardianEmail : undefined,
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStaff = () => {
    const errs = validateRoleProFields({
      role,
      city,
      department,
      medicalSpecialty,
      medicalPracticeFocus,
      structureName,
      professionalHeadline,
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateMedicalSpecialtyOnly = () => {
    const errs = validateMedicalSpecialtyStep(medicalSpecialty);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateMedicalPracticeOnly = () => {
    const errs = validateMedicalPracticeStep({ medicalPracticeFocus, city, department });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSponsorPro = () => {
    const errs = validateSponsorProFields(structureName, city);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePlayer = () => {
    const errs = validatePlayerStepFields({
      position,
      category,
      level,
      city,
      department,
      parsedAge,
      appSpace,
      allowedCategories,
      statMatches,
      statGoals,
      statAssists,
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const pickPlayerErrors = (
    all: Record<string, string>,
    keys: string[]
  ): Record<string, string> =>
    Object.fromEntries(Object.entries(all).filter(([k]) => keys.includes(k)));

  const validateSport = () => {
    if (!validateProgram()) return false;
    const all = validatePlayerStepFields({
      position,
      category,
      level,
      city: '',
      department,
      parsedAge,
      appSpace,
      allowedCategories,
      statMatches,
      statGoals,
      statAssists,
    });
    const errs = pickPlayerErrors(all, ['position', 'category', 'level', 'age']);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLocation = () => {
    const all = validatePlayerStepFields({
      position,
      category,
      level,
      city,
      department,
      parsedAge,
      appSpace,
      allowedCategories,
      statMatches,
      statGoals,
      statAssists,
    });
    const errs = pickPlayerErrors(all, ['city', 'department']);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStats = () => {
    const all = validatePlayerStepFields({
      position,
      category,
      level,
      city,
      department,
      parsedAge,
      appSpace,
      allowedCategories,
      statMatches,
      statGoals,
      statAssists,
    });
    const errs = pickPlayerErrors(all, ['statMatches', 'statGoals', 'statAssists']);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAccountIdentity = () => {
    const all = validateAccountStepFields({
      displayName,
      email,
      password,
      confirmPassword,
      isOAuth: isOAuthCompletion,
      role,
      city,
      acceptedTerms,
      guardianEmail: parentalRequired ? guardianEmail : undefined,
    });
    const keys =
      role === 'sponsor'
        ? ['displayName', 'email', 'city']
        : ['displayName', 'email'];
    const errs = pickPlayerErrors(all, keys);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateParental = () => {
    const errs = validateParentalStepFields({
      guardianName,
      guardianEmail,
      guardianConsent,
      accountEmail: email,
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const advanceFromCurrentPage = useCallback(() => {
    switch (currentPage) {
      case 'space':
        if (!validateProgram()) return false;
        break;
      case 'sport':
        if (!validateSport()) return false;
        setParentalRequired(needsParentalStep(isMinor, appSpace));
        break;
      case 'location':
        if (!validateLocation()) return false;
        break;
      case 'stats':
        if (!validateStats()) return false;
        break;
      case 'staff':
      case 'coach_pro':
      case 'club_pro':
      case 'agent_pro':
      case 'recruiter_pro':
      case 'organizer_pro':
        if (!validateStaff()) return false;
        break;
      case 'medical_specialty':
        if (!validateMedicalSpecialtyOnly()) return false;
        setMedicalPracticeFocus('');
        break;
      case 'medical_practice':
        if (!validateMedicalPracticeOnly()) return false;
        break;
      case 'sponsor_pro':
        if (!validateSponsorPro()) return false;
        break;
      case 'family':
        if (!validateParental()) return false;
        break;
      case 'account':
        if (!validateAccountIdentity()) return false;
        break;
      default:
        break;
    }
    goNext();
    return true;
  }, [
    currentPage,
    validateProgram,
    validateSport,
    validateLocation,
    validateStats,
    validateStaff,
    validateMedicalSpecialtyOnly,
    validateMedicalPracticeOnly,
    validateSponsorPro,
    validateParental,
    validateAccountIdentity,
    isMinor,
    appSpace,
    goNext,
  ]);

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
      guardian_email: guardianEmail.trim().toLowerCase(),
      guardian_consent: true,
      supervision_enabled: true,
      contacts_filter_enabled: true,
      screen_time_enabled: true,
    };
  };

  const createAccount = useCallback(
    async (refreshProfile: () => Promise<void>) => {
      const integrityErrors = validateSignupIntegrity(buildIntegrityInput());
      if (Object.keys(integrityErrors).length > 0) {
        setFieldErrors(integrityErrors);
        setError('Corrigez les champs signalés avant de créer le compte.');
        return false;
      }

      setLoading(true);
      clearErrors();
      try {
        const common = {
          email,
          display_name: displayName,
          role,
          city: city.trim() || undefined,
          department: department.trim() || undefined,
          profile:
            role === 'player'
              ? buildPlayerPayload()
              : role === 'physio'
                ? {
                    medical_specialty: medicalSpecialty,
                    job_title: medicalSpecialty,
                    specialties: [medicalSpecialty, medicalPracticeFocus].filter(Boolean),
                    bio: medicalPracticeFocus
                      ? `${medicalSpecialty} — ${medicalPracticeFocus}`
                      : medicalSpecialty,
                  }
                : role === 'coach'
                  ? {
                      diploma: professionalHeadline.trim() || undefined,
                      job_title: professionalHeadline.trim() || 'Coach',
                    }
                  : role === 'agent'
                    ? {
                        license_number: professionalHeadline.trim() || undefined,
                        job_title: 'Agent sportif',
                      }
                    : role === 'recruiter'
                      ? {
                          job_title: professionalHeadline.trim() || 'Recruteur sportif',
                          bio: professionalHeadline.trim() || undefined,
                        }
                      : role === 'club' || role === 'organizer'
                      ? {
                          job_title: structureName.trim() || undefined,
                          bio: structureName.trim() || undefined,
                        }
                      : role === 'sponsor'
                        ? {
                            job_title: structureName.trim() || undefined,
                            bio: structureName.trim() || undefined,
                          }
                        : undefined,
          parental_settings: buildParentalSettings(),
          product_line: productLine,
          ...(role === 'player' ? { app_space: appSpace } : {}),
        };

        const user = isOAuthCompletion
          ? await authService.completeProfile(common)
          : await authService.signUp({ ...common, password });

        await refreshProfile();
        if (isWomanProduct) await setProductLine('woman');
        else if (isSanteProduct) await setProductLine('sante');
        else if (isProProduct) await setProductLine('pro');
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
      medicalSpecialty,
      medicalPracticeFocus,
      structureName,
      professionalHeadline,
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
      guardianConsent,
      acceptedTerms,
      isOAuthCompletion,
      buildIntegrityInput,
      clearErrors,
      goToPage,
      isWomanProduct,
      isProProduct,
      isSanteProduct,
      setProductLine,
    ]
  );

  return {
    productLine,
    isWomanProduct,
    isProProduct,
    isSanteProduct,
    isStaffProduct,
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
    medicalSpecialty,
    setMedicalSpecialty,
    medicalPracticeFocus,
    setMedicalPracticeFocus,
    structureName,
    setStructureName,
    professionalHeadline,
    setProfessionalHeadline,
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
    acceptedTerms,
    setAcceptedTerms,
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
    validateSport,
    validateLocation,
    validateStats,
    validateAccountIdentity,
    advanceFromCurrentPage,
    createAccount,
    setError,
    setLoading,
  };
}

export type SignupForm = ReturnType<typeof useSignupForm>;

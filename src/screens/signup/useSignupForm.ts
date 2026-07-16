import { useState, useCallback, useMemo } from 'react';
import type { Gender, UserRole } from '../../models/User';
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
  validateSponsorCompanyStep,
  validateSponsorCampaignStep,
  validateSponsorTargetingStep,
} from '../../utils/signupValidation';
import { normalizeCalComBookingInput } from '../../utils/calComBooking';
import {
  buildSignupSteps,
  getFlowKind,
  getPostCreatePage,
  validateAgeForAppSpace,
  needsParentalStep,
  SIGNUP_PAGE_LABELS,
  getSignupPageLabel,
  getCurrentPhase,
  getPhaseIndex,
  getSignupPhases,
  type SignupPageId,
  type SignupFlowKind,
} from './signupFlowConfig';
import type { MedicalSpecialtyId } from './signupRoleExperience';
import {
  medicalIdToCanonicalLabel,
  resolveMedicalSpecialtyId,
} from './signupMedicalI18n';
import { suggestFeminineAppSpaceFromAge } from '../../utils/signupAppSpace';
import { getAmateurSignupPhases } from './signupAmateurConfig';
import { getProSignupPhases } from './signupProConfig';
import { getProPlayerSignupPhases } from './signupProPlayerConfig';
import { getSupporterSignupPhases } from './signupSupporterConfig';
import { getSanteSignupPhases } from './signupSanteConfig';
import { isRoleAllowedForProductLine, resolveSignupProductLine } from '../../content/universeRoles';
import { isProFamilyLine } from '../../utils/productLineResolution';
import type { ProductLineId } from '../../models/ProductLine';
import { useProductLine } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { getRoleSignupPhases } from './signupRoleExperience';
import { submitSponsorSignup } from '../../services/sponsorSignup.service';

export type { SignupPageId, SignupFlowKind };

export function useSignupForm(initial?: {
  initialEmail?: string;
  initialDisplayName?: string;
  startAtAccount?: boolean;
  productLine?: ProductLineId;
  initialRole?: UserRole;
}) {
  const { setProductLine, proSignupPresetRole } = useProductLine();
  const { t } = useTranslation();
  const productLine: ProductLineId = initial?.productLine ?? 'amateur';
  const isProPlayerSignup = productLine === 'pro_player';
  const isProProduct = isProFamilyLine(productLine);
  const isAmateurProduct = productLine === 'amateur';
  const isSupporterProduct = productLine === 'supporter';
  const isSanteProduct = productLine === 'sante';

  const defaultRole: UserRole =
    initial?.initialRole ??
    proSignupPresetRole ??
    (isSanteProduct ? 'physio' : isSupporterProduct ? 'supporter' : isProPlayerSignup ? 'player' : isProProduct ? 'coach' : 'player');

  const [role, setRoleState] = useState<UserRole>(defaultRole);
  const [draftRole, setDraftRole] = useState<UserRole>(defaultRole);
  const isSponsorSignup = role === 'sponsor' || draftRole === 'sponsor';
  const isStaffProduct =
    isProProduct || isSanteProduct || (isAmateurProduct && draftRole === 'coach');
  const [appSpace, setAppSpaceState] = useState<AppSpaceId>(DEFAULT_APP_SPACE);
  const [spaceTouched, setSpaceTouched] = useState(false);
  const [gender, setGenderState] = useState<Gender>('men');
  const [genderTouched, setGenderTouched] = useState(false);
  const [parentalRequired, setParentalRequired] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<SignupPageId>('welcome');
  const [accountCreated, setAccountCreated] = useState(false);

  const [displayName, setDisplayName] = useState(initial?.initialDisplayName ?? '');
  const [email, setEmail] = useState(initial?.initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [medicalSpecialty, setMedicalSpecialty] = useState<MedicalSpecialtyId>('kine');
  const [medicalPracticeFocus, setMedicalPracticeFocus] = useState('');
  const [calComUsername, setCalComUsername] = useState('');
  const [structureName, setStructureName] = useState('');
  const [sponsorSector, setSponsorSector] = useState('');
  const [sponsorBudget, setSponsorBudget] = useState('');
  const [sponsorGoals, setSponsorGoals] = useState<string[]>([]);
  const [sponsorAudience, setSponsorAudience] = useState<string[]>([]);
  const [sponsorRegions, setSponsorRegions] = useState<string[]>([]);
  const [sponsorSports, setSponsorSports] = useState<string[]>([]);
  const [sponsorPhone, setSponsorPhone] = useState('');
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
  const stepLabel = getSignupPageLabel(currentPage, t);
  const phases = useMemo(() => {
    if (isSponsorSignup) return getRoleSignupPhases('sponsor', t);
    if (isSanteProduct) return getSanteSignupPhases(t);
    if (isSupporterProduct) return getSupporterSignupPhases(t);
    if (isAmateurProduct) return getAmateurSignupPhases(t);
    if (isProPlayerSignup) return getProPlayerSignupPhases(t);
    if (isProProduct) return getProSignupPhases(t);
    return getAmateurSignupPhases(t);
  }, [isSponsorSignup, isSanteProduct, isSupporterProduct, isAmateurProduct, isProPlayerSignup, isProProduct, t]);
  const phaseIndex = getPhaseIndex(flowKind, currentPage);
  const currentPhase = getCurrentPhase(currentPage);
  const needsDocument = ROLES_REQUIRING_VERIFICATION.includes(role);
  const isOAuthCompletion = Boolean(getFirebaseAuth()?.currentUser);

  const ageSpaceMismatch = useMemo(() => {
    if (parsedAge == null || role !== 'player') return undefined;
    return validateAgeForAppSpace(parsedAge, appSpace, t);
  }, [parsedAge, appSpace, role, t]);

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
    setGenderState('men');
    setGenderTouched(false);
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
      isProPlayerSignup || (isAmateurProduct && !isStaffProduct) ? 'player' : draftRole;
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

  /** Sélection du genre — réinitialise l'espace foot pour proposer le bon groupe. */
  const setGender = useCallback((nextGender: Gender) => {
    setGenderState(nextGender);
    setGenderTouched(true);
    setAppSpaceState((current) => {
      if (nextGender === 'minor') {
        if (isYouthSpace(current)) return current;
        return 'boys';
      }
      if (nextGender === 'women') {
        return current === 'men' || current === 'boys' ? 'women' : current;
      }
      return current === 'women' || current === 'girls' ? 'men' : current;
    });
    setSpaceTouched(nextGender === 'minor');
    setCategory('');
    clearErrors();
  }, [clearErrors]);

  function isYouthSpace(space: AppSpaceId): boolean {
    return space === 'boys' || space === 'girls' || space === 'under_u13';
  }

  const allowedCategories = useMemo(
    () => [...defaultCategoriesForAppSpace(appSpace, productLine, gender)],
    [appSpace, productLine, gender]
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
        calComUsername,
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
      calComUsername,
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
    const errs: Record<string, string> = {};
    const needsGender =
      isAmateurProduct || (isProProduct && role === 'player');
    if (needsGender && !genderTouched) {
      errs.gender = t('signup.form.selectGender');
    }
    if (!spaceTouched) {
      errs.appSpace = t('signup.form.selectSpace');
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
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
    const errs = validateMedicalPracticeStep({ medicalPracticeFocus, city, department, calComUsername });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSponsorPro = () => {
    const errs = validateSponsorProFields(structureName, city);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSponsorCompany = () => {
    const errs = validateSponsorCompanyStep(structureName, sponsorSector, displayName);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSponsorCampaign = () => {
    const errs = validateSponsorCampaignStep(sponsorBudget, sponsorGoals, sponsorAudience);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSponsorTargeting = () => {
    const errs = validateSponsorTargetingStep(sponsorRegions, sponsorSports, city);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleSponsorListValue = useCallback(
    (key: 'goals' | 'audience' | 'regions' | 'sports', value: string) => {
      const setters = {
        goals: setSponsorGoals,
        audience: setSponsorAudience,
        regions: setSponsorRegions,
        sports: setSponsorSports,
      } as const;
      const getters = {
        goals: sponsorGoals,
        audience: sponsorAudience,
        regions: sponsorRegions,
        sports: sponsorSports,
      } as const;
      const current = getters[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setters[key](next);
    },
    [sponsorGoals, sponsorAudience, sponsorRegions, sponsorSports],
  );

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
      case 'sponsor_company':
        if (!validateSponsorCompany()) return false;
        break;
      case 'sponsor_campaign':
        if (!validateSponsorCampaign()) return false;
        break;
      case 'sponsor_targeting':
        if (!validateSponsorTargeting()) return false;
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
    validateSponsorCompany,
    validateSponsorCampaign,
    validateSponsorTargeting,
    validateParental,
    validateAccountIdentity,
    isMinor,
    appSpace,
    goNext,
  ]);

  const buildPlayerPayload = () => ({
    position: position.trim(),
    category: category.trim(),
    level: level.trim(),
    age: parsedAge ?? undefined,
    gender:
      isAmateurProduct || isProPlayerSignup || (isProProduct && role === 'player')
        ? gender
        : undefined,
    // season_stats : interdit à la création (Firestore rules) — alimenté par le staff après match.
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
        setError(t('signup.form.fixFields'));
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
                ? (() => {
                    const label = medicalIdToCanonicalLabel(medicalSpecialty);
                    const cal = normalizeCalComBookingInput(calComUsername);
                    return {
                      medical_specialty: label,
                      job_title: label,
                      specialties: [label, medicalPracticeFocus].filter(Boolean),
                      bio: medicalPracticeFocus ? `${label} — ${medicalPracticeFocus}` : label,
                      booking_enabled: true,
                      cal_com_username: cal?.username,
                      booking_url: cal?.bookingUrl,
                    };
                  })()
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
                        : role === 'supporter'
                          ? {
                              job_title: 'Supporter',
                              bio: displayName.trim() || undefined,
                            }
                          : undefined,
          parental_settings: buildParentalSettings(),
          product_line: resolveSignupProductLine(productLine, role),
          ...(role === 'player' ? { app_space: appSpace } : {}),
        };

        const user = isOAuthCompletion
          ? await authService.completeProfile(common)
          : await authService.signUp({ ...common, password });

        await refreshProfile();
        if (role === 'sponsor') {
          void submitSponsorSignup({
            companyName: structureName.trim(),
            sector: sponsorSector,
            contactName: displayName.trim(),
            budget: sponsorBudget,
            goals: sponsorGoals,
            audience: sponsorAudience,
            regions: sponsorRegions,
            sports: sponsorSports,
            email: email.trim().toLowerCase(),
            phone: sponsorPhone.trim() || undefined,
            message: professionalHeadline.trim() || undefined,
          });
        }
        if (isSanteProduct) await setProductLine('sante');
        else if (isAmateurProduct) await setProductLine('amateur');
        else if (isSupporterProduct) await setProductLine('supporter');
        else if (isProProduct) await setProductLine(resolveSignupProductLine(productLine, role));
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
      calComUsername,
      structureName,
      sponsorSector,
      sponsorBudget,
      sponsorGoals,
      sponsorAudience,
      sponsorRegions,
      sponsorSports,
      sponsorPhone,
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
      isProPlayerSignup,
      isProProduct,
      isAmateurProduct,
      isSupporterProduct,
      isSanteProduct,
      setProductLine,
    ]
  );

  return {
    productLine,
    isProPlayerSignup,
    isProProduct,
    isAmateurProduct,
    isSupporterProduct,
    isSanteProduct,
    isSponsorSignup,
    isStaffProduct,
    isOAuthCompletion,
    accountCreated,
    appSpace,
    setAppSpace,
    spaceTouched,
    gender,
    setGender,
    genderTouched,
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
    calComUsername,
    setCalComUsername,
    structureName,
    setStructureName,
    sponsorSector,
    setSponsorSector,
    sponsorBudget,
    setSponsorBudget,
    sponsorGoals,
    sponsorAudience,
    sponsorRegions,
    sponsorSports,
    toggleSponsorListValue,
    sponsorPhone,
    setSponsorPhone,
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

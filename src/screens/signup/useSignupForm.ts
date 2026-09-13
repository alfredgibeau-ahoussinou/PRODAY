import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Gender, UserRole } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import { DEFAULT_APP_SPACE, type AppSpaceId } from '../../models/AppSpace';
import { DEFAULT_PARENTAL_SETTINGS } from '../../models/ParentalSettings';
import { defaultCategoriesForAppSpace } from '../../constants/appSpaces';
import { getFirebaseAuth } from '../../lib/firebase';
import { authService } from '../../services/auth.service';
import { isMinorAge, parseAgeInput } from '../../utils/minor';
import {
  ageYearsAsOf,
  isValidPlayerBirthDate,
  toBirthDateIso,
} from '../../utils/joueurBirthAge';
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
  validateCity,
  validateFrenchDepartment,
} from '../../utils/signupValidation';
import { normalizeCalComBookingInput } from '../../utils/calComBooking';
import {
  buildSignupSteps,
  getFlowKind,
  getPostCreatePage,
  validateAgeForAppSpace,
  needsParentalStep,
  suggestAppSpaceFromAge,
  SIGNUP_PAGE_LABELS,
  getSignupPageLabel,
  getCurrentPhase,
  getPhaseIndex,
  getSignupPhases,
  resolveSignupStartPage,
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
import { resolveSignupOAuthState } from '../../utils/authOAuthLink';
import { referralService } from '../../services/referral.service';
import { parentPortalService } from '../../services/parentPortal.service';
import type { OfficialFffClub, PreRegisteredMember } from '../../services/fffOfficialRegistry.service';
import { membershipsService } from '../../services/memberships.service';
import { clubsService } from '../../services/clubs.service';
import { callFunction } from '../../lib/firebaseFunctions';
import { publicClubDirectoryService } from '../../services/publicClubDirectory.service';

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
    (proSignupPresetRole && isRoleAllowedForProductLine(proSignupPresetRole, productLine)
      ? proSignupPresetRole
      : null) ??
    (isSanteProduct
      ? 'physio'
      : isSupporterProduct
        ? 'supporter'
        : productLine === 'sponsor'
          ? 'sponsor'
          : isProPlayerSignup
            ? 'player'
            : isProProduct
              ? 'coach'
              : 'player');

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
  const defaultStartPage: SignupPageId = resolveSignupStartPage({
    role: defaultRole,
    parentalRequired: false,
  });
  const [currentPageId, setCurrentPageId] = useState<SignupPageId>(
    initial?.startAtAccount === false ? 'welcome' : defaultStartPage,
  );
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
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [statMatches, setStatMatches] = useState('');
  const [statGoals, setStatGoals] = useState('');
  const [statAssists, setStatAssists] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdDisplayName, setCreatedDisplayName] = useState('');
  const [createdWithEmailPassword, setCreatedWithEmailPassword] = useState(false);

  // Affiliation Club FFF & Vérification identité
  const [hasClub, setHasClub] = useState(true);
  const [selectedFffClub, setSelectedFffClub] = useState<OfficialFffClub | null>(null);
  const [selectedFffCategory, setSelectedFffCategory] = useState('');
  const [selectedRosterMember, setSelectedRosterMember] = useState<PreRegisteredMember | null>(null);
  const [isCustomProfile, setIsCustomProfile] = useState(true);
  const [identityDoc, setIdentityDoc] = useState<{ uri: string; name: string; type: string } | null>(null);

  useEffect(() => {
    void referralService.getPendingCode().then((pending) => {
      if (pending && !referralCode.trim()) setReferralCode(pending);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from deep link / website
  }, []);

  const birthDateIso = useMemo(() => {
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
    return toBirthDateIso(y, m, d);
  }, [birthDay, birthMonth, birthYear]);

  const parsedAge = useMemo(() => {
    if (birthDateIso) {
      const valid = isValidPlayerBirthDate(birthDateIso);
      if (valid.ok) return valid.age;
      return ageYearsAsOf(birthDateIso);
    }
    return parseAgeInput(age);
  }, [birthDateIso, age]);
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

  // Si le parcours change et que la page courante n’y est plus → revenir à l’étape 1.
  useEffect(() => {
    if (steps.length === 0) return;
    if (!steps.includes(currentPageId)) {
      setCurrentPageId(steps[0]);
    }
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
  const oauthSignup = useMemo(
    () =>
      resolveSignupOAuthState(
        getFirebaseAuth()?.currentUser ?? null,
        initial?.initialEmail
      ),
    [initial?.initialEmail]
  );
  const { isOAuthCompletion, providerEmail, isEmailEditable } = oauthSignup;

  useEffect(() => {
    if (!isEmailEditable && providerEmail && !email.trim()) {
      setEmail(providerEmail);
    }
  }, [isEmailEditable, providerEmail, email]);

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
    setBirthDay('');
    setBirthMonth('');
    setBirthYear('');
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

  const handleSetEmail = useCallback((raw: string) => {
    setEmail(raw.replace(/[\r\n\t]/g, '').trimStart());
  }, []);

  const handleSetDisplayName = useCallback((raw: string) => {
    setDisplayName(raw.replace(/[\r\n\t]/g, '').trimStart());
  }, []);

  const handleSetPassword = useCallback((raw: string) => {
    setPassword(raw.trim());
  }, []);

  const handleSetConfirmPassword = useCallback((raw: string) => {
    setConfirmPassword(raw.trim());
  }, []);

  const confirmRoleAndContinue = useCallback(() => {
    const nextRole = isProPlayerSignup ? 'player' : draftRole;
    // Auto-healing: Dynamically adapt productLine to the selected role
    const targetProductLine = resolveSignupProductLine(productLine, nextRole);
    if (targetProductLine !== productLine) {
      void setProductLine(targetProductLine);
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
    setCurrentPageId(nextSteps[0] ?? resolveSignupStartPage({ role: nextRole, parentalRequired: false }));
    clearErrors();
  }, [draftRole, productLine, setProductLine, resetPlayerFields, clearErrors, isProPlayerSignup]);

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

  useEffect(() => {
    if (parsedAge != null && parsedAge >= 5) {
      const suggested =
        gender === 'women'
          ? suggestFeminineAppSpaceFromAge(parsedAge)
          : suggestAppSpaceFromAge(parsedAge);
      if (suggested) {
        setAppSpaceState(suggested);
        setSpaceTouched(true);
      }
      setParentalRequired(needsParentalStep(isMinorAge(parsedAge), suggested ?? appSpace));
    }
  }, [parsedAge, gender, appSpace]);

  const allowedCategories = useMemo(() => {
    const base = defaultCategoriesForAppSpace(appSpace, productLine, gender);
    const extras: string[] = [];
    if (selectedFffCategory && !base.includes(selectedFffCategory)) {
      extras.push(selectedFffCategory);
    }
    if (category && !base.includes(category) && !extras.includes(category)) {
      extras.push(category);
    }
    return [...extras, ...base];
  }, [appSpace, productLine, gender, selectedFffCategory, category]);

  const buildIntegrityInput = useCallback(
    () => {
      const effectiveLine = resolveSignupProductLine(productLine, role);
      return {
        role,
        productLine: effectiveLine,
        flowKind,
        spaceTouched,
        parentalRequired,
        staff: {
          role,
          city: city.trim(),
          department: department.trim(),
          medicalSpecialty,
          medicalPracticeFocus,
          structureName: structureName.trim() || undefined,
          professionalHeadline: professionalHeadline.trim() || undefined,
          calComUsername,
        },
        player:
          role === 'player'
            ? {
                position: position.trim(),
                category: (selectedFffCategory || category).trim(),
                level: level.trim(),
                city: city.trim(),
                department: department.trim(),
                parsedAge,
                appSpace,
                allowedCategories,
                statMatches,
                statGoals,
                statAssists,
              }
            : undefined,
        account: {
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          isOAuth: isOAuthCompletion,
          role,
          city: city.trim(),
          acceptedTerms,
          guardianEmail: parentalRequired ? guardianEmail.trim().toLowerCase() : undefined,
        },
        parental: parentalRequired
          ? {
              guardianName: guardianName.trim(),
              guardianEmail: guardianEmail.trim().toLowerCase(),
              guardianConsent,
              accountEmail: email.trim().toLowerCase(),
            }
          : undefined,
      };
    },
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
      selectedFffCategory,
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
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAccount = () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    const errs = validateAccountStepFields({
      displayName: cleanDisplayName,
      email: cleanEmail,
      password,
      confirmPassword,
      isOAuth: isOAuthCompletion,
      role,
      city: city.trim(),
      acceptedTerms,
      guardianEmail: parentalRequired ? guardianEmail.trim().toLowerCase() : undefined,
    });
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(
        errs.password ||
        errs.confirmPassword ||
        errs.acceptedTerms ||
        errs.email ||
        errs.displayName ||
        'Veuillez corriger les informations requises.'
      );
    }
    return Object.keys(errs).length === 0;
  };

  const validateStaff = () => {
    // Club : validation = club FFF sélectionné (+ fiche déjà auto). Pas de re-saisie manuelle.
    if (role === 'club') {
      const errs: Record<string, string> = {};
      if (!selectedFffClub) {
        errs.club =
          'Recherchez et sélectionnez votre club FFF (ville, code postal ou n° d’affiliation).';
      } else {
        if (!structureName.trim() && selectedFffClub.name) {
          setStructureName(selectedFffClub.name);
        }
        if (!city.trim() && selectedFffClub.city) {
          setCity(selectedFffClub.city);
        }
        if (!department.trim() && selectedFffClub.department) {
          setDepartment(selectedFffClub.department);
        }
        const resolvedName = (structureName.trim() || selectedFffClub.name || '').trim();
        if (resolvedName.length < 2) {
          errs.structureName =
            'Le nom du club n’a pas pu être récupéré auprès de la FFF. Réessayez la recherche.';
        }
      }
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        setError(Object.values(errs)[0]);
        return false;
      }
      setError(null);
      return true;
    }

    const errs = validateRoleProFields({
      role,
      city,
      department,
      medicalSpecialty,
      medicalPracticeFocus,
      structureName,
      professionalHeadline,
    });

    // Coach : affiliation FFF réelle (pas de club inventé).
    if (role === 'coach') {
      if (hasClub) {
        if (!selectedFffClub) {
          errs.club =
            'Recherchez et sélectionnez le club FFF (ville, code postal ou n° d’affiliation).';
        } else {
          const activeCat = selectedFffCategory || category;
          if (!activeCat) {
            errs.category =
              'Sélectionnez votre catégorie / équipe FFF (liste DOFA), ou saisissez-la telle qu’indiquée sur votre licence.';
          }
        }
      }
      if (selectedFffClub) {
        if (!city && selectedFffClub.city) setCity(selectedFffClub.city);
        if (!department && selectedFffClub.department) setDepartment(selectedFffClub.department);
      }
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return false;
    }
    setError(null);
    return true;
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
      category: selectedFffCategory || category,
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
    const errs: Record<string, string> = {};
    if (hasClub) {
      if (!selectedFffClub) {
        errs.club =
          'Recherchez et sélectionnez votre club FFF (ville, code postal ou n° d’affiliation), ou choisissez « Sans club ».';
      } else {
        const activeCat = selectedFffCategory || category;
        if (!activeCat) {
          errs.category =
            'Sélectionnez votre catégorie / équipe FFF du club (liste officielle DOFA), ou saisissez-la telle qu’indiquée sur votre licence.';
        }
        if (!selectedRosterMember && displayName.trim().length < 2) {
          errs.displayName =
            'Indiquez votre nom tel qu’il figure sur votre licence FFF.';
        }
      }
    } else {
      if (displayName.trim().length < 2) {
        errs.displayName = 'Renseignez votre nom et prénom officiels.';
      }
    }

    if (selectedFffClub) {
      if (!city && selectedFffClub.city) setCity(selectedFffClub.city);
      if (!department && selectedFffClub.department) setDepartment(selectedFffClub.department);
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return false;
    }
    setError(null);
    return true;
  };

  const validateLocation = () => {
    const all = validatePlayerStepFields({
      position,
      category: selectedFffCategory || category,
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
      category: selectedFffCategory || category,
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    const all = validateAccountStepFields({
      displayName: cleanDisplayName,
      email: cleanEmail,
      password,
      confirmPassword,
      isOAuth: isOAuthCompletion,
      role,
      city: city.trim(),
      acceptedTerms,
      guardianEmail: parentalRequired ? guardianEmail.trim().toLowerCase() : undefined,
    });
    const keys =
      role === 'sponsor'
        ? ['displayName', 'email', 'city']
        : ['displayName', 'email'];
    const errs = pickPlayerErrors(all, keys);

    if (role === 'player') {
      const valid = isValidPlayerBirthDate(birthDateIso);
      if (!valid.ok) {
        errs.age = valid.reason;
      }
      if (city.trim()) {
        const cityErr = validateCity(city, { required: false });
        if (cityErr) errs.city = cityErr;
      }
      if (department.trim()) {
        const deptErr = validateFrenchDepartment(department);
        if (deptErr) errs.department = deptErr;
      }
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(
        errs.email ||
        errs.displayName ||
        errs.age ||
        errs.city ||
        errs.department ||
        'Veuillez renseigner les informations requises.'
      );
    }
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

  /** Appelé depuis SignupFlow : crée le compte quand l’étape suivante est `launch`. */
  const createBeforeLaunchRef = useRef<(() => Promise<boolean>) | null>(null);
  const registerCreateBeforeLaunch = useCallback((fn: (() => Promise<boolean>) | null) => {
    createBeforeLaunchRef.current = fn;
  }, []);

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
        setParentalRequired(needsParentalStep(isMinor, appSpace));
        break;
      default:
        break;
    }
    const next = steps[pageIndex + 1];
    if (next === 'launch') {
      void createBeforeLaunchRef.current?.();
      return true;
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
    steps,
    pageIndex,
  ]);

  const buildPlayerPayload = () => ({
    position: position.trim() || undefined,
    category: (selectedFffCategory || category).trim() || undefined,
    level: level.trim() || undefined,
    age: parsedAge ?? undefined,
    birth_date: birthDateIso ?? undefined,
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

        // Smart Navigation: if an error occurred on a field that belongs to an earlier step,
        // navigate directly to that step so the user can see and fix the highlighted field!
        const errKeys = Object.keys(integrityErrors);
        if (errKeys.some((k) => ['guardianName', 'guardianEmail', 'guardianConsent'].includes(k))) {
          goToPage('family');
        } else if (errKeys.some((k) => ['displayName', 'email', 'age'].includes(k))) {
          goToPage('account');
        } else if (errKeys.some((k) => ['password', 'confirmPassword', 'terms', 'acceptedTerms'].includes(k))) {
          goToPage('security');
        } else if (errKeys.some((k) => ['club', 'position', 'category', 'level'].includes(k))) {
          if (steps.includes('sport')) goToPage('sport');
        } else if (errKeys.some((k) => ['city', 'department'].includes(k))) {
          if (steps.includes('location')) goToPage('location');
          else if (steps.includes('account')) goToPage('account');
        } else if (errKeys.some((k) => ['structureName', 'professionalHeadline'].includes(k))) {
          if (steps.includes('staff')) goToPage('staff');
          else if (steps.includes('coach_pro')) goToPage('coach_pro');
          else if (steps.includes('club_pro')) goToPage('club_pro');
        }

        return false;
      }

      setLoading(true);
      clearErrors();
      try {
        const targetLine = resolveSignupProductLine(productLine, role);
        await setProductLine(targetLine);

        const cleanEmail = email.trim().toLowerCase();
        const cleanDisplayName = displayName.trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Membre');
        const common = {
          email: cleanEmail,
          display_name: cleanDisplayName,
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
                      bio: medicalPracticeFocus ? `${label}. ${medicalPracticeFocus}` : label,
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

        if (
          role === 'player' &&
          birthDateIso &&
          (gender === 'men' || gender === 'women') &&
          parsedAge != null
        ) {
          try {
            const { writeJoueurGate } = await import('../../utils/joueurGateStorage');
            const { joueurAgeGroupFromYears } = await import('../../utils/joueurBirthAge');
            await writeJoueurGate(user.uid, {
              gender,
              age: parsedAge,
              ageGroup: joueurAgeGroupFromYears(parsedAge),
              birthDate: birthDateIso,
            });
          } catch {
            // Gate pourra être complétée à l’accueil
          }
        }

        try {
          await refreshProfile();
        } catch (refreshErr) {
          console.warn('[signup] refreshProfile non-blocking error:', refreshErr);
        }

        // Demande d’adhésion pending — le club doit Confirmer / Refuser.
        if (hasClub && selectedFffClub) {
          if (role === 'player' || role === 'coach' || role === 'parent') {
            try {
              const existing =
                (selectedFffClub.fffNumber
                  ? await clubsService.getByFffAffiliationNumber(selectedFffClub.fffNumber)
                  : null) ??
                (await clubsService.getById(selectedFffClub.id));
              const directory = selectedFffClub.fffNumber
                ? await publicClubDirectoryService.getByAffiliation(selectedFffClub.fffNumber)
                : null;
              const clubId =
                existing?.id ||
                directory?.proday_club_id ||
                null;
              const joinPayload = {
                club_id: clubId,
                fff_affiliation_number: selectedFffClub.fffNumber || null,
                player_name: user.display_name,
                role:
                  role === 'coach' ? ('coach' as const) : role === 'parent' ? ('parent' as const) : ('player' as const),
                category: selectedFffCategory || category || null,
                license_number:
                  role === 'player' ? selectedRosterMember?.licenseNumber ?? null : null,
                identity_document_name: identityDoc?.name ?? null,
                identity_document_url: identityDoc?.uri ?? null,
                identity_document_type: identityDoc?.type ?? null,
                pre_registered_roster_id: selectedRosterMember?.id ?? null,
              };
              try {
                await callFunction('requestClubMembership', joinPayload);
              } catch (cfErr) {
                // Fallback client si la CF n’est pas encore déployée.
                if (clubId) {
                  await membershipsService.requestJoin({
                    club_id: clubId,
                    player_uid: user.uid,
                    player_name: user.display_name,
                    role: joinPayload.role,
                    category: joinPayload.category ?? undefined,
                    license_number: joinPayload.license_number ?? undefined,
                    identity_document_name: identityDoc?.name,
                    identity_document_url: identityDoc?.uri,
                    identity_document_type: identityDoc?.type as any,
                    pre_registered_roster_id: selectedRosterMember?.id,
                  });
                } else {
                  console.warn('[signup] requestClubMembership:', cfErr);
                }
              }
            } catch (err) {
              console.warn('[signup] requestJoin membership:', err);
            }
          } else if (role === 'club') {
            try {
              const existing = selectedFffClub.fffNumber
                ? await clubsService.getByFffAffiliationNumber(selectedFffClub.fffNumber)
                : null;
              let clubId = existing?.id;
              if (!clubId) {
                clubId = await clubsService.create(
                  {
                    name: selectedFffClub.name,
                    city: selectedFffClub.city,
                    department: selectedFffClub.department,
                    categories:
                      selectedFffCategory || category
                        ? [selectedFffCategory || category]
                        : selectedFffClub.categories,
                    owner_uid: user.uid,
                    fff_affiliation_number: selectedFffClub.fffNumber || undefined,
                    logo_url: selectedFffClub.logoUrl || undefined,
                  },
                  user
                );
              } else if (selectedFffClub.logoUrl || selectedFffClub.fffNumber) {
                void clubsService.ensureBrandingFromDirectory(clubId).catch(() => undefined);
              }
              if (selectedFffClub.fffNumber && clubId) {
                void publicClubDirectoryService
                  .upsertFromOfficial(selectedFffClub)
                  .then(() =>
                    publicClubDirectoryService.claimClub({
                      fffAffiliationNumber: selectedFffClub.fffNumber,
                      prodayClubId: clubId!,
                      mandateDocumentName: identityDoc?.name,
                    }),
                  )
                  .catch((err) => console.warn('[signup] claimPublicClub:', err));
              }
            } catch (err) {
              console.warn('[signup] create/claim club:', err);
            }
          }
        }

        if (identityDoc) {
          try {
            const { profileService } = await import('../../services/profile.service');
            await profileService.uploadVerificationDocument(
              user.uid,
              {
                uri: identityDoc.uri,
                mimeType: identityDoc.uri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
              },
              role === 'club' ? 'diploma' : 'id'
            );
          } catch (err) {
            console.warn('[signup] uploadVerificationDocument:', err);
          }
        }

        void referralService.bootstrapAfterSignup({
          codeFromForm: referralCode,
          role,
        });
        if (parentalRequired) {
          // Provision compte parent + e-mail set-password (trigger Firestore + callable backup)
          void parentPortalService.provisionParentAccount(user.uid).catch((err) => {
            console.warn('[signup] provisionParentAccount:', err);
          });
        }
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
      referralCode,
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
    isEmailEditable,
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
    setDisplayName: handleSetDisplayName,
    email,
    setEmail: handleSetEmail,
    referralCode,
    setReferralCode,
    password,
    setPassword: handleSetPassword,
    confirmPassword,
    setConfirmPassword: handleSetConfirmPassword,
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
    birthDay,
    setBirthDay,
    birthMonth,
    setBirthMonth,
    birthYear,
    setBirthYear,
    birthDateIso,
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
    parsedAge,
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
    setFieldErrors,
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
    registerCreateBeforeLaunch,
    createAccount,
    // FFF Affiliation & Justificatif
    hasClub,
    setHasClub,
    selectedFffClub,
    setSelectedFffClub,
    selectedFffCategory,
    setSelectedFffCategory,
    selectedRosterMember,
    setSelectedRosterMember,
    isCustomProfile,
    setIsCustomProfile,
    identityDoc,
    setIdentityDoc,
    setError,
    setLoading,
  };
}

export type SignupForm = ReturnType<typeof useSignupForm>;

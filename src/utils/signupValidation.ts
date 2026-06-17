import type { AppSpaceId } from '../models/AppSpace';
import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { isRoleAllowedForProductLine } from '../content/universeRoles';
import {
  MEDICAL_SPECIALTY_IDS,
} from '../screens/signup/signupMedicalI18n';
import type { MedicalSpecialtyId } from '../screens/signup/signupRoleExperience';
import { validateAgeForAppSpace } from '../screens/signup/signupFlowConfig';
import { PLAYER_LEVELS, PLAYER_POSITIONS } from '../constants/playerProfile';

export type ValidationResult = string | undefined;

export const SIGNUP_EMAIL_MAX = 254;
export const SIGNUP_PASSWORD_MIN = 10;
export const SIGNUP_PASSWORD_MAX = 128;
export const SIGNUP_DISPLAY_NAME_MIN = 2;
export const SIGNUP_DISPLAY_NAME_MAX = 60;

const SIGNUP_EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const FRENCH_DEPT_RE = /^(?:0[1-9]|[1-8]\d|9[0-5]|2[AB]|97[1-6]|98)$/i;

const BLOCKED_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'yopmail.com',
  'tempmail.com',
  'temp-mail.org',
  'throwaway.email',
  '10minutemail.com',
  'trashmail.com',
  'getnada.com',
  'maildrop.cc',
]);

const WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '1234567890',
  '123456789',
  'qwertyuiop',
  'motdepasse',
  'motdepasse1',
  'azertyuiop',
  'proday1234',
  'admin12345',
]);

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  label: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateSignupEmail(
  email: string,
  options?: { label?: string; allowBlockedDomains?: boolean }
): ValidationResult {
  const normalized = normalizeEmail(email);
  const label = options?.label ?? 'Email';
  if (!normalized) return `${label} requis`;
  if (normalized.length > SIGNUP_EMAIL_MAX) return `${label} trop long (max. ${SIGNUP_EMAIL_MAX} car.)`;
  if (!SIGNUP_EMAIL_RE.test(normalized)) return `Format de ${label.toLowerCase()} invalide`;
  const at = normalized.lastIndexOf('@');
  const domain = at >= 0 ? normalized.slice(at + 1) : '';
  if (!options?.allowBlockedDomains && BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return `${label} : les adresses jetables ne sont pas autorisées`;
  }
  return undefined;
}

export function validateSignupPassword(
  password: string,
  context?: { email?: string; displayName?: string }
): ValidationResult {
  if (!password) return 'Mot de passe requis';
  if (password.length < SIGNUP_PASSWORD_MIN) {
    return `Minimum ${SIGNUP_PASSWORD_MIN} caractères`;
  }
  if (password.length > SIGNUP_PASSWORD_MAX) return 'Mot de passe trop long';
  if (!/[a-zàâäéèêëïîôùûüç]/.test(password)) return 'Au moins une lettre minuscule';
  if (!/[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/.test(password)) return 'Au moins une lettre majuscule';
  if (!/\d/.test(password)) return 'Au moins un chiffre';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return 'Au moins un caractère spécial (!@#$…)';
  }
  if (/\s/.test(password)) return 'Le mot de passe ne doit pas contenir d’espaces';
  const lower = password.toLowerCase();
  if (WEAK_PASSWORDS.has(lower)) {
    return 'Mot de passe trop courant — choisissez-en un plus unique';
  }
  if (context?.email) {
    const local = normalizeEmail(context.email).split('@')[0];
    if (local.length >= 3 && lower.includes(local)) {
      return 'Le mot de passe ne doit pas contenir votre email';
    }
  }
  if (context?.displayName) {
    const namePart = context.displayName.trim().toLowerCase().split(/\s+/)[0];
    if (namePart.length >= 3 && lower.includes(namePart)) {
      return 'Le mot de passe ne doit pas contenir votre prénom';
    }
  }
  return undefined;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) return 'Confirmez votre mot de passe';
  if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas';
  return undefined;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: '' };
  let score = 0;
  if (password.length >= SIGNUP_PASSWORD_MIN) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) score += 1;
  if (!validateSignupPassword(password)) score += 1;

  if (score <= 1) return { level: 1, label: 'Faible' };
  if (score === 2) return { level: 2, label: 'Moyen' };
  if (score === 3) return { level: 3, label: 'Bon' };
  return { level: 4, label: 'Très solide' };
}

export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Nom affiché requis';
  if (trimmed.length < SIGNUP_DISPLAY_NAME_MIN) {
    return `Minimum ${SIGNUP_DISPLAY_NAME_MIN} caractères`;
  }
  if (trimmed.length > SIGNUP_DISPLAY_NAME_MAX) {
    return `Maximum ${SIGNUP_DISPLAY_NAME_MAX} caractères`;
  }
  if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(trimmed)) {
    return 'Lettres, espaces, apostrophes et tirets uniquement';
  }
  if (/@|https?:\/\//i.test(trimmed)) return 'Ne doit pas contenir d’email ou de lien';
  if (/^\d+$/.test(trimmed)) return 'Le nom ne peut pas être uniquement des chiffres';
  return undefined;
}

export function validateGuardianName(name: string): ValidationResult {
  const base = validateDisplayName(name);
  if (base) return base.replace('Nom affiché', 'Nom du responsable');
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const parts = trimmed.split(' ').filter(Boolean);
  if (parts.length < 2) {
    return 'Indiquez le prénom et le nom du responsable';
  }
  return undefined;
}

export function validateCity(
  value: string,
  options?: { required?: boolean; minLength?: number }
): ValidationResult {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return options?.required ? 'Ville requise' : undefined;
  const minLen = options?.minLength ?? 2;
  if (trimmed.length < minLen) return `Minimum ${minLen} caractères`;
  if (trimmed.length > 80) return 'Ville trop longue';
  if (!/[\p{L}]/u.test(trimmed)) return 'Indiquez un nom de ville valide';
  if (!/^[\p{L}\d\s'.-]+$/u.test(trimmed)) return 'Caractères non autorisés dans la ville';
  return undefined;
}

export function validateFrenchDepartment(
  value: string,
  options?: { required?: boolean }
): ValidationResult {
  const trimmed = value.trim().toUpperCase().replace(/\s/g, '');
  if (!trimmed) return options?.required ? 'Département requis' : undefined;
  if (!FRENCH_DEPT_RE.test(trimmed)) {
    return 'Département invalide (ex. 75, 69, 2A, 971)';
  }
  return undefined;
}

export function validateEmailsDistinct(
  a: string,
  b: string,
  message = 'Les deux adresses email doivent être différentes'
): ValidationResult {
  if (!a.trim() || !b.trim()) return undefined;
  if (normalizeEmail(a) === normalizeEmail(b)) return message;
  return undefined;
}

export function validateSelection(
  value: string,
  allowed: readonly string[],
  fieldLabel: string
): ValidationResult {
  if (!value.trim()) return `${fieldLabel} requis`;
  if (!allowed.includes(value)) return `${fieldLabel} invalide — sélectionnez une option`;
  return undefined;
}

export function validateSeasonStat(
  value: string,
  fieldLabel: string,
  max: number
): ValidationResult {
  if (!value.trim()) return undefined;
  const n = parseInt(value.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return `${fieldLabel} : nombre invalide`;
  if (n > max) return `${fieldLabel} : maximum ${max}`;
  return undefined;
}

export function validateMedicalSpecialty(value: string): ValidationResult {
  if (!value) return 'Sélectionnez une spécialité du pôle médical';
  if (!MEDICAL_SPECIALTY_IDS.includes(value as MedicalSpecialtyId)) {
    return 'Spécialité invalide';
  }
  return undefined;
}

export function validateTermsAccepted(accepted: boolean): ValidationResult {
  if (!accepted) return 'Vous devez accepter les conditions pour créer un compte';
  return undefined;
}

export interface StaffValidationInput {
  role: UserRole;
  city: string;
  department: string;
  medicalSpecialty?: string;
  medicalPracticeFocus?: string;
  structureName?: string;
  professionalHeadline?: string;
}

export function validateStaffStepFields(input: StaffValidationInput): Record<string, string> {
  return validateRoleProFields(input);
}

export function validateMedicalSpecialtyStep(medicalSpecialty: string): Record<string, string> {
  const errs: Record<string, string> = {};
  const specErr = validateMedicalSpecialty(medicalSpecialty);
  if (specErr) errs.medicalSpecialty = specErr;
  return errs;
}

export function validateMedicalPracticeStep(
  input: Pick<StaffValidationInput, 'medicalPracticeFocus' | 'city' | 'department'>
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!input.medicalPracticeFocus?.trim()) {
    errs.medicalPracticeFocus = 'Sélectionnez votre mode de pratique';
  }
  const cityErr = validateCity(input.city, { required: true });
  if (cityErr) errs.city = cityErr;
  const deptErr = validateFrenchDepartment(input.department);
  if (deptErr) errs.department = deptErr;
  return errs;
}

export function validateRoleProFields(input: StaffValidationInput): Record<string, string> {
  const errs: Record<string, string> = {};
  const { role, city, department, medicalSpecialty, medicalPracticeFocus, structureName, professionalHeadline } =
    input;

  const cityMin = role === 'club' ? 3 : 2;
  const cityErr = validateCity(city, { required: true, minLength: cityMin });
  if (cityErr) errs.city = cityErr;

  const deptRequired = role === 'agent' || role === 'club' || role === 'recruiter';
  const deptErr = validateFrenchDepartment(department, { required: deptRequired });
  if (deptErr) errs.department = deptErr;

  if (role === 'coach' || role === 'agent') {
    if (!professionalHeadline?.trim()) {
      errs.professionalHeadline =
        role === 'coach' ? 'Indiquez votre diplôme ou certification' : 'Indiquez votre n° de licence';
    }
  }

  if (role === 'recruiter') {
    if (!professionalHeadline?.trim()) {
      errs.professionalHeadline = 'Indiquez votre spécialité recrutement';
    }
  }

  if (role === 'club' || role === 'organizer') {
    if (!structureName?.trim() || structureName.trim().length < 2) {
      errs.structureName = 'Nom de structure requis (2 caractères min.)';
    }
  }

  if (role === 'physio') {
    const specErr = validateMedicalSpecialty(medicalSpecialty ?? '');
    if (specErr) errs.medicalSpecialty = specErr;
    if (medicalPracticeFocus !== undefined && !medicalPracticeFocus.trim()) {
      errs.medicalPracticeFocus = 'Sélectionnez votre mode de pratique';
    }
  }

  return errs;
}

export function validateSponsorProFields(structureName: string, city: string): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!structureName.trim() || structureName.trim().length < 2) {
    errs.structureName = 'Nom de marque requis';
  }
  const cityErr = validateCity(city, { required: true });
  if (cityErr) errs.city = cityErr;
  return errs;
}

export interface PlayerValidationInput {
  position: string;
  category: string;
  level: string;
  city: string;
  department: string;
  parsedAge: number | null;
  appSpace: AppSpaceId;
  allowedCategories: readonly string[];
  statMatches: string;
  statGoals: string;
  statAssists: string;
}

export function validatePlayerStepFields(input: PlayerValidationInput): Record<string, string> {
  const errs: Record<string, string> = {};

  const positionErr = validateSelection(input.position, PLAYER_POSITIONS, 'Poste');
  if (positionErr) errs.position = positionErr;

  const categoryErr = validateSelection(input.category, input.allowedCategories, 'Catégorie');
  if (categoryErr) errs.category = categoryErr;

  const levelErr = validateSelection(input.level, PLAYER_LEVELS, 'Niveau');
  if (levelErr) errs.level = levelErr;

  const cityErr = validateCity(input.city, { required: true });
  if (cityErr) errs.city = cityErr;

  const deptErr = validateFrenchDepartment(input.department);
  if (deptErr) errs.department = deptErr;

  if (input.parsedAge == null) {
    errs.age = 'Âge valide requis (5–99 ans)';
  } else {
    const ageSpaceErr = validateAgeForAppSpace(input.parsedAge, input.appSpace);
    if (ageSpaceErr) errs.age = ageSpaceErr;
  }

  const matchesErr = validateSeasonStat(input.statMatches, 'Matchs', 80);
  if (matchesErr) errs.statMatches = matchesErr;
  const goalsErr = validateSeasonStat(input.statGoals, 'Buts', 120);
  if (goalsErr) errs.statGoals = goalsErr;
  const assistsErr = validateSeasonStat(input.statAssists, 'Passes décisives', 80);
  if (assistsErr) errs.statAssists = assistsErr;

  return errs;
}

export interface AccountValidationInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isOAuth: boolean;
  role: UserRole;
  city: string;
  acceptedTerms: boolean;
  guardianEmail?: string;
}

export function validateAccountStepFields(input: AccountValidationInput): Record<string, string> {
  const errs: Record<string, string> = {};

  const nameErr = validateDisplayName(input.displayName);
  if (nameErr) errs.displayName = nameErr;

  const emailErr = validateSignupEmail(input.email);
  if (emailErr) errs.email = emailErr;

  if (!input.isOAuth) {
    const passwordErr = validateSignupPassword(input.password, {
      email: input.email,
      displayName: input.displayName,
    });
    if (passwordErr) errs.password = passwordErr;

    const confirmErr = validateConfirmPassword(input.password, input.confirmPassword);
    if (confirmErr) errs.confirmPassword = confirmErr;
  }

  const termsErr = validateTermsAccepted(input.acceptedTerms);
  if (termsErr) errs.acceptedTerms = termsErr;


  const distinctErr = validateEmailsDistinct(
    input.email,
    input.guardianEmail ?? '',
    'L’email du compte doit être différent de celui du responsable légal'
  );
  if (distinctErr) errs.email = distinctErr;

  return errs;
}

export interface ParentalValidationInput {
  guardianName: string;
  guardianEmail: string;
  guardianConsent: boolean;
  accountEmail?: string;
}

export function validateParentalStepFields(input: ParentalValidationInput): Record<string, string> {
  const errs: Record<string, string> = {};

  const nameErr = validateGuardianName(input.guardianName);
  if (nameErr) errs.guardianName = nameErr;

  const emailErr = validateSignupEmail(input.guardianEmail, { label: 'Email du responsable' });
  if (emailErr) errs.guardianEmail = emailErr;

  if (!input.guardianConsent) {
    errs.guardianConsent = 'Le consentement du responsable légal est obligatoire';
  }

  const distinctErr = validateEmailsDistinct(
    input.guardianEmail,
    input.accountEmail ?? '',
    'L’email du responsable doit être différent de celui du joueur'
  );
  if (distinctErr) errs.guardianEmail = distinctErr;

  return errs;
}

export interface SignupIntegrityInput {
  role: UserRole;
  productLine?: ProductLineId;
  flowKind: 'player' | 'staff' | 'sponsor';
  spaceTouched: boolean;
  parentalRequired: boolean;
  staff: StaffValidationInput;
  player?: PlayerValidationInput;
  account: AccountValidationInput;
  parental?: ParentalValidationInput;
}

/** Dernière barrière avant création du compte (toutes étapes). */
export function validateSignupIntegrity(input: SignupIntegrityInput): Record<string, string> {
  const errs: Record<string, string> = {};

  if (input.productLine && !isRoleAllowedForProductLine(input.role, input.productLine)) {
    errs.role = 'Ce profil n’est pas disponible sur cet univers ProDay.';
  }

  if (!input.spaceTouched && input.flowKind === 'player') {
    errs.appSpace = 'Sélectionnez un espace ProDay';
  }

  if (input.flowKind === 'player' && input.player) {
    Object.assign(errs, validatePlayerStepFields(input.player));
  }

  if (input.flowKind === 'staff') {
    Object.assign(errs, validateRoleProFields(input.staff));
  }

  if (input.flowKind === 'sponsor') {
    Object.assign(
      errs,
      validateSponsorProFields(input.staff.structureName ?? '', input.staff.city)
    );
  }

  if (input.parentalRequired && input.parental) {
    Object.assign(errs, validateParentalStepFields(input.parental));
  }

  Object.assign(errs, validateAccountStepFields(input.account));

  return errs;
}

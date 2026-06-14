import type { AppSpaceId } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import type { UserRole } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import type { IconName } from '../../components/ui/Icon';
import { getRoleWelcomeCopy, getRoleSignupPhases, getRoleLaunchCopy } from './signupRoleExperience';

/** Parcours multi-écrans — une info clé par page, transitions animées */
export type SignupPageId =
  | 'welcome'
  | 'space'
  | 'sport'
  | 'location'
  | 'stats'
  /** @deprecated — utiliser les pages *\_pro par rôle */
  | 'staff'
  | 'coach_pro'
  | 'club_pro'
  | 'agent_pro'
  | 'recruiter_pro'
  | 'organizer_pro'
  | 'medical_specialty'
  | 'medical_practice'
  | 'sponsor_pro'
  | 'family'
  | 'account'
  | 'security'
  | 'launch';

export type SignupFlowKind = 'player' | 'staff' | 'sponsor';

export const SIGNUP_PAGE_LABELS: Record<SignupPageId, string> = {
  welcome: 'Bienvenue',
  space: 'Espace',
  sport: 'Sport',
  location: 'Ville',
  stats: 'Stats',
  staff: 'Profil pro',
  coach_pro: 'Coach',
  club_pro: 'Club',
  agent_pro: 'Agent',
  recruiter_pro: 'Recruteur',
  organizer_pro: 'Orga',
  medical_specialty: 'Spécialité',
  medical_practice: 'Cabinet',
  sponsor_pro: 'Partenaire',
  family: 'Famille',
  account: 'Identité',
  security: 'Sécurité',
  launch: 'Lancement',
};

export type SignupPhaseId = 'vous' | 'acces' | 'launch';

export interface SignupPhase {
  id: SignupPhaseId;
  label: string;
}

export const SIGNUP_PHASES: SignupPhase[] = [
  { id: 'vous', label: 'Vous' },
  { id: 'acces', label: 'Accès' },
  { id: 'launch', label: 'Go' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  sponsor: 'Partenaire',
  physio: 'Pôle médical',
};

export const MEDICAL_POLE_SPECIALTIES = [
  'Kinésithérapeute du sport',
  'Ostéopathe',
  'Médecin du sport',
  'Préparateur physique',
  'Coach mental / préparateur mental',
  'Nutritionniste sportif',
  'Podologue du sport',
] as const;

/** @deprecated Préférer getSignupRoleGroups(productLine) dans poleExperience.ts */
export const ROLE_GROUPS: {
  id: string;
  label: string;
  hint: string;
  roles: UserRole[];
}[] = [
  {
    id: 'sport',
    label: 'Sportifs',
    hint: 'CV en ligne, stats et candidatures Mercato',
    roles: ['player'],
  },
  {
    id: 'structure',
    label: 'Structures',
    hint: 'Annonces club, effectifs et événements',
    roles: ['club', 'organizer'],
  },
];

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getFlowKind(role: UserRole): SignupFlowKind {
  if (role === 'player') return 'player';
  if (role === 'sponsor') return 'sponsor';
  return 'staff';
}

export function needsParentalStep(isMinor: boolean, appSpace: AppSpaceId): boolean {
  return isMinor || isUnderU13AppSpace(appSpace);
}

export interface SignupFlowOptions {
  parentalRequired: boolean;
  role: UserRole;
}

function staffProPage(role: UserRole): SignupPageId {
  switch (role) {
    case 'coach':
      return 'coach_pro';
    case 'club':
      return 'club_pro';
    case 'agent':
      return 'agent_pro';
    case 'recruiter':
      return 'recruiter_pro';
    case 'organizer':
      return 'organizer_pro';
    case 'physio':
      return 'medical_specialty';
    default:
      return 'staff';
  }
}

/**
 * Parcours multi-pages — une séquence par rôle (joueur, coach, club, agent, orga, médical, partenaire).
 */
export function buildSignupSteps(
  flowKind: SignupFlowKind,
  options: SignupFlowOptions
): SignupPageId[] {
  const { role, parentalRequired } = options;

  if (flowKind === 'player') {
    const pages: SignupPageId[] = ['welcome', 'space', 'sport', 'location', 'stats'];
    if (parentalRequired) pages.push('family');
    pages.push('account', 'security', 'launch');
    return pages;
  }

  if (flowKind === 'sponsor') {
    return ['welcome', 'sponsor_pro', 'account', 'security', 'launch'];
  }

  if (role === 'physio') {
    return [
      'welcome',
      'medical_specialty',
      'medical_practice',
      'account',
      'security',
      'launch',
    ];
  }

  return ['welcome', staffProPage(role), 'account', 'security', 'launch'];
}

export function getSignupPhases(_flowKind?: SignupFlowKind, role?: UserRole): SignupPhase[] {
  if (role) return getRoleSignupPhases(role);
  return SIGNUP_PHASES;
}

export function getCurrentPhase(page: SignupPageId): SignupPhaseId {
  if (page === 'account' || page === 'security') return 'acces';
  if (page === 'launch') return 'launch';
  return 'vous';
}

const PRO_PROFILE_PAGES: SignupPageId[] = [
  'staff',
  'coach_pro',
  'club_pro',
  'agent_pro',
  'recruiter_pro',
  'organizer_pro',
  'medical_specialty',
  'medical_practice',
  'sponsor_pro',
];

export function getPhaseIndex(_flowKind: SignupFlowKind, page: SignupPageId): number {
  const current = getCurrentPhase(page);
  const idx = SIGNUP_PHASES.findIndex((p) => p.id === current);
  return idx >= 0 ? idx : 0;
}

export function getStepHeroIcon(page: SignupPageId): IconName {
  switch (page) {
    case 'welcome':
      return 'star-four-points';
    case 'space':
      return 'football';
    case 'sport':
      return 'shirt';
    case 'location':
      return 'location';
    case 'stats':
      return 'star';
    case 'staff':
    case 'coach_pro':
      return 'school';
    case 'club_pro':
      return 'business';
    case 'agent_pro':
      return 'briefcase';
    case 'recruiter_pro':
      return 'search';
    case 'organizer_pro':
      return 'trophy';
    case 'medical_specialty':
    case 'medical_practice':
      return 'heart';
    case 'sponsor_pro':
      return 'star-four-points';
    case 'family':
      return 'shield';
    case 'account':
      return 'person';
    case 'security':
      return 'lock';
    case 'launch':
      return 'checkmark-circle';
    default:
      return 'star-four-points';
  }
}

export function getWelcomeCopy(role: UserRole): { title: string; subtitle: string } {
  const { getRoleWelcomeCopy } = require('./signupRoleExperience') as typeof import('./signupRoleExperience');
  return getRoleWelcomeCopy(role);
}

export function getStaffStepSubtitle(role: UserRole): string {
  switch (role) {
    case 'coach':
      return 'Indiquez où vous exercez — justificatif analysé par IA avant confirmation email.';
    case 'agent':
      return 'Zone géographique — licence pro vérifiée par IA avant l’email.';
    case 'recruiter':
      return 'Territoire et spécialité recrutement — mandat vérifié par IA avant l’email.';
    case 'organizer':
      return 'Ville et structure — justificatif + IA Mistral avant l’email.';
    case 'club':
      return 'Structure et localisation — mandat vérifié par IA avant l’email.';
    case 'physio':
      return 'Spécialité médicale et zone d’intervention pour les sportifs.';
    default:
      return 'Quelques infos pour personnaliser votre expérience.';
  }
}

export function getAccessStepMeta(role: UserRole, isOAuth: boolean): { title: string; subtitle: string } {
  if (isOAuth) {
    return {
      title: 'Finaliser l’accès',
      subtitle: 'Validez votre identité ProDay pour entrer dans l’application.',
    };
  }
  if (role === 'sponsor') {
    return {
      title: 'Identifiants partenaire',
      subtitle: 'Email, mot de passe et zone — accès à l’espace sponsors.',
    };
  }
  return {
    title: 'Sécurisez votre compte',
    subtitle: 'Email fort, mot de passe robuste — puis confirmation par mail.',
  };
}

export function validateAgeForAppSpace(
  age: number,
  appSpace: AppSpaceId
): string | undefined {
  if (isUnderU13AppSpace(appSpace)) {
    if (age >= 13) return 'Âge incompatible avec l’espace -13 (moins de 13 ans).';
    if (age < 5) return 'Âge minimum : 5 ans.';
    return undefined;
  }
  if (appSpace === 'boys' || appSpace === 'girls') {
    if (age < 13 || age > 19) return 'Pour U13–U19, indiquez un âge entre 13 et 19 ans.';
    return undefined;
  }
  if (appSpace === 'men' || appSpace === 'women') {
    if (age < 16) return 'Pour l’espace seniors, l’âge minimum est 16 ans.';
    return undefined;
  }
  return undefined;
}

export function suggestAppSpaceFromAge(age: number): AppSpaceId | null {
  if (age < 13) return 'under_u13';
  if (age <= 19) return 'boys';
  return 'men';
}

export function getPostCreatePage(_role: UserRole): SignupPageId {
  return 'launch';
}

export function getPlayerVerificationChecks(appSpace: AppSpaceId) {
  const identity = {
    id: 'identity' as const,
    title: 'Pièce d’identité',
    subtitle: isUnderU13AppSpace(appSpace)
      ? 'CNI du responsable ou livret de famille — prise de vue caméra'
      : 'CNI ou passeport — photographiez avec la caméra',
    required: true,
  };
  if (isUnderU13AppSpace(appSpace)) return [identity];
  return [
    identity,
    {
      id: 'club_license' as const,
      title: 'Licence FFF',
      subtitle: 'Carte club ou attestation — photographiez avec la caméra',
      required: false,
    },
  ];
}

export function getLaunchCopy(
  role: UserRole,
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean }
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: 'Documents validés',
      body: 'L’IA a traité vos justificatifs. Confirmez votre email — le lien vous attend dans votre boîte mail.',
      finishLabel: 'Compris',
    };
  }
  if (
    (role === 'player' || ROLES_REQUIRING_VERIFICATION.includes(role) || role === 'physio') &&
    flags.verificationPending
  ) {
    return {
      title: 'Compte créé',
      body: 'Prochaine étape après l’email : accès à votre espace dédié. Vos documents passent par l’analyse IA.',
      finishLabel: 'Continuer',
    };
  }
  return getRoleLaunchCopy(role, flags);
}

/** Espaces proposés dans le parcours ProDay Woman uniquement */
export const WOMAN_APP_SPACE_GROUPS = [
  {
    id: 'feminine' as const,
    label: 'Ton univers Woman',
    icon: 'heart' as const,
    options: [
      { id: 'girls' as AppSpaceId, label: 'Jeunes F', hint: 'U13 F – U19 F' },
      { id: 'women' as AppSpaceId, label: 'Seniors F', hint: 'D1 F, Régional' },
    ],
  },
  {
    id: 'school' as const,
    label: 'École de foot',
    icon: 'school' as const,
    options: [{ id: 'under_u13' as AppSpaceId, label: 'Moins de 13 ans', hint: 'U7 F, U9 F, U11 F' }],
  },
] as const;

/** @deprecated */
export const GIRL_APP_SPACE_GROUPS = WOMAN_APP_SPACE_GROUPS;

export { getWomanWelcomeCopy } from './signupWomanConfig';

/** @deprecated */
export { getWomanWelcomeCopy as getGirlWelcomeCopy } from './signupWomanConfig';

/** Espaces inscription ProDay classique — sans football féminin (réservé à ProDay Woman). */
export const APP_SPACE_GROUPS = [
  {
    id: 'masculine' as const,
    label: 'Football masculin',
    icon: 'football' as const,
    options: [
      { id: 'men' as AppSpaceId, label: 'Seniors', hint: 'R1, National' },
      { id: 'boys' as AppSpaceId, label: 'Jeunes', hint: 'U13 – U19' },
    ],
  },
  {
    id: 'school' as const,
    label: 'École de foot',
    icon: 'school' as const,
    options: [{ id: 'under_u13' as AppSpaceId, label: 'Moins de 13 ans', hint: 'U7, U9, U11' }],
  },
];

/** @deprecated Utiliser getLaunchCopy */
export function getSuccessCopy(
  role: UserRole,
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean }
) {
  return getLaunchCopy(role, flags);
}

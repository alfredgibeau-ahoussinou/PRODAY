import type { AppSpaceId } from '../../models/AppSpace';
import {
  isFeminineAppSpace,
  isMasculineAppSpace,
  isUnderU13AppSpace,
} from '../../models/AppSpace';
import type { UserRole } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';

export type SignupPageId =
  | 'role'
  | 'program'
  | 'player'
  | 'parental'
  | 'staff'
  | 'account'
  | 'player_verify'
  | 'document'
  | 'success';

export type SignupFlowKind = 'player' | 'staff' | 'sponsor';

export const SIGNUP_PAGE_LABELS: Record<SignupPageId, string> = {
  role: 'Votre rôle',
  program: 'Espace ProDay',
  player: 'Profil sportif',
  parental: 'Responsable légal',
  staff: 'Activité pro',
  account: 'Compte',
  player_verify: 'Documents',
  document: 'Justificatif',
  success: 'Terminé',
};

export type SignupPhaseId = 'profile' | 'account' | 'verify';

export interface SignupPhase {
  id: SignupPhaseId;
  label: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  agent: 'Agent',
  organizer: 'Organisateur',
  sponsor: 'Partenaire',
  physio: 'Kinésithérapeute',
};

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
  /** Fixé après validation du profil sportif — évite les sauts d’étapes pendant la saisie de l’âge */
  parentalRequired: boolean;
  role: UserRole;
}

/**
 * Parcours linéaire par type de compte.
 * - Joueur : rôle → espace → profil → (parental si requis) → compte → documents
 * - Staff : rôle → activité → compte → (justificatif si coach/agent/orga)
 * - Sponsor : rôle → compte
 */
export function buildSignupSteps(
  flowKind: SignupFlowKind,
  options: SignupFlowOptions
): SignupPageId[] {
  switch (flowKind) {
    case 'player': {
      const pages: SignupPageId[] = ['role', 'program', 'player'];
      if (options.parentalRequired) pages.push('parental');
      pages.push('account', 'player_verify', 'success');
      return pages;
    }
    case 'sponsor':
      return ['role', 'account', 'success'];
    case 'staff': {
      const pages: SignupPageId[] = ['role', 'staff', 'account'];
      if (ROLES_REQUIRING_VERIFICATION.includes(options.role)) {
        pages.push('document');
      }
      pages.push('success');
      return pages;
    }
  }
}

/** Libellés affichés dans l’aperçu du parcours (écran rôle) */
export function getFlowStepLabels(
  flowKind: SignupFlowKind,
  role: UserRole,
  parentalRequired: boolean
): string[] {
  switch (flowKind) {
    case 'player':
      return [
        'Espace ProDay',
        'Profil sportif',
        ...(parentalRequired ? ['Responsable légal'] : []),
        'Compte',
        'Documents',
      ];
    case 'sponsor':
      return ['Compte'];
    case 'staff':
      return [
        'Activité pro',
        'Compte',
        ...(ROLES_REQUIRING_VERIFICATION.includes(role) ? ['Justificatif'] : []),
      ];
  }
}

export function getFlowIntro(flowKind: SignupFlowKind, role: UserRole): {
  title: string;
  subtitle: string;
} {
  switch (flowKind) {
    case 'player':
      return {
        title: 'Inscription joueur',
        subtitle:
          'Choisissez votre espace (féminin, masculin ou -13), complétez votre profil, puis créez votre compte.',
      };
    case 'sponsor':
      return {
        title: 'Inscription partenaire',
        subtitle: 'Compte sponsor en 2 étapes — pas de vérification documentaire.',
      };
    case 'staff':
      return {
        title: `Inscription ${getRoleLabel(role).toLowerCase()}`,
        subtitle:
          'Ville et structure d’abord, puis compte. Le justificatif professionnel vient après la création du compte.',
      };
  }
}

export function getSignupPhases(flowKind: SignupFlowKind): SignupPhase[] {
  switch (flowKind) {
    case 'player':
      return [
        { id: 'profile', label: 'Profil' },
        { id: 'account', label: 'Compte' },
        { id: 'verify', label: 'Vérification' },
      ];
    case 'sponsor':
      return [
        { id: 'profile', label: 'Rôle' },
        { id: 'account', label: 'Compte' },
      ];
    case 'staff':
      return [
        { id: 'profile', label: 'Activité' },
        { id: 'account', label: 'Compte' },
        { id: 'verify', label: 'Vérification' },
      ];
  }
}

export function getCurrentPhase(page: SignupPageId): SignupPhaseId {
  if (page === 'account') return 'account';
  if (
    page === 'player_verify' ||
    page === 'document' ||
    page === 'success'
  ) {
    return 'verify';
  }
  return 'profile';
}

export function getPhaseIndex(flowKind: SignupFlowKind, page: SignupPageId): number {
  const phases = getSignupPhases(flowKind);
  const current = getCurrentPhase(page);
  const idx = phases.findIndex((p) => p.id === current);
  return idx >= 0 ? idx : 0;
}

export function getPlayerStepSubtitle(appSpace: AppSpaceId): string {
  if (isUnderU13AppSpace(appSpace)) {
    return 'Catégories U7, U9, U11 — un responsable légal sera demandé à l’étape suivante si besoin.';
  }
  if (isFeminineAppSpace(appSpace)) {
    return 'Profil joueuse aligné sur le Mercato féminin (U13 F à D1 F).';
  }
  if (isMasculineAppSpace(appSpace)) {
    return 'Profil joueur aligné sur le Mercato masculin (U13 à National).';
  }
  return 'Poste, catégorie et ville pour apparaître dans les bonnes recherches.';
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

export function getStaffStepTitle(role: UserRole): string {
  return 'Votre activité';
}

export function getStaffStepSubtitle(role: UserRole): string {
  switch (role) {
    case 'coach':
      return 'Où exercez-vous ? Le diplôme sera demandé juste après la création du compte.';
    case 'agent':
      return 'Zone géographique — la licence pro suit à l’étape vérification.';
    case 'organizer':
      return 'Ville et structure — justificatif à téléverser ensuite.';
    case 'physio':
      return 'Cabinet ou club d’attache — publiez sur le fil ProDay après inscription.';
    default:
      return 'Ville et coordonnées de votre structure.';
  }
}

export function getAccountSubtitle(role: UserRole, isOAuth: boolean): string {
  if (isOAuth) return 'Validez votre nom affiché pour finaliser le compte ProDay.';
  if (role === 'player') {
    return 'Créez vos identifiants — votre profil sportif sera enregistré avec ce compte.';
  }
  if (role === 'sponsor') {
    return 'Email et mot de passe pour accéder à l’espace partenaire.';
  }
  return 'Email et mot de passe — votre profil professionnel sera enregistré.';
}

export function getPostCreatePage(role: UserRole): SignupPageId {
  if (role === 'player') return 'player_verify';
  if (ROLES_REQUIRING_VERIFICATION.includes(role)) return 'document';
  return 'success';
}

export type PlayerVerifyCheckId = 'identity' | 'club_license';

export function getPlayerVerificationChecks(appSpace: AppSpaceId) {
  const identity = {
    id: 'identity' as const,
    title: 'Pièce d’identité',
    subtitle: isUnderU13AppSpace(appSpace)
      ? 'CNI du responsable ou livret de famille'
      : 'CNI ou passeport',
    required: true,
  };
  if (isUnderU13AppSpace(appSpace)) return [identity];
  return [
    identity,
    {
      id: 'club_license' as const,
      title: 'Licence FFF',
      subtitle: 'Carte club ou attestation de licenciement (recommandé)',
      required: false,
    },
  ];
}

export function getSuccessCopy(
  role: UserRole,
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean }
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: 'Confirmez votre email',
      body: 'Un lien vient d’être envoyé. Ouvrez-le pour activer votre compte, puis revenez sur ProDay.',
      finishLabel: 'J’ai compris',
    };
  }
  if (role === 'player' && flags.verificationPending) {
    return {
      title: 'Presque terminé',
      body: 'Votre compte est créé. Les documents sont analysés automatiquement — la messagerie complète s’ouvrira après validation.',
      finishLabel: 'Entrer dans ProDay',
    };
  }
  if (ROLES_REQUIRING_VERIFICATION.includes(role) && flags.verificationPending) {
    return {
      title: 'Vérification en cours',
      body: 'Votre justificatif est analysé. Vous serez notifié dès que votre profil staff sera actif.',
      finishLabel: 'Entrer dans ProDay',
    };
  }
  if (role === 'sponsor') {
    return {
      title: 'Bienvenue partenaire',
      body: 'Votre compte est actif. Explorez ProDay et complétez votre vitrine depuis le profil.',
      finishLabel: 'Entrer dans ProDay',
    };
  }
  return {
    title: 'C’est parti',
    body: 'Votre compte ProDay est prêt. Explorez le Mercato, les matchs et votre profil.',
    finishLabel: 'Entrer dans ProDay',
  };
}

export const APP_SPACE_GROUPS = [
  {
    id: 'feminine' as const,
    label: 'Football féminin',
    icon: 'people' as const,
    options: [
      { id: 'women' as AppSpaceId, label: 'Seniors F', hint: 'D1 F, Régional' },
      { id: 'girls' as AppSpaceId, label: 'Jeunes F', hint: 'U13 F – U19 F' },
    ],
  },
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

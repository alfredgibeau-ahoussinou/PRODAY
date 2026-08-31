import type { AppSpaceId } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import type { UserRole } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import type { IconName } from '../../components/ui/iconNames';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';
import { getRoleWelcomeCopy, getRoleSignupPhases, getRoleLaunchCopy } from './signupRoleExperience';
import type { SignupPageId, SignupFlowKind, SignupPhase, SignupPhaseId } from './signupFlowTypes';
import { MEDICAL_POLE_SPECIALTIES } from './signupFlowTypes';

export type { SignupPageId, SignupFlowKind, SignupPhase, SignupPhaseId };
export { MEDICAL_POLE_SPECIALTIES };

/** Parcours multi-écrans — une info clé par page, transitions animées */

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
  sponsor_pro: 'Sponsor',
  sponsor_company: 'Marque',
  sponsor_campaign: 'Campagne',
  sponsor_targeting: 'Ciblage',
  family: 'Famille',
  account: 'Identité',
  security: 'Sécurité',
  launch: 'Lancement',
};

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
  sponsor: 'Sponsor',
  supporter: 'Supporter',
  physio: 'Praticien santé',
  parent: 'Parent',
};

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

export function getSignupPageLabel(page: SignupPageId, t?: TranslateFn): string {
  const key = `signup.page.${page}`;
  return tr(t, key, SIGNUP_PAGE_LABELS[page] ?? 'Inscription');
}

export function getRoleLabel(role: UserRole, t?: TranslateFn): string {
  const key = `role.${role}`;
  return tr(t, key, ROLE_LABELS[role] ?? role);
}

export function getFlowKind(role: UserRole): SignupFlowKind {
  if (role === 'player') return 'player';
  if (role === 'sponsor') return 'sponsor';
  if (role === 'supporter') return 'supporter';
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
 * Parcours multi-pages — une séquence par rôle (joueur, coach, club, agent, orga, médical, sponsor).
 */
export function buildSignupSteps(
  flowKind: SignupFlowKind,
  options: SignupFlowOptions
): SignupPageId[] {
  const { role, parentalRequired } = options;

  // Compte d’abord (identité + mot de passe), univers/onboarding pôle ensuite.
  // `launch` = moment bienvenue → sélecteur d’univers (BrandRevealIntro).
  if (flowKind === 'player') {
    const pages: SignupPageId[] = ['account', 'security', 'space', 'sport', 'location', 'stats'];
    if (parentalRequired) pages.push('family');
    pages.push('launch');
    return pages;
  }

  if (flowKind === 'sponsor') {
    return [
      'account',
      'security',
      'sponsor_company',
      'sponsor_campaign',
      'sponsor_targeting',
      'launch',
    ];
  }

  if (role === 'supporter') {
    return ['account', 'security', 'launch'];
  }

  if (role === 'physio') {
    return [
      'account',
      'security',
      'medical_specialty',
      'medical_practice',
      'launch',
    ];
  }

  return ['account', 'security', staffProPage(role), 'launch'];
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

/**
 * Action du bouton Retour signup.
 * Étape 0 → fermer vers login ; étapes suivantes → précédent ; compte créé → aucun.
 */
export function resolveSignupBackKind(opts: {
  accountCreated: boolean;
  pageIndex: number;
}): 'close' | 'previous' | 'none' {
  if (opts.accountCreated) return 'none';
  if (opts.pageIndex <= 0) return 'close';
  return 'previous';
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
  'sponsor_company',
  'sponsor_campaign',
  'sponsor_targeting',
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
    case 'sponsor_company':
      return 'star-four-points';
    case 'sponsor_campaign':
      return 'briefcase';
    case 'sponsor_targeting':
      return 'location';
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

export function getStaffStepSubtitle(role: UserRole, t?: TranslateFn): string {
  switch (role) {
    case 'coach':
      return tr(
        t,
        'signup.staff.coach',
        'Indiquez où vous exercez. Justificatif analysé par IA avant confirmation email.'
      );
    case 'agent':
      return tr(
        t,
        'signup.staff.agent',
        'Zone géographique. Licence pro vérifiée par IA avant l’email.'
      );
    case 'recruiter':
      return tr(
        t,
        'signup.staff.recruiter',
        'Territoire et spécialité recrutement. Mandat vérifié par IA avant l’email.'
      );
    case 'organizer':
      return tr(
        t,
        'signup.staff.organizer',
        'Ville et structure. Justificatif + IA Mistral avant l’email.'
      );
    case 'club':
      return tr(
        t,
        'signup.staff.club',
        'Structure et localisation. Mandat vérifié par IA avant l’email.'
      );
    case 'physio':
      return tr(
        t,
        'signup.staff.physio',
        'Spécialité médicale et zone d’intervention pour les sportifs.'
      );
    default:
      return tr(t, 'signup.staff.default', 'Quelques infos pour personnaliser votre expérience.');
  }
}

export function getAccessStepMeta(
  role: UserRole,
  isOAuth: boolean,
  t?: TranslateFn
): { title: string; subtitle: string } {
  if (isOAuth) {
    return {
      title: tr(t, 'signup.access.oauth.title', 'Finaliser l’accès'),
      subtitle: tr(t, 'signup.access.oauth.subtitle', 'Validez votre identité ProDay pour entrer dans l’application.'),
    };
  }
  if (role === 'sponsor') {
    return {
      title: tr(t, 'signup.access.sponsor.title', 'Identifiants sponsor'),
      subtitle: tr(t, 'signup.access.sponsor.subtitle', 'Email, mot de passe et zone. Accès à l’espace sponsors.'),
    };
  }
  return {
    title: tr(t, 'signup.access.default.title', 'Sécurisez votre compte'),
    subtitle: tr(t, 'signup.access.default.subtitle', 'Email fort, mot de passe robuste. Puis confirmation par mail.'),
  };
}

export function validateAgeForAppSpace(
  age: number,
  appSpace: AppSpaceId,
  t?: TranslateFn
): string | undefined {
  if (isUnderU13AppSpace(appSpace)) {
    if (age >= 13) return tr(t, 'signup.age.u13.incompatible', 'Âge incompatible avec l’espace -13 (moins de 13 ans).');
    if (age < 5) return tr(t, 'signup.age.min', 'Âge minimum : 5 ans.');
    return undefined;
  }
  if (appSpace === 'boys' || appSpace === 'girls') {
    if (age < 13 || age > 19) return tr(t, 'signup.age.youth.range', 'Pour U13 à U19, indiquez un âge entre 13 et 19 ans.');
    return undefined;
  }
  if (appSpace === 'men' || appSpace === 'women') {
    if (age < 16) return tr(t, 'signup.age.senior.min', 'Pour l’espace seniors, l’âge minimum est 16 ans.');
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

export function getPlayerVerificationChecks(appSpace: AppSpaceId, t?: TranslateFn) {
  const identity = {
    id: 'identity' as const,
    title: tr(t, 'verification.check.identity.title', 'Pièce d’identité'),
    subtitle: isUnderU13AppSpace(appSpace)
      ? tr(
          t,
          'verification.check.identity.u13Subtitle',
          'CNI du responsable ou livret de famille. Prise de vue caméra'
        )
      : tr(
          t,
          'verification.check.identity.subtitle',
          'CNI ou passeport. Photographiez avec la caméra'
        ),
    required: true,
  };
  if (isUnderU13AppSpace(appSpace)) return [identity];
  return [
    identity,
    {
      id: 'club_license' as const,
      title: tr(t, 'verification.check.license.title', 'Licence FFF'),
      subtitle: tr(
        t,
        'verification.check.license.subtitle',
        'Carte club ou attestation. Photographiez avec la caméra'
      ),
      required: false,
    },
  ];
}

export function getLaunchCopy(
  role: UserRole,
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean },
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.launch.emailValidated.title', 'Documents validés'),
      body: tr(
        t,
        'signup.launch.emailValidated.body',
        'L’IA a traité vos justificatifs. Confirmez votre email. Le lien vous attend dans votre boîte mail.'
      ),
      finishLabel: tr(t, 'signup.launch.emailValidated.finish', 'Compris'),
    };
  }
  if (
    (role === 'player' || ROLES_REQUIRING_VERIFICATION.includes(role) || role === 'physio') &&
    flags.verificationPending
  ) {
    return {
      title: tr(t, 'signup.launch.verification.title', 'Compte créé'),
      body: tr(
        t,
        'signup.launch.verification.body',
        'Prochaine étape après l’email : accès à votre espace dédié. Vos documents passent par l’analyse IA.'
      ),
      finishLabel: tr(t, 'signup.launch.verification.finish', 'Continuer'),
    };
  }
  return getRoleLaunchCopy(role, flags, t);
}

export function getAppSpaceGroups(
  genderOrWoman: boolean | import('../../models/User').Gender,
  t?: TranslateFn,
) {
  const gender =
    typeof genderOrWoman === 'boolean'
      ? genderOrWoman
        ? 'women'
        : 'men'
      : genderOrWoman;

  if (gender === 'minor') {
    return [
      {
        id: 'youth' as const,
        label: tr(t, 'signup.space.youth', 'Football jeunes'),
        icon: 'school' as const,
        options: [
          {
            id: 'boys' as AppSpaceId,
            label: tr(t, 'signup.space.boys', 'Garçons'),
            hint: tr(t, 'signup.space.boysHint', 'U13 à U19'),
          },
          {
            id: 'girls' as AppSpaceId,
            label: tr(t, 'signup.space.girls', 'Filles'),
            hint: tr(t, 'signup.space.girlsHint', 'U13 F à U19 F'),
          },
          {
            id: 'under_u13' as AppSpaceId,
            label: tr(t, 'signup.space.under13', 'Moins de 13 ans'),
            hint: tr(t, 'signup.space.under13Hint', 'U7 à U11'),
          },
        ],
      },
    ] as const;
  }

  if (gender === 'women') {
    return [
      {
        id: 'feminine' as const,
        label: tr(t, 'signup.space.woman.universe', 'Ton univers Woman'),
        icon: 'heart' as const,
        options: [
          {
            id: 'girls' as AppSpaceId,
            label: tr(t, 'signup.space.girls', 'Jeunes F'),
            hint: tr(t, 'signup.space.girlsHint', 'U13 F à U19 F'),
          },
          {
            id: 'women' as AppSpaceId,
            label: tr(t, 'signup.space.women', 'Seniors F'),
            hint: tr(t, 'signup.space.womenHint', 'D1 F, Régional'),
          },
        ],
      },
      {
        id: 'school' as const,
        label: tr(t, 'signup.space.footSchool', 'École de foot'),
        icon: 'school' as const,
        options: [
          {
            id: 'under_u13' as AppSpaceId,
            label: tr(t, 'signup.space.under13', 'Moins de 13 ans'),
            hint: tr(t, 'signup.space.under13Hint', 'U7 F, U9 F, U11 F'),
          },
        ],
      },
    ] as const;
  }
  return [
    {
      id: 'masculine' as const,
      label: tr(t, 'signup.space.masculine', 'Football masculin'),
      icon: 'football' as const,
      options: [
        {
          id: 'men' as AppSpaceId,
          label: tr(t, 'signup.space.men', 'Seniors'),
          hint: tr(t, 'signup.space.menHint', 'R1, National'),
        },
        {
          id: 'boys' as AppSpaceId,
          label: tr(t, 'signup.space.boys', 'Jeunes'),
          hint: tr(t, 'signup.space.boysHint', 'U13 à U19'),
        },
      ],
    },
    {
      id: 'school' as const,
      label: tr(t, 'signup.space.footSchool', 'École de foot'),
      icon: 'school' as const,
      options: [
        {
          id: 'under_u13' as AppSpaceId,
          label: tr(t, 'signup.space.under13M', 'Moins de 13 ans'),
          hint: tr(t, 'signup.space.under13MHint', 'U7, U9, U11'),
        },
      ],
    },
  ] as const;
}

export function getRoleGroups(t?: TranslateFn) {
  return [
    {
      id: 'sport',
      label: tr(t, 'signup.space.roleGroup.sport', 'Sportifs'),
      hint: tr(
        t,
        'signup.space.roleGroup.sportHint',
        'CV en ligne, stats et candidatures Mercato'
      ),
      roles: ['player'] as UserRole[],
    },
    {
      id: 'structure',
      label: tr(t, 'signup.space.roleGroup.structure', 'Structures'),
      hint: tr(
        t,
        'signup.space.roleGroup.structureHint',
        'Annonces club, effectifs et événements'
      ),
      roles: ['club', 'organizer'] as UserRole[],
    },
  ];
}

/** @deprecated Utiliser getAppSpaceGroups */
export const WOMAN_APP_SPACE_GROUPS = [
  {
    id: 'feminine' as const,
    label: 'Ton univers Woman',
    icon: 'heart' as const,
    options: [
      { id: 'girls' as AppSpaceId, label: 'Jeunes F', hint: 'U13 F à U19 F' },
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

/** Espaces inscription ProDay classique — sans football féminin (réservé à ProDay Woman). */
export const APP_SPACE_GROUPS = [
  {
    id: 'masculine' as const,
    label: 'Football masculin',
    icon: 'football' as const,
    options: [
      { id: 'men' as AppSpaceId, label: 'Seniors', hint: 'R1, National' },
      { id: 'boys' as AppSpaceId, label: 'Jeunes', hint: 'U13 à U19' },
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

import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_SANTE_BRAND } from '../../models/ProductLine';
import { getProStepMeta } from './signupProConfig';

export const SANTE_SIGNUP_PHASES = [
  { id: 'vous' as const, label: 'Cabinet' },
  { id: 'acces' as const, label: 'Compte' },
  { id: 'launch' as const, label: 'Go' },
];

export function getSanteWelcomeCopy() {
  return {
    title: `Bienvenue sur ${PRODAY_SANTE_BRAND.name}`,
    subtitle:
      'Kiné, médecin du sport, préparateur ou nutritionniste — un parcours dédié aux praticiens.',
  };
}

export function getSanteStepMeta(page: SignupPageId): {
  title: string;
  subtitle: string;
  heroIcon:
    | 'school'
    | 'briefcase'
    | 'search'
    | 'heart'
    | 'star-four-points'
    | 'business'
    | 'trophy'
    | 'person'
    | 'lock'
    | 'checkmark-circle';
  stepName?: string;
} {
  if (page === 'medical_specialty' || page === 'medical_practice') {
    const meta = getProStepMeta(page);
    return { ...meta, stepName: PRODAY_SANTE_BRAND.name };
  }
  switch (page) {
    case 'welcome':
      return {
        title: getSanteWelcomeCopy().title,
        subtitle: getSanteWelcomeCopy().subtitle,
        heroIcon: 'heart',
        stepName: PRODAY_SANTE_BRAND.name,
      };
    case 'account':
      return {
        title: 'Identité praticien',
        subtitle: 'Nom affiché et email — espace Santé lié à ce compte.',
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: 'Sécuriser l’accès',
        subtitle: 'Mot de passe robuste puis validation de vos diplômes.',
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: 'Espace Santé activé',
        subtitle: 'Votre profil cabinet est prêt.',
        heroIcon: 'checkmark-circle',
      };
    default:
      return {
        title: PRODAY_SANTE_BRAND.name,
        subtitle: PRODAY_SANTE_BRAND.shortTagline,
        heroIcon: 'heart',
      };
  }
}

export const SANTE_PHYSIO_PREVIEW = [
  'Spécialité & diplômes',
  'Zone d’intervention',
  'Visibilité clubs & joueurs',
];

export function getSanteLaunchCopy(flags: {
  emailVerificationPending?: boolean;
  verificationPending?: boolean;
}): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: 'Presque prêt',
      body: 'Confirmez votre email pour activer votre espace Pro Day Santé.',
      finishLabel: 'Entrer dans Pro Day Santé',
    };
  }
  if (flags.verificationPending) {
    return {
      title: 'Compte créé — vérification en cours',
      body: 'Votre dossier praticien sera validé sous 48 h. La messagerie complète s’ouvrira après contrôle.',
      finishLabel: 'Entrer dans Pro Day Santé',
    };
  }
  return {
    title: 'Compte Pro Day Santé créé',
    body: 'Accédez à votre agenda, à la messagerie patients et à l’annuaire clubs.',
    finishLabel: 'Entrer dans Pro Day Santé',
  };
}

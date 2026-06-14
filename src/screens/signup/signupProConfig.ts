import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_PRO_BRAND } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';

export const PRO_SIGNUP_PHASES = [
  { id: 'vous' as const, label: 'Métier' },
  { id: 'acces' as const, label: 'Compte' },
  { id: 'launch' as const, label: 'Go' },
];

export function getProWelcomeCopy(roleLabel = 'professionnel') {
  return {
    title: `Bienvenue sur ${PRODAY_PRO_BRAND.name}`,
    subtitle: `Choisissez votre métier — ${roleLabel}, réseau vérifié et outils pro.`,
  };
}

export function getProStepMeta(page: SignupPageId): {
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
  switch (page) {
    case 'welcome':
      return {
        title: getProWelcomeCopy().title,
        subtitle: getProWelcomeCopy().subtitle,
        heroIcon: 'school',
        stepName: PRODAY_PRO_BRAND.name,
      };
    case 'coach_pro':
      return {
        title: 'Profil coach',
        subtitle: 'Diplômes, effectif et annonces Mercato Pro.',
        heroIcon: 'school',
      };
    case 'agent_pro':
      return {
        title: 'Profil agent',
        subtitle: 'Mandats, repérage et réseau clubs professionnels.',
        heroIcon: 'briefcase',
      };
    case 'recruiter_pro':
      return {
        title: 'Profil recruteur',
        subtitle: 'Scouting, annonces Mercato et suivi candidatures.',
        heroIcon: 'search',
      };
    case 'club_pro':
      return {
        title: 'Profil club',
        subtitle: 'Structure, annonces recrutement et gestion effectif.',
        heroIcon: 'business',
      };
    case 'organizer_pro':
      return {
        title: 'Profil organisateur',
        subtitle: 'Détections et événements locaux.',
        heroIcon: 'trophy',
      };
    case 'medical_specialty':
      return {
        title: 'Spécialité santé',
        subtitle: 'Kiné, médecin, coach mental, nutrition…',
        heroIcon: 'heart',
      };
    case 'medical_practice':
      return {
        title: 'Zone d’intervention',
        subtitle: 'Ville, département et visibilité près des clubs.',
        heroIcon: 'heart',
      };
    case 'sponsor_pro':
      return {
        title: 'Profil partenaire',
        subtitle: 'Marque, territoire et offres de visibilité clubs.',
        heroIcon: 'star-four-points',
      };
    case 'account':
      return {
        title: 'Identité pro',
        subtitle: 'Nom affiché et email — espace Pro lié à ce compte.',
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: 'Sécuriser l’accès',
        subtitle: 'Mot de passe robuste puis validation métier.',
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: 'Espace Pro activé',
        subtitle: 'Votre profil professionnel est prêt.',
        heroIcon: 'checkmark-circle',
      };
    default:
      return {
        title: PRODAY_PRO_BRAND.name,
        subtitle: PRODAY_PRO_BRAND.shortTagline,
        heroIcon: 'school',
      };
  }
}

export const PRO_ROLE_PREVIEW: Partial<Record<UserRole, string[]>> = {
  coach: ['Diplômes & licence', 'Effectif & convocations', 'Annonces Mercato Pro'],
  agent: ['Profil agent vérifié', 'Mandats & repérage', 'Réseau clubs'],
  recruiter: ['Profil recruteur vérifié', 'Annonces Mercato Pro', 'Pipeline candidatures'],
  sponsor: ['Offre partenaire', 'Clubs cibles', 'Campagnes locales'],
  club: ['Structure club', 'Ville & département', 'Annonces Mercato Pro'],
  organizer: ['Structure orga', 'Zone d’action', 'Événements locaux'],
};

export function getProLaunchCopy(flags: {
  emailVerificationPending?: boolean;
  verificationPending?: boolean;
}): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: 'Presque prêt',
      body: 'Confirmez votre email pour activer votre espace Pro Day Pro.',
      finishLabel: 'Entrer dans Pro Day Pro',
    };
  }
  if (flags.verificationPending) {
    return {
      title: 'Compte créé — vérification en cours',
      body: 'Votre dossier métier sera validé sous 48 h. La messagerie s’ouvrira après contrôle.',
      finishLabel: 'Entrer dans Pro Day Pro',
    };
  }
  return {
    title: 'Compte Pro Day Pro créé',
    body: 'Accédez au Mercato Pro, à vos outils métier et à la messagerie sécurisée.',
    finishLabel: 'Entrer dans Pro Day Pro',
  };
}

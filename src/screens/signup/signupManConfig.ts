import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_HOMME_BRAND } from '../../models/ProductLine';

export const MAN_SIGNUP_PHASES = [
  { id: 'vous' as const, label: 'Profil' },
  { id: 'acces' as const, label: 'Compte' },
  { id: 'launch' as const, label: 'Go' },
];

export const MAN_PLAYER_PREVIEW_STEPS = [
  'Espace',
  'Fiche M',
  'Ville',
  'Stats',
  'Compte',
  'Accès',
] as const;

export function getManWelcomeCopy() {
  return {
    title: `Bienvenue sur ${PRODAY_HOMME_BRAND.name}`,
    subtitle:
      'Inscription joueur — CV en ligne, Mercato M, matchs et visibilité auprès des clubs.',
  };
}

export function getManStepMeta(page: SignupPageId): {
  title: string;
  subtitle: string;
  heroIcon:
    | 'football'
    | 'shirt'
    | 'location'
    | 'star'
    | 'shield'
    | 'person'
    | 'lock'
    | 'checkmark-circle';
  stepName?: string;
} {
  switch (page) {
    case 'welcome':
      return {
        title: getManWelcomeCopy().title,
        subtitle: getManWelcomeCopy().subtitle,
        heroIcon: 'football',
        stepName: PRODAY_HOMME_BRAND.name,
      };
    case 'space':
      return {
        title: 'Ton espace',
        subtitle: 'Garçons, U13, seniors M — tout le parcours est adapté à ton profil.',
        heroIcon: 'football',
      };
    case 'sport':
      return {
        title: 'Ta fiche joueur',
        subtitle: 'Poste, catégorie, niveau et âge — profil visible sur le Mercato M.',
        heroIcon: 'shirt',
      };
    case 'location':
      return {
        title: 'Où tu joues',
        subtitle: 'Ville et département pour les clubs et détections autour de chez toi.',
        heroIcon: 'location',
      };
    case 'stats':
      return {
        title: 'Tes stats',
        subtitle: 'Matchs, buts, passes — valorise ton CV foot.',
        heroIcon: 'star',
      };
    case 'family':
      return {
        title: 'Responsable légal',
        subtitle: 'Obligatoire pour les mineurs — conformité et sécurité Pro Day Man.',
        heroIcon: 'shield',
      };
    case 'account':
      return {
        title: 'Ton identité',
        subtitle: 'Nom affiché et email — ton espace Man sera lié à ce compte.',
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: 'Sécurise ton compte',
        subtitle: 'Mot de passe robuste, puis confirmation par email.',
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: 'Bienvenue dans Man',
        subtitle: 'Ton compte est prêt.',
        heroIcon: 'checkmark-circle',
      };
    default:
      return {
        title: PRODAY_HOMME_BRAND.name,
        subtitle: PRODAY_HOMME_BRAND.shortTagline,
        heroIcon: 'football',
      };
  }
}

export function getManLaunchCopy(flags: {
  emailVerificationPending?: boolean;
}): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: 'Presque prêt',
      body: 'Confirme ton email pour accéder au Mercato M, aux matchs et à ta messagerie.',
      finishLabel: 'Entrer dans Pro Day Man',
    };
  }
  return {
    title: 'Compte Pro Day Man créé',
    body: 'Explore le Mercato, tes matchs et ton profil joueur dès maintenant.',
    finishLabel: 'Entrer dans Pro Day Man',
  };
}

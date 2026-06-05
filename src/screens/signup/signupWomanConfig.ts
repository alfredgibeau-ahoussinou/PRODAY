import type { AppSpaceId } from '../../models/AppSpace';
import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_WOMAN_BRAND } from '../../models/ProductLine';

export const WOMAN_SIGNUP_PHASES = [
  { id: 'vous' as const, label: 'Profil' },
  { id: 'acces' as const, label: 'Compte' },
  { id: 'launch' as const, label: 'Go' },
];

export function suggestFeminineAppSpaceFromAge(age: number): AppSpaceId {
  if (age < 13) return 'under_u13';
  if (age >= 20) return 'women';
  return 'girls';
}

export function getWomanWelcomeCopy() {
  return {
    title: `Bienvenue sur ${PRODAY_WOMAN_BRAND.name}`,
    subtitle:
      'Inscription joueuse — CV en ligne, Mercato F, matchs, covoiturage, pôle santé et visibilité auprès des clubs.',
  };
}

export function getWomanStepMeta(page: SignupPageId): {
  title: string;
  subtitle: string;
  heroIcon: 'heart' | 'football' | 'shirt' | 'location' | 'star' | 'shield' | 'person' | 'lock' | 'checkmark-circle';
  stepName?: string;
} {
  switch (page) {
    case 'welcome':
      return {
        title: getWomanWelcomeCopy().title,
        subtitle: getWomanWelcomeCopy().subtitle,
        heroIcon: 'heart',
        stepName: PRODAY_WOMAN_BRAND.name,
      };
    case 'space':
      return {
        title: 'Ta catégorie',
        subtitle: 'Jeunes F, -13 ans, seniors F — tout le parcours est adapté à ton profil.',
        heroIcon: 'heart',
      };
    case 'sport':
      return {
        title: 'Ta fiche joueuse',
        subtitle: 'Poste, catégorie F, niveau et âge — profil visible sur le Mercato Woman.',
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
        subtitle: 'Matchs, buts, passes — valorise ton profil joueuse.',
        heroIcon: 'star',
      };
    case 'family':
      return {
        title: 'Responsable légal',
        subtitle: 'Obligatoire pour les mineures — conformité et sécurité ProDay Woman.',
        heroIcon: 'shield',
      };
    case 'account':
      return {
        title: 'Ton identité',
        subtitle: 'Nom affiché et email — ton espace Woman sera lié à ce compte.',
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
        title: 'Bienvenue dans Woman',
        subtitle: 'Ton compte est prêt.',
        heroIcon: 'checkmark-circle',
      };
    default:
      return {
        title: PRODAY_WOMAN_BRAND.name,
        subtitle: PRODAY_WOMAN_BRAND.shortTagline,
        heroIcon: 'heart',
      };
  }
}

export function getWomanLaunchCopy(flags: {
  emailVerificationPending?: boolean;
}): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: 'Presque prête',
      body: 'Confirme ton email pour accéder au Mercato Woman, aux matchs et à ta messagerie.',
      finishLabel: 'Entrer dans ProDay Woman',
    };
  }
  return {
    title: 'Compte ProDay Woman créé',
    body: 'Explore le Mercato féminin, tes matchs et ton profil joueuse dès maintenant.',
    finishLabel: 'Entrer dans ProDay Woman',
  };
}

export const WOMAN_PLAYER_PREVIEW_STEPS = [
  'Catégorie',
  'Fiche F',
  'Ville',
  'Stats',
  'Compte',
  'Accès',
] as const;

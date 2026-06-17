import type { AppSpaceId } from '../../models/AppSpace';
import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_WOMAN_BRAND } from '../../models/ProductLine';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';

export function getWomanSignupPhases(t?: TranslateFn) {
  return [
    { id: 'vous' as const, label: tr(t, 'signup.phase.profile', 'Profil') },
    { id: 'acces' as const, label: tr(t, 'signup.phase.account', 'Compte') },
    { id: 'launch' as const, label: tr(t, 'signup.phase.launch', 'Go') },
  ];
}

export const WOMAN_SIGNUP_PHASES = getWomanSignupPhases();

export function suggestFeminineAppSpaceFromAge(age: number): AppSpaceId {
  if (age < 13) return 'under_u13';
  if (age >= 20) return 'women';
  return 'girls';
}

export function getWomanWelcomeCopy(t?: TranslateFn) {
  return {
    title: t
      ? t('signup.woman.welcome.title', { brand: PRODAY_WOMAN_BRAND.name })
      : `Bienvenue sur ${PRODAY_WOMAN_BRAND.name}`,
    subtitle: tr(
      t,
      'signup.woman.welcome.subtitle',
      'Inscription joueuse — CV en ligne, Mercato F, matchs, covoiturage, pôle santé et visibilité auprès des clubs.'
    ),
  };
}

export function getWomanStepMeta(page: SignupPageId, t?: TranslateFn): {
  title: string;
  subtitle: string;
  heroIcon: 'heart' | 'football' | 'shirt' | 'location' | 'star' | 'shield' | 'person' | 'lock' | 'checkmark-circle';
  stepName?: string;
} {
  switch (page) {
    case 'welcome':
      return {
        title: getWomanWelcomeCopy(t).title,
        subtitle: getWomanWelcomeCopy(t).subtitle,
        heroIcon: 'heart',
        stepName: PRODAY_WOMAN_BRAND.name,
      };
    case 'space':
      return {
        title: tr(t, 'signup.woman.step.space.title', 'Ta catégorie'),
        subtitle: tr(
          t,
          'signup.woman.step.space.subtitle',
          'Jeunes F, -13 ans, seniors F — tout le parcours est adapté à ton profil.'
        ),
        heroIcon: 'heart',
      };
    case 'sport':
      return {
        title: tr(t, 'signup.woman.step.sport.title', 'Ta fiche joueuse'),
        subtitle: tr(
          t,
          'signup.woman.step.sport.subtitle',
          'Poste, catégorie F, niveau et âge — profil visible sur le Mercato Woman.'
        ),
        heroIcon: 'shirt',
      };
    case 'location':
      return {
        title: tr(t, 'signup.woman.step.location.title', 'Où tu joues'),
        subtitle: tr(
          t,
          'signup.woman.step.location.subtitle',
          'Ville et département pour les clubs et détections autour de chez toi.'
        ),
        heroIcon: 'location',
      };
    case 'stats':
      return {
        title: tr(t, 'signup.woman.step.stats.title', 'Tes stats'),
        subtitle: tr(
          t,
          'signup.woman.step.stats.subtitle',
          'Matchs, buts, passes — valorise ton profil joueuse.'
        ),
        heroIcon: 'star',
      };
    case 'family':
      return {
        title: tr(t, 'signup.woman.step.family.title', 'Responsable légal'),
        subtitle: tr(
          t,
          'signup.woman.step.family.subtitle',
          'Obligatoire pour les mineures — conformité et sécurité ProDay Woman.'
        ),
        heroIcon: 'shield',
      };
    case 'account':
      return {
        title: tr(t, 'signup.woman.step.account.title', 'Ton identité'),
        subtitle: tr(
          t,
          'signup.woman.step.account.subtitle',
          'Nom affiché et email — ton espace Woman sera lié à ce compte.'
        ),
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: tr(t, 'signup.woman.step.security.title', 'Sécurise ton compte'),
        subtitle: tr(
          t,
          'signup.woman.step.security.subtitle',
          'Mot de passe robuste, puis confirmation par email.'
        ),
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: tr(t, 'signup.woman.step.launch.title', 'Bienvenue dans Woman'),
        subtitle: tr(t, 'signup.woman.step.launch.subtitle', 'Ton compte est prêt.'),
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

export function getWomanLaunchCopy(
  flags: { emailVerificationPending?: boolean },
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.woman.launch.email.title', 'Presque prête'),
      body: tr(
        t,
        'signup.woman.launch.email.body',
        'Confirme ton email pour accéder au Mercato Woman, aux matchs et à ta messagerie.'
      ),
      finishLabel: tr(t, 'signup.woman.launch.email.finish', 'Entrer dans ProDay Woman'),
    };
  }
  return {
    title: tr(t, 'signup.woman.launch.done.title', 'Compte ProDay Woman créé'),
    body: tr(
      t,
      'signup.woman.launch.done.body',
      'Explore le Mercato féminin, tes matchs et ton profil joueuse dès maintenant.'
    ),
    finishLabel: tr(t, 'signup.woman.launch.done.finish', 'Entrer dans ProDay Woman'),
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

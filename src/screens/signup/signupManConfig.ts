import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_HOMME_BRAND } from '../../models/ProductLine';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';

export function getManSignupPhases(t?: TranslateFn) {
  return [
    { id: 'vous' as const, label: tr(t, 'signup.phase.profile', 'Profil') },
    { id: 'acces' as const, label: tr(t, 'signup.phase.account', 'Compte') },
    { id: 'launch' as const, label: tr(t, 'signup.phase.launch', 'Go') },
  ];
}

export const MAN_SIGNUP_PHASES = getManSignupPhases();

export const MAN_PLAYER_PREVIEW_STEPS = [
  'Espace',
  'Fiche M',
  'Ville',
  'Stats',
  'Compte',
  'Accès',
] as const;

export function getManWelcomeCopy(t?: TranslateFn) {
  return {
    title: t
      ? t('signup.man.welcome.title', { brand: PRODAY_HOMME_BRAND.name })
      : `Bienvenue sur ${PRODAY_HOMME_BRAND.name}`,
    subtitle: tr(
      t,
      'signup.man.welcome.subtitle',
      'Inscription joueur — CV en ligne, Mercato M, matchs et visibilité auprès des clubs.'
    ),
  };
}

export function getManStepMeta(page: SignupPageId, t?: TranslateFn): {
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
        title: getManWelcomeCopy(t).title,
        subtitle: getManWelcomeCopy(t).subtitle,
        heroIcon: 'football',
        stepName: PRODAY_HOMME_BRAND.name,
      };
    case 'space':
      return {
        title: tr(t, 'signup.man.step.space.title', 'Ton espace'),
        subtitle: tr(
          t,
          'signup.man.step.space.subtitle',
          'Garçons, U13, seniors M — tout le parcours est adapté à ton profil.'
        ),
        heroIcon: 'football',
      };
    case 'sport':
      return {
        title: tr(t, 'signup.man.step.sport.title', 'Ta fiche joueur'),
        subtitle: tr(
          t,
          'signup.man.step.sport.subtitle',
          'Poste, catégorie, niveau et âge — profil visible sur le Mercato M.'
        ),
        heroIcon: 'shirt',
      };
    case 'location':
      return {
        title: tr(t, 'signup.man.step.location.title', 'Où tu joues'),
        subtitle: tr(
          t,
          'signup.man.step.location.subtitle',
          'Ville et département pour les clubs et détections autour de chez toi.'
        ),
        heroIcon: 'location',
      };
    case 'stats':
      return {
        title: tr(t, 'signup.man.step.stats.title', 'Tes stats'),
        subtitle: tr(
          t,
          'signup.man.step.stats.subtitle',
          'Matchs, buts, passes — valorise ton CV foot.'
        ),
        heroIcon: 'star',
      };
    case 'family':
      return {
        title: tr(t, 'signup.man.step.family.title', 'Responsable légal'),
        subtitle: tr(
          t,
          'signup.man.step.family.subtitle',
          'Obligatoire pour les mineurs — conformité et sécurité Pro Day Man.'
        ),
        heroIcon: 'shield',
      };
    case 'account':
      return {
        title: tr(t, 'signup.man.step.account.title', 'Ton identité'),
        subtitle: tr(
          t,
          'signup.man.step.account.subtitle',
          'Nom affiché et email — ton espace Man sera lié à ce compte.'
        ),
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: tr(t, 'signup.man.step.security.title', 'Sécurise ton compte'),
        subtitle: tr(
          t,
          'signup.man.step.security.subtitle',
          'Mot de passe robuste, puis confirmation par email.'
        ),
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: tr(t, 'signup.man.step.launch.title', 'Bienvenue dans Man'),
        subtitle: tr(t, 'signup.man.step.launch.subtitle', 'Ton compte est prêt.'),
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

export function getManLaunchCopy(
  flags: { emailVerificationPending?: boolean },
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.man.launch.email.title', 'Presque prêt'),
      body: tr(
        t,
        'signup.man.launch.email.body',
        'Confirme ton email pour accéder au Mercato M, aux matchs et à ta messagerie.'
      ),
      finishLabel: tr(t, 'signup.man.launch.email.finish', 'Entrer dans Pro Day Man'),
    };
  }
  return {
    title: tr(t, 'signup.man.launch.done.title', 'Compte Pro Day Man créé'),
    body: tr(
      t,
      'signup.man.launch.done.body',
      'Depuis ton profil, envoie ta pièce d’identité pour débloquer la navigation et la messagerie.'
    ),
    finishLabel: tr(t, 'signup.man.launch.done.finish', 'Aller à mon profil'),
  };
}

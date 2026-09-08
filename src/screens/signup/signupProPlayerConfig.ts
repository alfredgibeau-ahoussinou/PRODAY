import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_PRO_PLAYER_BRAND } from '../../models/ProductLine';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';

export function getProPlayerSignupPhases(t?: TranslateFn) {
  return [
    { id: 'vous' as const, label: tr(t, 'signup.phase.profile', 'Profil') },
    { id: 'acces' as const, label: tr(t, 'signup.phase.account', 'Compte') },
    { id: 'launch' as const, label: tr(t, 'signup.phase.launch', 'Go') },
  ];
}

export const PRO_PLAYER_SIGNUP_PHASES = getProPlayerSignupPhases();

export function getProPlayerWelcomeCopy(t?: TranslateFn) {
  return {
    title: t
      ? t('signup.proPlayer.welcome.title', { brand: PRODAY_PRO_PLAYER_BRAND.name })
      : `Bienvenue sur ${PRODAY_PRO_PLAYER_BRAND.name}`,
    subtitle: tr(
      t,
      'signup.proPlayer.welcome.subtitle',
      'Inscription joueur pro. Carrière, portfolio vidéo et opportunités vérifiées.',
    ),
  };
}

export function getProPlayerStepMeta(
  page: SignupPageId,
  t?: TranslateFn,
): {
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
    | 'checkmark-circle'
    | 'briefcase';
  stepName?: string;
} {
  switch (page) {
    case 'welcome':
      return {
        title: getProPlayerWelcomeCopy(t).title,
        subtitle: getProPlayerWelcomeCopy(t).subtitle,
        heroIcon: 'briefcase',
        stepName: PRODAY_PRO_PLAYER_BRAND.name,
      };
    case 'space':
      return {
        title: tr(t, 'signup.proPlayer.step.space.title', 'Ton profil'),
        subtitle: tr(
          t,
          'signup.proPlayer.step.space.subtitle',
          'Homme ou femme. Parcours et visibilité adaptés au foot pro.',
        ),
        heroIcon: 'person',
      };
    case 'sport':
      return {
        title: tr(t, 'signup.proPlayer.step.sport.title', 'Affiliation FFF'),
        subtitle: tr(
          t,
          'signup.proPlayer.step.sport.subtitle',
          'Club et catégorie officiels DOFA. Aucune liste inventée.',
        ),
        heroIcon: 'shield',
      };
    case 'location':
      return {
        title: tr(t, 'signup.proPlayer.step.location.title', 'Ta zone'),
        subtitle: tr(
          t,
          'signup.proPlayer.step.location.subtitle',
          'Ville et département. Opportunités géolocalisées.',
        ),
        heroIcon: 'location',
      };
    case 'stats':
      return {
        title: tr(t, 'signup.proPlayer.step.stats.title', 'Ta saison'),
        subtitle: tr(
          t,
          'signup.proPlayer.step.stats.subtitle',
          'Stats validées coach. Crédibilité auprès des clubs.',
        ),
        heroIcon: 'star',
      };
    case 'account':
      return {
        title: tr(t, 'signup.proPlayer.step.account.title', 'Ton compte'),
        subtitle: tr(
          t,
          'signup.proPlayer.step.account.subtitle',
          'Email et identité. Accès sécurisé à ton espace pro.',
        ),
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: tr(t, 'signup.proPlayer.step.security.title', 'Sécurité'),
        subtitle: tr(
          t,
          'signup.proPlayer.step.security.subtitle',
          'Mot de passe robuste pour protéger ton profil sportif.',
        ),
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: tr(t, 'signup.proPlayer.step.launch.title', 'C’est parti'),
        subtitle: tr(
          t,
          'signup.proPlayer.step.launch.subtitle',
          'Ton espace Pro Joueur est prêt. Bonne saison.',
        ),
        heroIcon: 'checkmark-circle',
      };
    default:
      return {
        title: PRODAY_PRO_PLAYER_BRAND.name,
        subtitle: PRODAY_PRO_PLAYER_BRAND.tagline,
        heroIcon: 'briefcase',
      };
  }
}

export function getProPlayerLaunchCopy(
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean },
  t?: TranslateFn,
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.launch.emailValidated.title', 'Documents validés'),
      body: tr(
        t,
        'signup.launch.emailValidated.body',
        'Confirmez votre email. Le lien vous attend dans votre boîte mail.',
      ),
      finishLabel: tr(t, 'signup.launch.emailValidated.finish', 'Compris'),
    };
  }
  if (flags.verificationPending) {
    return {
      title: tr(t, 'signup.proPlayer.launch.pending.title', 'Profil en validation'),
      body: tr(
        t,
        'signup.proPlayer.launch.pending.body',
        'Votre espace Pro Joueur sera actif après vérification de votre profil.',
      ),
      finishLabel: tr(t, 'signup.launch.finish', 'Entrer dans l’app'),
    };
  }
  return {
    title: tr(t, 'signup.proPlayer.launch.title', 'Bienvenue Pro Joueur'),
    body: tr(
      t,
      'signup.proPlayer.launch.body',
      'Carrière, portfolio et opportunités pro. Votre saison commence maintenant.',
    ),
    finishLabel: tr(t, 'signup.launch.finish', 'Entrer dans l’app'),
  };
}

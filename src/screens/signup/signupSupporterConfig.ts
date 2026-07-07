import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_SUPPORTER_BRAND } from '../../models/ProductLine';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';

export function getSupporterSignupPhases(t?: TranslateFn) {
  return [
    { id: 'vous' as const, label: tr(t, 'signup.supporter.phase.profile', 'Profil') },
    { id: 'acces' as const, label: tr(t, 'signup.phase.account', 'Compte') },
    { id: 'launch' as const, label: tr(t, 'signup.phase.launch', 'Go') },
  ];
}

export const SUPPORTER_SIGNUP_PHASES = getSupporterSignupPhases();

export function getSupporterWelcomeCopy(t?: TranslateFn) {
  return {
    title: t
      ? t('signup.supporter.welcome.title', { brand: PRODAY_SUPPORTER_BRAND.name })
      : `Bienvenue sur ${PRODAY_SUPPORTER_BRAND.name}`,
    subtitle: tr(
      t,
      'signup.supporter.welcome.subtitle',
      'Fans et communauté — matchs, réels et fil en direct.'
    ),
  };
}

export function getSupporterStepMeta(page: SignupPageId, t?: TranslateFn): {
  title: string;
  subtitle: string;
  heroIcon: 'school' | 'person' | 'lock' | 'checkmark-circle' | 'star-four-points';
  stepName?: string;
} {
  switch (page) {
    case 'welcome':
      return {
        title: getSupporterWelcomeCopy(t).title,
        subtitle: getSupporterWelcomeCopy(t).subtitle,
        heroIcon: 'star-four-points',
        stepName: PRODAY_SUPPORTER_BRAND.name,
      };
    case 'account':
      return {
        title: tr(t, 'signup.supporter.step.account.title', 'Identité supporter'),
        subtitle: tr(
          t,
          'signup.supporter.step.account.subtitle',
          'Nom affiché et email — espace Supporter lié à ce compte.'
        ),
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: tr(t, 'signup.supporter.step.security.title', 'Sécuriser l’accès'),
        subtitle: tr(
          t,
          'signup.supporter.step.security.subtitle',
          'Mot de passe robuste pour rejoindre la tribune.'
        ),
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: tr(t, 'signup.supporter.step.launch.title', 'Espace Supporter activé'),
        subtitle: tr(t, 'signup.supporter.step.launch.subtitle', 'Votre tribune est prête.'),
        heroIcon: 'checkmark-circle',
      };
    default:
      return {
        title: PRODAY_SUPPORTER_BRAND.name,
        subtitle: PRODAY_SUPPORTER_BRAND.shortTagline,
        heroIcon: 'star-four-points',
      };
  }
}

export const SUPPORTER_PREVIEW = [
  'Profil supporter',
  'Clubs favoris',
  'Compte',
  'Accès',
] as const;

export function getSupporterLaunchCopy(
  flags: { emailVerificationPending?: boolean },
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.supporter.launch.email.title', 'Presque prêt'),
      body: tr(
        t,
        'signup.supporter.launch.email.body',
        'Confirmez votre email pour activer votre espace Pro Day Supporter.'
      ),
      finishLabel: tr(t, 'signup.supporter.launch.email.finish', 'Entrer dans Pro Day Supporter'),
    };
  }
  return {
    title: tr(t, 'signup.supporter.launch.done.title', 'Bienvenue en tribune'),
    body: tr(
      t,
      'signup.supporter.launch.done.body',
      'Votre espace supporter est prêt — matchs, réels et fil communautaire.'
    ),
    finishLabel: tr(t, 'signup.supporter.launch.done.finish', 'Entrer dans l’app'),
  };
}

import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_SANTE_BRAND } from '../../models/ProductLine';
import { getProStepMeta } from './signupProConfig';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';

export function getSanteSignupPhases(t?: TranslateFn) {
  return [
    { id: 'vous' as const, label: tr(t, 'signup.sante.phase.cabinet', 'Cabinet') },
    { id: 'acces' as const, label: tr(t, 'signup.phase.account', 'Compte') },
    { id: 'launch' as const, label: tr(t, 'signup.phase.launch', 'Go') },
  ];
}

export const SANTE_SIGNUP_PHASES = getSanteSignupPhases();

export function getSanteWelcomeCopy(t?: TranslateFn) {
  return {
    title: t
      ? t('signup.sante.welcome.title', { brand: PRODAY_SANTE_BRAND.name })
      : `Bienvenue sur ${PRODAY_SANTE_BRAND.name}`,
    subtitle: tr(
      t,
      'signup.sante.welcome.subtitle',
      'Kiné, ostéo, médecin du sport, prépa, coach mental, nutritionniste ou podologue — un parcours dédié aux praticiens.'
    ),
  };
}

export function getSanteStepMeta(page: SignupPageId, t?: TranslateFn): {
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
    const meta = getProStepMeta(page, t);
    return { ...meta, stepName: PRODAY_SANTE_BRAND.name };
  }
  switch (page) {
    case 'welcome':
      return {
        title: getSanteWelcomeCopy(t).title,
        subtitle: getSanteWelcomeCopy(t).subtitle,
        heroIcon: 'heart',
        stepName: PRODAY_SANTE_BRAND.name,
      };
    case 'account':
      return {
        title: tr(t, 'signup.sante.step.account.title', 'Identité praticien'),
        subtitle: tr(t, 'signup.sante.step.account.subtitle', 'Nom affiché et email — espace Santé lié à ce compte.'),
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: tr(t, 'signup.sante.step.security.title', 'Sécuriser l’accès'),
        subtitle: tr(t, 'signup.sante.step.security.subtitle', 'Mot de passe robuste puis validation de vos diplômes.'),
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: tr(t, 'signup.sante.step.launch.title', 'Espace Santé activé'),
        subtitle: tr(t, 'signup.sante.step.launch.subtitle', 'Votre profil cabinet est prêt.'),
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
  'Choisir votre spécialité',
  'Cabinet & zone d’intervention',
  'Visibilité clubs & joueurs',
];

export function getSanteLaunchCopy(
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean },
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.sante.launch.email.title', 'Presque prêt'),
      body: tr(t, 'signup.sante.launch.email.body', 'Confirmez votre email pour activer votre espace Pro Day Santé.'),
      finishLabel: tr(t, 'signup.sante.launch.email.finish', 'Entrer dans Pro Day Santé'),
    };
  }
  if (flags.verificationPending) {
    return {
      title: tr(t, 'signup.sante.launch.verify.title', 'Compte créé — vérification requise'),
      body: tr(
        t,
        'signup.sante.launch.verify.body',
        'Depuis votre profil, photographiez votre justificatif pour accéder à l’application.'
      ),
      finishLabel: tr(t, 'signup.sante.launch.verify.finish', 'Aller à mon profil'),
    };
  }
  return {
    title: tr(t, 'signup.sante.launch.done.title', 'Compte Pro Day Santé créé'),
    body: tr(
      t,
      'signup.sante.launch.done.body',
      'Depuis votre profil, complétez la vérification pour débloquer l’application.'
    ),
    finishLabel: tr(t, 'signup.sante.launch.done.finish', 'Aller à mon profil'),
  };
}

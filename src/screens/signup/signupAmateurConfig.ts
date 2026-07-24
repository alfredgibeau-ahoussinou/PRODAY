import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_AMATEUR_BRAND } from '../../models/ProductLine';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';
import type { UserRole } from '../../models/User';

export function getAmateurSignupPhases(t?: TranslateFn) {
  return [
    { id: 'vous' as const, label: tr(t, 'signup.amateur.phase.profile', 'Profil') },
    { id: 'acces' as const, label: tr(t, 'signup.phase.account', 'Compte') },
    { id: 'launch' as const, label: tr(t, 'signup.phase.launch', 'Go') },
  ];
}

export const AMATEUR_SIGNUP_PHASES = getAmateurSignupPhases();

export const AMATEUR_PLAYER_PREVIEW = [
  'Espace M/F',
  'Fiche joueur',
  'Ville',
  'Stats',
  'Compte',
  'Accès',
] as const;

export const AMATEUR_COACH_PREVIEW = [
  'Profil coach amateur',
  'Identité',
  'Accès',
] as const;

export function getAmateurWelcomeCopy(t?: TranslateFn) {
  return {
    title: t
      ? t('signup.amateur.welcome.title', { brand: PRODAY_AMATEUR_BRAND.name })
      : `Bienvenue sur ${PRODAY_AMATEUR_BRAND.name}`,
    subtitle: t
      ? t('signup.amateur.welcome.subtitle')
      : 'Joueur ou coach amateur. Mercato local, matchs et effectif.',
  };
}

export function getAmateurStepMeta(page: SignupPageId, t?: TranslateFn): {
  title: string;
  subtitle: string;
  heroIcon: 'school' | 'person' | 'lock' | 'checkmark-circle' | 'shirt' | 'location' | 'star' | 'shield';
  stepName?: string;
} {
  switch (page) {
    case 'welcome':
      return {
        title: getAmateurWelcomeCopy(t).title,
        subtitle: getAmateurWelcomeCopy(t).subtitle,
        heroIcon: 'school',
        stepName: PRODAY_AMATEUR_BRAND.name,
      };
    case 'space':
      return {
        title: tr(t, 'signup.amateur.step.space.title', 'Votre genre et votre espace foot'),
        subtitle: tr(
          t,
          'signup.amateur.step.space.subtitle',
          'Genre, catégorie d’âge. Mercato Amateur et matchs adaptés.'
        ),
        heroIcon: 'person',
      };
    case 'sport':
      return {
        title: tr(t, 'signup.amateur.step.sport.title', 'Votre fiche joueur'),
        subtitle: tr(
          t,
          'signup.amateur.step.sport.subtitle',
          'Poste, catégorie, niveau et âge. Profil visible sur le Mercato Amateur.'
        ),
        heroIcon: 'shirt',
      };
    case 'location':
      return {
        title: tr(t, 'signup.amateur.step.location.title', 'Où vous jouez'),
        subtitle: tr(
          t,
          'signup.amateur.step.location.subtitle',
          'Ville et département pour votre club et les détections locales.'
        ),
        heroIcon: 'location',
      };
    case 'stats':
      return {
        title: tr(t, 'signup.amateur.step.stats.title', 'Vos stats'),
        subtitle: tr(
          t,
          'signup.amateur.step.stats.subtitle',
          'Matchs, buts, passes. Initialisation, puis validées par votre coach.'
        ),
        heroIcon: 'star',
      };
    case 'family':
      return {
        title: tr(t, 'signup.amateur.step.family.title', 'Responsable légal'),
        subtitle: tr(
          t,
          'signup.amateur.step.family.subtitle',
          'Obligatoire pour les mineurs. Conformité et sécurité Pro Day Amateur.'
        ),
        heroIcon: 'shield',
      };
    case 'coach_pro':
      return {
        title: tr(t, 'signup.amateur.step.coach.title', 'Profil coach amateur'),
        subtitle: tr(
          t,
          'signup.amateur.step.coach.subtitle',
          'Club, catégorie et zone. Encadrement amateur et district.'
        ),
        heroIcon: 'school',
      };
    case 'account':
      return {
        title: tr(t, 'signup.amateur.step.account.title', 'Votre identité'),
        subtitle: tr(
          t,
          'signup.amateur.step.account.subtitle',
          'Nom affiché et email. Votre espace Amateur sera lié à ce compte.'
        ),
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: tr(t, 'signup.amateur.step.security.title', 'Sécurisez votre compte'),
        subtitle: tr(
          t,
          'signup.amateur.step.security.subtitle',
          'Mot de passe robuste, puis confirmation par email.'
        ),
        heroIcon: 'lock',
      };
    default:
      return {
        title: getAmateurWelcomeCopy(t).title,
        subtitle: getAmateurWelcomeCopy(t).subtitle,
        heroIcon: 'school',
      };
  }
}

export function getAmateurLaunchCopy(
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean },
  role: UserRole,
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  const isCoach = role === 'coach';
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
  if (flags.verificationPending) {
    return {
      title: isCoach
        ? tr(t, 'signup.amateur.launch.verification.title', 'Compte coach créé')
        : tr(t, 'signup.amateur.launch.player.verification.title', 'Compte joueur créé'),
      body: isCoach
        ? tr(
            t,
            'signup.amateur.launch.verification.body',
            'Après confirmation email : accès à votre banc technique amateur. Effectif et convocations.'
          )
        : tr(
            t,
            'signup.amateur.launch.player.verification.body',
            'Après confirmation email : accès à votre cockpit joueur amateur. Mercato et matchs.'
          ),
      finishLabel: tr(t, 'signup.launch.verification.finish', 'Continuer'),
    };
  }
  return {
    title: isCoach
      ? tr(t, 'signup.amateur.launch.ready.title', 'Bienvenue coach')
      : tr(t, 'signup.amateur.launch.player.ready.title', 'Bienvenue joueur'),
    body: isCoach
      ? tr(
          t,
          'signup.amateur.launch.ready.body',
          'Votre espace amateur est prêt. Gérez votre effectif et suivez le Mercato local.'
        )
      : tr(
          t,
          'signup.amateur.launch.player.ready.body',
          'Votre espace amateur est prêt. CV en ligne, Mercato Amateur et convocations.'
        ),
    finishLabel: tr(t, 'signup.launch.ready.finish', 'Entrer dans l’app'),
  };
}

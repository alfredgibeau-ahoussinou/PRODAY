import type { SignupPageId } from './signupFlowConfig';
import { PRODAY_PRO_BRAND } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';

export function getProSignupPhases(t?: TranslateFn) {
  return [
    { id: 'vous' as const, label: tr(t, 'signup.pro.phase.job', 'Métier') },
    { id: 'acces' as const, label: tr(t, 'signup.phase.account', 'Compte') },
    { id: 'launch' as const, label: tr(t, 'signup.phase.launch', 'Go') },
  ];
}

export const PRO_SIGNUP_PHASES = getProSignupPhases();

export function getProWelcomeCopy(roleLabel = 'professionnel', t?: TranslateFn) {
  return {
    title: t
      ? t('signup.pro.welcome.title', { brand: PRODAY_PRO_BRAND.name })
      : `Bienvenue sur ${PRODAY_PRO_BRAND.name}`,
    subtitle: t
      ? t('signup.pro.welcome.subtitle', { role: roleLabel })
      : `Choisissez votre métier — ${roleLabel}, réseau vérifié et outils pro.`,
  };
}

export function getProStepMeta(page: SignupPageId, t?: TranslateFn): {
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
        title: getProWelcomeCopy('professionnel', t).title,
        subtitle: getProWelcomeCopy('professionnel', t).subtitle,
        heroIcon: 'school',
        stepName: PRODAY_PRO_BRAND.name,
      };
    case 'coach_pro':
      return {
        title: tr(t, 'signup.pro.step.coach.title', 'Profil coach'),
        subtitle: tr(t, 'signup.pro.step.coach.subtitle', 'Diplômes, effectif et annonces Mercato Pro.'),
        heroIcon: 'school',
      };
    case 'agent_pro':
      return {
        title: tr(t, 'signup.pro.step.agent.title', 'Profil agent'),
        subtitle: tr(t, 'signup.pro.step.agent.subtitle', 'Mandats, repérage et réseau clubs professionnels.'),
        heroIcon: 'briefcase',
      };
    case 'recruiter_pro':
      return {
        title: tr(t, 'signup.pro.step.recruiter.title', 'Profil recruteur'),
        subtitle: tr(t, 'signup.pro.step.recruiter.subtitle', 'Scouting, annonces Mercato et suivi candidatures.'),
        heroIcon: 'search',
      };
    case 'club_pro':
      return {
        title: tr(t, 'signup.pro.step.club.title', 'Profil club'),
        subtitle: tr(t, 'signup.pro.step.club.subtitle', 'Structure, annonces recrutement et gestion effectif.'),
        heroIcon: 'business',
      };
    case 'organizer_pro':
      return {
        title: tr(t, 'signup.pro.step.organizer.title', 'Profil organisateur'),
        subtitle: tr(t, 'signup.pro.step.organizer.subtitle', 'Détections et événements locaux.'),
        heroIcon: 'trophy',
      };
    case 'medical_specialty':
      return {
        title: tr(t, 'signup.pro.step.medicalSpecialty.title', 'Spécialité santé'),
        subtitle: tr(t, 'signup.pro.step.medicalSpecialty.subtitle', 'Kiné, médecin, coach mental, nutrition…'),
        heroIcon: 'heart',
      };
    case 'medical_practice':
      return {
        title: tr(t, 'signup.pro.step.medicalPractice.title', 'Zone d’intervention'),
        subtitle: tr(t, 'signup.pro.step.medicalPractice.subtitle', 'Ville, département et visibilité près des clubs.'),
        heroIcon: 'heart',
      };
    case 'sponsor_pro':
      return {
        title: tr(t, 'signup.pro.step.sponsor.title', 'Profil sponsor'),
        subtitle: tr(t, 'signup.pro.step.sponsor.subtitle', 'Marque, territoire et offres de visibilité clubs.'),
        heroIcon: 'star-four-points',
      };
    case 'account':
      return {
        title: tr(t, 'signup.pro.step.account.title', 'Identité pro'),
        subtitle: tr(t, 'signup.pro.step.account.subtitle', 'Nom affiché et email — espace Pro lié à ce compte.'),
        heroIcon: 'person',
      };
    case 'security':
      return {
        title: tr(t, 'signup.pro.step.security.title', 'Sécuriser l’accès'),
        subtitle: tr(t, 'signup.pro.step.security.subtitle', 'Mot de passe robuste puis validation métier.'),
        heroIcon: 'lock',
      };
    case 'launch':
      return {
        title: tr(t, 'signup.pro.step.launch.title', 'Espace Pro activé'),
        subtitle: tr(t, 'signup.pro.step.launch.subtitle', 'Votre profil professionnel est prêt.'),
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
  sponsor: ['Offre sponsor', 'Clubs cibles', 'Campagnes locales'],
  club: ['Structure club', 'Ville & département', 'Annonces Mercato Pro'],
  organizer: ['Structure orga', 'Zone d’action', 'Événements locaux'],
};

export function getProLaunchCopy(
  flags: { emailVerificationPending?: boolean; verificationPending?: boolean },
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.pro.launch.email.title', 'Presque prêt'),
      body: tr(t, 'signup.pro.launch.email.body', 'Confirmez votre email pour activer votre espace Pro Day Pro.'),
      finishLabel: tr(t, 'signup.pro.launch.email.finish', 'Entrer dans Pro Day Pro'),
    };
  }
  if (flags.verificationPending) {
    return {
      title: tr(t, 'signup.pro.launch.verify.title', 'Compte créé — vérification requise'),
      body: tr(
        t,
        'signup.pro.launch.verify.body',
        'Depuis votre profil, photographiez votre justificatif pro pour accéder à l’application et à la messagerie.'
      ),
      finishLabel: tr(t, 'signup.pro.launch.verify.finish', 'Aller à mon profil'),
    };
  }
  return {
    title: tr(t, 'signup.pro.launch.done.title', 'Compte Pro Day Pro créé'),
    body: tr(
      t,
      'signup.pro.launch.done.body',
      'Accédez au Mercato Pro, à vos outils métier et à la messagerie sécurisée.'
    ),
    finishLabel: tr(t, 'signup.pro.launch.done.finish', 'Entrer dans Pro Day Pro'),
  };
}

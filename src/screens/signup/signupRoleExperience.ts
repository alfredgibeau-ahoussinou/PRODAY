import type { IconName } from '../../components/ui/Icon';
import type { UserRole } from '../../models/User';
import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';
import type { SignupPageId, SignupPhase } from './signupFlowTypes';
import { MEDICAL_POLE_SPECIALTIES } from './signupFlowTypes';

export type MedicalSpecialtyId =
  | 'kine'
  | 'osteo'
  | 'medecin'
  | 'prepa'
  | 'mental'
  | 'nutrition'
  | 'podologue';

export interface MedicalSpecialtyConfig {
  id: MedicalSpecialtyId;
  label: (typeof MEDICAL_POLE_SPECIALTIES)[number];
  shortLabel: string;
  icon: IconName;
  tagline: string;
  practiceTitle: string;
  practiceSubtitle: string;
  practiceFocusLabel: string;
  practiceFocusOptions: string[];
  practiceHint: string;
}

export const MEDICAL_SPECIALTY_CONFIGS: MedicalSpecialtyConfig[] = [
  {
    id: 'kine',
    label: 'Kinésithérapeute du sport',
    shortLabel: 'Kiné sport',
    icon: 'walk',
    tagline: 'Rééducation, prévention et retour au jeu.',
    practiceTitle: 'Votre zone d’intervention',
    practiceSubtitle: 'Où accompagnez-vous les sportifs ?',
    practiceFocusLabel: 'Type d’activité principal *',
    practiceFocusOptions: ['Cabinet', 'Club / centre', 'Domicile sportif', 'Mixte'],
    practiceHint: 'Les joueurs et clubs verront votre spécialité kiné sur le fil ProDay.',
  },
  {
    id: 'osteo',
    label: 'Ostéopathe',
    shortLabel: 'Ostéo',
    icon: 'person',
    tagline: 'Mobilité, posture et récupération des athlètes.',
    practiceTitle: 'Votre cabinet',
    practiceSubtitle: 'Présentez votre approche ostéo sport.',
    practiceFocusLabel: 'Public principal *',
    practiceFocusOptions: ['Amateurs', 'Semi-pro / Régional', 'Élite jeunes', 'Tous niveaux'],
    practiceHint: 'Profil visible auprès des staffs et joueurs de votre secteur.',
  },
  {
    id: 'medecin',
    label: 'Médecin du sport',
    shortLabel: 'Médecin',
    icon: 'shield',
    tagline: 'Suivi médical, aptitudes et prévention des blessures.',
    practiceTitle: 'Secteur médical',
    practiceSubtitle: 'Clubs et catégories que vous suivez.',
    practiceFocusLabel: 'Spécialisation *',
    practiceFocusOptions: ['Médecine du sport club', 'Urgentiste sport', 'Bilan & aptitudes', 'Recherche'],
    practiceHint: 'Vérification du diplôme après confirmation email.',
  },
  {
    id: 'prepa',
    label: 'Préparateur physique',
    shortLabel: 'Prépa',
    icon: 'football',
    tagline: 'Charge, perf et prévention. Du terrain au labo.',
    practiceTitle: 'Vos équipes',
    practiceSubtitle: 'Qui formez-vous au quotidien ?',
    practiceFocusLabel: 'Profil accompagné *',
    practiceFocusOptions: ['Individuel', 'Groupe / équipe', 'Centre de formation', 'Réathlétisation'],
    practiceHint: 'Votre vitrine prépa sera mise en avant sur les profils clubs.',
  },
  {
    id: 'mental',
    label: 'Coach mental / préparateur mental',
    shortLabel: 'Mental',
    icon: 'shield',
    tagline: 'Confiance, concentration et gestion de la pression match.',
    practiceTitle: 'Votre accompagnement',
    practiceSubtitle: 'Publics et formats de suivi mental.',
    practiceFocusLabel: 'Format principal *',
    practiceFocusOptions: ['Individuel', 'Groupe / équipe', 'Avant match', 'Retour de blessure'],
    practiceHint: 'Les joueurs pourront vous trouver dans l’annuaire Coach mental.',
  },
  {
    id: 'nutrition',
    label: 'Nutritionniste sportif',
    shortLabel: 'Nutrition',
    icon: 'heart',
    tagline: 'Plans alimentaires et hydratation compétition.',
    practiceTitle: 'Votre pratique',
    practiceSubtitle: 'Accompagnement nutritionnel ciblé.',
    practiceFocusLabel: 'Cible principale *',
    practiceFocusOptions: ['Performance match', 'Prise de masse', 'Récupération', 'Jeunes athlètes'],
    practiceHint: 'Conseils et visibilité auprès des joueurs ProDay de votre zone.',
  },
  {
    id: 'podologue',
    label: 'Podologue du sport',
    shortLabel: 'Podologue',
    icon: 'walk',
    tagline: 'Appuis, semelles et prévention des pathologies du pied.',
    practiceTitle: 'Cabinet podo',
    practiceSubtitle: 'Sports et publics que vous suivez.',
    practiceFocusLabel: 'Spécialité terrain *',
    practiceFocusOptions: ['Foot à 11', 'Futsal', 'Running', 'Multi-sports'],
    practiceHint: 'Les clubs pourront vous identifier comme référent podo local.',
  },
];

export function medicalLabelToId(label: string): MedicalSpecialtyId | null {
  const hit = MEDICAL_SPECIALTY_CONFIGS.find((c) => c.label === label);
  return hit?.id ?? null;
}

export function medicalIdToLabel(id: MedicalSpecialtyId): string {
  return MEDICAL_SPECIALTY_CONFIGS.find((c) => c.id === id)?.label ?? MEDICAL_POLE_SPECIALTIES[0];
}

export interface RoleSignupAccent {
  accent: string;
  accentSoft: string;
  accentMuted: string;
}

export interface RoleStepMeta {
  title: string;
  subtitle: string;
  heroIcon: IconName;
  stepName?: string;
}

export interface RoleSignupExperience {
  id: UserRole;
  welcomeTitle: string;
  welcomeSubtitle: string;
  previewSteps: string[];
  phases: SignupPhase[];
  accent: RoleSignupAccent;
  launchTitle: string;
  launchBody: string;
  launchFinishLabel: string;
}

const DEFAULT_ACCENT: RoleSignupAccent = {
  accent: '#0A0A0A',
  accentSoft: '#F5F5F5',
  accentMuted: '#E5E5E5',
};

const ROLE_EXPERIENCES: Record<UserRole, RoleSignupExperience> = {
  player: {
    id: 'player',
    welcomeTitle: 'Devenir joueur ProDay',
    welcomeSubtitle: 'Mercato, stats live et candidatures. Construisez votre saison.',
    previewSteps: ['Espace', 'Fiche sport', 'Ville', 'Stats', 'Identité', 'Accès'],
    phases: [
      { id: 'vous', label: 'Terrain' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#0A0A0A', accentSoft: '#E8F5E9', accentMuted: '#C8E6C9' },
    launchTitle: 'Terrain prêt',
    launchBody: 'Votre cockpit joueur s’active après confirmation email. Mercato et stats vous attendent.',
    launchFinishLabel: 'Entrer sur le terrain',
  },
  coach: {
    id: 'coach',
    welcomeTitle: 'Espace coach',
    welcomeSubtitle: 'Convocations, effectif et diplôme vérifié par IA.',
    previewSteps: ['Profil coach', 'Identité', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Encadrement' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#1D4ED8', accentSoft: '#DBEAFE', accentMuted: '#93C5FD' },
    launchTitle: 'Banc technique ouvert',
    launchBody: 'Gérez convocations et messagerie dès que votre diplôme est validé.',
    launchFinishLabel: 'Accéder au centre coach',
  },
  club: {
    id: 'club',
    welcomeTitle: 'Espace club',
    welcomeSubtitle: 'Recrutement, stages et vie de structure. Mandat vérifié.',
    previewSteps: ['Structure', 'Identité', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Club' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#7C2D12', accentSoft: '#FFEDD5', accentMuted: '#FDBA74' },
    launchTitle: 'Club en ligne',
    launchBody: 'Publiez annonces et gérez vos équipes depuis votre QG ProDay.',
    launchFinishLabel: 'Ouvrir le QG club',
  },
  agent: {
    id: 'agent',
    welcomeTitle: 'Espace agent',
    welcomeSubtitle: 'Scouting, mandats et placement. Licence pro contrôlée.',
    previewSteps: ['Zone pro', 'Identité', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Mandat' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#4C1D95', accentSoft: '#EDE9FE', accentMuted: '#C4B5FD' },
    launchTitle: 'Réseau agent activé',
    launchBody: 'Repérez les profils et contactez les clubs après validation de licence.',
    launchFinishLabel: 'Entrer dans le réseau',
  },
  recruiter: {
    id: 'recruiter',
    welcomeTitle: 'Espace recruteur',
    welcomeSubtitle: 'Scouting, annonces Mercato et pipeline candidatures. Profil vérifié.',
    previewSteps: ['Profil recruteur', 'Identité', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Recrutement' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#059669', accentSoft: '#D1FAE5', accentMuted: '#6EE7B7' },
    launchTitle: 'Mercato recruteur ouvert',
    launchBody: 'Publiez vos annonces et suivez les candidatures dès validation du mandat.',
    launchFinishLabel: 'Accéder au Mercato Pro',
  },
  organizer: {
    id: 'organizer',
    welcomeTitle: 'Espace organisateur',
    welcomeSubtitle: 'Tournois, détections et animation du territoire foot.',
    previewSteps: ['Organisation', 'Identité', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Événements' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#B45309', accentSoft: '#FEF3C7', accentMuted: '#FCD34D' },
    launchTitle: 'Événements',
    launchBody: 'Créez tournois et journées scouting dès votre email confirmé.',
    launchFinishLabel: 'Lancer l’organisation',
  },
  physio: {
    id: 'physio',
    welcomeTitle: 'Pôle médical ProDay',
    welcomeSubtitle: 'Chaque spécialité a son parcours. Kiné, médecin, prépa, nutrition…',
    previewSteps: ['Spécialité', 'Cabinet', 'Identité', 'Sécurité', 'Go'],
    phases: [
      { id: 'vous', label: 'Métier' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#0F766E', accentSoft: '#CCFBF1', accentMuted: '#5EEAD4' },
    launchTitle: 'Cabinet enregistré',
    launchBody: 'Votre spécialité apparaît sur le fil santé. Validation des diplômes à suivre.',
    launchFinishLabel: 'Ouvrir mon cabinet',
  },
  sponsor: {
    id: 'sponsor',
    welcomeTitle: 'Espace sponsor',
    welcomeSubtitle: 'Visibilité mesurée, campagnes géolocalisées et tableau de bord ROI.',
    previewSteps: ['Marque', 'Campagne', 'Ciblage', 'Compte', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Marque' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#D4AF37', accentSoft: 'rgba(212, 175, 55, 0.12)', accentMuted: '#B8941F' },
    launchTitle: 'Espace sponsor activé',
    launchBody: 'Publiez vos offres, suivez vos KPIs et touchez les clubs de votre territoire.',
    launchFinishLabel: 'Ouvrir mon espace marque',
  },
  supporter: {
    id: 'supporter',
    welcomeTitle: 'Espace supporter',
    welcomeSubtitle: 'Matchs, réels et fil. Votre tribune numérique ProDay.',
    previewSteps: ['Clubs', 'Profil', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Profil' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#7C3AED', accentSoft: '#EDE9FE', accentMuted: '#C4B5FD' },
    launchTitle: 'Bienvenue en tribune',
    launchBody: 'Suivez vos clubs, réagissez au fil et partagez les moments forts.',
    launchFinishLabel: 'Entrer en tribune',
  },
  parent: {
    id: 'parent',
    welcomeTitle: 'Espace parent',
    welcomeSubtitle: 'Supervisez le compte mineur de votre enfant sur ProDay.',
    previewSteps: ['Enfant', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Famille' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#0F766E', accentSoft: '#CCFBF1', accentMuted: '#5EEAD4' },
    launchTitle: 'Portail parent prêt',
    launchBody: 'Définissez votre mot de passe via l’e-mail reçu, puis connectez-vous.',
    launchFinishLabel: 'Ouvrir l’espace parent',
  },
};

export function getRoleSignupExperience(role: UserRole): RoleSignupExperience {
  return ROLE_EXPERIENCES[role] ?? ROLE_EXPERIENCES.player;
}

export function getRoleSignupAccent(role: UserRole): RoleSignupAccent {
  return getRoleSignupExperience(role).accent ?? DEFAULT_ACCENT;
}

export function getRoleSignupPhases(role: UserRole, t?: TranslateFn): SignupPhase[] {
  return localizeRoleExperience(getRoleSignupExperience(role), role, t).phases;
}

export function getRoleWelcomeCopy(role: UserRole, t?: TranslateFn): { title: string; subtitle: string } {
  const e = localizeRoleExperience(getRoleSignupExperience(role), role, t);
  return { title: e.welcomeTitle, subtitle: e.welcomeSubtitle };
}

export function getRolePreviewSteps(role: UserRole, t?: TranslateFn): string[] {
  return localizeRoleExperience(getRoleSignupExperience(role), role, t).previewSteps;
}

export function getRoleLaunchCopy(
  role: UserRole,
  flags: { emailVerificationPending?: boolean },
  t?: TranslateFn
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: tr(t, 'signup.launch.emailValidated.title', 'Presque prêt'),
      body: tr(
        t,
        'signup.launch.staff.email.body',
        'Confirmez votre email pour débloquer votre espace personnalisé.'
      ),
      finishLabel: tr(t, 'signup.launch.emailValidated.finish', 'Compris'),
    };
  }
  const e = localizeRoleExperience(getRoleSignupExperience(role), role, t);
  return {
    title: e.launchTitle,
    body: e.launchBody,
    finishLabel: e.launchFinishLabel,
  };
}

function localizeRoleExperience(
  e: RoleSignupExperience,
  role: UserRole,
  t?: TranslateFn
): RoleSignupExperience {
  if (!t) return e;
  const p = (suffix: string, val: string) => tr(t, `signup.experience.${role}.${suffix}`, val);
  return {
    ...e,
    welcomeTitle: p('welcomeTitle', e.welcomeTitle),
    welcomeSubtitle: p('welcomeSubtitle', e.welcomeSubtitle),
    previewSteps: e.previewSteps.map((step, index) => p(`previewStep.${index}`, step)),
    phases: e.phases.map((phase) => ({
      ...phase,
      label: p(`phase.${phase.id}`, phase.label),
    })),
    launchTitle: p('launchTitle', e.launchTitle),
    launchBody: p('launchBody', e.launchBody),
    launchFinishLabel: p('launchFinishLabel', e.launchFinishLabel),
  };
}

export function getStepMetaForRole(page: SignupPageId, role: UserRole, t?: TranslateFn): RoleStepMeta {
  const metaKey = (field: string, fallback: string) =>
    tr(t, `signup.roleMeta.${page}.${field}`, fallback);
  switch (page) {
    case 'welcome':
      return {
        ...getRoleWelcomeCopy(role, t),
        heroIcon: role === 'physio' ? 'heart' : role === 'sponsor' ? 'star-four-points' : 'football',
        stepName: metaKey('stepName', tr(t, 'signup.page.welcome', 'Bienvenue')),
      };
    case 'space':
      return {
        title: metaKey('title', 'Ton univers foot'),
        subtitle: metaKey('subtitle', 'Féminin, masculin ou école. Tout le parcours s’adapte.'),
        heroIcon: 'football',
        stepName: metaKey('stepName', tr(t, 'signup.page.space', 'Espace')),
      };
    case 'sport':
      return {
        title: metaKey('title', 'Ta fiche sportive'),
        subtitle: metaKey('subtitle', 'Poste, catégorie, niveau. Une page, une étape.'),
        heroIcon: 'shirt',
        stepName: metaKey('stepName', tr(t, 'signup.page.sport', 'Sport')),
      };
    case 'location':
      return {
        title: metaKey('title', 'Où tu joues'),
        subtitle: metaKey('subtitle', 'Ville et département pour le Mercato local.'),
        heroIcon: 'location',
        stepName: metaKey('stepName', tr(t, 'signup.page.location', 'Ville')),
      };
    case 'stats':
      return {
        title: metaKey('title', 'Tes stats saison'),
        subtitle: metaKey('subtitle', 'Matchs, buts, passes. Alimentent ton CV vivant.'),
        heroIcon: 'star',
        stepName: metaKey('stepName', tr(t, 'signup.page.stats', 'Stats')),
      };
    case 'coach_pro':
      return {
        title: metaKey('title', 'Profil coach'),
        subtitle: metaKey('subtitle', 'Diplôme, ville et zone d’intervention. Vérification IA après l’email.'),
        heroIcon: 'school',
        stepName: metaKey('stepName', tr(t, 'signup.page.coach_pro', 'Coach')),
      };
    case 'club_pro':
      return {
        title: metaKey('title', 'Votre structure'),
        subtitle: metaKey('subtitle', 'Nom du club, ville et département. Mandat contrôlé ensuite.'),
        heroIcon: 'business',
        stepName: metaKey('stepName', tr(t, 'signup.page.club_pro', 'Club')),
      };
    case 'agent_pro':
      return {
        title: metaKey('title', 'Profil agent'),
        subtitle: metaKey('subtitle', 'Licence, territoire et ville. Accès messagerie après validation.'),
        heroIcon: 'briefcase',
        stepName: metaKey('stepName', tr(t, 'signup.page.agent_pro', 'Agent')),
      };
    case 'recruiter_pro':
      return {
        title: metaKey('title', 'Profil recruteur'),
        subtitle: metaKey('subtitle', 'Spécialité, territoire et ville. Mandat contrôlé après l’email.'),
        heroIcon: 'search',
        stepName: metaKey('stepName', tr(t, 'signup.page.recruiter_pro', 'Recruteur')),
      };
    case 'organizer_pro':
      return {
        title: metaKey('title', 'Profil organisateur'),
        subtitle: metaKey('subtitle', 'Structure, ville. Tournois et détections sur ProDay.'),
        heroIcon: 'trophy',
        stepName: metaKey('stepName', tr(t, 'signup.page.organizer_pro', 'Orga')),
      };
    case 'medical_specialty':
      return {
        title: metaKey('title', 'Votre spécialité'),
        subtitle: metaKey('subtitle', 'Choisissez votre domaine. Le parcours suivant est dédié à ce métier.'),
        heroIcon: 'heart',
        stepName: metaKey('stepName', tr(t, 'signup.page.medical_specialty', 'Spécialité')),
      };
    case 'medical_practice':
      return {
        title: metaKey('title', 'Votre pratique'),
        subtitle: metaKey('subtitle', 'Précisez comment vous accompagnez les sportifs.'),
        heroIcon: 'heart',
        stepName: metaKey('stepName', tr(t, 'signup.page.medical_practice', 'Cabinet')),
      };
    case 'sponsor_pro':
      return {
        title: metaKey('title', 'Votre territoire'),
        subtitle: metaKey('subtitle', 'Zone d’action et marque. Visibilité auprès des clubs locaux.'),
        heroIcon: 'star-four-points',
        stepName: metaKey('stepName', tr(t, 'signup.page.sponsor_pro', 'Sponsor')),
      };
    case 'sponsor_company':
      return {
        title: metaKey('title', 'Votre marque'),
        subtitle: metaKey('subtitle', 'Identifiez votre entreprise. Ces infos personnalisent votre espace sponsor.'),
        heroIcon: 'star-four-points',
        stepName: metaKey('stepName', tr(t, 'signup.page.sponsor_company', 'Entreprise')),
      };
    case 'sponsor_campaign':
      return {
        title: metaKey('title', 'Objectifs & budget'),
        subtitle: metaKey('subtitle', 'Calibrons la formule adaptée à votre ambition marketing.'),
        heroIcon: 'briefcase',
        stepName: metaKey('stepName', tr(t, 'signup.page.sponsor_campaign', 'Campagne')),
      };
    case 'sponsor_targeting':
      return {
        title: metaKey('title', 'Territoires & sports'),
        subtitle: metaKey('subtitle', 'Précisez vos zones et univers sportifs pour un ciblage optimal.'),
        heroIcon: 'location',
        stepName: metaKey('stepName', tr(t, 'signup.page.sponsor_targeting', 'Ciblage')),
      };
    case 'family':
      return {
        title: metaKey('title', 'Responsable légal'),
        subtitle: metaKey('subtitle', 'Obligatoire pour les mineurs. Conformité ProDay.'),
        heroIcon: 'shield',
        stepName: metaKey('stepName', tr(t, 'signup.page.family', 'Famille')),
      };
    case 'account':
      return {
        title: metaKey(
          'title',
          role === 'sponsor' ? 'Identité sponsor' : 'Ton identité'
        ),
        subtitle: metaKey('subtitle', 'Nom affiché et email. Base de votre espace.'),
        heroIcon: 'person',
        stepName: metaKey('stepName', tr(t, 'signup.page.account', 'Identité')),
      };
    case 'security':
      return {
        title: metaKey('title', 'Sécurisez l’accès'),
        subtitle: metaKey('subtitle', 'Mot de passe robuste puis confirmation par email.'),
        heroIcon: 'lock',
        stepName: metaKey('stepName', tr(t, 'signup.page.security', 'Sécurité')),
      };
    case 'launch':
      return {
        title: metaKey('title', 'C’est prêt'),
        subtitle: localizeRoleExperience(getRoleSignupExperience(role), role, t).launchBody,
        heroIcon: 'checkmark-circle',
        stepName: metaKey('stepName', tr(t, 'signup.page.launch', 'Go')),
      };
    default:
      return {
        title: metaKey('title', 'ProDay'),
        subtitle: metaKey('subtitle', ''),
        heroIcon: 'star-four-points',
      };
  }
}

/** @deprecated Utiliser getMedicalConfigById */
export function getMedicalPracticeMeta(specialtyLabel: string, t?: TranslateFn): RoleStepMeta {
  const { resolveMedicalSpecialtyId, getMedicalPracticeMetaById } = require('./signupMedicalI18n') as typeof import('./signupMedicalI18n');
  const id = resolveMedicalSpecialtyId(specialtyLabel) ?? 'kine';
  return getMedicalPracticeMetaById(id, t);
}

/** @deprecated Utiliser getMedicalConfigById */
export function getMedicalConfig(specialtyLabel: string, t?: TranslateFn) {
  const { resolveMedicalSpecialtyId, getMedicalConfigById } = require('./signupMedicalI18n') as typeof import('./signupMedicalI18n');
  const id = resolveMedicalSpecialtyId(specialtyLabel) ?? 'kine';
  return getMedicalConfigById(id, t);
}

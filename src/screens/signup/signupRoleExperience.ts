import type { IconName } from '../../components/ui/Icon';
import type { UserRole } from '../../models/User';
import type { SignupPageId, SignupPhase } from './signupFlowConfig';
import { MEDICAL_POLE_SPECIALTIES } from './signupFlowConfig';

export type MedicalSpecialtyId =
  | 'kine'
  | 'osteo'
  | 'medecin'
  | 'prepa'
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
    tagline: 'Charge, perf et prévention — du terrain au labo.',
    practiceTitle: 'Vos équipes',
    practiceSubtitle: 'Qui formez-vous au quotidien ?',
    practiceFocusLabel: 'Profil accompagné *',
    practiceFocusOptions: ['Individuel', 'Groupe / équipe', 'Centre de formation', 'Réathlétisation'],
    practiceHint: 'Votre vitrine prépa sera mise en avant sur les profils clubs.',
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
    welcomeSubtitle: 'Mercato, stats live et candidatures — construisez votre saison.',
    previewSteps: ['Espace', 'Fiche sport', 'Ville', 'Stats', 'Identité', 'Accès'],
    phases: [
      { id: 'vous', label: 'Terrain' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#0A0A0A', accentSoft: '#E8F5E9', accentMuted: '#C8E6C9' },
    launchTitle: 'Terrain prêt',
    launchBody: 'Votre cockpit joueur s’active après confirmation email — Mercato et stats vous attendent.',
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
    welcomeSubtitle: 'Recrutement, stages et vie de structure — mandat vérifié.',
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
    welcomeSubtitle: 'Scouting, mandats et placement — licence pro contrôlée.',
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
    launchTitle: 'Arena & events',
    launchBody: 'Créez tournois et journées scouting dès votre email confirmé.',
    launchFinishLabel: 'Lancer l’organisation',
  },
  physio: {
    id: 'physio',
    welcomeTitle: 'Pôle médical ProDay',
    welcomeSubtitle: 'Chaque spécialité a son parcours — kiné, médecin, prépa, nutrition…',
    previewSteps: ['Spécialité', 'Cabinet', 'Identité', 'Sécurité', 'Go'],
    phases: [
      { id: 'vous', label: 'Métier' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#0F766E', accentSoft: '#CCFBF1', accentMuted: '#5EEAD4' },
    launchTitle: 'Cabinet enregistré',
    launchBody: 'Votre spécialité apparaît sur le fil santé — validation des diplômes à suivre.',
    launchFinishLabel: 'Ouvrir mon cabinet',
  },
  sponsor: {
    id: 'sponsor',
    welcomeTitle: 'Espace partenaire',
    welcomeSubtitle: 'Visibilité locale, offres et soutien aux clubs de votre territoire.',
    previewSteps: ['Territoire', 'Identité', 'Sécurité', 'Lancement'],
    phases: [
      { id: 'vous', label: 'Marque' },
      { id: 'acces', label: 'Compte' },
      { id: 'launch', label: 'Go' },
    ],
    accent: { accent: '#BE185D', accentSoft: '#FCE7F3', accentMuted: '#F9A8D4' },
    launchTitle: 'Vitrine partenaire',
    launchBody: 'Complétez vos offres sponsors et touchez les clubs de votre zone.',
    launchFinishLabel: 'Voir mon espace marque',
  },
};

export function getRoleSignupExperience(role: UserRole): RoleSignupExperience {
  return ROLE_EXPERIENCES[role] ?? ROLE_EXPERIENCES.player;
}

export function getRoleSignupAccent(role: UserRole): RoleSignupAccent {
  return getRoleSignupExperience(role).accent ?? DEFAULT_ACCENT;
}

export function getRoleSignupPhases(role: UserRole): SignupPhase[] {
  return getRoleSignupExperience(role).phases;
}

export function getRoleWelcomeCopy(role: UserRole): { title: string; subtitle: string } {
  const e = getRoleSignupExperience(role);
  return { title: e.welcomeTitle, subtitle: e.welcomeSubtitle };
}

export function getRolePreviewSteps(role: UserRole): string[] {
  return getRoleSignupExperience(role).previewSteps;
}

export function getRoleLaunchCopy(
  role: UserRole,
  flags: { emailVerificationPending?: boolean }
): { title: string; body: string; finishLabel: string } {
  if (flags.emailVerificationPending) {
    return {
      title: 'Presque prêt',
      body: 'Confirmez votre email pour débloquer votre espace personnalisé.',
      finishLabel: 'Compris',
    };
  }
  const e = getRoleSignupExperience(role);
  return {
    title: e.launchTitle,
    body: e.launchBody,
    finishLabel: e.launchFinishLabel,
  };
}

export function getStepMetaForRole(page: SignupPageId, role: UserRole): RoleStepMeta {
  switch (page) {
    case 'welcome':
      return {
        ...getRoleWelcomeCopy(role),
        heroIcon: role === 'physio' ? 'heart' : role === 'sponsor' ? 'star-four-points' : 'football',
        stepName: 'Bienvenue',
      };
    case 'space':
      return {
        title: 'Ton univers foot',
        subtitle: 'Féminin, masculin ou école — tout le parcours s’adapte.',
        heroIcon: 'football',
        stepName: 'Espace',
      };
    case 'sport':
      return {
        title: 'Ta fiche sportive',
        subtitle: 'Poste, catégorie, niveau — une page, une étape.',
        heroIcon: 'shirt',
        stepName: 'Sport',
      };
    case 'location':
      return {
        title: 'Où tu joues',
        subtitle: 'Ville et département pour le Mercato local.',
        heroIcon: 'location',
        stepName: 'Ville',
      };
    case 'stats':
      return {
        title: 'Tes stats saison',
        subtitle: 'Matchs, buts, passes — alimentent ton CV vivant.',
        heroIcon: 'star',
        stepName: 'Stats',
      };
    case 'coach_pro':
      return {
        title: 'Profil coach',
        subtitle: 'Diplôme, ville et zone d’intervention — vérification IA après l’email.',
        heroIcon: 'school',
        stepName: 'Coach',
      };
    case 'club_pro':
      return {
        title: 'Votre structure',
        subtitle: 'Nom du club, ville et département — mandat contrôlé ensuite.',
        heroIcon: 'business',
        stepName: 'Club',
      };
    case 'agent_pro':
      return {
        title: 'Profil agent',
        subtitle: 'Licence, territoire et ville — accès messagerie après validation.',
        heroIcon: 'briefcase',
        stepName: 'Agent',
      };
    case 'organizer_pro':
      return {
        title: 'Profil organisateur',
        subtitle: 'Structure, ville — tournois et détections sur ProDay.',
        heroIcon: 'trophy',
        stepName: 'Orga',
      };
    case 'medical_specialty':
      return {
        title: 'Votre spécialité',
        subtitle: 'Choisissez votre domaine — le parcours suivant est dédié à ce métier.',
        heroIcon: 'heart',
        stepName: 'Spécialité',
      };
    case 'medical_practice':
      return {
        title: 'Votre pratique',
        subtitle: 'Précisez comment vous accompagnez les sportifs.',
        heroIcon: 'heart',
        stepName: 'Cabinet',
      };
    case 'sponsor_pro':
      return {
        title: 'Votre territoire',
        subtitle: 'Zone d’action et marque — visibilité auprès des clubs locaux.',
        heroIcon: 'star-four-points',
        stepName: 'Partenaire',
      };
    case 'family':
      return {
        title: 'Responsable légal',
        subtitle: 'Obligatoire pour les mineurs — conformité ProDay.',
        heroIcon: 'shield',
        stepName: 'Famille',
      };
    case 'account':
      return {
        title: role === 'sponsor' ? 'Identité partenaire' : 'Ton identité',
        subtitle: 'Nom affiché et email — base de votre espace.',
        heroIcon: 'person',
        stepName: 'Identité',
      };
    case 'security':
      return {
        title: 'Sécurisez l’accès',
        subtitle: 'Mot de passe robuste puis confirmation par email.',
        heroIcon: 'lock',
        stepName: 'Sécurité',
      };
    case 'launch':
      return {
        title: 'C’est prêt',
        subtitle: getRoleSignupExperience(role).launchBody,
        heroIcon: 'checkmark-circle',
        stepName: 'Go',
      };
    default:
      return {
        title: 'ProDay',
        subtitle: '',
        heroIcon: 'star-four-points',
      };
  }
}

export function getMedicalPracticeMeta(specialtyLabel: string): RoleStepMeta {
  const cfg =
    MEDICAL_SPECIALTY_CONFIGS.find((c) => c.label === specialtyLabel) ??
    MEDICAL_SPECIALTY_CONFIGS[0];
  return {
    title: cfg.practiceTitle,
    subtitle: cfg.practiceSubtitle,
    heroIcon: cfg.icon,
    stepName: 'Cabinet',
  };
}

export function getMedicalConfig(specialtyLabel: string): MedicalSpecialtyConfig {
  return (
    MEDICAL_SPECIALTY_CONFIGS.find((c) => c.label === specialtyLabel) ??
    MEDICAL_SPECIALTY_CONFIGS[0]
  );
}

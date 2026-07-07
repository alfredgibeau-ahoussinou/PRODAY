import type { MainTabId } from '../navigation/mainTabConfig';
import type { ProductLineId } from '../models/ProductLine';
import { resolveProProductSegmentFromRole } from '../models/ProductLine';
import type {
  DashboardDeepLink,
  MercatoDeepLink,
  ProfileDeepLink,
} from '../utils/navigationDeepLink';

export type PoleHelpPoleKey =
  | 'amateur'
  | 'supporter'
  | 'sante'
  | 'pro_player'
  | 'pro_club'
  | 'pro_staff';

export type PoleHelpNavigateAction =
  | { kind: 'tab'; tab: MainTabId }
  | { kind: 'matchs'; homeTab?: 'season' | 'matches' | 'convocations' | 'tournois' }
  | { kind: 'mercato'; view?: MercatoDeepLink }
  | { kind: 'profile'; view?: ProfileDeepLink }
  | { kind: 'dashboard'; view: DashboardDeepLink }
  | { kind: 'shop' };

export interface PoleHelpEntry {
  id: string;
  question: string;
  answer: string;
  navigate?: PoleHelpNavigateAction;
  navigateLabel?: string;
}

export interface PoleHelpContent {
  poleKey: PoleHelpPoleKey;
  title: string;
  welcome: string;
  entries: PoleHelpEntry[];
}

const AMATEUR_HELP: PoleHelpContent = {
  poleKey: 'amateur',
  title: 'Aide Amateur',
  welcome:
    'Salut ! Je suis ton guide Pro Day Amateur. Choisis une question rapide ou parcours les réponses ci-dessous.',
  entries: [
    {
      id: 'matchs',
      question: 'Où sont mes matchs ?',
      answer:
        'Tes matchs, convocations et calendrier de saison sont dans l’onglet Matchs. Tu y retrouves aussi les stats d’équipe.',
      navigate: { kind: 'matchs', homeTab: 'season' },
      navigateLabel: 'Ouvrir Matchs',
    },
    {
      id: 'mercato',
      question: 'Comment trouver un club ou publier une annonce ?',
      answer:
        'Le Mercato local regroupe les annonces de clubs, détections et candidatures. Consulte l’onglet Club / Recrutement pour parcourir ou publier.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Ouvrir le Mercato',
    },
    {
      id: 'club',
      question: 'Où voir mon club et mon effectif ?',
      answer:
        'Depuis l’accueil Équipe, accède à ton club, tes coéquipiers et les infos d’effectif. Les convocations passent par Matchs.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Aller à l’accueil',
    },
    {
      id: 'profil',
      question: 'Comment modifier mon profil ?',
      answer:
        'Onglet Moi : photo, bio, niveau, poste et préférences. Tu peux aussi gérer tes candidatures depuis ton profil.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir mon profil',
    },
    {
      id: 'covoiturage',
      question: 'Comment organiser un covoiturage ?',
      answer:
        'L’onglet Déplacements permet de proposer ou réserver un trajet pour les matchs et entraînements de ton équipe.',
      navigate: { kind: 'tab', tab: 'covoiturage' },
      navigateLabel: 'Ouvrir Déplacements',
    },
  ],
};

const SUPPORTER_HELP: PoleHelpContent = {
  poleKey: 'supporter',
  title: 'Aide Supporter',
  welcome:
    'Bienvenue sur la Tribune ! Je t’aide à retrouver tes matchs, tes suivis et ton fil supporter.',
  entries: [
    {
      id: 'tribune',
      question: 'Où est ma tribune ?',
      answer:
        'L’accueil Tribune regroupe tes clubs favoris, les prochains matchs à suivre et les temps forts de ta communauté.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir la Tribune',
    },
    {
      id: 'suivis',
      question: 'Comment gérer mes suivis ?',
      answer:
        'L’onglet Suivis (fil) centralise les actus des joueurs, clubs et créateurs que tu suis. Tu peux aussi les retrouver depuis ton profil.',
      navigate: { kind: 'tab', tab: 'feed' },
      navigateLabel: 'Voir mes suivis',
    },
    {
      id: 'live',
      question: 'Où voir les matchs en direct ?',
      answer:
        'L’onglet Matchs liste les rencontres du jour, les scores live et les liens vers les hubs match quand ils sont disponibles.',
      navigate: { kind: 'matchs', homeTab: 'matches' },
      navigateLabel: 'Voir les matchs',
    },
    {
      id: 'reels',
      question: 'Où regarder les Moments / réels ?',
      answer:
        'Moments regroupe les réels foot, highlights et contenus courts de la communauté supporter.',
      navigate: { kind: 'tab', tab: 'reels' },
      navigateLabel: 'Ouvrir Moments',
    },
    {
      id: 'profil',
      question: 'Comment modifier mon compte supporter ?',
      answer:
        'Onglet Compte : identité, clubs favoris, notifications et paramètres de ton espace supporter.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir mon compte',
    },
  ],
};

const SANTE_HELP: PoleHelpContent = {
  poleKey: 'sante',
  title: 'Aide Santé',
  welcome:
    'Bonjour ! Je t’accompagne dans ton espace praticien : agenda, patients et messagerie médicale.',
  entries: [
    {
      id: 'rdv',
      question: 'Où voir mes rendez-vous ?',
      answer:
        'Ton agenda et tes créneaux à venir sont sur l’accueil Santé. Tu peux filtrer par jour et accéder au détail de chaque consultation.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir l’agenda',
    },
    {
      id: 'patients',
      question: 'Comment retrouver un patient ?',
      answer:
        'Depuis l’accueil, accède à la liste de tes patients suivis et à leur historique de suivi. Utilise la recherche si tu as beaucoup de dossiers.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Voir mes patients',
    },
    {
      id: 'messages',
      question: 'Où est la messagerie ?',
      answer:
        'L’onglet Messages regroupe tes échanges avec joueurs, staff et autres praticiens. Les notifications t’alertent des nouveaux messages.',
      navigate: { kind: 'tab', tab: 'messages' },
      navigateLabel: 'Ouvrir Messages',
    },
    {
      id: 'matchs',
      question: 'Comment lier un suivi à un match ?',
      answer:
        'Le calendrier Matchs te permet de croiser événements sportifs et suivis médicaux quand un joueur est rattaché à une équipe.',
      navigate: { kind: 'matchs', homeTab: 'season' },
      navigateLabel: 'Ouvrir le calendrier',
    },
    {
      id: 'profil',
      question: 'Comment mettre à jour mon profil praticien ?',
      answer:
        'Onglet Profil : spécialité, cabinet, zone d’intervention et documents visibles par les joueurs et clubs.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Modifier mon profil',
    },
  ],
};

const PRO_PLAYER_HELP: PoleHelpContent = {
  poleKey: 'pro_player',
  title: 'Aide Pro Joueur',
  welcome:
    'Salut ! Je t’aide à naviguer dans ton espace carrière pro : stats, CV et opportunités.',
  entries: [
    {
      id: 'carriere',
      question: 'Où voir ma carrière ?',
      answer:
        'L’accueil Carrière résume ton parcours, tes objectifs et les indicateurs clés de performance.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir Carrière',
    },
    {
      id: 'cv',
      question: 'Comment mettre à jour mon CV / portfolio ?',
      answer:
        'Depuis Profil, complète ton CV sportif, tes vidéos portfolio (Moments) et tes candidatures en cours.',
      navigate: { kind: 'profile', view: 'cv' },
      navigateLabel: 'Ouvrir mon CV',
    },
    {
      id: 'stats',
      question: 'Où sont mes stats ?',
      answer:
        'L’onglet Groupe / Matchs affiche tes stats individuelles, le calendrier et les convocations de ton club.',
      navigate: { kind: 'matchs', homeTab: 'matches' },
      navigateLabel: 'Voir mes stats',
    },
    {
      id: 'opportunites',
      question: 'Comment trouver des opportunités ?',
      answer:
        'L’onglet Opportunités (Mercato) liste les annonces clubs, essais et contacts recruteurs adaptés à ton profil.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Voir les opportunités',
    },
    {
      id: 'profil',
      question: 'Comment modifier mon profil pro ?',
      answer:
        'Onglet Moi : identité pro, agent, disponibilité et visibilité auprès des clubs.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir mon profil',
    },
  ],
};

const PRO_CLUB_HELP: PoleHelpContent = {
  poleKey: 'pro_club',
  title: 'Aide Pro Club',
  welcome:
    'Bonjour ! Je t’oriente dans la gestion de ton club : structure, recrutement et calendrier.',
  entries: [
    {
      id: 'structure',
      question: 'Où gérer la structure du club ?',
      answer:
        'L’accueil Structure centralise équipes, staff, documents et vue d’ensemble de ton organisation.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir Structure',
    },
    {
      id: 'recrutement',
      question: 'Comment recruter des joueurs ou du staff ?',
      answer:
        'L’onglet Recrutement permet de publier des annonces, suivre les candidatures et contacter des profils.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Ouvrir Recrutement',
    },
    {
      id: 'calendrier',
      question: 'Où est le calendrier du club ?',
      answer:
        'L’onglet Calendrier regroupe matchs, entraînements, tournois et convocations de toutes tes équipes.',
      navigate: { kind: 'matchs', homeTab: 'season' },
      navigateLabel: 'Ouvrir le calendrier',
    },
    {
      id: 'communication',
      question: 'Comment communiquer avec mon effectif ?',
      answer:
        'Utilise l’onglet Communication pour envoyer des messages groupés ou individuels à tes joueurs et staff.',
      navigate: { kind: 'tab', tab: 'messages' },
      navigateLabel: 'Ouvrir Communication',
    },
    {
      id: 'profil',
      question: 'Comment mettre à jour la vitrine club ?',
      answer:
        'Onglet Vitrine : logo, présentation, palmarès et informations visibles par les joueurs et partenaires.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir la vitrine',
    },
  ],
};

const PRO_STAFF_HELP: PoleHelpContent = {
  poleKey: 'pro_staff',
  title: 'Aide Pro Staff',
  welcome:
    'Salut ! Coach, agent ou recruteur — je t’aide à retrouver Mercato, réseau et calendrier.',
  entries: [
    {
      id: 'mandats',
      question: 'Où voir mes mandats et missions ?',
      answer:
        'L’accueil regroupe tes mandats en cours, alertes scouting et raccourcis vers tes dossiers actifs.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir l’accueil',
    },
    {
      id: 'mercato',
      question: 'Comment publier ou consulter le Mercato ?',
      answer:
        'L’onglet Mercato / Recrutement permet de publier des annonces, suivre les candidatures et rechercher des profils.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Ouvrir le Mercato',
    },
    {
      id: 'reseau',
      question: 'Comment développer mon réseau ?',
      answer:
        'Messages et l’accueil te suggèrent des contacts pertinents (joueurs, clubs, agents). Tu peux aussi explorer depuis le Mercato.',
      navigate: { kind: 'tab', tab: 'messages' },
      navigateLabel: 'Ouvrir Messages',
    },
    {
      id: 'calendrier',
      question: 'Où est mon calendrier staff ?',
      answer:
        'L’onglet Calendrier liste matchs, détections, rendez-vous et événements liés à tes missions.',
      navigate: { kind: 'matchs', homeTab: 'season' },
      navigateLabel: 'Ouvrir le calendrier',
    },
    {
      id: 'profil',
      question: 'Comment mettre à jour mon profil staff ?',
      answer:
        'Onglet Profil : spécialité, certifications, zone géographique et visibilité auprès des clubs.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Modifier mon profil',
    },
  ],
};

const POLE_HELP_BY_KEY: Record<PoleHelpPoleKey, PoleHelpContent> = {
  amateur: AMATEUR_HELP,
  supporter: SUPPORTER_HELP,
  sante: SANTE_HELP,
  pro_player: PRO_PLAYER_HELP,
  pro_club: PRO_CLUB_HELP,
  pro_staff: PRO_STAFF_HELP,
};

const STAFF_ROLES = new Set(['coach', 'agent', 'recruiter', 'organizer']);

export function resolvePoleHelpPoleKey(
  productLine: ProductLineId,
  role?: string | null,
): PoleHelpPoleKey {
  if (productLine === 'supporter') return 'supporter';
  if (productLine === 'sante') return 'sante';
  if (productLine === 'pro_player') return 'pro_player';
  if (productLine === 'pro_club') return 'pro_club';
  if (productLine === 'pro_staff') return 'pro_staff';
  if (productLine === 'pro') return resolveProProductSegmentFromRole(role);
  return 'amateur';
}

export function resolvePoleHelpUsesBriefcaseIcon(
  productLine: ProductLineId,
  role?: string | null,
): boolean {
  if (productLine === 'pro_staff') return true;
  if (productLine === 'pro' && role && STAFF_ROLES.has(role)) return true;
  return false;
}

export function getPoleHelpContent(
  productLine: ProductLineId,
  role?: string | null,
): PoleHelpContent {
  const poleKey = resolvePoleHelpPoleKey(productLine, role);
  return POLE_HELP_BY_KEY[poleKey];
}

export function getPoleHelpQuickSuggestions(content: PoleHelpContent): PoleHelpEntry[] {
  return content.entries.slice(0, 4);
}

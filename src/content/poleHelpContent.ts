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
  bubbleTeaser: string;
  entries: PoleHelpEntry[];
}

export const POLE_HELP_OTHER_QUESTION: PoleHelpEntry = {
  id: 'other',
  question: 'Autre question',
  answer:
    'Pour toute autre demande, contactez support@proday.app — notre équipe vous répond sous 24 h.',
};

const AMATEUR_HELP: PoleHelpContent = {
  poleKey: 'amateur',
  title: 'Aide Amateur',
  bubbleTeaser: 'Une question sur le foot amateur ?',
  welcome:
    'Salut ! Bienvenue sur Pro Day Amateur. Pose-moi une question rapide ci-dessous.',
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
    {
      id: 'convocations',
      question: 'Où voir mes convocations ?',
      answer:
        'Dans Matchs, onglet Convocations : tu y retrouves les sélections, les réponses attendues et l’historique des appels.',
      navigate: { kind: 'matchs', homeTab: 'convocations' },
      navigateLabel: 'Voir mes convocations',
    },
    {
      id: 'tournois',
      question: 'Comment m’inscrire à un tournoi ?',
      answer:
        'L’onglet Matchs propose aussi les tournois ouverts. Filtre par date ou zone, puis inscris ton équipe ou toi-même selon le format.',
      navigate: { kind: 'matchs', homeTab: 'tournois' },
      navigateLabel: 'Parcourir les tournois',
    },
    {
      id: 'stats',
      question: 'Où consulter mes stats de match ?',
      answer:
        'Tes stats individuelles et celles de l’équipe sont dans Matchs, onglet Saison ou Matchs selon la vue disponible pour ton club.',
      navigate: { kind: 'matchs', homeTab: 'matches' },
      navigateLabel: 'Voir mes stats',
    },
    {
      id: 'messages',
      question: 'Comment contacter mon équipe ?',
      answer:
        'L’onglet Messages regroupe les échanges avec ton staff, tes coéquipiers et les clubs. Active les notifications pour ne rien manquer.',
      navigate: { kind: 'tab', tab: 'messages' },
      navigateLabel: 'Ouvrir Messages',
    },
    {
      id: 'notifications',
      question: 'Comment gérer mes notifications ?',
      answer:
        'Depuis ton profil, section Paramètres : choisis quels rappels recevoir (convocations, messages, Mercato, matchs à proximité).',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir les paramètres',
    },
    {
      id: 'candidatures',
      question: 'Comment suivre mes candidatures club ?',
      answer:
        'Tes candidatures Mercato et leurs statuts sont visibles depuis ton profil et l’onglet Mercato. Tu peux relancer ou retirer une candidature.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Voir le Mercato',
    },
    {
      id: 'navigation',
      question: 'Comment naviguer dans l’app amateur ?',
      answer:
        'Accueil Équipe pour le club, Matchs pour le calendrier, Mercato pour le recrutement, Moi pour ton profil. La barre du bas te guide.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Retour à l’accueil',
    },
    {
      id: 'paiement',
      question: 'Où gérer mon abonnement ou mes achats ?',
      answer:
        'Les options premium et l’historique d’achat sont accessibles depuis ton profil ou la boutique ProDay si ton club utilise des services payants.',
      navigate: { kind: 'shop' },
      navigateLabel: 'Ouvrir la boutique',
    },
  ],
};

const SUPPORTER_HELP: PoleHelpContent = {
  poleKey: 'supporter',
  title: 'Aide Supporter',
  bubbleTeaser: 'Une question sur la Tribune ?',
  welcome:
    'Bienvenue sur la Tribune ! Je t’aide à retrouver matchs, suivis et Moments.',
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
    {
      id: 'favoris',
      question: 'Comment ajouter un club favori ?',
      answer:
        'Depuis la fiche d’un club ou le hub match, appuie sur le cœur pour le suivre. Tes favoris apparaissent sur la Tribune et dans Suivis.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir la Tribune',
    },
    {
      id: 'notifications',
      question: 'Comment activer les alertes match ?',
      answer:
        'Dans Compte > Paramètres, active les notifications pour les scores live, les buts de tes favoris et les nouveaux Moments.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Régler les notifications',
    },
    {
      id: 'messages',
      question: 'Où envoyer un message à un créateur ?',
      answer:
        'Depuis le profil d’un joueur ou créateur suivi, ou via l’onglet Messages pour retrouver tes conversations.',
      navigate: { kind: 'tab', tab: 'messages' },
      navigateLabel: 'Ouvrir Messages',
    },
    {
      id: 'stats',
      question: 'Où voir les stats d’un match ?',
      answer:
        'Ouvre un match depuis l’onglet Matchs ou la Tribune : tu y trouves score, compositions et stats clés quand elles sont disponibles.',
      navigate: { kind: 'matchs', homeTab: 'matches' },
      navigateLabel: 'Parcourir les matchs',
    },
    {
      id: 'partage',
      question: 'Comment partager un Moment ?',
      answer:
        'Sur un réel ou highlight, utilise le bouton partager pour l’envoyer à tes contacts ou sur tes réseaux sociaux.',
      navigate: { kind: 'tab', tab: 'reels' },
      navigateLabel: 'Ouvrir Moments',
    },
    {
      id: 'navigation',
      question: 'Comment naviguer dans l’espace supporter ?',
      answer:
        'Tribune pour l’accueil, Suivis pour le fil, Matchs pour le live, Moments pour les réels, Compte pour tes réglages.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Retour Tribune',
    },
    {
      id: 'shop',
      question: 'Où acheter des produits supporter ?',
      answer:
        'La boutique ProDay propose maillots, goodies et offres partenaires liées aux clubs que tu suis.',
      navigate: { kind: 'shop' },
      navigateLabel: 'Ouvrir la boutique',
    },
    {
      id: 'paiement',
      question: 'Comment gérer mes achats ?',
      answer:
        'Historique et moyens de paiement sont dans Compte > Paramètres ou directement depuis la boutique après un achat.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Voir mon compte',
    },
  ],
};

const SANTE_HELP: PoleHelpContent = {
  poleKey: 'sante',
  title: 'Aide Santé',
  bubbleTeaser: 'Une question sur votre espace santé ?',
  welcome:
    'Bonjour ! Ton espace praticien t’attend : agenda, patients et messagerie.',
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
    {
      id: 'disponibilites',
      question: 'Comment gérer mes disponibilités ?',
      answer:
        'Depuis l’agenda ou ton profil, définis tes créneaux ouverts à la prise de rendez-vous et tes indisponibilités récurrentes.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir l’agenda',
    },
    {
      id: 'documents',
      question: 'Où déposer des documents médicaux ?',
      answer:
        'Dans la fiche patient, tu peux joindre comptes rendus, ordonnances ou certificats selon les droits accordés par le joueur.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Voir mes patients',
    },
    {
      id: 'notifications',
      question: 'Comment régler mes alertes ?',
      answer:
        'Profil > Paramètres : choisis les rappels de rendez-vous, messages urgents et mises à jour de dossiers patients.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir les paramètres',
    },
    {
      id: 'facturation',
      question: 'Où suivre ma facturation ?',
      answer:
        'L’historique des consultations facturées et les exports sont accessibles depuis ton profil ou l’accueil selon ton offre.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir mon profil',
    },
    {
      id: 'confidentialite',
      question: 'Comment protéger les données patients ?',
      answer:
        'Les dossiers respectent le consentement du joueur. Vérifie les autorisations dans chaque fiche et les paramètres de confidentialité.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Voir la confidentialité',
    },
    {
      id: 'stats',
      question: 'Où voir mes statistiques de suivi ?',
      answer:
        'L’accueil Santé résume consultations du mois, patients actifs et rappels en attente pour piloter ton activité.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir l’accueil',
    },
    {
      id: 'navigation',
      question: 'Comment naviguer dans l’espace santé ?',
      answer:
        'Accueil pour l’agenda et les patients, Matchs pour le calendrier sportif, Messages pour les échanges, Profil pour tes réglages.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Retour accueil',
    },
    {
      id: 'paiement',
      question: 'Comment gérer mon abonnement praticien ?',
      answer:
        'Offre, renouvellement et factures sont dans Profil > Paramètres ou via support@proday.app pour toute question contractuelle.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Voir mon abonnement',
    },
  ],
};

const PRO_PLAYER_HELP: PoleHelpContent = {
  poleKey: 'pro_player',
  title: 'Aide Pro Joueur',
  bubbleTeaser: 'Une question sur votre carrière pro ?',
  welcome:
    'Salut ! Prêt à booster ta carrière pro ? Stats, CV et opportunités, c’est par ici.',
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
    {
      id: 'convocations',
      question: 'Où voir mes convocations ?',
      answer:
        'Matchs > Convocations : sélections, réponses attendues et historique des appels de ton staff.',
      navigate: { kind: 'matchs', homeTab: 'convocations' },
      navigateLabel: 'Voir mes convocations',
    },
    {
      id: 'messages',
      question: 'Comment contacter mon agent ou un club ?',
      answer:
        'L’onglet Messages centralise tes échanges avec agents, recruteurs et staff. Active les notifications pour les offres urgentes.',
      navigate: { kind: 'tab', tab: 'messages' },
      navigateLabel: 'Ouvrir Messages',
    },
    {
      id: 'visibilite',
      question: 'Comment être visible sur le Mercato ?',
      answer:
        'Complète ton CV, ajoute des vidéos portfolio et indique ta disponibilité dans Profil. Un profil à jour attire plus de clubs.',
      navigate: { kind: 'profile', view: 'cv' },
      navigateLabel: 'Enrichir mon CV',
    },
    {
      id: 'portfolio',
      question: 'Où publier mes highlights ?',
      answer:
        'Moments te permet de publier des clips courts visibles par recruteurs et clubs. Lie-les à ton CV pour plus d’impact.',
      navigate: { kind: 'tab', tab: 'reels' },
      navigateLabel: 'Ouvrir Moments',
    },
    {
      id: 'contrats',
      question: 'Où suivre mes dossiers contractuels ?',
      answer:
        'Les mandats, essais et négociations en cours sont résumés sur l’accueil Carrière et dans Messages avec ton agent.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir Carrière',
    },
    {
      id: 'notifications',
      question: 'Comment gérer mes alertes pro ?',
      answer:
        'Profil > Paramètres : règle les notifications Mercato, messages agents et rappels de convocations.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Régler les alertes',
    },
    {
      id: 'navigation',
      question: 'Comment naviguer dans l’espace pro joueur ?',
      answer:
        'Carrière pour la vue d’ensemble, Matchs pour le calendrier, Opportunités pour le Mercato, Moi pour ton profil et CV.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Retour Carrière',
    },
    {
      id: 'paiement',
      question: 'Où gérer mon abonnement pro ?',
      answer:
        'Offre premium, visibilité Mercato et factures sont dans Profil > Paramètres ou via la boutique ProDay.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Voir mon abonnement',
    },
  ],
};

const PRO_CLUB_HELP: PoleHelpContent = {
  poleKey: 'pro_club',
  title: 'Aide Pro Club',
  bubbleTeaser: 'Une question sur votre club ?',
  welcome:
    'Bonjour ! Gère ton club sereinement : structure, recrutement et calendrier.',
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
    {
      id: 'effectif',
      question: 'Où gérer mon effectif ?',
      answer:
        'Depuis Structure, accède aux listes par équipe, transferts internes et statuts des joueurs (blessure, prêt, etc.).',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir Structure',
    },
    {
      id: 'stats',
      question: 'Où voir les stats de mes équipes ?',
      answer:
        'Calendrier > Saison ou Matchs : stats collectives, feuilles de match et indicateurs par équipe quand disponibles.',
      navigate: { kind: 'matchs', homeTab: 'season' },
      navigateLabel: 'Voir les stats',
    },
    {
      id: 'convocations',
      question: 'Comment envoyer des convocations ?',
      answer:
        'Depuis Calendrier, sélectionne un match ou entraînement et envoie la convocation à l’effectif. Les réponses arrivent en temps réel.',
      navigate: { kind: 'matchs', homeTab: 'convocations' },
      navigateLabel: 'Gérer les convocations',
    },
    {
      id: 'documents',
      question: 'Où stocker les documents du club ?',
      answer:
        'Structure propose un espace documents (statuts, licences, contrats) accessible au staff autorisé.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Ouvrir Structure',
    },
    {
      id: 'tournois',
      question: 'Comment organiser un tournoi ?',
      answer:
        'Calendrier > Tournois : crée un événement, ouvre les inscriptions et publie le programme aux équipes participantes.',
      navigate: { kind: 'matchs', homeTab: 'tournois' },
      navigateLabel: 'Créer un tournoi',
    },
    {
      id: 'notifications',
      question: 'Comment régler les alertes club ?',
      answer:
        'Vitrine > Paramètres : candidatures Mercato, messages staff et rappels calendrier pour ton organisation.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Ouvrir les paramètres',
    },
    {
      id: 'partenaires',
      question: 'Comment mettre en avant mes partenaires ?',
      answer:
        'La vitrine club et la boutique ProDay permettent d’afficher logos partenaires et offres liées à ton club.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Modifier la vitrine',
    },
    {
      id: 'paiement',
      question: 'Où gérer l’abonnement club ?',
      answer:
        'Facturation, sièges staff et options premium sont dans Vitrine > Paramètres ou contacte support@proday.app.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Voir l’abonnement',
    },
  ],
};

const PRO_STAFF_HELP: PoleHelpContent = {
  poleKey: 'pro_staff',
  title: 'Aide Pro Staff',
  bubbleTeaser: 'Je peux vous guider',
  welcome:
    'Salut ! Coach, agent ou recruteur — Mercato, réseau et calendrier à portée de main.',
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
    {
      id: 'scouting',
      question: 'Comment suivre mes cibles scouting ?',
      answer:
        'L’accueil et le Mercato permettent de marquer des joueurs, créer des listes et recevoir des alertes sur leur activité.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Ouvrir le Mercato',
    },
    {
      id: 'candidatures',
      question: 'Où suivre les candidatures reçues ?',
      answer:
        'Mercato > Mes annonces : consulte les profils intéressés, filtre par poste et contacte les candidats en un clic.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Voir les candidatures',
    },
    {
      id: 'dossiers',
      question: 'Comment gérer un dossier joueur ?',
      answer:
        'Depuis la fiche joueur ou Messages, centralise notes, vidéos et échanges avec clubs ou agents pour chaque dossier.',
      navigate: { kind: 'tab', tab: 'messages' },
      navigateLabel: 'Ouvrir Messages',
    },
    {
      id: 'annonces',
      question: 'Comment publier une annonce ?',
      answer:
        'Mercato > Publier : décris le poste, le profil recherché et la zone. L’annonce est visible des joueurs correspondants.',
      navigate: { kind: 'mercato', view: 'home' },
      navigateLabel: 'Publier une annonce',
    },
    {
      id: 'notifications',
      question: 'Comment régler mes alertes staff ?',
      answer:
        'Profil > Paramètres : active les notifications Mercato, messages clients et rappels calendrier selon tes missions.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Régler les alertes',
    },
    {
      id: 'stats',
      question: 'Où voir les stats de mes protégés ?',
      answer:
        'Calendrier et fiches joueurs affichent stats de match et indicateurs récents pour préparer tes dossiers.',
      navigate: { kind: 'matchs', homeTab: 'matches' },
      navigateLabel: 'Voir les stats',
    },
    {
      id: 'navigation',
      question: 'Comment naviguer dans l’espace staff ?',
      answer:
        'Accueil pour les mandats, Mercato pour le recrutement, Calendrier pour les événements, Messages pour le réseau, Profil pour tes réglages.',
      navigate: { kind: 'tab', tab: 'home' },
      navigateLabel: 'Retour accueil',
    },
    {
      id: 'paiement',
      question: 'Où gérer mon abonnement staff ?',
      answer:
        'Offre pro, visibilité Mercato et factures sont dans Profil > Paramètres ou via support@proday.app.',
      navigate: { kind: 'profile' },
      navigateLabel: 'Voir mon abonnement',
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

export function getPoleHelpAllQuestions(content: PoleHelpContent): PoleHelpEntry[] {
  return [...content.entries, POLE_HELP_OTHER_QUESTION];
}

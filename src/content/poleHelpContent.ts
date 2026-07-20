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

export type PoleHelpCategory =
  | 'navigation'
  | 'profil'
  | 'matchs'
  | 'mercato'
  | 'messages'
  | 'club'
  | 'stats'
  | 'paiement'
  | 'pole';

export const POLE_HELP_CATEGORY_ORDER: PoleHelpCategory[] = [
  'navigation',
  'profil',
  'matchs',
  'mercato',
  'messages',
  'club',
  'stats',
  'paiement',
  'pole',
];

export const POLE_HELP_CATEGORY_LABELS: Record<PoleHelpCategory, string> = {
  navigation: 'Navigation & onglets',
  profil: 'Profil & compte',
  matchs: 'Matchs & convocations',
  mercato: 'Mercato & recrutement',
  messages: 'Messages & notifications',
  club: 'Club & équipe',
  stats: 'Stats, Visibilité & CV',
  paiement: 'Paiement & abonnement',
  pole: 'Spécifique',
};

export interface PoleHelpEntry {
  id: string;
  category: PoleHelpCategory;
  question: string;
  answer: string;
  navigate?: PoleHelpNavigateAction;
  navigateLabel?: string;
}

type PoleHelpEntryInput = Omit<PoleHelpEntry, 'category'>;

function withCategory(
  category: PoleHelpCategory,
  entries: PoleHelpEntryInput[],
): PoleHelpEntry[] {
  return entries.map((entry) => ({ ...entry, category }));
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
  category: 'pole',
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
    ...withCategory('navigation', [
      {
        id: 'navigation',
        question: 'Comment naviguer dans l’app amateur ?',
        answer:
          'Accueil Équipe pour le club, Matchs pour le calendrier, Club pour le recrutement, Shop pour la boutique, Moi pour ton profil. La barre du bas + le menu Overflow te guident.',
        navigate: { kind: 'tab', tab: 'home' },
        navigateLabel: 'Retour à l’accueil',
      },
      {
        id: 'barre-bas',
        question: 'À quoi sert la barre du bas ?',
        answer:
          'Elle regroupe tes onglets principaux : équipe, matchs, club, messages, shop et profil. Les autres modules (Reels, Santé…) sont dans le menu overflow.',
        navigate: { kind: 'tab', tab: 'home' },
        navigateLabel: 'Voir l’accueil',
      },
      {
        id: 'pulse-accueil',
        question: 'Quelle différence entre Accueil et Visibilité ?',
        answer:
          'Accueil (Équipe) est ton onglet principal. Visibilité est ton score de visibilité, affiché dans l’Accueil — ce n’est pas un onglet séparé.',
        navigate: { kind: 'tab', tab: 'home' },
        navigateLabel: 'Voir mon Accueil',
      },
      {
        id: 'sponsors-ou',
        question: 'Où sont les sponsors ?',
        answer:
          'Pas d’onglet Sponsors dans la barre : ouvre l’Accueil puis le module Sponsors (grille Accueil) pour voir offres et partenariats.',
        navigate: { kind: 'dashboard', view: 'sponsors' },
        navigateLabel: 'Ouvrir Sponsors',
      },
      {
        id: 'shop-amateur',
        question: 'Où est la boutique ?',
        answer:
          'Onglet Shop dans la barre (ou le menu overflow) : maillots, équipement et offres ProDay pour le foot amateur.',
        navigate: { kind: 'shop' },
        navigateLabel: 'Ouvrir le Shop',
      },
      {
        id: 'retour-accueil',
        question: 'Comment revenir à l’accueil rapidement ?',
        answer:
          'Appuie sur l’icône Équipe dans la barre du bas. Tu retrouves ton club, tes raccourcis et les actus de ton effectif.',
        navigate: { kind: 'tab', tab: 'home' },
        navigateLabel: 'Aller à l’accueil',
      },
    ]),
    ...withCategory('profil', [
      {
        id: 'profil',
        question: 'Comment modifier mon profil ?',
        answer:
          'Onglet Moi : photo, bio, niveau, poste et préférences. Tu peux aussi gérer tes candidatures depuis ton profil.',
        navigate: { kind: 'profile' },
        navigateLabel: 'Ouvrir mon profil',
      },
      {
        id: 'photo-profil',
        question: 'Comment changer ma photo de profil ?',
        answer:
          'Dans Moi, appuie sur ta photo pour en choisir une nouvelle depuis ta galerie ou prendre un selfie.',
        navigate: { kind: 'profile' },
        navigateLabel: 'Modifier ma photo',
      },
      {
        id: 'compte-supprimer',
        question: 'Comment gérer ou supprimer mon compte ?',
        answer:
          'Moi > Paramètres : tu peux modifier ton e-mail, ton mot de passe ou demander la suppression de ton compte.',
        navigate: { kind: 'profile' },
        navigateLabel: 'Ouvrir les paramètres',
      },
    ]),
    ...withCategory('matchs', [
      {
        id: 'matchs',
        question: 'Où sont mes matchs ?',
        answer:
          'Tes matchs, convocations et calendrier de saison sont dans l’onglet Matchs. Tu y retrouves aussi les stats d’équipe.',
        navigate: { kind: 'matchs', homeTab: 'season' },
        navigateLabel: 'Ouvrir Matchs',
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
        id: 'calendrier-saison',
        question: 'Comment voir le calendrier de saison ?',
        answer:
          'Matchs > Saison : vue mensuelle ou liste de toutes tes rencontres, entraînements et événements club.',
        navigate: { kind: 'matchs', homeTab: 'season' },
        navigateLabel: 'Ouvrir la saison',
      },
    ]),
    ...withCategory('mercato', [
      {
        id: 'mercato',
        question: 'Comment trouver un club ou publier une annonce ?',
        answer:
          'Le Mercato local regroupe les annonces de clubs, détections et candidatures. Consulte l’onglet Club / Recrutement pour parcourir ou publier.',
        navigate: { kind: 'mercato', view: 'home' },
        navigateLabel: 'Ouvrir le Mercato',
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
        id: 'annonce-joueur',
        question: 'Comment publier une annonce joueur ?',
        answer:
          'Mercato > Publier : indique ton poste, ton niveau et ta zone. Les clubs intéressés peuvent te contacter directement.',
        navigate: { kind: 'mercato', view: 'home' },
        navigateLabel: 'Publier une annonce',
      },
    ]),
    ...withCategory('messages', [
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
        id: 'push-notifs',
        question: 'Comment activer les notifications push ?',
        answer:
          'Moi > Paramètres > Notifications : autorise ProDay dans les réglages de ton téléphone, puis active les alertes souhaitées.',
        navigate: { kind: 'profile' },
        navigateLabel: 'Activer les alertes',
      },
    ]),
    ...withCategory('club', [
      {
        id: 'club',
        question: 'Où voir mon club et mon effectif ?',
        answer:
          'Depuis l’accueil Équipe, accède à ton club, tes coéquipiers et les infos d’effectif. Les convocations passent par Matchs.',
        navigate: { kind: 'tab', tab: 'home' },
        navigateLabel: 'Aller à l’accueil',
      },
      {
        id: 'coequipiers',
        question: 'Comment voir mes coéquipiers ?',
        answer:
          'Sur l’accueil Équipe, ouvre la fiche de ton club pour consulter la liste des joueurs, staff et contacts.',
        navigate: { kind: 'tab', tab: 'home' },
        navigateLabel: 'Voir mon effectif',
      },
      {
        id: 'quitter-club',
        question: 'Comment quitter mon club ?',
        answer:
          'Contacte ton capitaine ou ton staff via Messages, ou retire ta candidature depuis le Mercato si tu es en recherche.',
        navigate: { kind: 'tab', tab: 'messages' },
        navigateLabel: 'Contacter le staff',
      },
    ]),
    ...withCategory('stats', [
      {
        id: 'stats',
        question: 'Où consulter mes stats de match ?',
        answer:
          'Tes stats individuelles et celles de l’équipe sont dans Matchs, onglet Saison ou Matchs selon la vue disponible pour ton club.',
        navigate: { kind: 'matchs', homeTab: 'matches' },
        navigateLabel: 'Voir mes stats',
      },
      {
        id: 'stats-equipe',
        question: 'Où voir les stats de mon équipe ?',
        answer:
          'Matchs > Saison : classement, buts marqués, clean sheets et autres indicateurs collectifs de ton équipe.',
        navigate: { kind: 'matchs', homeTab: 'season' },
        navigateLabel: 'Stats d’équipe',
      },
    ]),
    ...withCategory('paiement', [
      {
        id: 'paiement',
        question: 'Où gérer mon abonnement ou mes achats ?',
        answer:
          'Les options premium et l’historique d’achat sont accessibles depuis ton profil ou la boutique ProDay si ton club utilise des services payants.',
        navigate: { kind: 'shop' },
        navigateLabel: 'Ouvrir la boutique',
      },
      {
        id: 'annuler-achat',
        question: 'Comment annuler ou contester un achat ?',
        answer:
          'Consulte l’historique dans Moi > Paramètres ou écris à support@proday.app avec ton reçu pour toute demande de remboursement.',
        navigate: { kind: 'profile' },
        navigateLabel: 'Voir mon compte',
      },
    ]),
    ...withCategory('pole', [
      {
        id: 'covoiturage',
        question: 'Comment organiser un covoiturage ?',
        answer:
          'L’onglet Déplacements permet de proposer ou réserver un trajet pour les matchs et entraînements de ton équipe.',
        navigate: { kind: 'tab', tab: 'covoiturage' },
        navigateLabel: 'Ouvrir Déplacements',
      },
      {
        id: 'proposer-trajet',
        question: 'Comment proposer un trajet ?',
        answer:
          'Déplacements > Proposer : indique lieu de départ, horaire et places disponibles. Ton équipe peut réserver en un clic.',
        navigate: { kind: 'tab', tab: 'covoiturage' },
        navigateLabel: 'Proposer un trajet',
      },
      {
        id: 'reserver-trajet',
        question: 'Comment réserver une place en covoiturage ?',
        answer:
          'Dans Déplacements, parcours les trajets proposés pour ton prochain match et réserve ta place directement.',
        navigate: { kind: 'tab', tab: 'covoiturage' },
        navigateLabel: 'Réserver une place',
      },
      {
        id: 'deplacements-venir',
        question: 'Où voir les déplacements à venir ?',
        answer:
          'L’onglet Déplacements liste tes trajets confirmés, proposés et les demandes en attente de ton équipe.',
        navigate: { kind: 'tab', tab: 'covoiturage' },
        navigateLabel: 'Mes déplacements',
      },
    ]),
  ],
};

const SUPPORTER_HELP: PoleHelpContent = {
  poleKey: 'supporter',
  title: 'Aide Supporter',
  bubbleTeaser: 'Une question sur la Tribune ?',
  welcome:
    'Bienvenue sur la Tribune ! Je t’aide à retrouver matchs, suivis et Moments.',
  entries: [
    ...withCategory('navigation', [
      { id: 'navigation', question: 'Comment naviguer dans l’espace supporter ?', answer: 'Tribune pour l’accueil, Suivis pour le fil, Matchs pour le live, Moments pour les réels, Compte pour tes réglages.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Retour Tribune' },
      { id: 'onglets-tribune', question: 'À quoi servent les onglets de la Tribune ?', answer: 'Chaque onglet couvre un usage : actus (Tribune), fil social (Suivis), scores (Matchs), vidéos (Moments) et réglages (Compte).', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Explorer la Tribune' },
      { id: 'raccourcis', question: 'Où trouver mes raccourcis favoris ?', answer: 'La Tribune affiche tes clubs favoris et prochains matchs en haut. Tu peux aussi les retrouver dans Suivis.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir la Tribune' },
    ]),
    ...withCategory('profil', [
      { id: 'profil', question: 'Comment modifier mon compte supporter ?', answer: 'Onglet Compte : identité, clubs favoris, notifications et paramètres de ton espace supporter.', navigate: { kind: 'profile' }, navigateLabel: 'Ouvrir mon compte' },
      { id: 'pseudo-avatar', question: 'Comment changer mon pseudo ou avatar ?', answer: 'Compte > Modifier le profil : mets à jour ton pseudo, ta photo et ta bio visible par la communauté.', navigate: { kind: 'profile' }, navigateLabel: 'Modifier mon profil' },
      { id: 'confidentialite-compte', question: 'Comment gérer la confidentialité de mon compte ?', answer: 'Compte > Paramètres : choisis qui peut te contacter et quelles infos sont visibles sur ton profil public.', navigate: { kind: 'profile' }, navigateLabel: 'Réglages confidentialité' },
    ]),
    ...withCategory('matchs', [
      { id: 'live', question: 'Où voir les matchs en direct ?', answer: 'L’onglet Matchs liste les rencontres du jour, les scores live et les liens vers les hubs match quand ils sont disponibles.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Voir les matchs' },
      { id: 'hub-match', question: 'Comment ouvrir le hub d’un match ?', answer: 'Depuis Matchs ou la Tribune, appuie sur une rencontre pour accéder au score live, aux compositions et aux stats.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Parcourir les matchs' },
      { id: 'calendrier-favoris', question: 'Où voir le calendrier de mes favoris ?', answer: 'La Tribune et l’onglet Matchs regroupent les prochaines rencontres de tes clubs et joueurs suivis.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Calendrier favoris' },
      { id: 'resultats-passes', question: 'Comment consulter les résultats passés ?', answer: 'Matchs > Historique ou filtre par date pour retrouver les scores et temps forts des rencontres terminées.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Résultats passés' },
    ]),
    ...withCategory('mercato', [
      { id: 'transferts', question: 'Où suivre les rumeurs de transfert ?', answer: 'Le fil Suivis et la Tribune affichent les actus Mercato des clubs et joueurs que tu suis.', navigate: { kind: 'tab', tab: 'feed' }, navigateLabel: 'Fil Mercato' },
      { id: 'offres-club', question: 'Comment voir les recrutements de mon club favori ?', answer: 'Depuis la fiche club ou le Mercato, consulte les annonces et mouvements liés aux équipes que tu suis.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Ouvrir le Mercato' },
      { id: 'alertes-mercato', question: 'Comment activer les alertes Mercato ?', answer: 'Compte > Paramètres > Notifications : active les alertes transferts pour tes favoris.', navigate: { kind: 'profile' }, navigateLabel: 'Activer les alertes' },
    ]),
    ...withCategory('messages', [
      { id: 'messages', question: 'Où envoyer un message à un créateur ?', answer: 'Depuis le profil d’un joueur ou créateur suivi, ou via l’onglet Messages pour retrouver tes conversations.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Ouvrir Messages' },
      { id: 'notifications', question: 'Comment activer les alertes match ?', answer: 'Dans Compte > Paramètres, active les notifications pour les scores live, les buts de tes favoris et les nouveaux Moments.', navigate: { kind: 'profile' }, navigateLabel: 'Régler les notifications' },
      { id: 'silencieux', question: 'Comment couper les notifications temporairement ?', answer: 'Compte > Paramètres > Notifications : désactive les alertes match ou Moments selon tes préférences.', navigate: { kind: 'profile' }, navigateLabel: 'Gérer les alertes' },
    ]),
    ...withCategory('club', [
      { id: 'tribune', question: 'Où est ma tribune ?', answer: 'L’accueil Tribune regroupe tes clubs favoris, les prochains matchs à suivre et les temps forts de ta communauté.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir la Tribune' },
      { id: 'favoris', question: 'Comment ajouter un club favori ?', answer: 'Depuis la fiche d’un club ou le hub match, appuie sur le cœur pour le suivre. Tes favoris apparaissent sur la Tribune et dans Suivis.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir la Tribune' },
      { id: 'retirer-favori', question: 'Comment retirer un club de mes favoris ?', answer: 'Ouvre la fiche du club et appuie à nouveau sur le cœur, ou gère ta liste depuis Compte > Clubs favoris.', navigate: { kind: 'profile' }, navigateLabel: 'Gérer mes favoris' },
    ]),
    ...withCategory('stats', [
      { id: 'stats', question: 'Où voir les stats d’un match ?', answer: 'Ouvre un match depuis l’onglet Matchs ou la Tribune : tu y trouves score, compositions et stats clés quand elles sont disponibles.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Parcourir les matchs' },
      { id: 'stats-joueur', question: 'Comment voir les stats d’un joueur suivi ?', answer: 'Depuis son profil ou le hub match, consulte buts, passes décisives et performances récentes.', navigate: { kind: 'tab', tab: 'feed' }, navigateLabel: 'Voir mes suivis' },
      { id: 'classements', question: 'Où consulter les classements ?', answer: 'Matchs ou hub compétition : accède aux classements, forme récente et statistiques de la ligue suivie.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Voir les classements' },
    ]),
    ...withCategory('paiement', [
      { id: 'shop', question: 'Où acheter des produits supporter ?', answer: 'La boutique ProDay propose maillots, goodies et offres partenaires liées aux clubs que tu suis.', navigate: { kind: 'shop' }, navigateLabel: 'Ouvrir la boutique' },
      { id: 'paiement', question: 'Comment gérer mes achats ?', answer: 'Historique et moyens de paiement sont dans Compte > Paramètres ou directement depuis la boutique après un achat.', navigate: { kind: 'profile' }, navigateLabel: 'Voir mon compte' },
    ]),
    ...withCategory('pole', [
      { id: 'suivis', question: 'Comment gérer mes suivis ?', answer: 'L’onglet Suivis (fil) centralise les actus des joueurs, clubs et créateurs que tu suis. Tu peux aussi les retrouver depuis ton profil.', navigate: { kind: 'tab', tab: 'feed' }, navigateLabel: 'Voir mes suivis' },
      { id: 'reels', question: 'Où regarder les Moments / réels ?', answer: 'Moments regroupe les réels foot, highlights et contenus courts de la communauté supporter.', navigate: { kind: 'tab', tab: 'reels' }, navigateLabel: 'Ouvrir Moments' },
      { id: 'partage', question: 'Comment partager un Moment ?', answer: 'Sur un réel ou highlight, utilise le bouton partager pour l’envoyer à tes contacts ou sur tes réseaux sociaux.', navigate: { kind: 'tab', tab: 'reels' }, navigateLabel: 'Ouvrir Moments' },
      { id: 'suivre-joueur', question: 'Comment suivre un joueur ou créateur ?', answer: 'Depuis son profil, appuie sur Suivre. Ses actus, Moments et matchs apparaissent dans ton fil Suivis.', navigate: { kind: 'tab', tab: 'feed' }, navigateLabel: 'Mon fil Suivis' },
    ]),
  ],
};

const SANTE_HELP: PoleHelpContent = {
  poleKey: 'sante',
  title: 'Aide Santé',
  bubbleTeaser: 'Une question sur votre espace santé ?',
  welcome: 'Bonjour ! Ton espace praticien t’attend : agenda, patients et messagerie.',
  entries: [
    ...withCategory('navigation', [
      { id: 'navigation', question: 'Comment naviguer dans l’espace santé ?', answer: 'Accueil pour le cockpit cabinet, Agenda pour le planning, Demandes pour les sollicitations, Vidéos pour vos contenus éducatifs, Messages et Cabinet pour le reste.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Retour accueil' },
      { id: 'onglets-sante', question: 'À quoi servent les onglets santé ?', answer: 'Accueil (cockpit), Agenda (RDV), Demandes, Vidéos (conseils & prévention), Messages sécurisés et Cabinet (profil pro).', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Voir l’accueil' },
      { id: 'videos-sante', question: 'Où publier mes vidéos santé ?', answer: 'Onglet Vidéos : clips éducatifs publics (prévention, étirements). Ce n’est pas la téléconsultation médicale — celle-ci passe par un partenaire conforme (Cal.com / Whereby), pas Zoom.', navigate: { kind: 'tab', tab: 'reels' }, navigateLabel: 'Ouvrir Vidéos' },
      { id: 'teleconsult-hds', question: 'Comment marche la téléconsultation ?', answer: 'Les sportifs réservent depuis l’annuaire Santé. La visio (15 ou 30 min) est gratuite côté ProDay : praticien et joueur rejoignent en un tap, sans abonnement. L’honoraire du praticien reste évent. hors app. Jamais Zoom pour des données de santé.', navigate: { kind: 'tab', tab: 'matchs' }, navigateLabel: 'Voir mon agenda' },
      { id: 'recherche-rapide', question: 'Comment retrouver une info rapidement ?', answer: 'Utilise la recherche patient depuis l’accueil ou filtre ton agenda par date pour accéder vite au bon dossier.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir l’accueil' },
    ]),
    ...withCategory('profil', [
      { id: 'profil', question: 'Comment mettre à jour mon profil praticien ?', answer: 'Onglet Profil : spécialité, cabinet, zone d’intervention et documents visibles par les joueurs et clubs.', navigate: { kind: 'profile' }, navigateLabel: 'Modifier mon profil' },
      { id: 'specialite', question: 'Comment modifier ma spécialité ou cabinet ?', answer: 'Profil > Informations pro : mets à jour ta spécialité, adresse du cabinet et zone d’intervention.', navigate: { kind: 'profile' }, navigateLabel: 'Infos professionnelles' },
      { id: 'compte-praticien', question: 'Comment gérer mon compte praticien ?', answer: 'Profil > Paramètres : e-mail, mot de passe, facturation et préférences de notification.', navigate: { kind: 'profile' }, navigateLabel: 'Paramètres compte' },
    ]),
    ...withCategory('matchs', [
      { id: 'matchs', question: 'Comment lier un suivi à un match ?', answer: 'Le calendrier Matchs te permet de croiser événements sportifs et suivis médicaux quand un joueur est rattaché à une équipe.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Ouvrir le calendrier' },
      { id: 'calendrier-sport', question: 'Où voir le calendrier sportif d’un joueur ?', answer: 'Matchs > Saison affiche les rencontres et entraînements du joueur lié à une équipe ProDay.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Calendrier sportif' },
      { id: 'blessure-match', question: 'Comment noter une blessure liée à un match ?', answer: 'Depuis la fiche patient, ajoute une note ou un certificat en référence à la date du match concerné.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mes patients' },
      { id: 'evenements-club', question: 'Où voir les événements club de mes patients ?', answer: 'Le calendrier Matchs regroupe matchs et entraînements des équipes où tes patients évoluent.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Événements club' },
    ]),
    ...withCategory('mercato', [
      { id: 'recrutement-medical', question: 'Comment être visible auprès des clubs ?', answer: 'Complète ton profil praticien : spécialité, zone et certifications visibles dans l’annuaire santé ProDay.', navigate: { kind: 'profile' }, navigateLabel: 'Compléter mon profil' },
      { id: 'partenariat-club', question: 'Comment devenir praticien référent d’un club ?', answer: 'Contacte le club via Messages ou demande la mise en relation via support@proday.app.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Contacter un club' },
      { id: 'annuaire-sante', question: 'Où apparaît mon profil dans l’annuaire ?', answer: 'Les joueurs et clubs peuvent te trouver via l’annuaire santé une fois ton profil praticien complété et validé.', navigate: { kind: 'profile' }, navigateLabel: 'Voir mon profil' },
    ]),
    ...withCategory('messages', [
      { id: 'messages', question: 'Où est la messagerie ?', answer: 'L’onglet Messages regroupe tes échanges avec joueurs, staff et autres praticiens. Les notifications t’alertent des nouveaux messages.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Ouvrir Messages' },
      { id: 'notifications', question: 'Comment régler mes alertes ?', answer: 'Profil > Paramètres : choisis les rappels de rendez-vous, messages urgents et mises à jour de dossiers patients.', navigate: { kind: 'profile' }, navigateLabel: 'Ouvrir les paramètres' },
      { id: 'message-urgent', question: 'Comment recevoir les messages urgents ?', answer: 'Active les notifications push et la priorité « messages urgents » dans Profil > Paramètres.', navigate: { kind: 'profile' }, navigateLabel: 'Alertes urgentes' },
    ]),
    ...withCategory('club', [
      { id: 'patients-club', question: 'Comment voir les patients d’un club ?', answer: 'Depuis l’accueil, filtre par club ou équipe pour accéder aux dossiers des joueurs rattachés.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Liste patients' },
      { id: 'staff-club', question: 'Comment contacter le staff médical d’un club ?', answer: 'Utilise Messages pour échanger avec le staff ou les autres praticiens du club partenaire.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Messagerie staff' },
      { id: 'autorisations-club', question: 'Comment gérer les autorisations club ?', answer: 'Dans chaque fiche patient, vérifie les droits accordés par le joueur et le club pour partager les dossiers.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Fiches patients' },
    ]),
    ...withCategory('stats', [
      { id: 'stats', question: 'Où voir mes statistiques de suivi ?', answer: 'L’accueil Santé résume consultations du mois, patients actifs et rappels en attente pour piloter ton activité.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir l’accueil' },
      { id: 'activite-mensuelle', question: 'Comment suivre mon activité mensuelle ?', answer: 'L’accueil affiche un résumé des consultations, nouveaux patients et RDV à venir sur 30 jours.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Tableau de bord' },
      { id: 'rapports-sante', question: 'Où générer un rapport de suivi ?', answer: 'Depuis la fiche patient, exporte un compte rendu ou un résumé de suivi selon les droits du dossier.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mes patients' },
    ]),
    ...withCategory('paiement', [
      { id: 'facturation', question: 'Où suivre ma facturation ?', answer: 'L’historique des consultations facturées et les exports sont accessibles depuis ton profil ou l’accueil selon ton offre.', navigate: { kind: 'profile' }, navigateLabel: 'Ouvrir mon profil' },
      { id: 'paiement', question: 'Comment gérer mon abonnement praticien ?', answer: 'Offre, renouvellement et factures sont dans Profil > Paramètres ou via support@proday.app pour toute question contractuelle.', navigate: { kind: 'profile' }, navigateLabel: 'Voir mon abonnement' },
    ]),
    ...withCategory('pole', [
      { id: 'rdv', question: 'Où voir mes rendez-vous ?', answer: 'Ton agenda et tes créneaux à venir sont sur l’accueil Santé. Tu peux filtrer par jour et accéder au détail de chaque consultation.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir l’agenda' },
      { id: 'patients', question: 'Comment retrouver un patient ?', answer: 'Depuis l’accueil, accède à la liste de tes patients suivis et à leur historique de suivi. Utilise la recherche si tu as beaucoup de dossiers.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Voir mes patients' },
      { id: 'disponibilites', question: 'Comment gérer mes disponibilités ?', answer: 'Depuis l’agenda ou ton profil, définis tes créneaux ouverts à la prise de rendez-vous et tes indisponibilités récurrentes.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir l’agenda' },
      { id: 'documents', question: 'Où déposer des documents médicaux ?', answer: 'Dans la fiche patient, tu peux joindre comptes rendus, ordonnances ou certificats selon les droits accordés par le joueur.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Voir mes patients' },
      { id: 'confidentialite', question: 'Comment protéger les données patients ?', answer: 'Les dossiers respectent le consentement du joueur. Vérifie les autorisations dans chaque fiche et les paramètres de confidentialité.', navigate: { kind: 'profile' }, navigateLabel: 'Voir la confidentialité' },
    ]),
  ],
};

const PRO_PLAYER_HELP: PoleHelpContent = {
  poleKey: 'pro_player',
  title: 'Aide Pro Joueur',
  bubbleTeaser: 'Une question sur votre carrière pro ?',
  welcome: 'Salut ! Prêt à booster ta carrière pro ? Stats, CV et opportunités, c’est par ici.',
  entries: [
    ...withCategory('navigation', [
      { id: 'navigation', question: 'Comment naviguer dans l’espace pro joueur ?', answer: 'Carrière pour la vue d’ensemble (avec ta Visibilité), Opportunités pour le Mercato, Réels pour tes vidéos, Groupe pour le calendrier, Shop pour la boutique, Moi pour ton profil et CV.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Retour Carrière' },
      { id: 'barre-pro', question: 'À quoi sert la barre de navigation pro ?', answer: 'Elle regroupe Carrière, Opportunités, Réels, Groupe, Shop et Profil — chaque icône mène à un espace clé de ta carrière.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Accueil Carrière' },
      { id: 'pulse-accueil', question: 'Quelle différence entre Accueil et Visibilité ?', answer: 'Accueil (Carrière) est ton onglet principal. Visibilité est ton score de visibilité scouting, affiché dans Carrière — ce n’est pas un onglet séparé.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Voir ma Visibilité' },
      { id: 'sponsors-ou', question: 'Où sont les sponsors ?', answer: 'Pas d’onglet Sponsors dans la barre : depuis Carrière (Accueil), ouvre le module Sponsors pour les offres partenaires.', navigate: { kind: 'dashboard', view: 'sponsors' }, navigateLabel: 'Ouvrir Sponsors' },
      { id: 'shop-pro', question: 'Où est la boutique ?', answer: 'Onglet Shop : équipement, merch et offres liées à ta marque / ta carrière.', navigate: { kind: 'shop' }, navigateLabel: 'Ouvrir le Shop' },
      { id: 'raccourcis-carriere', question: 'Où trouver mes raccourcis carrière ?', answer: 'L’accueil Carrière affiche tes objectifs, mandats en cours et liens rapides vers CV et Mercato.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir Carrière' },
    ]),
    ...withCategory('profil', [
      { id: 'profil', question: 'Comment modifier mon profil pro ?', answer: 'Onglet Moi : identité pro, agent, disponibilité et visibilité auprès des clubs.', navigate: { kind: 'profile' }, navigateLabel: 'Ouvrir mon profil' },
      { id: 'agent', question: 'Comment renseigner mon agent ?', answer: 'Profil > Informations pro : ajoute les coordonnées de ton agent pour que les clubs sachent qui contacter.', navigate: { kind: 'profile' }, navigateLabel: 'Infos agent' },
      { id: 'disponibilite', question: 'Comment indiquer ma disponibilité ?', answer: 'Profil > Disponibilité : précise si tu es libre, sous contrat ou en recherche active de club.', navigate: { kind: 'profile' }, navigateLabel: 'Ma disponibilité' },
    ]),
    ...withCategory('matchs', [
      { id: 'stats', question: 'Où sont mes stats ?', answer: 'L’onglet Groupe / Matchs affiche tes stats individuelles, le calendrier et les convocations de ton club.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Voir mes stats' },
      { id: 'convocations', question: 'Où voir mes convocations ?', answer: 'Matchs > Convocations : sélections, réponses attendues et historique des appels de ton staff.', navigate: { kind: 'matchs', homeTab: 'convocations' }, navigateLabel: 'Voir mes convocations' },
      { id: 'calendrier-pro', question: 'Où voir mon calendrier pro ?', answer: 'Matchs > Saison : matchs officiels, entraînements et événements club sur la saison en cours.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Mon calendrier' },
      { id: 'feuille-match', question: 'Comment consulter une feuille de match ?', answer: 'Depuis Matchs, ouvre une rencontre passée pour voir ta fiche individuelle et les stats du match.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Mes matchs' },
    ]),
    ...withCategory('mercato', [
      { id: 'opportunites', question: 'Comment trouver des opportunités ?', answer: 'L’onglet Opportunités (Mercato) liste les annonces clubs, essais et contacts recruteurs adaptés à ton profil.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Voir les opportunités' },
      { id: 'visibilite', question: 'Comment être visible sur le Mercato ?', answer: 'Complète ton CV, ajoute des vidéos portfolio et indique ta disponibilité dans Profil. Un profil à jour attire plus de clubs.', navigate: { kind: 'profile', view: 'cv' }, navigateLabel: 'Enrichir mon CV' },
      { id: 'candidature-club', question: 'Comment postuler à une annonce club ?', answer: 'Mercato > Annonces : filtre par poste et zone, puis envoie ta candidature avec ton CV sportif.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Parcourir les annonces' },
    ]),
    ...withCategory('messages', [
      { id: 'messages', question: 'Comment contacter mon agent ou un club ?', answer: 'L’onglet Messages centralise tes échanges avec agents, recruteurs et staff. Active les notifications pour les offres urgentes.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Ouvrir Messages' },
      { id: 'notifications', question: 'Comment gérer mes alertes pro ?', answer: 'Profil > Paramètres : règle les notifications Mercato, messages agents et rappels de convocations.', navigate: { kind: 'profile' }, navigateLabel: 'Régler les alertes' },
      { id: 'offre-urgente', question: 'Comment ne pas manquer une offre ?', answer: 'Active les notifications push Mercato et messages prioritaires dans Profil > Paramètres.', navigate: { kind: 'profile' }, navigateLabel: 'Alertes Mercato' },
    ]),
    ...withCategory('club', [
      { id: 'carriere', question: 'Où voir ma carrière ?', answer: 'L’accueil Carrière résume ton parcours, tes objectifs et les indicateurs clés de performance.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir Carrière' },
      { id: 'contrats', question: 'Où suivre mes dossiers contractuels ?', answer: 'Les mandats, essais et négociations en cours sont résumés sur l’accueil Carrière et dans Messages avec ton agent.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mes dossiers' },
      { id: 'equipe-actuelle', question: 'Comment voir mon équipe actuelle ?', answer: 'Carrière ou Matchs affichent ton club, ton staff et les infos de ton groupe si tu es sous contrat.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mon club' },
    ]),
    ...withCategory('stats', [
      { id: 'cv', question: 'Comment mettre à jour mon CV / portfolio ?', answer: 'Depuis Profil, complète ton CV sportif, tes vidéos portfolio (Moments) et tes candidatures en cours.', navigate: { kind: 'profile', view: 'cv' }, navigateLabel: 'Ouvrir mon CV' },
      { id: 'portfolio', question: 'Où publier mes highlights ?', answer: 'Moments te permet de publier des clips courts visibles par recruteurs et clubs. Lie-les à ton CV pour plus d’impact.', navigate: { kind: 'tab', tab: 'reels' }, navigateLabel: 'Ouvrir Moments' },
      { id: 'pulse-stats', question: 'Où voir ma Visibilité et mes indicateurs ?', answer: 'Sur l’Accueil Carrière : Visibilité est ton score de visibilité (pas un onglet). Matchs / Groupe affichent aussi tes stats clés et ta forme récente.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mon Visibilité' },
    ]),
    ...withCategory('paiement', [
      { id: 'paiement', question: 'Où gérer mon abonnement pro ?', answer: 'Offre premium, visibilité Mercato et factures sont dans Profil > Paramètres ou via la boutique ProDay.', navigate: { kind: 'profile' }, navigateLabel: 'Voir mon abonnement' },
      { id: 'premium-visibilite', question: 'Comment booster ma visibilité premium ?', answer: 'Profil > Abonnement : découvre les options premium pour mettre en avant ton CV sur le Mercato.', navigate: { kind: 'shop' }, navigateLabel: 'Options premium' },
    ]),
    ...withCategory('pole', [
      { id: 'essai-club', question: 'Comment organiser un essai en club ?', answer: 'Via Mercato ou Messages avec le recruteur : fixe dates, lieu et suivi depuis ton accueil Carrière.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Mes opportunités' },
      { id: 'video-recruteurs', question: 'Comment attirer les recruteurs avec mes vidéos ?', answer: 'Publie tes meilleurs clips dans Moments et lie-les à ton CV pour un portfolio percutant.', navigate: { kind: 'profile', view: 'cv' }, navigateLabel: 'Mon portfolio' },
      { id: 'objectifs-saison', question: 'Comment fixer mes objectifs de saison ?', answer: 'Carrière > Objectifs : définis tes cibles stats et suivi ta progression sur la saison.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mes objectifs' },
      { id: 'transfer-window', question: 'Comment préparer une période de transfert ?', answer: 'Mets à jour CV, disponibilité et vidéos avant la mercato. Surveille Opportunités et Messages agents.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Préparer la mercato' },
    ]),
  ],
};

const PRO_CLUB_HELP: PoleHelpContent = {
  poleKey: 'pro_club',
  title: 'Aide Pro Club',
  bubbleTeaser: 'Une question sur votre club ?',
  welcome: 'Bonjour ! Gère ton club sereinement : structure, recrutement et calendrier.',
  entries: [
    ...withCategory('navigation', [
      { id: 'navigation', question: 'Comment naviguer dans l’espace pro club ?', answer: 'Structure pour l’organisation, Recrutement pour le Mercato, Calendrier pour les matchs, Communication pour les messages, Vitrine pour ta présentation.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir Structure' },
      { id: 'onglets-club', question: 'À quoi servent les onglets club ?', answer: 'Chaque onglet couvre un volet : équipes (Structure), annonces (Recrutement), planning (Calendrier), échanges (Communication) et image (Vitrine).', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Vue d’ensemble' },
      { id: 'dashboard-club', question: 'Où voir le tableau de bord club ?', answer: 'L’accueil Structure résume effectifs, prochains matchs, candidatures Mercato et alertes staff.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Tableau de bord' },
    ]),
    ...withCategory('profil', [
      { id: 'profil', question: 'Comment mettre à jour la vitrine club ?', answer: 'Onglet Vitrine : logo, présentation, palmarès et informations visibles par les joueurs et partenaires.', navigate: { kind: 'profile' }, navigateLabel: 'Ouvrir la vitrine' },
      { id: 'logo-club', question: 'Comment changer le logo du club ?', answer: 'Vitrine > Identité visuelle : importe un nouveau logo et mets à jour les couleurs officielles.', navigate: { kind: 'profile' }, navigateLabel: 'Identité club' },
      { id: 'compte-club', question: 'Comment gérer le compte administrateur ?', answer: 'Vitrine > Paramètres : admins, rôles staff et accès aux sections sensibles du club.', navigate: { kind: 'profile' }, navigateLabel: 'Admins club' },
    ]),
    ...withCategory('matchs', [
      { id: 'calendrier', question: 'Où est le calendrier du club ?', answer: 'L’onglet Calendrier regroupe matchs, entraînements, tournois et convocations de toutes tes équipes.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Ouvrir le calendrier' },
      { id: 'convocations', question: 'Comment envoyer des convocations ?', answer: 'Depuis Calendrier, sélectionne un match ou entraînement et envoie la convocation à l’effectif. Les réponses arrivent en temps réel.', navigate: { kind: 'matchs', homeTab: 'convocations' }, navigateLabel: 'Gérer les convocations' },
      { id: 'tournois', question: 'Comment organiser un tournoi ?', answer: 'Calendrier > Tournois : crée un événement, ouvre les inscriptions et publie le programme aux équipes participantes.', navigate: { kind: 'matchs', homeTab: 'tournois' }, navigateLabel: 'Créer un tournoi' },
      { id: 'entrainements', question: 'Comment planifier les entraînements ?', answer: 'Calendrier > Créer : ajoute séances récurrentes ou ponctuelles et convoque l’effectif concerné.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Planifier séances' },
    ]),
    ...withCategory('mercato', [
      { id: 'recrutement', question: 'Comment recruter des joueurs ou du staff ?', answer: 'L’onglet Recrutement permet de publier des annonces, suivre les candidatures et contacter des profils.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Ouvrir Recrutement' },
      { id: 'publier-annonce', question: 'Comment publier une annonce recrutement ?', answer: 'Recrutement > Publier : décris le poste, le profil recherché et la zone. L’annonce est visible des joueurs correspondants.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Publier une annonce' },
      { id: 'candidatures-recues', question: 'Où voir les candidatures reçues ?', answer: 'Recrutement > Mes annonces : consulte les profils intéressés, filtre par poste et contacte les candidats.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Candidatures reçues' },
    ]),
    ...withCategory('messages', [
      { id: 'communication', question: 'Comment communiquer avec mon effectif ?', answer: 'Utilise l’onglet Communication pour envoyer des messages groupés ou individuels à tes joueurs et staff.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Ouvrir Communication' },
      { id: 'notifications', question: 'Comment régler les alertes club ?', answer: 'Vitrine > Paramètres : candidatures Mercato, messages staff et rappels calendrier pour ton organisation.', navigate: { kind: 'profile' }, navigateLabel: 'Ouvrir les paramètres' },
      { id: 'message-groupe', question: 'Comment envoyer un message à toute une équipe ?', answer: 'Communication > Nouveau : sélectionne une équipe et rédige ton message groupé.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Message groupe' },
    ]),
    ...withCategory('club', [
      { id: 'structure', question: 'Où gérer la structure du club ?', answer: 'L’accueil Structure centralise équipes, staff, documents et vue d’ensemble de ton organisation.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir Structure' },
      { id: 'effectif', question: 'Où gérer mon effectif ?', answer: 'Depuis Structure, accède aux listes par équipe, transferts internes et statuts des joueurs (blessure, prêt, etc.).', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mon effectif' },
      { id: 'documents', question: 'Où stocker les documents du club ?', answer: 'Structure propose un espace documents (statuts, licences, contrats) accessible au staff autorisé.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Documents club' },
    ]),
    ...withCategory('stats', [
      { id: 'stats', question: 'Où voir les stats de mes équipes ?', answer: 'Calendrier > Saison ou Matchs : stats collectives, feuilles de match et indicateurs par équipe quand disponibles.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Voir les stats' },
      { id: 'feuilles-match', question: 'Comment consulter les feuilles de match ?', answer: 'Calendrier > Matchs passés : accède aux feuilles, compositions et stats individuelles par rencontre.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Feuilles de match' },
      { id: 'bilan-saison', question: 'Où voir le bilan de saison ?', answer: 'Structure ou Calendrier > Saison : synthèse des résultats, buts et classements par équipe.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Bilan saison' },
    ]),
    ...withCategory('paiement', [
      { id: 'paiement', question: 'Où gérer l’abonnement club ?', answer: 'Facturation, sièges staff et options premium sont dans Vitrine > Paramètres ou contacte support@proday.app.', navigate: { kind: 'profile' }, navigateLabel: 'Voir l’abonnement' },
      { id: 'partenaires', question: 'Comment mettre en avant mes partenaires ?', answer: 'La vitrine club et la boutique ProDay permettent d’afficher logos partenaires et offres liées à ton club.', navigate: { kind: 'profile' }, navigateLabel: 'Modifier la vitrine' },
    ]),
    ...withCategory('pole', [
      { id: 'equipes-multiples', question: 'Comment gérer plusieurs équipes ?', answer: 'Structure > Équipes : crée ou modifie tes catégories (U19, réserve, pro…) et assigne staff et joueurs.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mes équipes' },
      { id: 'staff-roles', question: 'Comment attribuer des rôles au staff ?', answer: 'Structure > Staff : invite des membres et définis leurs droits (convocations, Mercato, documents).', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Gérer le staff' },
      { id: 'licences', question: 'Où suivre les licences joueurs ?', answer: 'Structure > Effectif : consulte le statut licence et les documents obligatoires par joueur.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Licences' },
      { id: 'partenariat-proday', question: 'Comment contacter ProDay pour le club ?', answer: 'Écris à support@proday.app ou utilise Vitrine > Aide pour toute demande institutionnelle.', navigate: { kind: 'profile' }, navigateLabel: 'Aide club' },
    ]),
  ],
};

const PRO_STAFF_HELP: PoleHelpContent = {
  poleKey: 'pro_staff',
  title: 'Aide Pro Staff',
  bubbleTeaser: 'Je peux vous guider',
  welcome: 'Salut ! Coach, agent ou recruteur — Mercato, réseau et calendrier à portée de main.',
  entries: [
    ...withCategory('navigation', [
      { id: 'navigation', question: 'Comment naviguer dans l’espace staff ?', answer: 'Accueil pour les mandats, Mercato pour le recrutement, Calendrier pour les événements, Messages pour le réseau, Profil pour tes réglages.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Retour accueil' },
      { id: 'onglets-staff', question: 'À quoi servent les onglets staff ?', answer: 'Mandats (Accueil), annonces et scouting (Mercato), planning (Calendrier), réseau (Messages) et identité pro (Profil).', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Explorer l’accueil' },
      { id: 'vue-mandats', question: 'Où voir tous mes mandats actifs ?', answer: 'L’accueil regroupe tes missions en cours avec raccourcis vers dossiers, calendrier et messages.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mes mandats' },
    ]),
    ...withCategory('profil', [
      { id: 'profil', question: 'Comment mettre à jour mon profil staff ?', answer: 'Onglet Profil : spécialité, certifications, zone géographique et visibilité auprès des clubs.', navigate: { kind: 'profile' }, navigateLabel: 'Modifier mon profil' },
      { id: 'certifications', question: 'Comment ajouter mes certifications ?', answer: 'Profil > Parcours : renseigne diplômes, licences fédérales et certifications visibles par les clubs.', navigate: { kind: 'profile' }, navigateLabel: 'Mes certifications' },
      { id: 'visibilite-staff', question: 'Comment être visible auprès des clubs ?', answer: 'Complète ton profil staff et indique ta zone. Les clubs peuvent te contacter via Messages ou le Mercato.', navigate: { kind: 'profile' }, navigateLabel: 'Visibilité pro' },
    ]),
    ...withCategory('matchs', [
      { id: 'calendrier', question: 'Où est mon calendrier staff ?', answer: 'L’onglet Calendrier liste matchs, détections, rendez-vous et événements liés à tes missions.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Ouvrir le calendrier' },
      { id: 'detections', question: 'Comment planifier une détection ?', answer: 'Calendrier > Créer : ajoute une session de détection, invite des joueurs et lie-la à ton mandat.', navigate: { kind: 'matchs', homeTab: 'season' }, navigateLabel: 'Planifier détection' },
      { id: 'matchs-proteges', question: 'Où voir les matchs de mes protégés ?', answer: 'Calendrier filtre par joueur ou mandat pour afficher les rencontres de tes dossiers actifs.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Matchs protégés' },
      { id: 'convocations-staff', question: 'Comment suivre les convocations staff ?', answer: 'Calendrier > Convocations : consulte les appels liés à tes missions club ou académie.', navigate: { kind: 'matchs', homeTab: 'convocations' }, navigateLabel: 'Convocations' },
    ]),
    ...withCategory('mercato', [
      { id: 'mercato', question: 'Comment publier ou consulter le Mercato ?', answer: 'L’onglet Mercato / Recrutement permet de publier des annonces, suivre les candidatures et rechercher des profils.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Ouvrir le Mercato' },
      { id: 'annonces', question: 'Comment publier une annonce ?', answer: 'Mercato > Publier : décris le poste, le profil recherché et la zone. L’annonce est visible des joueurs correspondants.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Publier une annonce' },
      { id: 'candidatures', question: 'Où suivre les candidatures reçues ?', answer: 'Mercato > Mes annonces : consulte les profils intéressés, filtre par poste et contacte les candidats en un clic.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Voir les candidatures' },
    ]),
    ...withCategory('messages', [
      { id: 'reseau', question: 'Comment développer mon réseau ?', answer: 'Messages et l’accueil te suggèrent des contacts pertinents (joueurs, clubs, agents). Tu peux aussi explorer depuis le Mercato.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Ouvrir Messages' },
      { id: 'notifications', question: 'Comment régler mes alertes staff ?', answer: 'Profil > Paramètres : active les notifications Mercato, messages clients et rappels calendrier selon tes missions.', navigate: { kind: 'profile' }, navigateLabel: 'Régler les alertes' },
      { id: 'contact-club', question: 'Comment contacter un club rapidement ?', answer: 'Depuis Mercato ou la fiche club, envoie un message direct ou retrouve la conversation dans Messages.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Contacter un club' },
    ]),
    ...withCategory('club', [
      { id: 'mandats', question: 'Où voir mes mandats et missions ?', answer: 'L’accueil regroupe tes mandats en cours, alertes scouting et raccourcis vers tes dossiers actifs.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Ouvrir l’accueil' },
      { id: 'dossiers', question: 'Comment gérer un dossier joueur ?', answer: 'Depuis la fiche joueur ou Messages, centralise notes, vidéos et échanges avec clubs ou agents pour chaque dossier.', navigate: { kind: 'tab', tab: 'messages' }, navigateLabel: 'Mes dossiers' },
      { id: 'mission-club', question: 'Comment lier une mission à un club ?', answer: 'Accueil > Mandats : crée ou accepte un mandat club pour centraliser calendrier, Mercato et messages.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Gérer mandats' },
    ]),
    ...withCategory('stats', [
      { id: 'stats', question: 'Où voir les stats de mes protégés ?', answer: 'Calendrier et fiches joueurs affichent stats de match et indicateurs récents pour préparer tes dossiers.', navigate: { kind: 'matchs', homeTab: 'matches' }, navigateLabel: 'Voir les stats' },
      { id: 'scouting-stats', question: 'Comment analyser un profil scouting ?', answer: 'Fiche joueur : stats, vidéos portfolio et notes scouting pour comparer tes cibles.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Profils scouting' },
      { id: 'rapport-scouting', question: 'Où rédiger un rapport de scouting ?', answer: 'Depuis la fiche joueur ou ton dossier, ajoute notes et évaluation visible dans ton mandat.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Rapport scouting' },
    ]),
    ...withCategory('paiement', [
      { id: 'paiement', question: 'Où gérer mon abonnement staff ?', answer: 'Offre pro, visibilité Mercato et factures sont dans Profil > Paramètres ou via support@proday.app.', navigate: { kind: 'profile' }, navigateLabel: 'Voir mon abonnement' },
      { id: 'facturation-mandats', question: 'Comment suivre la facturation de mes mandats ?', answer: 'Profil > Facturation : historique et exports selon ton offre staff ProDay.', navigate: { kind: 'profile' }, navigateLabel: 'Ma facturation' },
    ]),
    ...withCategory('pole', [
      { id: 'scouting', question: 'Comment suivre mes cibles scouting ?', answer: 'L’accueil et le Mercato permettent de marquer des joueurs, créer des listes et recevoir des alertes sur leur activité.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Listes scouting' },
      { id: 'listes-joueurs', question: 'Comment créer une liste de joueurs ?', answer: 'Mercato > Listes : regroupe tes cibles par poste, mandat ou projet de recrutement.', navigate: { kind: 'mercato', view: 'home' }, navigateLabel: 'Mes listes' },
      { id: 'alertes-scouting', question: 'Comment activer les alertes scouting ?', answer: 'Profil > Paramètres : notifications quand un joueur suivi publie ou change de statut Mercato.', navigate: { kind: 'profile' }, navigateLabel: 'Alertes scouting' },
      { id: 'agent-mandat', question: 'Comment gérer plusieurs mandats agents ?', answer: 'Accueil : bascule entre mandats actifs et accède aux dossiers, calendrier et messages de chaque mission.', navigate: { kind: 'tab', tab: 'home' }, navigateLabel: 'Mes missions' },
    ]),
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

export function getPoleHelpQuestionCount(content: PoleHelpContent): number {
  return content.entries.length;
}

export interface PoleHelpCategoryGroup {
  category: PoleHelpCategory;
  label: string;
  entries: PoleHelpEntry[];
}

export function groupPoleHelpEntriesByCategory(
  content: PoleHelpContent,
): PoleHelpCategoryGroup[] {
  const byCategory = new Map<PoleHelpCategory, PoleHelpEntry[]>();
  for (const entry of content.entries) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }
  return POLE_HELP_CATEGORY_ORDER.filter((category) => byCategory.has(category)).map(
    (category) => ({
      category,
      label: POLE_HELP_CATEGORY_LABELS[category],
      entries: byCategory.get(category) ?? [],
    }),
  );
}

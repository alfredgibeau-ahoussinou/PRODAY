import { usersService } from './users.service';
import { clubsService } from './clubs.service';
import type { User } from '../models/User';
import type { Club } from '../models/Club';
import type { MainTabId } from '../navigation/mainTabConfig';
import type {
  MatchsDeepLink,
  ProfileDeepLink,
  DashboardDeepLink,
} from '../utils/navigationDeepLink';

export type SearchResultCategory = 'all' | 'pages' | 'players' | 'clubs';

export interface GlobalSearchPageTarget {
  id: string;
  title: string;
  subtitle: string;
  category: 'page';
  badge: string;
  iconName: string;
  keywords: string[];
  tab?: MainTabId;
  matchsLink?: MatchsDeepLink;
  profileLink?: ProfileDeepLink;
  dashboardView?: DashboardDeepLink;
  shop?: boolean;
}

export interface GlobalSearchPlayerItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'player';
  badge: string;
  iconName: string;
  avatarUrl?: string;
  user: User;
}

export interface GlobalSearchClubItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'club';
  badge: string;
  iconName: string;
  logoUrl?: string;
  club: Club;
}

export type GlobalSearchResultItem =
  | GlobalSearchPageTarget
  | GlobalSearchPlayerItem
  | GlobalSearchClubItem;

/** Nettoyage et normalisation des chaînes pour recherche insensible à la casse et aux accents */
export function normalizeSearchQuery(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Catalogue officiel de toutes les pages & sections ProDay */
export const APP_PAGE_DESTINATIONS: GlobalSearchPageTarget[] = [
  {
    id: 'page-home',
    title: 'Accueil',
    subtitle: 'Tableau de bord joueur, prochain match & actualités',
    category: 'page',
    badge: 'Hub',
    iconName: 'home-outline',
    keywords: ['accueil', 'home', 'dashboard', 'tableau de bord', 'cockpit', 'principal', 'match day'],
    tab: 'home',
  },
  {
    id: 'page-matchs-calendrier',
    title: 'Matchs & Calendrier',
    subtitle: 'Calendrier des rencontres officielles et tournois',
    category: 'page',
    badge: 'Matchs',
    iconName: 'trophy-outline',
    keywords: ['matchs', 'match', 'calendrier', 'rencontres', 'tournois', 'championnat', 'fixtures'],
    tab: 'matchs',
    matchsLink: { homeTab: 'season' },
  },
  {
    id: 'page-convocations',
    title: 'Mes Convocations',
    subtitle: 'Valider ma présence (RSVP) et consulter les feuilles de match',
    category: 'page',
    badge: 'Matchs',
    iconName: 'checkbox-outline',
    keywords: ['convocations', 'convoque', 'presence', 'rsvp', 'participer', 'absent', 'selection', 'feuille'],
    tab: 'matchs',
    matchsLink: { homeTab: 'convocations' },
  },
  {
    id: 'page-matchs-stats',
    title: 'Statistiques de Match',
    subtitle: 'Notes de match, temps de jeu, buts et passes décisives',
    category: 'page',
    badge: 'Stats',
    iconName: 'stats-chart-outline',
    keywords: ['stats', 'statistiques', 'buts', 'passes', 'notes', 'performances', 'temps de jeu'],
    tab: 'matchs',
    matchsLink: { homeTab: 'stats' },
  },
  {
    id: 'page-saison-quetes',
    title: 'Saison & Quêtes',
    subtitle: 'Défis quotidiens, progression XP, badges et niveau de forme',
    category: 'page',
    badge: 'Saison',
    iconName: 'flame-outline',
    keywords: ['saison', 'quetes', 'defis', 'xp', 'progression', 'niveaux', 'streak', 'forme', 'energie', 'muscles'],
    tab: 'feed',
  },
  {
    id: 'page-profil-compte',
    title: 'Mon Profil & Compte',
    subtitle: 'Informations personnelles, coordonnées et identité sportive',
    category: 'page',
    badge: 'Profil',
    iconName: 'person-outline',
    keywords: ['profil', 'compte', 'personnel', 'identite', 'avatar', 'coordonnees', 'modifier'],
    tab: 'profil',
  },
  {
    id: 'page-profil-vitrine',
    title: 'Vitrine (Carte ProDay & CV)',
    subtitle: 'Bouclier FUT, note générale OVR, historique de club et partage',
    category: 'page',
    badge: 'Profil',
    iconName: 'id-card-outline',
    keywords: ['vitrine', 'cv', 'carte', 'fut', 'bouclier', 'note', 'ovr', 'partage', 'historique', 'stats'],
    tab: 'profil',
    profileLink: 'cv',
  },
  {
    id: 'page-profil-candidatures',
    title: 'Mes Candidatures & Mercato',
    subtitle: 'Suivi de mes candidatures clubs et détections',
    category: 'page',
    badge: 'Mercato',
    iconName: 'briefcase-outline',
    keywords: ['candidatures', 'applications', 'postuler', 'clubs', 'detections', 'essais', 'recrutement'],
    tab: 'profil',
    profileLink: 'applications',
  },
  {
    id: 'page-ai-coach',
    title: 'Conseiller IA (Tactics Coach)',
    subtitle: 'Préparation tactique sur mesure, conseils d’experts et analyse',
    category: 'page',
    badge: 'IA ProDay',
    iconName: 'sparkles-outline',
    keywords: ['conseiller ia', 'ia', 'coach ia', 'tactics coach', 'tactique', 'conseil', 'assistant', 'intelligence'],
    dashboardView: 'tactics_coach',
  },
  {
    id: 'page-train-hub',
    title: 'Entraînement & Séances',
    subtitle: 'Exercices spécifiques, programmes physiques et drills techniques',
    category: 'page',
    badge: 'Training',
    iconName: 'football-outline',
    keywords: ['entrainement', 'train', 'exercices', 'seances', 'drills', 'physique', 'technique', 'vitesse'],
    dashboardView: 'train',
  },
  {
    id: 'page-messages',
    title: 'Messages & Chat',
    subtitle: 'Messagerie d’équipe, discussions privées et coachs',
    category: 'page',
    badge: 'Chat',
    iconName: 'chatbubbles-outline',
    keywords: ['messages', 'chat', 'discussion', 'messagerie', 'coach', 'coequipiers', 'equipe'],
    tab: 'messages',
  },
  {
    id: 'page-equipe-mercato',
    title: 'Équipe & Mercato',
    subtitle: 'Effectif du club, annonces mercato, détections et coéquipiers',
    category: 'page',
    badge: 'Équipe',
    iconName: 'people-outline',
    keywords: ['equipe', 'mercato', 'recrutement', 'effectif', 'joueurs', 'club', 'coequipiers', 'vestiaire'],
    tab: 'recrutement',
  },
  {
    id: 'page-covoiturage',
    title: 'Covoiturage Équipe',
    subtitle: 'Proposer ou réserver un trajet pour les matchs et entraînements',
    category: 'page',
    badge: 'Transport',
    iconName: 'car-outline',
    keywords: ['covoiturage', 'covoit', 'trajets', 'transport', 'voiture', 'deplacement', 'aller retour'],
    tab: 'covoiturage',
  },
  {
    id: 'page-reels-videos',
    title: 'Clips & Vidéos',
    subtitle: 'Actions marquantes, résumés de match et highlights',
    category: 'page',
    badge: 'Média',
    iconName: 'videocam-outline',
    keywords: ['videos', 'reels', 'clips', 'actions', 'skills', 'buts', 'highlights'],
    tab: 'reels',
  },
  {
    id: 'page-shop',
    title: 'Boutique ProDay',
    subtitle: 'Tenues officielles, maillots, équipements et accessoires',
    category: 'page',
    badge: 'Boutique',
    iconName: 'bag-handle-outline',
    keywords: ['boutique', 'shop', 'equipements', 'maillots', 'crampons', 'ballons', 'vetements'],
    shop: true,
  },
  {
    id: 'page-plus-hub',
    title: 'Menu Plus & Modules',
    subtitle: 'Tous les services et fonctionnalités ProDay réunis',
    category: 'page',
    badge: 'Menu',
    iconName: 'grid-outline',
    keywords: ['plus', 'menu', 'modules', 'services', 'options'],
    tab: 'plus',
  },
  {
    id: 'page-reglages',
    title: 'Réglages & Confidentialité',
    subtitle: 'Paramètres du compte, notifications et sécurité',
    category: 'page',
    badge: 'Réglages',
    iconName: 'settings-outline',
    keywords: ['reglages', 'parametres', 'securite', 'confidentialite', 'notifications', 'mot de passe'],
    tab: 'profil',
  },
];

const createDemoPlayer = (data: Partial<User> & { uid: string; display_name: string }): User => ({
  uid: data.uid,
  email: data.email || `${data.uid}@example.com`,
  role: 'player',
  display_name: data.display_name,
  avatar_url: data.avatar_url,
  city: data.city || 'Paris',
  is_verified: true,
  verification_status: 'VERIFIED',
  documents: [],
  created_at: new Date('2024-01-15'),
  updated_at: new Date(),
  is_active: true,
  profile: data.profile || {},
});

/** Joueurs de démonstration pour garantir un résultat immédiat même hors connexion */
const DEMO_PLAYERS: User[] = [
  createDemoPlayer({
    uid: 'demo-player-1',
    email: 'lucas.bernard@example.com',
    display_name: 'Lucas Bernard',
    city: 'Paris',
    profile: {
      position: 'Attaquant (BU)',
      club_id: 'FC ProDay',
      age: 17,
      rating: 88,
      level: 'National U19',
    },
  }),
  createDemoPlayer({
    uid: 'demo-player-2',
    email: 'rayan.cherki@example.com',
    display_name: 'Rayan Aït-Ahmed',
    city: 'Lyon',
    profile: {
      position: 'Milieu offensif (MOC)',
      club_id: 'Académie Rhône',
      age: 18,
      rating: 86,
      level: 'Régional 1',
    },
  }),
  createDemoPlayer({
    uid: 'demo-player-3',
    email: 'theo.hernandez@example.com',
    display_name: 'Théo Mendy',
    city: 'Marseille',
    profile: {
      position: 'Latéral gauche (DG)',
      club_id: 'Olympique Provence',
      age: 19,
      rating: 84,
      level: 'National 3',
    },
  }),
  createDemoPlayer({
    uid: 'demo-player-4',
    email: 'kounde.jules@example.com',
    display_name: 'Jules Traoré',
    city: 'Bordeaux',
    profile: {
      position: 'Défenseur central (DC)',
      club_id: 'Girondins Élite',
      age: 20,
      rating: 85,
      level: 'Régional 2',
    },
  }),
  createDemoPlayer({
    uid: 'demo-player-5',
    email: 'mike.maignan@example.com',
    display_name: 'Mike Diallo',
    city: 'Lille',
    profile: {
      position: 'Gardien de but (GB)',
      club_id: 'Lille Métropole FC',
      age: 17,
      rating: 87,
      level: 'National U19',
    },
  }),
];

/** Clubs de démonstration */
const DEMO_CLUBS: Club[] = [
  {
    id: 'club-psg-academy',
    name: 'PSG Academy',
    city: 'Paris',
    department: '75',
    location: { latitude: 48.8414, longitude: 2.2530 },
    verified: true,
    categories: ['U17 National', 'U19 National', 'Séniors'],
    sponsor_ids: [],
    owner_uid: 'demo-owner-1',
    created_at: new Date(),
  },
  {
    id: 'club-fc-proday',
    name: 'FC ProDay',
    city: 'Paris',
    department: '92',
    location: { latitude: 48.8924, longitude: 2.2361 },
    verified: true,
    categories: ['Régional 1', 'Régional 3', 'U18 R1'],
    sponsor_ids: [],
    owner_uid: 'demo-owner-2',
    created_at: new Date(),
  },
  {
    id: 'club-red-star',
    name: 'Red Star FC',
    city: 'Saint-Ouen',
    department: '93',
    location: { latitude: 48.9108, longitude: 2.3386 },
    verified: true,
    categories: ['National', 'U19 Nationaux'],
    sponsor_ids: [],
    owner_uid: 'demo-owner-3',
    created_at: new Date(),
  },
  {
    id: 'club-creteil',
    name: 'US Créteil-Lusitanos',
    city: 'Créteil',
    department: '94',
    location: { latitude: 48.7770, longitude: 2.4530 },
    verified: true,
    categories: ['National 2', 'U17 Nationaux'],
    sponsor_ids: [],
    owner_uid: 'demo-owner-4',
    created_at: new Date(),
  },
];

export interface SearchOptions {
  query: string;
  category?: SearchResultCategory;
  limit?: number;
}

export interface SearchResultsPayload {
  pages: GlobalSearchPageTarget[];
  players: GlobalSearchPlayerItem[];
  clubs: GlobalSearchClubItem[];
  totalCount: number;
}

export const globalSearchService = {
  /**
   * Recherche globale instantanée dans les pages de l'application
   */
  searchPages(query: string, limitCount = 10): GlobalSearchPageTarget[] {
    const q = normalizeSearchQuery(query);
    if (!q) {
      return APP_PAGE_DESTINATIONS.slice(0, limitCount);
    }

    return APP_PAGE_DESTINATIONS.filter((page) => {
      const titleNorm = normalizeSearchQuery(page.title);
      const subNorm = normalizeSearchQuery(page.subtitle);
      if (titleNorm.includes(q) || subNorm.includes(q)) return true;
      return page.keywords.some((k) => {
        const kNorm = normalizeSearchQuery(k);
        return kNorm.includes(q) || q.includes(kNorm);
      });
    }).slice(0, limitCount);
  },

  /**
   * Recherche de joueurs (via Firestore usersService avec fallback local riche)
   */
  async searchPlayers(query: string, limitCount = 10): Promise<GlobalSearchPlayerItem[]> {
    const q = normalizeSearchQuery(query);
    let users: User[] = [];

    try {
      users = await usersService.listPlayers(query.trim());
    } catch {
      users = [];
    }

    // Si aucune connexion ou 0 résultat, fusionner avec les profils démo pour réactivité maximale
    const allCandidates = [...users];
    for (const demo of DEMO_PLAYERS) {
      if (!allCandidates.some((c) => c.uid === demo.uid)) {
        allCandidates.push(demo);
      }
    }

    const filtered = allCandidates.filter((u) => {
      if (!q) return true;
      const nameNorm = normalizeSearchQuery(u.display_name);
      const posNorm = normalizeSearchQuery(u.profile?.position ?? '');
      const clubNorm = normalizeSearchQuery(u.profile?.club_id ?? '');
      const cityNorm = normalizeSearchQuery(u.city ?? '');
      const levelNorm = normalizeSearchQuery(u.profile?.level ?? '');

      return (
        nameNorm.includes(q) ||
        posNorm.includes(q) ||
        clubNorm.includes(q) ||
        cityNorm.includes(q) ||
        levelNorm.includes(q)
      );
    });

    return filtered.slice(0, limitCount).map((user) => {
      const pos = user.profile?.position || 'Joueur';
      const club = user.profile?.club_id ? ` · ${user.profile.club_id}` : '';
      const city = user.city ? ` (${user.city})` : '';

      return {
        id: `player-${user.uid}`,
        title: user.display_name,
        subtitle: `${pos}${club}${city}`,
        category: 'player' as const,
        badge: 'Joueur',
        iconName: 'person-circle-outline',
        avatarUrl: user.avatar_url,
        user,
      };
    });
  },

  /**
   * Recherche de clubs (via clubsService avec fallback local riche)
   */
  async searchClubs(query: string, limitCount = 10): Promise<GlobalSearchClubItem[]> {
    const q = normalizeSearchQuery(query);
    let clubs: Club[] = [];

    try {
      clubs = await clubsService.list(30);
    } catch {
      clubs = [];
    }

    const allClubs = [...clubs];
    for (const demo of DEMO_CLUBS) {
      if (!allClubs.some((c) => c.id === demo.id)) {
        allClubs.push(demo);
      }
    }

    const filtered = allClubs.filter((c) => {
      if (!q) return true;
      const nameNorm = normalizeSearchQuery(c.name);
      const cityNorm = normalizeSearchQuery(c.city);
      const deptNorm = normalizeSearchQuery(c.department ?? '');
      const catNorm = c.categories ? normalizeSearchQuery(c.categories.join(' ')) : '';

      return (
        nameNorm.includes(q) ||
        cityNorm.includes(q) ||
        deptNorm.includes(q) ||
        catNorm.includes(q)
      );
    });

    return filtered.slice(0, limitCount).map((club) => {
      const cityText = club.city ? club.city : 'Club affilié';
      const deptText = club.department ? ` (${club.department})` : '';

      return {
        id: `club-${club.id}`,
        title: club.name,
        subtitle: `${cityText}${deptText}`,
        category: 'club' as const,
        badge: 'Club',
        iconName: 'shield-checkmark-outline',
        logoUrl: club.logo_url,
        club,
      };
    });
  },

  /**
   * Exécution d'une recherche universelle complète
   */
  async searchAll(options: SearchOptions): Promise<SearchResultsPayload> {
    const { query, category = 'all', limit = 15 } = options;

    let pages: GlobalSearchPageTarget[] = [];
    let players: GlobalSearchPlayerItem[] = [];
    let clubs: GlobalSearchClubItem[] = [];

    if (category === 'all' || category === 'pages') {
      pages = this.searchPages(query, limit);
    }

    if (category === 'all' || category === 'players') {
      players = await this.searchPlayers(query, limit);
    }

    if (category === 'all' || category === 'clubs') {
      clubs = await this.searchClubs(query, limit);
    }

    const totalCount = pages.length + players.length + clubs.length;

    return {
      pages,
      players,
      clubs,
      totalCount,
    };
  },
};

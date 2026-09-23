import { usersService } from './users.service';
import { clubsService } from './clubs.service';
import { teamsService } from './teams.service';
import { teamEventsService } from './teamEvents.service';
import type { User } from '../models/User';
import type { Club } from '../models/Club';
import type { Team } from '../models/Team';
import { EVENT_TYPE_LABELS, type TeamEvent } from '../models/TeamEvent';
import { formatEventScheduleLabel } from '../utils/teamEventFormatting';
import type { PlayerSearchScope } from '../utils/playerSearchScope';
import type { MainTabId } from '../navigation/mainTabConfig';
import type {
  MatchsDeepLink,
  ProfileDeepLink,
  DashboardDeepLink,
} from '../utils/navigationDeepLink';

export type SearchResultCategory =
  | 'all'
  | 'pages'
  | 'players'
  | 'clubs'
  | 'teams'
  | 'events';

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

export interface GlobalSearchTeamItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'team';
  badge: string;
  iconName: string;
  team: Team;
}

export interface GlobalSearchEventItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'event';
  badge: string;
  iconName: string;
  event: TeamEvent;
}

export type GlobalSearchResultItem =
  | GlobalSearchPageTarget
  | GlobalSearchPlayerItem
  | GlobalSearchClubItem
  | GlobalSearchTeamItem
  | GlobalSearchEventItem;

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

export interface SearchOptions {
  query: string;
  category?: SearchResultCategory;
  limit?: number;
  /**
   * Périmètre club autorisé. Sans identifiant de club, la recherche d'équipes et
   * d'événements est **désactivée** (aucun résultat) : on ne cherche jamais dans
   * un club que l'utilisateur ne peut pas consulter.
   */
  clubId?: string | null;
  /**
   * Périmètre autorisé pour la recherche de **personnes** (CA-12). Obligatoire
   * pour obtenir des résultats : sans périmètre, aucune personne ne remonte.
   */
  scope?: PlayerSearchScope | null;
}

export interface SearchResultsPayload {
  pages: GlobalSearchPageTarget[];
  players: GlobalSearchPlayerItem[];
  clubs: GlobalSearchClubItem[];
  teams: GlobalSearchTeamItem[];
  events: GlobalSearchEventItem[];
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
   * Recherche de personnes — profils réels de Firestore, **filtrés par le
   * périmètre autorisé** du lecteur (CA-12).
   *
   * - `global` : administration plateforme et rôles de découverte (agent, recruteur).
   * - `club`   : requête bornée au club du lecteur — aucune lecture inter-clubs.
   * - `none`   : aucun résultat, jamais un repli sur l'annuaire global.
   *
   * Aucun profil de démonstration n'est injecté : service injoignable ou aucun
   * résultat ⇒ liste vide honnête.
   */
  async searchPlayers(
    query: string,
    scope: PlayerSearchScope,
    limitCount = 10,
  ): Promise<GlobalSearchPlayerItem[]> {
    const q = normalizeSearchQuery(query);
    let users: User[] = [];

    if (scope.mode === 'none') {
      return [];
    }

    try {
      users =
        scope.mode === 'global'
          ? await usersService.listPlayers(query.trim())
          : scope.clubId
            ? await usersService.listPlayersInClub(scope.clubId, query.trim())
            : [];
    } catch {
      users = [];
    }

    const filtered = users.filter((u) => {
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
   * Recherche de clubs — exclusivement les clubs réels de Firestore
   * (clubsService.list). Aucun club de démonstration injecté :
   * service injoignable ou aucun résultat => liste vide honnête.
   */
  async searchClubs(query: string, limitCount = 10): Promise<GlobalSearchClubItem[]> {
    const q = normalizeSearchQuery(query);
    let clubs: Club[] = [];

    try {
      clubs = await clubsService.list(30);
    } catch {
      clubs = [];
    }

    const filtered = clubs.filter((c) => {
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
   * Recherche des équipes d'un club autorisé — Firestore uniquement
   * (`teamsService.listByClubId`). Aucun club fourni ou service injoignable
   * ⇒ liste vide honnête, jamais un effectif inventé.
   */
  async searchTeams(
    query: string,
    clubId?: string | null,
    limitCount = 10,
  ): Promise<GlobalSearchTeamItem[]> {
    if (!clubId) return [];
    const q = normalizeSearchQuery(query);
    let teams: Team[] = [];

    try {
      teams = await teamsService.listByClubId(clubId);
    } catch {
      teams = [];
    }

    return teams
      .filter((team) => {
        if (!q) return true;
        const nameNorm = normalizeSearchQuery(team.name);
        const catNorm = normalizeSearchQuery(team.category ?? '');
        const divNorm = normalizeSearchQuery(team.fff_division_label ?? '');
        return nameNorm.includes(q) || catNorm.includes(q) || divNorm.includes(q);
      })
      .slice(0, limitCount)
      .map((team) => ({
        id: `team-${team.id}`,
        title: team.name,
        subtitle:
          [team.category, team.fff_division_label].filter(Boolean).join(' · ') || 'Équipe',
        category: 'team' as const,
        badge: 'Équipe',
        iconName: 'people-outline',
        team,
      }));
  },

  /**
   * Recherche des événements d'un club autorisé — Firestore uniquement
   * (`teamEventsService.listForClub`). Les libellés d'horaire viennent du
   * formateur partagé (`teamEventFormatting`) pour rester identiques au pôle Coach.
   */
  async searchEvents(
    query: string,
    clubId?: string | null,
    limitCount = 10,
  ): Promise<GlobalSearchEventItem[]> {
    if (!clubId) return [];
    const q = normalizeSearchQuery(query);
    let events: TeamEvent[] = [];

    try {
      events = await teamEventsService.listForClub(clubId, 120);
    } catch {
      events = [];
    }

    return events
      .filter((event) => {
        if (!q) return true;
        const titleNorm = normalizeSearchQuery(event.title ?? '');
        const typeNorm = normalizeSearchQuery(EVENT_TYPE_LABELS[event.event_type] ?? '');
        const cityNorm = normalizeSearchQuery(event.city ?? '');
        const placeNorm = normalizeSearchQuery(event.location_label ?? event.location ?? '');
        return (
          titleNorm.includes(q) ||
          typeNorm.includes(q) ||
          cityNorm.includes(q) ||
          placeNorm.includes(q)
        );
      })
      .slice(0, limitCount)
      .map((event) => ({
        id: `event-${event.id}`,
        title: formatEventScheduleLabel(event),
        subtitle: `${EVENT_TYPE_LABELS[event.event_type] ?? 'Événement'} · ${
          event.location_label ?? event.location ?? event.city
        }`,
        category: 'event' as const,
        badge: EVENT_TYPE_LABELS[event.event_type] ?? 'Événement',
        iconName: 'calendar-outline',
        event,
      }));
  },

  /**
   * Exécution d'une recherche universelle complète
   */
  async searchAll(options: SearchOptions): Promise<SearchResultsPayload> {
    const { query, category = 'all', limit = 15, clubId = null, scope = null } = options;

    let pages: GlobalSearchPageTarget[] = [];
    let players: GlobalSearchPlayerItem[] = [];
    let clubs: GlobalSearchClubItem[] = [];
    let teams: GlobalSearchTeamItem[] = [];
    let events: GlobalSearchEventItem[] = [];

    if (category === 'all' || category === 'pages') {
      pages = this.searchPages(query, limit);
    }

    if ((category === 'all' || category === 'players') && scope) {
      players = await this.searchPlayers(query, scope, limit);
    }

    if (category === 'all' || category === 'clubs') {
      clubs = await this.searchClubs(query, limit);
    }

    if (category === 'all' || category === 'teams') {
      teams = await this.searchTeams(query, clubId, limit);
    }

    if (category === 'all' || category === 'events') {
      events = await this.searchEvents(query, clubId, limit);
    }

    const totalCount =
      pages.length + players.length + clubs.length + teams.length + events.length;

    return {
      pages,
      players,
      clubs,
      teams,
      events,
      totalCount,
    };
  },
};

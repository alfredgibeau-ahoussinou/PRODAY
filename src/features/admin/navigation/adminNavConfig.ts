import type { IconName } from '../../../components/ui/iconNames';

/**
 * Espace Admin — IA fondateur exhaustive.
 * Menu riche scrollable · une page par capacité · sous-pages entités.
 */

export type AdminNavGroupId =
  | 'command'
  | 'people'
  | 'orgs'
  | 'fff'
  | 'business'
  | 'content'
  | 'platform';

export type AdminNavSectionId =
  | 'overview'
  | 'queue'
  | 'health'
  | 'audit'
  | 'users'
  | 'user_create'
  | 'verifications'
  | 'memberships'
  | 'beta'
  | 'clubs'
  | 'club_create'
  | 'teams'
  | 'cameras'
  | 'claims'
  | 'effectifs'
  | 'classements'
  | 'directory'
  | 'sync'
  | 'payments'
  | 'subscriptions'
  | 'quotes'
  | 'shop'
  | 'sponsors'
  | 'reels'
  | 'feed'
  | 'messages'
  | 'stages'
  | 'recruitment'
  | 'config'
  | 'traffic'
  | 'tournaments';

export type AdminNavItem = {
  id: AdminNavSectionId;
  label: string;
  shortLabel: string;
  icon: IconName;
  group: AdminNavGroupId;
  hint?: string;
  badgeKey?: 'queue' | 'claims' | 'memberships' | 'verifications' | 'beta';
};

export type AdminNavGroup = {
  id: AdminNavGroupId;
  label: string;
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { id: 'command', label: 'Pilotage' },
  { id: 'people', label: 'Personnes' },
  { id: 'orgs', label: 'Organisations' },
  { id: 'fff', label: 'Données FFF' },
  { id: 'business', label: 'Business' },
  { id: 'content', label: 'Contenu' },
  { id: 'platform', label: 'Plateforme' },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Commande',
    shortLabel: 'Cmd',
    icon: 'grid',
    group: 'command',
    hint: 'Vue ops · actions urgentes · raccourcis',
  },
  {
    id: 'queue',
    label: 'File prioritaire',
    shortLabel: 'File',
    icon: 'list',
    group: 'command',
    hint: 'Toute la file de travail',
    badgeKey: 'queue',
  },
  {
    id: 'health',
    label: 'Santé plateforme',
    shortLabel: 'Santé',
    icon: 'fitness',
    group: 'command',
    hint: 'Score · stats · trafic',
  },
  {
    id: 'audit',
    label: 'Journal audit',
    shortLabel: 'Audit',
    icon: 'document-text',
    group: 'command',
    hint: 'Actions admin récentes',
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    shortLabel: 'Users',
    icon: 'person',
    group: 'people',
    hint: 'Comptes · détail multi-pages',
  },
  {
    id: 'user_create',
    label: 'Créer un compte',
    shortLabel: 'Créer',
    icon: 'add',
    group: 'people',
    hint: 'Auth + Firestore forcé',
  },
  {
    id: 'verifications',
    label: 'Vérifications ID',
    shortLabel: 'ID',
    icon: 'checkmark-circle',
    group: 'people',
    hint: 'Docs · validation profils',
    badgeKey: 'verifications',
  },
  {
    id: 'memberships',
    label: 'Adhésions',
    shortLabel: 'Adhés.',
    icon: 'handshake',
    group: 'people',
    hint: 'Demandes d’adhésion club',
    badgeKey: 'memberships',
  },
  {
    id: 'beta',
    label: 'Liste d’attente bêta',
    shortLabel: 'Bêta',
    icon: 'star',
    group: 'people',
    hint: 'Approve · reject · welcome mail',
    badgeKey: 'beta',
  },
  {
    id: 'clubs',
    label: 'Clubs',
    shortLabel: 'Clubs',
    icon: 'business',
    group: 'orgs',
    hint: 'Liste · détail multi-onglets',
  },
  {
    id: 'club_create',
    label: 'Créer un club',
    shortLabel: 'Nouveau',
    icon: 'add',
    group: 'orgs',
    hint: 'Fiche club forcée',
  },
  {
    id: 'teams',
    label: 'Équipes',
    shortLabel: 'Équipes',
    icon: 'shirt',
    group: 'orgs',
    hint: 'Teams Firestore',
  },
  {
    id: 'cameras',
    label: 'Caméras club',
    shortLabel: 'Cams',
    icon: 'camera',
    group: 'orgs',
    hint: 'Inventaire caméras',
  },
  {
    id: 'claims',
    label: 'Claims FFF',
    shortLabel: 'Claims',
    icon: 'shield',
    group: 'fff',
    hint: 'Revendications clubs publics',
    badgeKey: 'claims',
  },
  {
    id: 'effectifs',
    label: 'Effectifs / rostres',
    shortLabel: 'Roster',
    icon: 'people',
    group: 'fff',
    hint: 'Caches FootClubs · force sync',
  },
  {
    id: 'classements',
    label: 'Classements',
    shortLabel: 'Class.',
    icon: 'stats-chart',
    group: 'fff',
    hint: 'Standings · override · sync',
  },
  {
    id: 'directory',
    label: 'Annuaire public FFF',
    shortLabel: 'Annuaire',
    icon: 'globe',
    group: 'fff',
    hint: 'Sync directory public',
  },
  {
    id: 'sync',
    label: 'Jobs de sync',
    shortLabel: 'Sync',
    icon: 'refresh',
    group: 'fff',
    hint: 'Déclencheurs FFF / FootClubs',
  },
  {
    id: 'payments',
    label: 'Paiements',
    shortLabel: 'Pay',
    icon: 'bag',
    group: 'business',
    hint: 'Demandes de paiement équipe',
  },
  {
    id: 'subscriptions',
    label: 'Abonnements',
    shortLabel: 'Abo',
    icon: 'star',
    group: 'business',
    hint: 'Pro · free · demandes upgrade',
  },
  {
    id: 'quotes',
    label: 'Devis clubs',
    shortLabel: 'Devis',
    icon: 'document',
    group: 'business',
    hint: 'Quotes commerciaux club',
  },
  {
    id: 'shop',
    label: 'Commandes boutique',
    shortLabel: 'Shop',
    icon: 'bag',
    group: 'business',
    hint: 'Shop orders',
  },
  {
    id: 'sponsors',
    label: 'Sponsors & funding',
    shortLabel: 'Spons.',
    icon: 'briefcase',
    group: 'business',
    hint: 'Offres · goals · devis partenaires',
  },
  {
    id: 'reels',
    label: 'Reels communauté',
    shortLabel: 'Reels',
    icon: 'videocam',
    group: 'content',
    hint: 'Modération · signalements',
  },
  {
    id: 'feed',
    label: 'Feed plateforme',
    shortLabel: 'Feed',
    icon: 'flash',
    group: 'content',
    hint: 'News feed admin',
  },
  {
    id: 'messages',
    label: 'Messages',
    shortLabel: 'Msgs',
    icon: 'chatbubbles',
    group: 'content',
    hint: 'Threads · suppression admin',
  },
  {
    id: 'stages',
    label: 'Stages',
    shortLabel: 'Stages',
    icon: 'school',
    group: 'content',
    hint: 'Offres · candidatures',
  },
  {
    id: 'recruitment',
    label: 'Recrutement',
    shortLabel: 'Recrut.',
    icon: 'search',
    group: 'content',
    hint: 'Annonces · candidatures',
  },
  {
    id: 'config',
    label: 'Config plateforme',
    shortLabel: 'Config',
    icon: 'settings',
    group: 'platform',
    hint: 'Flags · paramètres globaux',
  },
  {
    id: 'traffic',
    label: 'Trafic & stats',
    shortLabel: 'Trafic',
    icon: 'stats-chart',
    group: 'platform',
    hint: 'Visites site · app opens',
  },
  {
    id: 'tournaments',
    label: 'Tournois',
    shortLabel: 'Tournois',
    icon: 'trophy',
    group: 'platform',
    hint: 'Tournois organisés',
  },
];

/** Rail = menu complet (scroll OK). */
export const ADMIN_RAIL_IDS: AdminNavSectionId[] = ADMIN_NAV_ITEMS.map((n) => n.id);

/** @deprecated alias tests. */
export const ADMIN_PRIMARY_NAV_IDS: AdminNavSectionId[] = ADMIN_RAIL_IDS;

/** @deprecated plus de menu overflow séparé. */
export const ADMIN_MENU_DEST_IDS: AdminNavSectionId[] = [];

export type AdminNavTarget = {
  section: AdminNavSectionId;
  focusId?: string;
  query?: string;
};

const SECTION_SET = new Set<string>(ADMIN_NAV_ITEMS.map((n) => n.id));

export function isAdminNavSectionId(id: string): id is AdminNavSectionId {
  return SECTION_SET.has(id);
}

export function findAdminNavItem(id: AdminNavSectionId): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((n) => n.id === id);
}

export function adminNavItemsInGroup(group: AdminNavGroupId): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((n) => n.group === group);
}

/** Legacy Bureau Ops / Cockpit / FOC → Espace Admin. */
const LEGACY_MAP: Record<string, AdminNavTarget> = {
  dashboard: { section: 'overview' },
  accueil: { section: 'overview' },
  tour: { section: 'overview' },
  cockpit: { section: 'overview' },
  pulse: { section: 'overview' },
  ia: { section: 'overview' },
  menu: { section: 'overview' },
  overview: { section: 'overview' },
  users: { section: 'users' },
  utilisateurs: { section: 'users' },
  comptes: { section: 'users' },
  personnes: { section: 'users' },
  adherents: { section: 'users' },
  clubs: { section: 'clubs' },
  annuaire: { section: 'clubs' },
  visual: { section: 'clubs' },
  activite: { section: 'audit' },
  business: { section: 'quotes' },
  finances: { section: 'payments' },
  abonnements: { section: 'subscriptions' },
  commercial: { section: 'quotes' },
  devis: { section: 'quotes' },
  contenus: { section: 'reels' },
  securite: { section: 'verifications' },
  parametres: { section: 'config' },
  systeme: { section: 'health' },
  plateforme: { section: 'config' },
  produit: { section: 'config' },
  support: { section: 'queue' },
  donnees: { section: 'effectifs' },
  data: { section: 'effectifs' },
  effectifs: { section: 'effectifs' },
  rosters: { section: 'effectifs' },
  standings: { section: 'classements' },
  classements: { section: 'classements' },
  tableaux: { section: 'classements' },
  claims: { section: 'claims' },
  identite: { section: 'claims' },
  identity: { section: 'claims' },
  file: { section: 'queue' },
  pilotage: { section: 'overview' },
  decisions: { section: 'queue' },
  gestion: { section: 'users' },
  health: { section: 'health' },
  audit: { section: 'audit' },
  beta: { section: 'beta' },
  sync: { section: 'sync' },
};

export function resolveAdminNav(id: string): AdminNavTarget {
  if (isAdminNavSectionId(id)) {
    return { section: id };
  }
  return LEGACY_MAP[id] ?? { section: 'overview' };
}

export function resolveAdminCommandItems(): {
  id: string;
  label: string;
  section: AdminNavSectionId;
  keywords: string[];
}[] {
  const base = ADMIN_NAV_ITEMS.map((n) => ({
    id: n.id,
    label: n.label,
    section: n.id,
    keywords: [n.label, n.shortLabel, n.hint ?? '', n.id].join(' ').toLowerCase().split(/\s+/),
  }));
  return [
    ...base,
    {
      id: 'cmd-claims',
      label: 'Traiter claims FFF',
      section: 'claims',
      keywords: ['claim', 'fff', 'pending'],
    },
    {
      id: 'cmd-standings',
      label: 'Force sync classements',
      section: 'classements',
      keywords: ['fff', 'standings', 'classements', 'sync'],
    },
    {
      id: 'cmd-rosters',
      label: 'Force sync effectifs',
      section: 'effectifs',
      keywords: ['roster', 'effectif', 'footclubs', 'sync'],
    },
    {
      id: 'cmd-actions',
      label: 'File prioritaire',
      section: 'queue',
      keywords: ['todo', 'urgent', 'file', 'queue'],
    },
    {
      id: 'cmd-clubs',
      label: 'Créer / éditer club',
      section: 'clubs',
      keywords: ['club', 'crud', 'logo'],
    },
    {
      id: 'cmd-users',
      label: 'Gérer utilisateurs',
      section: 'users',
      keywords: ['user', 'compte', 'role', 'permission'],
    },
  ];
}

import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import {
  rolesForProductLine,
  isRoleAllowedForProductLine,
  productLineLabel,
} from './universeRoles';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { ProDayModuleId } from './prodayModules';
import {
  getModulesForRole,
  getRoleDashboardMeta,
  type RoleDashboardMeta,
} from './roleDashboardExperience';
import { getMercatoTabLabel } from './mercatoTabLabel';
import { DISCOVER_UNIVERSE_CARDS } from './discoverChapters';
import { DISCOVER_UNIVERSE_CARDS_WOMAN } from './discoverWomanContent';
import { DISCOVER_UNIVERSE_CARDS_PRO } from './discoverProContent';
import { DISCOVER_UNIVERSE_CARDS_SANTE } from './discoverSanteContent';
import {
  getPhysioTabLabel,
  isMedicalPractitionerRole,
  PHYSIO_MAIN_TABS,
} from './medicalExperience';
import {
  getSponsorTabLabel,
  isSponsorRole,
  SPONSOR_MAIN_TABS,
} from './sponsorExperience';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';
import { injectFamilyTab } from './familyExperience';
import type { User } from '../models/User';

/** Groupes de rôles à l'inscription — filtrés par pôle. */
export interface SignupRoleGroup {
  id: string;
  label: string;
  hint: string;
  roles: UserRole[];
}

const PRO_SIGNUP_GROUPS: SignupRoleGroup[] = [
  {
    id: 'recruiter',
    label: 'Recruteurs',
    hint: 'Scouting, annonces Mercato et pipeline candidatures',
    roles: ['recruiter'],
  },
  {
    id: 'staff',
    label: 'Staff',
    hint: 'Coach et agent — encadrement et mandats',
    roles: ['coach', 'agent'],
  },
  {
    id: 'structure',
    label: 'Structures',
    hint: 'Club, annonces Mercato Pro et événements',
    roles: ['club', 'organizer'],
  },
  {
    id: 'partner',
    label: 'Sponsors',
    hint: 'Visibilité marque & financement clubs',
    roles: ['sponsor'],
  },
];

const SANTE_SIGNUP_GROUPS: SignupRoleGroup[] = [
  {
    id: 'medical',
    label: 'Praticiens',
    hint: 'Kiné, médecin, prépa, nutrition, podologue…',
    roles: ['physio'],
  },
];

export function getSignupRoleGroups(line: ProductLineId): SignupRoleGroup[] {
  if (line === 'sante') return SANTE_SIGNUP_GROUPS;
  if (line !== 'pro') return [];
  const allowed = new Set(rolesForProductLine(line));
  return PRO_SIGNUP_GROUPS.map((g) => ({
    ...g,
    roles: g.roles.filter((r) => allowed.has(r)),
  })).filter((g) => g.roles.length > 0);
}

export type DashboardLayoutKind = 'amateur_player' | 'pro';

export function getDashboardLayoutKind(
  line: ProductLineId,
  role: UserRole
): DashboardLayoutKind {
  if (line === 'pro' || line === 'sante') return 'pro';
  return role === 'player' ? 'amateur_player' : 'pro';
}

/** Ajoute l’onglet Fil pour la question hebdo / communauté. */
export function injectCommunityFeedTab(
  tabs: MainTabId[],
  role?: UserRole | null
): MainTabId[] {
  if (!role || !canParticipateWeeklyQuestion(role) || tabs.includes('feed')) {
    return tabs;
  }
  const reelsIndex = tabs.indexOf('reels');
  const anchor = reelsIndex >= 0 ? reelsIndex : tabs.indexOf('matchs');
  const insertAt = anchor >= 0 ? anchor + 1 : tabs.length;
  const next = [...tabs];
  next.splice(insertAt, 0, 'feed');
  return next;
}

/** Onglets visibles selon pôle + rôle connecté. */
export function getVisibleMainTabs(
  line: ProductLineId,
  role?: UserRole | null,
  profile?: User | null,
): MainTabId[] {
  const r = role ?? 'player';
  let tabs: MainTabId[];

  if (line === 'sante') {
    tabs = ['home', 'matchs', 'messages', 'profil'];
  } else if (line === 'pro') {
    if (r === 'sponsor') {
      tabs = [...SPONSOR_MAIN_TABS];
    } else if (r === 'organizer') {
      tabs = ['home', 'recrutement', 'matchs', 'reels', 'covoiturage', 'messages', 'profil'];
    } else if (r === 'coach' || r === 'club' || r === 'agent') {
      tabs = ['home', 'recrutement', 'matchs', 'reels', 'covoiturage', 'messages', 'profil'];
    } else {
      tabs = ['home', 'recrutement', 'matchs', 'reels', 'messages', 'profil'];
    }
  } else if (r === 'player') {
    tabs = [
      'home',
      'recrutement',
      'matchs',
      'reels',
      'covoiturage',
      'sante',
      'messages',
      'profil',
    ];
  } else {
    tabs = ['home', 'recrutement', 'matchs', 'reels', 'feed', 'messages', 'profil'];
  }

  return injectFamilyTab(injectCommunityFeedTab(tabs, r), profile, line);
}

export { getMercatoTabLabel } from './mercatoTabLabel';

export function getTabShortLabel(
  tab: MainTabId,
  line: ProductLineId,
  role?: UserRole | null,
  translate?: (key: string) => string
): string {
  if (translate) {
    const key = `tabs.${tab}`;
    const translated = translate(key);
    if (translated !== key) return translated;
  }
  if (isMedicalPractitionerRole(role)) {
    return getPhysioTabLabel(tab);
  }
  if (isSponsorRole(role)) {
    return getSponsorTabLabel(tab);
  }
  if (tab === 'recrutement') return getMercatoTabLabel(line, role);
  const labels: Record<MainTabId, string> = {
    home: 'Accueil',
    recrutement: 'Mercato',
    matchs: 'Matchs',
    covoiturage: 'Covoiturage',
    shop: 'Shop',
    sante: 'Santé',
    feed: 'Fil',
    reels: 'Reels',
    famille: 'Famille',
    messages: 'Messages',
    profil: 'Profil',
  };
  return labels[tab];
}

export function getDashboardQuickAccessLabel(
  line: ProductLineId,
  role: UserRole
): string {
  if (getDashboardLayoutKind(line, role) === 'amateur_player') {
    return 'Mon parcours';
  }
  if (role === 'physio') return 'Pôle santé';
  if (role === 'sponsor') return 'Sponsors';
  return 'Outils métier';
}

export function getDashboardFocusTabLabels(
  line: ProductLineId,
  role: UserRole
): { id: 'priorities' | 'calendar'; label: string }[] {
  if (getDashboardLayoutKind(line, role) === 'amateur_player') {
    return [
      { id: 'priorities', label: 'Mon jeu' },
      { id: 'calendar', label: 'Planning' },
    ];
  }
  if (role === 'physio') {
    return [
      { id: 'priorities', label: "Aujourd'hui" },
      { id: 'calendar', label: 'Agenda RDV' },
    ];
  }
  if (role === 'sponsor') {
    return [
      { id: 'priorities', label: 'Campagnes' },
      { id: 'calendar', label: 'Agenda' },
    ];
  }
  return [
    { id: 'priorities', label: 'Pilotage' },
    { id: 'calendar', label: 'Agenda' },
  ];
}

/** Publication annonces Mercato — joueurs exclus. */
export function canPublishRecruitmentPost(role: UserRole): boolean {
  return (
    role === 'club' ||
    role === 'coach' ||
    role === 'agent' ||
    role === 'recruiter' ||
    role === 'organizer'
  );
}

export function canAccessSponsorsModule(line: ProductLineId, role: UserRole): boolean {
  return line === 'pro' && role === 'sponsor';
}

const LINE_MODULE_HIDE: Partial<
  Record<ProductLineId, Partial<Record<UserRole, ProDayModuleId[]>>>
> = {
  homme: {
    player: ['sponsors', 'gestion'],
  },
  woman: {
    player: ['sponsors', 'gestion'],
  },
  pro: {
    coach: ['sponsors'],
    agent: ['sponsors'],
    recruiter: ['sponsors', 'gestion'],
    sponsor: ['recrutement', 'gestion', 'matchs'],
    club: ['sponsors'],
    organizer: ['sponsors'],
  },
  sante: {
    physio: ['sponsors', 'recrutement', 'matchs', 'gestion'],
  },
};

export function getModulesForRoleAndLine(
  role: UserRole,
  line: ProductLineId
): { order: ProDayModuleId[]; fullWidthModuleId?: ProDayModuleId } {
  const base = getModulesForRole(role);
  const extraHide = LINE_MODULE_HIDE[line]?.[role] ?? [];
  const order = base.order.filter((id) => !extraHide.includes(id));
  let fullWidthModuleId = base.fullWidthModuleId;
  if (fullWidthModuleId && !order.includes(fullWidthModuleId)) {
    fullWidthModuleId = order[0];
  }
  return { order, fullWidthModuleId };
}

export function getDashboardMetaForLine(
  role: UserRole,
  line: ProductLineId
): RoleDashboardMeta {
  const meta = getRoleDashboardMeta(role);
  if (line === 'woman') {
    const womanEyebrows: Partial<Record<UserRole, string>> = {
      player: 'COCKPIT JOUEUSE',
      coach: 'BANC TECHNIQUE F',
      club: 'QG CLUB F',
    };
    return {
      ...meta,
      eyebrow: womanEyebrows[role] ?? meta.eyebrow,
    };
  }
  if (line === 'pro') {
    const proEyebrows: Partial<Record<UserRole, string>> = {
      coach: 'BANC TECHNIQUE PRO',
      agent: 'RÉSEAU AGENT PRO',
      recruiter: 'RECRUTEUR PRO',
      sponsor: 'SPONSORS PRO',
      club: 'QG CLUB PRO',
      organizer: 'ARENA PRO',
    };
    return {
      ...meta,
      eyebrow: proEyebrows[role] ?? meta.eyebrow,
    };
  }
  if (line === 'sante') {
    return {
      ...meta,
      eyebrow: role === 'physio' ? 'CABINET SANTÉ' : meta.eyebrow,
    };
  }
  return meta;
}

export function getDiscoverUniverseCardsForLine(line: ProductLineId) {
  if (line === 'woman') return DISCOVER_UNIVERSE_CARDS_WOMAN;
  if (line === 'pro') return DISCOVER_UNIVERSE_CARDS_PRO;
  if (line === 'sante') return DISCOVER_UNIVERSE_CARDS_SANTE;
  return DISCOVER_UNIVERSE_CARDS;
}

export function assertRoleAllowedForLine(role: UserRole, line: ProductLineId): void {
  if (!isRoleAllowedForProductLine(role, line)) {
    throw new Error(
      `Le rôle « ${role} » n’est pas disponible sur ${productLineLabel(line)}.`
    );
  }
}

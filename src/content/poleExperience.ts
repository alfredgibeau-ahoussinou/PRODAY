import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { rolesForProductLine, isRoleAllowedForProductLine } from './universeRoles';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { ProDayModuleId } from './prodayModules';
import {
  getModulesForRole,
  getRoleDashboardMeta,
  type RoleDashboardMeta,
} from './roleDashboardExperience';
import { DISCOVER_UNIVERSE_CARDS } from './discoverChapters';
import { DISCOVER_UNIVERSE_CARDS_WOMAN } from './discoverWomanContent';
import { DISCOVER_UNIVERSE_CARDS_PRO } from './discoverProContent';

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
    hint: 'Club, annonces Mercato Pro et tournois Arena',
    roles: ['club', 'organizer'],
  },
  {
    id: 'medical',
    label: 'Pôle santé',
    hint: 'Kiné, médecin, coach mental, nutrition…',
    roles: ['physio'],
  },
  {
    id: 'partner',
    label: 'Partenaires',
    hint: 'Visibilité marque & financement clubs',
    roles: ['sponsor'],
  },
];

export function getSignupRoleGroups(line: ProductLineId): SignupRoleGroup[] {
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
  if (line === 'pro') return 'pro';
  return role === 'player' ? 'amateur_player' : 'pro';
}

/** Onglets visibles selon pôle + rôle connecté. */
export function getVisibleMainTabs(
  line: ProductLineId,
  role?: UserRole | null
): MainTabId[] {
  const r = role ?? 'player';

  if (line === 'pro') {
    if (r === 'sponsor') {
      return ['home', 'messages', 'profil'];
    }
    if (r === 'physio') {
      return ['home', 'matchs', 'messages', 'profil'];
    }
    if (r === 'organizer') {
      return ['home', 'recrutement', 'matchs', 'covoiturage', 'messages', 'profil'];
    }
    if (r === 'coach' || r === 'club' || r === 'agent') {
      return ['home', 'recrutement', 'matchs', 'covoiturage', 'messages', 'profil'];
    }
    return ['home', 'recrutement', 'matchs', 'messages', 'profil'];
  }

  if (r === 'player') {
    return ['home', 'recrutement', 'matchs', 'covoiturage', 'sante', 'messages', 'profil'];
  }

  return ['home', 'recrutement', 'matchs', 'feed', 'messages', 'profil'];
}

export function getMercatoTabLabel(line: ProductLineId, role?: UserRole | null): string {
  if (line === 'woman') return 'Mercato F';
  if (line === 'pro') return 'Mercato Pro';
  if (role === 'player') return 'Candidater';
  return 'Mercato';
}

export function getTabShortLabel(
  tab: MainTabId,
  line: ProductLineId,
  role?: UserRole | null
): string {
  if (tab === 'recrutement') return getMercatoTabLabel(line, role);
  const labels: Record<MainTabId, string> = {
    home: 'Accueil',
    recrutement: 'Mercato',
    matchs: 'Matchs',
    covoiturage: 'Covoiturage',
    shop: 'Shop',
    sante: 'Santé',
    feed: 'Fil',
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
  if (role === 'sponsor') return 'Partenaires';
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
      { id: 'priorities', label: 'Suivi' },
      { id: 'calendar', label: 'Agenda' },
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
    coach: ['sponsors', 'arena'],
    agent: ['sponsors', 'arena'],
    recruiter: ['sponsors', 'arena', 'gestion'],
    physio: ['sponsors', 'arena', 'recrutement'],
    sponsor: ['recrutement', 'gestion', 'arena', 'matchs'],
    club: ['sponsors'],
    organizer: ['sponsors'],
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
      physio: 'PÔLE SANTÉ PRO',
      sponsor: 'PARTENAIRES PRO',
      club: 'QG CLUB PRO',
      organizer: 'ARENA PRO',
    };
    return {
      ...meta,
      eyebrow: proEyebrows[role] ?? meta.eyebrow,
    };
  }
  return meta;
}

export function getDiscoverUniverseCardsForLine(line: ProductLineId) {
  if (line === 'woman') return DISCOVER_UNIVERSE_CARDS_WOMAN;
  if (line === 'pro') return DISCOVER_UNIVERSE_CARDS_PRO;
  return DISCOVER_UNIVERSE_CARDS;
}

export function assertRoleAllowedForLine(role: UserRole, line: ProductLineId): void {
  if (!isRoleAllowedForProductLine(role, line)) {
    throw new Error(
      `Le rôle « ${role} » n’est pas disponible sur ${line === 'pro' ? 'Pro Day Pro' : line === 'woman' ? 'Pro Day Woman' : 'Pro Day Man'}.`
    );
  }
}

import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import {
  rolesForProductLine,
  isRoleAllowedForProductLine,
  productLineLabel,
} from './universeRoles';
import { isProFamilyLine, canonicalizeActiveProductLine } from '../utils/productLineResolution';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { ProDayModuleId } from './prodayModules';
import {
  getModulesForRole,
  getRoleDashboardMeta,
  type RoleDashboardMeta,
} from './roleDashboardExperience';
import { getMercatoTabLabel } from './mercatoTabLabel';
import { getDiscoverUniverseCards } from './discoverContentByLine';
import {
  getSponsorTabLabel,
  isSponsorRole,
  SPONSOR_MAIN_TABS,
} from './sponsorExperience';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';
import { injectFamilyTab } from './familyExperience';
import type { User } from '../models/User';
import { isRetiredUserRole } from '../utils/retiredRoles';
import {
  AMATEUR_CLUB_OVERFLOW_TABS,
  AMATEUR_CLUB_SHELL_TABS,
  AMATEUR_COACH_OVERFLOW_TABS,
  AMATEUR_COACH_SHELL_TABS,
  AMATEUR_PLAYER_OVERFLOW_TABS,
  AMATEUR_PLAYER_SHELL_TABS,
  PRO_CLUB_SHELL_TABS,
  PRO_CLUB_OVERFLOW_TABS,
  PRO_COACH_SHELL_TABS,
  PRO_ORGANIZER_SHELL_TABS,
  PRO_PLAYER_SHELL_TABS,
  PRO_PLAYER_OVERFLOW_TABS,
  SUPPORTER_SHELL_TABS,
} from '../navigation/shells/productShellTabs';

/** Groupes de rôles à l'inscription — filtrés par pôle. */
export interface SignupRoleGroup {
  id: string;
  label: string;
  hint: string;
  roles: UserRole[];
}

const AMATEUR_SIGNUP_GROUPS: SignupRoleGroup[] = [
  {
    id: 'player',
    label: 'Joueurs',
    hint: 'Profil, matchs, stats et vie d’équipe — football amateur',
    roles: ['player'],
  },
];

const SUPPORTER_SIGNUP_GROUPS: SignupRoleGroup[] = [
  {
    id: 'supporter',
    label: 'Supporters',
    hint: 'Matchs, réels, fil et messagerie communauté',
    roles: ['supporter'],
  },
];

const PRO_SIGNUP_GROUPS: SignupRoleGroup[] = [
  {
    id: 'structure',
    label: 'Club / Dirigeants',
    hint: 'Cœur ProDay — équipes, licenciés, compétitions, recrutement interne',
    roles: ['club'],
  },
  {
    id: 'coach',
    label: 'Coachs',
    hint: 'Effectif, Tactique IA, matchs et séances — inclus ou abonnement Coach',
    roles: ['coach'],
  },
  {
    id: 'pro_player',
    label: 'Joueurs',
    hint: 'Carrière club, stats, convocations et progression',
    roles: ['player'],
  },
  {
    id: 'events',
    label: 'Événements (intégré)',
    hint: 'Tournois et stages — gérés depuis l’espace Club',
    roles: ['organizer'],
  },
  {
    id: 'partner',
    label: 'Sponsors',
    hint: 'Visibilité marque & financement clubs',
    roles: ['sponsor'],
  },
];

export function getSignupRoleGroups(
  line: ProductLineId,
  presetRole?: UserRole | null,
): SignupRoleGroup[] {
  let groups: SignupRoleGroup[];
  // Pôle Santé retiré — aucun parcours d’inscription.
  if (line === 'sante') groups = [];
  else if (line === 'amateur') groups = AMATEUR_SIGNUP_GROUPS;
  else if (line === 'supporter') groups = SUPPORTER_SIGNUP_GROUPS;
  else if (line === 'pro_player') {
    groups = PRO_SIGNUP_GROUPS.filter((g) => g.roles.includes('player'));
  } else if (line === 'pro_club') {
    groups = PRO_SIGNUP_GROUPS.filter((g) => g.roles.includes('club')).map((g) => ({
      ...g,
      roles: g.roles.filter((r) => r === 'club'),
    }));
  } else if (line === 'pro_staff') {
    groups = PRO_SIGNUP_GROUPS.filter((g) =>
      g.roles.some((r) => ['coach', 'organizer'].includes(r)),
    );
  } else if (line === 'sponsor') {
    groups = PRO_SIGNUP_GROUPS.filter((g) => g.roles.includes('sponsor'));
  } else if (!isProFamilyLine(line)) groups = [];
  else {
    const allowed = new Set(rolesForProductLine(line));
    groups = PRO_SIGNUP_GROUPS.map((g) => ({
      ...g,
      roles: g.roles.filter((r) => allowed.has(r)),
    })).filter((g) => g.roles.length > 0);
  }

  if (!presetRole || (!isProFamilyLine(line) && line !== 'sponsor')) return groups;

  if (presetRole === 'player') {
    return groups.filter((g) => g.roles.includes('player'));
  }
  if (presetRole === 'club') {
    return groups
      .filter((g) => g.roles.includes('club'))
      .map((g) => ({ ...g, roles: g.roles.filter((r) => r === 'club') }));
  }
  if (presetRole === 'organizer') {
    return groups.filter((g) => g.roles.includes('organizer'));
  }
  if (presetRole === 'sponsor' || line === 'sponsor') {
    return groups.filter((g) => g.roles.includes('sponsor'));
  }
  if (presetRole === 'coach') {
    return groups.filter((g) => g.roles.includes('coach'));
  }
  if (
    presetRole === 'agent' ||
    presetRole === 'recruiter' ||
    presetRole === 'physio'
  ) {
    return [];
  }
  return groups.filter((g) =>
    g.roles.some((r) => ['coach', 'organizer'].includes(r)),
  );
}

export type DashboardLayoutKind = 'amateur_player' | 'pro';

export function getDashboardLayoutKind(
  line: ProductLineId,
  role: UserRole
): DashboardLayoutKind {
  if (isProFamilyLine(line) || line === 'sante') return 'pro';
  if (line === 'supporter') return 'amateur_player';
  if (line === 'amateur') return role === 'player' ? 'amateur_player' : 'pro';
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
  const effectiveLine = canonicalizeActiveProductLine(line, r);
  let tabs: MainTabId[];

  if (effectiveLine === 'sante' || isRetiredUserRole(r)) {
    tabs = ['home', 'profil'];
  } else if (effectiveLine === 'amateur') {
    if (r === 'player') {
      tabs = [...AMATEUR_PLAYER_SHELL_TABS, ...AMATEUR_PLAYER_OVERFLOW_TABS];
    } else if (r === 'club') {
      tabs = [...AMATEUR_CLUB_SHELL_TABS, ...AMATEUR_CLUB_OVERFLOW_TABS];
    } else if (r === 'coach') {
      tabs = [...AMATEUR_COACH_SHELL_TABS, ...AMATEUR_COACH_OVERFLOW_TABS];
    } else {
      tabs = [...AMATEUR_COACH_SHELL_TABS, ...AMATEUR_COACH_OVERFLOW_TABS];
    }
  } else if (effectiveLine === 'supporter') {
    tabs = [...SUPPORTER_SHELL_TABS];
  } else if (effectiveLine === 'sponsor' || r === 'sponsor') {
    tabs = [...SPONSOR_MAIN_TABS];
  } else if (isProFamilyLine(effectiveLine)) {
    if (r === 'player') {
      tabs = [...PRO_PLAYER_SHELL_TABS, ...PRO_PLAYER_OVERFLOW_TABS];
    } else if (r === 'organizer') {
      tabs = [...PRO_ORGANIZER_SHELL_TABS];
    } else if (r === 'coach') {
      tabs = [...PRO_COACH_SHELL_TABS];
    } else if (r === 'club') {
      tabs = [...PRO_CLUB_SHELL_TABS, ...PRO_CLUB_OVERFLOW_TABS];
    } else {
      tabs = ['home', 'recrutement', 'matchs', 'messages', 'profil'];
    }
  } else if (r === 'player') {
    tabs = [
      'home',
      'recrutement',
      'matchs',
      'reels',
      'covoiturage',
      'messages',
      'profil',
    ];
  } else {
    tabs = ['home', 'recrutement', 'matchs', 'reels', 'feed', 'messages', 'profil'];
  }

  const keepExplicitShell =
    effectiveLine === 'sante' ||
    isRetiredUserRole(r) ||
    effectiveLine === 'amateur' ||
    effectiveLine === 'supporter' ||
    effectiveLine === 'sponsor' ||
    (isProFamilyLine(effectiveLine) &&
      (r === 'player' || r === 'club' || r === 'coach' || r === 'organizer'));
  const withCommunity = keepExplicitShell ? tabs : injectCommunityFeedTab(tabs, r);
  const withFamily = injectFamilyTab(withCommunity, profile, effectiveLine);
  if (r === 'player' || isRetiredUserRole(r) || effectiveLine === 'sante') {
    return withFamily.filter((tab) => tab !== 'sante');
  }
  return withFamily;
}

export { getMercatoTabLabel } from './mercatoTabLabel';

export function getTabShortLabel(
  tab: MainTabId,
  line: ProductLineId,
  role?: UserRole | null,
  translate?: (key: string) => string
): string {
  if (line === 'amateur') {
    if (role === 'club') {
      if (tab === 'home') return 'Accueil';
      if (tab === 'recrutement') return 'Recrut.';
      if (tab === 'matchs') return 'Matchs';
      if (tab === 'feed') return 'Perf.';
      if (tab === 'profil') return 'Vitrine';
      if (tab === 'messages') return 'Comm.';
      if (tab === 'covoiturage') return 'Covoit';
      if (tab === 'shop') return 'Shop';
    }
    if (role === 'coach') {
      if (tab === 'home') return 'Équipe';
      if (tab === 'matchs') return 'Matchs';
      if (tab === 'feed') return 'Perf.';
      if (tab === 'messages') return 'Messages';
      if (tab === 'profil') return 'Moi';
      if (tab === 'covoiturage') return 'Covoit';
      if (tab === 'recrutement') return 'Club';
      if (tab === 'shop') return 'Shop';
    }
    if (tab === 'home') return 'Accueil';
    if (tab === 'reels') return 'Reels';
    if (tab === 'matchs') return 'Matchs';
    if (tab === 'messages') return 'Messages';
    if (tab === 'covoiturage') return 'Covoiturage';
    if (tab === 'recrutement') return 'Équipe';
    if (tab === 'progression') return 'Progression';
    if (tab === 'shop') return 'Shop';
    if (tab === 'profil') return 'Moi';
    if (tab === 'sante') return 'Santé';
    if (tab === 'feed') return 'Perf.';
  }
  if (line === 'supporter') {
    if (tab === 'home') return 'Accueil';
    if (tab === 'matchs') return 'Matchs';
    if (tab === 'feed') return 'ProDay';
    if (tab === 'plus') return 'Favoris';
    if (tab === 'profil') return 'Profil';
    if (tab === 'reels') return 'Vidéos';
    if (tab === 'messages') return 'Tribune';
    if (tab === 'shop') return 'Shop';
  }
  if (isProFamilyLine(line) && role === 'club') {
    if (tab === 'home') return 'Accueil';
    if (tab === 'covoiturage') return 'Covoit';
    if (tab === 'recrutement') return 'Recrut.';
    if (tab === 'matchs') return 'Matchs';
    if (tab === 'messages') return 'Comm.';
    if (tab === 'profil') return 'Vitrine';
    if (tab === 'shop') return 'Shop';
  }
  if (isProFamilyLine(line) && role === 'coach') {
    if (tab === 'home') return 'Équipe';
    if (tab === 'covoiturage') return 'Covoiturage';
    if (tab === 'matchs') return 'Calendrier';
  }
  if (isProFamilyLine(line) && role === 'agent') {
    if (tab === 'home') return 'Mandats';
  }
  if (isProFamilyLine(line) && role === 'recruiter') {
    if (tab === 'home') return 'Suivi';
  }
  if (isProFamilyLine(line) && role === 'organizer') {
    if (tab === 'home') return 'Arena';
    if (tab === 'covoiturage') return 'Covoiturage';
  }
  if (isProFamilyLine(line) && role === 'player') {
    if (tab === 'home') return 'Carrière';
    if (tab === 'reels') return 'Reels';
    if (tab === 'matchs') return 'Matchs';
    if (tab === 'messages') return 'Messages';
    if (tab === 'covoiturage') return 'Covoiturage';
    if (tab === 'recrutement') return 'Opportunités';
    if (tab === 'progression') return 'Progression';
    if (tab === 'shop') return 'Shop';
    if (tab === 'profil') return 'Moi';
  }
  if (translate) {
    const key = `tabs.${tab}`;
    const translated = translate(key);
    if (translated !== key) return translated;
  }
  if (isRetiredUserRole(role)) {
    return labelsFallback(tab);
  }
  if (isSponsorRole(role)) {
    return getSponsorTabLabel(tab);
  }
  if (tab === 'recrutement') return getMercatoTabLabel(line, role);
  return labelsFallback(tab);
}

function labelsFallback(tab: MainTabId): string {
  const labels: Record<MainTabId, string> = {
    home: 'Accueil',
    recrutement: 'Mercato',
    matchs: 'Matchs',
    covoiturage: 'Covoiturage',
    shop: 'Shop',
    sante: 'Santé',
    feed: 'Fil',
    progression: 'Progression',
    reels: 'Reels',
    famille: 'Famille',
    messages: 'Messages',
    profil: 'Profil',
    plus: 'Plus',
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
export { canPublishRecruitmentPost } from '../utils/roleCapabilities';

export function canAccessSponsorsModule(line: ProductLineId, role: UserRole): boolean {
  return role === 'sponsor' && (line === 'sponsor' || line === 'pro_staff' || line === 'pro');
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
  amateur: {
    player: ['sponsors', 'gestion'],
    coach: ['sponsors'],
  },
  supporter: {
    supporter: ['recrutement', 'sponsors'],
  },
  pro: {
    coach: ['sponsors'],
    agent: ['sponsors'],
    recruiter: ['sponsors', 'gestion'],
    sponsor: ['recrutement', 'gestion', 'matchs'],
    club: ['sponsors'],
    organizer: ['sponsors'],
    player: ['sponsors', 'gestion'],
  },
  /** Split carousel — mêmes exclusions que `pro` (sinon le module Sponsors fuit dans l’espace Pro). */
  pro_staff: {
    coach: ['sponsors'],
    agent: ['sponsors'],
    recruiter: ['sponsors', 'gestion'],
    sponsor: ['recrutement', 'gestion', 'matchs'],
    club: ['sponsors'],
    organizer: ['sponsors'],
  },
  pro_player: {
    player: ['sponsors', 'gestion'],
  },
  pro_club: {
    club: ['sponsors'],
  },
  sponsor: {
    sponsor: ['recrutement', 'gestion', 'matchs'],
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
  if (line === 'amateur') {
    const amateurEyebrows: Partial<Record<UserRole, string>> = {
      player: 'COCKPIT JOUEUR AMATEUR',
      coach: 'BANC TECHNIQUE AMATEUR',
    };
    return {
      ...meta,
      eyebrow: amateurEyebrows[role] ?? meta.eyebrow,
    };
  }
  if (line === 'supporter') {
    return {
      ...meta,
      eyebrow: role === 'supporter' ? 'FOOTBALL HUB' : meta.eyebrow,
      title: role === 'supporter' ? 'PRODAY Football Hub' : meta.title,
    };
  }
  if (isProFamilyLine(line)) {
    const proEyebrows: Partial<Record<UserRole, string>> = {
      coach: 'BANC TECHNIQUE PRO',
      agent: 'RÉSEAU AGENT PRO',
      recruiter: 'RECRUTEUR PRO',
      sponsor: 'SPONSORS PRO',
      club: 'QG CLUB PRO',
      organizer: 'ARÈNE PRO',
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
  return getDiscoverUniverseCards(line);
}

export function assertRoleAllowedForLine(role: UserRole, line: ProductLineId): void {
  if (!isRoleAllowedForProductLine(role, line)) {
    throw new Error(
      `Le rôle « ${role} » n’est pas disponible sur ${productLineLabel(line)}.`
    );
  }
}

/**
 * Préparation split carousel Pro (phase light) :
 * - pro_player
 * - pro_club
 * - pro_staff
 */
export function getProCarouselSegment(role: UserRole): 'pro_player' | 'pro_club' | 'pro_staff' {
  if (role === 'player') return 'pro_player';
  if (role === 'club') return 'pro_club';
  // TODO(carousel-pro): affiner staff (coach/agent/recruiter/organizer/sponsor) par sous-segment.
  return 'pro_staff';
}

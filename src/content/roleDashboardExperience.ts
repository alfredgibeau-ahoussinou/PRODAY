import type { IconName } from '../components/ui/Icon';
import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import type { ProDayModuleId } from './prodayModules';
import { getMercatoTabLabel } from './poleExperience';

export interface RoleDashboardMeta {
  eyebrow: string;
  title: string;
  heroTone: 'player' | 'coach' | 'club' | 'agent' | 'recruiter' | 'organizer' | 'medical' | 'sponsor';
  moduleOrder: ProDayModuleId[];
  fullWidthModule?: ProDayModuleId;
  hideModules?: ProDayModuleId[];
}

const ROLE_DASHBOARD: Record<UserRole, RoleDashboardMeta> = {
  player: {
    eyebrow: 'COCKPIT JOUEUR',
    title: 'Votre carrière en direct',
    heroTone: 'player',
    moduleOrder: ['recrutement', 'matchs', 'gestion', 'sponsors'],
    fullWidthModule: 'recrutement',
  },
  coach: {
    eyebrow: 'BANC TECHNIQUE',
    title: 'Pilotez votre effectif',
    heroTone: 'coach',
    moduleOrder: ['gestion', 'matchs', 'recrutement', 'sponsors'],
    fullWidthModule: 'gestion',
  },
  club: {
    eyebrow: 'QG CLUB',
    title: 'Votre structure sur ProDay',
    heroTone: 'club',
    moduleOrder: ['recrutement', 'gestion', 'matchs', 'sponsors'],
    fullWidthModule: 'recrutement',
  },
  agent: {
    eyebrow: 'RÉSEAU AGENT',
    title: 'Scouting & placement',
    heroTone: 'agent',
    moduleOrder: ['recrutement', 'matchs', 'gestion', 'sponsors'],
    fullWidthModule: 'recrutement',
  },
  recruiter: {
    eyebrow: 'RECRUTEUR PRO',
    title: 'Repérez & recrutez',
    heroTone: 'recruiter',
    moduleOrder: ['recrutement', 'matchs', 'gestion', 'sponsors'],
    fullWidthModule: 'recrutement',
    hideModules: ['gestion'],
  },
  organizer: {
    eyebrow: 'ÉVÉNEMENTS',
    title: 'Animez le territoire foot',
    heroTone: 'organizer',
    moduleOrder: ['matchs', 'recrutement', 'gestion', 'sponsors'],
    fullWidthModule: 'matchs',
  },
  physio: {
    eyebrow: 'PÔLE SANTÉ PRODAY',
    title: 'Cabinet & rendez-vous',
    heroTone: 'medical',
    moduleOrder: ['matchs', 'recrutement', 'gestion', 'sponsors'],
    fullWidthModule: 'matchs',
    hideModules: ['recrutement', 'matchs', 'gestion', 'sponsors'],
  },
  sponsor: {
    eyebrow: 'VITRINE MARQUE',
    title: 'Soutenez les clubs locaux',
    heroTone: 'sponsor',
    moduleOrder: ['sponsors', 'recrutement', 'matchs', 'gestion'],
    fullWidthModule: 'sponsors',
    hideModules: ['gestion'],
  },
};

export function getRoleDashboardMeta(role: UserRole): RoleDashboardMeta {
  return ROLE_DASHBOARD[role] ?? ROLE_DASHBOARD.player;
}

export function getModulesForRole(role: UserRole): {
  order: ProDayModuleId[];
  fullWidthModuleId?: ProDayModuleId;
} {
  const meta = getRoleDashboardMeta(role);
  const order = meta.moduleOrder.filter((id) => !meta.hideModules?.includes(id));
  return { order, fullWidthModuleId: meta.fullWidthModule };
}

export const ROLE_HERO_ACCENT: Record<RoleDashboardMeta['heroTone'], string> = {
  player: '#0A0A0A',
  coach: '#1D4ED8',
  club: '#7C2D12',
  agent: '#4C1D95',
  recruiter: '#059669',
  organizer: '#B45309',
  medical: '#0F766E',
  sponsor: '#BE185D',
};

export interface RolePanelAction {
  icon: IconName;
  title: string;
  sub: string;
  accent?: boolean;
}

export function getRolePanelActions(role: UserRole): RolePanelAction[] {
  switch (role) {
    case 'player':
      return [
        { icon: 'document', title: 'Mon CV en ligne', sub: 'Compléter et publier votre CV foot', accent: true },
        { icon: 'search', title: 'Candidater', sub: 'Parcourir les annonces — sans publication' },
        { icon: 'heart', title: 'Pôle santé', sub: 'Kinés, coach mental, nutrition…' },
        { icon: 'calendar', title: 'Matchs & convocations', sub: 'RSVP et compo' },
      ];
    case 'coach':
      return [
        { icon: 'calendar', title: 'Calendrier équipe', sub: 'Convocations & Live Stats', accent: true },
        { icon: 'search', title: 'Recrutement', sub: 'Publier une annonce' },
        { icon: 'school', title: 'Diplômes', sub: 'Statut vérification' },
      ];
    case 'club':
      return [
        { icon: 'business', title: 'Annonces club', sub: 'Recrutement & stages', accent: true },
        { icon: 'people', title: 'Gestion effectif', sub: 'Planning & présences' },
        { icon: 'football', title: 'Détections', sub: 'Journées scouting' },
        { icon: 'calendar', title: 'Stages', sub: 'Camps & stages foot' },
      ];
    case 'agent':
      return [
        { icon: 'search', title: 'Repérage', sub: 'Profils joueurs filtrés', accent: true },
        { icon: 'briefcase', title: 'Mandats', sub: 'Licence & dossiers' },
        { icon: 'handshake', title: 'Matchs amicaux', sub: 'Réseau clubs' },
      ];
    case 'recruiter':
      return [
        { icon: 'search', title: 'Mercato', sub: 'Publier et suivre vos annonces', accent: true },
        { icon: 'people', title: 'Scouting', sub: 'Profils joueurs filtrés par critères' },
        { icon: 'car', title: 'Covoiturage', sub: 'Trajets matchs & détections' },
      ];
    case 'organizer':
      return [
        { icon: 'calendar', title: 'Événements', sub: 'Détections & calendrier local', accent: true },
        { icon: 'football', title: 'Détections', sub: 'Journées publiques' },
        { icon: 'handshake', title: 'Matchs', sub: 'Rencontres & convocations' },
      ];
    case 'physio':
      return [
        { icon: 'calendar', title: 'Agenda RDV', sub: 'Confirmer et gérer les créneaux', accent: true },
        { icon: 'chat', title: 'Messagerie patients', sub: 'Suivi blessure & prévention' },
        { icon: 'location', title: 'Cabinet & zone', sub: 'Ville, département, visibilité' },
      ];
    case 'sponsor':
      return [
        { icon: 'star-four-points', title: 'Offres sponsors', sub: 'Visibilité & financement', accent: true },
        { icon: 'business', title: 'Clubs cibles', sub: 'Territoire local' },
      ];
    default:
      return [];
  }
}

export function getRolePanelActionsForLine(
  role: UserRole,
  line: ProductLineId
): RolePanelAction[] {
  const actions = getRolePanelActions(role);

  if (role === 'player' && line === 'woman') {
    return actions.map((a) => {
      if (a.title === 'Mon CV en ligne') {
        return {
          ...a,
          title: 'Mon CV joueuse',
          sub: 'Compléter et publier votre CV foot',
        };
      }
      if (a.title === 'Candidater') {
        return {
          ...a,
          title: 'Mercato F',
          sub: 'Parcourir les annonces foot féminin',
        };
      }
      return a;
    });
  }

  if (role === 'player' && line === 'homme') {
    return actions.map((a) =>
      a.title === 'Candidater'
        ? { ...a, title: getMercatoTabLabel(line, role) }
        : a
    );
  }

  if (line === 'pro') {
    return actions.map((a) => {
      if (a.title === 'Mercato' || a.title === 'Recrutement') {
        return { ...a, title: 'Mercato Pro', sub: a.sub };
      }
      return a;
    });
  }

  return actions;
}

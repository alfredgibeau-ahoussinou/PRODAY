import type { IconName } from '../components/ui/Icon';
import type { UserRole } from '../models/User';
import type { ProDayModuleId } from './prodayModules';

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
    moduleOrder: ['recrutement', 'matchs', 'gestion', 'arena', 'sponsors'],
    fullWidthModule: 'recrutement',
  },
  coach: {
    eyebrow: 'BANC TECHNIQUE',
    title: 'Pilotez votre effectif',
    heroTone: 'coach',
    moduleOrder: ['gestion', 'matchs', 'recrutement', 'arena', 'sponsors'],
    fullWidthModule: 'gestion',
  },
  club: {
    eyebrow: 'QG CLUB',
    title: 'Votre structure sur ProDay',
    heroTone: 'club',
    moduleOrder: ['recrutement', 'gestion', 'matchs', 'arena', 'sponsors'],
    fullWidthModule: 'recrutement',
  },
  agent: {
    eyebrow: 'RÉSEAU AGENT',
    title: 'Scouting & placement',
    heroTone: 'agent',
    moduleOrder: ['recrutement', 'matchs', 'gestion', 'arena', 'sponsors'],
    fullWidthModule: 'recrutement',
  },
  recruiter: {
    eyebrow: 'RECRUTEUR PRO',
    title: 'Repérez & recrutez',
    heroTone: 'recruiter',
    moduleOrder: ['recrutement', 'matchs', 'arena', 'gestion', 'sponsors'],
    fullWidthModule: 'recrutement',
    hideModules: ['gestion'],
  },
  organizer: {
    eyebrow: 'ÉVÉNEMENTS',
    title: 'Animez le territoire foot',
    heroTone: 'organizer',
    moduleOrder: ['arena', 'matchs', 'recrutement', 'gestion', 'sponsors'],
    fullWidthModule: 'arena',
  },
  physio: {
    eyebrow: 'PÔLE MÉDICAL',
    title: 'Accompagnez les sportifs',
    heroTone: 'medical',
    moduleOrder: ['matchs', 'recrutement', 'gestion', 'sponsors', 'arena'],
    fullWidthModule: 'matchs',
    hideModules: ['arena'],
  },
  sponsor: {
    eyebrow: 'VITRINE MARQUE',
    title: 'Soutenez les clubs locaux',
    heroTone: 'sponsor',
    moduleOrder: ['sponsors', 'recrutement', 'arena', 'matchs', 'gestion'],
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
        { icon: 'trophy', title: 'Tournois Arena', sub: 'Créer & inscrire', accent: true },
        { icon: 'football', title: 'Détections', sub: 'Journées publiques' },
        { icon: 'calendar', title: 'Calendrier', sub: 'Événements locaux' },
      ];
    case 'physio':
      return [
        { icon: 'heart', title: 'Fil santé', sub: 'Visibilité près des clubs', accent: true },
        { icon: 'people', title: 'Sportifs suivis', sub: 'Messagerie après vérif.' },
        { icon: 'location', title: 'Zone d’intervention', sub: 'Ville & département' },
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

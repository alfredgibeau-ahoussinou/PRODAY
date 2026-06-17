import type { MainTabId } from '../../../navigation/mainTabConfig';

export interface StaffPriorityItem {
  id: string;
  label: string;
  detail: string;
  tab: MainTabId;
  priority: number;
  action?: 'gestion' | 'sponsors';
}

/** Priorités staff sur l’accueil V3 (spec §4 — Staff Pro). */
export function buildStaffPriorities(input: {
  pendingConvocations: number;
  pendingApplications: number;
  myPostsCount: number;
  upcomingEvents: number;
}): StaffPriorityItem[] {
  const items: StaffPriorityItem[] = [
    {
      id: 'team-mgmt',
      label: 'Gestion',
      detail: 'Planning, présences, effectif',
      tab: 'home',
      action: 'gestion',
      priority: 90,
    },
  ];

  if (input.pendingConvocations > 0) {
    items.push({
      id: 'convoc',
      label: 'Convocations',
      detail: `${input.pendingConvocations} réponse(s) attendue(s)`,
      tab: 'matchs',
      priority: 95,
    });
  }

  if (input.pendingApplications > 0) {
    items.push({
      id: 'applications',
      label: 'Candidatures',
      detail: `${input.pendingApplications} dossier(s) à traiter`,
      tab: 'recrutement',
      priority: 92,
    });
  }

  if (input.myPostsCount === 0) {
    items.push({
      id: 'publish',
      label: 'Mercato',
      detail: 'Publiez une annonce pour recruter',
      tab: 'recrutement',
      priority: 80,
    });
  } else {
    items.push({
      id: 'posts',
      label: 'Annonces',
      detail: `${input.myPostsCount} annonce(s) active(s)`,
      tab: 'recrutement',
      priority: 78,
    });
  }

  if (input.upcomingEvents > 0) {
    items.push({
      id: 'events',
      label: 'Agenda',
      detail: `${input.upcomingEvents} événement(s) à venir`,
      tab: 'matchs',
      priority: 70,
    });
  }

  return [...items].sort((a, b) => b.priority - a.priority).slice(0, 4);
}

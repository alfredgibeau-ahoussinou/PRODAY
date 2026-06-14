export type DashboardChapterId = 'cockpit' | 'outils' | 'saison';

export const DASHBOARD_CHAPTERS: { id: DashboardChapterId; label: string }[] = [
  { id: 'cockpit', label: "Aujourd'hui" },
  { id: 'outils', label: 'Outils' },
  { id: 'saison', label: 'Saison' },
];

import type { StaffPriorityItem } from '../features/v3/engines/staffHome.engine';
import type { ClubPortalChapterId } from '../content/clubPortalChapters';

export type ClubAiSuggestion = {
  id: string;
  title: string;
  detail: string;
  priority: number;
  chapter?: ClubPortalChapterId;
  tab?: 'matchs' | 'recrutement' | 'messages' | 'profil';
};

export type ClubAiBriefingInput = {
  clubName: string;
  teamsCount: number;
  playersCount: number;
  coachesCount: number;
  pendingMemberships: number;
  teamsWithoutCoach: number;
  openInternalNeeds: number;
  openExternalNeeds: number;
};

/**
 * Briefing président — uniquement des faits issus des données club.
 * Pas de copy marketing ni de faux insights.
 */
export function buildClubAiBriefing(input: ClubAiBriefingInput): {
  headline: string;
  summary: string;
  priorities: StaffPriorityItem[];
  suggestions: ClubAiSuggestion[];
} {
  const priorities: StaffPriorityItem[] = [];
  const suggestions: ClubAiSuggestion[] = [];

  if (input.pendingMemberships > 0) {
    priorities.push({
      id: 'pending-members',
      label: 'Adhésions',
      detail: `${input.pendingMemberships} demande(s) à valider`,
      tab: 'home',
      priority: 100,
    });
    suggestions.push({
      id: 'validate-members',
      title: 'Valider les adhésions',
      detail: 'Chaque demande en attente bloque l’accès joueur / parent.',
      priority: 100,
      chapter: 'structure',
    });
  }

  if (input.teamsCount === 0) {
    priorities.push({
      id: 'create-team',
      label: 'Structure',
      detail: 'Créer la première équipe (catégorie + coach)',
      tab: 'home',
      priority: 98,
    });
    suggestions.push({
      id: 'first-team',
      title: 'Structurer le club',
      detail: 'Sans équipe, la bourse, les convocations et le calendrier restent vides.',
      priority: 98,
      chapter: 'structure',
    });
  } else if (input.teamsWithoutCoach > 0) {
    priorities.push({
      id: 'assign-coach',
      label: 'Staff',
      detail: `${input.teamsWithoutCoach} équipe(s) sans coach affecté`,
      tab: 'home',
      priority: 92,
    });
    suggestions.push({
      id: 'coach-gap',
      title: 'Affecter les coachs manquants',
      detail: 'Une équipe sans coach ne peut pas piloter convocations ni Tactique IA.',
      priority: 92,
      chapter: 'structure',
    });
  }

  if (input.openInternalNeeds > 0) {
    priorities.push({
      id: 'bourse-needs',
      label: 'Bourse',
      detail: `${input.openInternalNeeds} besoin(s) ouvert(s) sur le vivier`,
      tab: 'home',
      priority: 88,
    });
    suggestions.push({
      id: 'match-vivier',
      title: 'Matcher le vivier interne',
      detail: 'Équipe B / réserve / catégorie voisine avant toute annonce externe.',
      priority: 88,
      chapter: 'vivier',
    });
  }

  if (input.playersCount > 0 && input.openInternalNeeds === 0 && input.teamsCount > 0) {
    suggestions.push({
      id: 'bourse-ready',
      title: 'Vivier prêt',
      detail: 'Aucun besoin ouvert. Créez un besoin si un poste manque avant le Mercato.',
      priority: 55,
      chapter: 'vivier',
    });
  }

  if (input.openExternalNeeds > 0) {
    suggestions.push({
      id: 'external-needs',
      title: 'Besoins publiés entre clubs',
      detail: `${input.openExternalNeeds} recherche(s) visible(s) hors club — après le vivier.`,
      priority: 70,
      chapter: 'vivier',
      tab: 'recrutement',
    });
  }

  priorities.push({
    id: 'matchs',
    label: 'Matchs',
    detail: 'Invitations, calendrier et convocations',
    tab: 'matchs',
    priority: 60,
  });

  if (input.playersCount === 0 && input.teamsCount > 0) {
    suggestions.push({
      id: 'invite-players',
      title: 'Inviter des licenciés',
      detail: 'Les équipes existent mais aucun joueur n’est rattaché pour l’instant.',
      priority: 85,
      chapter: 'structure',
    });
  }

  const sortedPriorities = [...priorities].sort((a, b) => b.priority - a.priority).slice(0, 4);
  const sortedSuggestions = [...suggestions].sort((a, b) => b.priority - a.priority).slice(0, 4);

  const urgent = sortedPriorities[0];
  const headline =
    urgent && urgent.priority >= 88
      ? `${input.clubName} · ${urgent.detail}`
      : `${input.clubName} · vue du jour`;

  const summaryParts = [
    `${input.teamsCount} équipe${input.teamsCount === 1 ? '' : 's'}`,
    `${input.playersCount} joueur${input.playersCount === 1 ? '' : 's'}`,
    `${input.coachesCount} coach${input.coachesCount === 1 ? '' : 's'}`,
  ];
  if (input.pendingMemberships > 0) {
    summaryParts.push(`${input.pendingMemberships} adhésion(s) en attente`);
  }

  return {
    headline,
    summary: summaryParts.join(' · '),
    priorities: sortedPriorities,
    suggestions: sortedSuggestions,
  };
}

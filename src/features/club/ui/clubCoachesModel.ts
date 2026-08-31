/**
 * Helpers purs Coachs Club — annuaire, équipes sans coach (testables).
 */
import type { Team } from '../../../models/Team';
import type { User } from '../../../models/User';

export type ClubCoachListItem = {
  coach: User;
  teams: Team[];
  teamsLabel: string;
  isUnassigned: boolean;
};

export function teamsForCoach(teams: Team[], coachUid: string): Team[] {
  return teams.filter((t) => t.coach_uids?.includes(coachUid));
}

export function buildClubCoachListItems(coaches: User[], teams: Team[]): ClubCoachListItem[] {
  return coaches.map((coach) => {
    const assigned = teamsForCoach(teams, coach.uid);
    return {
      coach,
      teams: assigned,
      teamsLabel: assigned.length
        ? assigned.map((t) => t.name).join(' · ')
        : 'Non affecté',
      isUnassigned: assigned.length === 0,
    };
  });
}

export function listTeamsWithoutCoach(teams: Team[]): Team[] {
  return teams.filter((t) => !(t.coach_uids?.length > 0));
}

export function resolveClubCoachesSubtitle(input: {
  coachCount: number;
  withoutCoach: number;
}): string {
  if (input.coachCount <= 0) {
    return input.withoutCoach > 0
      ? `${input.withoutCoach} équipe${input.withoutCoach > 1 ? 's' : ''} sans coach`
      : 'Staff technique';
  }
  if (input.withoutCoach > 0) {
    return `${input.coachCount} coach${input.coachCount > 1 ? 's' : ''} · ${input.withoutCoach} sans coach`;
  }
  return `${input.coachCount} coach${input.coachCount > 1 ? 's' : ''} · toutes les équipes couvertes`;
}

/** Préfère un coach libre pour affecter une équipe sans coach. */
export function preferCoachForAssignment(
  coaches: User[],
  teams: Team[],
): User | undefined {
  const items = buildClubCoachListItems(coaches, teams);
  return items.find((i) => i.isUnassigned)?.coach ?? coaches[0];
}

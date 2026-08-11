export type TeamStaffRole = 'coach' | 'assistant' | 'analyst' | 'physio';

/** Membre staff rattaché à une équipe / club. */
export interface TeamStaffMember {
  id: string;
  club_id: string;
  team_id?: string;
  uid: string;
  display_name: string;
  staff_role: TeamStaffRole;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTeamStaffInput {
  club_id: string;
  team_id?: string;
  uid: string;
  display_name: string;
  staff_role: TeamStaffRole;
}

export const TEAM_STAFF_ROLE_LABELS: Record<TeamStaffRole, string> = {
  coach: 'Coach',
  assistant: 'Adjoint',
  analyst: 'Analyste',
  physio: 'Staff santé',
};

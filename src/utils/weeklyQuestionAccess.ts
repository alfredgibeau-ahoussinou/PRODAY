import type { UserRole } from '../models/User';

const PARTICIPANT_ROLES: UserRole[] = [
  'player',
  'coach',
  'club',
  'agent',
  'recruiter',
  'organizer',
  'physio',
];

export function canParticipateWeeklyQuestion(role: UserRole): boolean {
  return PARTICIPANT_ROLES.includes(role);
}

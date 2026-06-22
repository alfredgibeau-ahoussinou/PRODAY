import type { ComponentType } from 'react';
import type { User, UserRole } from '../../../models/User';
import { isStaffRoleHome, type StaffRoleHomeRole } from './roleHomeDashboardRoles';
import { CoachHomeDashboard } from './CoachHomeDashboard';
import { ClubHomeDashboard } from './ClubHomeDashboard';
import { RecruiterHomeDashboard } from './RecruiterHomeDashboard';
import { OrganizerHomeDashboard } from './OrganizerHomeDashboard';
import { AgentHomeDashboard } from './AgentHomeDashboard';

export type { StaffRoleHomeRole };
export { STAFF_ROLE_HOME_ROLES, isStaffRoleHome } from './roleHomeDashboardRoles';

export interface StaffRoleHomeProps {
  profile: User;
  unreadMessages: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

const ROLE_HOME_MAP: Record<StaffRoleHomeRole, ComponentType<StaffRoleHomeProps>> = {
  coach: CoachHomeDashboard,
  club: ClubHomeDashboard,
  recruiter: RecruiterHomeDashboard,
  organizer: OrganizerHomeDashboard,
  agent: AgentHomeDashboard,
};

/** Résout le dashboard d'accueil dédié pour un rôle staff (hors player/physio/sponsor). */
export function resolveRoleHomeDashboard(
  role: UserRole
): ComponentType<StaffRoleHomeProps> | null {
  if (!isStaffRoleHome(role)) return null;
  return ROLE_HOME_MAP[role];
}

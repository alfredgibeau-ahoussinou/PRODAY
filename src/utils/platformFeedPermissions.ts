import type { UserRole } from '../models/User';

const FEED_AUTHOR_ROLES: UserRole[] = ['agent', 'physio', 'coach', 'organizer', 'club'];

export function canPublishFeedNews(role: UserRole): boolean {
  return FEED_AUTHOR_ROLES.includes(role);
}

export function canCreateAgentPoll(role: UserRole): boolean {
  return role === 'agent';
}

export function canVoteAgentPoll(role: UserRole): boolean {
  return role === 'agent';
}

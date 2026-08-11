import type { PlayerActivity, PlayerActivityType } from '../models/PlayerActivity';
import type { IconName } from '../components/ui/iconNames';

export function formatActivityScoreSnippet(activity: PlayerActivity): string | null {
  if (activity.type !== 'match') return null;
  const parts: string[] = [];
  if (activity.goals != null) {
    parts.push(`${activity.goals} but${activity.goals > 1 ? 's' : ''}`);
  }
  if (activity.assists != null) {
    parts.push(`${activity.assists} passe${activity.assists > 1 ? 's' : ''}`);
  }
  if (activity.rating_self != null) {
    parts.push(`${activity.rating_self}/10`);
  }
  return parts.length ? parts.join(' · ') : null;
}

export function activityTypeIcon(type: PlayerActivityType): IconName {
  switch (type) {
    case 'match':
      return 'football';
    case 'recovery':
      return 'heart';
    default:
      return 'time';
  }
}

export function recentActivitiesForTimeline(
  activities: PlayerActivity[],
  max = 8
): PlayerActivity[] {
  return [...activities]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, max);
}

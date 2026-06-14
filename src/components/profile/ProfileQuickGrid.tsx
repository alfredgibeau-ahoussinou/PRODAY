import React from 'react';
import type { IconName } from '../ui/Icon';
import { ProDayActionTiles, type ProDayActionTile } from '../ui/ProDayActionTiles';

export type ProfileQuickAction = {
  id: string;
  label: string;
  icon: IconName;
  onPress: () => void;
  badge?: number;
};

interface ProfileQuickGridProps {
  actions: ProfileQuickAction[];
}

/** Raccourcis profil — grandes tuiles unifiées. */
export const ProfileQuickGrid: React.FC<ProfileQuickGridProps> = ({ actions }) => {
  const items: ProDayActionTile[] = actions.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    badge: action.badge,
  }));

  const handlers = Object.fromEntries(actions.map((a) => [a.id, a.onPress]));

  return (
    <ProDayActionTiles
      items={items}
      onPress={(id) => handlers[id]?.()}
      inset={false}
    />
  );
};

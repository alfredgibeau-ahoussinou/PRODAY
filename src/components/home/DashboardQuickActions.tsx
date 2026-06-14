import React from 'react';
import type { IconName } from '../ui/Icon';
import { ProDayActionTiles, type ProDayActionTile } from '../ui/ProDayActionTiles';

export type DashboardAction = {
  id: string;
  label: string;
  sublabel?: string;
  icon: IconName;
  onPress: () => void;
};

interface DashboardQuickActionsProps {
  actions: DashboardAction[];
}

/** Grille d'actions principales — accueil connecté. */
export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ actions }) => {
  if (actions.length === 0) return null;

  const items: ProDayActionTile[] = actions.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    subtitle: action.sublabel,
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

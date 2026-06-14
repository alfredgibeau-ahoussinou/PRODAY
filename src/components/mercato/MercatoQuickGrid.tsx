import React, { useMemo } from 'react';
import type { MercatoQuickTile, MercatoQuickTileId } from '../../content/mercatoExperience';
import { ProDayActionTiles } from '../ui/ProDayActionTiles';
import type { RecruitmentStats } from '../../services/stats.service';
import { formatCount } from '../../services/stats.service';

interface MercatoQuickGridProps {
  tiles: MercatoQuickTile[];
  stats: RecruitmentStats | null;
  loading?: boolean;
  onPress: (id: MercatoQuickTileId) => void;
}

function tileSubtitle(
  id: MercatoQuickTileId,
  stats: RecruitmentStats | null,
  loading: boolean
): string {
  if (id === 'detections') return 'Essais & scouting';
  if (id === 'stages') return 'Camps & stages foot';
  if (!stats) return loading ? '…' : '0';
  if (id === 'players') return formatCount(stats.players, 'profil');
  if (id === 'clubs') return formatCount(stats.clubs, 'club');
  return '';
}

export const MercatoQuickGrid: React.FC<MercatoQuickGridProps> = ({
  tiles,
  stats,
  loading,
  onPress,
}) => {
  const items = useMemo(
    () =>
      tiles.map((tile) => {
        const isStatTile = tile.id === 'players' || tile.id === 'clubs';
        return {
          id: tile.id,
          label: tile.title,
          icon: tile.icon,
          subtitle: isStatTile
            ? tileSubtitle(tile.id, stats, !!loading)
            : tile.hint || tileSubtitle(tile.id, stats, !!loading),
          loading: loading && isStatTile,
        };
      }),
    [tiles, stats, loading]
  );

  return (
    <ProDayActionTiles
      items={items}
      onPress={(id) => onPress(id as MercatoQuickTileId)}
    />
  );
};

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../ui/Icon';
import type { AppColors } from '../../theme/universeTheme';
import type { MercatoQuickTile, MercatoQuickTileId } from '../../content/mercatoExperience';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { RecruitmentStats } from '../../services/stats.service';
import { formatCount } from '../../services/stats.service';

interface MercatoQuickGridProps {
  tiles: MercatoQuickTile[];
  colors: AppColors;
  stats: RecruitmentStats | null;
  loading?: boolean;
  onPress: (id: MercatoQuickTileId) => void;
}

function tileCount(
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
  colors,
  stats,
  loading,
  onPress,
}) => (
  <View style={styles.grid}>
    {tiles.map((tile) => (
      <TouchableOpacity
        key={tile.id}
        style={[
          styles.tile,
          { borderColor: colors.border, backgroundColor: colors.surface },
          shadows.soft,
        ]}
        onPress={() => onPress(tile.id)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.accentSoft }]}>
          <Icon name={tile.icon} size={22} color={colors.brand} variant="filled" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{tile.title}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>{tile.hint}</Text>
        {loading && (tile.id === 'players' || tile.id === 'clubs') ? (
          <ActivityIndicator
            size="small"
            color={colors.brand}
            style={styles.loader}
          />
        ) : (
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {tileCount(tile.id, stats, !!loading)}
          </Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 130,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: '800' },
  hint: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  count: { fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
  loader: { marginTop: spacing.sm, alignSelf: 'flex-start' },
});

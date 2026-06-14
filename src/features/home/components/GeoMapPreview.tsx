import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { formatDistanceKm } from '../../../utils/geoLocation';
import { clusterGeoMarkers } from '../../../core/geo/geoCluster.engine';
import type { GeoDensitySummary, GeoMarker, GeoRadiusKm } from '../../../core/types/geo';
import { spacing, radius } from '../../../theme/designTokens';

interface GeoMapPreviewProps {
  markers: GeoMarker[];
  density: GeoDensitySummary;
  onRadiusChange: (radius: GeoRadiusKm) => void;
  onMarkerPress: () => void;
}

const RADII: GeoRadiusKm[] = [1, 5, 10];

/** Carte géolocalisation — densité locale + clustering (Google Maps pattern). */
export const GeoMapPreview: React.FC<GeoMapPreviewProps> = ({
  markers,
  density,
  onRadiusChange,
  onMarkerPress,
}) => {
  const { colors } = useAppTheme();
  const { clusters, singles } = useMemo(() => clusterGeoMarkers(markers), [markers]);
  const listMarkers = singles.length > 0 ? singles : markers;

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <ProDayText variant="section">Autour de vous</ProDayText>
        <View style={styles.radiusRow}>
          {RADII.map((r) => (
            <Pressable
              key={r}
              onPress={() => onRadiusChange(r)}
              style={[
                styles.radiusChip,
                {
                  backgroundColor: density.radiusKm === r ? colors.accentSoft : colors.surfaceMuted,
                  borderColor: density.radiusKm === r ? colors.accentMuted : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" accent={density.radiusKm === r} muted={density.radiusKm !== r}>
                {r} km
              </ProDayText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.map, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <View style={[styles.pin, { backgroundColor: colors.accent }]} />
        {clusters.slice(0, 2).map((c, i) => (
          <View
            key={c.id}
            style={[
              styles.cluster,
              {
                backgroundColor: colors.accent,
                top: 20 + i * 28,
                left: 50 + i * 70,
              },
            ]}
          >
            <ProDayText variant="caption" inverse style={styles.clusterText}>
              {c.count}
            </ProDayText>
          </View>
        ))}
        {singles.slice(0, 4).map((m, i) => (
          <View
            key={m.id}
            style={[
              styles.dot,
              {
                backgroundColor: colors.accentLight,
                top: 24 + i * 18,
                left: 40 + (i % 2) * 80,
              },
            ]}
          />
        ))}
        <ProDayText variant="caption" muted style={styles.mapHint}>
          {density.matchesNearby} match(s) · {density.eventsNearby} événement(s)
          {clusters.length > 0 ? ` · ${clusters.length} zone(s)` : ''}
        </ProDayText>
      </View>

      {listMarkers.slice(0, 3).map((m) => (
        <Pressable key={m.id} onPress={onMarkerPress} style={[styles.row, { borderColor: colors.border }]}>
          <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
            <Icon name="football" size={16} color={colors.accent} />
          </View>
          <View style={styles.rowCopy}>
            <ProDayText variant="caption" numberOfLines={1} style={styles.rowTitle}>
              {m.title}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={1}>
              {m.city} · {formatDistanceKm(m.distanceKm)}
            </ProDayText>
          </View>
          <Icon name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>
      ))}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md, marginHorizontal: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radiusRow: { flexDirection: 'row', gap: spacing.xs },
  radiusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  map: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  pin: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    left: '50%',
    marginTop: -5,
    marginLeft: -5,
  },
  cluster: {
    position: 'absolute',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  clusterText: { fontWeight: '800', fontSize: 10 },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.85,
  },
  mapHint: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontWeight: '600' },
});

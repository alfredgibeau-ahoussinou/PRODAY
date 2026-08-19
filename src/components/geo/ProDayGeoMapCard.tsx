import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { ProDayLiveMap, GEO_MAP_HEIGHT } from './ProDayLiveMap';
import { useAppTheme } from '../../context/ProductLineContext';
import { formatDistanceKm } from '../../utils/geoLocation';
import { filterByRadius } from '../../core/geo/geoService';
import type { GeoDensitySummary, GeoMarker, GeoRadiusKm } from '../../core/types/geo';
import type { GeoPoint } from '../../models/User';
import { spacing, radius } from '../../theme/designTokens';

const RADII: GeoRadiusKm[] = [1, 5, 10];

export type ProDayGeoMapVariant = 'nearby' | 'network';

export interface ProDayGeoMapCardProps {
  userLocation?: GeoPoint;
  markers: GeoMarker[];
  density: GeoDensitySummary;
  radiusKm: GeoRadiusKm;
  onRadiusChange: (radius: GeoRadiusKm) => void;
  onRefreshLocation: () => void;
  onMarkerPress: (marker: GeoMarker) => void;
  locating?: boolean;
  locError?: string | null;
  footer?: React.ReactNode;
  /** `network` = vue staff (réseau régional). */
  variant?: ProDayGeoMapVariant;
}

/** Carte géolocalisée — carte plein cadre + contrôles flottants. */
export const ProDayGeoMapCard: React.FC<ProDayGeoMapCardProps> = ({
  userLocation,
  markers,
  density,
  radiusKm,
  onRadiusChange,
  onRefreshLocation,
  onMarkerPress,
  locating = false,
  locError,
  footer,
  variant = 'nearby',
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const visibleMarkers = useMemo(() => filterByRadius(markers, radiusKm), [markers, radiusKm]);
  const isNetwork = variant === 'network';
  const badgeLabel = isNetwork ? 'Réseau régional' : 'Autour de vous';

  const mapOverlay = (
    <>
      <View style={styles.topBadge}>
        <View style={[styles.badgePill, { backgroundColor: colors.surface }]}>
          <Icon name={isNetwork ? 'people' : 'location'} size={14} color={colors.accent} />
          <ProDayText variant="caption" style={styles.badgeTitle}>
            {badgeLabel}
          </ProDayText>
        </View>
      </View>

      <View style={styles.bottomControls}>
        <View style={[styles.radiusRail, { backgroundColor: `${colors.surface}EE` }]}>
          {RADII.map((r) => {
            const active = density.radiusKm === r;
            return (
              <Pressable
                key={r}
                onPress={() => onRadiusChange(r)}
                style={[
                  styles.radiusBtn,
                  active && { backgroundColor: colors.accent },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.radiusLabel, active && styles.radiusLabelActive]}
                >
                  {r} km
                </ProDayText>
              </Pressable>
            );
          })}
        </View>

        <PressableSpring
          onPress={onRefreshLocation}
          scaleTo={0.97}
          haptic
          style={[styles.locateBtn, { backgroundColor: colors.accent }]}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Icon name="location" size={18} color={colors.surface} />
              <ProDayText variant="caption" inverse style={styles.locateLabel}>
                Vous
              </ProDayText>
            </>
          )}
        </PressableSpring>
      </View>
    </>
  );

  return (
    <GlassCard variant="default" style={styles.card}>
      <ProDayLiveMap
        center={userLocation}
        radiusKm={radiusKm}
        markers={visibleMarkers}
        height={GEO_MAP_HEIGHT}
        overlay={mapOverlay}
        onMarkerPress={(id) => {
          const marker = visibleMarkers.find((m) => m.id === id);
          if (marker) onMarkerPress(marker);
        }}
        style={styles.map}
      />

      <View style={styles.body}>
        {isNetwork ? (
          <View style={styles.networkIntro}>
            <ProDayText variant="section" style={styles.networkTitle}>
              Activité près de votre club
            </ProDayText>
            <ProDayText variant="caption" muted>
              Matchs amicaux, convocations et signaux locaux pour scouting & logistique.
            </ProDayText>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          {isNetwork && density.usersNearby > 0 ? (
            <StatPill
              icon="people"
              label={`${density.usersNearby} profil${density.usersNearby > 1 ? 's' : ''}`}
              colors={colors}
            />
          ) : null}
          <StatPill
            icon="football"
            label={`${density.matchesNearby} match${density.matchesNearby > 1 ? 's' : ''}`}
            colors={colors}
          />
          <StatPill
            icon="calendar"
            label={`${density.eventsNearby} événement${density.eventsNearby > 1 ? 's' : ''}`}
            colors={colors}
          />
          {isNetwork && density.fieldsNearby > 0 ? (
            <StatPill
              icon="location"
              label={`${density.fieldsNearby} terrain${density.fieldsNearby > 1 ? 's' : ''}`}
              colors={colors}
            />
          ) : null}
          <ProDayText variant="caption" muted style={styles.radiusHint}>
            Rayon {radiusKm} km
          </ProDayText>
        </View>

        {locError ? (
          <Pressable
            onPress={onRefreshLocation}
            style={[styles.locError, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Réessayer la géolocalisation"
          >
            <Icon name="location" size={16} color={colors.textMuted} />
            <ProDayText variant="caption" muted style={styles.locErrorText}>
              {locError}
            </ProDayText>
            <ProDayText variant="caption" accent style={styles.locRetry}>
              Réessayer
            </ProDayText>
          </Pressable>
        ) : null}

        {visibleMarkers.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
            <Icon name={isNetwork ? 'people' : 'football-outline'} size={22} color={colors.textMuted} />
            <ProDayText variant="caption" muted style={styles.emptyText}>
              {isNetwork
                ? 'Aucun signal dans ce rayon. Passez à 10 km pour élargir le scouting local.'
                : "Rien à proximité pour l'instant. Élargissez le rayon ou revenez plus tard."}
            </ProDayText>
          </View>
        ) : (
          visibleMarkers.slice(0, isNetwork ? 6 : 4).map((m) => (
            <PressableSpring
              key={m.id}
              onPress={() => onMarkerPress(m)}
              scaleTo={0.98}
              style={[styles.nearbyCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            >
              <View style={[styles.nearbyIcon, { backgroundColor: colors.surface }]}>
                <Icon
                  name={
                    m.kind === 'event'
                      ? 'calendar'
                      : m.kind === 'user'
                        ? 'person'
                        : 'football'
                  }
                  size={18}
                  color={colors.accent}
                />
              </View>
              <View style={styles.nearbyCopy}>
                <ProDayText variant="caption" numberOfLines={1} style={styles.nearbyTitle}>
                  {m.title}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={1}>
                  {m.city} · {formatDistanceKm(m.distanceKm)}
                  {isNetwork && m.subtitle ? ` · ${m.subtitle}` : ''}
                </ProDayText>
              </View>
              <Icon name="chevron-forward" size={16} color={colors.textMuted} />
            </PressableSpring>
          ))
        )}

        {footer}
      </View>
    </GlassCard>
  );
};

const StatPill: React.FC<{
  icon: 'football' | 'calendar' | 'people' | 'location';
  label: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ icon, label, colors }) => (
  <View style={[statStyles.pill, { backgroundColor: colors.accentSoft }]}>
    <Icon name={icon} size={12} color={colors.accent} />
    <ProDayText variant="caption" accent style={statStyles.label}>
      {label}
    </ProDayText>
  </View>
);

const statStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  label: { fontWeight: '700', fontSize: 11 },
});

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    card: {
      padding: 0,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    map: {
      borderRadius: 0,
      borderWidth: 0,
    },
    body: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    networkIntro: { gap: 2, marginBottom: spacing.xs },
    networkTitle: { fontSize: 16 },
    topBadge: {
      alignItems: 'flex-start',
    },
    badgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    badgeTitle: { fontWeight: '700' },
    bottomControls: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    radiusRail: {
      flexDirection: 'row',
      borderRadius: radius.pill,
      padding: 3,
      gap: 2,
      flex: 1,
      maxWidth: 200,
    },
    radiusBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    radiusLabel: {
      fontWeight: '600',
      fontSize: 11,
      color: colors.ink,
    },
    radiusLabelActive: {
      color: colors.surface,
      fontWeight: '800',
    },
    locateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 3,
    },
    locateLabel: { fontWeight: '800', fontSize: 11 },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    radiusHint: { marginLeft: 'auto', fontSize: 10 },
    locError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    locErrorText: { flex: 1, lineHeight: 18 },
    locRetry: { fontWeight: '700', fontSize: 12 },
    empty: {
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radius.md,
    },
    emptyText: { textAlign: 'center', lineHeight: 18 },
    nearbyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    nearbyIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nearbyCopy: { flex: 1, minWidth: 0 },
    nearbyTitle: { fontWeight: '700', fontSize: 13 },
  });
}

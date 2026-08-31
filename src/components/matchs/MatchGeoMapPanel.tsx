import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayGeoMapCard } from '../geo/ProDayGeoMapCard';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import type { GeoDensitySummary, GeoMarker, GeoRadiusKm } from '../../core/types/geo';
import type { GeoPoint } from '../../models/User';
import { spacing, radius } from '../../theme/designTokens';

export interface MatchGeoMapPanelProps {
  userLocation?: GeoPoint;
  markers: GeoMarker[];
  density: GeoDensitySummary;
  radiusKm: GeoRadiusKm;
  onRadiusChange: (radius: GeoRadiusKm) => void;
  onRefreshLocation: () => void;
  locating?: boolean;
  locError?: string | null;
  onMarkerPress: (marker: GeoMarker) => void;
  onSearch?: () => void;
  onPropose?: () => void;
  onCreateEvent?: () => void;
  /** Dans le ScrollView calendrier — sans marge horizontale supplémentaire. */
  embedded?: boolean;
}

/** Panneau carte Matchs — actions rapides sous la carte partagée. */
export const MatchGeoMapPanel: React.FC<MatchGeoMapPanelProps> = ({
  userLocation,
  markers,
  density,
  radiusKm,
  onRadiusChange,
  onRefreshLocation,
  locating,
  locError,
  onMarkerPress,
  onSearch,
  onPropose,
  onCreateEvent,
  embedded = false,
}) => {
  const { colors } = useAppTheme();
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const accent = isPlayer ? joueurTheme.accent : colors.accent;
  const accentSoft = isPlayer ? playerColors.accentSoft : colors.accentSoft;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const footer = (
    <View style={styles.footer}>
      {onPropose ? (
        <PressableSpring onPress={onPropose} scaleTo={0.97} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            Proposer un match →
          </ProDayText>
        </PressableSpring>
      ) : null}
      {onSearch ? (
        <PressableSpring
          onPress={onSearch}
          scaleTo={0.98}
          style={[styles.searchBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
        >
          <Icon name="search" size={16} color={colors.ink} />
          <ProDayText variant="caption" style={styles.searchLabel}>
            Rechercher un match plus loin
          </ProDayText>
        </PressableSpring>
      ) : null}
      {onCreateEvent ? (
        <PressableSpring onPress={onCreateEvent} scaleTo={0.98} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            Créer une convocation →
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );

  return (
    <View style={embedded ? undefined : styles.wrap}>
      <ProDayGeoMapCard
        userLocation={userLocation}
        markers={markers}
        density={density}
        radiusKm={radiusKm}
        onRadiusChange={onRadiusChange}
        onRefreshLocation={onRefreshLocation}
        onMarkerPress={onMarkerPress}
        locating={locating}
        locError={locError}
        footer={footer}
        accent={accent}
        accentSoft={accentSoft}
      />
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: { marginHorizontal: spacing.lg },
    footer: { gap: spacing.sm, marginTop: spacing.xs },
    link: { fontWeight: '700', textAlign: 'center' },
    searchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    searchLabel: { fontWeight: '600' },
  });
}

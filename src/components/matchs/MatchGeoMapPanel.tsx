import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayGeoMapCard } from '../geo/ProDayGeoMapCard';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { GeoDensitySummary, GeoMarker, GeoRadiusKm } from '../../core/types/geo';
import type { GeoPoint } from '../../models/User';
import { spacing, radius } from '../../theme/designTokens';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

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
  /** Déplié par défaut */
  initialExpanded?: boolean;
}

/** Panneau carte Matchs — radar interactif repliable. */
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
  initialExpanded = false,
}) => {
  const { colors } = useAppTheme();
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const accent = isPlayer ? joueurTheme.accent : colors.accent;
  const accentSoft = isPlayer ? playerColors.accentSoft : colors.accentSoft;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [expanded, setExpanded] = useState(initialExpanded);

  const toggleExpanded = () => {
    prodayHaptics.press();
    setExpanded((prev) => !prev);
  };

  const footer = (
    <View style={styles.footer}>
      {onPropose ? (
        <PressableSpring onPress={onPropose} scaleTo={0.97} haptic>
          <ProDayText variant="caption" style={[styles.link, { color: accent }]}>
            Proposer un match →
          </ProDayText>
        </PressableSpring>
      ) : null}
      {onSearch ? (
        <PressableSpring
          onPress={onSearch}
          scaleTo={0.98}
          style={[
            styles.searchBtn,
            {
              backgroundColor: isPlayer ? 'rgba(255,255,255,0.04)' : colors.surfaceMuted,
              borderColor: isPlayer ? 'rgba(255,255,255,0.08)' : colors.border,
            },
          ]}
        >
          <Icon name="search" size={15} color={isPlayer ? '#FFFFFF' : colors.ink} />
          <ProDayText
            variant="caption"
            style={[styles.searchLabel, { color: isPlayer ? '#FFFFFF' : colors.ink }]}
          >
            Rechercher un match plus loin
          </ProDayText>
        </PressableSpring>
      ) : null}
      {onCreateEvent ? (
        <PressableSpring onPress={onCreateEvent} scaleTo={0.98} haptic>
          <ProDayText variant="caption" style={[styles.link, { color: accent }]}>
            Créer une convocation →
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );

  return (
    <View style={embedded ? undefined : styles.wrap}>
      <PressableSpring
        onPress={toggleExpanded}
        scaleTo={0.98}
        haptic
        style={[
          styles.radarHeader,
          {
            backgroundColor: isPlayer ? PLAYER_DARK.surfaceRaised : colors.surface,
            borderColor: isPlayer ? PLAYER_DARK.border : colors.border,
          },
        ]}
      >
        <View style={[styles.radarIconWrap, { backgroundColor: accentSoft }]}>
          <Icon name="location" size={16} color={accent} />
        </View>
        <View style={styles.radarCopy}>
          <View style={styles.radarTitleRow}>
            <ProDayText variant="caption" style={styles.radarTitle}>
              Radar Proximité
            </ProDayText>
            <View style={[styles.pulsePill, { backgroundColor: accentSoft }]}>
              <View style={[styles.pulseDot, { backgroundColor: accent }]} />
              <ProDayText variant="caption" style={[styles.pulseText, { color: accent }]}>
                {density.matchesNearby + density.eventsNearby} signaux
              </ProDayText>
            </View>
          </View>
          <ProDayText variant="caption" style={styles.radarSub}>
            Rayon {radiusKm} km · Matchs & convocations
          </ProDayText>
        </View>
        <View style={[styles.toggleBtn, { backgroundColor: isPlayer ? 'rgba(255,255,255,0.06)' : colors.surfaceMuted }]}>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={accent} />
        </View>
      </PressableSpring>

      {expanded ? (
        <View style={styles.mapContainer}>
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
      ) : null}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: { marginHorizontal: spacing.lg },
    radarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
    },
    radarIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radarCopy: {
      flex: 1,
      gap: 3,
    },
    radarTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    radarTitle: {
      fontWeight: '800',
      fontSize: 14,
    },
    pulsePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
    },
    pulseDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    pulseText: {
      fontWeight: '800',
      fontSize: 9.5,
    },
    radarSub: {
      fontSize: 11,
      color: PLAYER_DARK.textMuted,
    },
    toggleBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapContainer: {
      marginTop: spacing.sm,
    },
    footer: { gap: spacing.sm, marginTop: spacing.xs },
    link: { fontWeight: '700', textAlign: 'center' },
    searchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    searchLabel: { fontWeight: '600' },
  });
}

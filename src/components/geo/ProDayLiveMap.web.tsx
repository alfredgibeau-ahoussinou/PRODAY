import React, { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { GeoPoint } from '../../models/User';
import type { GeoMarker, GeoRadiusKm } from '../../core/types/geo';
import { useAppTheme } from '../../context/ProductLineContext';
import { buildOsmEmbedUrl, mapCenter } from '../../utils/osmMapProjection';
import { radius } from '../../theme/designTokens';

export const GEO_MAP_HEIGHT = 260;

export interface ProDayLiveMapProps {
  center?: GeoPoint;
  radiusKm: GeoRadiusKm;
  markers: GeoMarker[];
  height?: number;
  onMarkerPress?: (markerId: string) => void;
  style?: ViewStyle;
  overlay?: ReactNode;
  accent?: string;
}

/** Web : embed OSM uniquement (pas de react-native-maps / codegenNativeCommands). */
export const ProDayLiveMap: React.FC<ProDayLiveMapProps> = ({
  center,
  radiusKm,
  height = GEO_MAP_HEIGHT,
  style,
  overlay,
}) => {
  const { colors } = useAppTheme();
  const resolvedCenter = mapCenter(center);
  const embedUrl = useMemo(
    () => buildOsmEmbedUrl(resolvedCenter, radiusKm),
    [resolvedCenter, radiusKm]
  );

  return (
    <View style={[styles.shell, { height, borderColor: colors.border }, style]}>
      <iframe
        title="Carte ProDay"
        src={embedUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: colors.surfaceMuted,
        }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />
      {overlay ? <View style={styles.overlay}>{overlay}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#e8edf2',
    position: 'relative',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
  },
});

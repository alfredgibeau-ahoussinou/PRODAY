import React, { Component, useMemo, type ErrorInfo, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { GeoPoint } from '../../models/User';
import type { GeoMarker, GeoRadiusKm } from '../../core/types/geo';
import { useAppTheme } from '../../context/ProductLineContext';
import { buildOsmEmbedUrl, mapCenter } from '../../utils/osmMapProjection';
import { regionForRadius } from '../../utils/mapRegion';
import { radius } from '../../theme/designTokens';
import { GeoMapPin } from './GeoMapPin';

let NativeMapView: typeof import('react-native-maps').default | null = null;
let NativeMarker: typeof import('react-native-maps').Marker | null = null;
let NativeCircle: typeof import('react-native-maps').Circle | null = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps') as typeof import('react-native-maps');
    NativeMapView = maps.default;
    NativeMarker = maps.Marker;
    NativeCircle = maps.Circle;
  } catch {
    NativeMapView = null;
    NativeMarker = null;
    NativeCircle = null;
  }
}

export const GEO_MAP_HEIGHT = 260;

export interface ProDayLiveMapProps {
  center?: GeoPoint;
  radiusKm: GeoRadiusKm;
  markers: GeoMarker[];
  height?: number;
  onMarkerPress?: (markerId: string) => void;
  style?: ViewStyle;
  /** Contrôles flottants (rayon, localisation) */
  overlay?: React.ReactNode;
}

function WebMapFallback({
  center,
  radiusKm,
  height,
  colors,
}: {
  center: GeoPoint;
  radiusKm: GeoRadiusKm;
  height: number;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const embedUrl = useMemo(() => buildOsmEmbedUrl(center, radiusKm), [center, radiusKm]);
  if (Platform.OS === 'web') {
    return (
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
    );
  }
  // Fallback OSM (WebView) : Honor/Huawei sans GMS, ou crash Google Maps.
  try {
    const { WebView } = require('react-native-webview') as typeof import('react-native-webview');
    return (
      <WebView
        source={{ uri: embedUrl }}
        style={{ flex: 1, backgroundColor: colors.surfaceMuted, height }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
      />
    );
  } catch {
    return <View style={{ flex: 1, height, backgroundColor: colors.surfaceMuted }} />;
  }
}

class NativeMapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    /* fallback OSM ci-dessous */
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/** Carte native (Apple/Google) sur mobile, embed OSM en fallback. */
export const ProDayLiveMap: React.FC<ProDayLiveMapProps> = ({
  center,
  radiusKm,
  markers,
  height = GEO_MAP_HEIGHT,
  onMarkerPress,
  style,
  overlay,
}) => {
  const { colors } = useAppTheme();
  const resolvedCenter = mapCenter(center);
  const mapRegion = useMemo(
    () => regionForRadius(resolvedCenter, radiusKm),
    [resolvedCenter, radiusKm]
  );

  const osmFallback = (
    <View style={StyleSheet.absoluteFill}>
      <WebMapFallback
        center={resolvedCenter}
        radiusKm={radiusKm}
        height={height}
        colors={colors}
      />
    </View>
  );

  const mapBody =
    Platform.OS !== 'web' && NativeMapView && NativeMarker && NativeCircle ? (
      <NativeMapErrorBoundary fallback={osmFallback}>
        <NativeMapView
          style={styles.map}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          loadingEnabled
          loadingIndicatorColor={colors.accent}
          mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        >
          <NativeCircle
            center={resolvedCenter}
            radius={radiusKm * 1000}
            fillColor={`${colors.accent}18`}
            strokeColor={colors.accent}
            strokeWidth={1.5}
          />
          {markers.map((marker) => (
            <NativeMarker
              key={marker.id}
              coordinate={{
                latitude: marker.location.latitude,
                longitude: marker.location.longitude,
              }}
              onPress={() => onMarkerPress?.(marker.id)}
              tracksViewChanges={false}
            >
              <GeoMapPin kind={marker.kind} accent={colors.accent} />
            </NativeMarker>
          ))}
        </NativeMapView>
      </NativeMapErrorBoundary>
    ) : (
      osmFallback
    );

  return (
    <View style={[styles.shell, { height, borderColor: colors.border }, style]}>
      {mapBody}
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
  map: {
    ...StyleSheet.absoluteFillObject,
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

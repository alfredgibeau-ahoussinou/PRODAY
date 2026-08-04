import React from 'react';
import {
  ProDayGeoMapCard,
  type ProDayGeoMapVariant,
} from '../../../components/geo/ProDayGeoMapCard';
import type { GeoDensitySummary, GeoMarker, GeoRadiusKm } from '../../../core/types/geo';
import type { GeoPoint } from '../../../models/User';

interface GeoMapPreviewProps {
  userLocation?: GeoPoint;
  markers: GeoMarker[];
  density: GeoDensitySummary;
  radiusKm: GeoRadiusKm;
  onRadiusChange: (radius: GeoRadiusKm) => void;
  onRefreshLocation: () => void;
  onMarkerPress: (marker: GeoMarker) => void;
  locating?: boolean;
  locError?: string | null;
  variant?: ProDayGeoMapVariant;
}

/** Carte géolocalisation accueil — carte OSM active. */
export const GeoMapPreview: React.FC<GeoMapPreviewProps> = (props) => (
  <ProDayGeoMapCard {...props} />
);

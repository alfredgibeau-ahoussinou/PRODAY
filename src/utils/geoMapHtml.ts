import type { GeoPoint } from '../models/User';
import type { GeoMarker, GeoRadiusKm } from '../core/types/geo';

const DEFAULT_CENTER: GeoPoint = { latitude: 48.8566, longitude: 2.3522 };

function markerColor(kind: GeoMarker['kind']): string {
  if (kind === 'match') return '#16a34a';
  if (kind === 'event') return '#ea580c';
  if (kind === 'field') return '#7c3aed';
  return '#2563eb';
}

export interface GeoMapHtmlOptions {
  center?: GeoPoint;
  radiusKm: GeoRadiusKm;
  markers: GeoMarker[];
  accentColor?: string;
  /** Désactivé par défaut pour laisser le scroll parent défiler la carte. */
  interactive?: boolean;
}

export function buildGeoMapHtml({
  center,
  radiusKm,
  markers,
  accentColor = '#2563eb',
  interactive = false,
}: GeoMapHtmlOptions): string {
  const mapCenter = center ?? DEFAULT_CENTER;
  const markerPayload = markers.map((m) => ({
    id: m.id,
    lat: m.location.latitude,
    lng: m.location.longitude,
    title: m.title,
    subtitle: m.subtitle,
    color: markerColor(m.kind),
  }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #e8edf2; }
    .leaflet-control-attribution { font-size: 9px !important; }
    .user-pin {
      width: 14px; height: 14px; border-radius: 50%;
      background: ${accentColor}; border: 3px solid #fff;
      box-shadow: 0 0 0 2px ${accentColor}55;
    }
    .geo-pin {
      width: 12px; height: 12px; border-radius: 50%;
      border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const center = ${JSON.stringify(mapCenter)};
    const radiusKm = ${radiusKm};
    const markers = ${JSON.stringify(markerPayload)};
    const accent = ${JSON.stringify(accentColor)};

    const map = L.map('map', {
      zoomControl: interactive,
      attributionControl: true,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    }).setView([center.latitude, center.longitude], radiusKm <= 1 ? 14 : radiusKm <= 5 ? 12 : 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.circle([center.latitude, center.longitude], {
      radius: radiusKm * 1000,
      color: accent,
      fillColor: accent,
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '6 4',
    }).addTo(map);

    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pin"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([center.latitude, center.longitude], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<b>Vous</b>');

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="geo-pin" style="background:' + m.color + '"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      marker.bindPopup('<b>' + m.title.replace(/</g, '&lt;') + '</b><br/>' + m.subtitle.replace(/</g, '&lt;'));
      marker.on('click', () => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: m.id }));
        }
      });
    });

    if (markers.length > 0) {
      const bounds = L.latLngBounds([
        [center.latitude, center.longitude],
        ...markers.map((m) => [m.lat, m.lng]),
      ]);
      map.fitBounds(bounds.pad(0.2), { maxZoom: 14 });
    }
  </script>
</body>
</html>`;
}

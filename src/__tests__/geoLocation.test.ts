import { formatCoordinates, formatDistanceKm } from '../utils/geoLocation';
import { formatCarpoolDistance } from '../utils/carpoolGeo';

describe('geoLocation', () => {
  it('formate les coordonnées', () => {
    expect(formatCoordinates({ latitude: 48.8566, longitude: 2.3522 })).toBe('48.85660°, 2.35220°');
  });

  it('formate les distances', () => {
    expect(formatDistanceKm(0.05)).toBe('< 100 m');
    expect(formatDistanceKm(0.8)).toBe('800 m');
    expect(formatDistanceKm(12.4)).toBe('12.4 km');
  });
});

describe('carpoolGeo', () => {
  it('calcule la distance RDV ↔ prise en charge', () => {
    const dist = formatCarpoolDistance(
      { latitude: 48.8566, longitude: 2.3522 },
      { latitude: 48.8606, longitude: 2.3376 }
    );
    expect(dist).toMatch(/km|m/);
  });
});

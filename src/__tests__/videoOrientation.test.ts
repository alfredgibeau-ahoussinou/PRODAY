import { Platform } from 'react-native';
import {
  FULLSCREEN_ORIENTATION_LOCK,
  PORTRAIT_ORIENTATION_LOCK,
  supportsOrientationLock,
} from '../features/video/videoOrientation';

/**
 * La stratégie d'orientation est dérivée de `Platform.OS` — les assertions
 * couvrent les deux natures de plateforme (native vs web) selon l'OS simulé.
 */
const NATIVE_OS = ['ios', 'android'] as const;
const NON_NATIVE_OS = ['web', 'windows', 'macos'] as const;

describe('videoOrientation — stratégie de verrou du lecteur plein écran', () => {
  it.each(NATIVE_OS)('sur %s, le verrou natif est pris en charge', (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    expect(supportsOrientationLock()).toBe(true);
  });

  it.each(NON_NATIVE_OS)('sur %s, aucun verrou natif (agrandissement sur place)', (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    expect(supportsOrientationLock()).toBe(false);
  });

  it.each(NATIVE_OS)(
    'le plein écran verrouille en paysage capteur et l’app restitue le portrait',
    (os) => {
      jest.replaceProperty(Platform, 'OS', os);
      expect(FULLSCREEN_ORIENTATION_LOCK).toBe(5); // OrientationLock.LANDSCAPE
      expect(PORTRAIT_ORIENTATION_LOCK).toBe(2); // OrientationLock.PORTRAIT
      expect(FULLSCREEN_ORIENTATION_LOCK).not.toBe(PORTRAIT_ORIENTATION_LOCK);
    },
  );
});

/** Les tests unitaires s'exécutent en mode développement (bypass démo, etc.). */
process.env.EXPO_PUBLIC_APP_ENV = 'development';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    muted: false,
    loop: false,
  })),
  VideoView: 'VideoView',
}));

// Le module natif RNCWebView n'existe pas sous Jest (TurboModule) : mock neutre.
jest.mock('react-native-webview', () => ({
  __esModule: true,
  default: 'WebView',
  WebView: 'WebView',
}));

// Le module natif d'orientation n'existe pas sous Jest : mock neutre (les
// verrous sont des appels fire-and-forget, testés par garde statique).
jest.mock('expo-screen-orientation', () => ({
  OrientationLock: {
    DEFAULT: 0,
    PORTRAIT: 2,
    LANDSCAPE: 5,
  },
  lockAsync: jest.fn(() => Promise.resolve()),
  lockPlatformAsync: jest.fn(() => Promise.resolve()),
  unlockAsync: jest.fn(() => Promise.resolve()),
}));

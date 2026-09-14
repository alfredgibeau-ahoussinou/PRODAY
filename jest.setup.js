/** Les tests unitaires s'exécutent en mode développement (bypass démo, etc.). */
process.env.EXPO_PUBLIC_APP_ENV = 'development';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    currentTime: 0,
    duration: 0,
    playing: false,
    muted: false,
  })),
  VideoView: 'VideoView',
}));

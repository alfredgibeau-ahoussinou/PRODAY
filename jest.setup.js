/** Les tests unitaires s'exécutent en mode développement (bypass démo, etc.). */
process.env.EXPO_PUBLIC_APP_ENV = 'development';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);



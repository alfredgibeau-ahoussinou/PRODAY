/**
 * Exclusions Android ciblées uniquement :
 * - react-native-health = Apple HealthKit (iOS only)
 * - react-native-worklets = inutilisé (Reanimated 3 / Legacy Arch)
 */
module.exports = {
  dependencies: {
    'react-native-health': {
      platforms: { android: null },
    },
    'react-native-worklets': {
      platforms: { android: null },
    },
  },
};

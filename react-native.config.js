/**
 * Exclusions Android agressives pour stabiliser le cold start APK.
 * Les modules restent disponibles sur iOS via autolinking.
 */
module.exports = {
  dependencies: {
    'react-native-health-connect': {
      platforms: { android: null },
    },
    'react-native-health': {
      platforms: { android: null },
    },
    // Google Maps SDK : crash possible sans GMS (Honor/Huawei) + poids natif inutile
    // tant que le cold start n'est pas stable.
    'react-native-maps': {
      platforms: { android: null },
    },
    // Worklets retiré (Reanimated 3 / Legacy Arch).
    'react-native-worklets': {
      platforms: { android: null },
    },
  },
};

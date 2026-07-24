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
  },
};

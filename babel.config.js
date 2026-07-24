module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 3 + Legacy Arch : plugin reanimated en dernier (pas worklets).
    plugins: ['react-native-reanimated/plugin'],
  };
};

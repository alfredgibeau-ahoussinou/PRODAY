module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 (Expo 54) : worklets plugin obligatoire, en dernier
    plugins: ['react-native-worklets/plugin'],
  };
};

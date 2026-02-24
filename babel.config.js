module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required by react-native-fast-tflite for on-device ML inference
      ['react-native-worklets/plugin'],
    ],
  };
};

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .tflite files to the assetExts so Metro includes them in the bundle
config.resolver.assetExts.push('tflite');

module.exports = config;

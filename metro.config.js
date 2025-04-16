const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Add asset resolver configuration
const assetConfig = {
  resolver: {
    assetExts: [...config.resolver.assetExts, 'jpg', 'png', 'jpeg', 'gif'],
  },
};

const mergedConfig = mergeConfig(config, assetConfig);
module.exports = wrapWithReanimatedMetroConfig(mergedConfig);


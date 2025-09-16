const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Set resolver aliases for custom components
config.resolver.alias = {
  ...config.resolver.alias, // Preserve existing aliases
  'react-native-linear-gradient': require.resolve('./src/components/shared/LinearGradient.js'),
  '@react-native-community/blur': require.resolve('./src/components/shared/BlurView.js'),
  'react-native-blur': require.resolve('./src/components/shared/BlurView.js'),
};

// Platform resolution order (web first for web bundling)
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Add source extensions for better module resolution
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx',
  'js',
  'ts',
  'tsx',
  'json',
  'cjs',
  'mjs'
];

// Ensure node_modules resolution works correctly
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules')
];

// Transform configuration for better compatibility
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Disable minification issues with certain modules
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;
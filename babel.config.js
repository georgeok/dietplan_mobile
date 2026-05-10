// SDK 55: Reanimated 4 uses react-native-worklets; its babel plugin replaces
// the old react-native-reanimated/plugin and must be listed last.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};

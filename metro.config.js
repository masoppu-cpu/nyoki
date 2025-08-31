const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 画像の最大サイズを制限
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// キャッシュ設定
config.resolver.assetExts = [...config.resolver.assetExts, 'db'];

module.exports = config;

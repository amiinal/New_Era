// Metro: treat woff2 as a bundled asset (PWA loads the same self-hosted
// latin Inter files the marketing site uses — ~24KB each instead of TTF).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('woff2');

module.exports = config;

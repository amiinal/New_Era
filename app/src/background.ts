import { Platform } from 'react-native';

// Branded wallpapers (app/assets/bg): pastel pair for light mode,
// navy/orbital pair for dark — mobile portrait vs desktop wide.
const LIGHT_MOBILE = require('../assets/bg/light-mobile.png');
const LIGHT_DESKTOP = require('../assets/bg/light-desktop.png');
const DARK_MOBILE = require('../assets/bg/dark-mobile.png');
const DARK_DESKTOP = require('../assets/bg/dark-desktop.png');

export function bgImage(dark: boolean, web = Platform.OS === 'web') {
  if (web) return dark ? DARK_DESKTOP : LIGHT_DESKTOP;
  return dark ? DARK_MOBILE : LIGHT_MOBILE;
}

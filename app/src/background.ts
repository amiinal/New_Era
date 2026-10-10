import { useWindowDimensions } from 'react-native';

// Branded wallpapers (app/assets/bg): pastel pair for light mode,
// navy/orbital pair for dark — portrait screens get the mobile art,
// wide screens get the desktop art.
const LIGHT_MOBILE = require('../assets/bg/light-mobile.png');
const LIGHT_DESKTOP = require('../assets/bg/light-desktop.png');
const DARK_MOBILE = require('../assets/bg/dark-mobile.png');
const DARK_DESKTOP = require('../assets/bg/dark-desktop.png');

export function bgImage(dark: boolean, wide: boolean) {
  if (wide) return dark ? DARK_DESKTOP : LIGHT_DESKTOP;
  return dark ? DARK_MOBILE : LIGHT_MOBILE;
}

// Hook version: picks art from the live screen shape.
export function useBg(dark: boolean) {
  const { width, height } = useWindowDimensions();
  return bgImage(dark, width > height);
}

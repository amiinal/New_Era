// Web (PWA) font map: same Inter, same family names, but tiny latin woff2
// (~24KB each vs ~343KB TTF) — first load stays light on costly mobile
// data. expo-font registers them via the FontFace API; the loader gate in
// App.tsx holds first paint until they're ready, and the service worker
// caches them like any same-origin file.
export const interMap = {
  Inter_400Regular: require('../assets/fonts/Inter-400.woff2'),
  Inter_500Medium: require('../assets/fonts/Inter-500.woff2'),
  Inter_600SemiBold: require('../assets/fonts/Inter-600.woff2'),
  Inter_700Bold: require('../assets/fonts/Inter-700.woff2'),
};

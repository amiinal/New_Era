import { useWindowDimensions } from 'react-native';

// Web responsiveness: centered column (max 900) on wide browsers,
// full-width on phones. Native unaffected.
export const WEB_MAX = 900;

export function useCols() {
  const { width } = useWindowDimensions();
  return Math.min(width, WEB_MAX) > 700 ? 3 : 2;
}

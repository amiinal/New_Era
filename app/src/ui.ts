import { Alert, Platform, useWindowDimensions } from 'react-native';

// Web responsiveness: centered column (max 900) on wide browsers,
// full-width on phones. Native unaffected.
export const WEB_MAX = 900;

export function useCols() {
  const { width } = useWindowDimensions();
  return Math.min(width, WEB_MAX) > 700 ? 3 : 2;
}

// Destructive confirms that work everywhere: web Alert.alert() drops
// custom buttons (plain window.alert, action never fires), so browser
// confirm() carries the choice there instead.
export function confirmAction(title: string, message: string, okLabel: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: okLabel, style: 'destructive', onPress: () => { onOk(); } },
  ]);
}

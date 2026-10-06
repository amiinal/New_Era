import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { C } from './theme';
import { getFlag, setFlag } from './store';

// App palette: light tokens, dark overrides (§1.4). 'system' follows the
// device; Settings can pin light/dark. Never hardcode C.* in screens —
// use useTheme().p instead so both modes stay correct.
export type Palette = { [K in keyof typeof C]: string };
const dark: Partial<Palette> = {
  background: C.darkBackground,
  surface: C.darkSurface,
  ink: C.darkInk,
  bodyText: C.darkBodyText,
  line: C.darkLine,
  primary: C.primaryOnDark,
  chatBg: C.darkSurface,
};

type Mode = 'system' | 'light' | 'dark';
type Ctx = { p: Palette; dark: boolean; mode: Mode; setMode: (m: Mode) => void };

const ThemeCtx = createContext<Ctx>({ p: C, dark: false, mode: 'system', setMode: async () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');
  useEffect(() => { getFlag('themeMode').then(v => v && setModeState(v as Mode)); }, []);
  const setMode = async (m: Mode) => { setModeState(m); await setFlag('themeMode', m); };
  const darkOn = mode === 'dark' || (mode === 'system' && system === 'dark');
  const p = (darkOn ? { ...C, ...dark } : C) as Palette;
  return <ThemeCtx.Provider value={{ p, dark: darkOn, mode, setMode }}>{children}</ThemeCtx.Provider>;
}

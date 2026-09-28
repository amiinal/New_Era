// Design tokens v1.2 — mirrors Docs/New-Era-Design-System.md §4.
// Single source of truth is the doc; do not hardcode values in screens.
export const C = {
  primary: '#2C3E7A',
  primaryDark: '#1F2C59',
  primaryOnDark: '#7B90D6',
  cta: '#C24E22',
  ctaTint: '#F2703C',
  ctaDark: '#A33D1A',
  success: '#0A6B62',
  warningTint: '#E8A639',
  warningText: '#8A5A12',
  error: '#B0362C',
  ink: '#1E1E24',
  bodyText: '#5B5F6B',
  line: '#E4E6EB',
  lineStrong: '#8B8F9B',
  surface: '#FFFFFF',
  background: '#F7F7F9',
  // dark
  darkBackground: '#121317',
  darkSurface: '#1C1F26',
  darkSurfaceRaised: '#24272F',
  darkInk: '#F2F2F5',
  darkBodyText: '#A9ACB6',
  darkLine: '#2E313A',
} as const;

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 48, s8: 64 } as const;
export const radius = { sm: 4, md: 8, lg: 16, xl: 24 } as const;

// Type scale (§1.2): size + weight pairs.
export const type = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '600' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodySm: { fontSize: 14, fontWeight: '400' },
  micro: { fontSize: 12, fontWeight: '500' },
} as const;

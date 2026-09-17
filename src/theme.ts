export const color = {
  bg: '#0B0C0E',
  surface: '#14161A',
  surfaceRaised: '#1B1E24',
  border: '#2A2D33',
  text: '#E8E6E1',
  muted: '#8B8E93',
  faint: '#5C5F66',
  accent: '#C4A574',
  accentDim: '#8A7349',
  danger: '#C45C4A',
  ok: '#6B8F71',
  blocked: '#C48A4A',
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
} as const;

export const type = {
  overline: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
} as const;

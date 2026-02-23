// Design Tokens — MY LIFE Training App (Web)
// Alle Styles müssen diese Tokens verwenden. Niemals Farben oder Abstände hardcoden.

export const colors = {
  // Hintergründe
  bgPrimary:   '#080808',
  bgSecondary: '#0E0E0E',
  bgCard:      '#161616',
  bgElevated:  '#1E1E1E',
  bgHighest:   '#262626',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#F5F5F5',
  textMuted:     '#AAAAAA',
  textDisabled:  '#888888',
  textFaint:     '#555555',

  // Akzent
  accent:      '#4DFFED',
  accentDark:  '#00CCC0',
  accentBg:    '#0A1F1A',

  // Status
  danger:      '#FF3B30',
  dangerBg:    '#1F0A0A',
  success:     '#34C759',
  successBg:   '#0A1A0A',

  // Linien
  border:      '#262626',
  borderLight: '#1E1E1E',
} as const;

export const typography = {
  // Barlow Condensed — Headlines
  displayXL: {
    fontFamily: 'var(--font-barlow)',
    fontSize: '64px',
    lineHeight: '60px',
    fontWeight: '800',
  },
  display: {
    fontFamily: 'var(--font-barlow)',
    fontSize: '48px',
    lineHeight: '46px',
    fontWeight: '700',
  },
  h1: {
    fontFamily: 'var(--font-barlow)',
    fontSize: '36px',
    lineHeight: '34px',
    fontWeight: '700',
  },
  h2: {
    fontFamily: 'var(--font-barlow)',
    fontSize: '28px',
    lineHeight: '28px',
    fontWeight: '700',
  },
  h3: {
    fontFamily: 'var(--font-barlow)',
    fontSize: '22px',
    lineHeight: '22px',
    fontWeight: '600',
  },

  // Manrope — Body Text
  bodyLg: {
    fontFamily: 'var(--font-manrope)',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '500',
  },
  body: {
    fontFamily: 'var(--font-manrope)',
    fontSize: '14px',
    lineHeight: '21px',
    fontWeight: '400',
  },
  bodySm: {
    fontFamily: 'var(--font-manrope)',
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: '400',
  },
  label: {
    fontFamily: 'var(--font-manrope)',
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },

  // Courier Prime / Mono — Zahlen & Stats
  monoLg: {
    fontFamily: 'var(--font-courier)',
    fontSize: '24px',
    lineHeight: '28px',
    fontWeight: '700',
  },
  mono: {
    fontFamily: 'var(--font-courier)',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '700',
  },
  monoSm: {
    fontFamily: 'var(--font-courier)',
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: '400',
  },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '20px',
  '2xl': '28px',
  full: '9999px',
} as const;

// Mobile viewport width (wie native App)
export const APP_MAX_WIDTH = 430;

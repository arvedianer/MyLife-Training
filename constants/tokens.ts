// Design Tokens — MY LIFE Training App (Web)
// Alle Styles müssen diese Tokens verwenden. Niemals Farben oder Abstände hardcoden.

export const colors = {
  // Hintergründe — fast schwarz, klare Hierarchie
  bgPrimary:   '#080808', // App-Hintergrund (fast schwarz)
  bgSecondary: '#111111', // Section-Hintergründe
  bgCard:      '#141414', // Cards
  bgElevated:  '#1C1C1C', // Modals, Popovers
  bgHighest:   '#242424', // Inputs, Tags, Hover-States

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#EBEBEB',
  textMuted:     '#8E8E93',
  textDisabled:  '#636366',
  textFaint:     '#48484A',

  // Akzent — Cyan (NUR für CTAs, aktive States, FAB)
  accent:    '#3DFFE6',
  accentDark:'#00CCC0',
  accentBg:  'rgba(61, 255, 230, 0.10)',

  // PR / Stats — Purple
  prColor:   '#BF6FFF',
  prColorBg: 'rgba(191, 111, 255, 0.12)',

  // Gewicht / Volumen — Blue
  volumeColor:   '#4A9EFF',
  volumeColorBg: 'rgba(74, 158, 255, 0.12)',

  // Status
  danger:     '#FF453A',
  dangerBg:   'rgba(255, 69, 58, 0.12)',
  success:    '#30D158', // Streak, aktiv, grün
  successBg:  'rgba(48, 209, 88, 0.12)',

  // Warning / Kraft
  warning:    '#FF6B35',
  warningBg:  'rgba(255, 107, 53, 0.12)',

  // Borders — Glassmorphism style
  border:      'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderGlass: 'rgba(255, 255, 255, 0.10)',

  // Shadows (Titan Pro signature depth)
  shadowCard:      'var(--shadow-card, 0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.5))',
  shadowCardHover: 'var(--shadow-card-hover, 0 0 0 1px rgba(255,255,255,0.09), 0 8px 32px rgba(0,0,0,0.6))',
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
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const;

// Mobile viewport width (wie native App)
export const APP_MAX_WIDTH = 430;

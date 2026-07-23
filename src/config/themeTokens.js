export const themeTokens = {
  colors: {
    ink: '#0B1538',
    cream: '#F5F7FB',
    line: '#DCE4F2',
    accent: {
      500: '#FF9500',
    },
    night: {
      950: '#071020',
      900: '#0B1730',
      800: '#101D38',
      700: '#263654',
      200: '#AAB6D0',
      50: '#F7F9FF',
    },
    brand: {
      50: '#F5F8FF',
      100: '#EAF2FF',
      500: '#146CFF',
      600: '#0B45D8',
      700: '#071B5C',
      900: '#071B5C',
    },
  },
  shadows: {
    soft: '0 14px 40px var(--brand-shadow)',
  },
};

export const brandColors = {
  primaryDark: themeTokens.colors.brand[700],
  primary: themeTokens.colors.brand[600],
  primaryHover: themeTokens.colors.brand[500],
  accent: themeTokens.colors.accent[500],
};
